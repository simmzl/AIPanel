# AIPanel 安装器 Phase 1：规格与状态机

状态：进行中  
目标：在不直接进入大规模脚本实现的前提下，先把 AIPanel 一句话安装器的第一阶段打实。

---

## Phase 1 目标

这一阶段不追求“立刻自动创建完整 AIPanel”。

这一阶段只做三件事：

1. 明确安装器的状态机
2. 明确每个阶段的输入 / 输出 / 阻塞条件
3. 为后续实现准备 repo 内的结构、文档和 skill 口径

换句话说，Phase 1 的目标是：

> 把 “开始创建 AIPanel” 这件事，从模糊愿景，变成一个可以真正开始编码的 installer contract。

---

## Phase 1 的交付物

### 1. 安装器阶段模型

阶段固定为：

```text
preflight
-> create-feishu
-> configure
-> ask-final-inputs
-> deploy-vercel
-> verify
-> done
```

### 2. 每阶段 contract

每个阶段都要定义：

- 输入是什么
- 输出是什么
- 失败时如何退出
- 能否从这个阶段恢复

### 3. 安装器 state 对象

先定义统一 state 结构，供后续 skill / script / agent flow 共用。

### 4. 文档与 skill 的方向统一

保证 repo 内不再继续以“纯手动部署文档”为唯一主路线，而是逐步往 installer-first 靠拢。

---

## 安装器状态机（v1）

## Stage 1 — `preflight`

### 目的

检查当前环境是否具备继续创建 AIPanel 的条件。

### 输入

- 当前运行环境
- 当前 OpenClaw session
- Feishu 可用性
- Vercel 可用性

### 输出

```json
{
  "stage": "preflight",
  "status": "ready|blocked",
  "feishu": { "status": "ready|blocked" },
  "vercel": { "status": "ready|blocked" },
  "messages": []
}
```

### 阻塞条件

- 没有可用的 Feishu 创建能力
- 没有可用的 Vercel 部署能力

### 可恢复性

是。preflight 失败不应该产生副作用。

---

## Stage 2 — `create-feishu`

### 目的

自动创建 Feishu Bitable app、table、schema。

### 输入

- preflight ready
- 当前用户 Feishu 身份/授权

### 输出

```json
{
  "stage": "create-feishu",
  "feishu": {
    "appToken": "bascn_xxx",
    "tableId": "tblxxxxxx",
    "sourceUrl": "https://..."
  }
}
```

### 阻塞条件

- 创建 Bitable app 失败
- 创建 table 失败
- 创建字段失败

### 可恢复性

部分可恢复。
需要在本地/会话里持久化：

- app token
- table id
- source URL

---

## Stage 3 — `configure`

### 目的

组装最终部署需要的 env 对象。

### 输入

- 已创建的 Feishu 数据源信息
- 自动识别到的 `FEISHU_APP_ID`
- 系统生成的 JWT secret

### 输出

```json
{
  "stage": "configure",
  "env": {
    "APP_NAME": "AIPanel",
    "JWT_SECRET": "***",
    "FEISHU_APP_ID": "cli_xxx",
    "FEISHU_APP_SECRET": "***",
    "FEISHU_BITABLE_APP_TOKEN": "bascn_xxx",
    "FEISHU_BITABLE_TABLE_ID": "tblxxxxxx",
    "FEISHU_BITABLE_SOURCE_URL": "https://..."
  }
}
```

### 阻塞条件

- `FEISHU_APP_ID` 无法自动获得
- JWT 生成失败

### 可恢复性

是。只要 Feishu 侧结果保留，配置可以重建。

---

## Stage 4 — `ask-final-inputs`

### 目的

只在这一阶段向用户询问最后必须由用户提供的输入项。

### 输入

- configure 阶段产出的 env 基础对象

### 输出

