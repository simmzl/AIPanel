# Feishu Bitable data source

AIPanel currently uses one shared Feishu Bitable as its source of truth.

## Canonical runtime env names

Use these environment variable names consistently:

- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`
- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`
- `FEISHU_BITABLE_SOURCE_URL`

## Temporary private-alpha compatibility aliases

To avoid breaking older deployment notes during private alpha, the API also accepts:

- `FEISHU_APP_TOKEN` as a legacy alias for `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_TABLE_ID` as a legacy alias for `FEISHU_BITABLE_TABLE_ID`

Do not use the legacy names in new docs, examples, or deploy setup. They should disappear in the later open-source cleanup phase.

## OpenClaw skill location

The project-specific OpenClaw integration lives at:

- `integrations/openclaw-skill/`

The convenience installer lives at:

- `integrations/install-scripts/install-openclaw-skill.sh`
