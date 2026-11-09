# Frontend v2 · 02 — Landing page e cadastro

Público: visitante de anúncio (Facebook, Instagram, TikTok), no celular, com atenção de poucos segundos. Objetivo único da página: **iniciar o cadastro**.

## 1. Rotas públicas

| Rota | Conteúdo |
|---|---|
| `/` | Landing completa |
| `/cadastro` | Formulário de cadastro em página própria (destino direto de anúncios e do botão principal no celular) |
| `/cadastro/enviado` | Confirmação de envio |
| `/entrar` | Login |
| `/termos` | Termos de Participação (texto fornecido pela OperumData) |
| `/privacidade` | Aviso de Privacidade (texto fornecido pela OperumData) |

Roteamento por History API com fallback para `index.html` (o servidor de prévia e o Express precisam devolver `index.html` para essas rotas). Todos os links de navegação são `<a href>` reais, não botões.

**Comportamento do botão principal:** rola até `#cadastro`. A rota `/cadastro` existe para anúncios que levam direto ao formulário. As duas usam o mesmo componente.

## 2. Cabeçalho e elementos fixos

- **Faixa de homologação** (somente fora de produção): uma linha, fundo `#FFF1EB`, texto `#7C2D12`: "HOMOLOGAÇÃO · versão para aprovação · o cadastro ainda não envia dados". Precisa conter a palavra `HOMOLOGAÇÃO` (exigida pelo teste existente).
- **Cabeçalho** (56 px, branco, borda inferior `--color-line`): logotipo OperumData Afiliados à esquerda; à direita "Entrar" (link) e, a partir de 768 px, botão "Quero ser afiliado".
- **Botão fixo no rodapé (celular):** aparece depois que o botão do herói sai da tela e some quando o formulário de cadastro está visível. 56 px, laranja, texto "Quero ser afiliado". Usar `IntersectionObserver`. Respeitar `env(safe-area-inset-bottom)`.
- **Controles de demonstração:** nunca no topo. Botão flutuante pequeno "Demo" no canto inferior esquerdo, só quando o modo demonstração estiver ativo, abrindo um painel com os perfis fictícios.

## 3. Seções da landing (ordem final, revisão 2 aprovada em 09/11/2026)

Diretrizes da revisão do Wagner: preservar a direção visual (fundo claro, preto, laranja), reduzir espaços verticais, não repetir informações, reforçar o benefício para o empresário e manter textos curtos. A referência `referencia-landing.html` é a fonte visual e de texto: **usar os textos exatamente como estão nela**.

Ordem: 1 Oportunidade · 2 Quanto você ganha · 3 O que você leva ao empresário (com empresas procuradas) · 4 Como funciona + Quem é a OperumData + Facebook · 5 Cadastro · 6 Perguntas frequentes · Rodapé.

Espaçamento: seções com 40 px de respiro vertical no celular e 64 px no desktop; herói 22/32 px no celular.

### Seção 1 — Oportunidade (herói)

Meta: em 360 × 640 e 390 × 844, título, "R$ 300" e botão principal visíveis sem rolar.

```
[sobretítulo]  PROGRAMA DE INDICAÇÃO OPERUMDATA
[H1]           Conhece donos de empresas?
               Ganhe até R$ 300 por empresa que fechar contrato.
[apoio]        Apresente ao empresário uma oportunidade de participação remunerada em projetos
               internacionais de inteligência artificial e robótica. A OperumData avalia e formaliza.
[faixa]        R$ 50 Indicação · R$ 150 Apresentação · R$ 300 Prospecção completa   (só no celular)
[botão]        QUERO SER AFILIADO
[selos]        ✓ Sem custo de adesão  ✓ Sem experiência em vendas  ✓ Cadastro sujeito à aprovação
```

- Desktop: coluna direita com cartão "Comissão por empresa" (R$ 50 / R$ 150 / R$ 300); a faixa de valores some.
- "R$ 300" em `#FF5A1F`, peso 800.

### Seção 2 — Quanto você ganha (`#ganhos`)

Título: **Quanto você ganha por empresa** · Apoio: "O valor depende da sua participação no negócio."

| | R$ 50 · Indicação | R$ 150 · Apresentação e qualificação | R$ 300 · Prospecção completa (selo "Maior comissão") |
|---|---|---|---|
| Texto | Você passa o contato autorizado de um responsável pela empresa. A OperumData negocia. | Você apresenta o projeto, qualifica a empresa e encaminha para formalização. | Você prospecta, visita, qualifica, conduz a negociação autorizada e acompanha até o início das gravações. |
| Pagamento | após contrato assinado e indicação validada. | após contrato assinado e participação validada. | R$ 150 na contratação validada + R$ 150 no início efetivo das gravações. |

Nota: "Os valores não se somam: cada empresa gera uma única comissão, definida pela atuação validada pela OperumData."

### Seção 3 — O que você leva ao empresário (`#empresario`)

Objetivo: o afiliado entende que apresenta uma **oportunidade de participação remunerada**, não uma venda nem um pedido de informações.

