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

## Screenshots and demo asset plan

Recommended folder structure for the first public release pass:

- `docs/assets/screenshots/desktop-home.png`
- `docs/assets/screenshots/mobile-home.png`
- `docs/assets/demo/add-bookmark.gif`
- `docs/assets/diagrams/aipanel-architecture.png`

These files do not need to be perfect studio assets.
They just need to make the release checklist executable.

## Lightweight capture checklist

### Desktop screenshot

Capture:

- login-success state or home screen
- category tabs visible
- bookmark card grid visible
- footer/source link area if present

### Mobile screenshot

Capture:

- one narrow-width browsing view
- category navigation and readability
- at least one populated category

### Demo GIF / recording

Prefer one short flow:

- add bookmark
- edit bookmark
- reorder category
- or show agent + UI sharing the same data source

Keep it under 30 seconds.

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
