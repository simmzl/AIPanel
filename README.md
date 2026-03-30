# AIPanel

Agent-first panel backed by a shared Feishu Bitable data source.

AIPanel lets **AI agents** read and write the same data source with natural language, while **humans** use a visual web UI to browse, organize, and maintain that data.

## Current private-alpha scope

This repo is the **private-alpha delivery branch** for AIPanel.

Current scope is intentionally practical:

- one shared Feishu Bitable as the source of truth
- one web UI for browsing and maintenance
- one project-specific OpenClaw skill for agent operations against that same data
- environment-driven deployment with minimal local setup

The repo is now in a good private-alpha state, but it is **not yet the final public/open-source packaging**.

## Runtime environment

Set these variables for a working deployment:

- `APP_NAME`
- `ACCESS_PASSWORD`
- `JWT_SECRET`
- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`
- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`
- `FEISHU_BITABLE_SOURCE_URL`

### Temporary legacy compatibility

For private-alpha deployment safety, the API still accepts these legacy variable names:

- `FEISHU_APP_TOKEN` → `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_TABLE_ID` → `FEISHU_BITABLE_TABLE_ID`

Prefer the new `FEISHU_BITABLE_*` names everywhere going forward. The legacy names are only a temporary compatibility bridge so older local/Vercel notes do not break immediately.

The backend fails loudly when the required Feishu variables are missing. The footer data-source link is driven by `FEISHU_BITABLE_SOURCE_URL`.

## Local development

```bash
npm install
cp .env.example .env.local
npm run build
npm run dev
```

`npm run build` now cleans generated build output and TypeScript build-info files before compiling, which keeps the private-alpha repo cleaner between local runs.

## OpenClaw integration

Canonical OpenClaw skill source lives in `integrations/openclaw-skill/`.

Install it locally with:

```bash
bash integrations/install-scripts/install-openclaw-skill.sh
```

That installer copies the skill into `~/.openclaw/skills/aipanel-feishu-bitable` and removes the old `homepanel-feishu-bitable` target if it still exists.

## Deployment notes

See:

- `docs/deploy/vercel.md`
- `docs/datasource/feishu-bitable.md`
- `docs/integrations/openclaw.md`
- `docs/product/private-alpha-execution-plan.md`

## Private-alpha note

The current OpenClaw skill is intentionally project-specific: it contains fixed identifiers for the private-alpha AIPanel data source. That is acceptable for the current stage, but if the repo is later prepared for broader public reuse, the next step should be splitting the skill into a generic template plus a project-configured variant.
