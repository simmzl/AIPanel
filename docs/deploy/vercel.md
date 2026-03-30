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

## Notes

- The current server code reads `FEISHU_BITABLE_APP_TOKEN` and `FEISHU_BITABLE_TABLE_ID`.
- If you have older local notes or screenshots that still show `FEISHU_APP_TOKEN` / `FEISHU_TABLE_ID`, treat them as legacy names and migrate them before deploy.
- `FEISHU_BITABLE_SOURCE_URL` is optional for API behavior but recommended so the footer can deep-link to the live data source.
