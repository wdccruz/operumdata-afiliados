# Banco de dados e integração (Supabase independente)

**Decisão da OperumData (09/11/2026):** a plataforma Comercial OperumData (Afiliados e Prospecção Remota) terá **banco de dados independente**, preferencialmente um **novo projeto Supabase** dedicado só a ela.

- **Não** usar o projeto Supabase do CRM.
- **Não** modificar nem depender do CRM (`wdccruz/operumdata-crm`) para implementar as funcionalidades comerciais.
- Integração com o CRM é **possibilidade futura, por API**, e **não** será implementada agora.

**Nada deste documento está implementado.** Nesta etapa só existe a documentação. Não criar banco, não alterar o backend e não conectar ao CRM até a OperumData aprovar a etapa correspondente em [PENDENCIAS-CODEX.md](PENDENCIAS-CODEX.md).

## 1. Escopo: agora × futuro

| Será implementado (próximas etapas do Codex) | Apenas possibilidade futura (não implementar) |
|---|---|
| Novo projeto Supabase exclusivo (Postgres, Auth, RLS, Edge Functions) | Enviar empresas e reuniões ao CRM por API |
| Tabelas próprias: parceiros, usuários, empresas, listas, atribuições, reuniões, indicações, contratos vinculados, comissões, pagamentos, auditoria | Receber do CRM confirmações de contrato e de início das gravações |
| Contratos e início das gravações **registrados pela administração** dentro desta plataforma | Migração de dados por API para unificar os sistemas |
| Identificadores estáveis, validação de CNPJ, controle de duplicidade, histórico de eventos | Leitura do cadastro de estabelecimentos do CRM |
| Estrutura preparada para sincronização (referências externas, eventos com idempotência) | Qualquer credencial, rede ou chamada entre os dois projetos |

## 2. Projeto Supabase

- Projeto novo, organização OperumData, nome sugerido `operumdata-comercial`. A criação do projeto é feita pela OperumData (ou com sua autorização). Ambientes separados de homologação e produção, ou ao menos banco de homologação com dados fictícios.
- Auth: **cadastro público desabilitado**; contas criadas por convite após aprovação (Edge Function com `service_role` só no servidor). Senha ≥ 12, recuperação por e-mail, SMTP transacional, Site URL e Redirect URLs com `https://comercial.operumdata.com/` (e a URL da prévia em homologação).
- Todas as tabelas com RLS; `anon` e `public` sem privilégios em tabelas; escrita externa só por Edge Functions.
- Segredos: chave pública (anon/publishable) no frontend; `service_role` e senhas só em secrets do Supabase. Nada no Git.
- Migrations versionadas em `supabase/migrations/` neste repositório, aplicadas só com aprovação.

## 3. Modelo de dados (a implementar)

Convenções:
- **Identificadores estáveis:** `id uuid` (gerado no banco, nunca reutilizado) em todas as tabelas; códigos legíveis opcionais (ex.: `PAR-000123`) só para exibição.
- **Referências externas:** colunas `external_ref jsonb` ou tabela `external_refs(entity, entity_id, system, external_id)` para guardar IDs de outros sistemas (CRM) **no futuro**. Hoje ficam vazias.
- Valores monetários em **centavos inteiros**; datas `timestamptz` em UTC.
- `created_at`, `updated_at`, `created_by`, `updated_by` em tudo; exclusão lógica (`archived_at`) onde houver histórico.
- Enums como `text` com `check` (ou tipos `enum`), com códigos estáveis em inglês ou português sem acento, nunca o texto de exibição.

