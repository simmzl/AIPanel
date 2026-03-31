# AIPanel one-command installer implementation plan

Status: draft  
Authoring intent: turn AIPanel from a repo + docs experience into a **one-command creation flow** driven by OpenClaw + Feishu + Vercel.

---

## 1. Product goal

The end goal is not just:

- a deployable AIPanel repo
- a readable README
- a manual setup flow

The real goal is:

> After installing the required Feishu tooling and the AIPanel skill, the user can tell OpenClaw: **“开始创建 AIPanel”**, and OpenClaw completes the setup with minimal questioning.

That means the product to ship is really:

1. **AIPanel app**
2. **AIPanel installer flow**
3. **AIPanel operator skill**

The installer flow is the key differentiator.

---

## 2. Target user experience

## Ideal user journey

### Preconditions

The user has already:

- installed and authenticated the required Feishu tooling / CLI / integrations
- installed the AIPanel skill
- installed or authorized whatever Vercel deployment path is required

### Trigger

User says:

> 开始创建 AIPanel

### OpenClaw does the rest

OpenClaw should:

1. verify prerequisites
2. create the Feishu Bitable app and table
3. create the required schema/fields
4. derive the Bitable source URL
5. generate `JWT_SECRET`
6. prepare a Vercel deployment
7. inject all required environment variables
8. ask the user for exactly one human input if possible:
   - the access password
9. finish deployment
10. return the deployed AIPanel URL and a concise success summary

### Final resulting configuration

The completed deployment should end up with:

```env
APP_NAME=AIPanel
ACCESS_PASSWORD=change-this-to-a-real-password
JWT_SECRET=change-this-to-a-long-random-secret
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=xxx
FEISHU_BITABLE_APP_TOKEN=bascn_xxx
FEISHU_BITABLE_TABLE_ID=tblxxxxxx
FEISHU_BITABLE_SOURCE_URL=https://your-domain.feishu.cn/base/xxxxxxxx?table=tblxxxxxx
```

### Design principle

The user should not need to manually:

- create Bitable schema step by step
- look up app token / table id by hand
- generate a JWT secret manually
- read a long deploy tutorial first

Docs remain useful, but they become fallback/reference, not the primary installation surface.

---

## 3. Installer philosophy

## Main principle

The installer should be:

- **conversational**
- **stateful**
- **minimal-question**
- **safe**
- **recoverable**

## What it should ask the user

Only ask when truly needed.

The ideal final question count is:

1. maybe confirm project name (optional, default `AIPanel`)
2. ask for access password

Everything else should be auto-derived.

## What it should not ask if it can discover automatically

- Feishu app credentials if already available in the environment/tooling
- Bitable app token / table id if it just created them
- source URL if it can construct it from the created resource
- JWT secret if the system can generate it

---

## 4. Superpowers task decomposition

This section translates the goal into an implementation plan using a “superpowers” lens:

- **Observe** — inspect current system state and prerequisites
- **Create** — provision new resources
- **Configure** — wire resources together
- **Deploy** — publish runnable infrastructure
- **Verify** — confirm success
- **Recover** — handle partial failure cleanly
- **Explain** — report status to the user simply

---

## 5. Superpower 1 — Observe

Goal: determine whether the environment is ready to run the one-command flow.

## Responsibilities

The installer must detect:

- Is Feishu tooling/auth available?
- Is Vercel deployment capability available?
- Is the AIPanel repo/skill present and usable?
- Are required secrets discoverable already?
- Is there already an existing AIPanel instance or partial install?

## Required checks

### Feishu side

- current Feishu identity / auth validity
- ability to create a Bitable app
- ability to create a table
- ability to create fields / schema
- ability to read back the created metadata

### Vercel side

- Vercel auth available
- ability to create or deploy a project
- ability to set environment variables
- ability to retrieve deployment URL

### Local/project side

- skill installed
- installer script / implementation available
- repo version compatible with installer

## Deliverable

A single structured “preflight” result, for example:

```json
{
  "feishu": "ready",
  "vercel": "ready",
  "skill": "ready",
  "repo": "ready",
  "warnings": []
}
```

## Notes

If preflight fails, the user should get a short human message, not a wall of technical logs.

Example:

> 我能继续创建 AIPanel，但当前还没有可用的 Vercel 登录状态。先完成 Vercel 授权后，我再继续。

---

## 6. Superpower 2 — Create

Goal: provision the Feishu-side data source automatically.

## Responsibilities

The installer should create:

