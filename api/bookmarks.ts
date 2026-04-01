import type { ApiRequest, ApiResponse } from './_lib.js';
import { feishuRequest, getFeishuConfig, normalizeUrl, parseFeishuError, requireAuth, sendJsonError, sendMethodNotAllowed, sendStructuredError } from './_lib.js';

interface FeishuFieldListResponse {
  data?: {
    items?: Array<{
      field_id: string;
      field_name: string;
      property?: {
        options?: Array<{
          id: string;
          name: string;
          color?: number;
        }>;
      };
    }>;
  };
}

interface FeishuRecord {
  record_id: string;
  fields: {
    标题?: string;
    副标题?: string;
    链接?: {
      link?: string;
      text?: string;
    };
    图标?: string;
    分类?: string;
    排序?: number;
    分类排序?: number;
  };
}

interface BookmarkBody {
  url?: string;
  title?: string;
  subtitle?: string;
  favicon?: string;
  category?: string;
  order?: number;
}

interface CategoryOrderBody {
  categories?: string[];
}

interface CategoryCreateBody {
  name?: string;
}

const CATEGORY_PLACEHOLDER_TITLE = '—';
const CATEGORY_PLACEHOLDER_SUBTITLE = '—';
const CATEGORY_PLACEHOLDER_URL = 'https://placeholder.local';

function isGoogleFaviconUrl(value: string) {
  return /(^https?:\/\/)?(www\.)?(google\.com\/s2\/favicons|t0\.gstatic\.com\/faviconV2)/i.test(value);
}

function resolveFavicon(icon: string | undefined, url: string | undefined): string {
  if (icon && icon.trim() && (icon.startsWith('http://') || icon.startsWith('https://')) && !isGoogleFaviconUrl(icon)) {
    return icon;
  }

  if (url) {
    try {
      const u = new URL(url);
      return `${u.origin}/favicon.ico`;
    } catch {
      // fall through
    }
  }

  return '';
}

function transformRecord(record: FeishuRecord) {
  const url = record.fields.链接?.link || '';
  return {
    id: record.record_id,
    title: record.fields.标题 || record.fields.链接?.text || '未命名网站',
    subtitle: record.fields.副标题 || '',
    url,
    favicon: resolveFavicon(record.fields.图标, url),
    category: record.fields.分类 || '其他',
    order: Number(record.fields.排序 || 0),
    categoryOrder: Number(record.fields.分类排序 ?? (Number(record.fields.排序 || 0) || 0))
  };
}

function parseBody(body: unknown) {
  if (!body || typeof body !== 'object') {
    throw new Error('请求体格式错误');
  }

  const candidate = body as BookmarkBody;

  if (!candidate.url) {
    throw new Error('URL 为必填项');
  }

  const normalized = normalizeUrl(candidate.url);

  return {
    url: normalized.toString(),
    title: candidate.title?.trim() || normalized.hostname,
    subtitle: candidate.subtitle?.trim() || '',
    favicon: candidate.favicon?.trim() || `${normalized.origin}/favicon.ico`,
    category: candidate.category?.trim() || '其他',
    order: Number(candidate.order || 0)
  };
}

function parseCategoryOrderBody(body: unknown) {
  if (!body || typeof body !== 'object') {
    throw new Error('请求体格式错误');
  }

  const candidate = body as CategoryOrderBody;
  if (!Array.isArray(candidate.categories) || candidate.categories.length === 0) {
    throw new Error('分类排序不能为空');
  }

  const categories = candidate.categories
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);

  if (categories.length === 0) {
    throw new Error('分类排序不能为空');
  }

  return categories;
}

function parseCategoryCreateBody(body: unknown) {
  if (!body || typeof body !== 'object') {
    throw new Error('请求体格式错误');
  }

  const candidate = body as CategoryCreateBody;
  const name = candidate.name?.trim();

  if (!name) {
    throw new Error('分类名称不能为空');
  }

  return name;
}

