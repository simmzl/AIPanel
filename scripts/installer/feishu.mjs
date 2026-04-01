import { execFileSync } from 'node:child_process';

const DEFAULT_TABLE_NAME = 'Bookmarks';

export class InstallerStepError extends Error {
  constructor(message, partial = {}) {
    super(message);
    this.name = 'InstallerStepError';
    this.partial = partial;
  }
}

const DEFAULT_FIELDS = [
  { field_name: '标题', type: 'text' },
  { field_name: '副标题', type: 'text' },
  { field_name: '链接', type: 'text' },
  { field_name: '图标', type: 'text' },
  { field_name: '分类', type: 'select', options: [{ name: '其他' }, { name: 'AI' }, { name: '古法' }] },
  { field_name: '排序', type: 'number' },
  { field_name: '分类排序', type: 'number' }
];

const DEFAULT_RECORDS = [
  {
    favicon: 'https://cursor.com/favicon.ico',
    title: 'Cursor',
    subtitle: 'The best way to code with AI.',
    url: 'https://cursor.com',
    category: 'AI'
  },
  {
    favicon: 'https://claude.ai/favicon.ico',
    title: 'Claude',
    subtitle: 'Meet your thinking partner — tackle big challenges with Claude.',
    url: 'https://claude.ai',
    category: 'AI'
  },
  {
    favicon: 'https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://gemini.google.com&size=64',
    title: 'Google Gemini',
    subtitle: 'Google 的 AI 助手，对话、创作与推理。',
    url: 'https://gemini.google.com',
    category: 'AI'
  },
  {
    favicon: 'https://chatgpt.com/favicon.ico',
    title: 'ChatGPT',
    subtitle: 'OpenAI 的对话式 AI，用于问答、写作与编程等。',
    url: 'https://chatgpt.com',
    category: 'AI'
  },
  {
    favicon: 'https://developer.mozilla.org/favicon.ico',
    title: 'MDN Web Docs',
    subtitle: 'Resources for developers, by developers — documenting the open web since 2005.',
    url: 'https://developer.mozilla.org',
    category: '古法'
  },
  {
    favicon: 'https://stackoverflow.com/Content/Sites/stackoverflow/Img/favicon.ico',
    title: 'Stack Overflow',
    subtitle: 'Where developers learn, share, & build careers.',
    url: 'https://stackoverflow.com',
    category: '古法'
  }
];

function extractJsonBlock(text) {
  const trimmed = text.trim();
  if (!trimmed) return '{}';
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Unable to extract JSON from CLI output: ${trimmed}`);
  }
  return trimmed.slice(start, end + 1);
}

function runJson(command, args, { dryRun = false } = {}) {
  const finalArgs = [...args];
  if (dryRun) finalArgs.push('--dry-run');
  const output = execFileSync(command, finalArgs, { encoding: 'utf8' });
  const jsonText = extractJsonBlock(output);
  return JSON.parse(jsonText);
}

function safeSourceUrl(baseToken, tableId, baseUrl = null) {
  if (baseUrl && tableId) {
    return `${baseUrl}?table=${tableId}`;
  }
  if (baseUrl) {
    return baseUrl;
  }
  return `https://feishu.cn/base/${baseToken}?table=${tableId}`;
}

function extractBaseToken(baseCreate) {
  return (
    baseCreate?.data?.base?.base_token ||
    baseCreate?.data?.base?.app_token ||
    baseCreate?.data?.app?.app_token ||
    baseCreate?.app_token ||
    baseCreate?.base_token ||
    null
  );
}

function extractBaseUrl(baseCreate) {
  return baseCreate?.data?.base?.url || null;
}

function extractTableId(tableCreate) {
  return (
    tableCreate?.data?.table?.id ||
    tableCreate?.data?.table_id ||
    tableCreate?.table_id ||
    tableCreate?.data?.table?.table_id ||
    null
  );
}

function listTables(baseToken) {
  return runJson('lark-cli', ['base', '+table-list', '--base-token', baseToken]);
}

function listFields(baseToken, tableId) {
  return runJson('lark-cli', ['base', '+field-list', '--base-token', baseToken, '--table-id', tableId]);
}

function findTableByName(baseToken, tableName) {
  const result = listTables(baseToken);
  return result?.data?.items?.find((item) => item.table_name === tableName) || null;
}

function getExistingFieldNames(baseToken, tableId) {
  const result = listFields(baseToken, tableId);
  return new Set((result?.data?.items || []).map((item) => item.field_name));
}

function listRecords(baseToken, tableId) {
  return runJson('lark-cli', ['base', '+record-list', '--base-token', baseToken, '--table-id', tableId]);
}

function hasAnyRecords(baseToken, tableId) {
  const result = listRecords(baseToken, tableId);
  return Array.isArray(result?.data?.items) && result.data.items.length > 0;
}

