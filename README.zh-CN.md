# AIPanel

一个以 Agent 为优先、由飞书多维表格驱动的轻量书签与运营面板。

[English README](./README.md)

AIPanel 的核心思路很简单：**Agent 和人都应该操作同一份结构化数据源**。
浏览器是给人用的界面。
飞书多维表格是事实来源。
OpenClaw 是可选的 Agent / 运维层。

## 预览

| 桌面端 | 移动端 |
| --- | --- |
| ![AIPanel desktop home](docs/assets/screenshots/desktop-home.png) | ![AIPanel mobile home](docs/assets/screenshots/mobile-home.png) |

更多素材：

- [登录页](docs/assets/screenshots/login-screen.png)
- [编辑书签视图](docs/assets/screenshots/desktop-edit-bookmark.png)
- [架构图](docs/assets/diagrams/aipanel-architecture.svg)

## 适合谁 / 不适合谁

AIPanel 比较适合你，如果：

- 你已经在用飞书多维表格，并希望在上面加一个 Web 面板
- 你希望让人和 Agent 操作同一份书签数据
- 你可以接受在 Vercel 上部署并配置环境变量

AIPanel 可能**不太适合**你，如果：

- 你想要一个零配置、完全不依赖 Feishu 的书签面板
- 你想要一个开箱即用、本地存储优先的通用书签产品

## 为什么是 AIPanel

大多数书签面板是 UI-first 的，但 AIPanel 不一样：

- **Agent-first 数据模型**：同一份书签数据既可以给 AI Agent 操作，也可以给人在浏览器里维护
- **统一事实来源**：分类、记录和顺序都存储在飞书多维表格里
- **务实的人类界面**：Web UI 很轻，重点是快、顺手、适合浏览和维护
- **自然语言操作**：OpenClaw 集成可以直接增删改查、排序、审计面板数据
- **部署面小**：当前架构下，一个 Vercel 项目 + 一个飞书应用 + 一张多维表格就够了

## 核心能力

- 密码保护的 Web 面板
- 书签浏览与搜索
- 置顶与最近访问
- 分类标签与拖拽排序
- 新建 / 编辑 / 删除书签流程
- 目标链接元数据抓取
- 基于飞书多维表格的 API 层
- 面向同一份数据集的 OpenClaw skill

## 架构速览

![AIPanel architecture](docs/assets/diagrams/aipanel-architecture.svg)

AIPanel 使用一套 Feishu-first 的架构：

- **Vercel** 承载 Web 应用和 API
- **飞书多维表格** 是唯一事实来源
- **OpenClaw** 可以通过 skill 操作同一份数据
- **浏览器 UI** 是给人使用的控制面

## 快速部署

在部署前，请先确认你已经准备好：

- 一个飞书应用
- 一张符合要求 schema 的多维表格

下面这个 Deploy with Vercel 按钮**不会**帮你自动创建飞书应用或多维表格 schema。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/simmzl/AIPanel)

推荐的部署流程：

1. 创建飞书应用
2. 准备好多维表格及权限
3. 在 Vercel 中配置环境变量
4. 部署 Web 应用
5. 如有需要，再安装 OpenClaw skill，让 Agent 操作同一份数据

必填环境变量：

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

部署文档：

- [Vercel 部署](docs/deploy/vercel.md)
- [飞书应用 + 多维表格配置](docs/datasource/feishu-bitable.md)
- [故障排查](docs/troubleshooting.md)

## OpenClaw 集成

**不用 OpenClaw，也可以直接使用 AIPanel。**
OpenClaw 是可选项，只有当你想让 Agent 参与操作时才需要它。

AIPanel 附带 OpenClaw skill 模板和 render 后的分发目录。

当前打包方式：

- 编辑 `integrations/openclaw-skill/`
- 将 `skills/aipanel-feishu-bitable/` 视为 render 后的分发目录
- 通过 `integrations/install-scripts/install-openclaw-skill.sh` 安装

本地可选 render：

```bash
node scripts/render-openclaw-skill.mjs
```

更多说明：

- [OpenClaw 集成](docs/integrations/openclaw.md)
- [OpenClaw 兼容性说明](docs/integrations/openclaw-compatibility.md)

## 给贡献者

开发环境、本地运行方式和贡献说明统一放在：

- [Contributing](./CONTRIBUTING.md)

## 项目状态

**支持级别：** experimental  
**许可证：** MIT  
**部署目标：** Vercel + 飞书多维表格

当前已经可以做到：

- 面板本身可以作为真实产品部署运行
- 飞书多维表格是唯一事实来源
- OpenClaw 集成已经可用
- clean-clone install / build / render / install 流程已验证

仍在继续完善的部分：

- demo GIF / 视频素材
- 脱离当前 AIPanel schema 的更泛化 skill 形态
- 少量与历史项目上下文相关的发布策略收尾

## 文档导航

建议先看：

- [文档索引](docs/README.md)
- [架构概览](docs/architecture.md)
- [部署到 Vercel](docs/deploy/vercel.md)
- [飞书多维表格配置](docs/datasource/feishu-bitable.md)
- [OpenClaw 集成](docs/integrations/openclaw.md)
- [故障排查](docs/troubleshooting.md)

更深入的项目文档：

- [开源就绪清单](docs/product/open-source-readiness-checklist.md)
- [路线图](docs/product/roadmap.md)
- [Release Notes 模板](docs/product/release-notes-template.md)

## 环境变量命名说明

新的配置请统一使用：

- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`

公开文档和部署流程里，只使用这两个名字。

## 总结

AIPanel 是一个很实用的起点，适合希望让人和 Agent 通过 Web UI + OpenClaw 一起操作同一份飞书多维表格数据的团队。
