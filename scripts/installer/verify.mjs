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
          const bodyPreview = Buffer.concat(chunks).toString('utf8').slice(0, 300);
          resolve({
            ok: (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 400,
            statusCode: res.statusCode || null,
            headers: res.headers || {},
            bodyPreview
          });
        });
      });
      req.on('timeout', () => req.destroy(new Error('timeout')));
      req.on('error', (error) => {
        resolve({ ok: false, statusCode: null, error: error.message });
      });
      req.end();
    } catch (error) {
      resolve({ ok: false, statusCode: null, error: error instanceof Error ? error.message : String(error) });
    }
  });
}

function classifyHomepage(result) {
  if (!result || !result.statusCode) {
    return { kind: 'unreachable', ok: false, message: 'Deployment URL could not be reached.' };
  }

  if (result.ok) {
    return { kind: 'public-ok', ok: true, message: 'Deployment URL responded successfully.' };
  }

  if (result.statusCode === 401) {
    return {
      kind: 'protected',
      ok: true,
      warning: true,
      message: 'Deployment URL is live but protected by an authentication layer (HTTP 401).'
    };
  }

  return {
    kind: 'http-error',
    ok: false,
    message: `Deployment URL responded with HTTP ${result.statusCode}.`
  };
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
      summary: { kind: 'missing-url', ok: false },
      message: 'No deployment URL found in installer state.'
    };
  }

  const normalizedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
  const homepage = await fetchUrl(normalizedUrl);
  const summary = classifyHomepage(homepage);

  return {
    ok: summary.ok,
    stage: 'verify',
    deploymentUrl: normalizedUrl,
    checks: {
      deploymentUrlPresent: true,
      homepage
    },
    summary,
    message: summary.message
  };
}
