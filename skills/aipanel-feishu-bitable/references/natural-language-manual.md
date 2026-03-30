# Natural language manual

This document is the user-facing playbook for talking to the AIPanel Bitable skill.

## What it can do

You can talk to the skill in plain language to:

- read bookmark data
- count or summarize categories
- find specific bookmarks
- add bookmarks
- edit existing bookmarks
- delete bookmarks
- create categories
- reorder categories
- reorder bookmarks inside one category
- find placeholder rows or incomplete data

It operates on the AIPanel Feishu Bitable data source directly.

## Best prompt styles

The skill works best when your prompt contains one or more of:

- the category name
- the bookmark title
- the target action
- the intended order or destination position
- the desired fields to change

Good prompts are concrete.

Instead of:

- “改一下这个”

Prefer:

- “把 AIPanel 里 ‘Claude’ 这条的分类改到 效率工具”
- “把 网络工具 分类排到第三位”
- “新增一个书签到 开发，标题是 Vercel，链接是 https://vercel.com”

## Query prompts

### Read categories and counts

- “列出 AIPanel 的全部分类和每个分类的数量”
- “AIPanel 现在一共有多少个分类？”
- “按当前页面顺序告诉我所有分类”
- “哪个分类的书签最多？”

### Read bookmarks inside one category

- “列出 网络工具 分类下的所有书签”
- “告诉我 效率工具 里目前有哪些站点”
- “按顺序显示 交易 分类下的书签”

### Find a specific bookmark

- “查一下有没有叫 ChatGPT 的书签”
- “找出标题里包含 Claude 的书签”
- “哪个分类里有 Vercel？”
- “帮我找链接里包含 github.com 的记录”

### Audit and cleanup queries

- “找出 AIPanel 里还是占位符的数据”
- “哪些分类还只有占位记录，没有真实书签？”
- “找出没有副标题的书签”
- “找出链接异常或可疑的记录”

## Write prompts

### Add a bookmark

- “新增一个书签到 效率工具，标题是 ChatGPT，副标题是 AI 助手，链接是 https://chatgpt.com”
- “在 网络工具 里加一个 Cloudflare Radar，链接是 https://radar.cloudflare.com，放最后”
- “添加一个书签到 开发，标题 Vercel，副标题 部署平台，链接 https://vercel.com”

### Edit a bookmark

- “把 ChatGPT 的副标题改成 AI 对话助手”
- “把 Claude 这个书签移到 AI 工作流 分类”
- “把 Vercel 的链接改成 https://vercel.com/dashboard”
- “把 Telegram 这条的标题改成 Telegram Web”

### Delete a bookmark

- “删除 网络工具 里的旧测速站”
- “删掉标题是 — 的那条占位记录”
- “把 交易 分类里那个重复的 OKX 删除”

If there may be multiple matches, the skill should ask a clarifying question before deleting.

## Category prompts

### Create a category

- “新增一个分类叫 AI 工作流”
- “帮我创建一个分类：研究”
- “增加一个新分类，名字叫 自建服务”

Expected behavior:

- add the category option to the `分类` field
- create one placeholder row so the UI can show the category immediately

### Reorder categories

- “把分类顺序改成：效率工具、AI 工作流、开发、网络工具、其他”
- “把 网络工具 移到第一位”
- “把 交易 放到 效率工具 后面”
- “把 其他 永远放最后”

### Reorder bookmarks inside a category

- “把 效率工具 里的 ChatGPT 放到第一位”
- “调整 网络工具 的顺序：ITDog、Ping0、Cloudflare Radar”
- “把 Claude 挪到 AI 工作流 分类并排第一”

## Placeholder-record prompts

Because new categories create a placeholder record, these prompts are useful:

- “把 AI 工作流 分类里的占位记录改成真实数据，标题是 OpenRouter，副标题是 LLM 网关，链接是 https://openrouter.ai”
- “列出所有占位记录”
- “删除 研究 分类下的占位项，我已经有真实数据了”
- “哪些分类还没有真实站点，只有占位项？”

## Natural language templates

You can also use these reusable templates.

### Query template

- “帮我查看 AIPanel 里【分类名】的【数量/列表/顺序/明细】”

### Create template

- “新增一个书签到【分类名】，标题【标题】，副标题【副标题】，链接【URL】”

### Edit template

- “把【书签标题】的【字段】改成【新值】”

### Category template

- “新增一个分类叫【分类名】”
- “把分类顺序改成：【分类1】、【分类2】、【分类3】”

### Cleanup template

- “找出 AIPanel 里【占位数据/空副标题/重复项/异常链接】”

## Good usage habits

- mention category names exactly when possible
- mention titles exactly when possible
- for reorder tasks, give a full target order if you already know it
- for destructive operations, check the returned summary before proceeding further

## Expected confirmations

For write operations, a good agent response should summarize:

- what record or category changed
- which fields changed
- where it moved to, if it was a reorder operation
- whether the panel UI should now reflect the change
