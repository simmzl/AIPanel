import jwt from 'jsonwebtoken';

export interface ApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
}

export interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

interface FeishuAccessTokenCache {
  token: string;
  expiresAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __aiPanelFeishuTokenCache: FeishuAccessTokenCache | undefined;
}

const ACCESS_TOKEN_BUFFER_MS = 5 * 60 * 1000;
export function sendMethodNotAllowed(res: ApiResponse, allowed: string[]) {
  res.setHeader('Allow', allowed.join(', '));
  res.status(405).json({ message: 'Method Not Allowed' });
}

export function sendJsonError(res: ApiResponse, status: number, message: string) {
  res.status(status).json({ message });
}

const LEGACY_ENV_ALIASES: Record<string, string[]> = {
  FEISHU_BITABLE_APP_TOKEN: ['FEISHU_APP_TOKEN'],
  FEISHU_BITABLE_TABLE_ID: ['FEISHU_TABLE_ID']
};

export function getEnv(name: string): string {
  const candidates = [name, ...(LEGACY_ENV_ALIASES[name] ?? [])];

  for (const candidate of candidates) {
    const value = process.env[candidate];

    if (value) {
      return value;
    }
  }

  const aliasMessage = LEGACY_ENV_ALIASES[name]?.length
    ? ` (legacy aliases also checked: ${LEGACY_ENV_ALIASES[name].join(', ')})`
    : '';

  throw new Error(`Missing environment variable: ${name}${aliasMessage}`);
}

export function getFeishuConfig() {
  return {
    appId: getEnv('FEISHU_APP_ID'),
    appSecret: getEnv('FEISHU_APP_SECRET'),
    appToken: getEnv('FEISHU_BITABLE_APP_TOKEN'),
    tableId: getEnv('FEISHU_BITABLE_TABLE_ID')
  };
}

export function createJwt() {
  const secret = getEnv('JWT_SECRET');

  return jwt.sign({ scope: 'aipanel' }, secret, {
    expiresIn: '7d'
  });
}

export function verifyJwtToken(token: string) {
  const secret = getEnv('JWT_SECRET');
  return jwt.verify(token, secret);
}

export function getBearerToken(req: ApiRequest): string | null {
  const header = req.headers.authorization;

  if (!header || Array.isArray(header)) {
    return null;
  }

  const [type, token] = header.split(' ');

  if (type !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

export function requireAuth(req: ApiRequest) {
  const token = getBearerToken(req);

  if (!token) {
    throw new Error('未提供授权 token');
  }

  verifyJwtToken(token);
  return token;
}

export function normalizeUrl(rawUrl: string): URL {
  try {
    return new URL(rawUrl);
  } catch {
    return new URL(`https://${rawUrl}`);
  }
}

export async function getFeishuTenantAccessToken() {
  const cache = globalThis.__aiPanelFeishuTokenCache;

  if (cache && cache.expiresAt > Date.now()) {
    return cache.token;
  }

  const { appId, appSecret } = getFeishuConfig();
  const response = await fetch(
    'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: appId,
        app_secret: appSecret
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Feishu auth failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    code: number;
    msg?: string;
    tenant_access_token?: string;
    expire?: number;
  };

  if (data.code !== 0 || !data.tenant_access_token || !data.expire) {
    throw new Error(data.msg || 'Failed to fetch Feishu access token');
  }

  globalThis.__aiPanelFeishuTokenCache = {
    token: data.tenant_access_token,
    expiresAt: Date.now() + data.expire * 1000 - ACCESS_TOKEN_BUFFER_MS
  };

  return data.tenant_access_token;
}

export async function feishuRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getFeishuTenantAccessToken();
  const response = await fetch(`https://open.feishu.cn${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {})
    }
  });

  const rawText = await response.text();
  let data: ({ code?: number; msg?: string; request_id?: string; RequestId?: string } & T) | null = null;

  try {
    data = rawText ? (JSON.parse(rawText) as ({ code?: number; msg?: string; request_id?: string; RequestId?: string } & T)) : null;
  } catch {
    data = null;
  }

  const businessCode = typeof data?.code === 'number' ? data.code : undefined;
  const requestId = data?.request_id || data?.RequestId || response.headers.get('x-tt-logid') || response.headers.get('x-request-id');

  if (!response.ok || businessCode !== 0) {
    const detail = {
      httpStatus: response.status,
      feishuCode: businessCode,
      msg: data?.msg,
      requestId,
      path,
      method: init.method || 'GET',
      responseBody: data ?? rawText
    };

    throw new Error(`Feishu request failed: ${JSON.stringify(detail)}`);
  }

  return (data ?? ({} as T)) as T;
}
