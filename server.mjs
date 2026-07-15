import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildReport, parseCsv } from './demo/report.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(root, 'web');
const port = Number(process.env.PORT || 4173);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function json(response, status, body) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  response.end(JSON.stringify(body));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (raw.length > 500_000) throw new Error('Input is larger than 500 KB.');
  return JSON.parse(raw || '{}');
}

function percent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function buildDemoBrief(report) {
  const weakest = [...report.channels].sort((a, b) => a.meetingToWin - b.meetingToWin)[0];
  const strongest = report.channels[0];
  return {
    mode: 'demo',
    model: 'GPT-5.6 demo fallback',
    bottleneck: `${weakest.channel} has the weakest meeting-to-win rate at ${percent(weakest.meetingToWin)}.`,
    evidence: [
      `${strongest.channel} leads current revenue at ${strongest.revenue.toLocaleString('en-US')} JPY.`,
      `Overall lead-to-meeting conversion is ${percent(report.leadToMeeting)}.`,
      `The current period is ${report.currentMonth}; comparison period is ${report.previousMonth}.`
    ],
    experiment: `Audit 10 ${weakest.channel} opportunities, keep the offer constant, and test one qualification or proposal change before increasing traffic.`,
    watchout: 'This brief is bounded by the uploaded rows. It does not infer customer intent, causality, or forecasted revenue.'
  };
}

function promptFor(report, projectName = 'the sales team') {
  return `You are an evidence-first operations analyst for ${projectName}.
Use only the supplied report. Do not invent causes, customer intent, forecasts, or facts.
Return JSON with exactly these string fields: bottleneck, evidence, experiment, watchout.
The evidence field must be a concise semicolon-separated list of 2-3 numeric observations.
The experiment must be a small, falsifiable next step with a sample size or time box.
Report: ${JSON.stringify(report)}`;
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === 'string') return payload.output_text;
  const chunks = [];
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === 'string') chunks.push(content.text);
    }
  }
  return chunks.join('\n').trim();
}

function parseAiJson(text) {
  const fenced = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
  const parsed = JSON.parse(fenced);
  for (const key of ['bottleneck', 'evidence', 'experiment', 'watchout']) {
    if (typeof parsed[key] !== 'string' || !parsed[key].trim()) throw new Error(`GPT-5.6 response is missing ${key}.`);
  }
  return parsed;
}

export async function buildAiBrief(report, { apiKey = process.env.OPENAI_API_KEY, fetchImpl = fetch, projectName } = {}) {
  if (!apiKey) return buildDemoBrief(report);

  const response = await fetchImpl('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-5.6',
      input: promptFor(report, projectName),
      temperature: 0.2
    })
  });
  if (!response.ok) throw new Error(`GPT-5.6 request failed with ${response.status}.`);
  const text = extractOutputText(await response.json());
  return { ...parseAiJson(text), mode: 'live', model: 'gpt-5.6' };
}

export async function analyzePayload(payload, options = {}) {
  if (typeof payload?.csv !== 'string' || !payload.csv.trim()) throw new Error('CSV input is required.');
  const report = buildReport(parseCsv(payload.csv));
  const ai = await buildAiBrief(report, { ...options, projectName: payload.projectName });
  return { report, ai };
}

async function serveStatic(request, response) {
  const requested = request.url === '/' ? '/index.html' : new URL(request.url, 'http://localhost').pathname;
  const relative = path.normalize(requested).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(webRoot, relative);
  if (!filePath.startsWith(webRoot)) return json(response, 403, { error: 'Forbidden.' });
  try {
    const data = await fs.readFile(filePath);
    response.writeHead(200, {
      'content-type': contentTypes[path.extname(filePath)] || 'application/octet-stream',
      'cache-control': 'no-store'
    });
    response.end(data);
  } catch {
    json(response, 404, { error: 'Not found.' });
  }
}

export function createServer() {
  return http.createServer(async (request, response) => {
    try {
      if (request.method === 'POST' && request.url === '/api/analyze') {
        const result = await analyzePayload(await readBody(request));
        return json(response, 200, result);
      }
      if (request.method !== 'GET') return json(response, 405, { error: 'Method not allowed.' });
      return serveStatic(request, response);
    } catch (error) {
      return json(response, 400, { error: error instanceof Error ? error.message : 'Unexpected error.' });
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createServer().listen(port, () => {
    console.log(`KPI Compass running at http://localhost:${port}`);
  });
}