| Tabela | Conteúdo | Regras principais |
|---|---|---|
| `users_profile` | Perfil de cada usuário de `auth.users` | `role in ('admin','finance','affiliate','remote_prospector')` (um usuário pode ter mais de um vínculo via `partners`); `active`. |
| `partner_applications` | Candidaturas públicas | `kind in ('affiliate','remote_prospector')`, dados do formulário, `origin jsonb` (UTM), `status in ('em_analise','aprovado','recusado')`, decisão com motivo. Inserção só pela função pública. |
| `partners` | Parceiros aprovados | `user_id`, `application_id`, `kind`, `status in ('ativo','suspenso','encerrado')`, `terms_version`, `terms_accepted_at`. Dados de recebimento (CPF/CNPJ, Pix) em tabela separada `partner_payout_details`, só na fase de pagamento, com acesso restrito a `finance`/`admin`. |
| `companies` | Cadastro de empresas **desta plataforma** | `cnpj` (14 dígitos, **dígitos verificadores validados** no servidor; único quando presente), razão social, nome fantasia, cidade, UF, setor, site/domínio normalizado, telefone normalizado, `status`. Chaves de duplicidade: CNPJ, domínio, telefone, nome normalizado + cidade. |
| `company_contacts` | Contatos autorizados | nome, cargo, telefone, e-mail, `authorized_by` (quem declarou a autorização), `authorized_at`. |
| `referrals` | Indicações de afiliados | `partner_id`, `company_id`, `contact_id`, `intended_mode in ('indicacao','apresentacao','prospeccao')`, `validated_mode`, `duplicate_status`, `status`. |
| `lead_lists` | Listas comerciais oferecidas | `partner_id`, `status in ('oferecida','aceita','recusada','expirada')`, `offered_at`, `expires_at`, `responded_at`. |
| `assignments` | Empresa atribuída a um prospector | `list_id`, `partner_id`, `company_id`, `status in ('oferecida','aceita','recusada','devolvida','transferida','expirada','convertida')`. **Índice único parcial** em `company_id` onde `status in ('oferecida','aceita')`. |
| `contact_logs` | Resultados de contato | `assignment_id`, `result`, `notes`, `next_action`, `next_action_at`. |
| `meetings` | Reuniões | `company_id`, `assignment_id` ou `referral_id`, `starts_at`, formato, contato, `status in ('agendada','confirmada','realizada','ausencia','cancelada','remarcada')`, `owner_internal`. |
| `deals` | Contratos vinculados | `company_id`, origem (`referral_id`/`assignment_id`), `signed_on`, `signature_confirmed`, `recording_started_on`, `recording_confirmed`, `confirmed_by`. **Registrados pela administração** agora; no futuro podem vir do CRM. |
| `attributions` | Atribuição validada | `deal_id` (único), `partner_id`, `mode` (afiliado: modalidade validada; prospector: `prospeccao_remota`), `validated_by`, `validated_at`. Uma comissão por empresa/contrato. |
| `commission_items` | Parcelas | `attribution_id`, `seq`, `amount_cents`, `trigger in ('contrato_assinado','inicio_gravacoes')`, `status in ('prevista','liberada','paga','cancelada')`, motivo de cancelamento. Geradas só no servidor. |
| `payments` | Pagamentos | `partner_id`, itens pagos, `total_cents`, `paid_on`, `method`, `reference`, `registered_by`. Sem integração bancária. |
| `events` | Histórico de eventos de domínio | `id`, `entity`, `entity_id`, `type` (ex.: `company.created`, `meeting.scheduled`, `deal.signed`, `deal.recording_started`, `commission.released`), `payload jsonb`, `occurred_at`, `actor_id`. Somente inserção. Base para auditoria funcional e sincronização futura. |
| `audit_log` | Auditoria técnica | ator, tabela, id, ação, antes/depois, data. Trigger em todas as tabelas de negócio. Somente leitura para `admin`. |

## 4. Regras de segurança (RLS)

| Papel | Acesso |
|---|---|
| Visitante | Só a Edge Function `partner-apply`. |
| Afiliado | Lê/cria as próprias indicações; lê empresas/contatos ligados às próprias indicações; lê as próprias comissões e pagamentos. |
| Prospector remoto | Lê/responde as próprias listas; lê empresas e contatos **das atribuições aceitas por ele** (campos autorizados); cria `contact_logs` e `meetings` nessas atribuições; lê as próprias comissões. |
| `admin` | Gestão de candidaturas, parceiros, empresas, listas, atribuições, reuniões, contratos, atribuições validadas, parcelas. |
| `finance` | Dados de recebimento, liberação/registro de pagamentos. |

Parceiros nunca alteram status, modalidade validada, valores ou parcelas. Funções `security definer` com `search_path=''` e privilégios mínimos.

## 5. Duplicidade e CNPJ

- CNPJ: normalizar para 14 dígitos e validar dígitos verificadores no servidor (o frontend pode validar também). CNPJ não é obrigatório na indicação, mas se informado precisa ser válido.
- Ao criar empresa ou indicação, buscar coincidências por CNPJ, domínio, telefone e nome+cidade. Coincidência → `duplicate_status = 'possivel'` e decisão administrativa; a resposta ao parceiro **nunca** revela quem é o outro parceiro.
- Critério de quem fica com a empresa em caso de conflito: pendente (REGRAS P2/P3).

## 6. Sincronização futura com o CRM (não implementar agora)

Documentado apenas para que o modelo não impeça a integração depois.

- **Direção plataforma → CRM (futuro):** enviar empresas e reuniões validadas. Mecanismo previsto: tabela `outbox` alimentada a partir de `events`, processada por uma Edge Function que chama uma API do CRM, com chave de idempotência (`event.id`), reenvio com backoff e registro do resultado. Guardar o ID retornado em `external_refs`.
- **Direção CRM → plataforma (futuro):** receber confirmação de contrato assinado e de início das gravações via webhook assinado (HMAC com segredo compartilhado guardado só em secrets), validando idempotência e origem. O evento atualiza `deals` e gera os efeitos normais (liberação de parcelas) pelo mesmo código usado no registro manual.
- **Migração/unificação (futuro):** exportação por API usando os UUIDs estáveis, `external_refs` e o histórico de `events`, sem perder auditoria.
- O CRM hoje não expõe API para isso e suas regras de Auth/RLS não foram pensadas para usuários externos. Qualquer integração exige projeto e aprovação próprios, nos dois repositórios.

## 7. Testes obrigatórios

- Parceiro A não lê nem altera dados do parceiro B (todas as tabelas).
- Parceiro não altera status, valores, modalidade validada ou parcelas.
- Empresa não fica com duas atribuições ativas.
- CNPJ inválido rejeitado; duplicidade detectada sem vazar dados.
- Função pública rejeita payload inválido, campos extras e excesso de requisições.
- Parcelas corretas por modalidade (ver [FLUXOS-E-DADOS §10](FLUXOS-E-DADOS.md)).
- Nenhuma chave secreta no frontend ou no repositório.
