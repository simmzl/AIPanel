# Deploy AIPanel on Vercel

This guide covers the recommended deployment path for AIPanel.

AIPanel uses:

- Vercel for the web app and API
- Feishu Bitable as the source of truth
- password-based access for the current deployment model

## Fast happy-path: Vercel + Feishu in one pass

If you want the shortest reliable path, use this checklist exactly in order:

1. prepare the Feishu app and Bitable table first
2. import this repo into Vercel
3. paste the environment variables below into Vercel
4. deploy
5. log in with your `ACCESS_PASSWORD`
6. verify you can read and write one test bookmark

If the Feishu side is not ready yet, read first:

- [Feishu app + Bitable setup](../datasource/feishu-bitable.md)

If something goes wrong during deploy or first login/read/write verification, see:

- [Troubleshooting](../troubleshooting.md)

## Before you start

You should already have:

1. a Vercel account
2. a Feishu app with usable credentials
3. a Feishu Bitable app and table prepared for AIPanel
4. the table URL, app token, and table ID

## Copy-paste environment block

Use these exact variable names in **Vercel → Project Settings → Environment Variables**.

```env
APP_NAME=AIPanel
ACCESS_PASSWORD=change-this-to-a-real-password
JWT_SECRET=change-this-to-a-long-random-secret
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=xxx
FEISHU_BITABLE_APP_TOKEN=bascn_xxx
FEISHU_BITABLE_TABLE_ID=tblxxxxxx
FEISHU_BITABLE_SOURCE_URL=https://your-domain.feishu.cn/base/xxxxxxxx?table=tblxxxxxx
```

## What each value is

### Application

- `APP_NAME` — display name shown in the panel UI
- `ACCESS_PASSWORD` — password used to enter the panel
- `JWT_SECRET` — long random string used to sign auth tokens

### Feishu

- `FEISHU_APP_ID` — from your Feishu app credentials page
- `FEISHU_APP_SECRET` — from your Feishu app credentials page
- `FEISHU_BITABLE_APP_TOKEN` — the Bitable app token (`bascn_...`)
- `FEISHU_BITABLE_TABLE_ID` — the target table ID inside that Bitable app
- `FEISHU_BITABLE_SOURCE_URL` — the browser URL you want the footer “数据源” link to open

## Vercel import settings

In most cases, Vercel detects the project correctly.

Use these values if you want to confirm everything explicitly:

- **Framework Preset:** `Vite`
- **Install Command:** `npm install`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

## Exact deploy flow

### 1. Import the repository into Vercel

Create a new Vercel project and connect this repo.

### 2. Confirm build settings

Expected commands:

```bash
npm install
npm run build
```

### 3. Add the environment variables

Paste the env block above into Vercel.

Minimum recommendation:

- use a real password for `ACCESS_PASSWORD`
- generate a real long random value for `JWT_SECRET`
- copy the Feishu values exactly; do not retype by hand if you can avoid it

### 4. Deploy

Trigger the first deployment.

### 5. Open the deployed site

After deploy, visit the Vercel production URL.

Expected first view:

- login page loads
- branding renders correctly
- password form is visible

After successful login:

- bookmark categories load
- bookmark cards render
- footer can link back to Feishu if `FEISHU_BITABLE_SOURCE_URL` is set

## First production verification checklist

### Authentication

- wrong password is rejected
- correct password works
- refresh keeps you logged in locally

### Data read

- categories appear
- bookmark list renders
- one known Feishu record is visible

### Data write

- create one test bookmark
- edit that bookmark
- delete that bookmark
- reorder one category and confirm it persists

### Feishu linkage

- the UI writes appear in Bitable
- Bitable edits show up in the panel after reload
- the footer source link opens the intended Bitable page

### Basic UX sanity

- desktop view is usable
- mobile view is readable enough for normal use
- theme switching is acceptable

## Environment notes

### `FEISHU_BITABLE_SOURCE_URL`

This value is not critical for core API writes, but it is strongly recommended.
It is used so the UI can deep-link back to the real Feishu data source.

## Quick failure map

If you want the fastest debug path:

- build fails → check Vercel settings and local `npm run build`
- login fails → check `ACCESS_PASSWORD` / `JWT_SECRET`
- reads fail → check Feishu credentials and table identifiers
- writes fail → check Feishu permissions and Bitable schema
- UI data order looks wrong → check `排序` / `分类排序`

For the longer version, see [Troubleshooting](../troubleshooting.md).

## Local parity tip

Before deploying, it is worth verifying locally with:

```bash
cp .env.example .env.local
npm install
npm run build
npm run dev
```

If local build and local runtime are clean, Vercel deployment is usually straightforward.
