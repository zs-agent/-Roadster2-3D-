/* Neon Run — 本地事件服务（零依赖，Node 24 ESM）
 * GET  /events  SSE 事件流（先补发最近 10 条）
 * POST /event   上报一条事件（JSON，<= 64KB）
 * 其它 GET      静态文件（仓库根目录，禁止越界）
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT) || 8790;
const MAX_BODY = 64 * 1024;
const RECENT_LIMIT = 10;
const HEARTBEAT_MS = 15000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8'
};

/** @type {Set<import('node:http').ServerResponse>} */
const clients = new Set();
/** 最近事件，旧的在前 */
const recent = [];

let heartbeat = null;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}

function sendJson(res, status, body) {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function broadcast(json) {
  const line = `data: ${json}\n\n`;
  for (const res of clients) {
    try {
      res.write(line);
    } catch {
      clients.delete(res);
    }
  }
}

function handleEvents(req, res) {
  cors(res);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.write('retry: 3000\n\n');
  for (const evt of recent) res.write(`data: ${JSON.stringify(evt)}\n\n`);
  clients.add(res);
  req.on('close', () => clients.delete(res));
  res.on('close', () => clients.delete(res));
}

function handleEvent(req, res) {
  const chunks = [];
  let size = 0;
  let aborted = false;

  req.on('data', (chunk) => {
    if (aborted) return;
    size += chunk.length;
    if (size > MAX_BODY) {
      aborted = true;
      sendJson(res, 413, { error: 'payload too large' });
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });

  req.on('end', () => {
    if (aborted) return;
    let payload;
    try {
      payload = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    } catch {
      sendJson(res, 400, { error: 'invalid json' });
      return;
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      sendJson(res, 400, { error: 'object expected' });
      return;
    }
    payload.serverTs = Date.now();
    recent.push(payload);
    while (recent.length > RECENT_LIMIT) recent.shift();
    broadcast(JSON.stringify(payload));
    const bits = [`type=${payload.type ?? '-'}`];
    if (payload.score !== undefined) bits.push(`score=${payload.score}`);
    if (payload.count !== undefined) bits.push(`count=${payload.count}`);
    console.log(`[event] ${bits.join(' ')}`);
    cors(res);
    res.writeHead(204);
    res.end();
  });

  req.on('error', () => {
    if (!res.headersSent) sendJson(res, 400, { error: 'bad request' });
  });
}

function inside(base, target) {
  return target === base || target.startsWith(base + path.sep);
}

function resolveStatic(rawPath, base) {
  let pathname = rawPath.split('?')[0].split('#')[0];
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (pathname.includes('\0')) return null;
  if (pathname === '/' || pathname === '') pathname = '/overlay.html';
  const target = path.resolve(base, `.${pathname.startsWith('/') ? pathname : `/${pathname}`}`);
  if (!inside(base, target)) return null;
  return target;
}

function serveStatic(req, res, rawPath) {
  const target = resolveStatic(rawPath, ROOT);
  if (!target) return sendJson(res, 403, { error: 'forbidden' });

  fs.stat(target, (err, stat) => {
    if ((err || !stat.isFile()) && inside(ROOT, HERE)) {
      // 叠加层文件在 stream/ 下，但对外挂在根路径 /overlay.html
      const fallback = resolveStatic(rawPath, HERE);
      if (fallback) {
        return fs.stat(fallback, (err2, stat2) => {
          if (err2 || !stat2.isFile()) return sendJson(res, 404, { error: 'not found' });
          sendFile(req, res, fallback, stat2);
        });
      }
    }
    if (err || !stat.isFile()) return sendJson(res, 404, { error: 'not found' });
    sendFile(req, res, target, stat);
  });
}

function sendFile(req, res, target, stat) {
  cors(res);
  res.writeHead(200, {
    'Content-Type': MIME[path.extname(target).toLowerCase()] || 'application/octet-stream',
    'Content-Length': stat.size,
    'Cache-Control': 'no-store'
  });
  if (req.method === 'HEAD') return res.end();
  const stream = fs.createReadStream(target);
  stream.on('error', () => res.destroy());
  stream.pipe(res);
}

const server = http.createServer((req, res) => {
  const url = req.url || '/';
  const pathname = url.split('?')[0];

  if (req.method === 'OPTIONS') {
    cors(res);
    res.writeHead(204);
    res.end();
    return;
  }
  if (pathname === '/events' && req.method === 'GET') return handleEvents(req, res);
  if (pathname === '/event' && req.method === 'POST') return handleEvent(req, res);
  if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res, url);
  sendJson(res, 405, { error: 'method not allowed' });
});

function shutdown(signal) {
  console.log(`\n[server] ${signal} — closing ${clients.size} sse client(s)`);
  clearInterval(heartbeat);
  for (const res of clients) {
    try {
      res.end();
    } catch {
      /* ignore */
    }
  }
  clients.clear();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
}

server.listen(PORT, HOST, () => {
  console.log(`[server] Neon Run event service`);
  console.log(`[server] overlay http://${HOST}:${PORT}/overlay.html`);
  console.log(`[server] game    http://${HOST}:${PORT}/game/ROADSTER-特斯拉.html?director=1`);
  console.log(`[server] events  http://${HOST}:${PORT}/events (SSE)`);
  heartbeat = setInterval(() => {
    for (const res of clients) {
      try {
        res.write(': ping\n\n');
      } catch {
        clients.delete(res);
      }
    }
  }, HEARTBEAT_MS);
});

server.on('error', (err) => {
  console.error(`[server] ${err.code || 'error'}: ${err.message}`);
  process.exit(1);
});

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
