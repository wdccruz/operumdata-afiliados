# Contratos da API comercial

Ambiente atual: desenvolvimento, projeto `owpkzqobxzsutsbhjrfp`. Endpoint autenticado: `/functions/v1/commercial-api`, método POST, `Content-Type: application/json`, `apikey` publicável e `Authorization: Bearer <access_token do usuário>`. Nunca enviar service_role pelo navegador. Exemplo de cliente real em `public/painel/client.js`.

Leitura: `{action:'read',table,offset:0,limit:50}`. Escrita: `{action,params:{...}}`. Indicadores: `{action:'overview'}`. Na escrita, conferir `saved:true` ou resultado idempotente confirmado; qualquer erro interrompe a transação. IDs são UUID; datas/hora devem incluir fuso ou UTC ISO; valores em centavos inteiros. A leitura é sempre paginada e filtrada por RLS.

| Ação | Parâmetros principais | Quem executa |
|---|---|---|
| application_decide | id da candidatura, status (aprovado/recusado/informacao_pendente), reason | Admin; preferir manage-partners para aprovação com convite |
| partner_status | id do parceiro, status (ativo/suspenso/encerrado), reason | Admin |
| accept_terms | id do próprio parceiro, version | Próprio parceiro convidado; P9 aprovado e versão correspondente |
| setting_decide | key, status (pending/approved), value (objeto), reason | Admin; versão jurídica em value.terms_version |
| staff_invite_prepare | name, email, role (admin/finance) | Admin; preferir staff-invite para concluir o envio |
| company_create | company {legal_name,trade_name?,cnpj?,city,uf,sector,domain?,phone?}, contact opcional | Admin |
| referral_create | partner_id próprio, intended_mode (indicacao/apresentacao/prospeccao), company, contact {name,position?,phone,email?,authorized:true} | Afiliado ativo |
| referral_validate | id da indicação, status (validada/recusada), mode se validada, company_id opcional, reason | Admin; conflitos dependem de P2/P3 |
| list_offer | partner_id, name, company_ids[], expires_at opcional, notes opcional | Admin; empresas sem atribuição ativa, prazo depende de P6 |
| list_respond | id da lista, status (aceita/recusada) | Próprio prospector ativo |
| assignment_return | id da atribuição, reason opcional | Próprio prospector ativo, atribuição aceita |
| assignment_transfer | id da atribuição, partner_id novo, reason | Admin; nova oferta ao destinatário |
| list_expire | id da lista, reason | Admin; P6 aprovado |
| contact_log | assignment_id, result, notes?, next_action?, next_action_at?; starts_at/format se reunião | Próprio prospector; retorno/interessado exigem next_action_at |
| meeting_schedule | assignment_id ou referral_id, starts_at futuro, format (video/telefone/presencial), notes? | Parceiro da origem válida |
| meeting_status | id da reunião, status, starts_at se remarcada | Admin |
| deal_sign | referral_id ou assignment_id, signed_on, signature_confirmed:true, document_reference, reason | Admin; origem/participação validadas, gera parcelas na transação |
| recording_confirm | id do contrato, confirmed:true, started_on | Admin; confirmação explícita do início real |
| commission_cancel | id da parcela, reason | Admin/finance; P5 aprovado, nunca parcela paga |
| payment_register | partner_id, item_ids[], expected_total_cents, paid_on, method, reference, idempotency_key UUID estável por tentativa | Admin/finance; P4 aprovado; um parceiro, parcelas liberadas |
| payout_update | partner_id, details objeto restrito | Admin/finance; P4 aprovado |

`contact_log.result`: nao_atendeu, numero_invalido, retornar, sem_interesse, interessado, reuniao_agendada. A condição financeira não muda por contato ou reunião.

`manage-partners`: `{application_id,decision?,reason?}`. JWT de administrador. Retorna se houve gravação e convite: `saved`, `invited`, `partner_id` quando houver, ou `invitation_pending`. Para `.test`, não cria conta Auth real. Em erro de convite a aprovação pode já estar persistida; ler a candidatura e repetir o convite de forma segura. Reconciliação de Auth/perfil implementada para falhas entre serviços.

`staff-invite`: `{name,email,role}`. JWT de administrador. Prepara autorização de 24 horas e solicita convite ao Auth. `invited:true` significa que Auth aceitou o envio, não comprovação de recebimento na caixa postal.

`partner-apply`: envio público sem senha. Corpo aceito: `kind`, `name`, `email`, `whatsapp`, `city`, `uf`, `details`, `origin?`, `privacy_version`, `conditions_version`, `consent:true`, `elapsed_ms` (tempo decorrido no formulário), `website?` (honeypot vazio). Campos extras são rejeitados. Esquema exato de details em `supabase/functions/_shared/validation.mjs`.

Neste ambiente o e-mail deve terminar em `.test`. Resposta aceita: `{received:true,id:<recibo>,status:'recebida_para_analise'}`. Cada resposta corresponde a um recibo efetivamente gravado; uma candidatura existente não é duplicada e o cliente recebe o mesmo formato, sem enumeração de e-mails. O recibo público não é o UUID interno da candidatura. HTTP 429 não grava uma candidatura e exige aguardar a janela; 400 indica validação; 401/403 indicam ausência de sessão/permissão ou origem inválida. Nunca mostrar mensagem de gravação em resposta a esses erros.

Supabase Auth é consumido pelo SDK oficial: signInWithPassword, signOut, resetPasswordForEmail e updateUser para definição/recuperação de senha. Acesso só por convite. Origens e redirects remotos serão adicionados durante a homologação autorizada; nenhuma publicação está incluída nesta branch.
