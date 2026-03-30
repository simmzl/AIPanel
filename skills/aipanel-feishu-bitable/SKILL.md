---
name: aipanel-feishu-bitable
description: Manage the AIPanel Feishu Bitable data source with natural language. Use when a user wants to query, add, edit, delete, reorder, or organize AIPanel bookmarks and categories stored in the Feishu Bitable backing the current AIPanel deployment. Also use when the user asks about AIPanel data, category order, placeholder records for new categories, or wants changes reflected in the panel UI.
---

# AIPanel Bitable

Operate the AIPanel data source in Feishu Bitable.

This skill is the **canonical editable template** for the AIPanel OpenClaw integration.
The checked-in copy under `skills/aipanel-feishu-bitable/` should be treated as a rendered mirror for local browsing or distribution, not as the source of truth.

## Data source configuration

Render or install this skill with the correct identifiers for your AIPanel deployment:

- app_token: `YOUR_FEISHU_BITABLE_APP_TOKEN`
- table_id: `YOUR_FEISHU_BITABLE_TABLE_ID`
- data source URL: `https://your-feishu-domain/base/YOUR_FEISHU_BITABLE_APP_TOKEN`

For the current private-alpha workflow, the installer can fill these from:

- `AIPANEL_SKILL_APP_TOKEN` or `FEISHU_BITABLE_APP_TOKEN`
- `AIPANEL_SKILL_TABLE_ID` or `FEISHU_BITABLE_TABLE_ID`
- `AIPANEL_SKILL_SOURCE_URL` or `FEISHU_BITABLE_SOURCE_URL`

## Table schema

Main fields in the AIPanel table:

- `标题` text
- `副标题` text
- `链接` url
- `图标` text
- `分类` single select
- `排序` number
- `分类排序` number

Interpretation:

- `排序`: order inside the same category
- `分类排序`: category order across the whole panel

## Core tasks

### Read bookmarks

Use `feishu_bitable_app_table_record.list` with:

- `app_token="YOUR_FEISHU_BITABLE_APP_TOKEN"`
- `table_id="YOUR_FEISHU_BITABLE_TABLE_ID"`
- `field_names=["标题","副标题","链接","图标","分类","排序","分类排序"]`

When summarizing data for the user:

1. Group by `分类`
2. Sort groups by `分类排序` ascending
3. Sort items inside each group by `排序` ascending

### Add a bookmark

Use `feishu_bitable_app_table_record.create`.

Required fields to provide:

- `标题`
- `链接`
- `分类`

Usually also set:

- `副标题`
- `图标`
- `排序`
- `分类排序` if needed for consistency

If the user gives only a category and no explicit in-category order, append to the end of that category by reading current records and setting `排序 = current max + 1`.

### Edit a bookmark

1. Find the target record with `list` and, if needed, a structured `filter`
2. Use `update` with the matching `record_id`
3. Preserve fields the user did not ask to change

### Delete a bookmark

1. Find the target record precisely
2. Confirm if the request is ambiguous or there are multiple matches
3. Use `delete` with the `record_id`

### Reorder categories

When the user asks to reorder AIPanel categories:

1. Read all records
2. Determine the desired category order
3. Batch update every record in each category so `分类排序` matches the new category position
4. Keep existing `排序` values unchanged

### Reorder bookmarks inside a category

When the user asks to reorder items inside one category:

1. Read all records in that category
2. Determine the target order
3. Batch update `排序` for those records only
4. Leave `分类排序` unchanged

### Create a new category

When creating a category for AIPanel, do both actions:

1. Add the new option to the `分类` single-select field
2. Create one placeholder row so the category is visible in the UI immediately

Placeholder row values:

- `标题`: `—`
- `副标题`: `—`
- `链接`: `https://placeholder.local`
- `图标`: empty string
- `分类`: new category name
- `排序`: `0`
- `分类排序`: append at the end unless the user specified another position

If the category already exists, do not create a duplicate option.

## Query patterns

### Find all bookmarks in a category

Use a structured filter on `分类 is <name>`.

### Find one bookmark by title

Prefer exact title match first with `标题 is ...`.
If nothing matches, fall back to `contains` and report ambiguity if multiple results appear.

### Count bookmarks per category

Read all rows, group in memory, then summarize counts sorted by `分类排序`.

### Find broken or placeholder rows

Placeholder rows can be identified with one or more of:

- `标题 is "—"`
- `副标题 is "—"`
- `链接 is "https://placeholder.local"`

Use this when the user asks which categories are still empty or need real content.

## Response style

When answering users:

- Be concise
- Name the category and bookmark titles explicitly
- If multiple records might match, ask a narrowing question before writing
- After a successful write, summarize exactly what changed

## Safety

- Treat this as a live production data source for AIPanel
- Avoid destructive bulk deletes unless explicitly requested
- Prefer one batch write over many tiny writes when updating order
- If the request could affect many records, state what will change before doing it
