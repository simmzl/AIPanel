# AIPanel

Agent-first bookmarks and lightweight ops panel, backed by Feishu Bitable.

AIPanel is built around a simple idea: **agents and humans should be able to operate the same structured data source**.
The browser is the human surface.
Feishu Bitable is the source of truth.
OpenClaw is the optional agent/operator layer.

Today, AIPanel is an **experimental self-hostable v0.x release**: already usable in real deployment, but not yet packaged as a polished general-purpose public product.

## Why AIPanel

Most bookmark dashboards are UI-first. AIPanel is different:

- **Agent-first data model**: the same bookmark dataset can be queried and edited by an AI agent or by a person in the browser
- **Shared source of truth**: Feishu Bitable stores the canonical records, categories, and ordering
- **Practical human UI**: the web UI is intentionally lightweight, fast, and useful for browsing, cleanup, and maintenance
- **Natural-language operations**: the current OpenClaw integration can add, edit, delete, reorder, and audit panel records
- **Small deployment surface**: one Vercel project + one Feishu app + one Bitable table is enough for the current architecture

## What’s included in the current v0.x release

The current AIPanel release includes:

- password-protected web panel
- bookmark browsing and search
- pinned and recent items
- category tabs and drag-based category reordering
- create / edit / delete bookmark flows
- metadata fetching from target URLs
- Feishu Bitable-backed API layer
- OpenClaw skill for agent operations against the same dataset
- deployment and setup docs for Vercel + Feishu + OpenClaw
- release/readiness docs for the first public experimental launch

This is intentionally a **focused v1 architecture**, not a broad platform yet.

## Project status

**Stage:** experimental / early public-release-candidate territory  
**Open-source status:** usable and MIT-licensed, but still being polished for broader public adoption  
**Architecture status:** stable enough for controlled use, not yet fully generalized for public reuse

What is already true:

- the panel works as a real deployed product
- env naming has been cleaned up for AIPanel
- Feishu Bitable is the canonical data source
- OpenClaw integration exists and is useful today
- scratch-clone validation succeeded for install, build, skill render, and skill install flows

What is not finished yet:

- final screenshots / GIFs / demo assets
- optional git-history cleanup for old private deployment residue
- more generic skill packaging beyond the current AIPanel-shaped template
- optional deploy-button polish once onboarding flow is fully settled

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

Start here:

- [Docs index](docs/README.md)
- [Architecture overview](docs/architecture.md)
- [Deploy to Vercel](docs/deploy/vercel.md)
- [Feishu Bitable setup](docs/datasource/feishu-bitable.md)
- [OpenClaw integration](docs/integrations/openclaw.md)

Release/readiness docs:

- [First public release plan](docs/product/first-public-release.md)
- [First public release candidate checklist](docs/product/release-candidate-checklist.md)
- [Release announcement draft](docs/product/release-announcement-v0-experimental.md)
- [Release notes template](docs/product/release-notes-template.md)
- [Open-source readiness checklist](docs/product/open-source-readiness-checklist.md)
- [Public release audit (first pass)](docs/product/public-release-audit.md)
- [Roadmap](docs/product/roadmap.md)

## OpenClaw integration

AIPanel currently ships with an **AIPanel-shaped OpenClaw skill template**.

For the first public release, the packaging stance is:

- edit only `integrations/openclaw-skill/`
- treat `skills/aipanel-feishu-bitable/` as the rendered distribution folder
- install locally via the provided install script
- if you later package a `.skill` artifact, package the rendered folder rather than the raw template

Canonical editable source:

- `integrations/openclaw-skill/`

Rendered distribution folder / local package copy:

- `skills/aipanel-feishu-bitable/`

Convenience installer:

```bash
bash integrations/install-scripts/install-openclaw-skill.sh
```

Optional local render step:

```bash
node scripts/render-openclaw-skill.mjs
```

That installer renders the skill with env-backed values when available, then installs the rendered distribution copy to:

- `~/.openclaw/skills/aipanel-feishu-bitable`

This keeps the current self-hosted workflow usable while making the repo less dependent on one hardcoded private deployment.

## Environment naming note

Use the canonical env names below in all new setup:

- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`

For the first experimental public release, the API will **keep the legacy aliases for exactly one compatibility release window**, then remove them in the next cleanup-oriented release once public adopters have had time to migrate.

Temporary legacy aliases still accepted today:

- `FEISHU_APP_TOKEN` → `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_TABLE_ID` → `FEISHU_BITABLE_TABLE_ID`

Public docs, examples, and deploy instructions should use only the canonical `FEISHU_BITABLE_*` names.

## Debug / local maintenance note

A previous live debug write API endpoint has been removed from the deployed API surface.

If you still need an internal write-smoke-test against the configured Feishu Bitable, use the local-only script instead:

```bash
node scripts/debug/feishu-write.mjs
```

That keeps release candidates safer while preserving a practical internal debug path.

## Honest note

If you are looking for a fully productized public open-source dashboard today, AIPanel is **not there yet**.

If you want a practical, already-working **agent-first panel architecture** with Feishu Bitable + web UI + OpenClaw integration, this repo is already a strong starting point.

The repo now has baseline open-source contribution scaffolding (`LICENSE`, `CONTRIBUTING.md`, issue templates, PR template), a safer debug story, a clearer OpenClaw packaging boundary, a real MIT license, a basic `SECURITY.md`, architecture documentation, and documented release/readiness materials — but it still needs real screenshots/demo assets and an explicit git-history cleanup decision before a broader public announcement.
