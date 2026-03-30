# Feishu Bitable data source

AIPanel currently uses one shared Feishu Bitable as its source of truth.

## Runtime env names

Use these environment variable names consistently:

- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`
- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`
- `FEISHU_BITABLE_SOURCE_URL`

## OpenClaw skill location

The project-specific OpenClaw integration lives at:

- `integrations/openclaw-skill/`

The convenience installer lives at:

- `integrations/install-scripts/install-openclaw-skill.sh`
