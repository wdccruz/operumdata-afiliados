# Frontend v2 · 05 — Pronto, simulado, pendente e critérios de homologação

## 1. Matriz de funcionalidades

Legenda: **Pronto** = funciona de verdade só com frontend. **Simulado** = funciona apenas no modo demonstração, com dados fictícios e selo "SIMULAÇÃO". **Pendente** = depende de backend/banco que o Codex criará depois; no modo `api` mostra "Disponível após a integração".

| Funcionalidade | Pronto | Simulado (demo) | Pendente de backend |
|---|---|---|---|
| Landing, textos, seções, FAQ, rodapé | ✅ | | |
| Link para o site e para o Facebook | ✅ | | |
| Botão fixo e âncoras no celular | ✅ | | |
| Rotas com URL própria e botão voltar | ✅ | | |
| Captura de UTM na sessão | ✅ (captura e anexa ao envio) | | gravação no banco |
| Validação de campos do cadastro | ✅ | | validação definitiva no servidor |
| Envio do cadastro | validação e estado "Envio ainda não disponível" ✅ | ❌ não simula recebimento | ✅ `enviarCandidatura` |
| Login / sessão / sair | | ✅ (perfis fictícios) | ✅ autenticação real |
| Recuperação de senha | | | ✅ (tela "em breve") |
| Painel do afiliado (resumo, listas, detalhe) | layout ✅ | ✅ | ✅ dados reais e isolamento |
| Nova indicação com campos condicionais | formulário ✅ | ✅ | ✅ gravação e duplicidade |
| Comissões e pagamentos do afiliado | layout ✅ | ✅ | ✅ |
| Aprovação de afiliados | layout ✅ | ✅ | ✅ |
| Duplicidade, validação de modalidade, etapas | layout ✅ | ✅ | ✅ |
| Liberação de parcelas e registro de pagamento | layout ✅ | ✅ (sem transferência) | ✅ |
| Histórico de atividades | layout ✅ | ✅ | ✅ auditoria real |
| Dados de recebimento (CPF, Pix, banco) | | | ✅ fase futura |
| Edição de perfil | | | ✅ |
| Termos e Aviso de Privacidade | estrutura ✅ | | texto jurídico da OperumData |
| Prospecção remota: destaque na principal e página exclusiva (07) | ✅ | | |
| Candidatura de prospector remoto | validação e "Envio ainda não disponível" ✅ | ❌ não simula recebimento | ✅ `enviarCandidaturaProspector` |
| Painel do prospector (carteira, contatos, reuniões, comissões) | especificado (07 §4) | | ✅ Supabase: atribuição exclusiva e RLS |

Nenhuma tela pode exibir "concluído", "salvo", "enviado" ou "pago" fora do modo demo sem resposta real do backend.

## 2. Regras da camada de demonstração

- Só existe em `public/js/data/demo/`. Carregada por `import()` dinâmico apenas com `mode: 'demo'` e `environment !== 'production'`.
- Proteção extra: se `location.hostname` for `afiliados.operumdata.com` ou `operumdata.com`/subdomínios, o modo demo é recusado mesmo com config errada.
- Nomes de empresas terminam em "· fictícia"; e-mails em `.test`; telefones `(00) 0000-0000`.
- Estado em memória por padrão; `localStorage` apenas com chave versionada `od.demo.v2` e botão "Restaurar demonstração".
- Toda confirmação nas áreas internas mostra "SIMULAÇÃO: nenhum dado foi enviado ou salvo". O cadastro público nunca simula recebimento (02 §4.3).
- Perfis no painel Demo: Visitante · Afiliado em análise · Afiliado aprovado (com indicações em todas as etapas, incluindo R$ 300 com uma parcela paga e outra prevista) · Afiliado suspenso · Administração.
- Fixtures devem cobrir: lista vazia, duplicidade possível, modalidade validada diferente da pretendida, indicação encerrada, parcela cancelada.

## 3. Critérios de homologação

### 3.1 Conversão e conteúdo (landing)

