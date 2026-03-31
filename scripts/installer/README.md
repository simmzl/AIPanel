# Installer scripts skeleton

这一目录放 AIPanel 安装器的脚本层骨架。

当前已经有：

- `state.mjs`：安装器状态读写
- `secrets.mjs`：JWT secret 生成
- `preflight.mjs`：本地命令级 preflight stub
- `feishu.mjs`：Feishu Bitable 创建执行器（当前已支持 dry-run 和真实调用骨架）
- `progress.mjs`：安装器进度输出
- `cli.mjs`：最小命令行入口

当前可用命令：

- `npm run installer:init`
- `npm run installer:preflight`
- `npm run installer:jwt`
- `npm run installer:show`
- `node scripts/installer/cli.mjs create-feishu --dry-run`
- `node scripts/installer/cli.mjs create-feishu --execute`

说明：

- `--dry-run` 只展示将要发出的 Feishu 请求，不会真正创建资源
- `--execute` 会真实创建 Feishu Bitable 资源
- 如果 state 里已经有创建结果，当前实现会先避免重复创建

当前还没有：

- 真实 Vercel 部署实现
- 密码交互与完整恢复流
- create-feishu 的幂等与资源命名策略

目的不是一次做完，而是把 installer 从文档推进到真正可执行的 repo 结构。
