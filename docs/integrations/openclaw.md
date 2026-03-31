# OpenClaw integration

AIPanel includes an OpenClaw skill so an agent can operate the same Feishu Bitable data that the web UI reads and writes.

This is one of the core ideas behind the project:

- humans use the panel UI
- agents use natural language plus the skill
- both touch the same structured source of truth

## Current location

Canonical editable source:

- `integrations/openclaw-skill/`

Rendered mirror / distribution copy:

- `skills/aipanel-feishu-bitable/`

Convenience installer:

- `integrations/install-scripts/install-openclaw-skill.sh`

Recommended interpretation:

- `integrations/openclaw-skill/` is the editable source of truth
- `skills/aipanel-feishu-bitable/` is rendered from that template for local browsing and packaging
- contributors should not manually edit both copies

## What the skill can do

The current AIPanel skill can help an agent:

- list categories
- count bookmarks by category
- list bookmarks in one category
- find records by title or keyword
- add bookmarks
- edit bookmarks
- delete bookmarks
- create categories
- reorder categories
- reorder bookmarks inside a category
- inspect placeholder rows and incomplete records

Examples:

- “列出 AIPanel 现在所有分类”
- “给 AI 工作流 加一个 OpenRouter”
- “把 ChatGPT 挪到 效率工具 第一位”
- “找出所有占位记录”

## Install the skill

### Fast local install

From the repo root:

```bash
bash integrations/install-scripts/install-openclaw-skill.sh
```

This renders and installs the skill into:

- `~/.openclaw/skills/aipanel-feishu-bitable`

The installer fills template placeholders from these env vars if present:

- `AIPANEL_SKILL_APP_TOKEN` or `FEISHU_BITABLE_APP_TOKEN`
- `AIPANEL_SKILL_TABLE_ID` or `FEISHU_BITABLE_TABLE_ID`
- `AIPANEL_SKILL_SOURCE_URL` or `FEISHU_BITABLE_SOURCE_URL`

It also removes the old legacy install target if present:

- `~/.openclaw/skills/homepanel-feishu-bitable`

### Manual render + install

You can also render the mirror yourself:

```bash
node scripts/render-openclaw-skill.mjs
```

Then copy:

- source: `skills/aipanel-feishu-bitable/`
- target: `~/.openclaw/skills/aipanel-feishu-bitable`

## Why this matters for AIPanel

Without the skill, AIPanel is mostly a small web panel on top of a Bitable.

With the skill:

- the panel becomes the human control surface
- the Bitable becomes the shared operational data model
- the agent becomes a real operator, not just a read-only observer

## Current scope

The current skill follows the AIPanel field names, ordering model, and placeholder-row behavior.
That makes it straightforward to install and useful immediately, even though it is not a generic schema-mapping layer.

## Packaging model

For the current release, the packaging model is:

- `integrations/openclaw-skill/` is the canonical editable template
- `skills/aipanel-feishu-bitable/` is the rendered distribution folder
- `integrations/install-scripts/install-openclaw-skill.sh` is the default install path for operators
- if a `.skill` artifact is later published, it should be built from the rendered distribution folder rather than the raw template

## Compatibility note

For the current release, the supported path is the in-repo install-script + rendered-skill workflow documented here.

See also:

- [OpenClaw compatibility note](./openclaw-compatibility.md)

## Related docs

- [Feishu app + Bitable setup](../datasource/feishu-bitable.md)
- [Open-source readiness checklist](../product/open-source-readiness-checklist.md)
- `integrations/openclaw-skill/SKILL.md`