async function fetchAllRecords(basePath: string) {
  let allItems: FeishuRecord[] = [];
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
      allItems = allItems.concat(data.data.items);
    }
    hasMore = data.data?.has_more ?? false;
    pageToken = data.data?.page_token;
  }

  return allItems;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    requireAuth(req);
  } catch (error) {
    sendJsonError(res, 401, error instanceof Error ? error.message : '未授权');
    return;
  }

  const { appToken, tableId } = getFeishuConfig();
  const basePath = `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`;

  try {
    if (req.method === 'GET') {
      const allItems = await fetchAllRecords(basePath);

      const bookmarks = allItems
        .map(transformRecord)
        .sort(
          (left, right) =>
            (left.categoryOrder ?? 0) - (right.categoryOrder ?? 0) ||
            left.category.localeCompare(right.category, 'zh-CN') ||
            left.order - right.order ||
            left.title.localeCompare(right.title, 'zh-CN')
        );

      const categoryRank = new Map<string, number>();
      for (const bm of bookmarks) {
        if (!categoryRank.has(bm.category)) {
          categoryRank.set(bm.category, bm.categoryOrder ?? bm.order ?? 0);
        } else {
          categoryRank.set(bm.category, Math.min(categoryRank.get(bm.category) ?? 0, bm.categoryOrder ?? bm.order ?? 0));
        }
      }

      const categories = Array.from(categoryRank.entries())
        .sort((left, right) => left[1] - right[1] || left[0].localeCompare(right[0], 'zh-CN'))
        .map(([name]) => name);

      res.status(200).json({ bookmarks, categories });
      return;
    }

    if (req.method === 'POST') {
      const payload = parseBody(req.body);
      const data = await feishuRequest<{ data?: { record?: FeishuRecord } }>(basePath, {
        method: 'POST',
        body: JSON.stringify({
          fields: {
            标题: payload.title,
            副标题: payload.subtitle,
            链接: {
              link: payload.url,
              text: payload.title
            },
            图标: payload.favicon,
            分类: payload.category,
            排序: payload.order
          }
        })
      });
      res.status(201).json({ bookmark: transformRecord(data.data?.record as FeishuRecord) });
      return;
    }

    if (req.method === 'PUT') {
      const recordId = req.query.id;

      if (typeof recordId !== 'string' || !recordId) {
        sendJsonError(res, 400, '缺少书签 ID');
        return;
      }

      const payload = parseBody(req.body);
      const data = await feishuRequest<{ data?: { record?: FeishuRecord } }>(`${basePath}/${recordId}`, {
        method: 'PUT',
        body: JSON.stringify({
          fields: {
            标题: payload.title,
            副标题: payload.subtitle,
            链接: {
              link: payload.url,
              text: payload.title
            },
            图标: payload.favicon,
            分类: payload.category,
            排序: payload.order
          }
        })
      });
      res.status(200).json({ bookmark: transformRecord(data.data?.record as FeishuRecord) });
      return;
    }

    if (req.method === 'PATCH') {
      const mode = typeof req.query.mode === 'string' ? req.query.mode : undefined;

      if (mode === 'category') {
        const name = parseCategoryCreateBody(req.body);
        const fieldsPath = `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/fields`;
        const fieldList = await feishuRequest<FeishuFieldListResponse>(fieldsPath);
        const categoryField = fieldList.data?.items?.find((item) => item.field_name === '分类');

        if (!categoryField) {
          sendJsonError(res, 400, '未找到分类字段');
          return;
        }

        const options = categoryField.property?.options ?? [];
        if (options.some((option) => option.name === name)) {
          res.status(200).json({ success: true, name });
          return;
        }

        await feishuRequest(`${fieldsPath}/${categoryField.field_id}`, {
          method: 'PUT',
          body: JSON.stringify({
            field_name: '分类',
            type: 3,
            property: {
              options: [
                ...options.map((option) => ({
                  id: option.id,
                  name: option.name,
                  color: option.color ?? 0
                })),
                {
                  name,
                  color: options.length % 54
                }
              ]
            }
          })
        });

        const allItems = await fetchAllRecords(basePath);
        const maxCategoryOrder = allItems.reduce((max, item) => Math.max(max, Number(item.fields.分类排序 || 0)), 0);

        const placeholder = await feishuRequest<{ data?: { record?: FeishuRecord } }>(basePath, {
          method: 'POST',
          body: JSON.stringify({
            fields: {
              标题: CATEGORY_PLACEHOLDER_TITLE,
              副标题: CATEGORY_PLACEHOLDER_SUBTITLE,
              链接: {
                link: CATEGORY_PLACEHOLDER_URL,
                text: CATEGORY_PLACEHOLDER_TITLE
              },
              图标: '',
              分类: name,
              排序: 0,
              分类排序: maxCategoryOrder + 1
            }
          })
        });

        res.status(200).json({ success: true, name, bookmark: transformRecord(placeholder.data?.record as FeishuRecord) });
        return;
      }

      const categories = parseCategoryOrderBody(req.body);
      const allItems = await fetchAllRecords(basePath);

      const recordsByCategory = new Map<string, string[]>();
      for (const item of allItems) {
        const category = item.fields.分类 || '其他';
        const list = recordsByCategory.get(category) ?? [];
        list.push(item.record_id);
        recordsByCategory.set(category, list);
      }

      const records = categories.flatMap((category, index) =>
        (recordsByCategory.get(category) ?? []).map((recordId) => ({
          record_id: recordId,
          fields: {
            分类排序: index + 1
          }
        }))
      );

      if (records.length > 0) {
        await feishuRequest(`${basePath}/batch_update`, {
          method: 'POST',
          body: JSON.stringify({ records })
        });
      }

      res.status(200).json({ success: true });
      return;
    }

    if (req.method === 'DELETE') {
      const recordId = req.query.id;

      if (typeof recordId !== 'string' || !recordId) {
        sendJsonError(res, 400, '缺少书签 ID');
        return;
      }

      await feishuRequest(`${basePath}/${recordId}`, {
        method: 'DELETE'
      });
      res.status(200).json({ success: true });
      return;
    }

    sendMethodNotAllowed(res, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
  } catch (error) {
    sendJsonError(res, 500, error instanceof Error ? error.message : '书签请求失败');
  }
}