```json
{
  "stage": "ask-final-inputs",
  "env": {
    "APP_NAME": "AIPanel",
    "ACCESS_PASSWORD": "***",
    "JWT_SECRET": "***",
    "FEISHU_APP_ID": "cli_xxx",
    "FEISHU_APP_SECRET": "***",
    "FEISHU_BITABLE_APP_TOKEN": "bascn_xxx",
    "FEISHU_BITABLE_TABLE_ID": "tblxxxxxx",
    "FEISHU_BITABLE_SOURCE_URL": "https://..."
  }
}
```

### 阻塞条件

- 用户没有输入访问密码
- 用户没有提供与自动识别到的 `FEISHU_APP_ID` 对应的 `FEISHU_APP_SECRET`
- 用户中断

### 可恢复性

是。只需要再次向用户询问缺失的最终输入项即可。

---

## Stage 5 — `deploy-vercel`

### 目的

创建 Vercel 项目、注入 env、触发部署。

### 输入

- 完整 env 对象

### 输出

```json
{
  "stage": "deploy-vercel",
  "vercel": {
    "projectId": "...",
    "deploymentUrl": "https://..."
  }
}
```

### 阻塞条件

- Vercel 登录/授权不可用
- 项目创建失败
- env 写入失败
- deploy 失败

### 可恢复性

部分可恢复。
至少要记住：

- project id
- 已完成到哪一步

---

## Stage 6 — `verify`

### 目的

确认创建出来的实例真的可用。

### 输入

- deployment URL
- Feishu 数据源信息

### 输出

```json
{
  "stage": "verify",
  "status": "ok|failed",
  "checks": {
    "url": true,
    "auth": true,
    "bookmarks": true
  }
}
```

### 阻塞条件

- URL 不可访问
- auth route 不通
- bookmarks route 不通

### 可恢复性

可恢复。通常回到 deploy-vercel 或 configure 检查。

---

## Stage 7 — `done`

### 目的

向用户返回成功结果。

### 输出

- AIPanel URL
- Feishu source URL
- 成功提示

---

## 安装器 state 结构（建议）

建议建立一个统一状态对象：

```json
{
  "version": 1,
  "stage": "preflight",
  "appName": "AIPanel",
  "feishu": {
    "appToken": null,
    "tableId": null,
    "sourceUrl": null
  },
  "env": {
    "APP_NAME": "AIPanel",
    "ACCESS_PASSWORD": null,
    "JWT_SECRET": null,
    "FEISHU_APP_ID": null,
    "FEISHU_APP_SECRET": null,
    "FEISHU_BITABLE_APP_TOKEN": null,
    "FEISHU_BITABLE_TABLE_ID": null,
    "FEISHU_BITABLE_SOURCE_URL": null
  },
  "vercel": {
    "projectId": null,
    "deploymentUrl": null
  },
  "errors": []
}
```

---

## Phase 1 期间要避免的事

在这一阶段，先不要做这些：

- 直接写很长的“一把梭”脚本
- 在没确认 Feishu / Vercel 能力边界前硬编码实现细节
- 继续投入大量精力打磨 README 主安装路径
- 做复杂的多租户 / 多数据源抽象

当前重点是把安装器 contract 定住。

---

## 当前已知要保留的产品约束

这些在安装器 Phase 1 里视为既定条件，不在这一阶段改动：

- placeholder row 逻辑保持
- 当前 OpenClaw skill 仍按 AIPanel schema 工作
- env 只保留 canonical `FEISHU_BITABLE_*`
- metadata 自动翻译已移除

---

## Phase 1 完成标准

当以下条件成立时，Phase 1 算完成：

1. repo 中已经有明确 installer 状态机文档
2. 每个阶段的输入 / 输出 / 阻塞条件都清楚
3. 可以明确知道下一步编码应该先从哪一阶段开始
4. repo 中已经有 installer 的最小代码/脚本骨架（state / preflight / secret generation）
5. 可以开始用真实 Feishu CLI / Vercel 能力去映射实现

---

## 下一阶段（Phase 2）

Phase 2 的目标是：

> 打通 Feishu 侧自动创建路径。

也就是把：

- create Bitable app
- create table
- create schema
- 拿到 token / table id / source URL

真正跑通。
