# Public release audit — first pass

This document records the first practical audit for moving AIPanel from an internal experimental state to a credible first public release.

It is intentionally incremental.
The goal is not to redesign the whole project at once; the goal is to make the current repo honest, safer, and easier for strangers to evaluate.

## Audit summary

### What looks good already

- runtime no longer depends on hardcoded fallback Feishu IDs in `api/_lib.ts`
- `.env.example` and `.env.vercel.local.example` use placeholders only
- generated build output is gitignored
- README and deployment docs now explain the repo honestly as an experimental early-release candidate
- OpenClaw integration is documented instead of being hidden tribal knowledge
- the live debug write path has been moved out of the deployed API surface into a local-only script
- the OpenClaw skill now has a clearer canonical template source and rendered mirror flow
- scratch-clone validation succeeded for install, build, render, and installer flows
- the repo now has a real MIT license instead of a placeholder license-status file

### What still blocks a clean public release

- the current skill is still AIPanel-shaped rather than fully generic
- some docs still intentionally reference legacy migration behavior and compatibility aliases
- optional git-history cleanup is still recommended before broader public launch
- the repo still lacks screenshots / demo assets / architecture diagram polish
- there is no short public security/reporting note yet

## First-pass findings by area

## 1. Secrets and credentials

### Current repo working tree

First-pass review did **not** find committed real secrets in current tracked source files reviewed during this pass.

Examples checked:

- `.env.example`
- `.env.vercel.local.example`
- runtime env loading in `api/_lib.ts`
- README + setup docs
- install/render scripts and checked-in skill mirror

### Git history findings from this pass

A practical history scan did **not** surface obvious live credentials.

It **did** surface older private-deployment residue that should be treated consciously before broad public launch:

- an older checked-in Feishu base URL under `my.feishu.cn`
- older debug-write examples tied to `panel.simmzl.cn`
- local machine paths under `/Users/simmzl/...` in historical documentation/examples

These findings are not the same as confirmed secret leakage, but they are still project-specific historical identifiers.

### Recommended remediation posture

- do **not** treat history as perfectly public-clean yet
- if the repository is about to become broadly public, consider a targeted history rewrite to remove the old private Feishu base URL and historical deployment residue
- if history is left intact, document that current main is clean enough for evaluation while older history still contains private deployment context
- continue using placeholder-only env examples in the working tree

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

## 3. Public-facing wording and migration notes

Migration notes are still present across product docs and are mostly intentional for now.

Examples:

- legacy env alias notes
- older rollout framing
- migration notes for old naming

These are not inherently unsafe, but they should keep getting tightened so the docs read as product docs instead of internal migration notes.

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

- decide whether to rewrite git history to remove older private deployment residue before broad public launch
- reduce or finish removal of lingering migration wording in public docs
- add screenshots / demo visuals / lightweight architecture explanation
- add a short security reporting path
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
2. git history audit is done and its remediation decision is explicit
3. core docs are validated from a clean machine
4. skill packaging/install flow is validated end to end
5. security reporting guidance exists
6. screenshots and basic product visuals are added

## Practical conclusion

AIPanel is now in a much better documentation and repo-hygiene state than the original private-alpha baseline.
It is now at an experimental first public release candidate baseline, but it is not fully polished yet.
This pass materially improved the release-candidate shape by:

- removing the live debug-write API surface
- making the skill packaging story less ambiguous
- reducing dependence on one checked-in fixed Feishu deployment in the canonical skill source
- validating the install/build/render flow from a scratch clone
- replacing the license placeholder with a real MIT license
