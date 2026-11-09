-- Commercial development project only. Never apply to the CRM.
create schema if not exists commercial_private;
revoke all on schema commercial_private from public, anon;
grant usage on schema commercial_private to authenticated, service_role;

create table public.users_profile (
 id uuid primary key references auth.users(id), name text not null,
 role text not null check(role in ('admin','finance','affiliate','remote_prospector')),
 active boolean not null default true
);
create table public.commercial_settings (
 id uuid primary key default gen_random_uuid(), key text not null unique,
 status text not null default 'pending' check(status in ('pending','approved')),
 value jsonb not null default '{}', reason text
);
insert into public.commercial_settings(key) values
 ('P1_protection'),('P2_duplicates'),('P3_existing_negotiation'),('P4_payments'),
 ('P5_cancellation'),('P6_list_expiry'),('P7_dual_kind'),('P8_approval'),('P9_legal');
create table public.partner_applications (
 id uuid primary key default gen_random_uuid(), kind text not null check(kind in ('affiliate','remote_prospector')),
 name text not null check(length(name) between 3 and 120), email text not null check(email=lower(email)),
 whatsapp text not null check(whatsapp ~ '^[0-9]{10,11}$'), city text not null, uf text not null check(uf ~ '^[A-Z]{2}$'),
 details jsonb not null, origin jsonb not null default '{}', privacy_version text not null, conditions_version text not null,
 accepted_at timestamptz not null default now(), status text not null default 'em_analise' check(status in ('em_analise','aprovado','recusado','informacao_pendente')),
 decided_by uuid references public.users_profile(id), decided_at timestamptz, decision_reason text,
 invitation_status text not null default 'pending' check(invitation_status in ('pending','sent','failed')),
 invited_user_id uuid references auth.users(id), unique(email,kind)
);
create table public.partners (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users_profile(id),
 application_id uuid not null unique references public.partner_applications(id),
 kind text not null check(kind in ('affiliate','remote_prospector')),
 status text not null default 'convidado' check(status in ('convidado','ativo','suspenso','encerrado')),
 terms_version text, terms_accepted_at timestamptz, status_reason text,
 unique(user_id,kind), check(status<>'ativo' or (terms_version is not null and terms_accepted_at is not null))
);
create table public.companies (
 id uuid primary key default gen_random_uuid(), cnpj text unique, legal_name text not null check(length(legal_name) between 2 and 180),
 trade_name text, city text not null, uf text not null check(uf ~ '^[A-Z]{2}$'), sector text not null,
 domain text, phone text, status text not null default 'nova', external_ref jsonb not null default '{}'
);
create index companies_domain_idx on public.companies(domain) where domain is not null;
create index companies_phone_idx on public.companies(phone) where phone is not null;
create index companies_name_city_idx on public.companies(lower(legal_name),lower(city));
create table public.company_contacts (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id),
 name text not null, position text, phone text, email text,
 authorized_by uuid not null references public.users_profile(id), authorized_at timestamptz not null default now()
);
create table public.company_internal (
 id uuid primary key default gen_random_uuid(), company_id uuid not null unique references public.companies(id), notes text
);
create table public.referrals (
 id uuid primary key default gen_random_uuid(), partner_id uuid not null references public.partners(id),
 company_id uuid references public.companies(id), contact_id uuid references public.company_contacts(id),
 proposed_company jsonb not null, proposed_contact jsonb not null,
 intended_mode text not null check(intended_mode in ('indicacao','apresentacao','prospeccao')),
 validated_mode text check(validated_mode in ('indicacao','apresentacao','prospeccao')),
 duplicate_status text not null check(duplicate_status in ('sem_indicio','possivel','resolvida')),
 status text not null default 'em_analise' check(status in ('em_analise','validada','recusada')),
 decision_reason text, internal_owner uuid references public.users_profile(id)
);
create table public.lead_lists (
 id uuid primary key default gen_random_uuid(), partner_id uuid not null references public.partners(id), name text not null,
 status text not null default 'oferecida' check(status in ('oferecida','aceita','recusada','expirada')),
 offered_by uuid not null references public.users_profile(id), offered_at timestamptz not null default now(),
 expires_at timestamptz, responded_at timestamptz, notes text,
 summary jsonb not null default '{}'
);
create table public.assignments (
 id uuid primary key default gen_random_uuid(), list_id uuid not null references public.lead_lists(id),
 partner_id uuid not null references public.partners(id), company_id uuid not null references public.companies(id),
 status text not null default 'oferecida' check(status in ('oferecida','aceita','recusada','devolvida','transferida','expirada','convertida')),
 assigned_at timestamptz not null default now(), reserved_until timestamptz, released_at timestamptz, release_reason text
);
create unique index assignments_one_active_company on public.assignments(company_id) where status in ('oferecida','aceita');
create table public.contact_logs (
 id uuid primary key default gen_random_uuid(), assignment_id uuid not null references public.assignments(id),
 result text not null check(result in ('nao_atendeu','numero_invalido','retornar','sem_interesse','interessado','reuniao_agendada')),
 notes text check(length(notes)<=500), next_action text, next_action_at timestamptz,
 check(result not in ('retornar','interessado') or next_action_at is not null)
);
create table public.meetings (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id),
 assignment_id uuid references public.assignments(id), referral_id uuid references public.referrals(id),
 partner_id uuid not null references public.partners(id), contact_id uuid references public.company_contacts(id),
 starts_at timestamptz not null, format text not null check(format in ('video','telefone','presencial')),
 notes text check(length(notes)<=500), status text not null default 'agendada' check(status in ('agendada','confirmada','realizada','ausencia','cancelada','remarcada')),
 owner_internal uuid references public.users_profile(id), check(num_nonnulls(assignment_id,referral_id)=1)
);
create table public.deals (
 id uuid primary key default gen_random_uuid(), company_id uuid not null unique references public.companies(id),
 referral_id uuid references public.referrals(id), assignment_id uuid references public.assignments(id),
 signed_on date not null, signature_confirmed boolean not null check(signature_confirmed), document_reference text not null,
 recording_started_on date, recording_confirmed boolean not null default false,
 confirmed_by uuid not null references public.users_profile(id), external_ref jsonb not null default '{}',
 check(num_nonnulls(referral_id,assignment_id)=1),
 check(not recording_confirmed or recording_started_on is not null)
);
create table public.attributions (
 id uuid primary key default gen_random_uuid(), deal_id uuid not null unique references public.deals(id),
 company_id uuid not null unique references public.companies(id), partner_id uuid not null references public.partners(id),
 mode text not null check(mode in ('indicacao','apresentacao','prospeccao','prospeccao_remota')),
 validated_by uuid not null references public.users_profile(id), validated_at timestamptz not null default now(), reason text not null
);
create table public.commission_items (
 id uuid primary key default gen_random_uuid(), attribution_id uuid not null references public.attributions(id),
 partner_id uuid not null references public.partners(id), seq integer not null check(seq in (1,2)),
 amount_cents integer not null check(amount_cents in (5000,15000)),
 trigger text not null check(trigger in ('contrato_assinado','inicio_gravacoes')),
 status text not null check(status in ('prevista','liberada','paga','cancelada')),
 released_at timestamptz, cancel_reason text, unique(attribution_id,seq),
 check(status<>'cancelada' or length(trim(cancel_reason))>0)
);
create table public.payments (
 id uuid primary key default gen_random_uuid(), partner_id uuid not null references public.partners(id),
 total_cents integer not null check(total_cents>0), paid_on date not null,
 method text not null, reference text not null, registered_by uuid not null references public.users_profile(id),
 idempotency_key uuid not null unique
);
create table public.payment_items (
 id uuid primary key default gen_random_uuid(), payment_id uuid not null references public.payments(id),
 commission_item_id uuid not null unique references public.commission_items(id)
);
create table public.partner_payout_details (
 id uuid primary key default gen_random_uuid(), partner_id uuid not null unique references public.partners(id),
 details jsonb not null
);
create table public.external_refs (
 id uuid primary key default gen_random_uuid(), entity text not null, entity_id uuid not null,
 system text not null, external_id text not null, unique(entity,entity_id,system),unique(system,entity,external_id)
);
create table public.events (
 id uuid primary key default gen_random_uuid(), entity text not null, entity_id uuid not null,
 type text not null, payload jsonb not null default '{}', occurred_at timestamptz not null default now(), actor_id uuid
);
create table public.audit_log (
 id uuid primary key default gen_random_uuid(), actor_id uuid, table_name text not null, record_id uuid not null,
 action text not null, before_data jsonb, after_data jsonb, occurred_at timestamptz not null default now()
);
create table commercial_private.rate_buckets (
 id text primary key, window_start timestamptz not null, count integer not null
);
alter table commercial_private.rate_buckets enable row level security;
create table commercial_private.staff_invites (
 email text primary key check(email=lower(email)), name text not null,
 role text not null check(role in ('admin','finance')), expires_at timestamptz not null,
 invited_by uuid references public.users_profile(id)
);
alter table commercial_private.staff_invites enable row level security;

