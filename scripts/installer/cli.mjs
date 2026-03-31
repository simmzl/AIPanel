#!/usr/bin/env node
import process from 'node:process';
import { readState, updateState, writeState, createInitialState, getDefaultStatePath } from './state.mjs';
import { generateJwtSecret } from './secrets.mjs';
import { runPreflight } from './preflight.mjs';
import { createFeishuBitable, hasExistingFeishuState } from './feishu.mjs';
import { progress } from './progress.mjs';

const command = process.argv[2] || 'help';
const statePath = process.env.AIPANEL_INSTALLER_STATE || getDefaultStatePath();
const dryRun = process.argv.includes('--dry-run');
const execute = process.argv.includes('--execute');

function print(obj) {
  process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
}

switch (command) {
  case 'init': {
    const state = createInitialState();
    writeState(state, statePath);
    print({ ok: true, statePath, state });
    break;
  }

  case 'preflight': {
    const result = runPreflight();
    const next = updateState({ stage: 'preflight' }, statePath);
    print({ ok: result.status === 'ready', statePath, result, state: next });
    break;
  }

  case 'generate-jwt': {
    const secret = generateJwtSecret();
    const next = updateState({
      stage: 'configure',
      env: { JWT_SECRET: secret }
    }, statePath);
    print({ ok: true, statePath, jwtGenerated: true, state: next });
    break;
  }

  case 'create-feishu': {
    const current = readState(statePath);

    if (hasExistingFeishuState(current)) {
      print({
        ok: true,
        reused: true,
        statePath,
        message: 'Installer state already contains Feishu Bitable info; skipping duplicate creation.',
        state: current
      });
      break;
    }

    if (!dryRun && !execute) {
      print({
        ok: false,
        statePath,
        error: 'create-feishu will create real Feishu resources. Re-run with --execute to continue, or use --dry-run first.'
      });
      break;
    }

    progress('开始创建 Feishu 数据源', { dryRun, execute });

    try {
      const created = createFeishuBitable({ appName: 'AIPanel', dryRun });
      if (dryRun) {
        print({ ok: true, dryRun: true, statePath, result: created });
        break;
      }
      const next = updateState({
        stage: 'create-feishu',
        feishu: {
          appToken: created.baseToken,
          tableId: created.tableId,
          sourceUrl: created.sourceUrl
        },
        env: {
          FEISHU_BITABLE_APP_TOKEN: created.baseToken,
          FEISHU_BITABLE_TABLE_ID: created.tableId,
          FEISHU_BITABLE_SOURCE_URL: created.sourceUrl
        }
      }, statePath);
      print({ ok: true, dryRun: false, statePath, result: created, state: next });
    } catch (error) {
      const next = updateState({
        errors: [...current.errors, error instanceof Error ? error.message : String(error)]
      }, statePath);
      print({
        ok: false,
        dryRun,
        statePath,
        error: error instanceof Error ? error.message : String(error),
        state: next
      });
    }
    break;
  }

  case 'show': {
    print({ ok: true, statePath, state: readState(statePath) });
    break;
  }

  default: {
    print({
      ok: false,
      usage: [
        'node scripts/installer/cli.mjs init',
        'node scripts/installer/cli.mjs preflight',
        'node scripts/installer/cli.mjs generate-jwt',
        'node scripts/installer/cli.mjs create-feishu --dry-run',
        'node scripts/installer/cli.mjs create-feishu --execute',
        'node scripts/installer/cli.mjs show'
      ]
    });
  }
}
