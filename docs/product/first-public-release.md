# First public release plan

This document turns the current release-candidate work into a concrete first public release shape.

## Recommended release label

- `v0.x`
- experimental
- self-hostable
- Feishu-first
- Vercel-documented

## Packaging stance for the first public release

The first public release should ship the OpenClaw integration in **two repo-visible forms, but one canonical source of truth**:

### Canonical editable source

- `integrations/openclaw-skill/`

This is the only folder contributors should edit directly.

### Release/package output

- `skills/aipanel-feishu-bitable/`

This is the rendered distribution folder.
It is the folder that should be:

- installed locally into OpenClaw
- copied into `~/.openclaw/skills/`
- used as the source if a `.skill` artifact or similar packaged distribution is later produced

### Installer

- `integrations/install-scripts/install-openclaw-skill.sh`

For the first public release, the recommended operator flow is:

1. configure env values
2. run the install script
3. let the script render and install the rendered distribution copy

### Why this stance

This keeps the first release practical without overengineering:

- contributors have one editable source
- operators get one obvious install path
- packaging is explicit
- future `.skill` artifacts can be generated from the rendered folder without changing the authoring model

## What the first public release should include

### Must-have

- MIT license
- README with honest positioning
- deployment docs for Vercel
- Feishu app + Bitable setup guide
- OpenClaw integration docs
- security reporting guidance
- contribution basics
- verified build/render/install flow from a clean clone

### Strongly recommended

- desktop screenshot
- mobile screenshot
- one short demo GIF or recording
- one architecture diagram
- one release notes entry or changelog seed

## Presentation asset structure

The repo now ships an asset structure that future screenshots/demo drops can fill without renaming churn:

- `docs/assets/screenshots/`
- `docs/assets/demo/`
- `docs/assets/diagrams/`

Expected first-release filenames:

- `docs/assets/screenshots/login-screen.png`
- `docs/assets/screenshots/desktop-home.png`
- `docs/assets/screenshots/desktop-edit-bookmark.png`
- `docs/assets/screenshots/mobile-home.png`
- `docs/assets/demo/add-bookmark.gif`
- `docs/assets/demo/agent-and-ui-shared-data.gif`
- `docs/assets/diagrams/aipanel-architecture.svg`

## Concrete asset capture checklist

### 1. Login screen — `docs/assets/screenshots/login-screen.png`

Capture:

- app name visible
- password entry form visible
- clean, non-broken initial state
- no personal/private deployment details

### 2. Desktop home view — `docs/assets/screenshots/desktop-home.png`

Capture:

- a logged-in state
- category tabs visible
- bookmark card grid populated
- search or top navigation visible if present
- footer/source link area if present

### 3. Desktop edit flow — `docs/assets/screenshots/desktop-edit-bookmark.png`

Capture:

- edit modal or edit surface open
- representative bookmark metadata visible
- no secrets, tokens, or private URLs shown unless intentionally public

### 4. Mobile home view — `docs/assets/screenshots/mobile-home.png`

Capture:

- narrow-width layout
- readable category navigation
- at least one populated category
- no obviously broken spacing or overflow

### 5. Demo GIF / short recording — `docs/assets/demo/add-bookmark.gif`

Preferred flow:

- open add-bookmark flow
- paste URL
- confirm metadata fetch or manual completion
- save bookmark
- show bookmark appearing in the panel

Target:

- under 30 seconds
- readable at normal playback speed
- no zooming chaos

### 6. Optional shared-data demo — `docs/assets/demo/agent-and-ui-shared-data.gif`

Preferred flow:

- make one change in the UI or via the agent
- show the same change reflected in the shared dataset / panel

This is the best single asset if you want to communicate the product thesis quickly.

## Operator-ready capture runbook

Use this sequence for the first screenshot/demo capture pass:

1. prepare a public-safe demo dataset in Feishu Bitable
2. verify the deployed or local panel has no private URLs, tokens, or internal names visible
3. capture screenshots in the exact filenames listed above
4. keep all raw captures outside the repo; commit only the curated final assets
5. update `README.md` and `docs/README.md` to embed the real assets once available
6. if a GIF looks noisy or too large, prefer a short MP4/WebM linked from docs rather than committing a bloated asset

## Expected screenshot quality bar

For the first public experimental release, screenshots only need to be:

- current
- real
- readable
- free of private information
- roughly consistent in theme and naming

They do **not** need polished marketing treatment yet.

## Known limitations that are still acceptable for first release

- current skill is still AIPanel-shaped, not fully generic
- placeholder rows are still part of category visibility behavior
- legacy env aliases still exist for compatibility
- screenshots/demo assets may lag behind code briefly
- history cleanup decision may still be pending

## Release judgment

If the current repo state is combined with:

- SECURITY.md
- a clear packaging stance
- at least basic screenshots

then AIPanel is reasonably at an **experimental first public release candidate baseline**.
