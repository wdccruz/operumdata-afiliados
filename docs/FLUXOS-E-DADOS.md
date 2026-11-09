# Fluxos e dados

Cada fluxo indica o estado atual: **[real]** funciona hoje com efeito real; **[demo]** existe só como demonstração com dados fictícios; **[não implementado]** apenas especificado. Hoje **nenhum** fluxo grava dados reais. Tabelas citadas estão propostas em [INTEGRACAO-SUPABASE.md §3](INTEGRACAO-SUPABASE.md), num **banco independente** (novo projeto Supabase). Nenhum fluxo depende do CRM; a integração com o CRM é só possibilidade futura. Regras de valores: [REGRAS-COMERCIAIS.md](REGRAS-COMERCIAIS.md).

## 1. Cadastro de parceiros

Estado: formulários e validação **[real no navegador]**; envio e gravação **[não implementado]** (a tela mostra "Envio ainda não disponível").

**Prospector remoto** (`/`):

| Campo | Tipo / valores | Obrigatório | Validação atual |
|---|---|---|---|
| nome | texto | sim | nome e sobrenome |
| whatsapp | só dígitos, 10–11 | sim | máscara (00) 00000-0000 |
| email | e-mail | sim | formato |
| cidade, uf | texto, UF | sim | preenchido |
| experiencia_principal | `telemarketing_ativo, televendas, vendas_b2b, agendamento_reunioes, outra` | sim | escolhido |
| tempo_experiencia | `menos_1, 1_3, 3_5, mais_5` | sim | escolhido |
| disponibilidade | `eventual, alguns_dias, maioria_dias` | **não** (informativo, nunca exigido) | — |
| possui_equipamento | `sim, nao` | sim | escolhido |
| aceite_privacidade_condicoes | booleano + versão + data | sim | marcado |
| origem | UTM de `sessionStorage['od.origem']` | não | só chaves permitidas |

**Afiliado** (`/afiliados`): nome, e-mail, WhatsApp, cidade, UF, perfil profissional, setores (múltiplos), senha (≥12, ver decisão em ARQUITETURA §3), aceite dos termos, aceite do aviso de privacidade, origem.

Nunca: CPF, RG, data de nascimento, banco, Pix.

Fluxo planejado: navegador → Edge Function `partner-apply` (valida o mesmo esquema no servidor, limite de taxa, e-mail normalizado) → `partner_applications(status='em_analise')` → resposta `{ id, status }`. Só então a tela pode dizer "Recebemos sua candidatura". Duplicado por e-mail: responder de forma neutra, sem revelar se já existe cadastro.

## 2. Aprovação e suspensão [não implementado]

```
em_analise ──aprovar──► aprovado ──convite aceito + termos──► partners.status = ativo
     │                                                          │  ▲
     └─recusar (motivo)─► recusado                    suspender │  │ reativar (motivo)
                                                                ▼  │
                                                              suspenso ──encerrar──► encerrado
```

Campos: `decided_by`, `decided_at`, `decision_reason` (obrigatório em recusa/suspensão), `terms_version`, `accepted_at`. Suspensão bloqueia novas ações; não apaga histórico nem comissões já liberadas (regra de pagamento a suspensos: pendente P4/P5). Critérios de aprovação: pendente P8.

## 3. Distribuição e aceite de listas comerciais [não implementado]

1. Admin cadastra ou importa empresas em `companies` (desta plataforma) e monta uma lista com empresas sem atribuição ativa.
2. `lead_lists(status='oferecida', expires_at)` + `assignments(status='oferecida')` para cada empresa (reserva a empresa).
3. Prospector vê quantidade, setores e cidades da lista e **aceita ou recusa** (sem justificativa obrigatória).
4. Aceite → assignments `aceita`; recusa ou expiração → `recusada`/`expirada`, empresas liberadas.

Campos de `lead_lists`: `id, partner_id, offered_by, offered_at, expires_at, status, responded_at, notes`. Prazo de expiração: pendente P6.

## 4. Atribuição de empresas aos prospectores [não implementado]

- Uma empresa só pode ter **uma** atribuição em `oferecida` ou `aceita` (índice único parcial).
- Parceiro pode **devolver** uma empresa a qualquer momento (`devolvida`).
- Admin pode **transferir** com motivo (`transferida` + nova atribuição) ou recolher após expiração.
- O parceiro vê só: nome fantasia/razão social, cidade/UF, setor, contato autorizado (nome, cargo, telefone, e-mail), orientação de abordagem. Nunca notas internas ou dados de outros parceiros.

