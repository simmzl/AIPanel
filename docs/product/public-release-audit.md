# Public release audit — first pass

This document records the first practical audit for moving AIPanel from private alpha to a credible first public release.

It is intentionally incremental.
The goal is not to redesign the whole project at once; the goal is to make the current repo honest, safer, and easier for strangers to evaluate.

## Audit summary

### What looks good already

- runtime no longer depends on hardcoded fallback Feishu IDs in `api/_lib.ts`
- `.env.example` and `.env.vercel.local.example` use placeholders only
- generated build output is gitignored
- README and deployment docs now explain the repo honestly as pre-public-release
- OpenClaw integration is documented instead of being hidden tribal knowledge
- the live debug write path has been moved out of the deployed API surface into a local-only script
- the OpenClaw skill now has a clearer canonical template source and rendered mirror flow

### What still blocks a clean public release

- the current skill is still AIPanel-shaped rather than fully generic
- some docs still intentionally reference private-alpha migration behavior and legacy env aliases
- git history has not yet been audited for past accidental secret leakage
- the repo still lacks screenshots / demo assets / architecture diagram polish

## First-pass findings by area

## 1. Secrets and credentials

### Current repo working tree

First-pass review did **not** find committed real secrets in current tracked source files reviewed during this pass.

Examples checked:

- `.env.example`
- `.env.vercel.local.example`
- runtime env loading in `api/_lib.ts`
- README + setup docs

### Still required before public release

- review full git history, not just current files
- scan for accidentally committed tokens, cookies, secrets, or webhook URLs
- rotate anything sensitive if history ever contained real values

## 2. Hardcoded project-specific identifiers

### Current status after this pass

#### OpenClaw skill packaging

Files:

- `integrations/openclaw-skill/SKILL.md`
- `skills/aipanel-feishu-bitable/SKILL.md`
- `scripts/render-openclaw-skill.mjs`

The canonical skill source now uses placeholders and can be rendered from env-backed configuration.

That is meaningfully better than shipping only one checked-in hardcoded deployment config, even though the skill behavior is still AIPanel-specific.

#### Debug write path

The old deployed endpoint:

- `api/debug-feishu-write.ts`

has been removed from the public API surface.

A local-only replacement now exists at:

- `scripts/debug/feishu-write.mjs`

That is a safer release-candidate posture because the repo no longer advertises a normal serverless endpoint whose main purpose is to perform a live debug write.

## 3. Private-alpha-only language and migration notes

These are still present across product docs and are mostly intentional for now.

Examples:

- legacy env alias notes
- private-alpha rollout framing
- migration notes for old naming

These are not inherently unsafe, but they should be tightened before public launch so the docs read as product docs instead of internal migration notes.

## 4. Skill packaging boundary

### Current state

There are still two in-repo skill locations:

- `integrations/openclaw-skill/`
- `skills/aipanel-feishu-bitable/`

### Current interpretation

The boundary is now clearer:

- `integrations/openclaw-skill/` = canonical editable template source
- `skills/aipanel-feishu-bitable/` = rendered mirror / local distribution copy

This is enforced socially through docs and operationally through:

- `scripts/render-openclaw-skill.mjs`
- `integrations/install-scripts/install-openclaw-skill.sh`

### Remaining issue

This is better, but still not the final long-term public architecture.
A future public release may still want a more generic Feishu-Bitable skill plus an AIPanel preset.

## Release blockers vs non-blockers

### High-priority blockers

- choose actual public license text
- audit git history for leaked secrets
- reduce or finish removal of lingering private-alpha migration wording in public docs
- validate clean-machine install flow end to end
- decide whether first public release ships only the rendered AIPanel preset or also a generic reusable template

### Medium-priority cleanup

- reduce owner-machine-specific / operator-specific doc examples further
- add screenshots and architecture explanation
- add security reporting guidance

### Lower-priority later improvements

- generic skill templating beyond AIPanel
- more formal package/distribution workflow
- compatibility matrix for OpenClaw versions

## Suggested release gate update

A credible first public release should not ship until:

1. license is finalized
2. git history audit is done
3. core docs are validated from a clean machine
4. skill packaging/install flow is validated end to end
5. screenshots and basic product visuals are added

## Practical conclusion

AIPanel is now in a much better documentation and repo-hygiene state than the original private-alpha baseline.
It is not public-release ready yet, but this pass materially improved the release-candidate shape by:

- removing the live debug-write API surface
- making the skill packaging story less ambiguous
- reducing dependence on one checked-in fixed Feishu deployment in the canonical skill source
