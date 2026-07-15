# KPI Compass

KPI Compass is an evidence-first operations brief for small teams. It turns one monthly sales CSV into a focused answer to three questions: what changed, where is the funnel stuck, and what small experiment should happen next?

## Why this product

Small teams often have enough data to see a problem but not enough time to turn it into a defensible next action. KPI Compass is intentionally narrow: fixed input, fixed metrics, one bottleneck, one time-boxed experiment. That makes it suitable for a fixed-scope reporting automation pilot before it becomes a vertical micro-SaaS.

## Build Week extension

The deterministic CSV report existed before Build Week. During the submission period, Codex extended it into this web product with a local server, browser UI, evidence-bounded GPT-5.6 analysis path, transparent no-credential demo mode, and automated integration tests. The extension is visible in the commit history and in `HACKATHON_SUBMISSION.md`.

## Run locally

Requirements: Node.js 20 or newer.

```powershell
npm test
npm start
```

Open `http://localhost:4173`. The sample flow works without an API key. It uses deterministic calculations and a transparent demo brief so the experience is reproducible.

## GPT-5.6 integration

The `/api/analyze` route always performs the numeric analysis locally. If `OPENAI_API_KEY` is present, the route sends the bounded report to the OpenAI Responses API with `model: "gpt-5.6"` and expects a structured evidence brief. Without a key, it uses a clearly labelled demo fallback. No customer data is stored by this demo.

```powershell
$env:OPENAI_API_KEY = "your-key"
npm start
```

The app does not claim causality or forecast revenue from a CSV. The AI brief must point to observed numbers and state its uncertainty. The live route requires an account with access to the requested model; the reproducible demo path does not require credentials.

## Hackathon track

Primary track: **Work and Productivity**.

The project is built with Codex and GPT-5.6. The submission will include a public demo video under three minutes, an English README, test instructions, a repository URL, and a Codex `/feedback` session ID from the primary build thread.

## Test data

The included sample data is synthetic. Its schema is:

`month,channel,leads,meetings,proposals,wins,revenue`

## Product and revenue path

The first commercial test is a fixed-scope KPI/report automation pilot for a small team. A successful pilot should create a repeatable input-output contract; only after two paid implementations share most of their workflow should this become a vertical SaaS.
