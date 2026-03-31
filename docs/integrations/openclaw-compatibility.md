# OpenClaw compatibility note

This is a lightweight compatibility note for the current AIPanel OpenClaw integration.

It is intentionally conservative.

## Supported posture today

The current in-repo OpenClaw integration is designed for:

- self-hosted/operator-led use
- the current AIPanel data model
- Feishu Bitable as the shared source of truth
- install from the rendered in-repo skill distribution

## Current expected install path

- canonical editable template: `integrations/openclaw-skill/`
- rendered distribution folder: `skills/aipanel-feishu-bitable/`
- installer: `integrations/install-scripts/install-openclaw-skill.sh`
- default installed target: `~/.openclaw/skills/aipanel-feishu-bitable`

## What should match between web app and skill

The web app and the OpenClaw skill should point at the same:

- Feishu Bitable app token
- table ID
- source URL

If they do not, the agent and the UI may appear to disagree because they are operating on different datasets.

## Expected capabilities

The current skill assumes OpenClaw can:

- install a local skill from the rendered folder
- call Feishu Bitable tools/APIs from the skill runtime
- operate against the current AIPanel field schema

## Known limitations

The current compatibility story is not meant to claim broad generic support across every future OpenClaw packaging model.

Today it is best understood as:

- compatible with the current install-script + rendered-skill workflow in this repo
- not yet finalized as a generic standalone public skill package

## Future direction

A later cleanup pass may separate:

1. a more generic reusable Feishu-Bitable skill/template
2. an AIPanel-specific configured preset

For the first public `v0.x` release, the simpler in-repo packaging path is the intended support surface.
