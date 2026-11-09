import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sep } from 'node:path';
import { resolvePublicPath } from '../tools/preview-frontend.js';

const read = path => readFile(new URL(`../public/${path}`, import.meta.url), 'utf8');

test('landing traz a oferta, a faixa de homologação e nenhum script inline', async () => {
  const html = await read('index.html');
  assert.match(html, /HOMOLOGAÇÃO/);
  assert.match(html, /Ganhe até <span class="v">R\$&nbsp;300<\/span>/);
  for (const valor of ['R$ 50', 'R$ 150', 'R$ 300']) assert.ok(html.includes(valor), valor);
  assert.match(html, /R\$ 150 no início efetivo das gravações/);
  assert.doesNotMatch(html, /<script>(?!<\/script>)/, 'CSP exige scripts em arquivos');
  assert.doesNotMatch(html, /\sstyle="/, 'CSP exige estilos em arquivos');
  assert.doesNotMatch(html, /A CONFIRMAR/);
});

test('landing não usa modelo de comissão percentual nem níveis', async () => {
  const html = await read('index.html');
  assert.doesNotMatch(html, /\d\s?%/);
  assert.doesNotMatch(html, /\bnível\b|\bníveis\b/i);
});

test('cadastro não pede CPF nem dados bancários e não simula recebimento', async () => {
  const html = await read('index.html');
  const js = await read('js/landing.js');
  assert.doesNotMatch(html, /id="f-cpf"|banc[oá]ri[oa]s?"|agência/i);
  assert.match(html, /Envio ainda não disponível/);
  assert.doesNotMatch(js, /fetch\(|XMLHttpRequest|localStorage/);
});

test('convite do Facebook usa o link oficial em nova aba e não bloqueia o cadastro', async () => {
  const html = await read('index.html');
  assert.match(html, /href="https:\/\/www\.facebook\.com\/operumdata\/" target="_blank" rel="noopener"/);
  assert.doesNotMatch(html, /connect\.facebook\.net|fbq\(/);
});

test('servidor de prévia bloqueia caminhos fora de public/ e extensões não permitidas', () => {
  assert.ok(resolvePublicPath('/').endsWith('index.html'));
  assert.ok(resolvePublicPath('/assets/img/hero-afiliados.webp'));
  assert.equal(resolvePublicPath('/../package.json'), null);
  const encoded = resolvePublicPath('/%2e%2e/src/app.js');
  assert.ok(encoded === null || encoded.includes(`${sep}public${sep}`), 'nunca sai de public/');
  assert.equal(resolvePublicPath('/.env'), null);
});
