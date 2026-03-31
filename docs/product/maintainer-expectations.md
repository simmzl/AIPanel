# Maintainer expectations

This document explains the current maintainer posture for AIPanel during the experimental public-release phase.

## Review posture

At this stage, maintainers will usually prefer:

- small PRs over large rewrites
- docs-backed changes over assumption-heavy changes
- low-regression improvements over ambitious refactors
- preserving current self-hosted/operator usability

## What maintainers are likely to merge quickly

- README and docs clarity fixes
- deployment/onboarding improvements
- troubleshooting notes
- low-risk UI polish
- packaging cleanup that reduces project-specific coupling
- security and hygiene fixes

## What usually needs discussion first

- auth model changes
- switching away from Feishu Bitable as the canonical source of truth
- large repo restructures
- big abstractions that are not needed for the current release
- changes that remove current compatibility bridges without a migration story

## Release posture

The current target is an experimental `v0.x` public release.

That means maintainers will bias toward:

- credibility
- installability
- readability
- operational safety

not toward feature breadth.

## Compatibility posture

For the current release window:

- canonical env names should be used in new code and docs
- temporary compatibility aliases may remain where they protect current operators
- the in-tree OpenClaw integration may stay AIPanel-shaped until a later cleanup pass

## Contributor advice

The highest-value contribution right now is usually not a giant new subsystem.

It is making the repo easier for the next stranger to:

- understand
- deploy
- trust
- troubleshoot
