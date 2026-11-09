import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sep } from 'node:path';
import { resolvePublicPath } from '../tools/preview-frontend.js';

const read = path => readFile(new URL(`../public/${path}`, import.meta.url), 'utf8');

const FB = /href="https:\/\/www\.facebook\.com\/operumdata\/" target="_blank" rel="noopener"/;
const NEGOCIO = /O que faz a OperumData\?[\s\S]*ponto de vista de quem executa as tarefas[\s\S]*oficina mecânica[\s\S]*remuneração pelas gravações aprovadas/;
const semCSPInline = html => {
  assert.doesNotMatch(html, /<script>(?!<\/script>)/, 'CSP exige scripts em arquivos');
  assert.doesNotMatch(html, /\sstyle="/, 'CSP exige estilos em arquivos');
};

test('página principal é a prospecção remota, objetiva e sem linguagem de emprego', async () => {
  const html = await read('index.html');
  assert.match(html, /HOMOLOGAÇÃO/);
  assert.match(html, /Tem experiência em vendas por telefone\?/);
  assert.match(html, /R\$&nbsp;150<\/span> por empresa que fechar contrato/);
  assert.match(html, /mesmo sem participar da reunião/);
  assert.match(html, /não por ligação ou reunião agendada/);
  for (const t of ['Sem jornada fixa', 'Sem metas obrigatórias', 'Sem exclusividade']) assert.ok(html.includes(t), t);
  assert.match(html, /id="condicoes-parceria"/);
  assert.match(html, /data-tipo="candidato_prospector_remoto"/);
  for (const id of ['f-nome', 'f-whats', 'f-email', 'f-cidade', 'f-uf', 'f-experiencia', 'f-tempo', 'f-disp', 'f-equip', 'f-aceite']) assert.match(html, new RegExp(`id="${id}"`), id);
  assert.doesNotMatch(html, /id="f-disp"[^>]*required/, 'disponibilidade é opcional');
  assert.doesNotMatch(html, /vaga de emprego|sal[aá]rio|contrata[cç][aã]o de telemarketing|v[ií]nculo trabalhista/i);
  assert.match(html, /href="afiliados"/, 'afiliados como link secundário, sem .html');
  assert.doesNotMatch(html, /A CONFIRMAR/);
  semCSPInline(html);
});

test('página de afiliados preserva as três modalidades e destaca a prospecção remota', async () => {
  const html = await read('afiliados.html');
  assert.match(html, /HOMOLOGAÇÃO/);
  assert.match(html, /Ganhe até <span class="v">R\$&nbsp;300<\/span>/);
  for (const valor of ['R$ 50', 'R$ 150', 'R$ 300']) assert.ok(html.includes(valor), valor);
  assert.match(html, /R\$ 150 no início efetivo das gravações/);
  for (const t of ['Indique uma empresa', 'Apresente a oportunidade', 'Feche o negócio']) assert.ok(html.includes(`<h3>${t}</h3>`), t);
  assert.match(html, /Você não precisa ter uma lista própria de contatos/);
  assert.match(html, /href="\.\/">Conhecer prospecção remota</);
  assert.doesNotMatch(html, /A CONFIRMAR/);
  semCSPInline(html);
});

test('as duas páginas explicam o negócio antes do formulário, com o Facebook em nova aba', async () => {
  for (const page of ['index.html', 'afiliados.html']) {
    const html = await read(page);
    assert.match(html, NEGOCIO, page);
    assert.ok(html.indexOf('O que faz a OperumData?') < html.indexOf('<form'), `${page}: negócio antes do formulário`);
    assert.match(html, FB, page);
    assert.match(html, /Veja exemplos no Facebook/, page);
    assert.doesNotMatch(html, /connect\.facebook\.net|fbq\(|<iframe/, page);
  }
});

test('nenhuma página usa percentual de comissão ou níveis', async () => {
  for (const page of ['index.html', 'afiliados.html']) {
    const html = await read(page);
    assert.doesNotMatch(html, /\d\s?%/, page);
    assert.doesNotMatch(html, /\bnível\b|\bníveis\b/i, page);
  }
});

test('formulários não pedem CPF, banco ou Pix e não simulam envio', async () => {
  const js = await read('js/landing.js');
  assert.doesNotMatch(js, /fetch\(|XMLHttpRequest|localStorage/);
  for (const page of ['index.html', 'afiliados.html']) {
    const html = await read(page);
    assert.doesNotMatch(html, /id="f-cpf"|id="f-pix"|banc[oá]ri[oa]s?"|agência/i, page);
    assert.match(html, /Envio ainda não disponível/, page);
  }
});

test('servidor de prévia bloqueia caminhos fora de public/ e extensões não permitidas', () => {
  assert.ok(resolvePublicPath('/').endsWith('index.html'));
  assert.ok(resolvePublicPath('/assets/img/hero-afiliados.webp'));
  assert.equal(resolvePublicPath('/../package.json'), null);
  const encoded = resolvePublicPath('/%2e%2e/src/app.js');
  assert.ok(encoded === null || encoded.includes(`${sep}public${sep}`), 'nunca sai de public/');
  assert.equal(resolvePublicPath('/.env'), null);
  assert.ok(resolvePublicPath('/afiliados').endsWith(`${sep}afiliados.html`), 'rota sem extensão');
});
