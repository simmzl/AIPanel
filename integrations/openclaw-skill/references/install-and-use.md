# Install and use

## What this skill is for

This skill lets an OpenClaw-style agent operate the AIPanel Feishu Bitable with natural language.

The canonical editable source lives in:

- `integrations/openclaw-skill/`

The checked-in copy under:

- `skills/aipanel-feishu-bitable/`

is a rendered mirror for local browsing / distribution and should not be edited by hand.

After installation, you can ask the agent to:

- read AIPanel data
- count and summarize categories
- add bookmarks
- edit bookmarks
- delete bookmarks
- create categories
- reorder categories
- reorder bookmarks inside categories
- inspect placeholder rows and incomplete data

## Render a configured copy

From the repo root:

```bash
node scripts/render-openclaw-skill.mjs
```

By default, the renderer writes to:

- `skills/aipanel-feishu-bitable/`

It fills template placeholders from these env vars if present:

- `AIPANEL_SKILL_APP_TOKEN` or `FEISHU_BITABLE_APP_TOKEN`
- `AIPANEL_SKILL_TABLE_ID` or `FEISHU_BITABLE_TABLE_ID`
- `AIPANEL_SKILL_SOURCE_URL` or `FEISHU_BITABLE_SOURCE_URL`

If no values are available, the rendered copy keeps safe placeholders for manual editing.

## Install into OpenClaw

Fast path from the repo root:

```bash
bash integrations/install-scripts/install-openclaw-skill.sh
```

This script:

1. renders a configured skill copy from the canonical template
2. installs it into your local OpenClaw skills directory
3. removes the legacy `homepanel-feishu-bitable` install target if present

Default install target:

- `~/.openclaw/skills/aipanel-feishu-bitable`

## Optional packaging step

If you want to package the rendered skill with your normal OpenClaw tooling, package the rendered folder rather than the raw template.

Recommended source to package:

- `skills/aipanel-feishu-bitable/`

## How to use it after installation

Once the skill is installed, just talk to the agent normally.

You do **not** need to mention app token or table id in normal use.

Good examples:

- “帮我看看 AIPanel 里 网络工具 这个分类下有多少条”
- “把 ChatGPT 挪到 效率工具 第一位”
- “新增一个分类叫 AI 工作流”
- “给 AI 工作流 里先加一个占位项”
- “把 AIPanel 的分类顺序改成：效率工具、交易、网络工具、其他”
- “找出 AIPanel 里还是占位符的数据”

## Best practice

Use explicit names when possible:

- category names
- bookmark titles
- target position
- exact field to change

That makes the skill much more reliable.

## Reference docs

For richer usage examples, also read:

- `references/natural-language-manual.md`
- `references/example-prompts.md`
