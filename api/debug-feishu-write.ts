import type { ApiRequest, ApiResponse } from './_lib.js';
import {
  feishuRequest,
  getFeishuConfig,
  requireAuth,
  sendJsonError,
  sendMethodNotAllowed
} from './_lib.js';

interface FeishuRecord {
  record_id: string;
  fields?: Record<string, unknown>;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    requireAuth(req);
  } catch (error) {
    sendJsonError(res, 401, error instanceof Error ? error.message : '未授权');
    return;
  }

  if (req.method !== 'POST') {
    sendMethodNotAllowed(res, ['POST']);
    return;
  }

  const { appToken, tableId } = getFeishuConfig();
  const basePath = `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`;
  const now = new Date().toISOString();

  try {
    const data = await feishuRequest<{ data?: { record?: FeishuRecord } }>(basePath, {
      method: 'POST',
      body: JSON.stringify({
        fields: {
          标题: `DEBUG ${now}`,
          副标题: 'AIPanel debug write test',
          链接: {
            link: 'https://panel.simmzl.cn/',
            text: 'AIPanel Debug'
          },
          图标: 'https://panel.simmzl.cn/favicon.ico',
          分类: '其他',
          排序: 999999
        }
      })
    });

    res.status(200).json({
      ok: true,
      message: '写入测试成功',
      recordId: data.data?.record?.record_id ?? null,
      appToken,
      tableId
    });
  } catch (error) {
    sendJsonError(res, 500, error instanceof Error ? error.message : '调试写入失败');
  }
}
