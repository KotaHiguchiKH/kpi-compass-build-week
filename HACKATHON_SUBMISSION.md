# KPI Compass — OpenAI Build Week Submission Draft

## Category

Work and Productivity.

## One-line pitch

KPI Compass turns a sales CSV into one evidence-backed next experiment, so small teams can act before they buy more traffic or build another dashboard.

## Project description

Small teams usually do not need another dashboard; they need a defensible next step. KPI Compass accepts a familiar monthly sales export, calculates the funnel and channel signals locally, then creates a bounded operations brief: the bottleneck, the numeric evidence, a time-boxed experiment, and the uncertainty that must not be ignored. The demo works with synthetic data and the live path can call GPT-5.6 with a tightly scoped report prompt.

## Why Codex and GPT-5.6

The deterministic KPI-reporting prototype existed before Build Week. During the submission period, Codex extended it into a testable web product, kept the input/output contract explicit, and built the UI, server route, and verification tests. GPT-5.6 is used in the live analysis path to turn the computed report into a structured, evidence-bounded brief. The deterministic fallback makes the demo reproducible without credentials and does not pretend that a model response is a source of truth.

## Demo script (under 3 minutes)

1. Start KPI Compass and show the empty-to-signal workflow.
2. Load the synthetic CSV and click `Analyze`.
3. Show the four metrics and the channel table.
4. Explain why Ads is the first bottleneck to test, using the displayed win-rate evidence.
5. Show the GPT-5.6 brief: bottleneck, evidence, experiment, and watchout.
6. Copy the decision brief and explain how the fixed output can become a small-team reporting automation pilot.
7. Briefly show the repository README, tests, and where GPT-5.6 is called.

## Submission checklist

- [x] Working local project
- [x] Synthetic sample data
- [x] Automated tests
- [x] English README and setup instructions
- [x] GPT-5.6 integration path with explicit model name
- [ ] Public demo video with English voiceover
- [ ] Final public/private repository URL
- [ ] Primary Codex `/feedback` Session ID
- [ ] Final Devpost submission
