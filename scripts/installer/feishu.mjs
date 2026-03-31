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
  { field_name: '分类', type: 'select', options: [{ name: '其他' }] },
  { field_name: '排序', type: 'number' },
  { field_name: '分类排序', type: 'number' }
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
      fieldResults: []
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

  return {
    dryRun: false,
    ...partial
  };
}