-- Authorizations are read live from the database, never from user_metadata.
create function commercial_private.staff(roles text[] default array['admin']) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.users_profile p where p.id=(select auth.uid()) and p.active and p.role=any(roles));
$$;
create function commercial_private.owns_partner(pid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.partners p join public.users_profile u on u.id=p.user_id
 where p.id=pid and u.id=(select auth.uid()) and u.active);
$$;
create function commercial_private.can_company(cid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select commercial_private.staff() or exists(select 1 from public.referrals r where r.company_id=cid and commercial_private.owns_partner(r.partner_id))
 or exists(select 1 from public.assignments a where a.company_id=cid and a.status in ('aceita','convertida') and commercial_private.owns_partner(a.partner_id));
$$;
create function commercial_private.active_partner(pid uuid, k text default null) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.partners p join public.users_profile u on u.id=p.user_id
 where p.id=pid and u.id=(select auth.uid()) and u.active and p.status='ativo' and (k is null or p.kind=k));
$$;
create function commercial_private.require_staff(roles text[] default array['admin']) returns void
language plpgsql stable security invoker set search_path='' as $$ begin
 if auth.uid() is null or not commercial_private.staff(roles) then raise exception 'Acesso não autorizado' using errcode='42501'; end if;
end $$;
create function commercial_private.require_policy(k text) returns void
language plpgsql stable security invoker set search_path='' as $$ begin
 if not exists(select 1 from public.commercial_settings s where s.key=k and s.status='approved') then
 raise exception 'Decisão comercial ou jurídica pendente: %',k; end if;
end $$;