1. a Feishu Bitable app
2. the main AIPanel table
3. the required fields/schema
4. any required default options (for example category field options if needed)

## Required schema

Current schema target:

- `标题`
- `副标题`
- `链接`
- `图标`
- `分类`
- `排序`
- `分类排序`

## Open question

Need to decide whether the installer should also:

- create seed example rows
- create a default category set
- create a placeholder row immediately

### Recommendation

For the first installer version:

- create schema
- optionally create a small public-safe starter dataset
- avoid asking the user schema questions

## Deliverables

The Create phase should return:

- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`
- `FEISHU_BITABLE_SOURCE_URL`

---

## 7. Superpower 3 — Configure

Goal: gather and normalize all environment inputs needed for deployment.

## Required final envs

```env
APP_NAME=AIPanel
ACCESS_PASSWORD=...
JWT_SECRET=...
FEISHU_APP_ID=...
FEISHU_APP_SECRET=...
FEISHU_BITABLE_APP_TOKEN=...
FEISHU_BITABLE_TABLE_ID=...
FEISHU_BITABLE_SOURCE_URL=...
```

## Configuration sources

### Auto-discovered

- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`
- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`
- `FEISHU_BITABLE_SOURCE_URL`

### Generated

- `JWT_SECRET`

### User-provided

- `ACCESS_PASSWORD`

### Defaulted

- `APP_NAME=AIPanel`

## Recommendation

The installer should build a single in-memory config object before deploy, for example:

```json
{
  "APP_NAME": "AIPanel",
  "ACCESS_PASSWORD": "***",
  "JWT_SECRET": "***",
  "FEISHU_APP_ID": "cli_xxx",
  "FEISHU_APP_SECRET": "***",
  "FEISHU_BITABLE_APP_TOKEN": "bascn_xxx",
  "FEISHU_BITABLE_TABLE_ID": "tblxxxxxx",
  "FEISHU_BITABLE_SOURCE_URL": "https://..."
}
```

This makes deploy/report/retry much easier.

---

## 8. Superpower 4 — Deploy

Goal: create and publish a working AIPanel instance on Vercel.

## Responsibilities

The installer should:

1. create a new Vercel project or reuse a suitable deployment target
2. inject all required environment variables
3. deploy the AIPanel app
4. retrieve the final deployment URL

## Required deployment behaviors

- deterministic env injection
- idempotent retry if deployment partially failed
- clear reporting if Vercel auth/project creation/env writing fails

## Open decision

Need to decide whether the installer should:

### Option A — always create a fresh Vercel project
Pros:
- simpler mental model
- fewer branching cases

Cons:
- less flexible for advanced users

### Option B — allow reuse of an existing project
Pros:
- more flexible

Cons:
- more prompts / more ambiguity

### Recommendation

For v1 installer flow:

- prefer **fresh project creation** as the default path
- allow advanced reuse only later

---

## 9. Superpower 5 — Verify

Goal: make sure the created AIPanel is actually usable.

## Verification checklist

After deploy, the installer should verify at least:

1. deployment URL exists
2. auth route responds
3. bookmark route responds with authenticated request
4. created Bitable is reachable by the deployed app

## Recommended output to user

A short final completion message:

> AIPanel 已创建完成。你的面板地址是：...
> 我已经完成了飞书多维表格创建、环境变量配置和 Vercel 部署。
> 你设置的访问密码已经生效。

Optional extra output:

- deployed URL
- Feishu source URL
- reminder that OpenClaw can now operate the same dataset

---

## 10. Superpower 6 — Recover

Goal: support partial failures without making the user restart from zero every time.

## Failure cases

### Case A — Feishu created, Vercel failed
Need to preserve:

- created app token
- table id
- source URL

So the next run can resume from deploy rather than recreating the data source.

### Case B — Vercel project created, env injection failed
Need to resume from env/deploy stage.

### Case C — password prompt interrupted
Need to resume from final config assembly.

## Recommendation

The installer should persist a local/session-scoped state object, for example:

```json
{
  "stage": "deploy",
  "feishu": {
    "appToken": "...",
    "tableId": "...",
    "sourceUrl": "..."
  },
  "vercel": {
    "projectId": "..."
  }
}
```

This avoids wasted resource duplication and makes retries sane.

---

## 11. Superpower 7 — Explain

Goal: keep the user informed without dumping implementation detail.

## Communication rules

### During progress

Send short milestone updates only when state changes:

- prerequisite check passed
- Bitable created
- schema created
- waiting for password
- deployment complete
- blocked by authorization or external setup

### Avoid

- long raw logs
- internal JSON blobs
- every micro-step as a user-facing message

### Good examples

- “我已经创建好多维表格，正在配置字段。”
- “现在只差一个步骤：请设置 AIPanel 的访问密码。”
- “Vercel 部署已完成，正在验证面板是否可访问。”

---

## 12. End-to-end installer flow

## Happy path

1. user says: `开始创建 AIPanel`
2. preflight checks run
3. Feishu Bitable app created
4. main table created
5. required schema created
6. app token / table id / source URL captured
7. JWT secret generated
8. user is asked for password
9. Vercel project created
10. env vars injected
11. deployment triggered
12. deployment verified
13. final URL returned

## Minimal-question version

The installer should ideally only interrupt the user for:

- password input

Everything else should be automatic.

---

## 13. Concrete workstreams

## Workstream A — Installer spec and state machine

Deliverables:

- installer stage model
- preflight contract
- resume contract
- final success contract

Tasks:

- define stages: `preflight -> create-feishu -> configure -> ask-password -> deploy-vercel -> verify -> done`
- define persisted state shape
- define retry/resume rules

## Workstream B — Feishu data source provisioning

Deliverables:

- create Bitable app
- create AIPanel table
- create schema fields
- return source URL/app token/table id

Tasks:

- identify exact Feishu API / CLI / tool path for each create step
- define idempotency rules
- define default seed behavior

## Workstream C — Secret + config assembly

Deliverables:

- generated JWT secret
- normalized env object
- password capture flow

Tasks:

- define secure secret generation method
- define where config object lives during run
- define how to mask secrets in logs/reports

## Workstream D — Vercel deployment automation

Deliverables:

- project creation path
- env injection path
- deploy path
- output URL retrieval

Tasks:

- identify deployment API / CLI path
- define fresh-project default
- define failure recovery behavior

## Workstream E — Verification and completion UX

Deliverables:

- post-deploy checks
- final success response
- failure messages for each stage

Tasks:

- define a deploy verification checklist
- define user-facing status messages
- define what gets surfaced vs hidden

## Workstream F — Skill UX

Deliverables:

- trigger phrase support
- installer-specific prompts/instructions
- operator-facing help text

Tasks:

- add/shape skill behaviors for `开始创建 AIPanel`
- route from operator intent to installer flow
- document expected prerequisites clearly

---

## 14. Recommended implementation order

## Phase 1 — Spec first

Do not start from README or random scripting.
First lock down:

- stage model
- required inputs
- required outputs
- resume behavior
- success definition

## Phase 2 — Feishu creation path

Because without a created data source, the rest is meaningless.

## Phase 3 — Vercel deploy path

Once Feishu creation is stable, wire deployment.

## Phase 4 — Conversational skill wrapper

Once the backend creation/deploy path works, wrap it in the final OpenClaw “start creating AIPanel” interaction.

## Phase 5 — Documentation update

Only after the installer flow exists, rewrite README so the **primary path** becomes:

1. install skill
2. say “开始创建 AIPanel”
3. answer password prompt
4. receive deployed URL

---

## 15. Open questions

These need explicit answers before implementation gets too deep:

1. What is the exact Feishu capability surface?
   - CLI?
   - OpenClaw Feishu tools?
   - both?

2. What is the exact Vercel deployment path?
   - Vercel CLI?
   - Vercel API?
   - browser-assisted flow?

3. Where do `FEISHU_APP_ID` and `FEISHU_APP_SECRET` come from at runtime?
   - already in local env?
   - discoverable from installed tooling?
   - must be requested from the user once?

4. Should installer create starter sample bookmarks?

5. Should installer always create a new Vercel project, or reuse existing ones?

6. Where should installer state be persisted during a partial run?

---

## 16. Definition of done

This initiative is done when all of the following are true:

1. user installs required Feishu tooling and AIPanel skill
2. user says `开始创建 AIPanel`
3. OpenClaw creates the Bitable app, table, and schema automatically
4. OpenClaw assembles all required envs automatically
5. OpenClaw asks for password only when needed
6. OpenClaw deploys AIPanel on Vercel automatically
7. OpenClaw returns a working URL
8. the deployed instance is usable without further manual env editing

---

## 17. Bottom line

The long-term product is not just “an AIPanel repo.”

It is:

> **A one-command AIPanel creation experience**

That means the installer flow should now be treated as a first-class product surface, not as an afterthought to the repo docs.
