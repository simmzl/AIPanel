# AIPanel v0 experimental launch draft

## Short version

AIPanel is now ready to be shared as an **experimental self-hostable v0 release**.

It is a small Feishu-first bookmarks and ops panel built around a simple idea:
**agents and humans should be able to operate the same structured data source.**

The browser UI is the human surface.
Feishu Bitable is the source of truth.
OpenClaw is the optional agent/operator layer.

## Suggested announcement copy

Today I’m opening up **AIPanel** as an experimental self-hostable project.

AIPanel is a lightweight bookmarks / ops panel backed by **Feishu Bitable**, with an **OpenClaw integration** so an agent can work on the same underlying dataset that the web UI uses.

Current release shape:

- React + Vite frontend
- Vercel-friendly deployment model
- Feishu Bitable-backed API layer
- simple password-protected access
- OpenClaw skill for natural-language bookmark operations

This is not positioned as a polished mass-market dashboard yet.
It is an opinionated, practical, **agent-first** system that already works and is now documented well enough for experimental public use.

Included in this release-candidate package:

- MIT license
- SECURITY.md
- contribution scaffolding
- Vercel deployment guide
- Feishu setup guide
- OpenClaw packaging/install documentation
- release-checklist and readiness docs
- architecture overview

Known limitations:

- still experimental
- Feishu-first rather than backend-agnostic
- OpenClaw skill is currently AIPanel-shaped rather than fully generic
- screenshots/demo assets are still being filled in

If you want a practical starting point for a **shared human + agent control surface over structured bookmark data**, this repo is ready to try.

## Suggested highlights list

- **Agent-first architecture**: UI and agent workflows share the same data source
- **Feishu Bitable as source of truth**: simple, inspectable, operationally friendly
- **Small deployment surface**: one Vercel project + one Feishu app + one table
- **OpenClaw integration included**: natural-language bookmark operations against the same dataset
- **Experimental but honest**: docs now describe what is ready and what is not

## Suggested release title options

- `AIPanel v0 experimental: Feishu-first agent bookmarks panel`
- `AIPanel v0.x experimental launch`
- `AIPanel: an agent-first Feishu Bitable panel (experimental public release)`

## Suggested release notes summary

This first public experimental release turns AIPanel into a credible self-hostable package baseline.
The repo now has clearer deployment docs, safer public-facing defaults, an explicit OpenClaw packaging stance, security guidance, architecture documentation, and a documented path toward screenshots/demo polish.
