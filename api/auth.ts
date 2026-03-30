import type { ApiRequest, ApiResponse } from './_lib.js';
import { createJwt, getBearerToken, getEnv, sendJsonError, sendMethodNotAllowed, verifyJwtToken } from './_lib.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === 'POST') {
    const password = typeof req.body === 'object' && req.body && 'password' in req.body ? req.body.password : null;

    if (typeof password !== 'string' || password.length === 0) {
      sendJsonError(res, 400, '请输入密码');
      return;
    }

    if (password !== getEnv('ACCESS_PASSWORD')) {
      sendJsonError(res, 401, '密码错误');
      return;
    }

    res.status(200).json({ token: createJwt() });
    return;
  }

  if (req.method === 'GET') {
    const token = getBearerToken(req);

    if (!token) {
      sendJsonError(res, 401, '未提供授权 token');
      return;
    }

    try {
      verifyJwtToken(token);
      res.status(200).json({ valid: true });
    } catch {
      sendJsonError(res, 401, 'token 已失效');
    }
    return;
  }

  sendMethodNotAllowed(res, ['GET', 'POST']);
}
