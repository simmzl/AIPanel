# AIPanel

Agent-first bookmarks and lightweight ops panel, backed by Feishu Bitable.

[中文说明](./README.zh-CN.md)

AIPanel is built around a simple idea: **agents and humans should be able to operate the same structured data source**.
The browser is the human surface.
Feishu Bitable is the source of truth.
OpenClaw is the optional agent/operator layer.

## Preview

| Desktop | Mobile |
| --- | --- |
| ![AIPanel desktop home](docs/assets/screenshots/desktop-home.png) | ![AIPanel mobile home](docs/assets/screenshots/mobile-home.png) |

More assets:

- [Login view](docs/assets/screenshots/login-screen.png)
- [Edit bookmark view](docs/assets/screenshots/desktop-edit-bookmark.png)
- [Architecture diagram](docs/assets/diagrams/aipanel-architecture.svg)

## Why AIPanel

Most bookmark dashboards are UI-first. AIPanel is different:

- **Agent-first data model**: the same bookmark dataset can be queried and edited by an AI agent or by a person in the browser
- **Shared source of truth**: Feishu Bitable stores the canonical records, categories, and ordering
- **Practical human UI**: the web UI is intentionally lightweight, fast, and useful for browsing, cleanup, and maintenance
- **Natural-language operations**: the OpenClaw integration can add, edit, delete, reorder, and audit panel records
- **Small deployment surface**: one Vercel project + one Feishu app + one Bitable table is enough for the current architecture

## Core capabilities

- password-protected web panel
- bookmark browsing and search
- pinned and recent items
- category tabs and drag-based category reordering
- create / edit / delete bookmark flows
- metadata fetching from target URLs
- Feishu Bitable-backed API layer
- OpenClaw skill for agent operations against the same dataset

## Architecture at a glance

![AIPanel architecture](docs/assets/diagrams/aipanel-architecture.svg)

AIPanel uses a Feishu-first architecture:

- **Vercel** hosts the web app and API
- **Feishu Bitable** is the canonical data source
- **OpenClaw** can operate the same dataset through a skill
- **Browser UI** is the human-facing control surface

## Quick deploy

Before deploying, make sure you already have:

- a Feishu app
- a Bitable table with the expected schema

The Deploy with Vercel button does **not** create the Feishu app or Bitable schema for you.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/simmzl/AIPanel)

Recommended deployment flow:

1. create a Feishu app
2. prepare the Bitable table and permissions
3. configure env vars in Vercel
4. deploy the web app
5. optionally install the OpenClaw skill for agent-side operations

Required envs:

```env
APP_NAME=AIPanel
ACCESS_PASSWORD=change-this-to-a-real-password
JWT_SECRET=change-this-to-a-long-random-secret
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=xxx
FEISHU_BITABLE_APP_TOKEN=bascn_xxx
FEISHU_BITABLE_TABLE_ID=tblxxxxxx
FEISHU_BITABLE_SOURCE_URL=https://your-domain.feishu.cn/base/xxxxxxxx?table=tblxxxxxx
```

Deployment docs:

- [Vercel deployment](docs/deploy/vercel.md)
- [Feishu app + Bitable setup](docs/datasource/feishu-bitable.md)
- [Troubleshooting](docs/troubleshooting.md)

## OpenClaw integration

**You can use AIPanel without OpenClaw.**
OpenClaw is optional and only needed if you want agent-side operations.

AIPanel ships with an OpenClaw skill template and a rendered distribution copy.

Packaging model:

- edit `integrations/openclaw-skill/`
- treat `skills/aipanel-feishu-bitable/` as the rendered distribution folder
- install via `integrations/install-scripts/install-openclaw-skill.sh`

Optional local render step:

```bash
node scripts/render-openclaw-skill.mjs
```

More details:

- [OpenClaw integration](docs/integrations/openclaw.md)
- [OpenClaw compatibility note](docs/integrations/openclaw-compatibility.md)

## For contributors

Development setup, local run instructions, and contribution guidelines live in:

- [Contributing](./CONTRIBUTING.md)

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

## Environment naming

Use these canonical env names in new setup:

- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`

Public docs and deployments should use only these names.

## Summary

AIPanel is a compact, practical starting point for teams who want a shared Feishu Bitable dataset operated by both humans and agents through a web UI and OpenClaw.
