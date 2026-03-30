# First public release candidate checklist

This checklist is narrower than the broader open-source readiness doc.
It exists to answer one practical question:

**What still needs to be true before AIPanel feels credible as a first public release candidate?**

## Already true after this pass

- current working tree uses placeholder-only env examples
- live debug-write API surface has been removed
- OpenClaw skill packaging boundary is documented and operational
- scratch-clone validation succeeded for:
  - `npm install`
  - `npm run build`
  - `node scripts/render-openclaw-skill.mjs`
  - `bash integrations/install-scripts/install-openclaw-skill.sh <target>`
- MIT license has been chosen and added
- first-pass history/current-tree audit has been documented

## Still recommended before calling the repo publicly polished

### Product presentation

- add desktop and mobile screenshots
- add one short demo GIF or screen recording
- add a lightweight architecture diagram

### Security / hygiene

- decide whether to rewrite git history before broad public launch to remove old private deployment residue
- add a short security reporting path (`SECURITY.md` or equivalent)
- optionally run a dedicated secret scanner in CI once the public repo shape is stable

### Docs and onboarding

- keep trimming internal/private-alpha phrasing where it no longer helps readers
- add one fully copy-pasteable happy-path setup section for Vercel + Feishu
- document known limitations in one concise place

### Integration packaging

- decide whether first public release ships:
  - rendered folder only
  - packaged skill artifact
  - both
- decide whether to keep legacy env aliases for one more release or remove them

## Practical release judgment

If screenshots and a light security/reporting note are added, AIPanel is close to a credible **experimental `v0.x` public release candidate**.

The remaining work is now more about presentation, confidence, and policy than about core repo correctness.