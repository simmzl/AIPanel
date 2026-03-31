#!/usr/bin/env node
import process from 'node:process';
import { readState, updateState, writeState, createInitialState, getDefaultStatePath } from './state.mjs';
import { generateJwtSecret } from './secrets.mjs';
import { runPreflight } from './preflight.mjs';

const command = process.argv[2] || 'help';
const statePath = process.env.AIPANEL_INSTALLER_STATE || getDefaultStatePath();

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
        'node scripts/installer/cli.mjs show'
      ]
    });
  }
}
