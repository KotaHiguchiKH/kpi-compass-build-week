import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePayload, buildAiBrief } from '../server.mjs';

const csv = `month,channel,leads,meetings,proposals,wins,revenue
2026-05,Referral,40,18,12,6,720000
2026-05,Ads,120,18,10,2,180000
2026-06,Referral,50,24,16,8,1040000
2026-06,Ads,100,20,11,3,300000`;

test('analyzePayload returns a report and evidence-bounded demo brief without credentials', async () => {
  const result = await analyzePayload({ csv, projectName: 'Test team' }, { apiKey: '' });
  assert.equal(result.report.currentMonth, '2026-06');
  assert.equal(result.report.current.revenue, 1340000);
  assert.equal(result.ai.mode, 'demo');
  assert.match(result.ai.bottleneck, /Ads/);
  assert.match(result.ai.watchout, /uploaded rows/);
});

test('live GPT-5.6 mode sends the required model and parses structured output', async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return { ok: true, status: 200, json: async () => ({ output_text: JSON.stringify({ bottleneck: 'Ads bottleneck', evidence: 'Ads win rate is 3%', experiment: 'Audit 10 Ads opportunities.', watchout: 'Correlation is not causation.' }) }) };
  };
  const result = await buildAiBrief({ currentMonth: '2026-06', previousMonth: '2026-05', current: {}, previous: {}, channels: [], leadToMeeting: 0.2 }, { apiKey: 'test-key', fetchImpl });
  assert.equal(request.url, 'https://api.openai.com/v1/responses');
  assert.equal(JSON.parse(request.options.body).model, 'gpt-5.6');
  assert.equal(result.mode, 'live');
  assert.equal(result.model, 'gpt-5.6');
});