- Título: **O que você leva ao empresário** · Apoio: "Uma oportunidade de participação remunerada, não uma venda."
- Destaque (borda esquerda laranja): "As empresas participantes podem receber remuneração por atividades profissionais gravadas e aprovadas em projetos internacionais de inteligência artificial e robótica." + linha menor "A participação depende de avaliação e autorização."
- Subtítulo **Empresas que procuramos**: "Empresas comuns, com trabalho real no dia a dia. De preferência com 5 ou mais profissionais."
- Grade compacta (2 colunas no celular, 3 no desktop), ícone + nome: Energia e utilidade pública · Hotelaria e serviços operacionais · Confecção e vestuário · Construção civil · Oficinas e manutenção · Indústrias.

### Seção 4 — Como funciona + Quem é a OperumData (`#como-funciona`, `#sobre`)

Duas colunas no desktop, empilhadas no celular.

**Como funciona** (4 passos, uma linha cada): Cadastre-se — Gratuito e rápido · Seja aprovado — A equipe analisa seu perfil · Indique empresas — Pelo seu painel de afiliado · Acompanhe e receba — Cada etapa e cada comissão.

**Quem é a OperumData:** "A OperumData é uma empresa brasileira que conecta operações reais de trabalho a projetos internacionais de inteligência artificial e robótica. Identificamos empresas, organizamos oportunidades e acompanhamos operações em campo." + link "Conheça o site institucional" → `https://operumdata.com/`.

**Convite do Facebook** (discreto, abaixo do texto, separado por linha fina): ícone do Facebook, "Acompanhe novidades dos projetos na página oficial." e botão neutro (branco, borda cinza, texto escuro, 15 px) **Seguir OperumData no Facebook** → `https://www.facebook.com/operumdata/` em nova aba (`rel="noopener"`).
- Nunca laranja e nunca maior que o botão principal.
- Sem SDK, pixel ou plugin de curtir; nunca afirmar que a pessoa curtiu ou segue; o cadastro não depende do clique.

"Quem pode participar" **não** aparece nesta seção; fica só no FAQ e no selo "Sem experiência em vendas" do herói.

### Seção 5 — Cadastro (`#cadastro`)

Título: **Faça seu cadastro** · Apoio: "Gratuito. Você recebe o retorno após a análise." Formulário do item 4.

### Seção 6 — Perguntas frequentes (`#duvidas`)

Acordeão `<details>/<summary>`, todas fechadas por padrão. Textos exatos:

1. **Preciso vender algum produto?** Não. Você apresenta uma oportunidade de participação remunerada. A OperumData avalia a empresa e formaliza o contrato.
2. **Quanto recebo em cada modalidade?**
   - R$ 50 · Indicação: após contrato assinado e indicação validada.
   - R$ 150 · Apresentação e qualificação: após contrato assinado e participação validada.
   - R$ 300 · Prospecção completa: R$ 150 na contratação validada. Os outros R$ 150 só são pagos quando as gravações começarem de fato.
   - Os valores não se somam: cada empresa gera uma única comissão.
3. **Quem pode participar?** Pessoas com relacionamento com empresários ou capacidade de identificar e apresentar empresas. Não é necessário ter experiência prévia em vendas. O cadastro está sujeito à aprovação da OperumData.
4. **E se a empresa já tiver sido indicada?** A OperumData verifica oportunidades já cadastradas ou em negociação. A atribuição da indicação será analisada conforme as regras do programa, evitando duplicidades.
5. **Tem algum custo para participar?** Não. O cadastro é gratuito.
6. **Como acompanho minhas indicações?** Pelo painel do afiliado, liberado após a aprovação, com a etapa de cada empresa e a situação de cada comissão.

### Rodapé

OperumData Afiliados · links: Termos de Participação, Aviso de Privacidade, Site institucional, Facebook. Em homologação: "Ambiente de homologação. Nenhum cadastro ou pagamento real é processado."

## 4. Formulário de cadastro

### 4.1 Estrutura em duas etapas

Um único componente com duas etapas visíveis ("Etapa 1 de 2"), sem recarregar a página. Reduz a sensação de formulário longo no celular.

**Etapa 1 — Seus dados**

| Campo | Tipo | Validação de interface | Observação |
|---|---|---|---|
| Nome completo | `text`, `autocomplete="name"` | obrigatório, 2 palavras ou mais, até 120 caracteres | |
| E-mail | `email`, `autocomplete="email"`, `inputmode="email"` | obrigatório, formato válido, até 254 | sugerir correção de domínio comum (gmial → gmail) |
| WhatsApp | `tel`, `autocomplete="tel-national"`, `inputmode="numeric"` | obrigatório, DDD válido + 8 ou 9 dígitos | máscara `(00) 00000-0000`; enviado como `+55DDNNNNNNNNN` |
| Cidade | `text`, `autocomplete="address-level2"` | obrigatório, até 80 | |
| UF | `select` com 27 UFs | obrigatório | |

Botão: **Continuar**

**Etapa 2 — Perfil e acesso**

