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


function resolveRepoRoot(state) {
  const fromEnv = process.env.AIPANEL_REPO_DIR;
  if (fromEnv) return fromEnv;
  if (state?.repoRoot) return state.repoRoot;
  return process.cwd();
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



function buildFinalInputPrompt(state) {
  const missing = inferFinalQuestions(state);
  const appId = inferFeishuAppId(state);

  if (missing.length === 0) {
    return {
      missing,
      mode: 'none',
      message: 'All final user inputs are already present.'
    };
  }

  if (missing.length === 2) {
    return {
      missing,
      mode: 'both',
      message: appId
        ? `现在还差最后两项信息，我就可以继续部署：\n1. AIPanel 访问密码\n2. Feishu App Secret\n\n注意：这里的 App Secret 需要对应我自动识别到的 Feishu App ID：${appId}`
        : '现在还差最后两项信息，我就可以继续部署：\n1. AIPanel 访问密码\n2. Feishu App Secret\n\n但我当前还没有自动识别到 Feishu App ID，所以还不能准确说明这个 App Secret 应该对应哪个应用。'
    };
  }

  if (missing.includes('ACCESS_PASSWORD')) {
    return {
      missing,
      mode: 'password-only',
      message: '现在只差 AIPanel 访问密码。你发我密码后，我就继续完成部署。'
    };
  }

  return {
    missing,
    mode: appId ? 'app-secret-only' : 'app-secret-blocked',
    message: appId
      ? `现在只差 Feishu App Secret。请提供 Feishu App ID ${appId} 对应的 App Secret。`
      : '现在只差 Feishu App Secret，但我当前没有自动识别到 Feishu App ID，所以还不能准确提示你该提供哪个应用的密钥。请先检查本地 Feishu/Lark 登录上下文。'
  };
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


async function runContinueFlow({ statePath, execute = false }) {
  let state = readState(statePath);
  const repoRoot = resolveRepoRoot(state);
  state = updateState({ repoRoot }, statePath);
  const steps = [];

  const preflight = runPreflight();
  steps.push({ step: 'preflight', ok: preflight.status === 'ready', result: preflight });
  state = updateState({ stage: 'preflight' }, statePath);
  if (preflight.status !== 'ready') {
    return {
      ok: false,
      blocked: true,
      stage: state.stage,
      nextAction: 'fix-preflight',
      steps,
      state,
      finalInputPrompt: buildFinalInputPrompt(state)
    };
  }

  if (!state.env.JWT_SECRET) {
    state = updateState({ stage: 'configure', env: { JWT_SECRET: generateJwtSecret() } }, statePath);
    steps.push({ step: 'generate-jwt', ok: true });
  }

  const inferredPlan = planVercelSetup(state);
  if (inferredPlan.env.FEISHU_APP_ID && state.env.FEISHU_APP_ID !== inferredPlan.env.FEISHU_APP_ID) {
    state = updateState({ stage: 'configure', env: { FEISHU_APP_ID: inferredPlan.env.FEISHU_APP_ID } }, statePath);
    steps.push({ step: 'infer-feishu-app-id', ok: true, detectedFeishuAppId: inferredPlan.env.FEISHU_APP_ID });
  }

  if (!hasExistingFeishuState(state)) {
    if (!execute) {
      state = updateState({ stage: 'create-feishu', repoRoot }, statePath);
      return {
        ok: true,
        blocked: false,
        requiresExecute: true,
        stage: state.stage,
        nextAction: 'create-feishu',
        message: 'Feishu data source has not been created yet. Re-run continue with --execute to create it.',
        steps,
        state,
        finalInputPrompt: buildFinalInputPrompt(state)
      };
    }

    try {
      const created = createFeishuBitable({
        appName: state.appName || 'AIPanel',
        dryRun: false,
        resume: null
      });
      state = updateState({
        stage: 'configure',
        repoRoot,
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
      steps.push({ step: 'create-feishu', ok: true, result: created });
    } catch (error) {
      state = readState(statePath);
      return {
        ok: false,
        blocked: true,
        stage: state.stage,
        nextAction: 'inspect-create-feishu-error',
        error: error instanceof Error ? error.message : String(error),
        steps,
        state,
        finalInputPrompt: buildFinalInputPrompt(state)
      };
    }
  }

  const pendingQuestions = inferFinalQuestions(state);
  if (pendingQuestions.length) {
    state = updateState({ stage: 'ask-final-inputs', repoRoot }, statePath);
    return {
      ok: true,
      blocked: true,
      stage: state.stage,
      nextAction: 'collect-final-inputs',
      pendingQuestions,
      steps,
      state,
      finalInputPrompt: buildFinalInputPrompt(state)
    };
  }

  const plan = planVercelSetup(state);
  steps.push({ step: 'plan-vercel', ok: plan.ready, result: plan });
  if (!plan.ready) {
    state = updateState({ stage: 'configure', repoRoot }, statePath);
    return {
      ok: false,
      blocked: true,
      stage: state.stage,
      nextAction: 'fix-missing-env',
      missing: plan.missing,
      steps,
      state,
      finalInputPrompt: buildFinalInputPrompt(state)
    };
  }

  if (!state.vercel?.deploymentUrl) {
    if (!execute) {
      state = updateState({ stage: 'deploy-vercel', repoRoot, vercel: { projectName: plan.projectName } }, statePath);
      return {
        ok: true,
        blocked: false,
        requiresExecute: true,
        stage: state.stage,
        nextAction: 'create-vercel',
        message: 'Deployment has not been created yet. Re-run continue with --execute to create/update Vercel resources.',
        steps,
        state,
        finalInputPrompt: buildFinalInputPrompt(state)
      };
    }

    const project = createVercelProject({ projectName: plan.projectName, cwd: repoRoot, dryRun: false });
    const link = linkVercelProject({ projectName: plan.projectName, cwd: repoRoot, dryRun: false });
    const env = upsertVercelEnv({ cwd: repoRoot, envMap: plan.env, dryRun: false });
    const deploy = deployVercelProject({ cwd: repoRoot, dryRun: false });
    state = updateState({
      stage: 'deploy-vercel',
      repoRoot,
      vercel: {
        projectName: plan.projectName,
        projectId: deploy.projectId || state.vercel?.projectId,
        deploymentUrl: deploy.deploymentUrl || state.vercel?.deploymentUrl
      }
    }, statePath);
    steps.push({ step: 'create-vercel', ok: true, result: { project, link, env, deploy } });
  }

  const verify = await verifyDeployment(readState(statePath));
  state = updateState({ stage: verify.ok ? 'done' : 'verify' }, statePath);
  steps.push({ step: 'verify', ok: verify.ok, result: verify });

  return {
    ok: verify.ok,
    blocked: false,
    stage: state.stage,
    nextAction: verify.ok ? 'done' : 'inspect-verify',
    steps,
    state,
    verification: verify,
    finalInputPrompt: buildFinalInputPrompt(state)
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

    const project = createVercelProject({ projectName: plan.projectName, cwd: repoRoot, dryRun: false });
    const link = linkVercelProject({ projectName: plan.projectName, cwd: repoRoot, dryRun: false });
    const env = upsertVercelEnv({ cwd: repoRoot, envMap: plan.env, dryRun: false });
    const deploy = deployVercelProject({ cwd: repoRoot, dryRun: false });

    const next = updateState({
      stage: 'deploy-vercel',
      repoRoot,
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
        repoRoot,
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

    const finalInputPrompt = buildFinalInputPrompt(next);

    print({
      ok: true,
      statePath,
      stage: next.stage,
      state: next,
      pendingQuestions,
      message: pendingQuestions.length
        ? 'Installer progressed automatically. Final user input still required for the listed fields before Vercel production deploy.'
        : 'Installer has all required final inputs and can proceed to create-vercel --execute.',
      detectedFeishuAppId: inferFeishuAppId(next, plan),
      finalInputPrompt
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
    print({ ok: true, statePath, summary: buildStatusSummary(state), finalInputPrompt: buildFinalInputPrompt(state), state });
    break;
  }

  case 'verify': {
    const state = readState(statePath);
    const result = await verifyDeployment(state);
    const next = updateState({ stage: result.ok ? 'done' : 'verify' }, statePath);
    print({ ok: result.ok, statePath, result, state: next });
    break;
  }

  case 'continue': {
    const result = await runContinueFlow({ statePath, execute });
    print({ statePath, ...result });
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
        'node scripts/installer/cli.mjs verify',
        'node scripts/installer/cli.mjs continue',
        'AIPANEL_REPO_DIR=/path/to/AIPanel node scripts/installer/cli.mjs continue --execute',
        'node scripts/installer/cli.mjs continue --execute'
      ]
    });
  }
}
