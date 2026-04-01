---
name: aipanel-installer
description: Create, continue, recover, and verify AIPanel installations through a conversational one-command flow. Use when a user wants to start creating AIPanel, deploy a new AIPanel instance, resume an interrupted installation, check installer progress, or finish the final setup inputs needed before deployment.
---

# AIPanel Installer

Drive the AIPanel installer as a conversational workflow.

This skill is responsible for the **instance creation path**:

- start a new AIPanel installation
- continue a paused installation
- report installer progress
- collect the final user inputs
- finish Vercel deployment
- verify the deployed result

Do **not** use this skill for normal bookmark/category CRUD on an already-installed panel. That remains the job of `aipanel-feishu-bitable`.

## Workflow

When a user says things like:

- 开始创建 AIPanel
- 创建 AIPanel
- 安装 AIPanel
- 继续 AIPanel 安装
- 恢复 AIPanel 安装
- 看看 AIPanel 装到哪一步了

follow this sequence:

1. Read current installer state with `node scripts/installer/cli.mjs show`
2. If no state exists yet, initialize with `node scripts/installer/cli.mjs init`
3. Run preflight with `node scripts/installer/cli.mjs preflight`
4. Run `node scripts/installer/cli.mjs run` to auto-advance configuration
5. If Feishu data source is still missing, run `node scripts/installer/cli.mjs create-feishu --execute`
6. Re-check state
7. If final user inputs are missing, ask only for the missing ones
8. Once ready, run `node scripts/installer/cli.mjs create-vercel --dry-run`
9. If dry-run is ready, run `node scripts/installer/cli.mjs create-vercel --execute`
10. Verify the deployment result before declaring success

## Final user inputs

The installer should minimize questions.

By default, only ask the user for:

- `ACCESS_PASSWORD`
- `FEISHU_APP_SECRET`

The installer should:

- auto-generate `JWT_SECRET`
- auto-detect `FEISHU_APP_ID`
- auto-create `FEISHU_BITABLE_APP_TOKEN`
- auto-create `FEISHU_BITABLE_TABLE_ID`
- auto-create `FEISHU_BITABLE_SOURCE_URL`

## Asking for Feishu App Secret

When asking for `FEISHU_APP_SECRET`, always include the detected `FEISHU_APP_ID` in the message.

Use wording equivalent to:

> 请提供与我自动识别到的 Feishu App ID `cli_xxx` 对应的 App Secret。

Never ask for an App Secret without naming the App ID it must match.

If `FEISHU_APP_ID` is not available, do not pretend the secret request is unambiguous. Report the block and ask the user to fix the local Feishu/Lark auth context first.

## Progress reporting

Keep user-visible updates short and stage-based.

Good examples:

- 前置检查通过，正在创建 Feishu 数据源。
- Feishu 数据源已经创建完成，现在只差访问密码和 App Secret。
- Vercel 部署已完成，正在验证面板是否可访问。

Avoid dumping raw CLI logs unless the user explicitly asks.

## Recovery rules

Prefer resume over restart.

- If Feishu app/table/source URL already exist in installer state, reuse them.
- If only final inputs are missing, ask for them instead of re-running earlier stages.
- If Vercel project info already exists, continue from deploy-related steps when possible.
- If the user returns later and says “继续”, inspect state first and continue from the current stage.

Read details as needed:

- `references/flow.md`
- `references/recovery.md`
- `references/prompts.md`

## Success criteria

Before claiming completion, confirm at least:

- a deployment URL exists
- the deploy step succeeded
- the installer state contains the final deployment URL

If verification is incomplete, say so explicitly rather than overstating success.
