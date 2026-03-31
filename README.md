# AIPanel

Agent-first bookmarks and lightweight ops panel, backed by Feishu Bitable.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/simmzl/AIPanel)

[中文说明](./README.zh-CN.md)

AIPanel is built around a simple idea: **agents and humans should be able to operate the same structured data source**.
The browser is the human surface.
Feishu Bitable is the source of truth.
OpenClaw is the optional agent/operator layer.

## Why AIPanel

Most bookmark dashboards are UI-first. AIPanel is different:

- **Agent-first data model**: the same bookmark dataset can be queried and edited by an AI agent or by a person in the browser
- **Shared source of truth**: Feishu Bitable stores the canonical records, categories, and ordering
- **Practical human UI**: the web UI is intentionally lightweight, fast, and useful for browsing, cleanup, and maintenance
- **Natural-language operations**: the OpenClaw integration can add, edit, delete, reorder, and audit panel records
- **Small deployment surface**: one Vercel project + one Feishu app + one Bitable table is enough for the current architecture

## What’s included

AIPanel currently includes:

- password-protected web panel
- bookmark browsing and search
- pinned and recent items
- category tabs and drag-based category reordering
- create / edit / delete bookmark flows
- metadata fetching from target URLs
- Feishu Bitable-backed API layer
- OpenClaw skill for agent operations against the same dataset
- deployment and setup docs for Vercel + Feishu + OpenClaw

## Project status

**Support level:** experimental  
**License:** MIT  
**Deployment target:** Vercel + Feishu Bitable

What works today:

- the panel runs as a real deployed product
- Feishu Bitable is the canonical data source
- OpenClaw integration is available
- clean-clone install / build / render / install flows have been verified

What is still evolving:

- demo GIF/video assets
- broader skill generalization beyond the current AIPanel schema
- some release-policy cleanup around historical project context

## Tech stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS

### Backend / API

- Vercel serverless functions
- JSON Web Token auth
- Feishu Open Platform APIs
- Cheerio for metadata extraction

### Data + agent layer

- Feishu Bitable as source of truth
- OpenClaw skill for natural-language bookmark operations

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Create local env file

```bash
cp .env.example .env.local
```

Fill in the required values:

- `APP_NAME`
- `ACCESS_PASSWORD`
- `JWT_SECRET`
- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`
- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`
- `FEISHU_BITABLE_SOURCE_URL`

### 3. Run locally

```bash
npm run dev
```

### 4. Build for verification

```bash
npm run build
```

## Deploy

The fastest path is the **Deploy with Vercel** button above.

Recommended deployment flow:

1. create a Feishu app
2. prepare the Bitable table and permissions
3. configure env vars in Vercel
4. deploy the web app
5. optionally install the OpenClaw skill for agent-side operations

Detailed guides:

- [Vercel deployment](docs/deploy/vercel.md)
- [Feishu app + Bitable setup](docs/datasource/feishu-bitable.md)
- [OpenClaw integration](docs/integrations/openclaw.md)
- [Troubleshooting](docs/troubleshooting.md)

## Documentation map

Start here:

- [Docs index](docs/README.md)
- [Architecture overview](docs/architecture.md)
- [Deploy to Vercel](docs/deploy/vercel.md)
- [Feishu Bitable setup](docs/datasource/feishu-bitable.md)
- [OpenClaw integration](docs/integrations/openclaw.md)
- [Troubleshooting](docs/troubleshooting.md)

Deeper project notes:

- [Open-source readiness checklist](docs/product/open-source-readiness-checklist.md)
- [Roadmap](docs/product/roadmap.md)
- [Release notes template](docs/product/release-notes-template.md)

## OpenClaw integration

AIPanel ships with an OpenClaw skill template and a rendered distribution copy.

Packaging model:

- edit `integrations/openclaw-skill/`
- treat `skills/aipanel-feishu-bitable/` as the rendered distribution folder
- install via `integrations/install-scripts/install-openclaw-skill.sh`

Optional local render step:

```bash
node scripts/render-openclaw-skill.mjs
```

## Environment naming

Use these canonical env names in new setup:

- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`

The API still accepts these older aliases for compatibility:

- `FEISHU_APP_TOKEN` → `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_TABLE_ID` → `FEISHU_BITABLE_TABLE_ID`

Public docs and new deployments should use only the canonical `FEISHU_BITABLE_*` names.

## Local maintenance note

If you need an internal write-smoke-test against the configured Feishu Bitable, use:

```bash
node scripts/debug/feishu-write.mjs
```

## Summary

AIPanel is a compact, practical starting point for teams who want a shared Feishu Bitable dataset operated by both humans and agents through a web UI and OpenClaw.
