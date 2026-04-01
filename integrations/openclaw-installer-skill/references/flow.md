# AIPanel Installer Flow

## Stage model

Preferred conversational model:

```text
preflight
-> create-feishu
-> configure
-> ask-final-inputs
-> deploy-vercel
-> verify
-> done
```

The underlying installer state may still use older internal labels such as `ask-password` or `create-vercel`. Interpret them according to intent rather than insisting on exact wording.

## Stage responsibilities

### preflight
- Check local Feishu/Lark CLI availability
- Check Vercel CLI availability
- Stop with a short explanation if either side is blocked

### create-feishu
- Create the Bitable app
- Create the main table
- Create required schema
- Save `appToken`, `tableId`, `sourceUrl`

### configure
- Ensure `APP_NAME`
- Generate `JWT_SECRET` if missing
- Infer `FEISHU_APP_ID` from local auth context
- Copy Feishu creation outputs into env fields

### ask-final-inputs
Ask only for missing user-provided values:
- `ACCESS_PASSWORD`
- `FEISHU_APP_SECRET`

When asking for `FEISHU_APP_SECRET`, name the detected `FEISHU_APP_ID`.

### deploy-vercel
- Run dry-run first when appropriate
- Ensure all required env values exist
- Create/reuse project
- Link project
- Upsert production env vars
- Deploy to production

### verify
Minimum acceptable checks:
- deployment URL exists
- deploy command succeeded
- installer state contains deployment URL

Deeper HTTP-level verification can be added later.

### done
Report:
- deployment URL
- what the installer completed
- whether verification was partial or complete
