create table commercial_private.application_receipts (
 id uuid primary key default gen_random_uuid(), application_id uuid not null references public.partner_applications(id),
 created_at timestamptz not null default now()
);
create index application_receipts_application_idx on commercial_private.application_receipts(application_id);
alter table commercial_private.application_receipts enable row level security;
revoke all on commercial_private.application_receipts from public,anon,authenticated;
create or replace function commercial_private.receive_application(payload jsonb,rate_key text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare application uuid; receipt uuid; n int; ts timestamptz:=date_trunc('hour',now());
begin
 insert into commercial_private.rate_buckets(id,window_start,count) values(rate_key,ts,1)
 on conflict(id) do update set window_start=excluded.window_start,count=case when commercial_private.rate_buckets.window_start=excluded.window_start then commercial_private.rate_buckets.count+1 else 1 end returning count into n;
 if n>5 then return jsonb_build_object('rate_limited',true); end if;
 insert into public.partner_applications(kind,name,email,whatsapp,city,uf,details,origin,privacy_version,conditions_version)
 values(payload->>'kind',payload->>'name',lower(payload->>'email'),payload->>'whatsapp',payload->>'city',payload->>'uf',payload->'details',coalesce(payload->'origin','{}'),payload->>'privacy_version',payload->>'conditions_version')
 on conflict(email,kind) do nothing returning id into application;
 if application is null then select id into strict application from public.partner_applications where email=lower(payload->>'email') and kind=payload->>'kind';
 else insert into public.events(entity,entity_id,type) values('partner_applications',application,'application.received'); end if;
 insert into commercial_private.application_receipts(application_id) values(application) returning id into receipt;
 -- A real receipt is persisted for every accepted submission. The public response cannot enumerate emails.
 return jsonb_build_object('received',true,'id',receipt,'status','recebida_para_analise');
end $$;
