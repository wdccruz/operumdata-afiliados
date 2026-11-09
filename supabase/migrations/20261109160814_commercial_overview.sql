create function public.commercial_overview() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object(
 'companies',(select count(*) from public.companies),
 'referrals',(select count(*) from public.referrals),
 'lists',(select count(*) from public.lead_lists),
 'meetings',(select count(*) from public.meetings where status in ('agendada','confirmada')),
 'contracts',(select count(*) from public.deals),
 'released_cents',(select coalesce(sum(amount_cents),0) from public.commission_items where status='liberada'),
 'forecast_cents',(select coalesce(sum(amount_cents),0) from public.commission_items where status='prevista'),
 'paid_cents',(select coalesce(sum(total_cents),0) from public.payments)
 );
$$;
revoke all on function public.commercial_overview() from public,anon;
grant execute on function public.commercial_overview() to authenticated;
