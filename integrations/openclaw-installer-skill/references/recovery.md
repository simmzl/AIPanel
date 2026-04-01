# AIPanel Installer Recovery

## Reuse before recreate

If installer state already includes:
- `feishu.appToken`
- `feishu.tableId`
- `feishu.sourceUrl`

then do not recreate Feishu resources unless the user explicitly asks to repair or recreate them.

## Common recovery cases

### Feishu complete, waiting for user inputs
Ask only for:
- `ACCESS_PASSWORD`
- `FEISHU_APP_SECRET`

### Feishu complete, deploy failed
Keep the Feishu state and continue with deploy-oriented steps.

### User returns later
Run `show`, summarize current stage, and continue from there.

### App Secret request
If `FEISHU_APP_ID` is known, ask for the matching App Secret.
If `FEISHU_APP_ID` is unknown, report the block instead of asking ambiguously.

## Error handling style

Translate errors into short human language:
- what failed
- whether anything was preserved
- what the next action is

Do not flood the user with raw command output unless they ask for debug details.
