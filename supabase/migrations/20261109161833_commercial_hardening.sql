create index staff_invites_invited_by_idx on commercial_private.staff_invites(invited_by);

-- Preserve policy semantics, evaluating one SELECT policy per table.
do $$ declare t record; r record; predicate text;
begin
 for t in select distinct tablename from pg_policies where schemaname='public' and cmd='SELECT' loop
   select string_agg('('||qual||')',' OR ') into predicate from pg_policies where schemaname='public' and tablename=t.tablename and cmd='SELECT';
   for r in select policyname from pg_policies where schemaname='public' and tablename=t.tablename and cmd='SELECT' loop
     execute format('drop policy %I on public.%I',r.policyname,t.tablename);
   end loop;
   execute format('create policy authorized_read on public.%I for select to authenticated using (%s)',t.tablename,predicate);
 end loop;
end $$;

alter function commercial_private.command(text,jsonb) rename to command_impl;
revoke all on function commercial_private.command_impl(text,jsonb) from public,anon,authenticated;
create function commercial_private.command(action text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
 if action='referral_validate' then
   if coalesce(p->>'status','') not in ('validada','recusada') then raise exception 'Decisão inválida'; end if;
   if p->>'status'='validada' and coalesce(p->>'mode','') not in ('indicacao','apresentacao','prospeccao') then raise exception 'Modalidade validada obrigatória'; end if;
 end if;
 if action='contact_log' and p->>'result'='reuniao_agendada' then
   if p->>'starts_at' is null or (p->>'starts_at')::timestamptz<=now() then raise exception 'Reunião deve ser futura'; end if;
 end if;
 if action='meeting_status' and p->>'status'='remarcada' then
   if p->>'starts_at' is null or (p->>'starts_at')::timestamptz<=now() then raise exception 'Informe a nova data futura'; end if;
 end if;
 if action='setting_decide' and p->>'key'='P9_legal' and p->>'status'='approved' and nullif(trim(p->'value'->>'terms_version'),'') is null then raise exception 'Versão jurídica aprovada obrigatória'; end if;
 return commercial_private.command_impl(action,p);
end $$;
revoke all on function commercial_private.command(text,jsonb) from public,anon;
grant execute on function commercial_private.command(text,jsonb) to authenticated;
create or replace function public.commercial_command(action text,p jsonb) returns jsonb language sql security invoker set search_path='' as $$ select commercial_private.command(action,p); $$;
