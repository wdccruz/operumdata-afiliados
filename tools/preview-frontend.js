// Servidor estático local. Não inicializa API, autenticação ou banco de dados.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const directory = new URL('../public/', import.meta.url);
const allowed = new Set(['index.html','style.css','demo.css','app.js','demo.js']);
const types = { html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8' };
createServer(async (req, res) => {
  const name = new URL(req.url, 'http://localhost').pathname.slice(1) || 'index.html';
  if (!allowed.has(name)) { res.writeHead(404); res.end(); return; }
  try {
    const content = await readFile(fileURLToPath(new URL(name, directory)));
    res.writeHead(200, { 'Content-Type': types[name.split('.').pop()], 'Cache-Control': 'no-store' }); res.end(content);
  } catch { res.writeHead(404); res.end(); }
}).listen(3200, '127.0.0.1', () => console.log('Frontend: http://localhost:3200'));
