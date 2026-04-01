# AIPanel 一句话安装器实施方案

状态：已完成核心实现（v1）  
写作目的：记录 AIPanel 一句话安装器的目标、实现结构与交付边界，作为当前安装主线文档。

---

## 1. 产品目标

最终目标不只是：

- 一个可部署的 AIPanel 仓库
- 一份可读的 README
- 一条手动安装流程

当前已经实现的目标是：

> 用户安装好所需的 Feishu 工具和 AIPanel skills 之后，只要对 OpenClaw 说一句：**“开始创建 AIPanel”**，OpenClaw 就能沿着安装器主路径推进创建流程，并在必要时只收口最后少量输入。

这意味着最终要交付的产品其实包括三部分：

1. **AIPanel 应用本体**
2. **AIPanel 安装器流程**
3. **AIPanel 操作型 skill**

其中，安装器流程才是最关键的差异化能力。

---

## 2. 目标用户体验

## 理想用户旅程

### 前置条件

用户已经完成：

- 安装并完成所需 Feishu 工具 / CLI / 集成能力的授权
- 安装 AIPanel skill
- 安装或授权好 Vercel 相关的部署能力

### 触发方式

用户对 OpenClaw 说：

> 开始创建 AIPanel

### OpenClaw 自动完成后续

OpenClaw 应该自动完成：

1. 检查前置条件
2. 创建 Feishu 多维表格 App 和数据表
3. 创建所需字段 / schema
4. 生成 Bitable source URL
5. 生成 `JWT_SECRET`
6. 准备 Vercel 部署
7. 注入所有必需环境变量
8. 如果可能，只向用户询问少量必要的人类输入：
   - 访问密码
   - 与自动识别到的 Feishu App ID 对应的 App Secret
9. 完成部署
10. 返回最终的 AIPanel URL 和简洁的完成说明

### 最终生成的配置

部署完成后，环境变量应当是：

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

### 设计原则

用户不应该手动去做这些事：

- 一步步创建 Bitable schema
- 手动查找 app token / table id
- 手动生成 JWT secret
- 先去读一大段部署教程

文档依然有价值，但现在的主安装入口已经是 installer skill，而不是手动阅读长文档。

---

## 3. 当前实现状态

当前仓库已经具备：

- `aipanel-installer` skill
- `aipanel-feishu-bitable` skill
- installer CLI 的 `continue / status / verify` 主路径
- final inputs 收口逻辑
- Feishu scope 授权错误的结构化提示
- Vercel 部署后的最小 verify

因此，这份文档现在更偏向“已实现能力说明 + 后续演进边界”，而不是纯方案草稿。

## 4. 安装器哲学

## 核心原则

安装器应该具备以下特征：

- **对话式**
- **有状态**
- **尽量少提问**
- **安全**
- **可恢复**

## 应该向用户提问什么

只有在真的必要时才提问。

理想状态下，最终提问数应该尽量少：

1. 也许确认一下项目名（可选，默认 `AIPanel`）
2. 询问访问密码
3. 询问与自动识别到的 Feishu App ID 对应的 App Secret

除此之外，尽量全部自动推导。

## 如果系统可以自动发现，就不该问用户什么

- Feishu app credentials，如果它们已经在环境/工具链里可用
- Bitable app token / table id，如果它们刚刚就是安装器创建出来的
- source URL，如果它可以从创建结果直接拼出来
- JWT secret，如果系统可以自动生成

---

## 5. 用 Superpowers 拆解任务

这一节用 “Superpowers” 的方式来拆解目标：

- **Observe（观察）** — 检查当前系统状态和前置条件
- **Create（创建）** — 创建新资源
- **Configure（配置）** — 把资源正确拼接起来
- **Deploy（部署）** — 发布成可运行的基础设施
- **Verify（验证）** — 确认创建结果真的可用
- **Recover（恢复）** — 部分失败时可以从中间继续
- **Explain（解释）** — 用简洁的人话告诉用户进展

---

## 6. Superpower 1 — Observe（观察）

