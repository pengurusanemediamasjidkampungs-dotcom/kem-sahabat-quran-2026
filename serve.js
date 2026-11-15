#!/usr/bin/env node
/**
 * Zero-dependency static server for the KSQ 2026 web app.
 * ES modules do not load from file://, so use this for local preview.
 *
 * Usage:
 *   node serve.js              -> http://127.0.0.1:8080/admin.html (opens browser)
 *   node serve.js --port 3000  -> custom port
 *   node serve.js --no-open    -> do not open a browser
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, 'web');
const HOST = '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8'
};

function parseArgs(argv) {
  const options = { port: 8080, open: true };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--no-open') options.open = false;
    else if (arg === '--open') options.open = true;
    else if (arg === '--port' || arg === '-p') {
      const value = Number(argv[i + 1]);
      if (Number.isInteger(value) && value > 0 && value < 65536) options.port = value;
      i += 1;
    } else if (arg.startsWith('--port=')) {
      const value = Number(arg.slice(7));
      if (Number.isInteger(value) && value > 0 && value < 65536) options.port = value;
    } else if (/^\d+$/.test(arg)) {
      const value = Number(arg);
      if (value > 0 && value < 65536) options.port = value;
    }
  }
  return options;
}

function safePath(urlPath) {
  let pathname;
  try {
    pathname = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  } catch {
    return null;
  }
  if (pathname === '/' || pathname === '') pathname = '/index.html';
  const resolved = path.resolve(ROOT, '.' + pathname);
  const relative = path.relative(ROOT, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return resolved;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    ...headers
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, 'Kaedah tidak dibenarkan.', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }

  const filePath = safePath(req.url || '/');
  if (!filePath) {
    send(res, 400, 'Laluan tidak sah.', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      send(res, 404, 'Fail tidak dijumpai.', { 'Content-Type': 'text/plain; charset=utf-8' });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': stats.size,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    fs.createReadStream(filePath)
      .on('error', () => send(res, 500, 'Fail tidak dapat dibaca.', { 'Content-Type': 'text/plain; charset=utf-8' }))
      .pipe(res);
  });
});

function openBrowser(url) {
  try {
    if (process.platform === 'win32') {
      spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
    } else if (process.platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch {
    /* Browser opening is optional. The URL is printed below. */
  }
}

const options = parseArgs(process.argv.slice(2));

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${options.port} sedang digunakan. Cuba: node serve.js --port ${options.port + 1}`);
  } else {
    console.error('Pelayan tidak dapat dimulakan:', err && err.message ? err.message : err);
  }
  process.exitCode = 1;
});

server.listen(options.port, HOST, () => {
  const base = `http://${HOST}:${options.port}`;
  console.log('');
  console.log('KSQ 2026 — pratonton setempat');
  console.log(`  Awam        : ${base}/index.html`);
  console.log(`  Pentadbir   : ${base}/admin.html`);
  console.log(`  Fasilitator : ${base}/fasilitator.html`);
  console.log('');
  console.log('Tekan Ctrl+C untuk hentikan pelayan.');
  console.log('Nota: API sebenar perlu URL GAS /exec dalam web/config.js.');
  if (options.open) openBrowser(`${base}/admin.html`);
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
