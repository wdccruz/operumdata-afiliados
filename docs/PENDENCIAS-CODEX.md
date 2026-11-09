# Pendências para o Codex (sequência de implementação)

Sequência recomendada. **O Codex está autorizado a desenvolver de forma autônoma** o banco comercial num **projeto Supabase independente** (não o do CRM): criar e aplicar migrations, implementar autenticação, APIs e painéis, sem pedir aprovação a cada operação rotineira. **Não** está autorizado a contratar serviços pagos, alterar o CRM de forma destrutiva, publicar produção ou ativar cadastros reais antes dos termos jurídicos aprovados. A integração com o CRM é evolução futura. Detalhes em [AGENTS.md](../AGENTS.md) ("Autorização do Codex"). Decisões comerciais marcadas como pendentes em REGRAS-COMERCIAIS continuam dependendo da OperumData.

Leia antes: [AGENTS.md](../AGENTS.md), [REGRAS-COMERCIAIS.md](REGRAS-COMERCIAIS.md), [INTEGRACAO-SUPABASE.md](INTEGRACAO-SUPABASE.md), [FLUXOS-E-DADOS.md](FLUXOS-E-DADOS.md).

Regras para todas as etapas: nenhum segredo no Git; dados fictícios em testes; branches + PR em rascunho; `npm run check` e `npm test` verdes; não declarar pronto o que não foi testado.

## Etapa 0 — Hospedagem na HostGator (pacote pronto; publicação pela OperumData)

- Pacote: `node tools/build-hostgator.js --painel <public/painel>` com `.htaccess` para `/`, `/afiliados` e `/painel/`. Subdomínio, upload, DNS (no provedor que administra o domínio) e AutoSSL feitos pela OperumData. Ver [IMPLANTACAO-HOSTGATOR.md](IMPLANTACAO-HOSTGATOR.md).
- Para o Codex: Auth (Site URL e Redirect URLs) e CORS das Edge Functions com `https://comercial.operumdata.com/painel/`; o painel continua com caminhos relativos e sem scripts inline (CSP do `.htaccess`); decidir se `painel/candidatura.html` entra na homologação pública.
- Aceite: `/`, `/afiliados` e `/painel/` respondem 200 com certificado válido e recarregam sem erro; `operumdata.com` e `parceiros.operumdata.com` inalterados.

## Etapa 1 — Projeto Supabase independente e esquema base

- Criar o projeto `operumdata-comercial` (plano gratuito; homologação primeiro). Configurar Auth: cadastro público desabilitado, senha ≥ 12, SMTP, Redirect URLs.
- Pasta `supabase/` neste repositório com `config.toml` e migrations do esquema base de [INTEGRACAO-SUPABASE.md §3](INTEGRACAO-SUPABASE.md): `users_profile`, `companies` (validação de CNPJ), `company_contacts`, `events`, `audit_log`, funções de papel, RLS em tudo, `anon` sem acesso a tabelas.
- Ambiente local de testes de banco (ex.: PGlite ou `supabase start`) com contas sintéticas.
- Aceite: testes de RLS e de CNPJ passando; nenhum segredo no Git.
- Dependências: nenhuma. **Não** conectar ao CRM.

## Etapa 2 — Recebimento real de candidaturas

- Migration `partner_applications` (+ auditoria e eventos), Edge Function `partner-apply` (validação de esquema idêntica ao frontend, limite de taxa, proteção anti-spam sem serviços de terceiros não aprovados, CORS só para os domínios aprovados).
- Frontend: `landing.js` passa a enviar para a função; mensagens de sucesso **só** com resposta 2xx; estados de erro de rede, 409 neutro e 429.
- Decidir com a OperumData se o cadastro de afiliado deixa de pedir senha (recomendado: conta só por convite após aprovação).
- **Não ativar em produção** antes dos termos jurídicos (REGRAS P9) e da aprovação da OperumData. Até lá, rodar em ambiente de homologação com dados fictícios.
- Testes: payload válido/ inválido/ campos extras/ e-mail duplicado/ limite de taxa; usuário anônimo não lê `partner_applications`.
- Dependências: etapa 1.

## Etapa 3 — Aprovação, contas e autenticação de parceiros

- `partners`, papéis `admin`/`finance` em `users_profile`; tela administrativa de candidaturas (aprovar/recusar com motivo); convite por Edge Function (padrão `manage-users`); aceite de termos versionado; suspensão/reativação.
- Login em `entrar.html` (Supabase Auth, recuperação de senha).
- Testes críticos: parceiro A não vê parceiro B; parceiro não muda o próprio status; parceiro não lê tabelas administrativas.
- Dependências: etapa 2.

## Etapa 4 — Indicações de afiliados