| Campo | Tipo | Validação | Observação |
|---|---|---|---|
| Perfil profissional | `select` | obrigatório | Representante comercial · Consultor · Contador · Corretor · Prestador de serviços para empresas · Empresário · Profissional autônomo · Outro (abre campo de texto, até 60) |
| Setores em que você tem contatos | chips de múltipla seleção (checkbox estilizado) | ao menos 1 | 6 segmentos da landing + "Outros setores" |
| Crie sua senha | `password`, `autocomplete="new-password"` | regra exibida vem de `config.passwordPolicy` | botão mostrar/ocultar; indicador simples da regra atendida |
| Termos | checkbox | obrigatório | "Li e aceito os [Termos de Participação]" (link abre em nova aba) |
| Privacidade | checkbox | obrigatório | "Estou ciente do [Aviso de Privacidade]" |

Botão: **Enviar meu cadastro** · link "← Voltar".

Abaixo do botão da etapa 1: "Não pedimos CPF nem dados bancários no cadastro."

**Não solicitar** CPF, RG, dados bancários, data de nascimento ou endereço completo.

**Senha:** o backend atual exige 12 caracteres. Para tráfego de celular, recomendo mínimo de 8 com bloqueio de senhas comuns (orientação NIST 800-63B). A regra final é do backend; o frontend apenas exibe a regra recebida em configuração, sem duplicar a lógica.

### 4.2 Comportamento de validação

- Validar ao sair do campo (`blur`) e ao enviar; nunca enquanto a pessoa digita o primeiro caractere.
- Erro abaixo do campo, em `--color-danger`, com ícone, `aria-invalid="true"` e `aria-describedby`.
- Ao enviar com erros: resumo no topo do formulário ("Corrija 2 campos para continuar"), foco no primeiro campo inválido.
- Mensagens específicas: "Informe nome e sobrenome", "Confira o e-mail: falta o @", "WhatsApp com DDD, ex.: (11) 98765-4321".
- Os valores digitados ficam preservados ao voltar da etapa 2 para a 1 e após erro de envio. Senha nunca é guardada em armazenamento local.

### 4.3 Estados do envio

| Estado | Interface |
|---|---|
| Enviando | botão desabilitado com indicador e texto "Enviando…"; campos `readonly` |
| Sucesso | rota `/cadastro/enviado`: "Recebemos seu cadastro, {primeiro nome}." · "Próximos passos: 1. Nossa equipe analisa seu perfil. 2. Você recebe o retorno por WhatsApp ou e-mail. 3. Com a aprovação, você já pode indicar empresas." + convite do Facebook + link "Voltar ao site". |
| E-mail já cadastrado | "Este e-mail já tem cadastro. [Entrar] ou use outro e-mail." |
| Validação do servidor | mapear `fieldErrors` para os campos |
| Muitas tentativas (429) | "Muitas tentativas. Aguarde alguns minutos e tente novamente." |
| Falha de rede / 5xx | "Não conseguimos enviar agora. Seus dados continuam aqui. Tente novamente." + botão "Tentar novamente" |
| **Envio ainda não disponível** (nesta fase, em **qualquer** modo, inclusive demo) | Depois de validar os campos, mostrar no próprio formulário: "**Envio ainda não disponível.** Esta versão é para aprovação do frontend. Nenhum dado foi enviado ou armazenado; o envio será habilitado após a integração com o sistema." Os dados digitados continuam no formulário. |

**Regra da revisão 2:** nenhum modo pode mostrar que a inscrição foi recebida ou armazenada antes da integração real. A tela `/cadastro/enviado` é construída, mas só é exibida após resposta de sucesso do backend; no modo demo ela pode ser vista apenas pelo painel "Demo", com a faixa "PRÉVIA DE TELA · nenhum cadastro foi recebido".

### 4.4 Origem de campanha (UTM)

- Na primeira página carregada na sessão, ler apenas: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`.
- Guardar em `sessionStorage` (chave `od.origem`), primeiro toque da sessão, com `landingPath` e `capturedAt`. Sanitizar: até 100 caracteres, `[A-Za-z0-9._-]`.
- Enviar junto com o cadastro no campo `origem`.
- **Não** capturar `fbclid`, `ttclid`, `gclid`, não instalar pixel do Facebook/TikTok, não usar cookies de terceiros, não fazer fingerprint. Qualquer rastreamento adicional exige aprovação e banner de consentimento (LGPD).
- Padrão sugerido para os anúncios: `?utm_source=facebook|instagram|tiktok&utm_medium=paid_social&utm_campaign=afiliados_<mes>&utm_content=<criativo>`.

## 5. Login (`/entrar`)

- E-mail, senha (mostrar/ocultar), botão "Entrar".
- Link "Esqueci minha senha" → estado "Recuperação de senha em breve" (pendente de backend; não fingir envio de e-mail).
- Link "Ainda não participa? Cadastre-se".
- Erro genérico: "E-mail ou senha incorretos." (não revelar qual dos dois).
- Após login, redirecionar conforme `session.user.papel` devolvido pelo backend: afiliado → `/painel`; admin → `/admin`.
