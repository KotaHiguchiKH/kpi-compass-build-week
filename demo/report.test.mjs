import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildReport, generate, parseCsv } from './report.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));

test('CSVを集計し前月比を計算する', async () => {
  const records = parseCsv(await fs.readFile(path.join(root, 'sample-sales.csv'), 'utf8'));
  const report = buildReport(records);
  assert.equal(report.currentMonth, '2026-06');
  assert.equal(report.current.leads, 300);
  assert.equal(report.current.wins, 22);
  assert.equal(report.current.revenue, 2520000);
  assert.equal(report.previous.revenue, 1590000);
  assert.ok(Math.abs(report.revenueGrowth - 0.5849056603773586) < 1e-12);
  assert.equal(report.channels[0].channel, 'Referral');
});

test('不正な数値と列不足を拒否する', () => {
  assert.throws(() => parseCsv('month,channel,leads\n2026-06,Ads,1'), /必須列/);
  assert.throws(() => parseCsv('month,channel,leads,meetings,proposals,wins,revenue\n2026-06,Ads,-1,1,1,1,1'), /leadsが不正/);
});

test('MarkdownとHTMLを同じ集計から生成する', async () => {
  const output = await fs.mkdtemp(path.join(os.tmpdir(), 'kpi-demo-'));
  await generate(path.join(root, 'sample-sales.csv'), output);
  const [markdown, html] = await Promise.all([
    fs.readFile(path.join(output, 'report.md'), 'utf8'),
    fs.readFile(path.join(output, 'report.html'), 'utf8')
  ]);
  assert.match(markdown, /[¥￥]2,520,000/);
  assert.match(markdown, /Referral/);
  assert.match(html, /営業KPI/);
  assert.match(html, /合成データ/);
});
