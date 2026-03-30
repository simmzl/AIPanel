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

### What still blocks a clean public release

- the repo still contains project-specific fixed identifiers inside the OpenClaw skill package
- the repo still contains a debug write endpoint with project-specific URLs and live-write behavior
- skill packaging is duplicated between `skills/` and `integrations/openclaw-skill/`
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

### Confirmed project-specific items still present

#### OpenClaw skill fixed Bitable identifiers

Files:

- `integrations/openclaw-skill/SKILL.md`
- `skills/aipanel-feishu-bitable/SKILL.md`

These currently include:

- fixed `app_token`
- fixed `table_id`
- fixed Feishu Bitable source URL

These are acceptable for a private-alpha configured skill, but **not ideal as the only public packaging story**.

#### Machine-specific documentation path

Files:

- `integrations/openclaw-skill/references/install-and-use.md`
- `skills/aipanel-feishu-bitable/references/install-and-use.md`

These include an example path under `/Users/simmzl/...` for a local packaging script.

This is fine as an owner note in a private repo, but should be generalized or clearly labeled before public release.

#### Debug endpoint project URLs

File:

- `api/debug-feishu-write.ts`

This includes:

- `https://panel.simmzl.cn/`
- `https://panel.simmzl.cn/favicon.ico`

The endpoint also performs a real write into the configured Bitable.

## 3. Private-alpha-only language and migration notes

These are still present across product docs and are mostly intentional for now.

Examples:

- legacy env alias notes
- private-alpha rollout framing
- migration notes for old naming

These are not inherently unsafe, but they should be tightened before public launch so the docs read as product docs instead of internal migration notes.

## 4. Skill packaging boundary

### Current state

There are two copies of the same skill content:

- `integrations/openclaw-skill/`
- `skills/aipanel-feishu-bitable/`

### Recommended interpretation

For now, the cleanest mental model is:

- `integrations/openclaw-skill/` = canonical in-repo source for install/distribution
- `skills/aipanel-feishu-bitable/` = convenience mirror / local-use copy for OpenClaw-style skill browsing

### Why this is a problem for public release

If both stay editable without clear ownership, they will drift.
That creates confusion for contributors and makes audits harder.

### Recommended future split

#### Option A — source + generated mirror

- keep `integrations/openclaw-skill/` as the only editable source
- generate `skills/aipanel-feishu-bitable/` during packaging or release prep
- document that `skills/` is distribution output

#### Option B — generic/public skill + product preset

- `skills/feishu-bitable-generic/` → reusable public template
- `integrations/aipanel-openclaw-skill/` → AIPanel preset/configured distribution

This is likely the better long-term public direction.

### Recommended next step

Do **not** rewrite packaging yet.
Instead, document the current boundary clearly and pick one canonical source before the first public launch.

## 5. `api/debug-feishu-write.ts` review

### What it does today

- requires auth
- accepts only POST
- writes a synthetic debug bookmark row into the configured Feishu Bitable
- uses project-specific panel URLs in the record payload

### Public-release assessment

This file should **not** remain as a normal public endpoint in the first public release.

### Recommendation

Short-term:

- keep it in the repo only if it is still useful internally
- exclude it from the normal TypeScript build so it is not treated as part of the standard compiled surface
- document it as a quarantine/remove-before-public item

Before public release, choose one of:

1. remove it entirely
2. move it to a non-deployed local script
3. gate it behind an explicit development-only environment flag and generic payloads

### Preferred option

Move or remove it before public release.

Reason:

- it performs live writes
- it encodes project-specific URLs
- it is not part of the core public product story
- it increases the chance of accidental misuse without providing meaningful user value

## Release blockers vs non-blockers

### High-priority blockers

- choose actual public license text
- audit git history for leaked secrets
- parameterize or quarantine fixed identifiers in public-facing skill packaging
- remove or quarantine `api/debug-feishu-write.ts`
- clarify one canonical skill source

### Medium-priority cleanup

- reduce owner-machine-specific doc examples
- trim internal migration language from docs
- add screenshots and architecture explanation
- add security reporting guidance

### Lower-priority later improvements

- generic skill templating
- more formal package/distribution workflow
- compatibility matrix for OpenClaw versions

## Suggested release gate update

A credible first public release should not ship until:

1. license is finalized
2. git history audit is done
3. debug endpoint decision is implemented
4. skill packaging ownership is clarified
5. core docs are validated from a clean machine

## Practical conclusion

AIPanel is now in a much better documentation and repo-hygiene state than the original private-alpha baseline.
But it is still best described as **open-source preparation in progress**, not public-release ready.
