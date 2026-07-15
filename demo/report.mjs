import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const requiredColumns = ['month', 'channel', 'leads', 'meetings', 'proposals', 'wins', 'revenue'];
const numericColumns = requiredColumns.slice(2);

export function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error('CSVには見出しと1行以上のデータが必要です。');
  const headers = lines[0].split(',').map(value => value.trim());
  for (const column of requiredColumns) {
    if (!headers.includes(column)) throw new Error(`必須列がありません: ${column}`);
  }

  return lines.slice(1).map((line, rowIndex) => {
    const values = line.split(',').map(value => value.trim());
    if (values.length !== headers.length) throw new Error(`${rowIndex + 2}行目の列数が不正です。`);
    const record = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
    if (!/^\d{4}-\d{2}$/.test(record.month)) throw new Error(`${rowIndex + 2}行目のmonthが不正です。`);
    if (!record.channel) throw new Error(`${rowIndex + 2}行目のchannelが空です。`);
    for (const column of numericColumns) {
      const number = Number(record[column]);
      if (!Number.isFinite(number) || number < 0) throw new Error(`${rowIndex + 2}行目の${column}が不正です。`);
      record[column] = number;
    }
    return record;
  });
}

function rate(numerator, denominator) {
  return denominator ? numerator / denominator : 0;
}

function sumRows(rows) {
  return rows.reduce((total, row) => {
    for (const column of numericColumns) total[column] += row[column];
    return total;
  }, Object.fromEntries(numericColumns.map(column => [column, 0])));
}

export function buildReport(records) {
  const months = [...new Set(records.map(record => record.month))].sort();
  if (months.length < 2) throw new Error('前月比のため2か月以上のデータが必要です。');
  const currentMonth = months.at(-1);
  const previousMonth = months.at(-2);
  const currentRows = records.filter(record => record.month === currentMonth);
  const previousRows = records.filter(record => record.month === previousMonth);
  const current = sumRows(currentRows);
  const previous = sumRows(previousRows);
  const channels = currentRows.map(row => ({
    ...row,
    leadToMeeting: rate(row.meetings, row.leads),
    meetingToWin: rate(row.wins, row.meetings),
    revenuePerLead: rate(row.revenue, row.leads)
  })).sort((a, b) => b.revenue - a.revenue);

  const revenueGrowth = previous.revenue ? current.revenue / previous.revenue - 1 : null;
  const best = channels[0];
  const weakest = [...channels].sort((a, b) => a.meetingToWin - b.meetingToWin)[0];
  const actions = [
    `${best.channel}は売上最大。流入数を増やしても成約率が維持されるか小さく検証する。`,
    `${weakest.channel}は面談→受注率が最小。案件条件と提案内容を10件だけ監査する。`,
    `全体のリード→面談率は${formatPercent(rate(current.meetings, current.leads))}。次月は流入数より面談化のボトルネックを先に測る。`
  ];

  return {
    currentMonth,
    previousMonth,
    current,
    previous,
    revenueGrowth,
    leadToMeeting: rate(current.meetings, current.leads),
    meetingToWin: rate(current.wins, current.meetings),
    averageDeal: rate(current.revenue, current.wins),
    channels,
    actions
  };
}

