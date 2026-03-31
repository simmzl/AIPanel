# AIPanel troubleshooting

This page collects the most likely failure modes for the current AIPanel release shape.

The current deployment model assumes:

- Vercel hosts the web app and API
- Feishu Bitable is the canonical data source
- OpenClaw is optional

If something breaks, narrow it down in this order:

1. build/deploy
2. authentication
3. Feishu credentials
4. Bitable schema
5. OpenClaw integration

## 1. Build or deploy fails on Vercel

### Symptoms

- build fails during `npm run build`
- Vercel project deploys but shows a failed deployment

### Check

- Vercel build command is `npm run build`
- output directory is `dist`
- Node/npm install is working normally
- repo imported correctly as a Vite project

### Typical fixes

- re-run locally first:

```bash
npm install
npm run build
```

- make sure the repo root is the project root in Vercel
- confirm no required env variables were mistyped during manual setup

## 2. Site opens, but login does not work

### Symptoms

- password is always rejected
- page refresh logs you out unexpectedly

### Check

- `ACCESS_PASSWORD`
- `JWT_SECRET`

### Typical fixes

- confirm `ACCESS_PASSWORD` in Vercel matches what you are entering
- regenerate `JWT_SECRET` as a long random string
- redeploy after changing env vars

## 3. Login works, but data does not load

### Symptoms

- panel UI opens, but categories/bookmarks are empty
- API requests fail after login

### Check

- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`
- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`
- Feishu app permissions

### Typical fixes

- verify the app credentials are copied exactly from Feishu Open Platform
- verify the app token starts with the expected Bitable token format
- verify the table ID points to the correct table, not just the correct base
- re-check the Feishu permission grant path

## 4. Reads work, but writes fail

### Symptoms

- bookmarks are visible
- create / edit / delete fails
- category creation or reorder fails

### Most likely causes

- app has read access but not write access
- Bitable field names do not match the documented schema
- Bitable field types do not match the documented schema

### Required field names

- `标题`
- `副标题`
- `链接`
- `图标`
- `分类`
- `排序`
- `分类排序`

### Field-type expectations

- `分类` → single select
- `排序` → number
- `分类排序` → number

## 5. Category order or bookmark order looks wrong

### Symptoms

- categories show up in the wrong sequence
- bookmarks inside one category appear out of order

### Check

- `分类排序` controls category order
- `排序` controls item order inside the same category

### Notes

AIPanel currently relies on the stored numeric ordering model in Feishu Bitable. If those values drift, the UI will reflect that drift.

## 6. New category does not appear immediately

### Why this happens

The current AIPanel model still uses a placeholder-row approach for category visibility.

### Check

- whether the category option was added to the `分类` field
- whether a placeholder row or real row exists for that category

### Note

This is current product behavior, not necessarily a deploy bug.

## 7. Footer “数据源” / source link is missing or wrong

### Check

- `FEISHU_BITABLE_SOURCE_URL`

### Fix

Set it to the real browser URL of the target Bitable page.

## 8. Older env names cause confusion

AIPanel currently accepts these legacy aliases for one compatibility window:

- `FEISHU_APP_TOKEN` → `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_TABLE_ID` → `FEISHU_BITABLE_TABLE_ID`

For any fresh deployment, only use:

- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`

## 9. OpenClaw skill installs, but feels misconfigured

### Check

- rendered/install target is `~/.openclaw/skills/aipanel-feishu-bitable`
- installer env vars point to the same Bitable as the web app
- canonical source is `integrations/openclaw-skill/`

### Recommended reinstall flow

```bash
bash integrations/install-scripts/install-openclaw-skill.sh
```

If you changed env values, re-render/reinstall the skill before testing again.

## 10. Placeholder screenshots or demo assets look generic

That is expected for the current public-prep phase.

The repo can temporarily ship public-safe placeholder/stand-in assets before final polished screenshots are replaced.

See:

- `docs/assets/screenshots/`
- `docs/assets/demo/`
- `docs/product/first-public-release.md`

## 11. Still stuck?

Work through this exact order:

1. `npm install`
2. `npm run build`
3. verify local env names
4. verify Feishu app credentials
5. verify Bitable schema
6. verify Vercel env vars
7. reinstall the OpenClaw skill if you are testing agent-side integration

If you open an issue, include:

- what you expected
- what happened instead
- whether the failure is build / login / read / write / OpenClaw
- screenshots or logs if safe to share
