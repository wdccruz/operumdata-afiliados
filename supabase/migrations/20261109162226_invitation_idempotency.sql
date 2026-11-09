create or replace function commercial_private.bind_invitation(application_id uuid,user_id uuid,actor_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare a public.partner_applications; rid uuid;
begin
 if not exists(select 1 from public.users_profile where id=$3 and role='admin' and active) then raise exception 'Admin inválido'; end if;
 select * into strict a from public.partner_applications where id=$1 and status='aprovado' for update;
 if not exists(select 1 from auth.users u where u.id=$2 and lower(u.email)=a.email) then raise exception 'Conta divergente'; end if;
 if exists(select 1 from public.users_profile u where u.id=$2 and u.role in ('admin','finance')) then raise exception 'Conta interna não pode ser vinculada a parceiro'; end if;
 if exists(select 1 from public.partners p where p.user_id=$2 and p.kind<>a.kind) then perform commercial_private.require_policy('P7_dual_kind'); end if;
 insert into public.users_profile(id,name,role) values($2,a.name,a.kind) on conflict(id) do nothing;
 insert into public.partners(user_id,application_id,kind) values($2,a.id,a.kind)
 on conflict on constraint partners_application_id_key do update set application_id=excluded.application_id returning id into rid;
 update public.partner_applications set invited_user_id=$2,invitation_status='sent' where id=a.id;
 insert into public.events(entity,entity_id,type,actor_id) values('partners',rid,'partner.invited',$3);
 return rid;
end $$;
