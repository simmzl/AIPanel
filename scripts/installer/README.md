# Installer scripts skeleton

这一目录放 AIPanel 安装器的脚本层骨架。

当前已经有：

- `state.mjs`：安装器状态读写
- `secrets.mjs`：JWT secret 生成
- `preflight.mjs`：本地命令级 preflight stub
- `feishu.mjs`：Feishu Bitable 创建执行器（当前已支持 dry-run、execute、repair）
- `lark-auth.mjs`：从 `lark-cli auth status` 推断可复用信息
- `vercel.mjs`：Vercel 项目 / env / deploy 执行器骨架
- `progress.mjs`：安装器进度输出
- `cli.mjs`：最小命令行入口

当前可用命令：

- `npm run installer:init`
- `npm run installer:preflight`
- `npm run installer:jwt`
- `npm run installer:show`
- `npm run installer:create-feishu:dry`
- `npm run installer:create-feishu`
- `npm run installer:vercel:dry`
- `npm run installer:vercel`
- `npm run installer:run`

说明：

- `--dry-run` 只展示将要发出的请求，不会真正创建资源
- `--execute` 会真实创建/更新资源
- `create-feishu --repair` 可在已有 base/table 上继续补 schema
- `create-vercel` 会在真执行前检查关键 env 是否齐全
- `FEISHU_APP_ID` 会优先尝试从 `lark-cli auth status` 自动推断
- `run` 会自动推进到“只剩最后人工输入项”为止

当前还没有：

- 完整的 Vercel 幂等 / 恢复策略
- 最终的人机交互输入层（ACCESS_PASSWORD / FEISHU_APP_SECRET）
- 完整的 create-feishu 命名 / 清理策略

目的不是一次做完，而是把 installer 从文档推进到真正可执行的 repo 结构。
