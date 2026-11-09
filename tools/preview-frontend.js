// Servidor estático local. Não inicializa API, autenticação ou banco de dados.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep, extname } from 'node:path';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};
const port = Number(process.env.PREVIEW_PORT) || 3200;

export function resolvePublicPath(urlPath) {
  let name;
  try { name = decodeURIComponent(new URL(urlPath, 'http://localhost').pathname); } catch { return null; }
  if (name.endsWith('/')) name += 'index.html';
  const file = resolve(root, '.' + name);
  if (!file.startsWith(root.endsWith(sep) ? root : root + sep) || !types[extname(file)]) return null;
  return file;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  createServer(async (req, res) => {
    const file = resolvePublicPath(req.url);
    if (!file) { res.writeHead(404); res.end(); return; }
    try {
      const content = await readFile(file);
      res.writeHead(200, { 'Content-Type': types[extname(file)], 'Cache-Control': 'no-store' }); res.end(content);
    } catch { res.writeHead(404); res.end(); }
  }).listen(port, '127.0.0.1', () => console.log(`Frontend: http://localhost:${port}`));
}
