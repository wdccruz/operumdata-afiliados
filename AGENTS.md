# AGENTS.md — OperumData Parceiros (afiliados e prospecção remota)

**Atualização de execução (09/11/2026):** o desenvolvimento completo do banco comercial e backend foi autorizado expressamente pela OperumData nesta conversa, sem aprovações rotineiras por etapa. A branch `feat/backend-supabase` parte de `bb2120f` e utiliza apenas o novo projeto `operumdata-comercial` (`owpkzqobxzsutsbhjrfp`). Estado efetivo, migrações, endpoints e pendências reais: [docs/BACKEND-IMPLEMENTADO.md](docs/BACKEND-IMPLEMENTADO.md). O estado histórico abaixo não deve ser confundido com o que já foi implementado nessa branch. Preservar as páginas públicas em edição paralela pelo Claude. Custos, dados reais, CRM e produção continuam fora da autorização.

Leia este arquivo inteiro antes de qualquer mudança. Ele é a porta de entrada para o Codex e outros agentes. Nada aqui depende de conversas anteriores.

**Ordem de leitura:** este arquivo → [docs/PENDENCIAS-CODEX.md](docs/PENDENCIAS-CODEX.md) → [docs/REGRAS-COMERCIAIS.md](docs/REGRAS-COMERCIAIS.md) → [docs/ARQUITETURA.md](docs/ARQUITETURA.md) → [docs/INTEGRACAO-SUPABASE.md](docs/INTEGRACAO-SUPABASE.md) → [docs/FLUXOS-E-DADOS.md](docs/FLUXOS-E-DADOS.md). Detalhes de interface: [docs/frontend-v2/](docs/frontend-v2/). Em caso de conflito, **este arquivo e os documentos de `docs/` (fora de `frontend-v2/`) prevalecem**: a pasta `frontend-v2/` registra o histórico da especificação de interface, e o `06-PROMPT-CODEX.md` ali é anterior à decisão do banco independente.

## 1. Objetivo

Captar e gerir parceiros comerciais externos da OperumData em duas modalidades:

1. **Prospecção remota (principal).** Profissionais de vendas por telefone recebem listas de empresas da OperumData, agendam reuniões e recebem R$ 150 por contrato assinado e oportunidade validada.
2. **Afiliados (secundária).** Pessoas que conhecem empresários indicam empresas e recebem R$ 50, R$ 150 ou R$ 300 por empresa contratada, conforme a participação.

As regras comerciais completas estão em [docs/REGRAS-COMERCIAIS.md](docs/REGRAS-COMERCIAIS.md). Não invente regras.

O negócio da OperumData, que as páginas explicam: conectar empresas brasileiras a projetos internacionais de IA e robótica, em que profissionais realizam suas atividades habituais enquanto câmeras registram o trabalho do ponto de vista de quem executa. As empresas podem receber remuneração pelas gravações aprovadas.

## 2. Estado atual (09/11/2026)

| Parte | Estado |
|---|---|
| Página de prospecção remota (`public/index.html`) | **Pronta** (frontend estático). Formulário valida, mas **não envia nem grava dados**. |
| Página de afiliados (`public/afiliados.html`) | **Pronta** (frontend estático). Mesmo comportamento: valida e mostra "Envio ainda não disponível". |
| Captura de UTM | **Pronta** em `sessionStorage` (`od.origem`), sem cookies, sem envio. |
| Prévia pública | **Pronta** em GitHub Pages (branch `gh-pages`): https://wdccruz.github.io/operumdata-afiliados/ (noindex + robots.txt). |
| Domínio `comercial.operumdata.com` | **Planejado.** Depende de registro DNS no Cloudflare autorizado pela OperumData. Ver [docs/ARQUITETURA.md §6](docs/ARQUITETURA.md). |
| Painel do afiliado, painel do prospector, área administrativa | **Não implementados.** Só especificados. Existe um protótipo demonstrativo antigo em `public/prototipo.html` com dados fictícios e modelo de comissão **obsoleto**. |
| Backend, banco, autenticação | **Não implementados.** Banco será **independente** (novo projeto Supabase só desta plataforma). Especificados em `docs/INTEGRACAO-SUPABASE.md` e `docs/FLUXOS-E-DADOS.md`. |
| Integração com o CRM | **Apenas possibilidade futura** por API. Não implementar agora. |
| `src/` + `migrations/001_initial.sql` (Express + SQLite) | **Provisório e obsoleto.** Usa comissão percentual e níveis, que **não** são o modelo aprovado. Não ligar o frontend a ele e não evoluí-lo como backend definitivo. Pode ser removido quando o backend novo existir (com aprovação). |

