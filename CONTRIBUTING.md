# Contributing to AIPanel

Thanks for taking a look.

AIPanel is an experimental project, so the best contributions right now are the ones that make the repo easier to understand, deploy, and trust.

## What helps most right now

- bug reports with reproduction steps
- docs fixes and clarity improvements
- small, reviewable cleanup PRs
- deployment validation notes
- low-risk packaging and onboarding improvements

Please avoid large unsolicited rewrites.

## Before opening a PR

1. Read the README and relevant docs under `docs/`
2. Check whether the change fits the current roadmap
3. Prefer one focused change per PR
4. If the change affects setup, update docs in the same PR
5. If the change affects runtime behavior, run a local build first

## Development basics

### Install

```bash
npm install
```

### Local env

```bash
cp .env.example .env.local
```

Fill in the required values before running the app.

### Run locally

```bash
npm run dev
```

### Verify build

```bash
npm run build
```

## Project conventions

### Keep changes incremental

Please prefer:

- small PRs
- explicit docs updates
- minimal surprise changes
- preserving current deployability and operator usability

### Respect current product boundaries

The repo still contains a few compatibility-oriented pieces, including:

- older env aliases still accepted by the API
- an OpenClaw skill tailored to the current AIPanel schema
- some docs that describe release planning and cleanup work

Do not remove those casually without preserving the operational value they provide.

### Environment naming

Use canonical env names in new code and docs:

- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`

Do not introduce new references to the older aliases unless compatibility is the point of the change.

### Secrets and identifiers

Never commit:

- real credentials
- personal access tokens
- private cookies
- webhook secrets
- tenant secrets
- local machine-specific paths in user-facing docs unless clearly marked as examples

If you spot a potentially sensitive identifier or fixed production-style value, mention it in the PR and treat it as cleanup work.

## Pull request guidelines

A good PR here should usually include:

- a short summary of what changed
- why the change is needed
- docs updates if user-facing behavior changed
- screenshots if the UI changed materially
- verification notes (`npm run build`, manual checks, etc.)

## Issue quality bar

Useful reports include:

- what you expected
- what happened instead
- steps to reproduce
- environment details when relevant
- screenshots or logs if they help

## Areas that are especially useful right now

- deployment and setup docs
- troubleshooting docs
- repo hygiene
- UI polish with low regression risk
- integration packaging clarification

## Areas that should usually start with discussion

- major data-model changes
- replacing Feishu Bitable as the main source of truth
- large structural repo moves
- major auth model rewrites

## License note

AIPanel is released under the MIT license.
See `LICENSE` for the full text.

## Be practical

If you want to help, the best move is usually to make the repo easier for the next stranger to understand, install, and trust.
