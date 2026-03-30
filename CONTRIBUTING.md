# Contributing to AIPanel

Thanks for taking a look.

AIPanel is currently in an **experimental early-release** stage, so contributions are welcome in a pragmatic, low-drama way, but the repo is not fully productized for broad external collaboration yet.

## Current contribution posture

Right now, the most useful contributions are:

- bug reports with reproduction steps
- docs fixes and clarity improvements
- small, reviewable cleanup PRs
- deployment validation notes
- public-release prep work that reduces project-specific coupling

Please avoid large unsolicited rewrites during this phase.

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

AIPanel is in an early public-release hardening phase, not a giant architecture rewrite phase.

Please prefer:

- small PRs
- explicit docs updates
- minimal surprise changes
- preserving current self-hosted usability for existing operators

### Respect current product boundaries

For now, the repo still contains:

- some transition-oriented docs
- a project-specific OpenClaw skill
- temporary compatibility aliases for older env names

Those are being cleaned up gradually. Do not remove them casually without replacing the operational value they currently provide.

### Environment naming

Use canonical env names in new code and docs:

- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`

Do not introduce new references to legacy aliases except where transitional compatibility is explicitly being documented.

### Secrets and identifiers

Never commit:

- real credentials
- personal access tokens
- private cookies
- webhook secrets
- tenant secrets
- local machine-specific paths in user-facing docs unless clearly marked as examples

If you spot a potentially sensitive identifier or fixed production-style value, document it in the PR and treat it as release-prep work.

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

## Scope notes for early contributors

The following areas are especially useful right now:

- deployment and setup docs
- public-safe packaging cleanup
- repo hygiene
- UI polish with low regression risk
- integration packaging clarification

The following areas should generally start with discussion first:

- major data-model changes
- replacing Feishu Bitable as the main source of truth
- large structural repo moves
- major auth model rewrites

## License note

AIPanel is released under the MIT license.
See `LICENSE` for the full text.

## Be practical

If you want to help, the best move is usually to make the repo easier for the next stranger to understand, install, and trust.
erify.
