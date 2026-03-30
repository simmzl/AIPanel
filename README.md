# AIPanel

Agent-first panel backed by a shared Feishu Bitable data source.

AIPanel lets **AI agents** read and write the same data source with natural language, while **humans** use a visual web UI to browse, organize, and maintain that data.

## Runtime environment

Set these variables for a working deployment:

- `APP_NAME`
- `ACCESS_PASSWORD`
- `JWT_SECRET`
- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`
- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`
- `FEISHU_BITABLE_SOURCE_URL`

The backend fails loudly when required Feishu Bitable variables are missing. The footer data-source link is driven by `FEISHU_BITABLE_SOURCE_URL`.

If you still have older notes using `FEISHU_APP_TOKEN` / `FEISHU_TABLE_ID`, treat those as legacy names and rename them before deployment.

## OpenClaw integration

Canonical OpenClaw skill source lives in `integrations/openclaw-skill/`.

Install it locally with:

```bash
bash integrations/install-scripts/install-openclaw-skill.sh
```

## Private-alpha note

The current OpenClaw skill is intentionally project-specific: it contains fixed identifiers for the private-alpha AIPanel data source. That is acceptable for the current stage, but if the repo is later prepared for broader public reuse, the next step should be splitting the skill into a generic template plus a project-configured variant.
