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
  { field_name: '标题', type: 1 },
  { field_name: '副标题', type: 1 },
  { field_name: '链接', type: 15 },
  { field_name: '图标', type: 1 },
  { field_name: '分类', type: 3, property: { options: [{ name: '其他' }] } },
  { field_name: '排序', type: 2 },
  { field_name: '分类排序', type: 2 }
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

function safeSourceUrl(baseToken, tableId) {
  return `https://feishu.cn/base/${baseToken}?table=${tableId}`;
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

export function createFeishuBitable({ appName = 'AIPanel', dryRun = false } = {}) {
  const baseName = `${appName}`;
  const baseCreate = runJson('lark-cli', [
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

  const baseToken = baseCreate?.data?.base?.app_token || baseCreate?.data?.app?.app_token || baseCreate?.app_token || baseCreate?.base_token;
  if (!baseToken) {
    throw new Error(`Unable to determine base token from base-create response: ${JSON.stringify(baseCreate)}`);
  }

  const tableCreate = runJson('lark-cli', [
    'base',
    '+table-create',
    '--base-token',
    baseToken,
    '--name',
    DEFAULT_TABLE_NAME
  ]);

  const tableId = tableCreate?.data?.table_id || tableCreate?.table_id || tableCreate?.data?.table?.table_id;
  if (!tableId) {
    throw new Error(`Unable to determine table id from table-create response: ${JSON.stringify(tableCreate)}`);
  }

  const fieldResults = [];
  for (const field of DEFAULT_FIELDS) {
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
    fieldResults.push(created);
  }

  return {
    dryRun: false,
    baseToken,
    tableId,
    sourceUrl: safeSourceUrl(baseToken, tableId),
    tableName: DEFAULT_TABLE_NAME,
    fields: DEFAULT_FIELDS,
    raw: {
      baseCreate,
      tableCreate,
      fieldResults
    }
  };
}
