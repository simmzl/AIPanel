# OpenClaw integration

AIPanel includes OpenClaw skills for both installer orchestration and ongoing Feishu Bitable operations.

This is one of the core ideas behind the project:

- humans use the panel UI
- agents use natural language plus the skill
- both touch the same structured source of truth

## Current location

Canonical editable sources:

- `integrations/openclaw-skill/` — data-source operation skill
- `integrations/openclaw-installer-skill/` — one-command installer skill

Rendered mirrors / distribution copies:

- `skills/aipanel-feishu-bitable/`
- `skills/aipanel-installer/`

Convenience installers:

- `integrations/install-scripts/install-openclaw-skill.sh`
- `integrations/install-scripts/install-openclaw-installer-skill.sh`

Recommended interpretation:

- `integrations/openclaw-skill/` is the editable source of truth
- `skills/aipanel-feishu-bitable/` is rendered from that template for local browsing and packaging
- contributors should not manually edit both copies

## What the skills can do

### `aipanel-installer`

The installer skill can help an agent:

- start creating AIPanel from scratch
- continue a paused installer flow
- report installer progress
- collect final user inputs for deploy
- finish deployment and report the final URL

Typical prompts:

- “开始创建 AIPanel”
- “继续 AIPanel 安装”
- “看看 AIPanel 装到哪一步了”

### `aipanel-feishu-bitable`

The data skill can help an agent:

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
bash integrations/install-scripts/install-openclaw-installer-skill.sh
```

This renders and installs the skills into:

- `~/.openclaw/skills/aipanel-feishu-bitable`
- `~/.openclaw/skills/aipanel-installer`

The installer fills template placeholders from these env vars if present:

- `AIPANEL_SKILL_APP_TOKEN` or `FEISHU_BITABLE_APP_TOKEN`
- `AIPANEL_SKILL_TABLE_ID` or `FEISHU_BITABLE_TABLE_ID`
- `AIPANEL_SKILL_SOURCE_URL` or `FEISHU_BITABLE_SOURCE_URL`

It also removes the old legacy install target if present:

- `~/.openclaw/skills/homepanel-feishu-bitable`

### Manual render + install

You can also render the mirrors yourself:

```bash
node scripts/render-openclaw-skill.mjs
node scripts/render-openclaw-installer-skill.mjs
```

Then copy:

- source: `skills/aipanel-feishu-bitable/` -> target: `~/.openclaw/skills/aipanel-feishu-bitable`
- source: `skills/aipanel-installer/` -> target: `~/.openclaw/skills/aipanel-installer`

## Why this matters for AIPanel

Without the skill, AIPanel is mostly a small web panel on top of a Bitable.

With the skill:

- the panel becomes the human control surface
- the Bitable becomes the shared operational data model
- the agent becomes a real operator, not just a read-only observer

## Current scope

The current installer skill focuses on orchestrating the one-command creation flow.
The current data skill follows the AIPanel field names, ordering model, and placeholder-row behavior.
Together they cover both instance creation and daily data operations.

## Packaging model

For the current release, the packaging model is:

- `integrations/openclaw-skill/` is the canonical editable template for data operations
- `integrations/openclaw-installer-skill/` is the canonical editable template for installation flow
- `skills/aipanel-feishu-bitable/` and `skills/aipanel-installer/` are the rendered distribution folders
- the install scripts under `integrations/install-scripts/` are the default install paths for operators
- if a `.skill` artifact is later published, it should be built from the rendered distribution folder rather than the raw template

## Compatibility note

For the current release, the supported path is the in-repo install-script + rendered-skill workflow documented here.

See also:

- [OpenClaw compatibility note](./openclaw-compatibility.md)

## Related docs

- [Feishu app + Bitable setup](../datasource/feishu-bitable.md)
- [Open-source readiness checklist](../product/open-source-readiness-checklist.md)
- `integrations/openclaw-skill/SKILL.md`
