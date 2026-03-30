# Open-source readiness checklist

This checklist is for moving AIPanel from a working private-alpha repo to a credible public open-source release.

## Status legend

- `[ ]` not started
- `[~]` partially done
- `[x]` done

## 1. Product positioning and repo presentation

- [x] Rewrite README around AIPanel positioning
- [x] Make the agent-first / human-UI-second framing explicit
- [~] Add stable screenshots for desktop and mobile views
- [ ] Add short demo GIFs for core flows
- [ ] Add public-facing architecture diagram
- [ ] Add repo badges / deploy badge once release shape is finalized

## 2. Secrets and security hygiene

- [ ] Run full repo secrets audit before public release
- [ ] Verify `.env*` examples contain placeholders only
- [ ] Review git history for accidentally committed credentials or fixed internal-only endpoints
- [ ] Remove or rotate any leaked identifiers if discovered
- [~] Keep required envs documented in one place
- [ ] Review whether `api/debug-feishu-write.ts` should be removed, gated, or excluded before public launch
- [ ] Add a short security policy / reporting path if the repo becomes public

## 3. Environment and configuration validation

- [x] Normalize canonical env names around `FEISHU_BITABLE_*`
- [x] Keep temporary legacy aliases documented as transitional only
- [ ] Add runtime env validation helper with clearer startup diagnostics if needed
- [ ] Confirm all docs, examples, and deploy guides use canonical env names only
- [ ] Decide whether future public release keeps compatibility aliases or removes them

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
- [ ] Add Vercel deploy button when env story is finalized
- [ ] Decide whether the first public release should support only Vercel or multiple hosts
- [ ] Add troubleshooting section for common deploy failures

## 6. OpenClaw / agent integration packaging

- [x] Document current OpenClaw integration clearly
- [x] State that the current skill is project-specific / private-alpha oriented
- [x] Document current install path and installer script
- [ ] Split private-alpha fixed-ID skill from public reusable template
- [ ] Decide packaging format for public release (`integrations/`, `skills/`, package artifact, or both)
- [ ] Remove or parameterize project-specific fixed identifiers before public launch
- [ ] Add a short compatibility matrix for supported OpenClaw versions if needed

## 7. Community / contribution readiness

- [ ] Add `LICENSE`
- [ ] Add `CONTRIBUTING.md`
- [ ] Add `.github/ISSUE_TEMPLATE/`
- [ ] Add pull request template
- [ ] Add code of conduct if public contributions are expected
- [ ] Add maintainer expectations / review policy if desired

## 8. Technical cleanup before opening the repo

- [ ] Review hard-coded product text for internal/private-only language
- [ ] Review fixed URLs and example tokens in docs and skill references
- [ ] Decide whether `skills/` and `integrations/openclaw-skill/` should both exist, or whether one should become generated/distribution output
- [ ] Remove stale private-alpha migration notes that do not help public users
- [ ] Add architecture notes about why Feishu Bitable is the current source of truth

## 9. Release packaging

- [ ] Tag a first public milestone
- [ ] Prepare release notes for `v0.x`
- [ ] Define support level: experimental / alpha / beta
- [ ] Publish demo instance or screenshots-only landing page
- [ ] Verify installation from a clean machine using docs only

## Suggested release gate

Before making the repo public, the minimum recommended gate is:

1. secrets audit complete
2. license chosen
3. README polished
4. Vercel + Feishu docs verified from scratch
5. issue / contribution docs added
6. OpenClaw packaging story clarified
7. screenshots added

Right now, AIPanel has the **documentation baseline** for that work, but not the full release gate yet.
