import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

function fetchUrl(url, timeoutMs = 8000) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const reqFn = parsed.protocol === 'https:' ? httpsRequest : httpRequest;
      const req = reqFn(parsed, { method: 'GET', timeout: timeoutMs }, (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            ok: (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 400,
            statusCode: res.statusCode || null,
            headers: res.headers || {},
            bodyPreview: Buffer.concat(chunks).toString('utf8').slice(0, 300)
          });
        });
      });
      req.on('timeout', () => {
        req.destroy(new Error('timeout'));
      });
      req.on('error', (error) => {
        resolve({ ok: false, statusCode: null, error: error.message });
      });
      req.end();
    } catch (error) {
      resolve({ ok: false, statusCode: null, error: error instanceof Error ? error.message : String(error) });
    }
  });
}

export async function verifyDeployment(state) {
  const url = state?.vercel?.deploymentUrl || null;
  if (!url) {
    return {
      ok: false,
      stage: 'verify',
      checks: {
        deploymentUrlPresent: false,
        homepage: { ok: false, error: 'missing deployment URL' }
      },
      message: 'No deployment URL found in installer state.'
    };
  }

  const normalizedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
  const homepage = await fetchUrl(normalizedUrl);

  return {
    ok: homepage.ok,
    stage: 'verify',
    deploymentUrl: normalizedUrl,
    checks: {
      deploymentUrlPresent: true,
      homepage
    },
    message: homepage.ok
      ? 'Deployment URL responded successfully.'
      : 'Deployment URL did not respond successfully.'
  };
}
