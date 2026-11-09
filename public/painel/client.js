import { createClient } from './vendor/supabase.js';
import { config } from './config.js';
export const supabase=createClient(config.url,config.publishableKey,{auth:{storage:sessionStorage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
export async function invoke(name,body){
  const {data,error}=await supabase.functions.invoke(name,{body});
  if(error){let message='Não foi possível concluir. Nenhuma gravação foi confirmada.';try{message=(await error.context.json()).error||message;}catch{}throw new Error(message);}
  return data;
}
export const api={
 read:(table,offset=0)=>invoke('commercial-api',{action:'read',table,offset,limit:50}),
 command:(action,params)=>invoke('commercial-api',{action,params}),
 overview:()=>invoke('commercial-api',{action:'overview'}),
 decide:params=>invoke('manage-partners',params)
};
export async function sessionProfile(){
 const {data:{session}}=await supabase.auth.getSession();if(!session)return null;
 const {data,error}=await supabase.from('users_profile').select('id,name,role,active').eq('id',session.user.id).single();
 if(error||!data?.active)throw new Error('Conta sem acesso autorizado. Procure a administração.');return data;
}
