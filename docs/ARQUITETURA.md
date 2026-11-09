# Arquitetura

**Implementação em branch própria (09/11/2026):** backend Supabase independente e painéis separados em `public/painel/` implementados em `feat/backend-supabase`. As páginas públicas abaixo continuam sem conexão, preservadas para o trabalho paralelo do Claude. Consulte [BACKEND-IMPLEMENTADO.md](BACKEND-IMPLEMENTADO.md) para o estado efetivamente testado; os diagramas abaixo registram o desenho de referência anterior.

Estado em 09/11/2026. Legenda: **[pronto]** funciona hoje; **[demo]** só demonstração com dados fictícios; **[planejado]** especificado, não existe.

## 1. Visão geral

```
Visitante ──► Site estático (GitHub Pages)            [pronto]
               public/index.html      prospecção remota
               public/afiliados.html  afiliados
                     │ formulários validam, mas NÃO enviam
                     ▼
            API de candidaturas (Supabase Edge Function)   [planejado]
                     ▼
            Supabase INDEPENDENTE (novo projeto, só desta plataforma)   [planejado]
               (parceiros, empresas, listas, atribuições, reuniões, indicações,
                contratos vinculados, comissões, pagamentos, eventos, auditoria)
                     ▲                        ▲
     Painel do parceiro (afiliado/prospector)  Área administrativa OperumData   [planejado]
                     ┆
                     ┆ futuro (não implementar): API com o CRM
                     ┆ envia empresas/reuniões · recebe contratos/início de gravações
```

Princípios: banco **independente** do CRM (decisão de 09/11/2026); o site público nunca escreve direto em tabela; toda gravação externa passa por uma função de servidor que valida e limita taxa. Ver [INTEGRACAO-SUPABASE.md](INTEGRACAO-SUPABASE.md).

## 2. Frontend

- HTML/CSS/JS puros, sem build. Arquivos em `public/`. CSP sem inline (`script-src 'self'`, estilos em `css/landing.css`).
- Mobile-first, testado em 360 px, 390 px (iPhone 13) e 1280 px. Botão fixo no celular aparece depois do herói e some quando o formulário está visível.
- Identidade: fundo claro, textos #111418 e cinzas, laranja #FF5A1F (texto branco sobre laranja só ≥18 px negrito; texto laranja usa #C2410C).
- Páginas comerciais: **somente duas**. Não criar página institucional extra.

| Rota pública | Arquivo | Conteúdo |
|---|---|---|
| `/` | `public/index.html` | Prospecção remota: herói com "Quem faz o quê", Como funciona (4 passos), O que faz a OperumData?, candidatura, FAQ, condições recolhidas. |
| `/afiliados` | `public/afiliados.html` | Afiliados: herói, modelo de indicação, R$ 50/150/300, chamada destacada para a prospecção remota, contatos/setores, O que faz a OperumData?, cadastro, FAQ. |
| `/prospeccao-remota.html` | redirecionamento | Mantém links antigos. |
| `/termos.html`, `/privacidade.html` | provisórias | Texto jurídico pendente (REGRAS-COMERCIAIS P9). |
| `/entrar.html` | placeholder | Sem login real. |

`/afiliados` sem extensão funciona porque o GitHub Pages serve `afiliados.html`; `tools/preview-frontend.js` imita esse comportamento localmente. Links internos são relativos (`./`, `afiliados`), para funcionar tanto na subpasta da prévia quanto na raiz do domínio próprio.

