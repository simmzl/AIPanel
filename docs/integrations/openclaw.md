# OpenClaw integration

AIPanel currently includes an OpenClaw skill so an agent can operate the same Feishu Bitable data that the web UI reads and writes.

This is one of the core ideas behind the project:

- humans use the panel UI
- agents use natural language plus the skill
- both touch the same structured source of truth

## Current location

Canonical skill source:

- `integrations/openclaw-skill/`

Convenience installer:

- `integrations/install-scripts/install-openclaw-skill.sh`

There is also a mirrored skill copy under `skills/`, but the repo should eventually make the distribution story cleaner for public release.

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

The current skill is **project-specific**.

It is intentionally configured around one fixed AIPanel data source and schema, including:

- fixed Feishu Bitable identifiers
- expected field names
- AIPanel-specific category and ordering behavior
- placeholder-row logic for category visibility

That makes it convenient and low-friction for private alpha, but it is **not yet the final public open-source shape**.

## Install the skill

### Fast local install

From the repo root:

```bash
bash integrations/install-scripts/install-openclaw-skill.sh
```

This copies the skill into:

- `~/.openclaw/skills/aipanel-feishu-bitable`

It also removes the old legacy install target if present:

- `~/.openclaw/skills/homepanel-feishu-bitable`

### Manual install

You can also copy the skill folder manually:

- source: `integrations/openclaw-skill/`
- target: `~/.openclaw/skills/aipanel-feishu-bitable`

## How to use it after install

Once installed into OpenClaw, use natural-language requests against AIPanel data.

Examples:

- “帮我看看 AIPanel 里 网络工具 分类有哪些书签”
- “新增一个书签到 开发，标题是 Vercel，链接是 https://vercel.com”
- “把 AIPanel 分类顺序改成：效率工具、AI 工作流、开发、网络工具、其他”
- “找出没有副标题的记录”

The skill docs and references currently live inside the skill package itself.

## Why this matters for AIPanel

Without the skill, AIPanel is mostly a small web panel on top of a Bitable.

With the skill, AIPanel becomes more interesting:

- the panel becomes the human control surface
- the Bitable becomes the shared operational data model
- the agent becomes a real operator, not just a read-only observer

That agent-first angle is a big part of the product story.

## Current limitations

For public open-source readers, the most important limitation is this:

### The current skill is private-alpha oriented

It is optimized for the AIPanel project as currently run, not for generic reuse across arbitrary teams.

That means it still has:

- fixed identifiers
- project assumptions
- docs shaped around one known deployment

This is intentional for now.

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

## Recommended future cleanup

For open-source release prep, the main integration tasks are:

- parameterize or remove fixed IDs
- clarify whether `skills/` is source, mirror, or distribution output
- document install flow from a clean machine
- decide whether to ship a packaged `.skill` artifact, folder-only source, or both
- add a public-safe explanation of required OpenClaw capabilities

## Related docs

- [Feishu app + Bitable setup](../datasource/feishu-bitable.md)
- [Open-source readiness checklist](../product/open-source-readiness-checklist.md)
- `integrations/openclaw-skill/SKILL.md`
