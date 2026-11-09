# Frontend v2 · 03 — Área do afiliado e área administrativa

Mesma identidade visual da landing: fundo off-white `#F7F7F5`, cartões brancos, títulos escuros, laranja só para a ação principal de cada tela.

## 1. Princípios das áreas autenticadas

1. **Status comercial e status financeiro são campos separados**, exibidos em blocos separados, com cores e rótulos diferentes. Nunca um único "status".
2. **Sem percentuais, sem níveis, sem metas por quantidade.** Valores sempre R$ 50, R$ 150 ou R$ 300 (ou parcela de R$ 150).
3. **O frontend não calcula comissão nem decide permissão.** Totais, modalidade validada, parcelas e ações permitidas vêm do backend. O frontend esconde botões que o backend não autorizou (`capacidades`), mas a proteção real é no servidor.
4. **Todo valor previsto aparece com a sua condição** ("previsto · depende do contrato assinado").
5. Toda tela tem quatro estados: carregando (esqueleto), vazio (com orientação), erro (com "tentar novamente") e conteúdo.

## 2. Vocabulário oficial

### 2.1 Etapa comercial da empresa indicada

| Código | Rótulo | Cor | Significado |
|---|---|---|---|
| `em_analise` | Em análise | cinza | Indicação recebida; OperumData verifica dados e duplicidade |
| `em_negociacao` | Em negociação | azul `#1D4ED8` | Empresa em conversa comercial |
| `contrato_assinado` | Contrato assinado | verde `#15803D` | Contrato formalizado |
| `em_gravacao` | Em gravação | laranja `#C2410C` | Gravações iniciadas |
| `encerrada` | Não avançou | vermelho `#B91C1C` | Encerrada sem contrato, recusada ou duplicada; com `motivoEncerramento` |

A etapa `encerrada` não estava na lista original, mas é necessária: toda indicação precisa de um final quando o negócio não acontece. **Proposta a confirmar.**

### 2.2 Situação financeira da parcela de comissão

| Código | Rótulo | Significado |
|---|---|---|
| `prevista` | Prevista | Modalidade validada; o fato que libera a parcela ainda não ocorreu |
| `liberada` | Liberada | Fato ocorreu e foi validado pela OperumData; aguardando pagamento |
| `paga` | Paga | Pagamento registrado |
| `cancelada` | Cancelada | Não será paga (motivo visível) |

### 2.3 Modalidade

| Código | Rótulo | Valor | Parcelas |
|---|---|---|---|
| `indicacao` | Indicação | R$ 50 | 1 × R$ 50 · gatilho `contrato_validado` |
| `apresentacao` | Apresentação e qualificação | R$ 150 | 1 × R$ 150 · gatilho `contrato_validado` |
| `prospeccao` | Prospecção completa | R$ 300 | R$ 150 · `contrato_validado` + R$ 150 · `inicio_gravacoes` |

Cada indicação tem `modalidadePretendida` (informada pelo afiliado) e `modalidadeValidada` (definida pela OperumData; pode ser diferente). A comissão segue sempre a validada.

### 2.4 Situação do afiliado

`em_analise` (Em análise) · `aprovado` (Aprovado) · `recusado` (Não aprovado) · `suspenso` (Suspenso).

## 3. Área do afiliado

Navegação: no celular, barra inferior fixa com 5 itens (Início · Indicações · **+ Indicar** em laranja · Comissões · Perfil). No desktop, menu lateral.

| Rota | Tela |
|---|---|
| `/painel` | Início |
| `/painel/indicacoes` | Minhas indicações |
| `/painel/indicacoes/nova` | Nova indicação |
| `/painel/indicacoes/:id` | Detalhe da indicação |
| `/painel/comissoes` | Comissões |
| `/painel/pagamentos` | Histórico de pagamentos |
| `/painel/perfil` | Perfil |

### 3.1 Cadastro em análise (afiliado `em_analise`)

Tela única no lugar do painel:
- "Seu cadastro está em análise, {nome}."
- Linha do tempo: ✓ Cadastro enviado (data) → ● Análise da equipe → ○ Liberação para indicar.
- "Enquanto isso: conheça os valores e prepare sua lista de empresas" (link para `#ganhos`) + convite do Facebook.
- Sem botão de indicar.

