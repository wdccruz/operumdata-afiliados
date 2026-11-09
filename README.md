# OperumData Comercial — Prospecção remota e Afiliados

Plataforma comercial da OperumData para captar e gerir parceiros externos. **Comece por [AGENTS.md](AGENTS.md).**

## O que existe

| Parte | Estado |
|---|---|
| Página principal — **Prospecção remota** (`public/index.html`) | Pronta. R$ 150 por empresa com contrato assinado e origem validada. |
| Página secundária — **Afiliados** (`public/afiliados.html`, servida como `/afiliados`) | Pronta. R$ 50 Indique uma empresa · R$ 150 Apresente a oportunidade · R$ 300 Feche o negócio (2 × R$ 150: contrato assinado e início efetivo das gravações). |
| Formulários das duas páginas | Validam no navegador e **não enviam nem armazenam dados** até o backend ser integrado. |
| Hospedagem | **HostGator**, `https://comercial.operumdata.com`: `/` prospecção remota, `/afiliados`, `/painel/`. Pacote pronto com `.htaccess`; publicação pela OperumData ([docs/IMPLANTACAO-HOSTGATOR.md](docs/IMPLANTACAO-HOSTGATOR.md)). |
| Prévia provisória | https://wdccruz.github.io/operumdata-afiliados/ (só revisão visual, fora das buscas; não faz parte da operação). |
| Backend, banco, autenticação e painéis | **Em desenvolvimento pelo Codex** na branch `feat/backend-supabase`, num **projeto Supabase independente** (não usa o Supabase do CRM). |
| Integração com o CRM | Possibilidade futura por API. Não faz parte da etapa atual. |

Regras comerciais aprovadas: [docs/REGRAS-COMERCIAIS.md](docs/REGRAS-COMERCIAIS.md). Comissões são valores fixos em reais, nunca percentuais ou níveis.

## Executar o frontend

Requisito: Node.js 24.

```sh
npm ci
npm run preview:frontend   # http://localhost:3200 e http://localhost:3200/afiliados
npm run check
npm test
node tools/build-hostgator.js --painel <pasta>   # pacote para a HostGator em dist/hostgator/comercial/
```

O frontend é HTML, CSS e JavaScript puros, sem build e sem scripts inline (CSP `script-src 'self'`). Fotos em `public/assets/img/` com origem e licença anotadas no HTML.

## Documentação

| Documento | Conteúdo |
|---|---|
| [AGENTS.md](AGENTS.md) | Porta de entrada: estado, estrutura, comandos, regras e autorizações |
| [docs/PENDENCIAS-CODEX.md](docs/PENDENCIAS-CODEX.md) | Sequência de implementação do backend, aceite e testes |
| [docs/REGRAS-COMERCIAIS.md](docs/REGRAS-COMERCIAIS.md) | Modalidades aprovadas e decisões pendentes |
| [docs/ARQUITETURA.md](docs/ARQUITETURA.md) | Frontend, formulários, fluxos, painéis, publicação e domínio |
| [docs/IMPLANTACAO-HOSTGATOR.md](docs/IMPLANTACAO-HOSTGATOR.md) | Pacote, estrutura de pastas, cPanel, DNS, HTTPS e conferência |
| [docs/INTEGRACAO-SUPABASE.md](docs/INTEGRACAO-SUPABASE.md) | Banco independente, modelo de dados, segurança, integração futura com o CRM |
| [docs/FLUXOS-E-DADOS.md](docs/FLUXOS-E-DADOS.md) | Fluxos e campos, separando real, demonstrativo e não implementado |
| [docs/frontend-v2/](docs/frontend-v2/) | Histórico da especificação de interface |

## Legado

`src/`, `migrations/001_initial.sql`, `public/prototipo.html`, `public/app.js`, `public/demo.js`, `public/style.css` e `public/demo.css` são de um protótipo anterior (Express + SQLite, comissões percentuais e níveis). **Não representam o modelo aprovado**, não estão ligados às páginas e serão substituídos pelo backend do Codex. Os documentos `docs/FRONTEND.md` e `docs/HOMOLOGACAO.md` descrevem esse protótipo.

## Limites

- Produção não está autorizada sem aprovação expressa da OperumData.
- `operumdata.com` e `parceiros.operumdata.com` não fazem parte deste projeto e não devem ser alterados.
- Nenhum segredo, `.env` ou dado real no repositório.
