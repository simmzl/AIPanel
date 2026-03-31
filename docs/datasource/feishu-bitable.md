# Feishu app + Bitable setup for AIPanel

AIPanel uses **one shared Feishu Bitable** as its source of truth.

This guide explains what you need before deployment:

- a Feishu app
- app credentials
- a Bitable app + table
- correct field schema
- sufficient permissions for read/write access

## Runtime configuration

AIPanel expects these env values:

- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`
- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`
- `FEISHU_BITABLE_SOURCE_URL`

## 1. Create or choose a Feishu app

You need a Feishu app that can call Bitable APIs.

From the Feishu Open Platform:

1. create an app
2. record the App ID
3. record the App Secret
4. enable the permissions needed for Bitable access

These credentials become:

- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`

## 2. Create or choose a Bitable app

Inside Feishu Bitable:

1. create a new Bitable app, or reuse an existing one for AIPanel
2. create one table for panel records
3. copy the Bitable URL
4. extract the app token and table ID

You will use:

- `FEISHU_BITABLE_APP_TOKEN` — the Bitable app token
- `FEISHU_BITABLE_TABLE_ID` — the specific table ID
- `FEISHU_BITABLE_SOURCE_URL` — the full Bitable URL for deep links

## 3. Required table fields

The current AIPanel API expects these field names exactly.

| Field name | Expected type | Meaning |
| --- | --- | --- |
| `标题` | text | display title |
| `副标题` | text | subtitle / description |
| `链接` | url | target URL |
| `图标` | text | favicon URL or explicit icon URL |
| `分类` | single select | category name |
| `排序` | number | order within one category |
| `分类排序` | number | category order across the whole panel |

If the field names or field types do not match, the app may read or write incorrectly.

## 4. Field behavior

### `标题`

The visible title shown in the panel.

### `副标题`

A short description or note shown under the title.

### `链接`

The real bookmark URL.

### `图标`

An icon URL. If empty or unusable, the frontend falls back to `/favicon.ico` on the target origin when possible.

### `分类`

Single-select category used to group bookmarks.

### `排序`

Sort order inside one category.

### `分类排序`

Sort order across categories.

This is how AIPanel preserves the category sequence in the UI.

## 5. Placeholder-row behavior

AIPanel currently supports category creation by writing a placeholder row.

Current placeholder values are:

- `标题`: `—`
- `副标题`: `—`
- `链接`: `https://placeholder.local`
- `图标`: empty string
- `排序`: `0`
- `分类排序`: append position

Why this exists:

- the UI derives visible categories from live records
- a new category needs at least one row to appear immediately

## 6. Minimum permission expectations

Your Feishu app should be able to:

- obtain a tenant access token
- read Bitable table records
- create Bitable records
- update Bitable records
- delete Bitable records
- read table field metadata
- update field options if category option management is used

If permissions are too narrow, you may see:

- reads work but writes fail
- category creation fails
- field-option updates fail

## 7. Data source URL

Set:

- `FEISHU_BITABLE_SOURCE_URL`

This is mainly used for UI deep-linking back to the underlying Feishu data source.

## 8. Env naming

Use these canonical names in all new setup:

- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`

The API also accepts these older aliases:

- `FEISHU_APP_TOKEN`
- `FEISHU_TABLE_ID`

For new setup and docs, use only the canonical `FEISHU_BITABLE_*` names.

## 9. What users need before deploy

Before deploying AIPanel successfully, you need all of the following:

- a Feishu account with access to Open Platform
- a Feishu app with usable credentials
- a Bitable app and correctly structured table
- permission for the app to access that Bitable
- the exact app token and table ID
- a Vercel project with the matching env vars configured

Without these, the repo may build, but the live panel will not function correctly.

## 10. Recommended validation checklist

Before deploying to Vercel, verify:

- App ID and App Secret are copied correctly
- Bitable app token is correct
- table ID is correct
- field names exactly match the expected Chinese names
- `分类` is a single-select field
- `排序` and `分类排序` are number fields
- the Bitable URL opens correctly for the intended workspace

## 11. OpenClaw relationship

The OpenClaw skill operates against the same Feishu Bitable data source.

That means:

- agent-side operations and UI-side operations affect the same records
- the Bitable schema is part of the product contract
- the web UI and the agent layer should stay aligned on the same dataset

For that integration story, see:

- [OpenClaw integration](../integrations/openclaw.md)
