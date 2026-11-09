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

test('página principal destaca a prospecção remota sem mudar as comissões de indicação', async () => {
  const html = await read('index.html');
  assert.match(html, /Tem experiência em telemarketing\?/);
  assert.match(html, /href="prospeccao-remota\.html">Quero ser prospector remoto</);
  assert.match(html, /R\$ 150<\/b><span>por empresa que fechar contrato a partir da sua prospecção validada/);
});

test('página de prospecção remota: textos, formulário próprio e nada de promessa de emprego', async () => {
  const html = await read('prospeccao-remota.html');
  assert.match(html, /HOMOLOGAÇÃO/);
  assert.match(html, /data-tipo="candidato_prospector_remoto"/);
  assert.match(html, /não existe pagamento apenas por ligação realizada, contato interessado ou reunião agendada/);
  for (const id of ['f-nome', 'f-whats', 'f-email', 'f-cidade', 'f-uf', 'f-experiencia', 'f-tempo', 'f-disp', 'f-equip', 'f-aceite']) assert.match(html, new RegExp(`id="${id}"`), id);
  assert.doesNotMatch(html, /id="f-cpf"|id="f-pix"|banc[oá]ri[oa]s?"|agência/i);
  assert.doesNotMatch(html, /\d\s?%\s*(de\s)?comiss/i);
  assert.doesNotMatch(html, /\bnível\b|\bníveis\b/i);
  assert.match(html, /Envio ainda não disponível/);
  assert.match(html, /id="condicoes-parceria"/);
  assert.match(html, /Sem exclusividade/);
  assert.doesNotMatch(html, /vaga de emprego|sal[aá]rio|contrata[cç][aã]o de telemarketing|v[ií]nculo trabalhista/i);
  assert.doesNotMatch(html, /id="f-disp"[^>]*required/, 'disponibilidade é opcional');
  assert.doesNotMatch(html, /<script>(?!<\/script>)/);
  assert.doesNotMatch(html, /\sstyle="/);
  assert.doesNotMatch(html, /A CONFIRMAR/);
});
