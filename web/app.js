const sampleCsv = `month,channel,leads,meetings,proposals,wins,revenue
2026-05,Referral,40,18,12,6,720000
2026-05,Content,80,20,12,4,360000
2026-05,Ads,120,18,10,2,180000
2026-05,Partners,30,12,8,3,330000
2026-06,Referral,50,24,16,8,1040000
2026-06,Content,110,32,20,7,700000
2026-06,Ads,100,20,11,3,300000
2026-06,Partners,40,17,10,4,480000`;

const csvInput = document.querySelector('#csv-input');
const projectName = document.querySelector('#project-name');
const analyzeButton = document.querySelector('#analyze-button');
const sampleButton = document.querySelector('#sample-button');
const copyButton = document.querySelector('#copy-button');
const modePill = document.querySelector('#mode-pill');
const emptyState = document.querySelector('#empty-state');
const results = document.querySelector('#results');
const errorState = document.querySelector('#error-state');

csvInput.value = sampleCsv;

const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value);
const pct = value => `${(value * 100).toFixed(1)}%`;
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

function metric(label, value, note) {
  return `<article class="metric"><div class="metric-label">${label}</div><div class="metric-value">${value}</div><div class="metric-note">${note}</div></article>`;
}

function render(payload) {
  const { report, ai } = payload;
  const current = report.current;
  document.querySelector('#metric-grid').innerHTML = [
    metric('Revenue', money(current.revenue), `vs. ${money(report.previous.revenue)}`),
    metric('Wins', `${current.wins}`, `${report.currentMonth}`),
    metric('Lead → meeting', pct(report.leadToMeeting), `${current.meetings} meetings`),
    metric('Avg. deal', money(report.averageDeal), 'per win')
  ].join('');
  const weakest = [...report.channels].sort((a, b) => a.meetingToWin - b.meetingToWin)[0];
  const growth = report.revenueGrowth === null ? 'no prior comparison' : `${pct(report.revenueGrowth)} month over month`;
  document.querySelector('#signal-title').textContent = `${weakest.channel} is the first place to look.`;
  document.querySelector('#signal-copy').textContent = `Revenue is ${growth}, but ${weakest.channel} converts meetings to wins at ${pct(weakest.meetingToWin)}. Test the conversion bottleneck before buying more traffic.`;
  document.querySelector('#period-note').textContent = `${report.previousMonth} → ${report.currentMonth}`;
  document.querySelector('#channel-rows').innerHTML = report.channels.map(row => `<tr><td>${escapeHtml(row.channel)}</td><td>${row.leads}</td><td>${row.wins}</td><td>${money(row.revenue)}</td><td>${pct(row.meetingToWin)}</td></tr>`).join('');
  document.querySelector('#ai-bottleneck').textContent = ai.bottleneck;
  document.querySelector('#ai-evidence').textContent = ai.evidence;
  document.querySelector('#ai-experiment').textContent = ai.experiment;
  document.querySelector('#ai-watchout').textContent = ai.watchout;
  document.querySelector('#ai-model').textContent = ai.mode === 'live' ? 'LIVE GPT-5.6' : 'DEMO MODE';
  modePill.textContent = ai.mode === 'live' ? 'GPT-5.6 LIVE' : 'LOCAL DEMO';
  modePill.style.color = ai.mode === 'live' ? '#11130f' : '#8ce4c5';
  modePill.style.background = ai.mode === 'live' ? '#c5f36b' : '#2f3930';
  emptyState.classList.add('hidden');
  errorState.classList.add('hidden');
  results.classList.remove('hidden');
}

function showError(error) {
  results.classList.add('hidden');
  emptyState.classList.add('hidden');
  errorState.textContent = error instanceof Error ? error.message : String(error);
  errorState.classList.remove('hidden');
  modePill.textContent = 'CHECK INPUT';
}

async function analyze() {
  analyzeButton.disabled = true;
  analyzeButton.textContent = 'Analyzing…';
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ csv: csvInput.value, projectName: projectName.value })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Analysis failed.');
    render(payload);
  } catch (error) {
    showError(error);
  } finally {
    analyzeButton.disabled = false;
    analyzeButton.textContent = 'Analyze →';
  }
}

sampleButton.addEventListener('click', () => { csvInput.value = sampleCsv; csvInput.focus(); });
analyzeButton.addEventListener('click', analyze);
csvInput.addEventListener('keydown', event => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') analyze(); });
copyButton.addEventListener('click', async () => {
  const text = [
    `KPI Compass — ${projectName.value}`,
    document.querySelector('#signal-title').textContent,
    document.querySelector('#signal-copy').textContent,
    `Bottleneck: ${document.querySelector('#ai-bottleneck').textContent}`,
    `Evidence: ${document.querySelector('#ai-evidence').textContent}`,
    `Next experiment: ${document.querySelector('#ai-experiment').textContent}`,
    `Watchout: ${document.querySelector('#ai-watchout').textContent}`
  ].join('\n');
  try {
    await navigator.clipboard.writeText(text);
    document.querySelector('#copy-status').textContent = 'Copied';
    setTimeout(() => { document.querySelector('#copy-status').textContent = ''; }, 1800);
  } catch {
    document.querySelector('#copy-status').textContent = 'Copy unavailable';
  }
});

analyze();
