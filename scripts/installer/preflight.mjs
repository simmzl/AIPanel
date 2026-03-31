import { execFileSync } from 'node:child_process';

function hasCommand(command) {
  try {
    execFileSync('bash', ['-lc', `command -v ${command}`], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function runPreflight() {
  const hasLark = hasCommand('lark') || hasCommand('feishu') || hasCommand('lark-cli');
  const hasVercel = hasCommand('vercel');

  const result = {
    stage: 'preflight',
    status: hasLark && hasVercel ? 'ready' : 'blocked',
    feishu: {
      status: hasLark ? 'ready' : 'blocked',
      detail: hasLark ? 'detected local Feishu/Lark CLI command' : 'no Feishu/Lark CLI command detected'
    },
    vercel: {
      status: hasVercel ? 'ready' : 'blocked',
      detail: hasVercel ? 'detected vercel command' : 'no vercel command detected'
    },
    messages: []
  };

  if (!hasLark) {
    result.messages.push('缺少飞书 CLI 能力，当前还不能自动创建 Bitable。');
  }
  if (!hasVercel) {
    result.messages.push('缺少 Vercel CLI 能力，当前还不能自动部署。');
  }

  return result;
}