function formatYen(value) {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value) {
  return new Intl.NumberFormat('ja-JP', { style: 'percent', maximumFractionDigits: 1 }).format(value);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

export function renderMarkdown(report) {
  const growth = report.revenueGrowth === null ? '比較不能' : formatPercent(report.revenueGrowth);
  const rows = report.channels.map(row => `|${row.channel}|${row.leads}|${row.meetings}|${row.wins}|${formatYen(row.revenue)}|${formatPercent(row.meetingToWin)}|`).join('\n');
  return `# ${report.currentMonth} 営業KPIレポート\n\n` +
    `## サマリー\n\n- 売上: ${formatYen(report.current.revenue)}（前月比 ${growth}）\n- 受注: ${report.current.wins}件\n- リード→面談: ${formatPercent(report.leadToMeeting)}\n- 面談→受注: ${formatPercent(report.meetingToWin)}\n- 平均受注単価: ${formatYen(report.averageDeal)}\n\n` +
    `## チャネル別\n\n|チャネル|リード|面談|受注|売上|面談→受注|\n|---|---:|---:|---:|---:|---:|\n${rows}\n\n` +
    `## 次の検証\n\n${report.actions.map(action => `- ${action}`).join('\n')}\n`;
}

export function renderHtml(report) {
  const growth = report.revenueGrowth === null ? '比較不能' : formatPercent(report.revenueGrowth);
  const cards = [
    ['売上', formatYen(report.current.revenue), `前月比 ${growth}`],
    ['受注', `${report.current.wins}件`, `面談→受注 ${formatPercent(report.meetingToWin)}`],
    ['面談', `${report.current.meetings}件`, `リード→面談 ${formatPercent(report.leadToMeeting)}`],
    ['平均受注単価', formatYen(report.averageDeal), `${report.currentMonth}`]
  ].map(([label, value, note]) => `<article><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></article>`).join('');
  const rows = report.channels.map(row => `<tr><td>${escapeHtml(row.channel)}</td><td>${row.leads}</td><td>${row.meetings}</td><td>${row.wins}</td><td>${formatYen(row.revenue)}</td><td>${formatPercent(row.meetingToWin)}</td></tr>`).join('');
  const actions = report.actions.map(action => `<li>${escapeHtml(action)}</li>`).join('');

  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(report.currentMonth)} 営業KPI</title><style>
  :root{color-scheme:dark;font-family:Inter,"Noto Sans JP",sans-serif;background:#0d1220;color:#f4f6fb}body{max-width:1100px;margin:0 auto;padding:48px 24px;background:radial-gradient(circle at top right,#23315e 0,transparent 38%)}header p,small{color:#aeb9d2}h1{font-size:clamp(2rem,5vw,4rem);margin:.2em 0}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin:30px 0}article,section{background:#161e33;border:1px solid #2a385b;border-radius:18px;padding:20px}article span,article small{display:block}article strong{display:block;font-size:1.8rem;margin:10px 0;color:#83e2c4}section{margin-top:18px;overflow:auto}table{width:100%;border-collapse:collapse}th,td{text-align:right;padding:12px;border-bottom:1px solid #2a385b}th:first-child,td:first-child{text-align:left}li{margin:.7em 0;line-height:1.6}.note{font-size:.85rem;margin-top:28px;color:#8591aa}</style></head><body>
  <header><p>自動生成レポート / 合成データ</p><h1>${escapeHtml(report.currentMonth)} 営業KPI</h1></header><div class="cards">${cards}</div>
  <section><h2>チャネル別</h2><table><thead><tr><th>チャネル</th><th>リード</th><th>面談</th><th>受注</th><th>売上</th><th>面談→受注</th></tr></thead><tbody>${rows}</tbody></table></section>
  <section><h2>次に検証すること</h2><ol>${actions}</ol></section><p class="note">入力CSV、集計ロジック、出力形式を案件ごとに固定し、数値は自動テストで照合します。</p></body></html>`;
}

export async function generate(inputPath, outputDirectory) {
  const records = parseCsv(await fs.readFile(inputPath, 'utf8'));
  const report = buildReport(records);
  await fs.mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(outputDirectory, 'report.md'), renderMarkdown(report), 'utf8'),
    fs.writeFile(path.join(outputDirectory, 'report.html'), renderHtml(report), 'utf8')
  ]);
  return report;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  const root = path.dirname(currentFile);
  const inputPath = path.resolve(process.argv[2] || path.join(root, 'sample-sales.csv'));
  const outputDirectory = path.resolve(process.argv[3] || path.join(root, 'output'));
  const report = await generate(inputPath, outputDirectory);
  console.log(`PASS: ${report.currentMonth} のレポートを ${outputDirectory} に生成しました。`);
}
