# AIPanel

一个以 Agent 为优先、由飞书多维表格驱动的轻量书签与运营面板。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/simmzl/AIPanel)

[English README](./README.md)

AIPanel 的核心思路很简单：**Agent 和人都应该操作同一份结构化数据源**。
浏览器是给人用的界面；
飞书多维表格是事实来源；
OpenClaw 是可选的 Agent / 运维层。

当前的 AIPanel 还是一个 **experimental self-hostable v0.x release**：
已经足够用于真实部署，但还没有被打磨成一个通用、面向大众的成熟开源产品。

## 为什么是 AIPanel

大多数书签面板是 UI-first 的，但 AIPanel 不一样：

- **Agent-first 数据模型**：同一份书签数据既可以给 AI Agent 操作，也可以给人在浏览器里维护
- **统一事实来源**：分类、记录和顺序都存储在飞书多维表格里
- **务实的人类界面**：Web UI 很轻，重点是快、顺手、适合浏览和维护
- **自然语言操作**：现有 OpenClaw 集成已经可以直接增删改查、排序、审计面板数据
- **部署面小**：当前架构下，一个 Vercel 项目 + 一个飞书应用 + 一张多维表格就够了

## 当前 v0.x 版本包含什么

当前版本已经包含：

- 密码保护的 Web 面板
- 书签浏览与搜索
- 置顶与最近访问
- 分类标签与拖拽排序
- 新建 / 编辑 / 删除书签流程
- 目标链接元数据抓取
- 基于飞书多维表格的 API 层
- 面向同一份数据集的 OpenClaw skill
- Vercel + 飞书 + OpenClaw 的部署与配置文档
- 第一版公开发布前的 release / readiness 文档

它目前是一个**聚焦型 v1 架构**，还不是一个大而全的平台。

## 项目状态

**阶段：** experimental / early public-release-candidate  
**开源状态：** 可用、MIT 许可，但还在继续打磨，暂时不算广义上的成熟公共产品  
**架构状态：** 足够支撑受控使用，但还没有完全抽象成通用方案

已经成立的部分：

- 面板本身已经可以作为真实产品部署运行
- 环境变量命名已经往 AIPanel 口径统一
- 飞书多维表格是唯一事实来源
- OpenClaw 集成已经可以实际使用
- scratch clone 场景下的 install / build / skill render / skill install 都验证通过

还没彻底完成的部分：

- 更短、更适合对外展示的 GIF / 视频 demo
- 对历史私有部署痕迹的可选 git-history 清理
- 把当前偏 AIPanel 定制的 skill 再做成更泛化的可复用形态
- Vercel deploy button 周边 onboarding 细节还可以继续打磨

## 技术栈

### 前端

- React 18
- TypeScript
- Vite
- Tailwind CSS

### 后端 / API

- Vercel Serverless Functions
- JSON Web Token 鉴权
- 飞书开放平台 API
- Cheerio 元数据抓取

### 数据与 Agent 层

- 飞书多维表格作为事实来源
- OpenClaw skill 提供自然语言书签操作能力

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 创建本地环境变量文件

```bash
cp .env.example .env.local
```

填写这些必要字段：

- `APP_NAME`
- `ACCESS_PASSWORD`
- `JWT_SECRET`
- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`
- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`
- `FEISHU_BITABLE_SOURCE_URL`

### 3. 本地启动

```bash
npm run dev
```

### 4. 构建验证

```bash
npm run build
```

构建脚本会先清理本地产物，避免仓库里残留生成文件。

## 部署

第一版最直接的部署方式，就是直接点击上面的 **Deploy with Vercel** 按钮。

当前推荐的部署路径是：

1. 创建飞书应用
2. 准备好多维表格及权限
3. 在 Vercel 中配置环境变量
4. 部署 Web 应用
5. 如有需要，再安装 OpenClaw skill，让 Agent 操作同一份数据

详细文档：

- [Vercel 部署](docs/deploy/vercel.md)
- [飞书应用 + 多维表格配置](docs/datasource/feishu-bitable.md)
- [OpenClaw 集成](docs/integrations/openclaw.md)

## 文档导航

建议先看：

- [文档索引](docs/README.md)
- [架构概览](docs/architecture.md)
- [部署到 Vercel](docs/deploy/vercel.md)
- [飞书多维表格配置](docs/datasource/feishu-bitable.md)
- [OpenClaw 集成](docs/integrations/openclaw.md)

发布 / 就绪度相关文档：

- [第一版公开发布计划](docs/product/first-public-release.md)
- [第一版公开发布候选清单](docs/product/release-candidate-checklist.md)
- [发布公告草稿](docs/product/release-announcement-v0-experimental.md)
- [Release Notes 模板](docs/product/release-notes-template.md)
- [开源就绪清单](docs/product/open-source-readiness-checklist.md)
- [公开发布首轮审计](docs/product/public-release-audit.md)
- [路线图](docs/product/roadmap.md)

## OpenClaw 集成

AIPanel 当前附带的是一个 **AIPanel 定制形态的 OpenClaw skill 模板**。

第一版公开发布阶段，建议的打包方式是：

- 只编辑 `integrations/openclaw-skill/`
- 把 `skills/aipanel-feishu-bitable/` 当作 render 后的分发目录
- 本地安装走现成 install script
- 如果以后要打 `.skill` 包，应该打 render 后的目录，而不是原始模板目录

可编辑的 canonical source：

- `integrations/openclaw-skill/`

render 后的分发目录 / 本地 package copy：

- `skills/aipanel-feishu-bitable/`

便捷安装脚本：

```bash
bash integrations/install-scripts/install-openclaw-skill.sh
```

本地可选 render：

```bash
node scripts/render-openclaw-skill.mjs
```

安装脚本会在环境变量存在时，把 skill render 成实际可用版本，然后安装到：

- `~/.openclaw/skills/aipanel-feishu-bitable`

这样既保留当前自托管工作流，也减少仓库对某个私有部署的硬编码依赖。

## 环境变量命名说明

所有新的配置和文档，请统一使用：

- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`

为了兼容第一版 experimental public release，API 当前仍会保留一轮 legacy alias，后续再在清理版本中移除。

今天仍然兼容的旧变量名：

- `FEISHU_APP_TOKEN` → `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_TABLE_ID` → `FEISHU_BITABLE_TABLE_ID`

但公开文档、示例和部署说明里，只应该使用 `FEISHU_BITABLE_*`。

## Debug / 本地维护说明

之前的在线 debug 写接口，已经从正式部署面移除。

如果你还需要对当前飞书多维表格做内部写入 smoke test，请使用本地脚本：

```bash
node scripts/debug/feishu-write.mjs
```

这样可以保留内部调试能力，同时降低 release candidate 的暴露面。

## 说实话

如果你要找的是一个已经完全产品化、面向大众用户的公共开源 dashboard，AIPanel **现在还不是**。

但如果你想要的是一个已经能实际运行的 **agent-first panel architecture**，并且组合的是 **Feishu Bitable + Web UI + OpenClaw integration**，那这个仓库已经是一个很好的起点。

现在仓库已经具备基础开源脚手架（`LICENSE`、`CONTRIBUTING.md`、issue templates、PR template）、更安全的 debug 方案、更清晰的 OpenClaw 打包边界、真实 MIT license、基础 `SECURITY.md`、架构文档以及 release/readiness 材料；但在更广泛公开发布前，仍然建议再补上更精炼的 demo 素材，以及是否做 git-history 清理的明确决定。
