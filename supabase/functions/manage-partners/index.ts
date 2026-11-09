import {body,serve,identity,service,databaseError,HttpError} from '../_shared/http.ts';
serve(async req=>{
  const {client,user,profile}=await identity(req); if(profile.role!=='admin')throw new HttpError(403,'Acesso administrativo necessário.');
  const p=await body(req);
  const {data:existing}=await client.from('partner_applications').select('invited_user_id').eq('id',p.application_id).single();
  if(existing?.invited_user_id&&(!p.decision||p.decision==='aprovado'))return {saved:true,invited:true,already_bound:true};
  if(p.decision) {
    const {error}=await client.rpc('commercial_command',{action:'application_decide',p:{id:p.application_id,status:p.decision,reason:p.reason}});
    if(error)throw databaseError(error);
    if(p.decision!=='aprovado')return {saved:true,invited:false};
  }
  const {data:application,error:readError}=await client.from('partner_applications').select('id,email,name,status,invited_user_id').eq('id',p.application_id).single();
  if(readError||application.status!=='aprovado')throw new HttpError(409,'A candidatura precisa estar aprovada.');
  if(application.invited_user_id)return {saved:true,invited:true,already_bound:true};
  // Never create real Auth credentials for fictitious test identities.
  if(application.email.endsWith('.test'))return {saved:true,invited:false,invitation_pending:'Identidade fictícia: nenhuma conta Auth foi criada.'};
  const admin=service();
  const {data:reconciled,error:reconcileError}=await admin.rpc('reconcile_invitation',{application_id:application.id,actor_id:user.id});
  if(reconcileError)throw databaseError(reconcileError);
  if(reconciled)return {saved:true,invited:true,partner_id:reconciled,reconciled:true};
  const redirectTo=Deno.env.get('AUTH_REDIRECT_URL') || 'http://localhost:3200/painel/acesso.html';
  if(!redirectTo)throw new HttpError(503,'Candidatura preservada; falta configurar o retorno de autenticação.');
  const {data,error}=await admin.auth.admin.inviteUserByEmail(application.email,{redirectTo});
  if(error||!data.user)throw new HttpError(502,'Candidatura preservada; o serviço não confirmou o envio do convite.');
  const {data:partnerId,error:bindError}=await admin.rpc('bind_invitation',{application_id:application.id,user_id:data.user.id,actor_id:user.id});
  if(bindError)throw new HttpError(502,'Convite enviado; vínculo pendente de correção administrativa.');
  return {saved:true,invited:true,partner_id:partnerId};
});
