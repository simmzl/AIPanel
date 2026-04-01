# AIPanel

Agent-first bookmarks and lightweight ops panel, backed by Feishu Bitable.

[中文说明](./README.zh-CN.md)

AIPanel is built around a simple idea: **agents and humans should be able to operate the same structured data source**.
The browser is the human surface.
Feishu Bitable is the source of truth.
OpenClaw is the default installer/operator layer, while Claude Code, Cursor, and similar AI coding agents can also drive the same workflow when pointed at this repo and skill layout.

## Preview

| Desktop | Mobile |
| --- | --- |
| ![AIPanel desktop home](docs/assets/screenshots/desktop-home.png) | ![AIPanel mobile home](docs/assets/screenshots/mobile-home.png) |

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

AIPanel now includes a one-command installer path that can be driven by OpenClaw, Claude Code, Cursor, or similar repo-aware AI coding agents.

Recommended flow:

1. install the AIPanel installer skill locally
   - clone this repo locally
   - install the skill into your agent skill directory:

   ```bash
   git clone https://github.com/simmzl/AIPanel.git
   cd AIPanel
   bash integrations/install-scripts/install-openclaw-installer-skill.sh
   ```

   default target path:

   ```bash
   ~/.openclaw/skills/aipanel-installer
   ```

   if your AI agent uses a different skill directory, copy the rendered skill from:

   ```bash
   skills/aipanel-installer/
   ```

2. make sure Feishu / Lark and Vercel capabilities are already authorized
   - install and authorize the Feishu CLI when needed: <https://github.com/larksuite/cli>
   - make sure your Vercel CLI or deployment capability is already logged in
3. tell your agent to start the install flow
   - OpenClaw example: `开始创建 AIPanel`
   - for Claude Code / Cursor / similar agents, point them at this repo and ask them to continue the installer flow from `scripts/installer/cli.mjs continue`
4. provide only the final required inputs when asked:
   - `ACCESS_PASSWORD`
   - the `FEISHU_APP_SECRET` matching the auto-detected `FEISHU_APP_ID`
5. let the installer continue the rest of the flow:
   - preflight
   - Feishu Bitable creation
   - env assembly
   - Vercel deployment
   - final verify

If you prefer the manual path, the web app still supports direct Vercel deployment and explicit env configuration.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/simmzl/AIPanel)

Canonical envs:

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

- [One-command installer plan](docs/product/aipanel-one-command-installer-plan.md)
- [Vercel deployment](docs/deploy/vercel.md)
- [Feishu app + Bitable setup](docs/datasource/feishu-bitable.md)
- [Troubleshooting](docs/troubleshooting.md)

## OpenClaw integration

**You can use AIPanel without OpenClaw.**
OpenClaw is the default agent integration documented in this repo, but the same installer flow can also be driven by Claude Code, Cursor, and similar AI coding agents.

AIPanel now ships with two OpenClaw skills:

- `aipanel-installer` — start, continue, recover, and verify AIPanel installation
- `aipanel-feishu-bitable` — operate the Feishu Bitable data source after deployment

Install both locally from the repo root:

```bash
bash integrations/install-scripts/install-openclaw-installer-skill.sh
bash integrations/install-scripts/install-openclaw-skill.sh
```

Optional render steps:

```bash
node scripts/render-openclaw-installer-skill.mjs
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
