# Frontend v2 · 06 — Prompt técnico para o Codex

Copie o bloco abaixo para o Codex.

---

```
# TAREFA: Implementar o frontend v2 da OperumData Afiliados

## Contexto
Repositório: wdccruz/operumdata-afiliados (privado). Não criar outro repositório nem projeto.
Branch de trabalho: feat/frontend-conversao (já existe; parte de feat/frontend-demo, que contém feat/homologacao).
A especificação aprovada está em docs/frontend-v2/. Leia TODOS os arquivos antes de começar:
  01-ANALISE-E-ESTRATEGIA.md   diagnóstico, textos, identidade visual, regra de contraste do laranja
  02-LANDING-E-CADASTRO.md     rotas públicas, seções e textos finais, formulário, UTM, Facebook, login
  03-AREAS-AFILIADO-E-ADMIN.md telas autenticadas, vocabulário de status, modalidades
  04-COMPONENTES-E-CONTRATOS.md arquitetura, pastas, DataClient, tipos, erros, componentes
  05-STATUS-E-HOMOLOGACAO.md   pronto/simulado/pendente e critérios de aceite
  referencia-landing.html      referência visual da landing (abrir no navegador)
Em caso de conflito, a ordem de prioridade é: este prompt > 05 > 04 > 03 > 02 > 01 > referência visual.

## Objetivo
Substituir o protótipo atual (public/app.js, demo.js, style.css, demo.css) por um frontend
modular, leve, mobile-first, com alta conversão e preparado para integração futura,
SEM implementar banco de dados nem API nova.

## Proibições (obrigatórias)
1. Não criar tabelas, migrações, conexões ou alterações em qualquer banco, inclusive o do CRM.
2. Não alterar migrations/, nem a lógica de API em src/app.js. Exceção permitida: fallback
   de rotas do frontend para index.html (mudança mínima, com teste), se necessário.
3. Não ligar o frontend à API SQLite provisória (/api/register, /api/dashboard etc.).
   Ela usa percentuais e níveis e será descartada.
4. Não usar percentuais de comissão, níveis, metas por quantidade, "base de cálculo" ou "competência".
5. Não simular sucesso fora do modo demo. Nada de persistência fictícia disfarçada de real.
   O cadastro público NUNCA mostra "recebido/enviado/salvo", nem no modo demo: após validar,
   exibe "Envio ainda não disponível" (02 §4.3).
6. Não adicionar frameworks, bundlers, CDNs, Google Fonts, SDK/pixel do Facebook ou TikTok,
   analytics ou cookies de terceiros.
7. Não alterar operumdata.com, parceiros.operumdata.com, DNS, infraestrutura ou CI de deploy.
8. Não publicar nem fazer deploy. Não usar afiliados.operumdata.com.
9. Não pedir CPF, RG, dados bancários ou data de nascimento em nenhum formulário.
10. Não inventar fatos sobre a OperumData (clientes, países, números). Usar somente os textos
    aprovados de 02 §3 (revisão 2). Onde ainda faltar texto (Termos, Aviso de Privacidade,
    telas internas), usar [A CONFIRMAR] visível só fora de produção.

## Stack
- HTML + CSS com variáveis + JavaScript em módulos ES nativos (<script type="module">). Sem build.
- Sem scripts inline (CSP do helmet: script-src 'self'). Config em public/config.js.
- Node 24 para ferramentas e testes (node:test). Playwright pode ser adicionado como
  devDependency apenas para capturas de tela/smoke tests, se útil; não deve rodar em produção.

## Passos
1. Estrutura: criar a árvore de public/ descrita em 04 §2. Remover app.js, demo.js, style.css,
   demo.css antigos. Atualizar package.json "check" para validar todos os .js de public/js e tools/
   (ex.: script que roda node --check em cada arquivo).
2. Tokens e base: tokens.css exatamente com os valores de 01 §3.1. Respeitar a regra de
   contraste de 01 §3.2 (laranja com texto branco somente ≥18px/700; texto laranja = #C2410C).
3. Núcleo: router.js (History API, rotas de 02 §1 e 03 §3/§4, guardas por papel usando a
   Sessao do DataClient, 404), html.js (template com escape automático), format.js
   (centavos→"R$ 1.234,56", datas pt-BR fuso America/Sao_Paulo, telefone), validate.js,
   utm.js (02 §4.4), errors.js (04 §6), store.js.
4. Dados: contracts.js com enums e typedefs de 04 §5 (completar os tipos Admin no mesmo
   padrão). client.js com a fábrica. api-client.js: implementar a interface inteira; cada
   método rejeita com ErroDados { codigo: 'BACKEND_PENDENTE' }. Deixar a função interna
   request(path, {method, body}) pronta (fetch same-origin, JSON, X-CSRF-Token, mapeamento de
   status → códigos de 04 §6), porém NÃO chamada pelos métodos. Comentar em cada método o
   endpoint sugerido de 04 §4.1 como "PROPOSTA".
5. Demonstração: data/demo/demo-client.js + fixtures.js conforme 05 §2. Carregar só por
   import() dinâmico quando config.mode==='demo' e environment!=='production', recusando
   hostnames de operumdata.com. Painel "Demo" flutuante (nunca no topo).
6. Componentes ui/ de 04 §7: recebem dados por parâmetro, não importam data/.
7. Landing (02 §2–§3, revisão 2): seções na ordem, textos EXATOS de referencia-landing.html,
   espaçamentos reduzidos da revisão 2, botão fixo no celular,
   FAQ com <details>, convite do Facebook discreto (botão neutro, link simples, nova aba, rel="noopener"),
   faixa de homologação contendo a palavra HOMOLOGAÇÃO (teste existente depende disso).
   Usar referencia-landing.html como guia visual.
8. Cadastro (02 §4): duas etapas, validações, estados, UTM anexado, regra de senha vinda de
   config.passwordPolicy, links para /termos e /privacidade (páginas com texto [A CONFIRMAR]).
9. Login (02 §5) e tela de cadastro em análise (03 §3.1).
10. Área do afiliado (03 §3) e área admin (03 §4) completas, com estados carregando/vazio/erro
    e, no modo api, estado "Disponível após a integração".
11. tools/preview-frontend.js: servir public/ com subpastas, lista de extensões permitidas,
    bloqueio de path traversal, fallback para index.html em rotas sem extensão, e servir
    config.js de demonstração (environment 'development', mode 'demo').
    public/config.js versionado: environment 'staging', mode 'demo'.
    tools/export-frontend.js: atualizar ou remover (se remover, ajustar docs/FRONTEND.md).
12. Testes (05 §3.5): node:test para validate, format, utm, router, errors, api-client
    (BACKEND_PENDENTE), busca de textos proibidos em public/ (percentual de comissão, "nível"),
    segurança do servidor de prévia. Manter test/app.test.js passando sem alterações de lógica.
13. Documentação: atualizar README.md (seção "Foco atual") e docs/FRONTEND.md com como abrir,
    modos demo/api, matriz pronto/simulado/pendente e lista de [A CONFIRMAR].

## Entrega
- Commits pequenos e descritivos em feat/frontend-conversao. Rodar: npm run check && npm test
  && npm audit --omit=dev --audit-level=high.
- Abrir/atualizar PR em RASCUNHO com:
  * resumo do que foi feito;
  * tabela pronto / simulado / pendente (05 §1) refletindo o estado REAL;
  * checklist de 05 §3 marcado só com o que foi verificado de fato, e o que não foi;
  * capturas em 360, 390, 768 e 1280 px (landing, cadastro etapa 1 e 2, sucesso demo,
    painel do afiliado, nova indicação R$ 300, admin visão geral, admin detalhe de indicação);
  * resultado do Lighthouse mobile da landing;
  * lista de todos os [A CONFIRMAR] restantes.
- Não fazer merge. Não fazer deploy.

## Fora do escopo desta tarefa (fase seguinte, NÃO fazer agora)
Inspecionar o banco do CRM, projetar tabelas de afiliados, migrações, autenticação real,
isolamento de dados, regras financeiras, endpoints /api/v2 e integração do ApiClient.
```