function seedDefaultRecords(baseToken, tableId) {
  const existing = hasAnyRecords(baseToken, tableId);
  if (existing) {
    return { skipped: true, reason: 'records-already-exist' };
  }

  const records = DEFAULT_RECORDS.map((item, index) => ({
    fields: {
      标题: item.title,
      副标题: item.subtitle,
      链接: item.url,
      图标: item.favicon,
      分类: item.category,
      排序: index + 1,
      分类排序: item.category === 'AI' ? 1 : 2
    }
  }));

  return runJson('lark-cli', [
    'base',
    '+record-batch-create',
    '--base-token',
    baseToken,
    '--table-id',
    tableId,
    '--json',
    JSON.stringify({ records })
  ]);
}

export function getAipanelFieldSchema() {
  return DEFAULT_FIELDS;
}

export function hasExistingFeishuState(state) {
  return Boolean(
    state?.feishu?.appToken &&
      state?.feishu?.tableId &&
      state?.feishu?.sourceUrl
  );
}

export function hasFeishuBaseAndTable(state) {
  return Boolean(state?.feishu?.appToken && state?.feishu?.tableId);
}

export function createFeishuBitable({ appName = 'AIPanel', dryRun = false, resume = null } = {}) {
  const baseName = `${appName}`;
  const resumedBaseToken = resume?.baseToken || null;
  const resumedBaseUrl = resume?.baseUrl || null;
  const resumedTableId = resume?.tableId || null;
  const baseCreate = resumedBaseToken
    ? { ok: true, resumed: true, data: { base: { base_token: resumedBaseToken, url: resumedBaseUrl, name: baseName } } }
    : runJson('lark-cli', [
        'base',
        '+base-create',
        '--name',
        baseName,
        '--time-zone',
        'Asia/Shanghai'
      ], { dryRun });

  if (dryRun) {
    return {
      dryRun: true,
      steps: {
        baseCreate,
        tableCreate: runJson('lark-cli', [
          'base',
          '+table-create',
          '--base-token',
          'bascn_dummy',
          '--name',
          DEFAULT_TABLE_NAME
        ], { dryRun }),
        fieldCreates: DEFAULT_FIELDS.map((field) =>
          runJson('lark-cli', [
            'base',
            '+field-create',
            '--base-token',
            'bascn_dummy',
            '--table-id',
            'tbl_dummy',
            '--json',
            JSON.stringify(field)
          ], { dryRun })
        )
      }
    };
  }

  const baseToken = extractBaseToken(baseCreate);
  const baseUrl = extractBaseUrl(baseCreate);
  if (!baseToken) {
    throw new InstallerStepError(
      `Unable to determine base token from base-create response: ${JSON.stringify(baseCreate)}`,
      { raw: { baseCreate } }
    );
  }

  const partial = {
    baseToken,
    baseUrl,
    sourceUrl: safeSourceUrl(baseToken, null, baseUrl),
    tableId: null,
    tableName: DEFAULT_TABLE_NAME,
    fields: DEFAULT_FIELDS,
    raw: {
      baseCreate,
      tableCreate: null,
      fieldResults: [],
      seedResult: null
    }
  };

  const existingTable = resumedTableId
    ? { table_id: resumedTableId, table_name: DEFAULT_TABLE_NAME }
    : findTableByName(baseToken, DEFAULT_TABLE_NAME);

  const tableCreate = existingTable
    ? { ok: true, identity: 'user', resumed: true, data: { table: { id: existingTable.table_id, name: existingTable.table_name } } }
    : runJson('lark-cli', [
        'base',
        '+table-create',
        '--base-token',
        baseToken,
        '--name',
        DEFAULT_TABLE_NAME
      ]);
  partial.raw.tableCreate = tableCreate;

  const tableId = extractTableId(tableCreate);
  if (!tableId) {
    throw new InstallerStepError(
      `Unable to determine table id from table-create response: ${JSON.stringify(tableCreate)}`,
      partial
    );
  }

  partial.tableId = tableId;
  partial.sourceUrl = safeSourceUrl(baseToken, tableId, baseUrl);

  const existingFieldNames = getExistingFieldNames(baseToken, tableId);

  for (const field of DEFAULT_FIELDS) {
    if (existingFieldNames.has(field.field_name)) {
      partial.raw.fieldResults.push({ field: field.field_name, skipped: true, reason: 'already-exists' });
      continue;
    }

    try {
      const created = runJson('lark-cli', [
        'base',
        '+field-create',
        '--base-token',
        baseToken,
        '--table-id',
        tableId,
        '--json',
        JSON.stringify(field)
      ]);
      partial.raw.fieldResults.push({ field: field.field_name, result: created });
    } catch (error) {
      throw new InstallerStepError(
        `Failed while creating field \"${field.field_name}\": ${error instanceof Error ? error.message : String(error)}`,
        partial
      );
    }
  }

  try {
    partial.raw.seedResult = seedDefaultRecords(baseToken, tableId);
  } catch (error) {
    throw new InstallerStepError(
      `Failed while seeding default records: ${error instanceof Error ? error.message : String(error)}`,
      partial
    );
  }

  return {
    dryRun: false,
    ...partial
  };
}
