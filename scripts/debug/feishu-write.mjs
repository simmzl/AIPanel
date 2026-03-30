#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
loadEnvFile(path.join(repoRoot, '.env.local'));
loadEnvFile(path.join(repoRoot, '.env.vercel.local'));

const legacyAliases = {
  FEISHU_BITABLE_APP_TOKEN: ['FEISHU_APP_TOKEN'],
  FEISHU_BITABLE_TABLE_ID: ['FEISHU_TABLE_ID']
};

function getEnv(name) {
  for (const candidate of [name, ...(legacyAliases[name] ?? [])]) {
    const value = process.env[candidate];
    if (value) return value;
  }
  throw new Error(`Missing environment variable: ${name}`);
}

async function getTenantAccessToken() {
  const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: getEnv('FEISHU_APP_ID'),
      app_secret: getEnv('FEISHU_APP_SECRET')
    })
  });

  const data = await response.json();
  if (!response.ok || data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`Feishu auth failed: ${JSON.stringify(data)}`);
  }

  return data.tenant_access_token;
}

async function feishuRequest(pathname, init = {}) {
  const token = await getTenantAccessToken();
  const response = await fetch(`https://open.feishu.cn${pathname}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {})
    }
  });

  const rawText = await response.text();
  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = rawText;
  }

  if (!response.ok || (data && typeof data === 'object' && 'code' in data && data.code !== 0)) {
    throw new Error(`Feishu request failed: ${JSON.stringify({ httpStatus: response.status, pathname, response: data })}`);
  }

  return data;
}

const appToken = getEnv('FEISHU_BITABLE_APP_TOKEN');
const tableId = getEnv('FEISHU_BITABLE_TABLE_ID');
const sourceUrl = process.env.FEISHU_BITABLE_SOURCE_URL || 'https://example.invalid/aipanel';
const now = new Date().toISOString();

const payload = {
  fields: {
    标题: `DEBUG ${now}`,
    副标题: 'Local AIPanel debug write test',
    链接: {
      link: sourceUrl,
      text: 'AIPanel Debug'
    },
    图标: `${sourceUrl.replace(/\/$/, '')}/favicon.ico`,
    分类: '其他',
    排序: 999999
  }
};

const result = await feishuRequest(`/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`, {
  method: 'POST',
  body: JSON.stringify(payload)
});

console.log(JSON.stringify({ ok: true, appToken, tableId, recordId: result?.data?.record?.record_id ?? null }, null, 2));
