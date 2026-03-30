# Install and use

## What this skill is for

This skill lets an OpenClaw-style agent operate the AIPanel Feishu Bitable with natural language.

It is currently packaged as a project-specific private-alpha skill, not a generic public template.

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

## Package the skill

Run:

```bash
python3 /Users/simmzl/.nvm/versions/node/v22.22.1/lib/node_modules/openclaw/skills/skill-creator/scripts/package_skill.py /tmp/AIPanel/integrations/openclaw-skill /tmp/AIPanel/dist-skills
```

This produces:

- `/tmp/AIPanel/dist-skills/aipanel-feishu-bitable.skill`

Current packaged file:

- `/tmp/AIPanel/dist-skills/aipanel-feishu-bitable.skill`

## Install into OpenClaw

You can use either approach.

### Option A: copy the unpacked skill folder

Copy this folder into your local skills directory:

- source: `/tmp/AIPanel/integrations/openclaw-skill`
- target example: `~/.openclaw/skills/aipanel-feishu-bitable`

### Option B: install from the packaged `.skill` file

Use the target environment's normal skill installation flow and import:

- `/tmp/AIPanel/dist-skills/aipanel-feishu-bitable.skill`

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
