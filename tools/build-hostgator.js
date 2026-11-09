// Monta o pacote estático para a HostGator (comercial.operumdata.com).
// Uso: node tools/build-hostgator.js [--painel <pasta>] [--out <pasta>]
//   --painel  pasta com a área dos parceiros (padrão: public/painel, se existir).
//             O painel é desenvolvido pelo Codex na branch feat/backend-supabase.
//   --out     destino (padrão: dist/hostgator). O conteúdo para upload fica em <out>/comercial/.
// Não envia nada para a hospedagem: só gera arquivos locais.
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve, sep } from 'node:path';

const repo = fileURLToPath(new URL('../', import.meta.url));
const pub = join(repo, 'public');

// Somente o que é publicado. O protótipo antigo (prototipo.html, app.js, demo.js, style.css, demo.css) fica de fora.
export const PUBLIC_FILES = [
  '.htaccess', '404.html', 'robots.txt',
  'index.html', 'afiliados.html', 'termos.html', 'privacidade.html',
  'prospeccao-remota.html', 'entrar.html',
  'css/landing.css', 'js/landing.js'
];
export const PUBLIC_DIRS = ['assets'];
const PAINEL_EXCLUDE = new Set(['_headers']);
const SECRET_PATTERNS = [/sb_secret_[A-Za-z0-9_-]+/, /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/];

async function exists(p) { try { await stat(p); return true; } catch { return false; } }
async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p)); else out.push(p);
  }
  return out;
}

export async function buildHostgator({ painel, out } = {}) {
  out = resolve(out || join(repo, 'dist', 'hostgator'));
  const site = join(out, 'comercial');
  await rm(out, { recursive: true, force: true });
  await mkdir(site, { recursive: true });

  for (const f of PUBLIC_FILES) {
    await mkdir(dirname(join(site, f)), { recursive: true });
    await cp(join(pub, f), join(site, f));
  }
  for (const d of PUBLIC_DIRS) await cp(join(pub, d), join(site, d), { recursive: true });

  const painelSrc = painel ? resolve(painel) : join(pub, 'painel');
  const hasPainel = await exists(join(painelSrc, 'index.html'));
  if (hasPainel) {
    await cp(painelSrc, join(site, 'painel'), {
      recursive: true,
      filter: src => !PAINEL_EXCLUDE.has(relative(painelSrc, src)) && !relative(painelSrc, src).split(sep).some(p => p.startsWith('.'))
    });
  }

  const files = (await walk(site)).sort();
  const problems = [];
  const manifest = [];
  for (const file of files) {
    const rel = relative(site, file).split(sep).join('/');
    const buf = await readFile(file);
    if (/(^|\/)\.env/.test(rel) || /\.(sqlite|db|ts|map)$/.test(rel)) problems.push(`arquivo proibido: ${rel}`);
    if (/\.(html|js|mjs|css|txt)$/.test(rel) || rel.endsWith('.htaccess')) {
      const text = buf.toString('utf8');
      for (const re of SECRET_PATTERNS) if (re.test(text)) problems.push(`possível segredo em ${rel}`);
      if (rel.endsWith('.html')) {
        for (const [, ref] of text.matchAll(/(?:href|src)="([^"#?]+)/g)) {
          if (/^(https?:|mailto:|tel:|data:|\/)/.test(ref)) continue;
          let target = resolve(dirname(file), ref);
          if (ref.endsWith('/') || ref === '.' || ref === './') target = join(target, 'index.html');
          else if (!/\.[a-z0-9]+$/i.test(ref)) target += '.html';
          if (!(await exists(target))) problems.push(`link quebrado em ${rel}: ${ref}`);
        }
      }
    }
    manifest.push(`${createHash('sha256').update(buf).digest('hex').slice(0, 16)}  ${String(buf.length).padStart(8)}  ${rel}`);
  }
  if (problems.length) throw new Error('Pacote recusado:\n' + problems.join('\n'));

  await writeFile(join(out, 'MANIFESTO.txt'),
    `Pacote HostGator · comercial.operumdata.com\nEnviar o CONTEÚDO da pasta comercial/ para a pasta raiz do subdomínio.\nPainel incluído: ${hasPainel ? 'sim' : 'não'}\n\nsha256(16)        bytes  arquivo\n${manifest.join('\n')}\n`);
  return { out, site, files: files.map(f => relative(site, f).split(sep).join('/')), hasPainel };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  const r = await buildHostgator({ painel: opt('--painel'), out: opt('--out') });
  console.log(`Pacote em ${r.site} (${r.files.length} arquivos, painel: ${r.hasPainel ? 'sim' : 'NÃO'})`);
  if (!r.hasPainel) console.log('Aviso: sem /painel. Informe --painel com a pasta public/painel da branch do Codex.');
}
