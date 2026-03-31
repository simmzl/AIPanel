import { load } from 'cheerio';
import type { ApiRequest, ApiResponse } from './_lib.js';
import { normalizeUrl, requireAuth, sendJsonError, sendMethodNotAllowed } from './_lib.js';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36';

function isGoogleFaviconUrl(value: string) {
  return /(^https?:\/\/)?(www\.)?(google\.com\/s2\/favicons|t0\.gstatic\.com\/faviconV2)/i.test(value);
}

function absoluteUrl(baseUrl: URL, candidate?: string | null) {
  if (!candidate) {
    return `${baseUrl.origin}/favicon.ico`;
  }

  try {
    const resolved = new URL(candidate, baseUrl).toString();
    return isGoogleFaviconUrl(resolved) ? `${baseUrl.origin}/favicon.ico` : resolved;
  } catch {
    return `${baseUrl.origin}/favicon.ico`;
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    sendMethodNotAllowed(res, ['POST']);
    return;
  }

  try {
    requireAuth(req);
  } catch (error) {
    sendJsonError(res, 401, error instanceof Error ? error.message : '未授权');
    return;
  }

  const url = typeof req.body === 'object' && req.body && 'url' in req.body ? req.body.url : null;

  if (typeof url !== 'string' || !url.trim()) {
    sendJsonError(res, 400, '请提供有效的 URL');
    return;
  }

  const targetUrl = normalizeUrl(url.trim());
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(targetUrl.toString(), {
      headers: {
        'user-agent': USER_AGENT,
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`抓取失败，状态码 ${response.status}`);
    }

    const html = await response.text();
    const $ = load(html);
    const title =
      $('meta[property="og:title"]').attr('content')?.trim() ||
      $('meta[name="twitter:title"]').attr('content')?.trim() ||
      $('title').text().trim() ||
      targetUrl.hostname;
    const description =
      $('meta[property="og:description"]').attr('content')?.trim() ||
      $('meta[name="twitter:description"]').attr('content')?.trim() ||
      $('meta[name="description"]').attr('content')?.trim() ||
      '';
    const favicon =
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      $('link[rel="apple-touch-icon"]').attr('href') ||
      null;

    res.status(200).json({
      title,
      description,
      favicon: absoluteUrl(targetUrl, favicon)
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? '抓取超时，请稍后重试'
        : error instanceof Error
          ? error.message
          : '抓取网站信息失败';
    sendJsonError(res, 500, message);
  } finally {
    clearTimeout(timeout);
  }
}
