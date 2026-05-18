import type { ApiRequest, ApiResponse } from '../_lib.js';
import {
  feishuRequest,
  getFeishuConfig,
  parseFeishuError,
  requireAuth,
  sendJsonError,
  sendMethodNotAllowed,
  sendStructuredError
} from '../_lib.js';

/**
 * POST /api/bookmarks/repair
 *
 * Backfill 分类排序 for any bookmark that has a NULL/0 value. This used to
 * happen automatically before the POST handler started writing 分类排序,
 * so older records still have empty values and skew the tab ordering.
 *
 * Strategy:
 *   1. Fetch every record.
 *   2. Build the canonical "category -> 分类排序" map from records that DO
 *      have a value. We pick the minimum non-zero value per category, which
 *      matches the tab-order semantics in the GET handler.
 *   3. For categories with no values at all, assign them sequential values
 *      starting after the current max, ordered by Chinese collation so the
 *      result is at least deterministic.
 *   4. batch_update every record whose 分类排序 is missing or doesn't match
 *      its category's canonical value.
 *
 * The response reports how many rows were touched and how many were already fine.
 */

interface FeishuRecord {
  record_id: string;
  fields: {
    分类?: string;
    分类排序?: number;
  };
}

const BATCH_SIZE = 500; // Feishu batch_update accepts up to 500 records per call.

async function fetchAllRecords(basePath: string): Promise<FeishuRecord[]> {
  const items: FeishuRecord[] = [];
  let pageToken: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({ page_size: '500' });
    if (pageToken) params.set('page_token', pageToken);

    const data = await feishuRequest<{
      data?: {
        items?: FeishuRecord[];
        has_more?: boolean;
        page_token?: string;
      };
    }>(`${basePath}?${params.toString()}`);

    if (data.data?.items) {
      items.push(...data.data.items);
    }
    hasMore = data.data?.has_more ?? false;
    pageToken = data.data?.page_token;
  }

  return items;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    sendMethodNotAllowed(res, ['POST']);
    return;
  }

  try {
    requireAuth(req);
  } catch (error) {
    sendJsonError(res, 401, error instanceof Error ? error.message : '未授权');
    return;
  }

  try {
    const { appToken, tableId } = getFeishuConfig();
    const basePath = `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`;

    const allRecords = await fetchAllRecords(basePath);
    const totalRecords = allRecords.length;

    // Build canonical category -> 分类排序 map from records that already have a value.
    const categoryOrder = new Map<string, number>();
    let maxCategoryOrder = 0;
    for (const record of allRecords) {
      const category = record.fields.分类 || '其他';
      const value = Number(record.fields.分类排序 || 0);
      if (value > 0) {
        if (!categoryOrder.has(category) || (categoryOrder.get(category) ?? Infinity) > value) {
          categoryOrder.set(category, value);
        }
        if (value > maxCategoryOrder) maxCategoryOrder = value;
      }
    }

    // Categories that have NO records with a value: assign them new sequential
    // values, ordered alphabetically for determinism.
    const categoriesNeedingValue = new Set<string>();
    for (const record of allRecords) {
      const category = record.fields.分类 || '其他';
      if (!categoryOrder.has(category)) {
        categoriesNeedingValue.add(category);
      }
    }
    const newCategories = Array.from(categoriesNeedingValue).sort((left, right) =>
      left.localeCompare(right, 'zh-CN')
    );
    for (const category of newCategories) {
      maxCategoryOrder += 1;
      categoryOrder.set(category, maxCategoryOrder);
    }

    // Find records that need updating: NULL/0 分类排序, or a value that
    // doesn't match the canonical value for their category.
    const updates: Array<{ record_id: string; fields: { 分类排序: number } }> = [];
    for (const record of allRecords) {
      const category = record.fields.分类 || '其他';
      const expected = categoryOrder.get(category);
      const current = Number(record.fields.分类排序 || 0);
      if (expected === undefined) continue;
      if (current !== expected) {
        updates.push({
          record_id: record.record_id,
          fields: { 分类排序: expected }
        });
      }
    }

    // Run batch_update in chunks of 500.
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      await feishuRequest(`${basePath}/batch_update`, {
        method: 'POST',
        body: JSON.stringify({ records: batch })
      });
    }

    res.status(200).json({
      success: true,
      totalRecords,
      repaired: updates.length,
      categoryCount: categoryOrder.size,
      newCategoriesAssigned: newCategories.length
    });
  } catch (error) {
    const structured = parseFeishuError(error);
    if (structured) {
      sendStructuredError(res, 500, structured);
      return;
    }
    sendJsonError(res, 500, error instanceof Error ? error.message : '修复失败');
  }
}
