export type InstallerStage =
  | 'preflight'
  | 'create-feishu'
  | 'configure'
  | 'ask-password'
  | 'deploy-vercel'
  | 'verify'
  | 'done';

export interface InstallerFeishuState {
  appToken: string | null;
  tableId: string | null;
  sourceUrl: string | null;
}

export interface InstallerEnvState {
  APP_NAME: string | null;
  ACCESS_PASSWORD: string | null;
  JWT_SECRET: string | null;
  FEISHU_APP_ID: string | null;
  FEISHU_APP_SECRET: string | null;
  FEISHU_BITABLE_APP_TOKEN: string | null;
  FEISHU_BITABLE_TABLE_ID: string | null;
  FEISHU_BITABLE_SOURCE_URL: string | null;
}

export interface InstallerVercelState {
  projectId: string | null;
  deploymentUrl: string | null;
}

export interface InstallerState {
  version: 1;
  stage: InstallerStage;
  appName: string;
  feishu: InstallerFeishuState;
  env: InstallerEnvState;
  vercel: InstallerVercelState;
  errors: string[];
}

export interface InstallerPreflightResult {
  stage: 'preflight';
  status: 'ready' | 'blocked';
  feishu: { status: 'ready' | 'blocked'; detail?: string };
  vercel: { status: 'ready' | 'blocked'; detail?: string };
  messages: string[];
}