create function commercial_private.valid_cnpj(v text) returns boolean
language plpgsql immutable set search_path='' as $$
declare i int; len int; total int; weight int; digit int;
begin
 if v is null then return true; end if;
 if v !~ '^[0-9]{14}$' or v ~ '^([0-9])\1{13}$' then return false; end if;
 for len in 12..13 loop total:=0; weight:=len-7;
 for i in 1..len loop total:=total+substring(v,i,1)::int*weight; weight:=weight-1; if weight<2 then weight:=9; end if; end loop;
 digit:=case when total%11<2 then 0 else 11-total%11 end;
 if substring(v,len+1,1)::int<>digit then return false; end if; end loop; return true;
end $$;
alter table public.companies add constraint valid_cnpj check(commercial_private.valid_cnpj(cnpj));
create function commercial_private.domain(v text) returns text language plpgsql immutable set search_path='' as $$
declare d text;
begin
 if nullif(trim(v),'') is null then return null; end if;
 d:=lower(regexp_replace(regexp_replace(trim(v),'^https?://','','i'),'/.*$',''));
 d:=regexp_replace(d,'^www\.','');
 if d !~ '^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$' then raise exception 'Domínio inválido'; end if;
 return d;
end $$;
create function commercial_private.company_normalize() returns trigger language plpgsql set search_path='' as $$ begin
 new.cnpj:=nullif(regexp_replace(coalesce(new.cnpj,''),'[./-]','','g'),'');
 new.domain:=commercial_private.domain(new.domain);
 new.phone:=nullif(regexp_replace(coalesce(new.phone,''),'[^0-9]','','g'),''); return new;
end $$;
create trigger company_normalize before insert or update on public.companies for each row execute function commercial_private.company_normalize();

-- Every mutable business record has a uniform history envelope.
do $$ declare t text; begin
 for t in select tablename from pg_tables where schemaname='public' and tablename not in ('audit_log','events') loop
 execute format('alter table public.%I add column created_at timestamptz not null default now(), add column updated_at timestamptz not null default now(), add column created_by uuid, add column updated_by uuid, add column archived_at timestamptz',t);
 end loop;
end $$;
create function commercial_private.stamp() returns trigger language plpgsql set search_path='' as $$ begin
 if tg_op='INSERT' then new.created_by:=auth.uid(); end if;
 new.updated_by:=auth.uid(); new.updated_at:=now(); return new;
end $$;
create function commercial_private.audit() returns trigger language plpgsql security definer set search_path='' as $$
declare b jsonb; a jsonb; rid uuid;
begin
 b:=case when tg_op='INSERT' then null else to_jsonb(old) end;
 a:=case when tg_op='DELETE' then null else to_jsonb(new) end;
 rid:=coalesce((a->>'id')::uuid,(b->>'id')::uuid);
 if tg_table_name='partner_payout_details' then b:=b-'details'; a:=a-'details'; end if;
 insert into public.audit_log(actor_id,table_name,record_id,action,before_data,after_data) values(auth.uid(),tg_table_name,rid,tg_op,b,a);
 return coalesce(new,old);
end $$;
create function commercial_private.immutable_history() returns trigger language plpgsql set search_path='' as $$ begin
 raise exception 'Histórico imutável'; end $$;
create trigger immutable_events before update or delete on public.events for each row execute function commercial_private.immutable_history();
create trigger immutable_audit before update or delete on public.audit_log for each row execute function commercial_private.immutable_history();
do $$ declare t text; begin
 for t in select tablename from pg_tables where schemaname='public' and tablename not in ('audit_log','events') loop
 execute format('create trigger stamp before insert or update on public.%I for each row execute function commercial_private.stamp()',t);
 execute format('create trigger audit after insert or update or delete on public.%I for each row execute function commercial_private.audit()',t);
 end loop;
end $$;

-- Read-only Data API; all writes go through validated commands.
do $$ declare t text; begin
 for t in select tablename from pg_tables where schemaname='public' loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy staff_read on public.%I for select to authenticated using (commercial_private.staff())',t);
 end loop;
end $$;
create policy own_profile on public.users_profile for select to authenticated using(id=(select auth.uid()) and active);
create policy own_partner on public.partners for select to authenticated using(commercial_private.owns_partner(id));
create policy company_access on public.companies for select to authenticated using(commercial_private.can_company(id));
create policy contact_access on public.company_contacts for select to authenticated using(commercial_private.can_company(company_id));
create policy referral_access on public.referrals for select to authenticated using(commercial_private.owns_partner(partner_id));
create policy list_access on public.lead_lists for select to authenticated using(commercial_private.owns_partner(partner_id));
create policy assignment_access on public.assignments for select to authenticated using(commercial_private.owns_partner(partner_id) and status<>'oferecida');
create policy log_access on public.contact_logs for select to authenticated using(exists(select 1 from public.assignments a where a.id=assignment_id and commercial_private.owns_partner(a.partner_id)));
create policy meeting_access on public.meetings for select to authenticated using(commercial_private.owns_partner(partner_id));
create policy deal_access on public.deals for select to authenticated using(exists(select 1 from public.attributions a where a.deal_id=deals.id and commercial_private.owns_partner(a.partner_id)));
create policy attribution_access on public.attributions for select to authenticated using(commercial_private.owns_partner(partner_id));
create policy commission_access on public.commission_items for select to authenticated using(commercial_private.owns_partner(partner_id) or commercial_private.staff(array['finance']));
create policy payment_access on public.payments for select to authenticated using(commercial_private.owns_partner(partner_id) or commercial_private.staff(array['finance']));
create policy payment_item_access on public.payment_items for select to authenticated using(exists(select 1 from public.payments p where p.id=payment_id));
create policy finance_payout on public.partner_payout_details for select to authenticated using(commercial_private.staff(array['finance']));
create policy finance_partner on public.partners for select to authenticated using(commercial_private.staff(array['finance']));

