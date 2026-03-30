# OpenClaw integration

AIPanel ships with a project-specific OpenClaw skill at:

- `integrations/openclaw-skill/`

Install it locally with:

```bash
bash integrations/install-scripts/install-openclaw-skill.sh
```

## Current scope

This skill is intentionally opinionated for the current private-alpha deployment:

- fixed Feishu Bitable app/table identifiers
- tailored prompts for AIPanel bookmark and category management
- optimized for the shared production-like data source behind this panel

That makes it convenient for internal/private-alpha use, but it is **not yet framed as a generic public reusable skill**.

## Recommended positioning

- Keep the fixed-ID skill for private alpha for now.
- If the project moves toward open-source/public reuse, split it into:
  1. a generic reusable Feishu-Bitable skill template, and
  2. an AIPanel project-specific configured variant.
