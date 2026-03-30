# Deploy AIPanel on Vercel

This guide covers the current recommended deployment path for AIPanel.

AIPanel currently assumes:

- frontend + API are deployed together on Vercel
- Feishu Bitable is the source of truth
- authentication is password-based for simple self-hosted access in the current release-candidate build

## Before you start

You should already have:

1. a Vercel account
2. a Feishu app with usable credentials
3. a Feishu Bitable app and table prepared for AIPanel
4. the table URL, app token, and table ID

If the Feishu side is not ready yet, read:

- [Feishu app + Bitable setup](../datasource/feishu-bitable.md)

## Required environment variables

Set these in Vercel Project Settings → Environment Variables.

### Application

- `APP_NAME` — display name for the panel, for example `AIPanel`
- `ACCESS_PASSWORD` — password required to enter the panel
- `JWT_SECRET` — random secret used to sign auth tokens

### Feishu

- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`
- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`
- `FEISHU_BITABLE_SOURCE_URL`

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

## Deploy-button status

AIPanel is close to being deploy-button friendly, but for this first experimental public release the safer posture is:

- keep the repo manually deployable through the normal Vercel import flow
- document the expected env set clearly
- add a deploy button only after the public env names, screenshots, and onboarding flow have settled

### Why not add a live button immediately?

A Vercel deploy button is easy to expose but slightly expensive to maintain well:

- the env contract needs to stay stable
- the post-import experience should be obvious for new users
- screenshots/docs should already match the actual deploy flow

That means the repo is **deploy-button ready in principle**, but this release treats it as a documented next-step polish item rather than mandatory launch scope.

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

## Step-by-step deployment

### 1. Import the repository into Vercel

Create a new Vercel project and connect this repo.

AIPanel does not require special monorepo handling in its current form.

### 2. Confirm framework/build settings

The repo is Vite-based and already includes Vercel-compatible API routes.

In most cases, Vercel should detect the setup automatically.

Expected build command:

```bash
npm run build
```

Expected install command:

```bash
npm install
```

### 3. Add environment variables

Add all required envs listed above.

Recommended values:

- `APP_NAME=AIPanel`
- `ACCESS_PASSWORD=<your private password>`
- `JWT_SECRET=<long random secret>`
- Feishu values copied exactly from your Feishu app / Bitable setup

### 4. Deploy

Trigger the first deployment.

If envs are correct, the build should complete without extra code changes.

### 5. Open the deployed site

After deploy, visit the Vercel production URL.

You should see:

- the login page
- the AIPanel branding / name
- successful login with `ACCESS_PASSWORD`
- bookmark data loading from Feishu after login

## Expected outcome after a successful deploy

A healthy deployment should allow you to:

- log in with the configured password
- browse categories and bookmarks
- search bookmarks
- create / edit / delete bookmarks
- reorder categories
- fetch site metadata when adding a bookmark
- open the Feishu source link from the UI footer when configured

## Post-deploy checks

Run this checklist after the first production deploy.

### Authentication

- confirm wrong password is rejected
- confirm correct password returns access
- confirm refresh keeps you logged in locally

### Data read

- confirm categories load
- confirm bookmark list renders
- confirm a known record from Feishu appears in the panel

### Data write

- create a test bookmark
- edit the test bookmark
- delete the test bookmark
- reorder one category and confirm the result persists

### Feishu linkage

- confirm records written in the UI appear in Bitable
- confirm records edited in Bitable are reflected in the panel after reload
- confirm `FEISHU_BITABLE_SOURCE_URL` opens the expected data source

### Basic UX sanity

- confirm desktop view is usable
- confirm mobile view is readable enough for alpha use
- confirm theme behavior is acceptable

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
yment is usually straightforward.
