import {body,serve,identity,databaseError,HttpError} from '../_shared/http.ts';
const tables=new Set(['users_profile','partner_applications','partners','companies','company_contacts','company_internal','referrals','lead_lists','assignments','contact_logs','meetings','deals','attributions','commission_items','payments','payment_items','partner_payout_details','commercial_settings','audit_log','events']);
serve(async req=>{
  const {client}=await identity(req);
  const input=await body(req);
  if(input.action==='read') {
    if(!tables.has(input.table))throw new HttpError(400,'Consulta não permitida.');
    const offset=Number(input.offset||0),limit=Number(input.limit||50);
    if(!Number.isInteger(offset)||offset<0||!Number.isInteger(limit)||limit<1||limit>100)throw new HttpError(400,'Paginação inválida.');
    const {data,error,count}=await client.from(input.table).select('*',{count:'exact'}).order(['audit_log','events'].includes(input.table)?'occurred_at':'created_at',{ascending:false}).range(offset,offset+limit-1);
    if(error)throw databaseError(error);
    return {rows:data,count,offset,limit};
  }
  if(input.action==='overview') {
    const {data,error}=await client.rpc('commercial_overview'); if(error)throw databaseError(error); return data;
  }
  if(typeof input.action!=='string'||!input.params||Array.isArray(input.params)||typeof input.params!=='object')throw new HttpError(400,'Operação inválida.');
  const {data,error}=await client.rpc('commercial_command',{action:input.action,p:input.params});
  if(error)throw databaseError(error);
  if(!data?.saved&&!data?.already_registered&&!data?.already_confirmed)throw new HttpError(500,'Gravação não confirmada.');
  return data;
});
