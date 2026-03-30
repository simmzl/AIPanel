# Deploy AIPanel on Vercel

This guide covers the current recommended deployment path for AIPanel.

AIPanel currently assumes:

- frontend + API are deployed together on Vercel
- Feishu Bitable is the source of truth
- authentication is password-based for simple self-hosted access in the current release-candidate build

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

### What each value is

#### Application

- `APP_NAME` — display name shown in the panel UI
- `ACCESS_PASSWORD` — password used to enter the panel
- `JWT_SECRET` — long random string used to sign auth tokens

#### Feishu

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

No monorepo config is required for the current repo layout.

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

If envs are correct, the build should complete without code changes.

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

After the first successful deploy, test these in order.

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
- mobile view is readable enough for alpha use
- theme switching is acceptable

## Optional / transitional environment notes

### `FEISHU_BITABLE_SOURCE_URL`

This value is not critical for core API writes, but it is strongly recommended.

It is used so the UI can deep-link back to the real Feishu data source.

### Legacy compatibility aliases

The current API still accepts these aliases for transition safety during the first experimental public `v0.x` release window:

- `FEISHU_APP_TOKEN` → `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_TABLE_ID` → `FEISHU_BITABLE_TABLE_ID`

For any new deployment, use only the canonical `FEISHU_BITABLE_*` names.
Plan to remove the aliases in the next cleanup-oriented release after users have migration time.

## Troubleshooting notes

### Build succeeds but data does not load

Usually this means one of:

- missing Feishu env variables
- wrong app token or table ID
- missing Feishu app permissions
- Bitable schema mismatch

Check the Feishu setup guide carefully.

### Login works but writes fail

Usually this means:

- app has read access but not write access
- wrong table field names or field types
- app token / table ID points to the wrong table

### Footer link missing or wrong

Check:

- `FEISHU_BITABLE_SOURCE_URL`

### Compatibility confusion from older notes

If you previously used:

- `FEISHU_APP_TOKEN`
- `FEISHU_TABLE_ID`

replace them with:

- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`

The aliases still work for now, but they should not be part of the long-term public docs.

## Local parity tip

Before deploying, it is worth verifying locally with:

```bash
cp .env.example .env.local
npm install
npm run build
npm run dev
```

If local build and local runtime are clean, Vercel deployment is usually straightforward.

## Deploy-button status

AIPanel is close to being deploy-button friendly, but for this first experimental public release the safer posture is:

- keep the repo manually deployable through the normal Vercel import flow
- document the expected env set clearly
- add a deploy button only after the public env names, screenshots, and onboarding flow have settled

### Placeholder deploy-button snippet

When the repo is ready to expose one publicly, the README can add a section like this:

```md
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/simmzl/AIPanel)
```

Before enabling that publicly, verify:

- repository URL is final
- env variable names in docs are final
- import flow produces the expected Vercel project layout
- the button does not imply the Feishu setup is optional
