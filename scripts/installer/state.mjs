import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export const INSTALLER_STATE_VERSION = 1;

export function getDefaultStatePath() {
  return path.join(os.homedir(), '.aipanel-installer-state.json');
}

export function createInitialState() {
  return {
    version: INSTALLER_STATE_VERSION,
    stage: 'preflight',
    appName: 'AIPanel',
    repoRoot: process.cwd(),
    feishu: {
      appToken: null,
      tableId: null,
      sourceUrl: null
    },
    env: {
      APP_NAME: 'AIPanel',
      ACCESS_PASSWORD: null,
      JWT_SECRET: null,
      FEISHU_APP_ID: null,
      FEISHU_APP_SECRET: null,
      FEISHU_BITABLE_APP_TOKEN: null,
      FEISHU_BITABLE_TABLE_ID: null,
      FEISHU_BITABLE_SOURCE_URL: null
    },
    vercel: {
      projectName: 'aipanel',
      projectId: null,
      deploymentUrl: null
    },
    errors: []
  };
}

export function readState(statePath = getDefaultStatePath()) {
  if (!fs.existsSync(statePath)) {
    return createInitialState();
  }

  const raw = fs.readFileSync(statePath, 'utf8');
  const parsed = JSON.parse(raw);
  return {
    ...createInitialState(),
    ...parsed,
    feishu: { ...createInitialState().feishu, ...(parsed.feishu || {}) },
    env: { ...createInitialState().env, ...(parsed.env || {}) },
    vercel: { ...createInitialState().vercel, ...(parsed.vercel || {}) }
  };
}

export function writeState(state, statePath = getDefaultStatePath()) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

export function updateState(patch, statePath = getDefaultStatePath()) {
  const current = readState(statePath);
  const next = {
    ...current,
    ...patch,
    feishu: { ...current.feishu, ...(patch.feishu || {}) },
    env: { ...current.env, ...(patch.env || {}) },
    vercel: { ...current.vercel, ...(patch.vercel || {}) }
  };
  writeState(next, statePath);
  return next;
}
