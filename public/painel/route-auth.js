// Dashboard invitations use Site URL. Route the token before loading the Auth SDK.
const authType=new URLSearchParams(location.hash.slice(1)).get('type');
if(authType==='invite'||authType==='recovery'){
  location.replace(new URL('acesso.html'+location.search+location.hash,location.href).href);
}else{
  await import('./painel.js');
}