- [ ] Em 360 × 640 e 390 × 844, sem rolar: H1 completo, "R$ 300" e botão "Quero ser afiliado" visíveis (com a faixa de homologação presente).
- [ ] As cinco perguntas (quanto, o quê, quem, preciso vender, como me cadastro) são respondidas antes da seção de FAQ.
- [ ] Os três valores aparecem com o que o afiliado faz e quando recebe; R$ 300 mostra as duas parcelas de R$ 150.
- [ ] Frase de não cumulatividade presente.
- [ ] Nenhum percentual de comissão, "nível", "meta" ou "base de cálculo" em qualquer tela (verificação automatizada por busca de texto).
- [ ] Nenhuma frase de ganho garantido; todas as menções de valor vêm com a condição.
- [ ] Botão fixo aparece após o herói e some quando o formulário está visível.
- [ ] Link do Facebook abre `https://www.facebook.com/operumdata/` em nova aba; nenhum texto afirma que a pessoa curtiu ou segue; cadastro funciona sem clicar nele.
- [ ] Nenhum `[A CONFIRMAR]` na landing; textos idênticos a `referencia-landing.html` (revisão 2).
- [ ] "Quem pode participar" aparece só no FAQ (sem repetição na página).
- [ ] Bloco "O que você leva ao empresário" presente logo após os valores.
- [ ] Convite do Facebook com botão neutro, menor que o botão principal e nunca laranja.
- [ ] FAQ diferencia R$ 50, R$ 150 e R$ 300 e diz que a 2ª parcela do R$ 300 depende do início efetivo das gravações.

### 3.2 Cadastro

- [ ] Campos exatamente os especificados; nenhum CPF, RG, banco ou data de nascimento.
- [ ] Teclados corretos no celular (e-mail, numérico no WhatsApp).
- [ ] Erros por campo, resumo de erros e foco no primeiro erro; valores preservados ao voltar e após falha.
- [ ] Estados: enviando, erro de rede, 409, 429 e "Envio ainda não disponível". Em nenhum modo aparece mensagem de cadastro recebido ou salvo.
- [ ] Com `?utm_source=facebook&utm_campaign=teste`, o objeto `origem` enviado contém esses valores; parâmetros fora da lista são ignorados; nada é gravado em cookie.
- [ ] Senha não aparece em `localStorage`, `sessionStorage`, URL ou console.

### 3.3 Áreas autenticadas (modo demo)

- [ ] Afiliado em análise não vê "Indicar empresa".
- [ ] Status comercial e financeiro aparecem em blocos separados em todas as telas.
- [ ] Formulário de nova indicação muda campos conforme modalidade; domínio/site é opcional; autorização do contato é obrigatória.
- [ ] Erro de duplicidade não revela outro afiliado.
- [ ] Admin: aprovar/recusar/suspender com motivo; validar modalidade; avançar etapa com confirmação; liberar/cancelar parcela; registrar pagamento com revisão do total; histórico atualizado.
- [ ] Perfil afiliado não acessa `/admin/*` (redireciona com "sem acesso") — lembrando que isso é só experiência; a proteção real é do backend.

### 3.4 Modo `api` (sem backend)

- [ ] Landing completa e navegável.
- [ ] Envio de cadastro, login e todas as telas autenticadas exibem o estado "Disponível após a integração", sem sucesso falso.
- [ ] Nenhum arquivo de `data/demo/` é baixado (verificar aba Rede).

### 3.5 Qualidade técnica

- [ ] Lighthouse mobile (landing, homologação local): Desempenho ≥ 90, Acessibilidade ≥ 95, Boas práticas ≥ 95, SEO ≥ 90.
- [ ] LCP < 2,5 s e CLS < 0,1 em perfil 4G simulado.
- [ ] Peso da landing sem imagens ≤ 150 KB transferidos (HTML+CSS+JS+fonte).
- [ ] Nenhuma requisição a domínios externos ao carregar a página.
- [ ] Contraste WCAG AA em todo texto (atenção à regra do laranja em 01 §3.2).
- [ ] Navegação completa por teclado, foco visível, `<dialog>` com foco preso, `prefers-reduced-motion` respeitado.
- [ ] Sem erros no console em Chrome, Safari iOS e Firefox recentes.
- [ ] Sem rolagem horizontal de 320 px a 1440 px.
- [ ] `npm run check` e `npm test` passam (testes atuais do backend inalterados e passando).
- [ ] Testes novos com `node:test` para módulos puros: `validate.js`, `format.js`, `utm.js`, `router.js` (correspondência de rotas), `errors.js`, e um teste que garante que `api-client.js` rejeita com `BACKEND_PENDENTE`.
- [ ] Teste de texto: nenhuma ocorrência de `%` associada a comissão, nem de "nível", em `public/`.
- [ ] Teste do servidor de prévia: bloqueia `..` e extensões não permitidas.

### 3.6 Processo

- [ ] Trabalho na branch `feat/frontend-conversao`; PR em rascunho para revisão.
- [ ] Capturas de tela (360, 390, 768, 1280) da landing, cadastro, painel e admin anexadas ao PR.
- [ ] Nenhuma alteração em banco, migrações, infraestrutura, DNS, operumdata.com ou parceiros.operumdata.com.
- [ ] Nenhum deploy. Publicação somente após aprovação expressa.