`public/js/landing.js` (único script):
- grava UTM permitidos (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`) em `sessionStorage['od.origem']`;
- valida os formulários em duas etapas, com máscara de WhatsApp e erros por campo;
- ao enviar, mostra "Envio ainda não disponível… Nenhum dado foi enviado ou armazenado". **Não há `fetch`.** O tipo de cadastro vem de `form[data-tipo]`.

## 3. Formulários [pronto no frontend · envio planejado]

**Candidatura de prospector remoto** (`data-tipo="candidato_prospector_remoto"`, em `/`):
etapa 1: nome, WhatsApp, e-mail, cidade, UF · etapa 2: experiência principal (`telemarketing_ativo|televendas|vendas_b2b|agendamento_reunioes|outra`), tempo de experiência (`menos_1|1_3|3_5|mais_5`), disponibilidade **opcional e informativa** (`eventual|alguns_dias|maioria_dias`), possui computador/meio para ligações (`sim|nao`), aceite de privacidade e condições. Sem senha nesta etapa.

**Cadastro de afiliado** (`data-tipo="afiliado_indicador"`, em `/afiliados`):
etapa 1: nome, e-mail, WhatsApp, cidade, UF · etapa 2: perfil profissional, setores em que tem contatos (múltipla escolha), senha (≥12), aceite dos termos e do aviso de privacidade.

> Decisão para o Codex: a especificação recomenda **não** coletar senha no cadastro público (conta criada por convite após aprovação, como no CRM). Se adotada, remover o campo de senha do formulário de afiliados. Ver [PENDENCIAS-CODEX.md](PENDENCIAS-CODEX.md) etapa 2.

Campos completos e validações: [FLUXOS-E-DADOS.md §1](FLUXOS-E-DADOS.md).

## 4. Fluxos de cadastro e aprovação [planejado]

1. Visitante envia candidatura → função de servidor valida, aplica limite de taxa, grava `partner_applications` com situação `em_analise` e origem UTM. Resposta só confirma recebimento **quando** a gravação acontecer de fato.
2. Administração revisa → aprova, recusa (motivo) ou pede informação.
3. Aprovado → convite por e-mail (Supabase Auth, cadastro público desabilitado) → parceiro define senha e aceita os termos vigentes (versão registrada).
4. Parceiro ativo acessa o painel da sua modalidade. Suspensão/reativação pela administração, com motivo e auditoria.

Detalhes: [FLUXOS-E-DADOS.md](FLUXOS-E-DADOS.md).

## 5. Painéis e áreas administrativas [planejado]

| Área | Telas principais | Especificação |
|---|---|---|
| Painel do afiliado | Resumo, minhas indicações (etapa comercial separada da situação financeira), nova indicação com modalidade pretendida, comissões e pagamentos, perfil | [frontend-v2/03](frontend-v2/03-AREAS-AFILIADO-E-ADMIN.md) |
| Painel do prospector | Listas oferecidas (aceitar/recusar), minhas empresas, registrar contato, reuniões, contratos, comissões. **Sem** horas, metas ou ranking | [frontend-v2/07 §4](frontend-v2/07-PROSPECCAO-REMOTA.md) |
| Administração de parceiros | Fila de candidaturas, parceiros, indicações e duplicidade, validação de modalidade, listas e atribuições, reuniões encaminhadas, comissões (liberar/cancelar), pagamentos, auditoria | [frontend-v2/03 §4](frontend-v2/03-AREAS-AFILIADO-E-ADMIN.md) e 07 |

Arquitetura de frontend sugerida para os painéis (módulos ES, `DataClient` com `DemoClient` e `ApiClient`): [frontend-v2/04](frontend-v2/04-COMPONENTES-E-CONTRATOS.md). Como o backend será Supabase, o `ApiClient` pode usar `@supabase/supabase-js` (via import de arquivo local, sem CDN) mantendo a mesma interface.

## 6. Publicação e domínio

**Hoje [pronto]:** GitHub Pages publicado a partir da branch `gh-pages` (cópia de `public/`, com `.nojekyll`). URL: https://wdccruz.github.io/operumdata-afiliados/ e `/afiliados`. Repositório público por decisão da OperumData. `noindex` em todas as páginas e `robots.txt` com `Disallow: /`.

**Planejado: `comercial.operumdata.com`** (prospecção em `/`, afiliados em `/afiliados`):
1. DNS do `operumdata.com` está no **Cloudflare** (NS `zara`/`watson.ns.cloudflare.com`). Em 09/11/2026 `comercial.operumdata.com` não existia (NXDOMAIN).
2. Registro necessário, **somente com autorização da OperumData**: `CNAME comercial → wdccruz.github.io`, proxy **desligado** (nuvem cinza, "DNS only"), TTL automático. Não altera `operumdata.com`, `parceiros.operumdata.com` nem a HostGator.
3. Depois que o DNS responder: GitHub → Settings → Pages → Custom domain = `comercial.operumdata.com` (isso grava o arquivo `CNAME` na `gh-pages`). Aguardar o certificado e marcar **Enforce HTTPS**.
4. Recomendado: verificar o domínio `operumdata.com` em GitHub → Settings (conta) → Pages → Verified domains (registro TXT `_github-pages-challenge-wdccruz`), para impedir uso indevido do subdomínio.
5. Após configurar, `wdccruz.github.io/operumdata-afiliados/` redireciona para o domínio próprio. Só considerar pronto após testar DNS, HTTPS e as duas páginas.
6. Quando sair da fase de homologação (com aprovação), remover a faixa HOMOLOGAÇÃO, o `noindex` e o `robots.txt` restritivo.

Backend (Edge Functions) e painéis terão origem própria; configurar CORS só para `https://comercial.operumdata.com` (e a URL da prévia durante a homologação).

## 7. Pontos de integração futura

| Ponto no frontend | Integração | Etapa |
|---|---|---|
| `landing.js` envio da candidatura de prospector | `POST` função `partner-apply` (tipo `prospector`) | PENDENCIAS 2 |
| `landing.js` envio do cadastro de afiliado | mesma função (tipo `affiliate`) | PENDENCIAS 2 |
| `entrar.html` | Supabase Auth (convite, senha, recuperação) | PENDENCIAS 3 |
| Painéis e administração | tabelas do banco independente com RLS | PENDENCIAS 4–7 |
| Envio ao CRM / confirmações do CRM | API futura (não implementar) | fora do plano atual |
| `termos.html`, `privacidade.html` | textos aprovados + versão registrada no aceite | depende de P9 |
