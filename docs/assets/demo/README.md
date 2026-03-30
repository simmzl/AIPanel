# Demo asset plan

Recommended first-release demo assets:

- `add-bookmark.gif`
- `agent-and-ui-shared-data.gif`

## Practical capture plan used for this release pass

If you want a fast, public-safe demo capture without touching production data:

1. run the local mock release server
2. open the panel in a browser
3. sign in with the demo token/local mocked auth state
4. record one of these short flows

### Demo 1 — `add-bookmark.gif`

Target length: 15–25 seconds.

Suggested sequence:

1. open the panel home page
2. click **添加书签**
3. paste a public URL
4. click **自动抓取**
5. optionally adjust title/category
6. click **保存书签**
7. show the new card visible in the grid

### Demo 2 — `agent-and-ui-shared-data.gif`

Target length: 15–30 seconds.

Suggested sequence:

1. show the panel home page
2. make one bookmark change in the UI or via an agent write
3. refresh or switch views
4. show the same data reflected in the shared panel state

## Local capture helper

This repo now includes a lightweight local helper for screenshot/demo capture:

```bash
npm install
npm run build
node scripts/mock-release-server.mjs
```

Then open:

- `http://localhost:4174`

The helper serves the built frontend with mocked auth/bookmark APIs so release assets can be captured without requiring a live Feishu setup.

## Recording tips

- use a clean browser profile or incognito window
- capture against public-safe bookmark data only
- keep the cursor movement calm and readable
- if the GIF becomes too large, keep the raw recording outside the repo and export a short optimized version
- if a GIF is still too heavy, commit a short MP4/WebM externally and keep this README/runbook in-repo
