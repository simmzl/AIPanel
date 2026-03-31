# AIPanel architecture overview

AIPanel is intentionally small.

The system is a **Feishu-first, web-plus-agent architecture**:

- **Feishu Bitable** is the canonical data store
- **Vercel** hosts the web UI and serverless API
- **OpenClaw** is an optional operator/agent layer that reads and updates the same underlying data
- **The browser UI** is the human-facing surface for browsing and maintenance

## System diagram

![AIPanel architecture](./assets/diagrams/aipanel-architecture.svg)

## High-level flow

```text
Human browser
  -> React/Vite frontend
  -> Vercel API routes
  -> Feishu Open Platform APIs
  -> Feishu Bitable

OpenClaw agent
  -> AIPanel OpenClaw skill
  -> Feishu Bitable tools / APIs
  -> Feishu Bitable
```

## Main runtime pieces

### 1. Frontend

The frontend is a Vite + React application.

Its job is to:

- render bookmark categories and cards
- authenticate via the password-based access flow
- call the deployed API routes for read/write operations
- provide lightweight maintenance UX for bookmark editing and category ordering

### 2. API layer

The API is deployed as Vercel serverless functions.

Its job is to:

- validate access
- broker reads/writes to Feishu
- fetch metadata from target URLs when users add bookmarks
- keep browser-side secrets out of the client bundle

### 3. Canonical data source

Feishu Bitable is the single source of truth for:

- bookmark records
- category assignment
- ordering metadata
- operational conventions used by the panel and the OpenClaw skill

This is the most important architectural choice in the repo.
The UI is not the database.
The agent is not the database.
**Bitable is the database.**

### 4. Agent layer

OpenClaw integration is optional but central to the product direction.

The current skill lets an agent operate the same bookmark dataset that humans see in the panel.
That means the product is not just a dashboard — it is a shared human/agent operations surface over structured data.

## Design principles

### Feishu-first

The repo is optimized for Feishu Bitable rather than for pluggable backends.
That is a deliberate product choice.

### Agent-first data model

AIPanel is designed so that agents and humans can work against the same record model.
The human UI is important, but it is intentionally not the whole story.

### Small deployment surface

The intended deployment shape is:

- one Vercel project
- one Feishu app
- one Feishu Bitable app + table
- optional OpenClaw skill install

## Trust boundaries

### Browser

The browser is untrusted for secrets.
It should only hold session/access state needed for the user experience.

### Vercel serverless functions

These functions hold the sensitive integration boundary:

- JWT secret usage
- Feishu app credentials
- Feishu Bitable access

### Feishu

Feishu controls the underlying data and permission model for the canonical dataset.

### OpenClaw skill

The OpenClaw skill is an integration layer, not the canonical business logic store.

## Current limitations

- Feishu Bitable is the only backend target
- the OpenClaw skill still follows the current AIPanel schema and ordering model
- password auth is intentionally simple for self-hosted/operator use
- some data behavior still reflects the current bookmark/category operating model

## Repo packaging note

For the OpenClaw integration, the packaging model is:

- author in `integrations/openclaw-skill/`
- render/package into `skills/aipanel-feishu-bitable/`
- install from the rendered distribution copy
