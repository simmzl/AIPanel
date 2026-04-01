# Open-source readiness checklist

This checklist tracks what still matters before AIPanel feels clean, credible, and easy for strangers to try.

## Status legend

- `[ ]` not started
- `[~]` partially done
- `[x]` done

## 1. Product presentation

- [x] Rewrite README around AIPanel positioning
- [x] Make the agent-first / human-UI-second framing explicit
- [~] Add stable screenshots for desktop and mobile views
- [ ] Add short demo GIFs for core flows
- [x] Add architecture diagram
- [x] Add deploy badge / Vercel deploy button

## 2. Security and hygiene

- [x] Run a first-pass repo secrets audit for current tree and history
- [x] Verify `.env*` examples contain placeholders only
- [x] Review git history for accidentally committed credentials or fixed internal-only endpoints
- [ ] Remove or rotate any leaked identifiers if discovered
- [x] Keep required envs documented in one place
- [x] Remove the live debug-write endpoint from the deployed API surface and keep any remaining smoke-test flow local-only
- [x] Add a short security policy / reporting path
- [x] Add a first-pass public release audit doc

## 3. Environment and configuration

- [x] Normalize canonical env names around `FEISHU_BITABLE_*`
- [x] Remove older env alias compatibility from code and docs
- [ ] Add runtime env validation helper with clearer startup diagnostics if needed
- [x] Confirm docs, examples, and deploy guides use canonical env names

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
- [x] Add Vercel deploy button
- [~] Decide whether the first public version officially supports only Vercel or multiple hosts
- [x] Add troubleshooting section for common deploy failures

## 6. OpenClaw / agent integration packaging

- [x] Document current OpenClaw integration clearly
- [x] Document current install path and installer script
- [ ] Split the current AIPanel-oriented skill from a broader reusable Feishu-Bitable template
- [x] Decide packaging format for the current release (`integrations/` authoring template + `skills/` rendered distribution folder)
- [~] Remove fixed identifiers from the canonical skill source and keep rendered/configured copies explicit
- [x] Add a short compatibility note for the current supported OpenClaw install posture
- [x] Document and enforce the `skills/` vs `integrations/openclaw-skill/` boundary

## 7. Community / contribution readiness

- [x] Add final `LICENSE`
- [x] Add `CONTRIBUTING.md`
- [x] Add `.github/ISSUE_TEMPLATE/`
- [x] Add pull request template
- [x] Add code of conduct
- [x] Add maintainer expectations / review policy

## 8. Technical cleanup

- [~] Keep trimming internal or historical wording where it weakens public presentation
- [~] Review fixed URLs and example tokens in docs and skill references
- [x] Document that `integrations/openclaw-skill/` is canonical while `skills/` is rendered output
- [~] Remove stale transition notes that do not help public users
- [x] Explain why Feishu Bitable is the current canonical data source

## 9. Release packaging

- [ ] Tag a first public milestone
- [~] Prepare release notes for `v0.x`
- [x] Define support level as experimental
- [~] Publish demo instance or screenshots-only landing page
- [x] Verify installation from a clean machine using docs only

## Suggested release gate

Before broad public rollout, the minimum recommended gate is:

1. secrets audit complete
2. license chosen
3. README polished
4. Vercel + Feishu docs verified from scratch
5. issue / contribution docs added
6. OpenClaw packaging story clarified
7. screenshots added

Right now, the biggest remaining gaps are real demo assets, a few final policy choices, and optional deeper cleanup.
