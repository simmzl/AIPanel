#!/usr/bin/env node
import process from 'node:process';
import { readState, updateState, writeState, createInitialState, getDefaultStatePath } from './state.mjs';
import { generateJwtSecret } from './secrets.mjs';
import { runPreflight } from './preflight.mjs';
import { createFeishuBitable, hasExistingFeishuState, hasFeishuBaseAndTable, InstallerStepError } from './feishu.mjs';
import { progress } from './progress.mjs';
import { planVercelSetup, createVercelProject, linkVercelProject, upsertVercelEnv, deployVercelProject } from './vercel.mjs';
import { verifyDeployment } from './verify.mjs';

const command = process.argv[2] || 'help';
const statePath = process.env.AIPANEL_INSTALLER_STATE || getDefaultStatePath();
const dryRun = process.argv.includes('--dry-run');
const execute = process.argv.includes('--execute');
const repair = process.argv.includes('--repair');

function print(obj) {
  process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
}

function inferFinalQuestions(state) {
  const missing = [];
  if (!state.env.ACCESS_PASSWORD) missing.push('ACCESS_PASSWORD');
  if (!state.env.FEISHU_APP_SECRET) missing.push('FEISHU_APP_SECRET');
  return missing;
}

function inferFeishuAppId(state, plan = null) {
  return state?.env?.FEISHU_APP_ID || plan?.env?.FEISHU_APP_ID || null;
}


function buildStatusSummary(state) {
  const missing = inferFinalQuestions(state);
  const done = [];
  if (state.feishu?.appToken && state.feishu?.tableId) done.push('Feishu 数据源');
  if (state.env?.JWT_SECRET) done.push('JWT secret');
  if (state.env?.FEISHU_APP_ID) done.push('Feishu App ID');
  if (state.vercel?.deploymentUrl) done.push('Vercel 部署');
  return {
    stage: state.stage,
    done,
    pendingFinalInputs: missing,
    detectedFeishuAppId: inferFeishuAppId(state),
    nextAction: missing.length
      ? 'collect-final-inputs'
      : state.vercel?.deploymentUrl
        ? 'verify'
        : 'create-vercel'
  };
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

  case 'set-final-inputs': {
    const passwordIndex = process.argv.indexOf('--access-password');
    const secretIndex = process.argv.indexOf('--feishu-app-secret');
    const appIdIndex = process.argv.indexOf('--feishu-app-id');
    const accessPassword = passwordIndex !== -1 ? process.argv[passwordIndex + 1] : null;
    const feishuAppSecret = secretIndex !== -1 ? process.argv[secretIndex + 1] : null;
    const feishuAppId = appIdIndex !== -1 ? process.argv[appIdIndex + 1] : null;

    if (!accessPassword && !feishuAppSecret && !feishuAppId) {
      print({
        ok: false,
        statePath,
        error: 'Provide at least one of --access-password, --feishu-app-id, or --feishu-app-secret.'
      });
      break;
    }

    const next = updateState({
      stage: 'configure',
      env: {
        ACCESS_PASSWORD: accessPassword || undefined,
        FEISHU_APP_ID: feishuAppId || undefined,
        FEISHU_APP_SECRET: feishuAppSecret || undefined
      }
    }, statePath);
    print({ ok: true, statePath, state: next });
    break;
  }

  case 'clear-errors': {
    const next = updateState({ errors: [] }, statePath);
    print({ ok: true, statePath, state: next });
    break;
  }

  case 'create-feishu': {
    const current = readState(statePath);

    if (hasExistingFeishuState(current) && !repair) {
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

    progress('开始创建 Feishu 数据源', { dryRun, execute, repair });

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
        link: linkVercelProject({ projectName: plan.projectName, cwd: '/tmp/AIPanel', dryRun: true }),
        env: upsertVercelEnv({ cwd: '/tmp/AIPanel', envMap: plan.env, dryRun: true }),
        deploy: deployVercelProject({ cwd: '/tmp/AIPanel', dryRun: true })
      });
      break;
    }

    if (!plan.ready) {
      print({
        ok: false,
        dryRun: false,
        statePath,
        error: 'create-vercel blocked: required environment variables are still missing.',
        missing: plan.missing,
        plan
      });
      break;
    }

    const project = createVercelProject({ projectName: plan.projectName, cwd: '/tmp/AIPanel', dryRun: false });
    const link = linkVercelProject({ projectName: plan.projectName, cwd: '/tmp/AIPanel', dryRun: false });
    const env = upsertVercelEnv({ cwd: '/tmp/AIPanel', envMap: plan.env, dryRun: false });
    const deploy = deployVercelProject({ cwd: '/tmp/AIPanel', dryRun: false });

    const next = updateState({
      stage: 'deploy-vercel',
      vercel: {
        projectName: plan.projectName,
        projectId: deploy.projectId || current.vercel.projectId,
        deploymentUrl: deploy.deploymentUrl || current.vercel.deploymentUrl
      }
    }, statePath);

    print({ ok: true, dryRun: false, statePath, plan, project, link, env, deploy, state: next });
    break;
  }

  case 'run': {
    const current = readState(statePath);
    let next = current;

    if (!next.env.JWT_SECRET) {
      next = updateState({
        stage: 'configure',
        env: { JWT_SECRET: generateJwtSecret() }
      }, statePath);
    }

    const plan = planVercelSetup(next);
    next = updateState({
      stage: 'configure',
      env: {
        FEISHU_APP_ID: plan.env.FEISHU_APP_ID || next.env.FEISHU_APP_ID
      },
      vercel: {
        projectName: plan.projectName
      },
      errors: []
    }, statePath);

    const pendingQuestions = inferFinalQuestions(next);
    next = updateState({ stage: pendingQuestions.length ? 'ask-final-inputs' : 'configure' }, statePath);

    print({
      ok: true,
      statePath,
      stage: next.stage,
      state: next,
      pendingQuestions,
      message: pendingQuestions.length
        ? 'Installer progressed automatically. Final user input still required for the listed fields before Vercel production deploy.'
        : 'Installer has all required final inputs and can proceed to create-vercel --execute.'
    ,
      detectedFeishuAppId: inferFeishuAppId(next, plan)
    });
    break;
  }

  case 'show': {
    const state = readState(statePath);
    print({ ok: true, statePath, state });
    break;
  }

  case 'status': {
    const state = readState(statePath);
    print({ ok: true, statePath, summary: buildStatusSummary(state), state });
    break;
  }

  case 'verify': {
    const state = readState(statePath);
    const result = await verifyDeployment(state);
    const next = updateState({ stage: result.ok ? 'done' : 'verify' }, statePath);
    print({ ok: result.ok, statePath, result, state: next });
    break;
  }

  default: {
    print({
      ok: false,
      usage: [
        'node scripts/installer/cli.mjs init',
        'node scripts/installer/cli.mjs preflight',
        'node scripts/installer/cli.mjs generate-jwt',
        'node scripts/installer/cli.mjs set-final-inputs --access-password <password> --feishu-app-id <appId> --feishu-app-secret <secret>',
        'node scripts/installer/cli.mjs clear-errors',
        'node scripts/installer/cli.mjs create-feishu --dry-run',
        'node scripts/installer/cli.mjs create-feishu --execute',
        'node scripts/installer/cli.mjs create-vercel --dry-run',
        'node scripts/installer/cli.mjs create-vercel --execute',
        'node scripts/installer/cli.mjs run',
        'node scripts/installer/cli.mjs show',
        'node scripts/installer/cli.mjs status',
        'node scripts/installer/cli.mjs verify'
      ]
    });
  }
}
