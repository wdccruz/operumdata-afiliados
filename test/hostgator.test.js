import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildHostgator } from '../tools/build-hostgator.js';

const htaccess = () => readFile(new URL('../public/.htaccess', import.meta.url), 'utf8');

test('.htaccess define as rotas /, /afiliados e /painel/ e força HTTPS', async () => {
  const h = await htaccess();
  assert.match(h, /DirectoryIndex index\.html/);
  assert.match(h, /RewriteCond %\{HTTPS\} !=on[\s\S]*R=301/);
  assert.match(h, /RewriteCond %\{REQUEST_FILENAME\}\.html -f\s+RewriteRule \^\(\[a-z0-9-\]\+\)\$ \$1\.html \[L\]/);
  assert.match(h, /RewriteRule \^painel\$ \/painel\/ \[R=301,L\]/);
  assert.match(h, /RewriteRule \^entrar\(\\\.html\)\?\/\?\$ \/painel\/ \[R=301,L\]/);
  assert.match(h, /ErrorDocument 404 \/404\.html/);
  assert.match(h, /Options -Indexes/);
  assert.match(h, /\(\^\|\/\)\\\.\(\?!well-known\/\) - \[F,L\]/, 'bloqueia arquivos ocultos');
  assert.match(h, /X-Robots-Tag "noindex, nofollow"/, 'homologação fora das buscas');
  assert.match(h, /script-src 'self'/);
  assert.doesNotMatch(h, /cloudflare|github\.io/i);
});

test('pacote HostGator inclui só o que é publicado e recusa segredos', async () => {
  const out = await mkdtemp(join(tmpdir(), 'hg-'));
  try {
    const painel = join(out, 'painel-src');
    await mkdir(join(painel, 'vendor'), { recursive: true });
    await writeFile(join(painel, 'index.html'), '<link rel="stylesheet" href="painel.css"><a href="../">x</a><a href="../afiliados">y</a>');
    await writeFile(join(painel, 'painel.css'), 'body{}');
    await writeFile(join(painel, '_headers'), '/*');
    await writeFile(join(painel, '.env'), 'X=1');
    const r = await buildHostgator({ painel, out: join(out, 'dist') });
    for (const f of ['.htaccess', '404.html', 'index.html', 'afiliados.html', 'robots.txt', 'css/landing.css', 'js/landing.js', 'assets/img/prospector-remoto.webp', 'painel/index.html', 'painel/painel.css']) assert.ok(r.files.includes(f), f);
    for (const f of ['prototipo.html', 'app.js', 'demo.js', 'style.css', 'demo.css', 'painel/_headers', 'painel/.env']) assert.ok(!r.files.includes(f), f);
    assert.ok(r.hasPainel);

    await writeFile(join(painel, 'config.js'), "const k='sb_secret_abcdef123456';");
    await assert.rejects(buildHostgator({ painel, out: join(out, 'dist2') }), /possível segredo em painel\/config\.js/);
    await rm(join(painel, 'config.js'));
    await writeFile(join(painel, 'index.html'), '<a href="nao-existe.html">x</a>');
    await assert.rejects(buildHostgator({ painel, out: join(out, 'dist3') }), /link quebrado em painel\/index\.html/);
  } finally { await rm(out, { recursive: true, force: true }); }
});
