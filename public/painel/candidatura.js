import {invoke} from './client.js';
const form=document.querySelector('#apply'),result=document.querySelector('#application-result');let started=Date.now();
document.querySelector('#uf').innerHTML='AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ').map(v=>`<option>${v}</option>`).join('');
form.elements.kind.addEventListener('change',()=>{const affiliate=form.elements.kind.value==='affiliate';document.querySelector('#affiliate-fields').hidden=!affiliate;document.querySelector('#remote-fields').hidden=affiliate;for(const key of ['perfil_profissional','setores'])form.elements[key].required=affiliate;});
form.addEventListener('submit',async event=>{event.preventDefault();const p=Object.fromEntries(new FormData(form));const button=form.querySelector('button');button.disabled=true;result.textContent='Enviando ao banco de desenvolvimento…';try{
 const details=p.kind==='affiliate'?{perfil_profissional:p.perfil_profissional,setores:p.setores.split(',').map(s=>s.trim()).filter(Boolean)}:{experiencia_principal:p.experiencia_principal,tempo_experiencia:p.tempo_experiencia,possui_equipamento:p.possui_equipamento};
 const data=await invoke('partner-apply',{kind:p.kind,name:p.name,email:p.email,whatsapp:p.whatsapp,city:p.city,uf:p.uf,details,privacy_version:'development-unapproved',conditions_version:'development-unapproved',consent:p.consent==='on',elapsed_ms:Date.now()-started});
 if(data.received){result.textContent=`Solicitação fictícia registrada para análise. Protocolo: ${data.id}. Se já havia uma candidatura, sua situação foi preservada.`;form.reset();started=Date.now();}else result.textContent=data.message;
 }catch(error){result.textContent=error.message;}finally{button.disabled=false;}});

