// Yerel önizleme ve test sunucusu: repo kökünü olduğu gibi sunar (GitHub Pages gibi).
// Kullanım: node _dev/tools/serve.mjs  →  http://127.0.0.1:5173
import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

export function startServer({ root = REPO_ROOT, port = 0 } = {}) {
  const base = path.resolve(root);
  const server = http.createServer(async (req, res) => {
    try {
      let rel = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      if (rel.endsWith('/')) rel += 'index.html';
      const file = path.join(base, rel);
      if (file !== base && !file.startsWith(base + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      const info = await stat(file);
      if (!info.isFile()) throw new Error('not a file');
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Content-Length': info.size,
        'Cache-Control': 'no-store'
      });
      createReadStream(file).pipe(res);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }).end('Not found');
    }
  });
  // Yalnız 127.0.0.1: tüm arayüzleri dinlemek Windows güvenlik duvarı penceresi açtırır.
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      resolve({
        url: `http://127.0.0.1:${server.address().port}`,
        close: () => new Promise(done => {
          server.closeAllConnections?.();
          server.close(() => done());
        })
      });
    });
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { url } = await startServer({ port: Number(process.env.PORT || 5173) });
  console.log(`Önizleme hazır: ${url}  (durdurmak için Ctrl+C)`);
}
