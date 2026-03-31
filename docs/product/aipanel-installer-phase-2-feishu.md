# AIPanel 安装器 Phase 2：Feishu 创建路径

状态：待实施  
目标：打通安装器在 Feishu 侧自动创建数据源的路径。

---

## Phase 2 目标

这一阶段只聚焦一件事：

> 当安装器进入 `create-feishu` 阶段时，能够自动创建 AIPanel 所需的 Feishu Bitable 数据源，并返回后续部署所需的核心标识。

这一阶段不负责：

- Vercel 部署
- 用户密码交互
- 完整安装闭环

---

## 需要打通的能力

安装器需要完成：

1. 创建 Bitable app
2. 创建 table
3. 创建字段/schema
4. 获取 app token
5. 获取 table id
6. 生成/获取 Bitable source URL

---

## 当前目标 schema

AIPanel 当前要求的字段：

- `标题`
- `副标题`
- `链接`
- `图标`
- `分类`
- `排序`
- `分类排序`

字段语义保持不变。

placeholder row 逻辑在当前阶段继续保留，不在 Phase 2 中重构。

---

## 待确认能力边界

这一阶段最大的真实问题不是“要不要做”，而是“具体通过什么能力做”。

需要尽快确认：

### Feishu CLI 能否直接完成以下动作

- 创建 Bitable app
- 创建 table
- 创建字段
- 获取 source URL / token / id

### 如果 Feishu CLI 不能完整覆盖

需要明确哪些动作由：

- Feishu CLI 完成
- OpenClaw 现有 Feishu 工具完成
- 两者混合完成

---

## Phase 2 最终产出

这一阶段完成后，应当至少能稳定产出：

```json
{
  "appToken": "bascn_xxx",
  "tableId": "tblxxxxxx",
  "sourceUrl": "https://your-domain.feishu.cn/base/..."
}
```

同时应能把这些值写回安装器 state：

- `feishu.appToken`
- `feishu.tableId`
- `feishu.sourceUrl`
- `env.FEISHU_BITABLE_APP_TOKEN`
- `env.FEISHU_BITABLE_TABLE_ID`
- `env.FEISHU_BITABLE_SOURCE_URL`

---

## 推荐实施顺序

1. 先确认 Feishu CLI / 工具能力矩阵
2. 写最小 create-feishu 执行器
3. 用固定 schema 打通创建流程
4. 把返回结果写入 installer state
5. 再补幂等和失败恢复

---

## Done 标准

当以下条件全部成立时，Phase 2 算完成：

1. 可以自动创建 AIPanel 所需 Bitable app + table + schema
2. 可以稳定拿到 app token / table id / source URL
3. 结果可以写入 installer state
4. 失败时能明确知道卡在哪一步
