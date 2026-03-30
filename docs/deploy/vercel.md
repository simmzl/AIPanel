# Vercel deployment plan

## Required environment variables

Configure these in Vercel project settings:

- `APP_NAME`
- `ACCESS_PASSWORD`
- `JWT_SECRET`
- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`
- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`
- `FEISHU_BITABLE_SOURCE_URL`

## Temporary compatibility behavior

The current private-alpha API still accepts these legacy env names:

- `FEISHU_APP_TOKEN` → `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_TABLE_ID` → `FEISHU_BITABLE_TABLE_ID`

This is only a compatibility bridge so existing local/Vercel settings do not fail immediately. New deployments should use the `FEISHU_BITABLE_*` names only.

## Recommended rollout

1. Set the canonical `FEISHU_BITABLE_*` variables in Vercel.
2. Verify the deployment succeeds.
3. Remove any old `FEISHU_APP_TOKEN` / `FEISHU_TABLE_ID` entries later once the environment is confirmed clean.

## Notes

- The server prefers `FEISHU_BITABLE_APP_TOKEN` and `FEISHU_BITABLE_TABLE_ID`.
- `FEISHU_BITABLE_SOURCE_URL` is optional for API behavior but recommended so the footer can deep-link to the live data source.
- `npm run build` cleans `dist/` and local TypeScript build-info files before building.
