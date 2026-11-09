import {body,serve,identity,service,databaseError,HttpError} from '../_shared/http.ts';
serve(async req=>{
  const {client,profile}=await identity(req); if(profile.role!=='admin')throw new HttpError(403,'Acesso administrativo necessário.');
  const p=await body(req);
  if(typeof p.email!=='string'||p.email.endsWith('.test'))throw new HttpError(400,'Não são criadas credenciais reais para identidades fictícias.');
  const {error}=await client.rpc('commercial_command',{action:'staff_invite_prepare',p}); if(error)throw databaseError(error);
  const redirectTo=Deno.env.get('AUTH_REDIRECT_URL') || 'http://localhost:3200/painel/acesso.html';
  const {error:inviteError}=await service().auth.admin.inviteUserByEmail(p.email,{redirectTo});
  if(inviteError)throw new HttpError(502,'O serviço não confirmou o envio do convite.');
  return {invited:true};
});