目标：判断当前环境是否已经具备运行一句话创建流程的条件。

## 职责

安装器必须检测：

- Feishu 工具 / 授权是否可用？
- Vercel 部署能力是否可用？
- AIPanel 仓库 / skill 是否存在且可用？
- 所需 secret 是否已经可以被发现？
- 当前是否已经存在一个 AIPanel 实例，或者一个半完成的安装？

## 必要检查项

### Feishu 侧

- 当前 Feishu 身份 / 授权是否有效
- 是否有能力创建 Bitable app
- 是否有能力创建 table
- 是否有能力创建字段 / schema
- 是否有能力读取刚创建出来的元数据

### Vercel 侧

- Vercel 登录状态是否可用
- 是否能创建或部署一个项目
- 是否能写入环境变量
- 是否能获取最终部署 URL

### 本地 / 项目侧

- skill 是否已安装
- 安装器脚本 / 实现是否可用
- 当前 repo 版本是否与安装器兼容

## 产出物

应该返回一个结构化的 “preflight” 结果，例如：

```json
{
  "feishu": "ready",
  "vercel": "ready",
  "skill": "ready",
  "repo": "ready",
  "warnings": []
}
```

## 说明

如果 preflight 失败，应该给用户一条简短的人话提示，而不是整屏技术日志。

例如：

> 我可以继续创建 AIPanel，但当前还没有可用的 Vercel 登录状态。先完成 Vercel 授权后，我再继续。

---

## 7. Superpower 2 — Create（创建）

目标：自动完成 Feishu 侧数据源的创建。

## 职责

安装器应该自动创建：

1. 一个 Feishu Bitable app
2. AIPanel 主数据表
3. 所需字段 / schema
4. 如有需要，创建默认选项（例如分类字段的选项）

## 必需 schema

当前目标 schema：

- `标题`
- `副标题`
- `链接`
- `图标`
- `分类`
- `排序`
- `分类排序`

## 待决问题

需要决定安装器是否还要额外做这些事：

- 创建示例数据行
- 创建默认分类集合
- 立即创建 placeholder row

### 建议

对于第一版安装器：

- 必须创建 schema
- 可以选择创建一个小型、可公开展示的 starter dataset
- 不要向用户提 schema 层面的细节问题

## 产出物

Create 阶段应该返回：

- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`
- `FEISHU_BITABLE_SOURCE_URL`

---

## 8. Superpower 3 — Configure（配置）

目标：收集并规范化部署所需的全部环境变量输入。

## 最终所需 env

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

## 配置来源

### 自动发现

- `FEISHU_APP_ID`
- `FEISHU_BITABLE_APP_TOKEN`
- `FEISHU_BITABLE_TABLE_ID`
- `FEISHU_BITABLE_SOURCE_URL`

### 自动生成

- `JWT_SECRET`

### 用户提供

- `ACCESS_PASSWORD`
- `FEISHU_APP_SECRET`（必须对应自动识别到的 `FEISHU_APP_ID`）

### 默认值

- `APP_NAME=AIPanel`

## 建议

安装器应该在部署前构建一个统一的内存配置对象，例如：

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

这样会让部署、报告、重试都容易很多。

---

## 8. Superpower 4 — Deploy（部署）

目标：在 Vercel 上创建并发布一个真正可用的 AIPanel 实例。

## 职责

安装器应该：

1. 创建一个新的 Vercel 项目，或者复用一个合适的部署目标
2. 注入所有必需环境变量
3. 部署 AIPanel 应用
4. 获取最终部署 URL

## 必需部署行为

- 环境变量写入可预测、可重复
- 如果部署中途失败，重试应该尽量幂等
- 如果 Vercel 登录 / 项目创建 / env 写入失败，错误报告必须清晰

## 待决问题

需要决定安装器是否应该：

### 方案 A — 总是创建一个新的 Vercel 项目
优点：
- 心智模型更简单
- 分支情况更少

缺点：
- 对高级用户不够灵活

### 方案 B — 支持复用已有项目
优点：
- 更灵活

缺点：
- 提问更多
- 歧义更多

### 建议

对 v1 安装流来说：

- 默认优先 **创建全新项目**
- 高级复用能力放到后续版本

---

## 9. Superpower 5 — Verify（验证）

目标：确认创建出来的 AIPanel 真的可以使用。

## 验证清单

部署完成后，安装器至少要验证：

1. 部署 URL 已经存在
2. auth 路由可以正常响应
3. bookmarks 路由在带认证请求下能正常响应
4. 刚创建的 Bitable 可以被部署后的应用访问

## 推荐给用户的最终输出

一条简洁的完成消息：

> AIPanel 已创建完成。你的面板地址是：...
> 我已经完成了飞书多维表格创建、环境变量配置和 Vercel 部署。
> 你设置的访问密码已经生效。

可选的附加输出：

- 部署 URL
- Feishu source URL
- 提醒用户：OpenClaw 现在也可以操作同一份数据

---

## 10. Superpower 6 — Recover（恢复）

目标：支持部分失败后从中间继续，而不是每次都从零重来。

## 失败场景

### 场景 A — Feishu 已创建，Vercel 失败
需要保留：

- app token
- table id
- source URL

这样下次可以直接从 deploy 阶段继续，而不是重新创建数据源。

### 场景 B — Vercel 项目已创建，但 env 注入失败
应该支持从 env / deploy 阶段继续。

### 场景 C — 密码提问中断
应该支持从配置组装阶段继续。

## 建议

安装器应当持久化一个本地/会话级别的 state 对象，例如：

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

这样可以避免重复创建资源，也让重试更合理。

---

## 11. Superpower 7 — Explain（解释）

目标：让用户随时知道当前进展，但不要被技术实现细节淹没。

## 沟通规则

### 进度汇报

只有当状态发生明显变化时，才发送短进度消息：

- 前置检查通过
- 多维表格已创建
- schema 已创建
- 正在等待密码
- 部署完成
- 被授权或外部依赖阻塞

### 避免

- 冗长的原始日志
- 内部 JSON 数据块
- 每个微小步骤都对用户说一遍

### 好的例子

- “我已经创建好多维表格，正在配置字段。”
- “现在只差一个步骤：请设置 AIPanel 的访问密码。”
- “Vercel 部署已完成，正在验证面板是否可访问。”

---

## 12. 端到端安装流程

## Happy path

1. 用户说：`开始创建 AIPanel`
2. 执行 preflight 检查
3. 创建 Feishu Bitable app
4. 创建主数据表
5. 创建所需 schema
6. 获取 app token / table id / source URL
7. 生成 JWT secret
8. 自动识别 `FEISHU_APP_ID`
9. 向用户询问访问密码与对应 App ID 的 App Secret
10. 创建 Vercel 项目
11. 注入 env
12. 触发部署
13. 验证部署结果
14. 返回最终 URL

## 最少提问版本

理想状态下，安装器只应该在这件事上打断用户：

- 输入访问密码
- 输入与自动识别到的 `FEISHU_APP_ID` 对应的 `FEISHU_APP_SECRET`

其余都应自动完成。

---

## 13. 具体 workstreams

## Workstream A — 安装器规范与状态机

交付物：

- 安装器阶段模型
- preflight contract
- resume contract
- 最终成功 contract

任务：

- 定义阶段：`preflight -> create-feishu -> configure -> ask-final-inputs -> deploy-vercel -> verify -> done`
- 定义持久化状态结构
- 定义重试 / 恢复规则

## Workstream B — Feishu 数据源创建

交付物：

- 创建 Bitable app
- 创建 AIPanel table
- 创建 schema 字段
- 返回 source URL / app token / table id

任务：

- 确认每个创建动作对应的 Feishu API / CLI / tool 路径
- 定义幂等规则
- 定义默认 seed 行为

## Workstream C — Secret 与配置组装

交付物：

- 自动生成的 JWT secret
- 标准化 env 对象
- 密码提交流程

任务：

- 定义安全的 secret 生成方式
- 定义配置对象在流程中的存放方式
- 定义日志 / 汇报里如何屏蔽 secret

## Workstream D — Vercel 部署自动化

交付物：

- 项目创建路径
- env 注入路径
- deploy 路径
- 最终 URL 获取路径

任务：

- 确认部署 API / CLI 路径
- 定义默认“创建新项目”流程
- 定义失败恢复行为

## Workstream E — 验证与完成体验

交付物：

- 部署后验证步骤
- 最终成功响应
- 各阶段失败提示语

任务：

- 定义 deploy 验证清单
- 定义用户可见的状态消息
- 定义哪些信息展示、哪些信息隐藏

## Workstream F — Skill 交互体验

交付物：

- 触发语支持
- 安装器专用 prompt / instruction
- 面向操作员的帮助说明

任务：

- 为 `开始创建 AIPanel` 增加或调整 skill 行为
- 把用户意图路由到安装器流程
- 明确记录前置条件

---

## 14. 推荐实施顺序

## Phase 1 — 先做 spec

不要从 README 或临时脚本直接开做。
先锁定：

- 阶段模型
- 必要输入
- 必要输出
- 恢复行为
- 成功判定条件

这一阶段的执行拆解见：

- [AIPanel 安装器 Phase 1：规格与状态机](./aipanel-installer-phase-1.md)

## Phase 2 — 先打通 Feishu 创建路径

因为如果数据源创建本身不稳定，后面都没有意义。

## Phase 3 — 再打通 Vercel 部署路径

Feishu 创建稳定后，再接部署。

## Phase 4 — 最后包上对话式 skill 外壳

等底层创建 / 部署链路跑通后，再把它封装成最终的 OpenClaw 交互：

> 开始创建 AIPanel

## Phase 5 — 最后改文档

只有安装器真的存在之后，README 才应该改成新的主路径：

1. 安装 skill
2. 对 OpenClaw 说“开始创建 AIPanel”
3. 回答密码问题
4. 收到部署 URL

---

## 15. 待决问题

这些问题在实现深入之前必须明确：

1. Feishu 能力面的精确边界是什么？
   - CLI？
   - OpenClaw Feishu tools？
   - 两者混用？

2. Vercel 的精确部署路径是什么？
   - Vercel CLI？
   - Vercel API？
   - 浏览器辅助流程？

3. 运行时 `FEISHU_APP_ID` 和 `FEISHU_APP_SECRET` 到底从哪里来？
   - 已经存在于本地 env？
   - 能从已安装工具自动发现？
   - 需要第一次向用户询问？

4. 安装器是否应该自动创建 starter sample bookmarks？

5. 安装器默认总是创建新的 Vercel 项目，还是支持复用已有项目？

6. 在部分失败时，安装器状态应该持久化到哪里？

---

## 16. Definition of Done

当以下条件全部成立时，这个目标才算完成：

1. 用户安装好所需 Feishu 工具和 AIPanel skill
2. 用户说 `开始创建 AIPanel`
3. OpenClaw 自动创建 Bitable app、table 和 schema
4. OpenClaw 自动组装出全部所需 env
5. OpenClaw 只在必要时询问用户密码
6. OpenClaw 自动把 AIPanel 部署到 Vercel
7. OpenClaw 返回一个可访问的 URL
8. 用户不需要再手动编辑 env，就能直接使用部署出来的实例

---

## 17. Bottom line

AIPanel 的长期产品形态，不应该只是“一个 AIPanel 仓库”。

它真正要成为的是：

> **一个可以通过一句话创建出来的 AIPanel 体验**

这意味着安装器流程要被当作一等产品面来设计，而不是附属于 repo 文档的次要功能。


---

## 当前结论

AIPanel 一句话安装器的 v1 核心实现已经完成。

当前推荐入口：

- 在 OpenClaw 中说：`开始创建 AIPanel`
- 安装器主编排命令：`node scripts/installer/cli.mjs continue`
- 需要真实创建资源时使用：`node scripts/installer/cli.mjs continue --execute`

剩余工作主要属于 polish、扩展校验和更深层产品化，而不再是核心能力缺失。