Variações: `recusado` → mensagem respeitosa com canal de contato `[A CONFIRMAR]`; `suspenso` → "Seu acesso a novas indicações está suspenso" + motivo se o backend enviar.

### 3.2 Início (`/painel`)

1. Saudação + botão laranja **Indicar empresa**.
2. **Bloco comercial — "Suas empresas"**: quatro contadores clicáveis (filtram a lista): Indicadas · Em negociação · Contratos assinados · Em gravação.
3. **Bloco financeiro — "Suas comissões"** (separado visualmente, outra cor de fundo): Prevista R$ · Liberada R$ · Paga R$. Legenda curta de cada termo (ícone "i").
4. **Últimas movimentações** (até 5): "Padaria Exemplo passou para Em negociação · 12/11".
5. Estado vazio (nenhuma indicação): ilustração simples + "Indique sua primeira empresa" + lembrete dos 6 segmentos.

### 3.3 Minhas indicações (`/painel/indicacoes`)

- Busca por nome e filtro por etapa comercial (chips).
- Celular: lista em cartões (nome, cidade/UF, etapa, modalidade pretendida/validada, data). Desktop: tabela.
- Ordenação padrão: atualização mais recente.
- Paginação por "Carregar mais" (cursor do backend).

### 3.4 Nova indicação (`/painel/indicacoes/nova`)

Formulário em três blocos. Os campos do bloco 3 mudam conforme a modalidade.

**Bloco 1 — Empresa**
| Campo | Obrigatório | Observação |
|---|---|---|
| Nome da empresa | sim | nome fantasia ou razão social |
| CNPJ | não | recomendado; máscara; validação de dígitos no frontend só como ajuda |
| Segmento | sim | 6 segmentos + Outro |
| Número de profissionais | sim | faixas: 1–4 · 5–19 · 20–99 · 100 ou mais (aviso suave se 1–4: "damos preferência a empresas com 5 ou mais profissionais") |
| Cidade / UF | sim | |
| Site ou rede social | não | **Não exigir domínio** |

**Bloco 2 — Contato responsável**
| Campo | Obrigatório |
|---|---|
| Nome do contato | sim |
| Cargo / função | sim (Dono, Sócio, Gerente, Outro) |
| Telefone/WhatsApp | sim |
| E-mail | não |
| **"O contato autorizou ser procurado pela OperumData"** | sim (checkbox) — base da indicação e exigência de privacidade |

**Bloco 3 — Sua participação** (seleção em 3 cartões iguais aos da landing, com valor)
- `indicacao` (R$ 50): campo "Observações para a equipe" (opcional).
- `apresentacao` (R$ 150): "Data em que você apresentou o projeto" (obrigatório), "Nível de interesse da empresa" (Baixo/Médio/Alto), "Resumo da qualificação" (obrigatório, até 600 caracteres, com dicas: necessidade, quem decide, momento).
- `prospeccao` (R$ 300): tudo de `apresentacao` + "Data da visita presencial" (obrigatório), "Próximo passo combinado" (obrigatório), "Você pode acompanhar até o início das gravações?" (confirmação obrigatória).

Aviso fixo acima do botão: "A modalidade final é validada pela OperumData com base na sua participação comprovada. As comissões não se somam."

Botão: **Enviar indicação**. Sucesso → detalhe da indicação com etapa "Em análise".
Erro de duplicidade: "Esta empresa já está no programa. Se você tem informações novas, fale com a equipe." **Nunca mostrar quem indicou.**

### 3.5 Detalhe da indicação (`/painel/indicacoes/:id`)

Duas colunas no desktop, empilhadas no celular:
- **Andamento comercial:** linha do tempo das 4 etapas com datas; se `encerrada`, mostrar motivo.
- **Sua comissão:** modalidade pretendida × validada; lista de parcelas com valor, gatilho ("na contratação validada", "no início das gravações") e situação financeira.
- **Dados enviados** (somente leitura) e mensagens da equipe (se o backend fornecer).

### 3.6 Comissões (`/painel/comissoes`)

