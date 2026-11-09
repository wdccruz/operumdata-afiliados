import { createClient } from 'npm:@supabase/supabase-js@2.119.0';

export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export const service = () => createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {auth:{persistSession:false,autoRefreshToken:false}});
const allowedOrigins = () => (Deno.env.get('ALLOWED_ORIGINS') || 'http://localhost:3200,http://127.0.0.1:3200').split(',').map(s=>s.trim());
export function headers(req: Request) {
  const origin=req.headers.get('origin') || '';
  if(origin && !allowedOrigins().includes(origin)) throw new HttpError(403,'Origem não permitida.');
  return {'Access-Control-Allow-Origin':origin || allowedOrigins()[0], 'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods':'POST, OPTIONS', 'Vary':'Origin', 'Content-Type':'application/json', 'Cache-Control':'no-store'};
}
export async function body(req: Request) {
  if(req.method!=='POST') throw new HttpError(405,'Use POST.');
  if(!req.headers.get('content-type')?.includes('application/json')) throw new HttpError(415,'Envie JSON.');
  const reader=req.body?.getReader(); if(!reader) throw new HttpError(400,'Corpo obrigatório.');
  const decoder=new TextDecoder(); let text='', size=0;
  while(true) {const {done,value}=await reader.read(); if(done)break; size+=value.byteLength; if(size>16384){await reader.cancel();throw new HttpError(413,'Requisição muito grande.');} text+=decoder.decode(value,{stream:true});}
  text+=decoder.decode();
  try { const p=JSON.parse(text); if(!p || Array.isArray(p)||typeof p!=='object')throw new Error(); return p; } catch { throw new HttpError(400,'JSON inválido.'); }
}
export async function identity(req: Request) {
  const authorization=req.headers.get('authorization');
  if(!authorization?.startsWith('Bearer ')) throw new HttpError(401,'Autenticação necessária.');
  const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await client.auth.getUser(authorization.slice(7));
  if(error || !data.user || data.user.is_anonymous) throw new HttpError(401,'Sessão inválida.');
  const {data:profile,error:profileError}=await client.from('users_profile').select('id,role,active,name').eq('id',data.user.id).single();
  if(profileError||!profile?.active) throw new HttpError(403,'Conta não autorizada.');
  return {client,user:data.user,profile};
}
export const databaseError=(error: {code?:string; message:string}) => {
  const status=error.code==='42501'?403:error.code==='23505'?409:400;
  // Do not expose unique-key values, table names, or another partner's data.
  const message=error.code?.startsWith('23')?'Dados conflitantes ou inválidos. Revise os campos.':error.code==='P0001'?error.message:'Não foi possível concluir a operação.';
  return new HttpError(status,message);
};
export function serve(handler: (req: Request)=>Promise<unknown>) {
  Deno.serve(async req=>{
    let h: Record<string,string>={'Content-Type':'application/json','Cache-Control':'no-store'};
    try {
      h=headers(req); if(req.method==='OPTIONS')return new Response(null,{status:204,headers:h});
      const result=await handler(req);
      return new Response(JSON.stringify(result),{status:200,headers:h});
    } catch(error) {
      const e=error as Error;
      const status=error instanceof HttpError?error.status:e.name==='ValidationError'?400:500;
      if(status===500)console.error('commercial_request_failed');
      return new Response(JSON.stringify({error:status===500?'Erro interno. Nenhum sucesso foi confirmado.':e.message}),{status,headers:h});
    }
  });
}
