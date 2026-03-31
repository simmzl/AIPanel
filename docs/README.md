# AIPanel docs

AIPanel is a Feishu-first bookmarks and operations panel where humans and agents work on the same structured dataset.

## Preview

| Desktop | Mobile |
| --- | --- |
| ![AIPanel desktop home](./assets/screenshots/desktop-home.png) | ![AIPanel mobile home](./assets/screenshots/mobile-home.png) |

Quick links:

- [Architecture diagram](./assets/diagrams/aipanel-architecture.svg)
- [Login screenshot](./assets/screenshots/login-screen.png)
- [Edit bookmark screenshot](./assets/screenshots/desktop-edit-bookmark.png)

## Start here

- [Deploy on Vercel](./deploy/vercel.md)
- [Feishu app + Bitable setup](./datasource/feishu-bitable.md)
- [OpenClaw integration](./integrations/openclaw.md)
- [Troubleshooting](./troubleshooting.md)

## Architecture at a glance

![AIPanel architecture](./assets/diagrams/aipanel-architecture.svg)

The current deployment shape is simple:

- one Vercel project
- one Feishu app
- one Bitable app + table
- optional OpenClaw skill install

## Core capabilities

- bookmark browsing and search
- category ordering
- create / edit / delete flows
- shared data model between web UI and OpenClaw
- Feishu Bitable-backed source of truth

## Suggested reading order

1. [README](../README.md)
2. [Deploy on Vercel](./deploy/vercel.md)
3. [Feishu app + Bitable setup](./datasource/feishu-bitable.md)
4. [OpenClaw integration](./integrations/openclaw.md)
5. [Troubleshooting](./troubleshooting.md)

## Product / planning docs

- [Open-source readiness checklist](./product/open-source-readiness-checklist.md)
- [Roadmap](./product/roadmap.md)
- [Maintainer expectations](./product/maintainer-expectations.md)
- [Release notes template](./product/release-notes-template.md)
- [First public release plan](./product/first-public-release.md)
- [Public release checklist](./product/release-candidate-checklist.md)
- [Public release audit](./product/public-release-audit.md)
- [Release announcement draft](./product/release-announcement-v0-experimental.md)

## Assets

- [Screenshot index](./assets/screenshots/README.md)
- [Demo capture runbook](./assets/demo/README.md)