## 3. Estrutura

```
public/                    site estático publicado (GitHub Pages)
  index.html               PROSPECÇÃO REMOTA (página principal)
  afiliados.html           AFILIADOS (servida como /afiliados)
  prospeccao-remota.html   redirecionamento antigo → ./
  termos.html, privacidade.html   textos jurídicos provisórios (em revisão)
  entrar.html              placeholder de login (sem autenticação)
  prototipo.html, app.js, demo.js, style.css, demo.css   protótipo antigo, obsoleto
  css/landing.css          estilos das duas páginas
  js/landing.js            validação dos formulários, UTM, botão fixo (sem fetch)
  assets/img/              fotos (Unsplash; origem anotada no HTML)
  robots.txt               bloqueia indexação da prévia
src/, migrations/          backend provisório obsoleto (ver §2)
tools/preview-frontend.js  servidor estático local (/afiliados → afiliados.html)
tools/export-frontend.js   exporta o protótipo antigo
test/frontend.test.js      testes das páginas e do servidor de prévia
test/app.test.js           testes do backend provisório
docs/                      documentação técnica (ver ordem de leitura)
```

## 4. Tecnologias

- Frontend: HTML + CSS + JavaScript puro, sem framework e sem build. CSP do projeto exige **nenhum script ou estilo inline** (`script-src 'self'`).
- Node.js 24 (obrigatório: os testes do backend provisório usam `node:sqlite`).
- Testes: `node:test`. Verificação visual: Playwright (já disponível no ambiente, não é dependência do projeto).
- Backend futuro: **novo projeto Supabase independente** (PostgreSQL, Auth, RLS, Edge Functions), dedicado só a Afiliados e Prospecção Remota. **Não** usar o Supabase do CRM `wdccruz/operumdata-crm` e não depender dele.

## 5. Comandos

```bash
npm ci                    # instalar
npm run preview:frontend  # http://localhost:3200 (prospecção) e /afiliados
npm run check             # sintaxe dos .js
npm test                  # todos os testes (Node 24)
```

Publicar a prévia (somente após aprovação da OperumData): copiar o conteúdo de `public/` para a branch `gh-pages`, mantendo `.nojekyll` e `LEIA-ME.txt`. Ver [docs/ARQUITETURA.md §6](docs/ARQUITETURA.md).

## 6. Regras que não podem ser alteradas sem autorização expressa da OperumData

1. Não alterar `operumdata.com`, `parceiros.operumdata.com`, seus repositórios, DNS ou hospedagem. Não publicar na HostGator.
2. Não publicar em produção nem ativar cadastros reais antes de existir backend seguro **e** termos jurídicos aprovados.
3. Não usar, alterar nem depender do CRM (`wdccruz/operumdata-crm`) ou do seu projeto Supabase. O banco desta plataforma é independente e só será criado em etapa aprovada pela OperumData. Integração com o CRM é possibilidade futura por API.
4. Não versionar senhas, tokens, chaves (`service_role`, chaves secretas), `.env` ou dados reais. Usar só dados fictícios em testes.
5. Comissões são valores fixos em reais (R$ 50 / R$ 150 / R$ 300 nos afiliados; R$ 150 na prospecção remota). **Nunca** percentuais, níveis ou metas.
6. Prospecção remota é parceria comercial independente: sem jornada fixa, controle de horas, metas mínimas ou exclusividade; o parceiro aceita ou recusa listas. Nunca usar "vaga de emprego", "salário" ou "contratação de telemarketing". Não afirmar que o aceite de termos elimina vínculo trabalhista.
7. Não pedir CPF, RG, dados bancários ou Pix no cadastro inicial.
8. Nenhuma tela mostra "enviado", "salvo", "aprovado" ou "pago" sem resposta real do backend. Dados demonstrativos sempre identificados como tal.
9. Não afirmar que uma integração está pronta quando está apenas planejada.
10. Facebook: link simples para https://www.facebook.com/operumdata/ em nova aba; sem SDK, pixel ou feed incorporado. Nenhum rastreamento de terceiros.
11. Trabalhar em branches e pull requests; rodar `npm run check` e `npm test` antes de cada commit.
12. Preservar auditoria de toda ação administrativa e financeira.

## 7. Branches

`main` ← `feat/homologacao` (PR #1) ← `feat/frontend-demo` (PR #2) ← `feat/frontend-conversao` (PR #3, rascunho, trabalho atual). `gh-pages` contém só a cópia publicada de `public/`.