- `referrals`; tela "Nova indicação" (modalidade pretendida, contato autorizado, domínio opcional); lista e detalhe com etapa comercial separada da situação financeira.
- Duplicidade: verificação por CNPJ/domínio/telefone/nome+cidade contra `companies` e indicações desta plataforma, sem revelar outro parceiro; decisão administrativa (regra P2/P3 precisa estar decidida).
- Fila de encaminhamento à equipe comercial (fluxo 7) na área administrativa. **Sem** envio ao CRM.
- Dependências: etapa 3, decisões P1–P3.

## Etapa 5 — Listas e atribuições da prospecção remota

- `lead_lists`, `assignments` (índice único parcial), `contact_logs`, `meetings`; telas do prospector (listas, minhas empresas, registrar contato, reuniões) e da administração (montar/oferecer listas, transferir, recolher).
- Visão segura das empresas: só campos autorizados.
- Sem métricas de horas, metas, ranking ou inatividade.
- Testes: empresa não fica com dois parceiros; prospector não vê empresa de outro; aceite/recusa/devolução/expiração.
- Dependências: etapa 3, decisões P2 e P6.

## Etapa 6 — Atribuição validada e comissões

- `deals`, `attributions`, `commission_items`; registro manual pela administração de contrato assinado e de início efetivo das gravações (com confirmação explícita), gerando eventos.
- Geração das parcelas conforme [FLUXOS-E-DADOS §10](FLUXOS-E-DADOS.md); liberação/cancelamento com motivo; painel de comissões do parceiro.
- Testes: cada modalidade gera os valores corretos em centavos; não cumulativo; 2ª parcela do R$ 300 só com gravação confirmada; parceiro não altera valores.
- Dependências: etapas 4 e 5, decisões P1 e P5.

## Etapa 7 — Pagamentos

- `payments`, `partner_payout_details`; coleta de dados de recebimento só aqui, com acesso restrito; registro manual com conferência de total; histórico para o parceiro.
- Dependências: etapa 6, decisão P4.

## Fora do plano atual — integração com o CRM (possibilidade futura)

Não implementar. Quando a OperumData decidir: projeto próprio com aprovação nos dois repositórios para (a) enviar empresas e reuniões ao CRM via outbox com idempotência, (b) receber confirmações de contrato e início das gravações via webhook assinado, (c) eventual migração/unificação por API usando UUIDs estáveis, `external_refs` e `events`. Ver [INTEGRACAO-SUPABASE.md §6](INTEGRACAO-SUPABASE.md).

## Etapa 8 — Limpeza e publicação (só com autorização)

- Remover backend provisório `src/` + SQLite e o protótipo antigo (`prototipo.html`, `app.js`, `demo.js`, `style.css`, `demo.css`) e ajustar testes.
- Retirar faixa de homologação, `noindex` e `robots.txt` restritivo.
- Publicação em produção somente com autorização expressa da OperumData.

## Critérios gerais de aceite de cada PR

- Descrição com o que está **pronto**, **demonstrativo** e **pendente**, refletindo o estado real.
- Capturas em 360, 390 e 1280 px das telas alteradas.
- Lista de migrations com plano de rollback.
- Testes de RLS e isolamento passando.

## Alinhamento entre as branches (frontend × backend)

Registro mantido pela branch `feat/frontend-conversao`. Em 09/11/2026 a branch `feat/backend-supabase` ainda não estava publicada no GitHub, então não foi possível comparar. Pontos que o backend precisa respeitar para o frontend atual:

| # | Ponto | Frontend atual | Observação |
|---|---|---|---|
| A1 | Tipo de cadastro | `form[data-tipo]` = `candidato_prospector_remoto` ou `afiliado_indicador` | A especificação de dados usa `kind = remote_prospector / affiliate`. Mapear no envio. |
| A2 | Senha no cadastro de afiliado | o formulário pede senha (≥12) | Recomendado: conta só por convite após aprovação. Se o backend adotar isso, o frontend remove o campo. |
| A3 | Campos e códigos | ver [FLUXOS-E-DADOS §1](FLUXOS-E-DADOS.md) | Valores de `experiencia_principal`, `tempo_experiencia`, `disponibilidade` (opcional) e `possui_equipamento` são os do HTML. |
| A4 | Origem | `sessionStorage['od.origem']` com UTM permitidos | Enviar junto da candidatura. |
| A5 | Mensagens | hoje "Envio ainda não disponível" | Trocar por confirmação só com resposta 2xx real; tratar erro de rede, 409 neutro e 429. |
| A6 | Domínios para CORS e Auth | `https://comercial.operumdata.com` (HostGator) | A prévia provisória do GitHub Pages não precisa de CORS: lá os formulários não enviam. |
| A7 | Rótulos das modalidades | "Indique uma empresa", "Apresente a oportunidade", "Feche o negócio" | Códigos internos sugeridos: `indicacao`, `apresentacao`, `prospeccao`. |

