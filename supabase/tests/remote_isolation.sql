-- Synthetic identities, no passwords or credentials. Every change is rolled back.
begin;
select set_config('test.admin',gen_random_uuid()::text,true),set_config('test.alice',gen_random_uuid()::text,true),set_config('test.bob',gen_random_uuid()::text,true);
insert into auth.users(id,email) values
 (current_setting('test.admin')::uuid,'rollback-admin@example.test'),
 (current_setting('test.alice')::uuid,'rollback-alice@example.test'),
 (current_setting('test.bob')::uuid,'rollback-bob@example.test');
insert into public.users_profile(id,name,role) values
 (current_setting('test.admin')::uuid,'Admin rollback','admin'),
 (current_setting('test.alice')::uuid,'Alice rollback','affiliate'),
 (current_setting('test.bob')::uuid,'Bob rollback','affiliate');
insert into public.partner_applications(kind,name,email,whatsapp,city,uf,details,privacy_version,conditions_version,status)
 values('affiliate','Alice rollback','rollback-alice@example.test','11999999999','Cidade Fictícia','SP','{}','test','test','aprovado') returning set_config('test.app',id::text,true);
insert into public.partners(user_id,application_id,kind,status,terms_version,terms_accepted_at)
 values(current_setting('test.alice')::uuid,current_setting('test.app')::uuid,'affiliate','ativo','test',now()) returning set_config('test.partner',id::text,true);
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.alice'),true);
select public.commercial_command('referral_create',jsonb_build_object('partner_id',current_setting('test.partner'),'intended_mode','indicacao','company',jsonb_build_object('legal_name','Empresa rollback','city','Cidade Fictícia','uf','SP','sector','Teste','domain','rollback.example.test'),'contact',jsonb_build_object('name','Contato Fictício','phone','11999999999','authorized',true)));
do $$begin
 if (select count(*) from public.referrals)<>1 then raise exception 'Own referral not visible'; end if;
 if (select count(*) from public.partner_applications)<>0 then raise exception 'Application leak'; end if;
 begin update public.users_profile set role='admin'; raise exception 'Privilege escalation permitted'; exception when insufficient_privilege then null; end;
 begin perform public.commercial_command('partner_status',jsonb_build_object('id',current_setting('test.partner'),'status','ativo','reason','Ataque')); raise exception 'Unauthorized command permitted'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.bob'),true);
do $$begin
 if (select count(*) from public.referrals)<>0 then raise exception 'Partner isolation failed'; end if;
 if (select count(*) from public.partners)<>0 then raise exception 'Partner identity leak'; end if;
 if (select count(*) from public.audit_log)<>0 then raise exception 'Audit leak'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.admin'),true);
do $$begin
 if not exists(select 1 from public.referrals where partner_id=current_setting('test.partner')::uuid) then raise exception 'Admin read failed'; end if;
 if not exists(select 1 from public.audit_log where actor_id=current_setting('test.alice')::uuid) then raise exception 'Actor audit missing'; end if;
end $$;
set local role anon;
do $$begin
 begin perform * from public.partner_applications; raise exception 'Anonymous table read permitted'; exception when insufficient_privilege then null; end;
 begin perform public.commercial_command('application_decide','{}'); raise exception 'Anonymous command permitted'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: hosted RLS, role escalation, anonymous access and audit; all fixtures rolled back' as result;
rollback;
