# Open-source readiness checklist

This checklist is for moving AIPanel from a working internal/experimental repo to a credible public open-source release.

## Status legend

- `[ ]` not started
- `[~]` partially done
- `[x]` done

## 1. Product positioning and repo presentation

- [x] Rewrite README around AIPanel positioning
- [x] Make the agent-first / human-UI-second framing explicit
- [~] Add stable screenshots for desktop and mobile views
- [ ] Add short demo GIFs for core flows
- [x] Add public-facing architecture diagram
- [x] Add repo badges / deploy badge once release shape is finalized

## 2. Secrets and security hygiene

- [x] Run a practical first-pass repo secrets audit for current tree and history
- [x] Verify `.env*` examples contain placeholders only
- [x] Review git history for accidentally committed credentials or fixed internal-only endpoints
- [ ] Remove or rotate any leaked identifiers if discovered
- [x] Keep required envs documented in one place
- [x] Remove the live debug-write endpoint from the deployed API surface and keep any remaining smoke-test flow local-only
- [x] Add a short security policy / reporting path if the repo becomes public
- [x] Add a first-pass public release audit doc

## 3. Environment and configuration validation

- [x] Normalize canonical env names around `FEISHU_BITABLE_*`
- [x] Keep temporary legacy aliases documented as transitional only
- [ ] Add runtime env validation helper with clearer startup diagnostics if needed
- [x] Confirm all docs, examples, and deploy guides use canonical env names only
- [~] Decide whether future public release keeps compatibility aliases or removes them

## 4. Feishu setup clarity

- [x] Document Feishu app and Bitable setup
- [x] Document required table fields and meanings
- [x] Document minimum permission expectations
- [ ] Add screenshots for Feishu app permission pages
- [ ] Add screenshots for Bitable schema setup
- [ ] Add a template-export or automated schema bootstrap path if desired

## 5. Deployment polish

- [x] Expand Vercel deployment guide into step-by-step setup
- [x] Separate required vs optional env variables
- [x] Document expected outcome and post-deploy checks
- [x] Add Vercel deploy button when env story is finalized enough for first release
- [~] Decide whether the first public release should support only Vercel or multiple hosts
- [x] Add troubleshooting section for common deploy failures

## 6. OpenClaw / agent integration packaging

- [x] Document current OpenClaw integration clearly
- [x] State that the current skill is AIPanel-shaped rather than fully generic
- [x] Document current install path and installer script
- [ ] Split AIPanel-specific skill from a broader reusable Feishu-Bitable template
- [x] Decide packaging format for first public release (`integrations/` authoring template + `skills/` rendered distribution folder; optional future artifact from rendered output)
- [~] Remove fixed identifiers from the canonical skill source and keep rendered/configured copies explicit
- [x] Add a short compatibility note for the current supported OpenClaw install posture
- [x] Document and enforce the current `skills/` vs `integrations/openclaw-skill/` boundary (`integrations/` editable template, `skills/` rendered mirror)

## 7. Community / contribution readiness

- [x] Add final `LICENSE`
- [x] Add `CONTRIBUTING.md`
- [x] Add `.github/ISSUE_TEMPLATE/`
- [x] Add pull request template
- [x] Add code of conduct if public contributions are expected
- [x] Add maintainer expectations / review policy

## 8. Technical cleanup before opening the repo

- [~] Review hard-coded product text for internal/private-only language and keep trimming where it weakens public presentation
- [~] Review fixed URLs and example tokens in docs and skill references
- [x] Decide and document that `integrations/openclaw-skill/` is canonical while `skills/` is rendered/distribution output
- [~] Remove stale transition notes that do not help public users
- [x] Add architecture notes about why Feishu Bitable is the current source of truth

## 9. Release packaging

- [ ] Tag a first public milestone
- [~] Prepare release notes for `v0.x` (template added)
- [x] Define support level: experimental / alpha / beta
- [~] Publish demo instance or screenshots-only landing page (placeholder asset path documented)
- [x] Verify installation from a clean machine using docs only

## Suggested release gate

Before making the repo public, the minimum recommended gate is:

1. secrets audit complete
2. license chosen
3. README polished
4. Vercel + Feishu docs verified from scratch
5. issue / contribution docs added
6. OpenClaw packaging story clarified
7. screenshots added

Right now, AIPanel has the documentation baseline plus repo-level contribution infrastructure for that work, and the remaining major gaps are mostly real demo assets, final policy choices, and optional deeper cleanup.
