import { readFile, writeFile } from 'node:fs/promises';
if (!process.argv[2]) throw new Error('Informe o caminho do HTML de saída.');
const publicDir = new URL('../public/', import.meta.url);
let html = await readFile(new URL('prototipo.html', publicDir), 'utf8');
for (const file of ['style.css','demo.css']) {
  const css = await readFile(new URL(file, publicDir), 'utf8');
  html = html.replace(`<link rel="stylesheet" href="./${file}">`, () => `<style>${css}</style>`);
}
for (const file of ['demo.js','app.js']) {
  const js = await readFile(new URL(file, publicDir), 'utf8');
  html = html.replace(`<script src="./${file}" defer></script>`, () => '');
  html = html.replace('</body>', () => `<script>${js}</script></body>`);
}
html = html.replace('href="/"', 'href="#"');
await writeFile(process.argv[2], html);
console.log('Protótipo frontend exportado.');