-- Index every foreign key used by RLS, joins, or history lookups.
do $$ declare r record; begin
 for r in select cl.relname t, att.attname c from pg_constraint co join pg_class cl on cl.oid=co.conrelid
 join pg_namespace ns on ns.oid=cl.relnamespace cross join lateral unnest(co.conkey) k(a)
 join pg_attribute att on att.attrelid=cl.oid and att.attnum=k.a where co.contype='f' and ns.nspname='public' loop
 execute format('create index if not exists %I on public.%I(%I)',r.t||'_'||r.c||'_fk_idx',r.t,r.c);
 end loop;
end $$;
create index audit_entity_idx on public.audit_log(table_name,record_id,occurred_at desc);
create index event_entity_idx on public.events(entity,entity_id,occurred_at desc);
create index applications_queue_idx on public.partner_applications(status,created_at);

-- Invite-only defence in depth: unapproved emails cannot create Auth users even if a dashboard setting drifts.
create function commercial_private.guard_auth_signup() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if not exists(select 1 from public.partner_applications a where a.email=lower(new.email) and a.status='aprovado')
 and not exists(select 1 from commercial_private.staff_invites i where i.email=lower(new.email) and i.expires_at>now())
 and not exists(select 1 from public.users_profile p where p.id=new.id and p.role in ('admin','finance'))
 and session_user<>'postgres' then raise exception 'Cadastro apenas por convite aprovado'; end if;
 return new;
end $$;
create trigger commercial_invite_only before insert on auth.users for each row execute function commercial_private.guard_auth_signup();
create function commercial_private.bind_staff() returns trigger language plpgsql security definer set search_path='' as $$
declare invitation commercial_private.staff_invites;
begin
 select * into invitation from commercial_private.staff_invites where email=lower(new.email) and expires_at>now() for update;
 if found then
 insert into public.users_profile(id,name,role) values(new.id,invitation.name,invitation.role);
 delete from commercial_private.staff_invites where email=invitation.email;
 insert into public.events(entity,entity_id,type,actor_id) values('users_profile',new.id,'staff.invitation_accepted',invitation.invited_by);
 end if;
 return new;
end $$;
create trigger commercial_bind_staff after insert on auth.users for each row execute function commercial_private.bind_staff();

