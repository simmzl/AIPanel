import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const port = Number(process.env.PORT || 4174);
const token = 'demo-token';

const categories = ['Daily', 'Build', 'Research', 'Writing'];
const bookmarks = [
  {
    id: 'b1',
    title: 'Vercel',
    subtitle: 'Deploy preview builds and inspect production logs.',
    url: 'https://vercel.com',
    favicon: 'https://vercel.com/favicon.ico',
    category: 'Build',
    order: 1,
    categoryOrder: 2
  },
  {
    id: 'b2',
    title: 'Feishu Open Platform',
    subtitle: 'App credentials, permissions, and callback setup.',
    url: 'https://open.feishu.cn',
    favicon: 'https://open.feishu.cn/favicon.ico',
    category: 'Build',
    order: 2,
    categoryOrder: 2
  },
  {
    id: 'b3',
    title: 'GitHub',
    subtitle: 'Source, issues, and release notes in one place.',
    url: 'https://github.com',
    favicon: 'https://github.com/favicon.ico',
    category: 'Daily',
    order: 1,
    categoryOrder: 1
  },
  {
    id: 'b4',
    title: 'Linear',
    subtitle: 'Track polishing tasks for the experimental launch.',
    url: 'https://linear.app',
    favicon: 'https://linear.app/favicon.ico',
    category: 'Daily',
    order: 2,
    categoryOrder: 1
  },
  {
    id: 'b5',
    title: 'Anthropic',
    subtitle: 'Model docs and agent design notes.',
    url: 'https://www.anthropic.com',
    favicon: 'https://www.anthropic.com/favicon.ico',
    category: 'Research',
    order: 1,
    categoryOrder: 3
  },
  {
    id: 'b6',
    title: 'OpenAI',
    subtitle: 'API references and rollout changelogs.',
    url: 'https://platform.openai.com',
    favicon: 'https://platform.openai.com/favicon.ico',
    category: 'Research',
    order: 2,
    categoryOrder: 3
  },
  {
    id: 'b7',
    title: 'Notion',
    subtitle: 'Draft launch FAQ, runbooks, and operator notes.',
    url: 'https://www.notion.so',
    favicon: 'https://www.notion.so/favicon.ico',
    category: 'Writing',
    order: 1,
    categoryOrder: 4
  },
  {
    id: 'b8',
    title: 'Raycast',
    subtitle: 'Quick launcher for the desktop workflow.',
    url: 'https://www.raycast.com',
    favicon: 'https://www.raycast.com/favicon.ico',
    category: 'Daily',
    order: 3,
    categoryOrder: 1
  }
];

function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(body));
}

function sendFile(res, filePath, contentType) {
  return readFile(filePath)
    .then((buf) => {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(buf);
    })
    .catch(() => {
      res.writeHead(404);
      res.end('Not found');
    });
}

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${port}`);

  if (url.pathname === '/api/auth' && req.method === 'POST') {
    return json(res, 200, { token });
  }
  if (url.pathname === '/api/auth' && req.method === 'GET') {
    if (req.headers.authorization === `Bearer ${token}`) {
      return json(res, 200, { valid: true });
    }
    return json(res, 401, { message: '未授权' });
  }
  if (url.pathname === '/api/bookmarks' && req.method === 'GET') {
    if (req.headers.authorization !== `Bearer ${token}`) {
      return json(res, 401, { message: '未授权' });
    }
    return json(res, 200, { bookmarks, categories });
  }
  if (url.pathname === '/api/fetch-meta' && req.method === 'POST') {
    return json(res, 200, {
      title: 'Example link',
      description: 'Fetched metadata preview for the add-bookmark flow.',
      favicon: 'https://example.com/favicon.ico'
    });
  }
  if (url.pathname.startsWith('/api/')) {
    return json(res, 200, { success: true });
  }

  let pathname = url.pathname === '/' ? '/index.html' : url.pathname;
  let filePath = path.join(distDir, pathname);

  try {
    const ext = path.extname(filePath);
    if (!ext) {
      filePath = path.join(distDir, 'index.html');
      pathname = '/index.html';
    }
    const finalExt = path.extname(filePath);
    await sendFile(res, filePath, contentTypes[finalExt] || 'application/octet-stream');
  } catch {
    await sendFile(res, path.join(distDir, 'index.html'), 'text/html; charset=utf-8');
  }
});

server.listen(port, () => {
  console.log(`mock release server listening on http://localhost:${port}`);
});
