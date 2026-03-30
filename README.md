# AIPanel

Agent-first bookmarks and lightweight ops panel, backed by Feishu Bitable.

AIPanel is built around a simple idea: **agents should be able to operate the same structured data that humans see in the UI**. The web app is the human surface. The real center of the product is the shared data source and the agent workflows around it.

Today, AIPanel is in an **early experimental self-hostable** stage. The repo is already usable for real deployment, but it is **not yet packaged as a polished general-purpose public product**.

## Why AIPanel

Most bookmark dashboards are UI-first. AIPanel is different:

- **Agent-first data model**: the same bookmark dataset can be queried and edited by an AI agent or by a person in the browser
- **Human UI second**: the web UI is intentionally lightweight, fast, and practical for browsing, cleanup, and maintenance
- **One source of truth**: Feishu Bitable stores the canonical records, categories, and ordering
- **Natural-language operations**: the current OpenClaw integration can add, edit, delete, reorder, and audit panel records
- **Low-friction deployment**: one Vercel project + one Feishu app + one Bitable table is enough for the current architecture

## Current product scope

The current AIPanel build includes:

- password-protected web panel
- bookmark browsing and search
- pinned and recent items
- category tabs and drag-based category reordering
- create / edit / delete bookmark flows
- metadata fetching from target URLs
- Feishu Bitable-backed API layer
- OpenClaw skill for agent operations against the same dataset

This is intentionally a **focused v1 architecture**, not a broad platform yet.

## Project status

**Stage:** experimental / early public-release-candidate territory  
**Open-source status:** usable and now MIT-licensed, but still being polished for broader public adoption  
**Architecture status:** stable enough for controlled use, not yet fully generalized for public reuse

What is already true:

- the panel works as a real deployed product
- env naming has been cleaned up for AIPanel
- Feishu Bitable is the canonical data source
- OpenClaw integration exists and is useful today
- scratch-clone validation succeeded for install, build, skill render, and skill install flows

What is not finished yet:

- screenshots / GIFs / deploy button polish
- optional git-history cleanup for old private deployment residue
- security/reporting docs and broader release polish
- more generic skill packaging beyond the current AIPanel-shaped template

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
- [First public release candidate checklist](docs/product/release-candidate-checklist.md)
- [Roadmap](docs/product/roadmap.md)
- [Private-alpha execution plan](docs/product/private-alpha-execution-plan.md)

### Setup and integrations

- [Deploy to Vercel](docs/deploy/vercel.md)
- [Feishu Bitable setup](docs/datasource/feishu-bitable.md)
- [OpenClaw integration](docs/integrations/openclaw.md)

## OpenClaw integration

AIPanel currently ships with an **AIPanel-shaped OpenClaw skill template**.

Canonical editable source:

- `integrations/openclaw-skill/`

Rendered mirror / local package copy:

- `skills/aipanel-feishu-bitable/`

Convenience installer:

```bash
bash integrations/install-scripts/install-openclaw-skill.sh
```

Optional local render step:

```bash
node scripts/render-openclaw-skill.mjs
```

That installer renders the skill with env-backed values when available, then installs it to:

- `~/.openclaw/skills/aipanel-feishu-bitable`

This keeps the current self-hosted workflow usable while making the repo less dependent on one hardcoded private deployment.

## Environment naming note

Use the canonical env names below in all new setup:

- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`

The API still accepts these temporary legacy aliases for compatibility with older setups:

- `FEISHU_APP_TOKEN` → `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_TABLE_ID` → `FEISHU_BITABLE_TABLE_ID`

Do not rely on those aliases in future public docs.

## Debug / local maintenance note

A previous live debug write API endpoint has been removed from the deployed API surface.

If you still need an internal write-smoke-test against the configured Feishu Bitable, use the local-only script instead:

```bash
node scripts/debug/feishu-write.mjs
```

That keeps release candidates safer while preserving a practical internal debug path.

## What a future public release should look like

A credible first public release should include:

- cleaned env and secrets story
- stable install docs
- screenshots / demo GIFs
- deploy button or one-click template
- contribution docs
- issue templates
- clear license
- validated skill packaging / install story

That work is now documented, but not fully completed yet.

## Honest note

If you are looking for a fully productized public open-source dashboard today, AIPanel is **not there yet**.

If you want a practical, already-working **agent-first panel architecture** with Feishu Bitable + web UI + OpenClaw integration, this repo is already a strong starting point.

The repo now has baseline open-source contribution scaffolding (`LICENSE`, `CONTRIBUTING.md`, issue templates, PR template), a safer debug story, a clearer OpenClaw packaging boundary, a real MIT license, and a documented scratch-clone validation pass — but it still needs screenshots, security/reporting polish, and optional git-history cleanup before a stronger first public release.