-- Public application ingestion is service-only; rate limiting is shared and atomic.
create function commercial_private.receive_application(payload jsonb, rate_key text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rid uuid; n int; ts timestamptz:=date_trunc('hour',now());
begin
 insert into commercial_private.rate_buckets(id,window_start,count) values(rate_key,ts,1)
 on conflict(id) do update set window_start=excluded.window_start,count=case when commercial_private.rate_buckets.window_start=excluded.window_start then commercial_private.rate_buckets.count+1 else 1 end returning count into n;
 if n>5 then return jsonb_build_object('rate_limited',true); end if;
 insert into public.partner_applications(kind,name,email,whatsapp,city,uf,details,origin,privacy_version,conditions_version)
 values(payload->>'kind',payload->>'name',lower(payload->>'email'),payload->>'whatsapp',payload->>'city',payload->>'uf',payload->'details',coalesce(payload->'origin','{}'),payload->>'privacy_version',payload->>'conditions_version')
 on conflict(email,kind) do nothing returning id into rid;
 if rid is null then return jsonb_build_object('received',false); end if;
 insert into public.events(entity,entity_id,type) values('partner_applications',rid,'application.received');
 return jsonb_build_object('received',true,'id',rid,'status','em_analise');
end $$;
create function public.receive_application(payload jsonb,rate_key text) returns jsonb language sql security invoker set search_path='' as $$ select commercial_private.receive_application(payload,rate_key); $$;

-- One transactional command boundary: identity comes only from the verified JWT.
create function commercial_private.command(action text, p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); rid uuid; pid uuid; cid uuid; aid uuid; mode text; n int; total int; expected int;
 r public.referrals; a public.assignments; l public.lead_lists; d public.deals; pa public.partner_applications;
 partner public.partners; item public.commission_items; selected uuid[]; comp jsonb; contact jsonb; dup boolean;
begin
 if uid is null or not exists(select 1 from public.users_profile where id=uid and active) then raise exception 'Conta não autorizada' using errcode='42501'; end if;
 if jsonb_typeof(p)<>'object' then raise exception 'Objeto esperado'; end if;
 rid:=nullif(p->>'id','')::uuid;
 pid:=nullif(p->>'partner_id','')::uuid;
 if action='application_decide' then
   perform commercial_private.require_staff();
   select * into strict pa from public.partner_applications where id=rid for update;
   if p->>'status' not in ('aprovado','recusado','informacao_pendente') then raise exception 'Situação inválida'; end if;
   if nullif(trim(p->>'reason'),'') is null then raise exception 'Motivo obrigatório'; end if;
   if pa.invited_user_id is not null then raise exception 'Candidatura já vinculada a conta'; end if;
   update public.partner_applications set status=p->>'status',decided_by=uid,decided_at=now(),decision_reason=p->>'reason' where id=rid;
 elsif action='partner_status' then
   perform commercial_private.require_staff();
   select * into strict partner from public.partners where id=rid for update;
   if p->>'status' not in ('ativo','suspenso','encerrado') or nullif(trim(p->>'reason'),'') is null then raise exception 'Situação e motivo obrigatórios'; end if;
   if partner.status='encerrado' then raise exception 'Vínculo encerrado'; end if;
   if p->>'status'='ativo' then perform commercial_private.require_policy('P9_legal');
     if partner.terms_accepted_at is null then raise exception 'Aceite dos termos pendente'; end if;
   end if;
   update public.partners set status=p->>'status',status_reason=p->>'reason' where id=rid;
 elsif action='accept_terms' then
   perform commercial_private.require_policy('P9_legal');
   if not commercial_private.owns_partner(rid) then raise exception 'Acesso não autorizado' using errcode='42501'; end if;
   if not exists(select 1 from public.commercial_settings where key='P9_legal' and value->>'terms_version'=p->>'version') then raise exception 'Versão jurídica inválida'; end if;
   update public.partners set terms_version=p->>'version',terms_accepted_at=now(),status='ativo' where id=rid and status='convidado';
   if not found then raise exception 'Convite indisponível'; end if;
 elsif action='setting_decide' then
   perform commercial_private.require_staff();
   if nullif(trim(p->>'reason'),'') is null then raise exception 'Justificativa obrigatória'; end if;
   if p->>'status' not in ('pending','approved') then raise exception 'Situação inválida'; end if;
   update public.commercial_settings set status=p->>'status',value=p->'value',reason=p->>'reason' where key=p->>'key' returning id into rid;
   if not found then raise exception 'Configuração não encontrada'; end if;
 elsif action='staff_invite_prepare' then
   perform commercial_private.require_staff();
   if p->>'role' not in ('admin','finance') or nullif(trim(p->>'name'),'') is null or p->>'email' !~ '^[^@ ]+@[^@ ]+\.[^@ ]+$' then raise exception 'Dados do convite inválidos'; end if;
   insert into commercial_private.staff_invites(email,name,role,expires_at,invited_by) values(lower(p->>'email'),p->>'name',p->>'role',now()+interval '24 hours',uid)
   on conflict(email) do update set name=excluded.name,role=excluded.role,expires_at=excluded.expires_at,invited_by=uid;
   rid:=uid;
 elsif action in ('company_create','referral_create') then
   comp:=p->'company'; contact:=p->'contact';
   if jsonb_typeof(comp)<>'object' or length(trim(comp->>'legal_name'))<2 or nullif(comp->>'city','') is null or nullif(comp->>'sector','') is null then raise exception 'Dados da empresa incompletos'; end if;
   comp:=comp||jsonb_build_object('cnpj',nullif(regexp_replace(coalesce(comp->>'cnpj',''),'[./-]','','g'),''),'domain',commercial_private.domain(comp->>'domain'),'phone',nullif(regexp_replace(coalesce(comp->>'phone',''),'[^0-9]','','g'),''));
   if not commercial_private.valid_cnpj(comp->>'cnpj') then raise exception 'CNPJ inválido'; end if;
   perform pg_advisory_xact_lock(hashtext('commercial_company_dedup'));
   select exists(select 1 from public.companies c where
     (comp->>'cnpj' is not null and c.cnpj=comp->>'cnpj') or (comp->>'domain' is not null and c.domain=comp->>'domain') or
     (comp->>'phone' is not null and c.phone=comp->>'phone') or (lower(c.legal_name)=lower(comp->>'legal_name') and lower(c.city)=lower(comp->>'city')))
     or exists(select 1 from public.referrals rr where rr.status<>'recusada' and ((comp->>'cnpj' is not null and rr.proposed_company->>'cnpj'=comp->>'cnpj') or (comp->>'domain' is not null and rr.proposed_company->>'domain'=comp->>'domain') or (comp->>'phone' is not null and rr.proposed_company->>'phone'=comp->>'phone') or (lower(rr.proposed_company->>'legal_name')=lower(comp->>'legal_name') and lower(rr.proposed_company->>'city')=lower(comp->>'city')))) into dup;
   if action='company_create' then
     perform commercial_private.require_staff();
     if dup then raise exception 'Possível duplicidade: revisão administrativa necessária'; end if;
     insert into public.companies(cnpj,legal_name,trade_name,city,uf,sector,domain,phone) values(comp->>'cnpj',comp->>'legal_name',comp->>'trade_name',comp->>'city',comp->>'uf',comp->>'sector',comp->>'domain',comp->>'phone') returning id into rid;
     if coalesce((contact->>'authorized')::boolean,false) and nullif(contact->>'name','') is not null then
       insert into public.company_contacts(company_id,name,position,phone,email,authorized_by) values(rid,contact->>'name',contact->>'position',contact->>'phone',contact->>'email',uid);
     end if;
   else
     if p->>'status'<>'validada' or p->>'mode' not in ('indicacao','apresentacao','prospeccao') then raise exception 'Decisão e modalidade inválidas'; end if;
     if not commercial_private.active_partner(pid,'affiliate') then raise exception 'Afiliado não autorizado' using errcode='42501'; end if;
     if not coalesce((contact->>'authorized')::boolean,false) or nullif(contact->>'name','') is null or nullif(contact->>'phone','') is null then raise exception 'Contato autorizado obrigatório'; end if;
     insert into public.referrals(partner_id,proposed_company,proposed_contact,intended_mode,duplicate_status)
     values(pid,comp,contact,p->>'intended_mode',case when dup then 'possivel' else 'sem_indicio' end) returning id into rid;
   end if;
 elsif action='referral_validate' then
   perform commercial_private.require_staff();
   select * into strict r from public.referrals where id=rid for update;
   if r.status<>'em_analise' then raise exception 'Indicação já decidida'; end if;
   if nullif(trim(p->>'reason'),'') is null then raise exception 'Motivo obrigatório'; end if;
   if p->>'status'='recusada' then update public.referrals set status='recusada',decision_reason=p->>'reason' where id=rid;
   else
     if r.duplicate_status='possivel' then perform commercial_private.require_policy('P2_duplicates'); perform commercial_private.require_policy('P3_existing_negotiation'); end if;
     comp:=r.proposed_company; contact:=r.proposed_contact; cid:=nullif(p->>'company_id','')::uuid;
     if cid is null then
       insert into public.companies(cnpj,legal_name,trade_name,city,uf,sector,domain,phone) values(comp->>'cnpj',comp->>'legal_name',comp->>'trade_name',comp->>'city',comp->>'uf',comp->>'sector',comp->>'domain',comp->>'phone') returning id into cid;
     else perform commercial_private.require_policy('P2_duplicates'); end if;
     insert into public.company_contacts(company_id,name,position,phone,email,authorized_by) values(cid,contact->>'name',contact->>'position',contact->>'phone',contact->>'email',uid) returning id into aid;
     update public.referrals set company_id=cid,contact_id=aid,validated_mode=p->>'mode',status='validada',duplicate_status='resolvida',decision_reason=p->>'reason',internal_owner=uid where id=rid;
   end if;
 elsif action='list_offer' then
   perform commercial_private.require_staff();
   select * into strict partner from public.partners where id=pid and kind='remote_prospector' and status='ativo' for update;
   select array_agg(value::uuid) into selected from jsonb_array_elements_text(p->'company_ids');
   if coalesce(cardinality(selected),0)=0 or cardinality(selected)<> (select count(distinct x) from unnest(selected) x) then raise exception 'Empresas obrigatórias e sem repetição'; end if;
   perform id from public.companies where id=any(selected) order by id for update;
   if (select count(*) from public.companies where id=any(selected))<>cardinality(selected) then raise exception 'Empresa não encontrada'; end if;
   if p->>'expires_at' is not null then perform commercial_private.require_policy('P6_list_expiry');
     if (p->>'expires_at')::timestamptz<=now() then raise exception 'Prazo da lista deve ser futuro'; end if;
   end if;
   insert into public.lead_lists(partner_id,name,offered_by,expires_at,notes,summary)
   values(pid,p->>'name',uid,(p->>'expires_at')::timestamptz,p->>'notes',jsonb_build_object('count',cardinality(selected),'cities',(select jsonb_agg(distinct city) from public.companies where id=any(selected)),'sectors',(select jsonb_agg(distinct sector) from public.companies where id=any(selected)))) returning id into rid;
   insert into public.assignments(list_id,partner_id,company_id) select rid,pid,unnest(selected);
 elsif action='list_respond' then
   select * into strict l from public.lead_lists where id=rid for update;
   if not commercial_private.active_partner(l.partner_id,'remote_prospector') then raise exception 'Acesso não autorizado' using errcode='42501'; end if;
   if l.status<>'oferecida' or l.expires_at<=now() then raise exception 'Lista indisponível'; end if;
   if p->>'status' not in ('aceita','recusada') then raise exception 'Resposta inválida'; end if;
   update public.lead_lists set status=p->>'status',responded_at=now() where id=rid;
   update public.assignments set status=p->>'status',released_at=case when p->>'status'='recusada' then now() end where list_id=rid and status='oferecida';
 elsif action='assignment_return' then
   select * into strict a from public.assignments where id=rid for update;
   if not commercial_private.active_partner(a.partner_id,'remote_prospector') or a.status<>'aceita' then raise exception 'Atribuição indisponível' using errcode='42501'; end if;
   update public.assignments set status='devolvida',released_at=now(),release_reason=p->>'reason' where id=rid;
 elsif action in ('assignment_transfer','list_expire') then
   perform commercial_private.require_staff();
   if nullif(trim(p->>'reason'),'') is null then raise exception 'Motivo obrigatório'; end if;
   if action='list_expire' then
     perform commercial_private.require_policy('P6_list_expiry');
     update public.lead_lists set status='expirada',responded_at=now() where id=rid and status='oferecida';
     if not found then raise exception 'Lista indisponível'; end if;
     update public.assignments set status='expirada',released_at=now(),release_reason=p->>'reason' where list_id=rid and status='oferecida';
   else
     select * into strict a from public.assignments where id=rid and status in ('oferecida','aceita') for update;
     select * into strict partner from public.partners where id=pid and status='ativo' and kind='remote_prospector';
     update public.assignments set status='transferida',released_at=now(),release_reason=p->>'reason' where id=rid;
     insert into public.lead_lists(partner_id,name,offered_by,summary) values(pid,'Transferência administrativa',uid,jsonb_build_object('count',1)) returning id into aid;
     insert into public.assignments(list_id,partner_id,company_id) values(aid,pid,a.company_id);
   end if;
 elsif action='contact_log' then
   select * into strict a from public.assignments where id=(p->>'assignment_id')::uuid and status='aceita' for update;
   if not commercial_private.active_partner(a.partner_id,'remote_prospector') then raise exception 'Acesso não autorizado' using errcode='42501'; end if;
   if p->>'result'='reuniao_agendada' and p->>'starts_at' is null then raise exception 'Informe os dados da reunião'; end if;
   insert into public.contact_logs(assignment_id,result,notes,next_action,next_action_at) values(a.id,p->>'result',p->>'notes',p->>'next_action',(p->>'next_action_at')::timestamptz) returning id into rid;
   if p->>'result'='reuniao_agendada' then
     insert into public.meetings(company_id,assignment_id,partner_id,starts_at,format,notes) values(a.company_id,a.id,a.partner_id,(p->>'starts_at')::timestamptz,p->>'format',p->>'notes');
   end if;
 elsif action='meeting_schedule' then
   if p->>'assignment_id' is not null then
     select * into strict a from public.assignments where id=(p->>'assignment_id')::uuid and status='aceita' for update;
     if not commercial_private.active_partner(a.partner_id,'remote_prospector') then raise exception 'Acesso não autorizado' using errcode='42501'; end if;
     cid:=a.company_id; pid:=a.partner_id;
   else
     select * into strict r from public.referrals where id=(p->>'referral_id')::uuid and status='validada' for update;
     if not commercial_private.active_partner(r.partner_id,'affiliate') then raise exception 'Acesso não autorizado' using errcode='42501'; end if;
     cid:=r.company_id; pid:=r.partner_id;
   end if;
   if (p->>'starts_at')::timestamptz<=now() then raise exception 'Reunião deve ser futura'; end if;
   insert into public.meetings(company_id,assignment_id,referral_id,partner_id,starts_at,format,notes)
   values(cid,(p->>'assignment_id')::uuid,(p->>'referral_id')::uuid,pid,(p->>'starts_at')::timestamptz,p->>'format',p->>'notes') returning id into rid;
 elsif action='meeting_status' then
   perform commercial_private.require_staff();
   update public.meetings set status=p->>'status',owner_internal=uid,starts_at=coalesce((p->>'starts_at')::timestamptz,starts_at) where id=rid;
   if not found then raise exception 'Reunião não encontrada'; end if;
 elsif action='deal_sign' then
   perform commercial_private.require_staff();
   if not coalesce((p->>'signature_confirmed')::boolean,false) or nullif(trim(p->>'document_reference'),'') is null or nullif(trim(p->>'reason'),'') is null then raise exception 'Confirmação de assinatura, documento e motivo obrigatórios'; end if;
   if (p->>'signed_on')::date>current_date then raise exception 'Assinatura futura inválida'; end if;
   if p->>'referral_id' is not null then
     select * into strict r from public.referrals where id=(p->>'referral_id')::uuid and status='validada' for update;
     cid:=r.company_id; pid:=r.partner_id; mode:=r.validated_mode;
     if mode is null then raise exception 'Modalidade pendente'; end if;
   else
     select * into strict a from public.assignments where id=(p->>'assignment_id')::uuid and status='aceita' for update;
     cid:=a.company_id; pid:=a.partner_id; mode:='prospeccao_remota';
   end if;
   if not exists(select 1 from public.partners where id=pid and status='ativo') then raise exception 'Parceiro não ativo: revisão pendente'; end if;
   insert into public.deals(company_id,referral_id,assignment_id,signed_on,signature_confirmed,document_reference,confirmed_by)
   values(cid,(p->>'referral_id')::uuid,(p->>'assignment_id')::uuid,(p->>'signed_on')::date,true,p->>'document_reference',uid) returning id into rid;
   insert into public.attributions(deal_id,company_id,partner_id,mode,validated_by,reason) values(rid,cid,pid,mode,uid,p->>'reason') returning id into aid;
   insert into public.commission_items(attribution_id,partner_id,seq,amount_cents,trigger,status,released_at)
   values(aid,pid,1,case when mode='indicacao' then 5000 else 15000 end,'contrato_assinado','liberada',now());
   if mode='prospeccao' then insert into public.commission_items(attribution_id,partner_id,seq,amount_cents,trigger,status) values(aid,pid,2,15000,'inicio_gravacoes','prevista'); end if;
   if a.id is not null then update public.assignments set status='convertida',released_at=now() where id=a.id; end if;
 elsif action='recording_confirm' then
   perform commercial_private.require_staff();
   select * into strict d from public.deals where id=rid for update;
   if not coalesce((p->>'confirmed')::boolean,false) or p->>'started_on' is null then raise exception 'Confirmação explícita e data obrigatórias'; end if;
   if (p->>'started_on')::date<d.signed_on or (p->>'started_on')::date>current_date then raise exception 'Data de gravação inválida'; end if;
   if d.recording_confirmed then return jsonb_build_object('id',rid,'already_confirmed',true); end if;
   update public.deals set recording_confirmed=true,recording_started_on=(p->>'started_on')::date,confirmed_by=uid where id=rid;
   update public.commission_items set status='liberada',released_at=now() where attribution_id in (select id from public.attributions where deal_id=rid) and trigger='inicio_gravacoes' and status='prevista';
 elsif action='commission_cancel' then
   perform commercial_private.require_staff(array['admin','finance']); perform commercial_private.require_policy('P5_cancellation');
   if nullif(trim(p->>'reason'),'') is null then raise exception 'Motivo obrigatório'; end if;
   update public.commission_items set status='cancelada',cancel_reason=p->>'reason' where id=rid and status in ('prevista','liberada');
   if not found then raise exception 'Parcela indisponível ou já paga'; end if;
 elsif action='payment_register' then
   perform commercial_private.require_staff(array['admin','finance']); perform commercial_private.require_policy('P4_payments');
   select id into rid from public.payments where idempotency_key=(p->>'idempotency_key')::uuid;
   if found then return jsonb_build_object('id',rid,'already_registered',true); end if;
   select array_agg(value::uuid) into selected from jsonb_array_elements_text(p->'item_ids');
   if coalesce(cardinality(selected),0)=0 or cardinality(selected)<>(select count(distinct x) from unnest(selected) x) then raise exception 'Parcelas obrigatórias e sem repetição'; end if;
   perform id from public.commission_items where id=any(selected) order by id for update;
   select count(*),sum(amount_cents) into n,total from public.commission_items where id=any(selected) and partner_id=pid and status='liberada';
   if n<>cardinality(selected) or total is distinct from (p->>'expected_total_cents')::int then raise exception 'Parcelas ou total divergentes'; end if;
   if not exists(select 1 from public.partners where id=pid and status='ativo') then raise exception 'Pagamento a parceiro não ativo depende de decisão específica'; end if;
   if (p->>'paid_on')::date>current_date or nullif(trim(p->>'reference'),'') is null or nullif(trim(p->>'method'),'') is null then raise exception 'Dados de pagamento inválidos'; end if;
   insert into public.payments(partner_id,total_cents,paid_on,method,reference,registered_by,idempotency_key)
   values(pid,total,(p->>'paid_on')::date,p->>'method',p->>'reference',uid,(p->>'idempotency_key')::uuid) returning id into rid;
   insert into public.payment_items(payment_id,commission_item_id) select rid,unnest(selected);
   update public.commission_items set status='paga' where id=any(selected);
 elsif action='payout_update' then
   perform commercial_private.require_staff(array['admin','finance']); perform commercial_private.require_policy('P4_payments');
   insert into public.partner_payout_details(partner_id,details) values(pid,p->'details') on conflict(partner_id) do update set details=excluded.details returning id into rid;
 else raise exception 'Operação desconhecida';
 end if;
 insert into public.events(entity,entity_id,type,actor_id) values('commercial',coalesce(rid,uid),action,uid);
 return jsonb_build_object('id',rid,'saved',true);
end $$;
create function public.commercial_command(action text,p jsonb) returns jsonb language sql security invoker set search_path='' as $$ select commercial_private.command(action,p); $$;

-- Binding happens only after Auth has actually accepted an invitation.
create function commercial_private.bind_invitation(application_id uuid,user_id uuid,actor_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare a public.partner_applications; rid uuid;
begin
 if not exists(select 1 from public.users_profile where id=actor_id and role='admin' and active) then raise exception 'Admin inválido'; end if;
 select * into strict a from public.partner_applications where id=application_id and status='aprovado' for update;
 if not exists(select 1 from auth.users u where u.id=user_id and lower(u.email)=a.email) then raise exception 'Conta divergente'; end if;
 if exists(select 1 from public.users_profile u where u.id=user_id and u.role in ('admin','finance')) then raise exception 'Conta interna não pode ser vinculada a parceiro'; end if;
 if exists(select 1 from public.partners p where p.user_id=bind_invitation.user_id and p.kind<>a.kind) then perform commercial_private.require_policy('P7_dual_kind'); end if;
 insert into public.users_profile(id,name,role) values(user_id,a.name,a.kind) on conflict(id) do nothing;
 insert into public.partners(user_id,application_id,kind) values(user_id,a.id,a.kind) on conflict(application_id) do update set application_id=excluded.application_id returning id into rid;
 update public.partner_applications set invited_user_id=user_id,invitation_status='sent' where id=a.id;
 insert into public.events(entity,entity_id,type,actor_id) values('partners',rid,'partner.invited',actor_id);
 return rid;
end $$;
create function public.bind_invitation(application_id uuid,user_id uuid,actor_id uuid) returns uuid language sql security invoker set search_path='' as $$ select commercial_private.bind_invitation(application_id,user_id,actor_id); $$;

revoke all on all functions in schema commercial_private from public,anon,authenticated;
grant execute on function commercial_private.staff(text[]),commercial_private.owns_partner(uuid),commercial_private.can_company(uuid),commercial_private.active_partner(uuid,text),commercial_private.command(text,jsonb),commercial_private.valid_cnpj(text) to authenticated;
grant execute on function commercial_private.receive_application(jsonb,text),commercial_private.bind_invitation(uuid,uuid,uuid) to service_role;
revoke all on function public.receive_application(jsonb,text),public.bind_invitation(uuid,uuid,uuid),public.commercial_command(text,jsonb) from public,anon,authenticated;
grant execute on function public.commercial_command(text,jsonb) to authenticated;
grant execute on function public.receive_application(jsonb,text),public.bind_invitation(uuid,uuid,uuid) to service_role;
grant all on all tables in schema public to service_role;
