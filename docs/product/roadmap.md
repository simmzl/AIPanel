# AIPanel roadmap

This roadmap separates what is already true in the private-alpha product from what still needs to happen before a healthy public open-source release.

## 1. Private-alpha foundation

This phase is mostly done.

### Already in place

- AIPanel naming and env cleanup
- working web UI for bookmark browsing and maintenance
- password-based access control
- Feishu Bitable-backed API layer
- bookmark CRUD flows
- category ordering support
- metadata fetching for new links
- project-specific OpenClaw skill integration
- Vercel-friendly deployment shape

### Why this matters

This proves the core concept is real:

- one shared structured data source
- one practical human UI
- one agent integration path

That is enough for internal use and controlled alpha rollout.

## 2. Open-source prep phase

This is the current phase.

Focus: **productization and documentation, not large architecture rewrite**.

### Current goals

- polish README for public readers
- add a public-release readiness checklist
- improve deployment docs
- document Feishu app + Bitable setup clearly
- explain the OpenClaw integration honestly
- define the boundary between project-specific alpha code and future reusable open-source packaging
- add baseline repo contribution infrastructure
- record a first-pass public-release audit and cleanup list

### Desired outcome

A new reader should be able to understand:

- what AIPanel is
- why it is agent-first
- how it is deployed today
- what is still alpha-specific
- what would need to change for a broader public release

## 3. Public release baseline

This should be the minimum bar before the first real public release.

### Repo readiness

- complete secrets audit
- choose and add final public license
- add contribution guide
- add issue templates and PR template
- remove or justify internal-only/debug artifacts
- clarify canonical OpenClaw skill source and packaging ownership

### Product readiness

- add screenshots and short demo GIFs
- verify install docs from a clean machine
- add clearer troubleshooting notes
- improve public architecture explanation

### Integration readiness

- clarify skill packaging layout
- separate generic skill logic from project-specific configuration
- remove or parameterize fixed production-style identifiers

## 4. First public open-source release

A likely first release would still be labeled experimental.

### Recommended positioning

- `v0.x`
- experimental / early public release
- Feishu-first deployment target
- Vercel as the official initial hosting path

### What it should include

- polished README
- verified Vercel + Feishu docs
- screenshots
- contribution basics
- final public license
- clarified OpenClaw story
- removal or quarantine of debug-only write surfaces

## 5. Post-release evolution

After the repo is public, the next meaningful upgrades are probably:

### Product-level

- better onboarding
- import/export flows
- richer admin / maintenance UX
- less placeholder-driven category handling

### Platform-level

- generalized data adapters beyond the current Feishu-first setup
- reusable agent integration contracts
- more configurable schema and field mapping
- cleaner packaging between app code and skill distribution

## Suggested boundary to keep clear

### Private-alpha work

Private-alpha work is about:

- making the current AIPanel deployment useful and stable
- keeping the current team moving
- optimizing for speed and practicality

### Open-source phase work

Open-source phase work is about:

- making assumptions explicit
- removing accidental project coupling
- documenting setup well enough for strangers
- packaging the repo so external users can succeed without insider context

That means the next step is **not** a big rewrite.

The next step is a disciplined cleanup and packaging pass.

That cleanup now includes repo contribution scaffolding and a documented first-pass public-release audit, but still needs the actual public-safe code and packaging decisions implemented.
