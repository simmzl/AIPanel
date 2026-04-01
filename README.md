# AIPanel

AIPanel is a lightweight bookmark and ops panel backed by **Feishu Bitable**, designed so **humans and AI agents can operate the same structured dataset**.

[中文说明](./README.zh-CN.md)

## What it is

AIPanel combines three pieces into one practical workflow:

- **a lightweight web panel** for browsing and maintaining bookmarks
- **a Feishu Bitable-backed data model** as the canonical data source
- **an AI-driven installer / operator path** for setup and day-to-day maintenance

The browser is the human interface.
Feishu Bitable is the canonical data source.
OpenClaw is the default documented agent path.
Claude Code, Cursor, and similar repo-aware AI coding agents can also drive the same installer flow when pointed at this repository.

## Why AIPanel

Most bookmark dashboards are UI-first.
AIPanel is different:

- **Shared canonical data source** — bookmarks, categories, and ordering live in Feishu Bitable
- **Agent-first workflow** — the same dataset can be operated by a person in the browser or by an AI agent
- **Practical UI** — fast browsing, search, pinning, editing, and category maintenance without heavy admin overhead
- **Small deployment surface** — one Vercel project, one Feishu app, one Bitable table
- **AI-installable** — the repo includes an installer skill and installer CLI flow instead of relying only on a long manual setup document

## Preview

| Desktop | Mobile |
| --- | --- |
| ![AIPanel desktop home](docs/assets/screenshots/desktop-home.png) | ![AIPanel mobile home](docs/assets/screenshots/mobile-home.png) |

## Core capabilities

- password-protected web panel
- bookmark browsing and search
- pinned and recent items
- category tabs and drag-based category reordering
- create / edit / delete bookmark flows
- metadata fetching from target URLs
- Feishu Bitable-backed API layer
- agent operations against the same dataset
- one-command installer path for agent-driven setup

## How installation works

AIPanel supports two setup paths:

### 1. Recommended: AI-assisted install

Use this when you want an agent to help create the Feishu data source, assemble envs, deploy to Vercel, and guide the final setup.

### 2. Manual install

Use this when you prefer to deploy directly through Vercel and configure Feishu / envs yourself.

Both paths end in the same architecture and env model.

## Quick start: AI-assisted install

### Step 1. Clone the repo

```bash
git clone https://github.com/simmzl/AIPanel.git
cd AIPanel
```

### Step 2. Install the installer skill locally

For OpenClaw, install the skill with:

```bash
bash integrations/install-scripts/install-openclaw-installer-skill.sh
```

Default target path:

```bash
~/.openclaw/skills/aipanel-installer
```

If your AI agent uses a different local skill directory, copy the rendered installer skill from:

```bash
skills/aipanel-installer/
```

### Step 3. Make sure required capabilities are already authorized

Before asking an agent to install AIPanel, make sure:

- **Feishu / Lark access is ready**
- **Vercel deployment access is ready**

Recommended:

- install and authorize the Feishu CLI: <https://github.com/larksuite/cli>
- make sure your Vercel CLI or deployment capability is already logged in

### Step 4. Ask your agent to start the install flow

Examples:

- **OpenClaw**: `开始创建 AIPanel`
- **Claude Code / Cursor / similar agents**: ask the agent to continue the installer flow from:

```bash
node scripts/installer/cli.mjs continue
```

If the flow needs to create real Feishu or Vercel resources, the execution path becomes:

```bash
node scripts/installer/cli.mjs continue --execute
```

### Step 5. Provide only the final required inputs when asked

The installer is designed to minimize questions.

In the common case, the only user-provided inputs are:

- `ACCESS_PASSWORD`
- `FEISHU_APP_SECRET` matching the auto-detected `FEISHU_APP_ID`

### Step 6. Let the installer finish the rest

The installer flow handles:

- preflight
- Feishu Bitable creation
- env assembly
- Vercel deployment
- final verify

Related docs:

- [One-command installer plan](docs/product/aipanel-one-command-installer-plan.md)
- [Installer phase 1](docs/product/aipanel-installer-phase-1.md)
- [OpenClaw integration](docs/integrations/openclaw.md)

## Manual deploy

If you prefer the manual path, deploy the web app directly and configure the required envs yourself.

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

Manual setup docs:

- [Vercel deployment](docs/deploy/vercel.md)
- [Feishu app + Bitable setup](docs/datasource/feishu-bitable.md)
- [Troubleshooting](docs/troubleshooting.md)

## Agent integration

You can use AIPanel without OpenClaw.

OpenClaw is the default documented agent integration in this repo, but it is not the only possible one.
AIPanel’s installer and data model can also be driven by Claude Code, Cursor, and similar AI coding agents.

This repository currently ships with two agent-facing skills for OpenClaw:

- `aipanel-installer` — start, continue, recover, and verify installation
- `aipanel-feishu-bitable` — operate the deployed Feishu Bitable data source

Install both OpenClaw skills from the repo root:

```bash
bash integrations/install-scripts/install-openclaw-installer-skill.sh
bash integrations/install-scripts/install-openclaw-skill.sh
```

Optional render steps:

```bash
node scripts/render-openclaw-installer-skill.mjs
node scripts/render-openclaw-skill.mjs
```

## Architecture

![AIPanel architecture](docs/assets/diagrams/aipanel-architecture.svg)

AIPanel uses a Feishu-first architecture:

- **Vercel** hosts the web app and API
- **Feishu Bitable** is the canonical data source
- **AI agents** operate setup and data workflows when needed
- **Browser UI** is the human-facing control surface

## Repository guide

If you are new to the repo, start here:

- [Docs index](docs/README.md)
- [Architecture overview](docs/architecture.md)
- [OpenClaw integration](docs/integrations/openclaw.md)
- [Contributing](./CONTRIBUTING.md)

Operational docs:

- [Troubleshooting](docs/troubleshooting.md)
- [Open-source readiness checklist](docs/product/open-source-readiness-checklist.md)
- [Roadmap](docs/product/roadmap.md)

## Project status

**License:** MIT  
**Deployment target:** Vercel + Feishu Bitable

Current state:

- the web panel is deployable and usable as a real product
- Feishu Bitable is the canonical data source
- the OpenClaw skill path is available
- the installer skill and installer CLI flow are implemented for AI-assisted setup

## Environment naming

Use these canonical env names in setup and documentation:

- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`

Public docs and deployments should use these names consistently.

## Summary

AIPanel is a practical bookmark panel for people who want one shared Feishu-backed dataset that both humans and AI agents can operate through a lightweight web UI and an agent-driven workflow.