- Totais no topo: Prevista · Liberada · Paga.
- Lista de **parcelas** (não de empresas): empresa, modalidade, parcela "1 de 2", valor, situação financeira, data de liberação/pagamento.
- Filtro por situação financeira.

### 3.7 Pagamentos (`/painel/pagamentos`)

- Lista de pagamentos recebidos: data, valor total, parcelas incluídas (expandir).
- Sem número de conta ou comprovante bancário completo; mostrar só referência curta, se o backend permitir.

### 3.8 Perfil (`/painel/perfil`)

- Dados do cadastro (somente leitura nesta fase; edição pendente de backend).
- Versão dos Termos aceitos e data.
- **Dados para recebimento:** cartão "Disponível em breve. Vamos pedir seus dados de pagamento antes da primeira comissão liberada." Não criar campos de CPF/banco agora.
- Sair.

## 4. Área administrativa

Acesso somente para `papel = admin` **confirmado pelo backend**. Desktop prioritário (uso interno), mas utilizável no celular.

| Rota | Tela |
|---|---|
| `/admin` | Visão geral |
| `/admin/afiliados` e `/admin/afiliados/:id` | Afiliados |
| `/admin/indicacoes` e `/admin/indicacoes/:id` | Empresas indicadas |
| `/admin/comissoes` | Comissões |
| `/admin/pagamentos` e `/admin/pagamentos/novo` | Pagamentos |
| `/admin/atividades` | Histórico de atividades |

### 4.1 Visão geral (`/admin`)

Filas de trabalho (cartões com número e link):
- Cadastros aguardando análise
- Indicações em análise
- Possíveis duplicidades
- Modalidades a validar
- Parcelas a liberar (contrato assinado ou gravação iniciada sem liberação)
- Parcelas liberadas aguardando pagamento (com total em R$)

Gráficos não são necessários nesta fase.

### 4.2 Afiliados

- Lista com busca, filtro por situação, colunas: nome, cidade/UF, perfil, setores, origem (utm_source/campaign), data, situação, nº de indicações.
- Detalhe: dados do cadastro, origem completa, aceites (versão e data), indicações do afiliado, histórico.
- Ações (conforme `capacidades`): **Aprovar**, **Recusar** (motivo obrigatório), **Suspender** (motivo obrigatório), **Reativar**. Toda ação abre confirmação com resumo.

### 4.3 Empresas indicadas

- Lista com filtros por etapa comercial, modalidade pretendida, "possível duplicidade", afiliado, segmento, UF.
- Detalhe:
  - Dados da empresa e do contato; confirmação de autorização do contato.
  - **Painel de duplicidade** (dados vindos do backend): outras indicações com mesmo CNPJ, nome + cidade parecidos ou mesmo telefone, com data e afiliado. Ações: "Não é duplicada", "Marcar como duplicada" (encerra com motivo).
  - **Validar modalidade**: seletor com as 3 modalidades + justificativa obrigatória quando diferente da pretendida. Mostra as parcelas que serão geradas (calculadas pelo backend na resposta).
  - **Etapa comercial**: avançar/encerrar com data do evento e observação. Avançar para `contrato_assinado` e `em_gravacao` pede confirmação explícita, pois liberam parcelas.
  - Histórico da indicação.

### 4.4 Comissões

- Lista de parcelas com filtros por situação financeira, afiliado, modalidade, período.
- Ações conforme `capacidades`: **Liberar parcela** (exibe o gatilho e a data do evento), **Cancelar parcela** (motivo obrigatório).

### 4.5 Pagamentos

- Histórico: data, afiliado, valor, nº de parcelas, referência, registrado por.
- **Registrar pagamento**: escolher afiliado → marcar parcelas `liberada` → informar data e referência do comprovante → revisar total → confirmar. O total exibido é recalculado pelo backend na confirmação; divergência bloqueia o registro.
- Texto fixo em homologação: "Registro de controle. Nenhuma transferência é feita por este sistema."

### 4.6 Histórico de atividades

- Lista cronológica: data/hora (fuso de Brasília, com UTC no detalhe), quem, ação, alvo, detalhe.
- Filtros por tipo de ação, ator, período. Somente leitura.
