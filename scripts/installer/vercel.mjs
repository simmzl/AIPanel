import { execFileSync } from 'node:child_process';
import { inferFeishuAppEnv } from './lark-auth.mjs';

function runText(command, args, options = {}) {
  return execFileSync(command, args, { encoding: 'utf8', ...options }).trim();
}

function runJson(command, args, options = {}) {
  const text = runText(command, args, options);
  return text ? JSON.parse(text) : {};
}

function ensureEnvEntries(state) {
  const inferred = inferFeishuAppEnv();
  return {
    APP_NAME: state.env.APP_NAME || 'AIPanel',
    ACCESS_PASSWORD: state.env.ACCESS_PASSWORD || null,
    JWT_SECRET: state.env.JWT_SECRET || null,
    FEISHU_APP_ID: state.env.FEISHU_APP_ID || inferred.FEISHU_APP_ID || null,
    FEISHU_APP_SECRET: state.env.FEISHU_APP_SECRET || null,
    FEISHU_BITABLE_APP_TOKEN: state.env.FEISHU_BITABLE_APP_TOKEN || null,
    FEISHU_BITABLE_TABLE_ID: state.env.FEISHU_BITABLE_TABLE_ID || null,
    FEISHU_BITABLE_SOURCE_URL: state.env.FEISHU_BITABLE_SOURCE_URL || null
  };
}

export function planVercelSetup(state) {
  const env = ensureEnvEntries(state);
  const requiredForDeploy = [
    'ACCESS_PASSWORD',
    'JWT_SECRET',
    'FEISHU_APP_ID',
    'FEISHU_APP_SECRET',
    'FEISHU_BITABLE_APP_TOKEN',
    'FEISHU_BITABLE_TABLE_ID',
    'FEISHU_BITABLE_SOURCE_URL'
  ];
  const missing = requiredForDeploy.filter((key) => !env[key]);
  return {
    projectName: state.vercel?.projectName || 'aipanel',
    env,
    missing,
    ready: missing.length === 0
  };
}

export function createVercelProject({ projectName = 'aipanel', cwd = process.cwd(), dryRun = false } = {}) {
  if (dryRun) {
    return {
      dryRun: true,
      command: ['vercel', 'project', 'add', projectName, '--yes']
    };
  }

  const output = runText('vercel', ['project', 'add', projectName, '--yes'], { cwd });
  return {
    dryRun: false,
    projectName,
    output
  };
}

export function upsertVercelEnv({ cwd = process.cwd(), envMap, dryRun = false }) {
  const entries = Object.entries(envMap).filter(([, value]) => value !== null && value !== undefined && value !== '');

  if (dryRun) {
    return {
      dryRun: true,
      entries: entries.map(([name, value]) => ({
        name,
        value,
        commands: [
          ['vercel', 'env', 'add', name, 'production', '--value', value, '--yes'],
          ['vercel', 'env', 'update', name, 'production', '--value', value, '--yes']
        ]
      }))
    };
  }

  const results = [];
  for (const [name, value] of entries) {
    try {
      const addOutput = runText('vercel', ['env', 'add', name, 'production', '--value', value, '--yes'], { cwd });
      results.push({ name, action: 'add', output: addOutput });
    } catch {
      const updateOutput = runText('vercel', ['env', 'update', name, 'production', '--value', value, '--yes'], { cwd });
      results.push({ name, action: 'update', output: updateOutput });
    }
  }
  return { dryRun: false, results };
}

export function deployVercelProject({ cwd = process.cwd(), dryRun = false } = {}) {
  if (dryRun) {
    return {
      dryRun: true,
      command: ['vercel', 'deploy', '--prod', '--yes', '--json']
    };
  }

  const output = runJson('vercel', ['deploy', '--prod', '--yes', '--json'], { cwd });
  return {
    dryRun: false,
    output,
    deploymentUrl: output?.url || null,
    projectId: output?.projectId || null
  };
}
