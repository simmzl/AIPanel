# AIPanel

AIPanel 是一个基于 **飞书多维表格（Feishu Bitable）** 的轻量书签与运营面板，目标是让 **人和 AI Agent 共同操作同一份结构化数据**。

[English README](./README.md)

## 它是什么

AIPanel 把三件事情合在了一起：

- **一个轻量的 Web 面板**，用于浏览和维护书签
- **一个由飞书多维表格承载的数据模型**，作为唯一数据来源
- **一条可由 AI 驱动的安装 / 运维路径**，用于初始化和日常维护

浏览器是给人用的界面。  
飞书多维表格是数据来源。  
OpenClaw 是这个仓库里默认文档化的 Agent 路径。  
Claude Code、Cursor 以及类似的 AI 编码代理，只要能读取本仓库并复用 skill 目录，也可以驱动同一条安装流程。

## 为什么是 AIPanel

大多数书签面板是 UI-first，AIPanel 更偏向数据与工作流优先：

- **统一数据来源**：书签、分类和顺序都放在飞书多维表格里
- **Agent-first 工作流**：同一份数据既能给人维护，也能给 AI Agent 操作
- **务实的界面**：重点是快、轻、顺手，适合浏览、整理和维护
- **部署面小**：一个 Vercel 项目、一个飞书应用、一张多维表格即可跑起来
- **支持 AI 安装**：仓库内置 installer skill 和 installer CLI 主路径，而不只是长篇手动文档

## 预览

| 桌面端 | 移动端 |
| --- | --- |
| ![AIPanel desktop home](docs/assets/screenshots/desktop-home.png) | ![AIPanel mobile home](docs/assets/screenshots/mobile-home.png) |

## 核心能力

- 密码保护的 Web 面板
- 书签浏览与搜索
- 置顶与最近访问
- 分类标签与拖拽排序
- 新建 / 编辑 / 删除书签流程
- 目标链接元数据抓取
- 基于飞书多维表格的 API 层
- 面向同一份数据集的 Agent 操作能力
- 面向 AI 的一句话安装路径

## 安装方式

AIPanel 支持两条安装路径：

### 1. 推荐：AI 辅助安装

适合希望让 Agent 帮你完成 Feishu 数据源创建、env 组装、Vercel 部署和最终校验的场景。

### 2. 手动安装

适合希望自己直接通过 Vercel 部署，并手动配置 Feishu 与环境变量的场景。

两条路径最终会落到同一套架构和 env 模型。

## 快速开始：AI 辅助安装

### 第 1 步：clone 仓库

```bash
git clone https://github.com/simmzl/AIPanel.git
cd AIPanel
```

### 第 2 步：在本地安装 installer skill

如果你使用 OpenClaw，可以直接执行：

```bash
bash integrations/install-scripts/install-openclaw-installer-skill.sh
```

默认安装路径：

```bash
~/.openclaw/skills/aipanel-installer
```

如果你的 AI Agent 使用别的本地 skill 目录，也可以直接复制渲染后的 installer skill：

```bash
skills/aipanel-installer/
```

### 第 3 步：确保必要能力已经授权

在让 Agent 开始安装前，请先确保：

- **Feishu / Lark 能力可用**
- **Vercel 部署能力可用**

建议：

- 安装并完成 Feishu CLI 授权：<https://github.com/larksuite/cli>
- 确保 Vercel CLI 或相应部署能力已经登录

### 第 4 步：告诉你的 Agent 开始安装

示例：

- **OpenClaw**：`开始创建 AIPanel`
- **Claude Code / Cursor / 类似 Agent**：让它们从这条主路径继续安装：

```bash
node scripts/installer/cli.mjs continue
```

如果需要真实创建 Feishu 或 Vercel 资源，则执行：

```bash
node scripts/installer/cli.mjs continue --execute
```

### 第 5 步：只在需要时提供最后两个输入项

安装器会尽量少提问。

通常情况下，用户只需要提供：

- `ACCESS_PASSWORD`
- 与自动识别到的 `FEISHU_APP_ID` 对应的 `FEISHU_APP_SECRET`

### 第 6 步：让安装器完成剩余流程

安装器会继续处理：

- preflight
- Feishu Bitable 创建
- env 组装
- Vercel 部署
- 最终 verify

相关文档：

- [一句话安装器方案](docs/product/aipanel-one-command-installer-plan.md)
- [安装器 Phase 1](docs/product/aipanel-installer-phase-1.md)
- [OpenClaw 集成](docs/integrations/openclaw.md)

## 手动部署

如果你更偏好手动路径，也可以直接部署 Web 应用并手动配置所需 env。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/simmzl/AIPanel)

规范 env：

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

手动部署文档：

- [Vercel 部署](docs/deploy/vercel.md)
- [飞书 app + Bitable 配置](docs/datasource/feishu-bitable.md)
- [故障排查](docs/troubleshooting.md)

## Agent 集成

不用 OpenClaw，也可以直接使用 AIPanel。

OpenClaw 是这个仓库里默认文档化的 Agent 集成方式，但并不是唯一选择。  
Claude Code、Cursor 和类似 AI 编码代理，也可以复用同一条安装主路径。

当前仓库为 OpenClaw 提供两个 agent-facing skills：

- `aipanel-installer` —— 负责创建、继续、恢复和验证安装流程
- `aipanel-feishu-bitable` —— 负责部署后的 Feishu Bitable 数据操作

在仓库根目录安装这两个 OpenClaw skills：

```bash
bash integrations/install-scripts/install-openclaw-installer-skill.sh
bash integrations/install-scripts/install-openclaw-skill.sh
```

可选 render：

```bash
node scripts/render-openclaw-installer-skill.mjs
node scripts/render-openclaw-skill.mjs
```

## 架构

![AIPanel architecture](docs/assets/diagrams/aipanel-architecture.svg)

AIPanel 使用一套 Feishu-first 架构：

- **Vercel** 承载 Web 应用和 API
- **飞书多维表格** 是唯一数据来源
- **AI Agent** 在需要时负责安装和数据操作流程
- **浏览器 UI** 是给人使用的控制面

## 仓库导览

如果你第一次看这个仓库，建议从这里开始：

- [文档索引](docs/README.md)
- [架构概览](docs/architecture.md)
- [OpenClaw 集成](docs/integrations/openclaw.md)
- [Contributing](./CONTRIBUTING.md)

运维 / 实施类文档：

- [故障排查](docs/troubleshooting.md)
- [开源就绪清单](docs/product/open-source-readiness-checklist.md)
- [路线图](docs/product/roadmap.md)

## 项目状态

**许可证：** MIT  
**部署目标：** Vercel + 飞书多维表格

当前状态：

- Web 面板已经可以作为真实产品部署和使用
- 飞书多维表格是唯一数据来源
- OpenClaw skill 路径已经可用
- installer skill 和 installer CLI 主路径已经可用于 AI 辅助安装

## 环境变量命名说明

新的配置请统一使用：

- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`

公开文档和部署流程里，请统一使用这两个名字。

## 总结

AIPanel 是一个务实的书签面板，适合希望让人和 AI Agent 通过轻量 Web UI 与一套飞书数据源协同工作的团队或个人。