Campos de `assignments`: `id, list_id, partner_id, company_id, status, assigned_at, reserved_until, released_at, release_reason`.

## 5. Registro dos resultados de contato [não implementado]

`contact_logs`: `id, assignment_id, result (nao_atendeu|numero_invalido|retornar|sem_interesse|interessado|reuniao_agendada), notes (≤500), next_action, next_action_at, created_at`.

- `next_action_at` obrigatório quando `retornar` ou `interessado`.
- `reuniao_agendada` abre o fluxo 6.
- Usado pelo parceiro para organizar retornos e pela OperumData para validar a origem. **Não** gera métricas de produtividade, horas ou ranking.

## 6. Agendamento de reuniões [não implementado]

`meetings`: `id, company_id, assignment_id | referral_id, partner_id, contact_id, starts_at, format (video|telefone|presencial), notes, status (agendada|confirmada|realizada|ausencia|cancelada|remarcada), internal_owner`.

A reunião é conduzida pela equipe OperumData; o parceiro não precisa participar. A equipe atualiza o status na área administrativa desta plataforma. Gera eventos `meeting.scheduled`, `meeting.held` etc.

## 7. Encaminhamento à equipe comercial [não implementado] · CRM [futuro]

**Agora:** reunião agendada (prospector) ou indicação validada (afiliado) aparece na fila da administração desta plataforma, com responsável interno. Antes de aceitar empresa nova, checar CNPJ (dígitos verificadores), domínio, telefone e nome+cidade contra `companies`; conflito vai para decisão administrativa (regra P2/P3).

**Futuro (não implementar):** enviar a empresa e a reunião ao CRM por API (outbox com idempotência) e guardar o ID retornado em `external_refs`. Ver [INTEGRACAO-SUPABASE.md §6](INTEGRACAO-SUPABASE.md).

## 8. Assinatura de contratos [não implementado]

**Agora:** a administração registra em `deals` o contrato da empresa (`signed_on`, `signature_confirmed = true`, referência do documento), vinculado à indicação ou atribuição de origem, e **valida a atribuição** (`attributions.validated_by/at`, modalidade final para afiliados). Só então a parcela correspondente sai de `prevista` para `liberada`. Evento `deal.signed`.

**Futuro:** a confirmação pode chegar do CRM por webhook assinado, usando o mesmo código.

## 9. Confirmação do início das gravações [não implementado]

**Agora:** a administração confirma explicitamente em `deals` (`recording_confirmed = true`, `recording_started_on`). Implantação ou contrato assinado não bastam. Afeta só a 2ª parcela da modalidade R$ 300. Evento `deal.recording_started`.

**Futuro:** pode vir do CRM por webhook assinado.

## 10. Geração, validação e liberação de comissões [não implementado]

| Modalidade validada | Parcelas geradas | Gatilho de liberação |
|---|---|---|
| Afiliado — Indique uma empresa | 1 × R$ 50 (5000) | contrato assinado + validação |
| Afiliado — Apresente a oportunidade | 1 × R$ 150 (15000) | contrato assinado + validação |
| Afiliado — Feche o negócio | 2 × R$ 150 (15000) | 1ª: contrato assinado + validação · 2ª: início efetivo das gravações |
| Prospecção remota | 1 × R$ 150 (15000) | contrato assinado + atribuição validada |

- Uma atribuição por empresa (não cumulativo). Geração e liberação só por função de servidor.
- Situações: `prevista → liberada → paga`; `prevista|liberada → cancelada` (motivo obrigatório; regra P5).
- Prazo de proteção para contrato posterior: pendente P1.

## 11. Histórico de pagamentos [não implementado]

`payments`: `id, partner_id, commission_item_ids[], total_cents, paid_on, method, reference, registered_by, created_at`. Registro manual pela administração, conferindo o total; parcelas vão para `paga`. Sem integração bancária. Dados de recebimento do parceiro (CPF/CNPJ, Pix, banco) coletados só nesta fase, com acesso restrito (regra P4).

## 12. Dados reais, demonstrativos e não implementados

| Tipo | Onde | Observação |
|---|---|---|
| Real | nenhum hoje | Nenhum cadastro, login, comissão ou pagamento real existe. |
| Demonstrativo | `public/prototipo.html` (+ `app.js`, `demo.js`) | Dados fictícios e modelo antigo de percentuais/níveis. **Obsoleto**, não usar como referência de regra. |
| Demonstrativo | backend `src/` + SQLite | Provisório, modelo obsoleto. |
| Não implementado | tudo das seções 1 (envio) a 11 | Especificado aqui e em `frontend-v2/`. |
