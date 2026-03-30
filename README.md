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

## OpenClaw integration

Canonical OpenClaw skill source lives in `integrations/openclaw-skill/`.

Install it locally with:

```bash
bash integrations/install-scripts/install-openclaw-skill.sh
```
