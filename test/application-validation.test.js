import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateApplication} from '../supabase/functions/_shared/validation.mjs';
const payload=()=>({kind:'remote_prospector',name:'Pessoa Exemplo',email:'EXEMPLO@example.test',whatsapp:'(11) 99999-9999',city:'Cidade Teste',uf:'SP',details:{experiencia_principal:'televendas',tempo_experiencia:'1_3',possui_equipamento:'sim'},privacy_version:'test-v1',conditions_version:'test-v1',consent:true,elapsed_ms:5000});
test('candidaturas: campos, consentimento, opções, normalização, abuso e senha proibida',()=>{
  const value=validateApplication(payload()); assert.equal(value.email,'exemplo@example.test'); assert.equal(value.whatsapp,'11999999999');
  for(const update of [{password:'segredo'},{cpf:'123'},{website:'bot'},{elapsed_ms:0},{consent:false},{uf:'ZZ'},{details:{experiencia_principal:'inventada'}},{origin:{pixel:'proibido'}}]) assert.throws(()=>validateApplication({...payload(),...update}));
  const affiliate=validateApplication({...payload(),kind:'affiliate',details:{perfil_profissional:'Consultor',setores:['Tecnologia']}}); assert.equal(affiliate.kind,'affiliate');
});
