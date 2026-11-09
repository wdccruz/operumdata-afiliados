import {body,serve,service,HttpError,databaseError} from '../_shared/http.ts';
import {validateApplication} from '../_shared/validation.mjs';

serve(async req=>{
  const input=await body(req);
  const payload=validateApplication(input);
  // This project is development-only. Real applications require a separate approved release.
  if(!payload.email.endsWith('.test')) throw new HttpError(403,'Homologação: utilize e-mail fictício terminado em .test.');
  const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const salt=Deno.env.get('RATE_LIMIT_SALT') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${salt}:${ip}`));
  const rateKey=Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
  const {data,error}=await service().rpc('receive_application',{payload,rate_key:rateKey});
  if(error)throw databaseError(error);
  if(data.rate_limited)throw new HttpError(429,'Limite de envios atingido. Tente novamente mais tarde.');
  if(!data.received) return {received:false,message:'Não foi criada uma nova candidatura. Se já enviou seus dados, aguarde a análise.'};
  return data;
});
