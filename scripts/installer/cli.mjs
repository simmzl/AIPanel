#!/usr/bin/env node
import process from 'node:process';
import { readState, updateState, writeState, createInitialState, getDefaultStatePath } from './state.mjs';
import { generateJwtSecret } from './secrets.mjs';
import { runPreflight } from './preflight.mjs';
import { createFeishuBitable, hasExistingFeishuState, hasFeishuBaseAndTable, InstallerStepError } from './feishu.mjs';
import { progress } from './progress.mjs';
import { planVercelSetup, createVercelProject, upsertVercelEnv, deployVercelProject } from './vercel.mjs';

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

    if (hasExistingFeishuState(current) && !process.argv.includes('--repair')) {
      print({
        ok: true,
        reused: true,
        statePath,
        message: 'Installer state already contains Feishu Bitable info; skipping duplicate creation. Use --repair to continue filling schema.',
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

    const started = updateState({
      stage: 'create-feishu',
      errors: current.errors
    }, statePath);

    try {
      const created = createFeishuBitable({
        appName: started.appName || 'AIPanel',
        dryRun,
        resume: hasFeishuBaseAndTable(started)
          ? {
              baseToken: started.feishu.appToken,
              baseUrl: started.feishu.sourceUrl ? started.feishu.sourceUrl.split('?')[0] : null,
              tableId: started.feishu.tableId
            }
          : started.feishu.appToken
            ? {
                baseToken: started.feishu.appToken,
                baseUrl: started.feishu.sourceUrl ? started.feishu.sourceUrl.split('?')[0] : null
              }
            : null
      });
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
        },
        errors: current.errors
      }, statePath);
      print({ ok: true, dryRun: false, statePath, result: created, state: next });
    } catch (error) {
      const partial = error instanceof InstallerStepError ? error.partial || {} : {};
      const next = updateState({
        feishu: {
          appToken: partial.baseToken || current.feishu.appToken,
          tableId: partial.tableId || current.feishu.tableId,
          sourceUrl: partial.sourceUrl || partial.baseUrl || current.feishu.sourceUrl
        },
        env: {
          FEISHU_BITABLE_APP_TOKEN: partial.baseToken || current.env.FEISHU_BITABLE_APP_TOKEN,
          FEISHU_BITABLE_TABLE_ID: partial.tableId || current.env.FEISHU_BITABLE_TABLE_ID,
          FEISHU_BITABLE_SOURCE_URL: partial.sourceUrl || partial.baseUrl || current.env.FEISHU_BITABLE_SOURCE_URL
        },
        errors: [...current.errors, error instanceof Error ? error.message : String(error)]
      }, statePath);
      print({
        ok: false,
        dryRun,
        statePath,
        error: error instanceof Error ? error.message : String(error),
        partial,
        state: next
      });
    }
    break;
  }

  case 'create-vercel': {
    const current = readState(statePath);

    if (!dryRun && !execute) {
      print({
        ok: false,
        statePath,
        error: 'create-vercel will create/update real Vercel resources. Re-run with --execute to continue, or use --dry-run first.'
      });
      break;
    }

    progress('开始创建 Vercel 项目与部署', { dryRun, execute });
    const plan = planVercelSetup(current);

    if (dryRun) {
      print({
        ok: true,
        dryRun: true,
        statePath,
        plan,
        project: createVercelProject({ projectName: plan.projectName, cwd: '/tmp/AIPanel', dryRun: true }),
        env: upsertVercelEnv({ cwd: '/tmp/AIPanel', envMap: plan.env, dryRun: true }),
        deploy: deployVercelProject({ cwd: '/tmp/AIPanel', dryRun: true })
      });
      break;
    }

    const project = createVercelProject({ projectName: plan.projectName, cwd: '/tmp/AIPanel', dryRun: false });
    const env = upsertVercelEnv({ cwd: '/tmp/AIPanel', envMap: plan.env, dryRun: false });
    const deploy = deployVercelProject({ cwd: '/tmp/AIPanel', dryRun: false });

    const next = updateState({
      stage: 'create-vercel',
      vercel: {
        projectName: plan.projectName,
        projectId: deploy.projectId || current.vercel.projectId,
        deploymentUrl: deploy.deploymentUrl || current.vercel.deploymentUrl
      }
    }, statePath);

    print({ ok: true, dryRun: false, statePath, plan, project, env, deploy, state: next });
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
        'node scripts/installer/cli.mjs create-vercel --dry-run',
        'node scripts/installer/cli.mjs create-vercel --execute',
        'node scripts/installer/cli.mjs show'
      ]
    });
  }
}
