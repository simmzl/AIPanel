# Security policy

## Supported release posture

AIPanel is currently published as an **experimental `v0.x` self-hostable project**.

Security fixes may be provided on the current main branch, but there is not yet a formal backport policy or long-term support matrix.

If you are running AIPanel in production-like conditions, you should:

- track the latest documented release candidate state
- review changes before deploying
- rotate your own credentials and secrets if you suspect exposure
- avoid treating this project as a hardened multi-tenant platform

## Reporting a vulnerability

Please **do not open a public GitHub issue for a suspected security vulnerability**.

Instead, report it privately to the maintainer with:

- a short description of the issue
- affected files or endpoints
- reproduction steps or proof of concept
- impact assessment if known
- any suggested mitigation

Current private reporting path:

- GitHub Security Advisories / private vulnerability reporting, if enabled for the repo
- or direct maintainer contact before public disclosure

If you only have the public repo surface available and no private reporting channel is obvious yet, open a minimal issue asking for a private contact path **without disclosing exploit details**.

## Response expectations

Because AIPanel is still in an early experimental release phase, response times are best-effort rather than SLA-backed.

The intended posture is:

1. acknowledge a credible report
2. reproduce and assess severity
3. prepare a fix or mitigation
4. publish a coordinated patch note when practical

## Scope notes

Please report issues such as:

- auth bypass or token handling flaws
- secret leakage in repo, build output, or runtime responses
- unsafe write surfaces in the API
- injection or SSRF-style issues in metadata fetching or server routes
- privilege or access control problems in Feishu/OpenClaw-related flows

Out of scope for bounty-style expectations:

- missing enterprise features
- self-hosting misconfiguration in a deployer’s own environment
- vulnerability reports without actionable reproduction detail

## Hardening notes for operators

If you deploy AIPanel yourself:

- keep `JWT_SECRET`, `ACCESS_PASSWORD`, and Feishu credentials out of git
- use placeholder-only env files in the repo
- prefer least-privilege Feishu app permissions
- review any custom debug scripts before local use
- treat the OpenClaw skill as a live write path to your Bitable data

## Disclosure

Please allow reasonable time for validation and remediation before public disclosure.

For an experimental first public release, the goal is responsible handling and clear operator guidance, not a heavy formal security program.
