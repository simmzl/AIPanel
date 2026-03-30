# AIPanel

Agent-first bookmarks and lightweight ops panel, backed by Feishu Bitable.

AIPanel is built around a simple idea: **agents should be able to operate the same structured data that humans see in the UI**. The web app is the human surface. The real center of the product is the shared data source and the agent workflows around it.

Today, AIPanel is in **private alpha / pre-open-source** stage. The repo is already usable for internal deployment, but it is **not yet packaged as a polished general-purpose public product**.

## Why AIPanel

Most bookmark dashboards are UI-first. AIPanel is different:

- **Agent-first data model**: the same bookmark dataset can be queried and edited by an AI agent or by a person in the browser
- **Human UI second**: the web UI is intentionally lightweight, fast, and practical for browsing, cleanup, and maintenance
- **One source of truth**: Feishu Bitable stores the canonical records, categories, and ordering
- **Natural-language operations**: the current OpenClaw integration can add, edit, delete, reorder, and audit panel records
- **Low-friction deployment**: one Vercel project + one Feishu app + one Bitable table is enough for the current architecture

## Current product scope

The current AIPanel private-alpha build includes:

- password-protected web panel
- bookmark browsing and search
- pinned and recent items
- category tabs and drag-based category reordering
- create / edit / delete bookmark flows
- metadata fetching from target URLs
- Feishu Bitable-backed API layer
- project-specific OpenClaw skill for agent operations against the same dataset

This is intentionally a **focused v1 architecture**, not a broad platform yet.

## Project status

**Stage:** private alpha  
**Open-source status:** preparation in progress  
**Architecture status:** stable enough for controlled use, not yet fully generalized for public reuse

What is already true:

- the panel works as a real deployed product
- env naming has been cleaned up for AIPanel
- Feishu Bitable is the canonical data source
- OpenClaw integration exists and is useful today

What is not finished yet:

- public-safe repo review and secrets audit
- contribution docs and issue templates
- license decision
- screenshots / GIFs / deploy button polish
- generalized skill packaging for non-project-specific reuse

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

The build script cleans local generated output first so the repo stays tidy between runs.

## Deployment summary

The current intended deployment path is:

1. create a Feishu app
2. prepare the Bitable table and permissions
3. configure env vars in Vercel
4. deploy the web app
5. optionally install the OpenClaw skill for agent-side operations

Detailed guides:

- [Vercel deployment](docs/deploy/vercel.md)
- [Feishu app + Bitable setup](docs/datasource/feishu-bitable.md)
- [OpenClaw integration](docs/integrations/openclaw.md)

## Documentation map

### Product and release docs

- [Open-source readiness checklist](docs/product/open-source-readiness-checklist.md)
- [Public release audit (first pass)](docs/product/public-release-audit.md)
- [Roadmap](docs/product/roadmap.md)
- [Private-alpha execution plan](docs/product/private-alpha-execution-plan.md)

### Setup and integrations

- [Deploy to Vercel](docs/deploy/vercel.md)
- [Feishu Bitable setup](docs/datasource/feishu-bitable.md)
- [OpenClaw integration](docs/integrations/openclaw.md)

## OpenClaw integration

AIPanel currently ships with a **project-specific** OpenClaw skill.

Canonical source:

- `integrations/openclaw-skill/`

Convenience installer:

```bash
bash integrations/install-scripts/install-openclaw-skill.sh
```

That installer copies the skill to:

- `~/.openclaw/skills/aipanel-feishu-bitable`

This is good enough for private alpha, but not yet the final public packaging shape. The likely public direction is:

- a reusable generic Feishu-Bitable skill/template
- plus an AIPanel-specific configured variant

## Environment naming note

Use the canonical env names below in all new setup:

- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`

The API still accepts these temporary legacy aliases for private-alpha compatibility:

- `FEISHU_APP_TOKEN` → `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_TABLE_ID` → `FEISHU_BITABLE_TABLE_ID`

Do not rely on those aliases in future public docs.

## What a future public release should look like

A credible first public release should include:

- cleaned env and secrets story
- stable install docs
- screenshots / demo GIFs
- deploy button or one-click template
- contribution docs
- issue templates
- clear license
- more generic skill packaging

That work is now documented, but not fully completed yet.

## Honest note

If you are looking for a fully productized public open-source dashboard today, AIPanel is **not there yet**.

If you want a practical, already-working **agent-first panel architecture** with Feishu Bitable + web UI + OpenClaw integration, this repo is already a strong starting point.

The repo now has baseline open-source contribution scaffolding (`LICENSE` status file, `CONTRIBUTING.md`, issue templates, PR template), but it still needs a final license choice, git-history audit, and public-safe cleanup of debug/project-specific integration details before a credible first public release.
