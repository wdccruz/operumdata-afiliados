# Backend comercial — implementação de desenvolvimento

Estado verificado em 09/11/2026. Esta implementação parte de `feat/frontend-conversao` no commit `bb2120f0b6c4df8b369934387aad9ef9549f9231`, no repositório `wdccruz/operumdata-afiliados`. Branch própria: `feat/backend-supabase`. A autorização expressa da OperumData nesta data substitui as aprovações técnicas por etapa dos documentos anteriores, sem autorizar custos, produção ou alterações no CRM.

A atualização paralela do Claude `0dd6152` foi incorporada posteriormente **somente na branch de backend**, preservando integralmente as alterações visuais públicas e conciliando dois documentos. Não houve merge na branch do Claude ou em main. Revisão em [PR #4](https://github.com/wdccruz/operumdata-afiliados/pull/4).

## Projeto efetivamente utilizado

- Organização **OperumData**: `jcqtenzoktmfkehctzdq`, plano Free.
- Projeto **operumdata-comercial**: `owpkzqobxzsutsbhjrfp`, região `sa-east-1` (São Paulo), criado com cotação de US$ 0/mês.
- URL API: https://owpkzqobxzsutsbhjrfp.supabase.co.
- O projeto do CRM `lpmzgbsvswnlxomaoyzj` não foi consultado internamente, alterado ou utilizado como dependência.
- O rótulo padrão `main / PRODUCTION` do painel Supabase identifica a branch principal do serviço; este projeto contém somente desenvolvimento e dados fictícios e não representa publicação comercial em produção.

## Tabelas criadas e migrações aplicadas

Em `public`, todas com RLS: `users_profile`, `commercial_settings`, `partner_applications`, `partners`, `companies`, `company_contacts`, `company_internal`, `referrals`, `lead_lists`, `assignments`, `contact_logs`, `meetings`, `deals`, `attributions`, `commission_items`, `payments`, `payment_items`, `partner_payout_details`, `external_refs`, `events`, `audit_log`.

Em `commercial_private`, não exposto à API: `rate_buckets`, `staff_invites` e `application_receipts`, com RLS e sem políticas de acesso de clientes (negação intencional).

Migrações versionadas e efetivamente aplicadas:

1. `20261109160005_commercial_core.sql`: esquema, índices, constraints, RLS, comandos transacionais, auditoria, convites e proteção adicional de Auth.
2. `20261109160814_commercial_overview.sql`: indicadores calculados sob as permissões do usuário.
3. `20261109161833_commercial_hardening.sql`: consolidação das políticas de leitura, índice de convites e validações adicionais.
4. `20261109162226_invitation_idempotency.sql`: vínculo de convite idempotente, testado com Auth sintético local sem credenciais reais.
5. `20261109162420_invitation_recovery.sql`: reconciliação do vínculo quando Auth aceitou um convite e a gravação do perfil precisa ser repetida.
6. `20261109162621_application_receipts.sql`: recibos reais por envio, com resposta pública uniforme, sem enumeração de e-mails ou duplicação de candidaturas.

As datas nos nomes são geradas pelo CLI. Nenhuma migração do projeto comercial foi aplicada ao CRM. Tipos efetivos gerados do banco em `supabase/database.types.ts`.

## APIs e operações reais

Base: `https://owpkzqobxzsutsbhjrfp.supabase.co/functions/v1/`.

Parâmetros e respostas para integração pelo frontend: [API-COMERCIAL.md](API-COMERCIAL.md).

| Endpoint | Operação | Autorização |
|---|---|---|
| `partner-apply` | Valida candidatura e grava em `partner_applications` | Público, apenas dados fictícios `.test` neste ambiente, CORS restrito, honeypot/tempo de preenchimento e limite persistente de 5 envios/hora por origem de rede com hash salgado |
| `commercial-api` | Consultas paginadas, indicadores e comandos abaixo | JWT validado por `auth.getUser`, perfil ativo, permissões verificadas no banco |
| `manage-partners` | Aprovação/recusa/pedido de informação e convite de conta | Administrador; não cria Auth real para identidades fictícias |
| `staff-invite` | Convite de administrador ou financeiro | Administrador existente; não admite e-mails fictícios `.test` |

Os endpoints autenticados fazem sua própria validação de JWT, por isso o verificador legado do gateway está desabilitado. Isso **não** torna essas operações anônimas. Requests sem identidade são rejeitados antes das consultas. `partner-apply` usa a chave privilegiada somente dentro do ambiente seguro do Supabase.

Contrato de leitura: `{ "action": "read", "table": "referrals", "offset": 0, "limit": 50 }`. Retorna `{rows,count,offset,limit}` sob RLS; limite máximo 100. Indicadores: `{ "action": "overview" }`.

Contrato de escrita: `{ "action": "referral_create", "params": {...} }`. As ações implementadas são: `application_decide`, `partner_status`, `accept_terms`, `setting_decide`, `staff_invite_prepare`, `company_create`, `referral_create`, `referral_validate`, `list_offer`, `list_respond`, `assignment_return`, `assignment_transfer`, `list_expire`, `contact_log`, `meeting_schedule`, `meeting_status`, `deal_sign`, `recording_confirm`, `commission_cancel`, `payment_register`, `payout_update`.

O cliente não escreve diretamente nas tabelas. O RPC público de comando é um encaminhador `SECURITY INVOKER`; a implementação privilegiada fica no schema privado, com `search_path=''`, privilégios explícitos e autorização por identidade e papel em cada operação. Funções de ingestão e vínculo de convite são executáveis somente por `service_role`.

## Regras efetivas

- CNPJ numérico opcional, normalizado e validado por dígitos verificadores. Suporte alfanumérico ainda não implementado; não foi exigido pela documentação atual.
- Duplicidade consultada por CNPJ, domínio, telefone e nome+cidade, incluindo indicações pendentes. Parceiros não recebem identidade ou dados do outro parceiro. Indicação em conflito fica pendente; não há regra automática de vencedor.
- Índice único parcial impede duas atribuições oferecidas/aceitas para a mesma empresa. O aceite/recusa é voluntário. Nenhuma métrica de horas, metas ou ranking.
- Uma atribuição/comissionamento por empresa; contrato e origem validados em transação única. Valores em centavos: 5000; 15000; ou 15000+15000. Prospecção remota: 15000.
- A segunda parcela de 15000 fica prevista até confirmação explícita e datada do início efetivo das gravações.
- Pagamentos manuais bloqueiam parcelas repetidas, conferem o total e usam chave de idempotência; não transferem dinheiro. O painel registra uma parcela por vez; a API aceita lotes do mesmo parceiro.
- Suspensão bloqueia novas operações do parceiro, preservando seu histórico. Pagamentos a parceiros não ativos ficam bloqueados enquanto a regra específica não for definida.
- `events` e `audit_log` são imutáveis; todas as tabelas de negócio têm auditoria e autor/data de alteração. Conteúdo de dados de recebimento não é copiado para a auditoria.
- `external_ref`/`external_refs` preparam identificadores futuros, sem sincronização, webhook ou conexão com o CRM.

## Configurações pendentes sem regras inventadas

P1–P9 estão registradas em `commercial_settings` como `pending`. P4 bloqueia pagamentos/dados de recebimento; P5 bloqueia cancelamento; P6 bloqueia expiração por prazo; P7 bloqueia segundo vínculo de modalidade; P9 bloqueia ativação/aceite até existir versão jurídica aprovada. P2/P3 bloqueiam resolução de conflitos. Uma lista sem prazo não recebe validade automática inventada. A aprovação de candidatura é uma decisão manual auditada, sem critério automático criado pelo código.

## Auth e primeiro administrador

Configuração hospedada verificada: cadastro público desabilitado, login anônimo desabilitado, confirmação de e-mail habilitada, senha mínima de 8 caracteres e proteção de troca de senha habilitada. Site URL `http://localhost:3200/painel/`; redirect autorizado `http://localhost:3200/painel/acesso.html`.

Fluxos de login, logout, senha por convite e recuperação estão implementados com SDK oficial, em bundle local. O SDK mantém a sessão em `sessionStorage`. A entrega de e-mails e o login completo com um administrador real ainda dependem do primeiro e-mail autorizado e da verificação do serviço de envio. SMTP próprio não foi fornecido/configurado. Não foram criadas credenciais reais de usuários fictícios nem enviados convites de teste a pessoas.

Procedimento sem senha fixa: [ADMIN-INICIAL.md](ADMIN-INICIAL.md). `supabase/config.toml` registra a configuração local desejada; não alegar que todas as opções desse arquivo foram sincronizadas remotamente: o CLI não dispõe de token de gestão neste ambiente. As opções hospedadas citadas acima foram aplicadas pela interface autenticada.

## Painéis implementados, separados das páginas públicas

`public/painel/`: acesso real, aceite/recuperação de senha, formulário de candidatura de integração e aplicação por papel. Administrador: candidaturas, parceiros, empresas, indicações, listas, atribuições, reuniões, contratos, parcelas, pagamentos, decisões e auditoria. Financeiro: parceiros, parcelas, pagamentos e dados de recebimento. Prospector: suas listas/empresas, contatos, reuniões, contratos e comissões. Afiliado: indicações, empresas acessíveis, reuniões, contratos e comissões.

Executar `npm ci`, `npm run preview:frontend`, abrir http://localhost:3200/painel/. Não foram modificados `index.html`, `afiliados.html`, `landing.js`, `landing.css` ou `entrar.html`; o Claude pode integrar links e envio das páginas públicas depois. O frontend público ainda não envia candidaturas. O formulário novo separado já consome a Edge Function real.

Na futura hospedagem dos painéis, a CSP deve permitir conexão somente com este host Supabase. `public/painel/_headers` contém a configuração de referência para hospedar esse diretório como raiz. A CSP global anterior do site não foi alterada. Origens remotas e URLs adicionais serão configuradas apenas na homologação autorizada. Hoje CORS permite localhost/127.0.0.1:3200.

## Testes e evidências reais

- `npm run check`, `npm test`: 11 testes passaram, incluindo suíte PostgreSQL/PGlite que executa as migrações e fluxos completos de indicações/listas/contratos/comissões/pagamentos com RLS.
- `npm run check:edge`: os quatro entrypoints passaram na verificação Deno/TypeScript.
- `node tools/smoke-commercial.mjs`: grava candidatura fictícia e recibos no Supabase; duplicidade recebe a mesma resposta pública neutra e um recibo novo, sem duplicar a candidatura; responde 429 ao limite; rejeita origem não permitida e APIs autenticadas sem sessão; acesso anônimo à tabela bloqueado; Auth com signup público desabilitado.
- `supabase/tests/remote_isolation.sql`: executado no projeto hospedado; verificou acesso próprio, isolamento A/B, proibição de alterar papel, bloqueio anônimo e autoria na auditoria. Todas as identidades sintéticas foram revertidas por ROLLBACK e não continham senhas.
- Security Advisor: sem ERROR/WARN; INFO para três tabelas internas com RLS sem políticas, intencionalmente inacessíveis ao cliente. [Explicação do aviso](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
- Auditoria npm de dependências de produção: zero vulnerabilidades conhecidas.
- Interface de acesso/recuperação conferida em 1280, 390 e 360 px. Formulário de integração conferido no navegador contra a API real, exibindo o erro 429 após o teste de limite, sem simular sucesso.
- Performance Advisor final: somente INFO de índices ainda não utilizados em ambiente novo; avisos de políticas múltiplas e chave estrangeira sem índice foram corrigidos. [Referência](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

A suíte HTTP grava dado fictício e consome o limite por hora; não rodar repetidamente sem aguardar a janela ou usar rede de testes controlada. Não resetar limitadores para usuários reais.

Ainda não verificado de ponta a ponta com pessoa real: recebimento de convite, definição de senha e navegação autenticada por papel no navegador. Isso depende do administrador inicial e do envio de e-mail. Testes de autorização/fluxos do banco não substituem essa homologação.

## Rollback e limites

Não há script destrutivo de rollback automático. Para interromper gravações, revogar EXECUTE dos RPCs de escrita e desativar as funções novas mantendo tabelas/históricos. Uma reversão estrutural exige snapshot/restauração em ambiente separado e aprovação explícita antes de remover qualquer dado. Migrações são aditivas; o backend SQLite e o protótipo obsoleto foram preservados, sem uso no novo fluxo.

Nenhum domínio, DNS, GitHub Pages ou site existente foi modificado. Nenhuma publicação de produção foi realizada. O serviço de candidaturas de desenvolvimento aceita somente identidades fictícias `.test`.
