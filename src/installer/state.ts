import type { InstallerState } from './types';

export function createInitialInstallerState(): InstallerState {
  return {
    version: 1,
    stage: 'preflight',
    appName: 'AIPanel',
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
      projectId: null,
      deploymentUrl: null
    },
    errors: []
  };
}
