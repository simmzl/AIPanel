# AIPanel v0 experimental launch draft

## One-line positioning

**AIPanel is an experimental self-hostable, Feishu-first bookmarks and lightweight ops panel where humans and agents operate the same structured data source.**

## Short version

AIPanel is now ready to be shared as an **experimental self-hostable v0.x release**.

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

This is not a polished mass-market dashboard yet.
It is an opinionated, practical, **agent-first** system that already works and is now documented well enough for experimental public use.

Included in this release package:

- MIT license
- SECURITY.md
- contribution scaffolding
- Vercel deployment guide
- Feishu setup guide
- OpenClaw packaging/install documentation
- release-checklist and readiness docs
- architecture overview
- screenshot/demo asset capture plan for the first public pass

Known limitations:

- still experimental
- Feishu-first rather than backend-agnostic
- OpenClaw skill is currently AIPanel-shaped rather than fully generic
- screenshots/demo assets may still be placeholder-backed depending on exact release timing

If you want a practical starting point for a **shared human + agent control surface over structured bookmark data**, this repo is ready to try.

## Suggested highlights list

- **Agent-first architecture**: UI and agent workflows share the same data source
- **Feishu Bitable as source of truth**: simple, inspectable, operationally friendly
- **Small deployment surface**: one Vercel project + one Feishu app + one table
- **OpenClaw integration included**: natural-language bookmark operations against the same dataset
- **Experimental but honest**: docs clearly describe what is ready and what is not

## Suggested release title options

- `AIPanel v0 experimental: Feishu-first agent bookmarks panel`
- `AIPanel v0.x experimental launch`
- `AIPanel: an agent-first Feishu Bitable panel (experimental public release)`

## Suggested release notes summary

This first public experimental release turns AIPanel into a credible self-hostable package baseline.
The repo now has clearer deployment docs, a tighter public README, safer public-facing defaults, an explicit OpenClaw packaging stance, security guidance, architecture documentation, release/readiness docs, and a documented path toward screenshots/demo polish.

## Suggested short social-post version

I’m opening up **AIPanel** as an experimental self-hostable v0 release.

It’s a small **Feishu-first bookmarks + ops panel** built around one core idea: **humans and agents should be able to operate the same structured data source**.

- React + Vite frontend
- Feishu Bitable as source of truth
- Vercel-friendly deployment
- OpenClaw integration for natural-language bookmark operations

Still experimental, but now documented and packaged well enough for public testing.
