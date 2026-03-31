import { execFileSync } from 'node:child_process';

export function getLarkAuthStatus() {
  const output = execFileSync('lark-cli', ['auth', 'status'], { encoding: 'utf8' }).trim();
  return output ? JSON.parse(output) : {};
}

export function inferFeishuAppEnv() {
  const status = getLarkAuthStatus();
  return {
    FEISHU_APP_ID: status?.appId || null,
    authStatus: status
  };
}
