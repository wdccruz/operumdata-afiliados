export class ValidationError extends Error { constructor(message) { super(message); this.name='ValidationError'; } }
const fail = message => { throw new ValidationError(message); };
const string = (v,field,max=180) => typeof v==='string' && v.trim().length>0 && v.trim().length<=max ? v.trim() : fail(`Campo inválido: ${field}`);
const choice = (v,values,field) => values.includes(v) ? v : fail(`Opção inválida: ${field}`);
const uf = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
export function validateApplication(input) {
  if (!input || typeof input!=='object' || Array.isArray(input)) fail('Objeto esperado.');
  const allowed=['kind','name','email','whatsapp','city','uf','details','origin','privacy_version','conditions_version','consent','website','elapsed_ms'];
  if (Object.keys(input).some(k=>!allowed.includes(k))) fail('Campos extras não permitidos.');
  if (input.website) fail('Envio inválido.');
  if (typeof input.elapsed_ms!=='number' || input.elapsed_ms<2000 || input.elapsed_ms>86400000) fail('Atualize o formulário e tente novamente.');
  if(input.consent!==true) fail('Aceite obrigatório.');
  const kind=choice(input.kind,['affiliate','remote_prospector'],'kind');
  const name=string(input.name,'name',120); if(name.split(/\s+/).length<2) fail('Informe nome e sobrenome.');
  const email=string(input.email,'email',254).toLowerCase(); if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('E-mail inválido.');
  const whatsapp=string(input.whatsapp,'whatsapp',20).replace(/\D/g,''); if(!/^\d{10,11}$/.test(whatsapp)) fail('WhatsApp inválido.');
  const d=input.details; if(!d || typeof d!=='object' || Array.isArray(d)) fail('Detalhes obrigatórios.');
  let details;
  if(kind==='remote_prospector') {
    const keys=['experiencia_principal','tempo_experiencia','disponibilidade','possui_equipamento'];
    if(Object.keys(d).some(k=>!keys.includes(k))) fail('Detalhes extras não permitidos.');
    details={experiencia_principal:choice(d.experiencia_principal,['telemarketing_ativo','televendas','vendas_b2b','agendamento_reunioes','outra'],'experiencia_principal'),tempo_experiencia:choice(d.tempo_experiencia,['menos_1','1_3','3_5','mais_5'],'tempo_experiencia'),possui_equipamento:choice(d.possui_equipamento,['sim','nao'],'possui_equipamento')};
    if(d.disponibilidade) details.disponibilidade=choice(d.disponibilidade,['eventual','alguns_dias','maioria_dias'],'disponibilidade');
  } else {
    if(Object.keys(d).some(k=>!['perfil_profissional','setores'].includes(k))) fail('Detalhes extras não permitidos.');
    if(!Array.isArray(d.setores)||d.setores.length<1||d.setores.length>20) fail('Informe setores de contato.');
    details={perfil_profissional:string(d.perfil_profissional,'perfil_profissional',120),setores:[...new Set(d.setores.map(v=>string(v,'setor',80)))]};
  }
  const origin={};
  if(input.origin) {
    if(typeof input.origin!=='object'||Array.isArray(input.origin)) fail('Origem inválida.');
    for(const [k,v] of Object.entries(input.origin)) { if(!['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].includes(k)) fail('Origem não permitida.'); origin[k]=string(v,k,200); }
  }
  return {kind,name,email,whatsapp,city:string(input.city,'city',100),uf:choice(input.uf,uf,'uf'),details,origin,privacy_version:string(input.privacy_version,'privacy_version',80),conditions_version:string(input.conditions_version,'conditions_version',80)};
}
