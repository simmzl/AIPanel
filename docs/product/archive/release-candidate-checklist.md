# Public release checklist

This checklist answers one practical question:

**What still needs to be true before AIPanel feels solid enough to share more broadly?**

## Already in place

- placeholder-only env examples in the current working tree
- live debug-write API surface removed
- OpenClaw skill packaging boundary documented and operational
- clean-clone validation succeeded for:
  - `npm install`
  - `npm run build`
  - `node scripts/render-openclaw-skill.mjs`
  - `bash integrations/install-scripts/install-openclaw-skill.sh <target>`
- MIT license added
- first-pass history/current-tree audit documented
- architecture doc + diagram present
- screenshot/demo folder structure present
- README and deploy docs aligned with the current public-facing package shape

## Still recommended

### Product presentation

- add desktop and mobile screenshots
- add one short demo GIF or screen recording
- [x] add an architecture diagram / architecture doc
- [x] add a concrete screenshot/demo capture plan in `docs/product/first-public-release.md`

### Security / hygiene

- decide whether to rewrite git history before a broader launch to remove old private deployment residue
- [x] add a short security reporting path (`SECURITY.md`)
- optionally run a dedicated secret scanner in CI once the public repo shape is stable

### Docs and onboarding

- keep trimming internal wording where it no longer helps readers
- add one fully copy-pasteable happy-path setup section for Vercel + Feishu
- [x] document known limitations in one concise place
- [x] add docs navigation entrypoints from README and `docs/README.md`

### Integration packaging

- [x] packaging stance decided:
  - author in `integrations/openclaw-skill/`
  - ship/install from `skills/aipanel-feishu-bitable/`
  - optionally generate future `.skill` artifacts from the rendered folder
- [x] older env alias policy documented

## Practical judgment

With `SECURITY.md`, the packaging stance, the architecture docs, and the asset-capture plan in place, AIPanel already has a credible experimental public baseline.

The biggest remaining gaps are real screenshots/demo assets, a smooth happy-path setup experience, and the explicit git-history cleanup decision.
