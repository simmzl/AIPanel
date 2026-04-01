# AIPanel Installer Prompt Patterns

## Missing password and app secret

现在还差最后两项信息，我就可以继续部署：
1. AIPanel 访问密码
2. Feishu App Secret

注意：这里的 App Secret 需要对应我自动识别到的 Feishu App ID：`<APP_ID>`。

## Missing app secret only

现在只差 Feishu App Secret。
请提供 **Feishu App ID `<APP_ID>` 对应的 App Secret**。

## Missing password only

现在只差 AIPanel 访问密码。你发我密码后，我就继续完成部署。

## Preflight blocked

我可以继续创建 AIPanel，但当前环境还有阻塞项：
- <BLOCKERS>

这些问题解决后，我就能继续推进。

## Resume status

当前已经完成：<DONE>
现在卡在：<CURRENT_STAGE>
下一步需要：<NEXT_ACTION>

## Success

AIPanel 已创建完成。
面板地址：<URL>
我已经完成了 Feishu 数据源创建、配置组装和 Vercel 部署。

## Verify protected

AIPanel 已部署上线，地址是：<URL>
不过当前访问返回 401，说明站点在线，但前面还有一层访问保护。
