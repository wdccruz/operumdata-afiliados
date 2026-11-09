import {supabase} from './client.js';
const form=document.querySelector('#password'),status=document.querySelector('#access-status');
const {data:{session},error}=await supabase.auth.getSession();
if(error||!session)status.textContent='Link inválido ou expirado. Solicite um novo convite ou recuperação.';
else {status.textContent='Defina uma senha exclusiva para sua conta.';form.hidden=false;}
form.addEventListener('submit',async event=>{event.preventDefault();const p=Object.fromEntries(new FormData(form));if(p.password!==p.confirmation){status.textContent='As senhas não coincidem.';return;}const button=form.querySelector('button');button.disabled=true;const {error}=await supabase.auth.updateUser({password:p.password});button.disabled=false;if(error){status.textContent='Não foi possível alterar a senha. Verifique o link e tente novamente.';return;}form.reset();form.hidden=true;status.textContent='Senha atualizada pelo serviço de autenticação. Você já pode acessar o painel.';});
