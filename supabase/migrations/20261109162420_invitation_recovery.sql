-- Recover the Auth/DB boundary if an invitation succeeded but its profile bind failed.
create function commercial_private.reconcile_invitation(application_id uuid,actor_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare candidate_email text; uid uuid;
begin
 if not exists(select 1 from public.users_profile where id=$2 and role='admin' and active) then raise exception 'Admin inválido'; end if;
 select a.email into strict candidate_email from public.partner_applications a where a.id=$1 and status='aprovado';
 select u.id into uid from auth.users u where lower(u.email)=candidate_email and u.invited_at is not null;
 if uid is null then return null; end if;
 return commercial_private.bind_invitation($1,uid,$2);
end $$;
create function public.reconcile_invitation(application_id uuid,actor_id uuid) returns uuid language sql security invoker set search_path='' as $$select commercial_private.reconcile_invitation(application_id,actor_id);$$;
revoke all on function commercial_private.reconcile_invitation(uuid,uuid),public.reconcile_invitation(uuid,uuid) from public,anon,authenticated;
grant execute on function commercial_private.reconcile_invitation(uuid,uuid),public.reconcile_invitation(uuid,uuid) to service_role;
