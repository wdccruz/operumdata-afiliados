# Primeiro administrador — sem senha fixa

Somente no projeto `operumdata-comercial` (`owpkzqobxzsutsbhjrfp`), por um responsável já autenticado no Dashboard Supabase. Não executar no CRM. Nenhuma senha ou service_role precisa ser copiada para o repositório ou para o frontend.

1. Confirmar o e-mail real autorizado a administrar a plataforma. Não usar identidades fictícias `.test` para criar credenciais reais.
2. No SQL Editor desse projeto, executar a transação abaixo substituindo e-mail/nome pelos do responsável. Ela só prepara uma autorização de convite por 24 horas e recusa execução se já houver administrador ativo:

```sql
begin;
set local operum.bootstrap_email = 'SUBSTITUIR_PELO_EMAIL_AUTORIZADO';
set local operum.bootstrap_name = 'SUBSTITUIR_PELO_NOME';
do $$
declare email text := lower(current_setting('operum.bootstrap_email'));
begin
  if exists(select 1 from public.users_profile where role='admin' and active) then
    raise exception 'Administrador já existe; use o fluxo administrativo de convites';
  end if;
  if email !~ '^[^@ ]+@[^@ ]+\.[^@ ]+$' or email like '%.test' then
    raise exception 'Informe o e-mail real autorizado';
  end if;
  insert into commercial_private.staff_invites(email,name,role,expires_at)
  values(email,current_setting('operum.bootstrap_name'),'admin',now()+interval '24 hours')
  on conflict(email) do update set role='admin',expires_at=excluded.expires_at;
end $$;
commit;
```

3. Authentication → Users → Invite user: convidar **o mesmo e-mail**, com redirect `http://localhost:3200/painel/acesso.html` durante os testes locais. Não usar criação com senha definida pela equipe. Se o serviço padrão não enviar ao destinatário, configurar SMTP autorizado antes de prosseguir.
4. A criação Auth consome a autorização de `staff_invites` e cria o perfil administrativo auditado. Se o convite falhar antes de criar a conta, a autorização expira em 24 horas. Não desabilitar confirmação de e-mail para contornar falhas.
5. O responsável abre seu link pessoal, define a própria senha de pelo menos 8 caracteres e entra em http://localhost:3200/painel/. Nunca enviar o link de convite ou a senha ao GitHub.
6. Verificar `users_profile.role='admin'` e executar a homologação das telas com esse acesso. Para novas contas internas, usar a tela **Equipe e acessos → Convidar equipe**, que chama o endpoint autenticado `staff-invite`. Parceiros têm seu fluxo separado de aprovação/convite.

Para aprovar candidatura real em versão futura: decisão administrativa → Auth invite → bind_invitation → parceiro `convidado` → aceite de versão jurídica aprovada → `ativo`. Na homologação atual, candidaturas `.test` podem ser aprovadas no banco, mas não geram contas Auth reais. O status de convite permanece pendente, explicitamente indicado pela API.
