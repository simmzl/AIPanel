# OpenClaw integration

AIPanel currently includes an OpenClaw skill so an agent can operate the same Feishu Bitable data that the web UI reads and writes.

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

Current recommended interpretation:

- `integrations/openclaw-skill/` is the only editable source of truth
- `skills/aipanel-feishu-bitable/` is rendered from that template for local/OpenClaw-style browsing and packaging
- contributors should not manually edit both copies

## What the current skill can do

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

In practice, this means an operator can say things like:

- “列出 AIPanel 现在所有分类”
- “给 AI 工作流 加一个 OpenRouter”
- “把 ChatGPT 挪到 效率工具 第一位”
- “找出所有占位记录”

## How it works today

The current skill is still **AIPanel-oriented**, but it is no longer documented as one hardcoded private deployment only.

The canonical skill folder now acts as a template that can be rendered with:

- Feishu Bitable app token
- table ID
- source URL

That keeps the current self-hosted workflow intact while making the public packaging story cleaner.

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

## How to use it after install

Once installed into OpenClaw, use natural-language requests against AIPanel data.

Examples:

- “帮我看看 AIPanel 里 网络工具 分类有哪些书签”
- “新增一个书签到 开发，标题是 Vercel，链接是 https://vercel.com”
- “把 AIPanel 分类顺序改成：效率工具、AI 工作流、开发、网络工具、其他”
- “找出没有副标题的记录”

The skill docs and references live inside the skill package itself.

## Why this matters for AIPanel

Without the skill, AIPanel is mostly a small web panel on top of a Bitable.

With the skill, AIPanel becomes more interesting:

- the panel becomes the human control surface
- the Bitable becomes the shared operational data model
- the agent becomes a real operator, not just a read-only observer

That agent-first angle is a big part of the product story.

## Current limitations

For public open-source readers, the most important limitation is this:

### The current skill is still product-shaped, not fully generic

It still assumes:

- the current AIPanel field names
- AIPanel-specific category/order semantics
- placeholder-row logic for category visibility

What changed in this pass is the packaging boundary:

- fixed private identifiers are no longer the only checked-in skill story
- the editable skill source is now clearly the template under `integrations/openclaw-skill/`
- the mirrored `skills/` copy is treated as rendered output

## What should later be generalized

Before or during a public release, the integration should likely evolve into two layers.

### Layer 1: generic reusable skill/template

A future public package should allow users to configure:

- Feishu app token
- table ID
- field names
- placeholder behavior
- category/order conventions

### Layer 2: AIPanel-specific configured variant

AIPanel itself can still ship a preconfigured skill variant for the product’s preferred schema and workflow.

That would preserve the good user experience while making the architecture more reusable.

## First-release packaging stance

For the first public release, the recommended packaging model is:

- `integrations/openclaw-skill/` is the canonical editable template
- `skills/aipanel-feishu-bitable/` is the rendered distribution folder
- `integrations/install-scripts/install-openclaw-skill.sh` is the default install path for operators
- if a `.skill` artifact is later published, it should be built from the rendered distribution folder rather than the raw template

This keeps contribution and installation simple while leaving room for more formal packaging later.

## Recommended future cleanup

For post-release integration cleanup, the main tasks are:

- validate install flow from a clean machine
- add a public-safe explanation of required OpenClaw capabilities
- decide whether the first public release should still ship an AIPanel-specific preset in-tree
- evolve toward a more generic reusable skill/template after the first public release

## Related docs

- [Feishu app + Bitable setup](../datasource/feishu-bitable.md)
- [Open-source readiness checklist](../product/open-source-readiness-checklist.md)
- `integrations/openclaw-skill/SKILL.md`
