# AIPanel Private Alpha Execution Plan

## Goal

Build AIPanel as a private, agent-first product before public open source release.

Priority order:

1. **Agent-first capability**: natural language read/write of a shared data source
2. **Human-facing UI**: visual AIPanel for browsing and maintenance
3. **Open-source readiness**: repo structure, environment-driven deployment, docs, installation flows

---

## Current status

### Already done

- Private GitHub repo created: `simmzl/AIPanel`
- Local working directory established: `/tmp/AIPanel`
- Initial docs scaffold pushed
- OpenClaw skill scaffold pushed
- Current web + API baseline imported
- Local build verified with `npm run build`
- Push pipeline stabilized via incremental migration strategy

### Not done yet

- Full AIPanel branding pass
- Runtime config/env cleanup
- Removal of owner-specific defaults and hardcoded fallbacks
- Skill/install naming consistency end-to-end
- Public-open-source-ready docs and release structure
- Data-layer extraction for future multi-agent integrations

---

## Phase 1 — Private alpha stabilization

### 1. Branding and naming

#### Tasks
- Rename visible product language from HomePanel to AIPanel
- Rename package/app-facing labels where appropriate
- Normalize skill naming to `aipanel-feishu-bitable`
- Update UI strings to reflect agent-first product framing

#### Definition of done
- No major user-facing HomePanel branding remains
- README/docs align with AIPanel product direction

---

### 2. Environment-driven runtime

#### Tasks
- Remove hardcoded fallback app token / table id from runtime helpers
- Standardize env names:
  - `FEISHU_BITABLE_APP_TOKEN`
  - `FEISHU_BITABLE_TABLE_ID`
  - `FEISHU_BITABLE_SOURCE_URL`
- Align `.env.example` with actual runtime usage
- Ensure app can fail loudly and clearly when env is missing

#### Definition of done
- Fresh deployment depends only on env, not owner defaults
- No private production IDs are embedded as fallback runtime behavior

---

### 3. Repo hygiene and structure

#### Tasks
- Remove generated JS / tsbuildinfo / local junk from tracked files
- Keep install/integration/docs directories organized
- Prepare future split toward:
  - `apps/web`
  - `packages/core`
  - `packages/feishu-bitable`
  - `integrations/openclaw-skill`
- Do not force monorepo refactor yet; preserve ability to ship

#### Definition of done
- Repo is clean enough to evolve without confusion
- Build artifacts are not tracked

---

### 4. OpenClaw integration hardening

#### Tasks
- Make install script real and stable
- Ensure skill docs match AIPanel naming and behavior
- Validate skill folder contents and install flow
- Document how OpenClaw should use the shared Feishu data source

#### Definition of done
- Skill can be installed reproducibly into OpenClaw
- Docs and examples use AIPanel naming consistently

---

### 5. Private-alpha usability baseline

#### Tasks
- Confirm local build remains green after rename/env cleanup
- Keep existing UI behavior working while refactoring names/config
- Preserve current features:
  - category creation with placeholder row
  - category reordering
  - cache-first rendering
  - agent-manageable shared data source

#### Definition of done
- Private alpha remains usable during refactor
- No regression in core panel behavior

---

## Phase 2 — Open-source preparation

### 6. Public deployment readiness

#### Tasks
- Add Vercel-friendly deployment docs
- Prepare final `.env.example`
- Add deploy button later when flow is verified
- Add datasource setup guide for Feishu app + Bitable

### 7. Public-facing docs

#### Tasks
- Rewrite README as a polished product README
- Add screenshots / usage examples / architecture notes
- Add contribution + license + issue templates later

### 8. Ecosystem direction

#### Tasks
- Clarify future layers:
  - OpenClaw skill
  - install scripts
  - possible CLI
  - possible MCP server
- Keep current repo structure compatible with that future

---

## Recommended execution order

1. Branding pass
2. Env/config cleanup
3. Repo hygiene cleanup
4. Skill/install hardening
5. Build verification
6. Docs pass
7. Future architecture notes

---

## Immediate execution checklist

- [x] Replace major HomePanel user-facing strings with AIPanel
- [x] Audit runtime env usage and remove hardcoded fallback IDs
- [x] Update `.env.example` to exactly match runtime requirements
- [x] Remove tracked generated build artifacts where present
- [x] Harden `integrations/install-scripts/install-openclaw-skill.sh`
- [x] Review skill docs for naming consistency
- [ ] Run `npm run build`
- [ ] Commit and push private-alpha refactor batch

---

## Constraints

- Keep the project shippable at every step
- Prefer incremental commits over giant rewrites
- Avoid breaking the current panel while refactoring naming/config
- Treat this repo as a private pre-open-source branch of work
