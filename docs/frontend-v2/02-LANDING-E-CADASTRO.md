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

**Comportamento do botão principal:** no desktop, rola até a seção de cadastro da própria landing (`#cadastro`). No celular (< 768 px), também rola até `#cadastro`; a rota `/cadastro` existe para anúncios que levam direto ao formulário. As duas usam o mesmo componente de formulário.

## 2. Cabeçalho e elementos fixos

- **Faixa de homologação** (somente fora de produção): uma linha, 32 px, fundo `#FFF1EB`, texto `#7C2D12`: "HOMOLOGAÇÃO · dados fictícios · nenhum cadastro é enviado". Precisa conter a palavra `HOMOLOGAÇÃO` (exigida pelo teste existente).
- **Cabeçalho** (56 px, branco, borda inferior `--color-line`): logotipo OperumData Afiliados à esquerda; à direita "Entrar" (link) e, a partir de 768 px, botão "Quero ser afiliado".
- **Botão fixo no rodapé (celular):** aparece depois que o botão do herói sai da tela e some quando o formulário de cadastro está visível. 56 px, laranja, texto "Quero ser afiliado". Usar `IntersectionObserver`. Respeitar `env(safe-area-inset-bottom)`.
- **Controles de demonstração:** nunca no topo. Botão flutuante pequeno "Demo" no canto inferior esquerdo, só quando o modo demonstração estiver ativo, abrindo um painel com os perfis fictícios.

## 3. Seções da landing (ordem final)

A ordem pedida foi mantida, com um ajuste: a seção de cadastro continua na 6ª posição, mas o botão fixo e as âncoras garantem que o formulário esteja sempre a um toque.

### Seção 1 — Oportunidade (herói)

Meta: no celular 390 × 844 **e** 360 × 640, título, "R$ 300" e botão principal visíveis sem rolar.

```
[sobretítulo]  PROGRAMA DE INDICAÇÃO OPERUMDATA
[H1]           Conhece donos de empresas?
               Ganhe até R$ 300 por empresa que fechar contrato.
[apoio]        Você apresenta a empresa. A OperumData cuida da negociação.
               Você recebe quando o contrato é assinado.
[faixa]        R$ 50 Indicação · R$ 150 Apresentação · R$ 300 Prospecção completa
[botão]        QUERO SER AFILIADO
[link]         Ver quanto posso ganhar ↓
[selos]        ✓ Você não vende produto  ✓ Sem custo de adesão  ✓ Cadastro sujeito à aprovação
```

- No desktop, coluna direita com um cartão-resumo dos três valores (sem rotação, sem gradiente) ou foto real autorizada.
- "R$ 300" em `#FF5A1F`, peso 800.

### Seção 2 — Quanto você ganha (`#ganhos`)

Título: **Quanto você ganha por empresa**
Apoio: "O valor depende da sua participação. Cada empresa gera uma única comissão."

Três cartões, empilhados no celular, lado a lado no desktop. O de R$ 300 com selo "Maior comissão" e borda laranja.

| | R$ 50 | R$ 150 | R$ 300 |
|---|---|---|---|
| Nome | Indicação | Apresentação e qualificação | Prospecção completa |
| Frase | Você indica. A OperumData negocia. | Você apresenta e qualifica. | Você conduz do início ao fim. |
| O que você faz | Passa o contato de um responsável pela empresa, com a autorização dele. | Apresenta o projeto ao responsável, confirma o interesse e as informações da empresa e encaminha para formalização. | Prospecta, visita a empresa, qualifica, conduz a negociação autorizada pela OperumData e acompanha até o início das gravações. |
| Quando recebe | Após contrato assinado e indicação validada. | Após contrato assinado e participação validada. | R$ 150 na contratação validada + R$ 150 no início das gravações. |

Nota abaixo dos cartões (14 px, `--color-text-2`):
"As comissões não se somam. O valor final é definido pela atuação comprovada e validada pela OperumData. Sem custo de adesão."

Botão ao final: "Quero ser afiliado".

### Seção 3 — Como funciona (`#como-funciona`)

Quatro passos numerados, linha vertical no celular, horizontal no desktop:

1. **Cadastre-se** — Leva poucos minutos e não tem custo.
2. **Seja aprovado** — Nossa equipe analisa seu perfil e retorna pelo WhatsApp ou e-mail. `[A CONFIRMAR: prazo]`
3. **Indique empresas** — Registre as empresas pelo seu painel e escolha como vai participar.
4. **Acompanhe e receba** — Veja cada etapa da negociação e o status das suas comissões.

Bloco de apoio (fundo `--color-bg-alt`), duas colunas no desktop:
- **Quem pode participar:** Pessoas com bom relacionamento com donos e gestores de empresas: representantes comerciais, consultores, contadores, corretores, prestadores de serviço e empreendedores. `[A CONFIRMAR: idade mínima, PF/PJ]`
- **O que a empresa recebe:** `[A CONFIRMAR com a OperumData — texto curto de 1 a 2 frases]`

### Seção 4 — Empresas que procuramos (`#empresas`)

Título: **Empresas comuns, com trabalho real acontecendo todo dia**
Apoio: "Não precisa ser empresa de tecnologia. Procuramos negócios estruturados, de preferência com 5 ou mais profissionais."

Grade de 6 cartões (2 colunas no celular, 3 no desktop), cada um com ícone de traço e nome:
- Energia e serviços de utilidade pública
- Hotelaria e serviços operacionais
- Confecção e vestuário
- Construção civil
- Oficinas e manutenção
- Indústrias

### Seção 5 — Quem é a OperumData (`#sobre`)

- Texto curto (até 60 palavras) sobre a atuação em projetos internacionais de IA e robótica. `[A CONFIRMAR: fatos e números autorizados]`. Não inventar clientes, países ou números.
- Link "Conheça a OperumData" → `https://operumdata.com/` (`target="_blank" rel="noopener"`).
- **Convite do Facebook** (cartão separado, fundo branco, borda):
  - Título: "Acompanhe a OperumData no Facebook"
  - Texto: "Veja novidades dos projetos e do programa de indicação."
  - Botão contornado: **SEGUIR OPERUMDATA NO FACEBOOK** → `https://www.facebook.com/operumdata/` em nova aba (`rel="noopener"`).
  - Regras: link direto simples, sem SDK do Facebook, sem pixel, sem plugin de curtir. Nunca exibir "Você curtiu" ou "Obrigado por seguir" após o clique. O cadastro **não** depende do clique.

### Seção 6 — Cadastro (`#cadastro`)

Formulário completo descrito no item 4. Título: **Faça seu cadastro** — Apoio: "Sem custo. Leva poucos minutos. Você recebe o retorno após a análise."

### Seção 7 — Perguntas frequentes (`#duvidas`)

Acordeão com `<details>/<summary>` (acessível sem JavaScript). Máximo de 8 perguntas, respostas de até 3 linhas.

1. **Preciso vender algum produto?** Não. Você indica empresas ou participa da prospecção. A OperumData apresenta o projeto e formaliza o contrato.
2. **Tem algum custo para participar?** Não. O cadastro é gratuito e não há mensalidade.
3. **Quanto e quando eu recebo?** R$ 50, R$ 150 ou R$ 300 por empresa, conforme sua participação. O pagamento acontece depois do contrato assinado e validado; no R$ 300, metade na contratação e metade no início das gravações. `[A CONFIRMAR: prazo e forma de pagamento]`
4. **Quem pode participar?** `[A CONFIRMAR]`
5. **Preciso ter CNPJ?** `[A CONFIRMAR]`
6. **E se outra pessoa já tiver indicado a mesma empresa?** `[A CONFIRMAR: regra de precedência]`
7. **Como acompanho minhas indicações?** Pelo seu painel, com a etapa de cada empresa e a situação de cada comissão.
8. **Participar gera vínculo de emprego?** `[A CONFIRMAR: texto jurídico]`

Ao final: "Ainda tem dúvidas? Leia os Termos de Participação." + botão "Quero ser afiliado".

### Rodapé

OperumData Afiliados · links: Termos de Participação, Aviso de Privacidade, Site institucional, Facebook · "© OperumData". Em homologação: "Ambiente de homologação. Nenhum cadastro ou pagamento real é processado."

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

Botão: **Continuar →**

**Etapa 2 — Perfil e acesso**

| Campo | Tipo | Validação | Observação |
|---|---|---|---|
| Perfil profissional | `select` | obrigatório | Representante comercial · Consultor · Contador · Corretor · Prestador de serviços para empresas · Empresário · Profissional autônomo · Outro (abre campo de texto, até 60) |
| Setores em que você tem relacionamento | chips de múltipla seleção (checkbox estilizado) | ao menos 1 | 6 segmentos da landing + "Outros setores" |
| Crie sua senha | `password`, `autocomplete="new-password"` | regra exibida vem de `config.passwordPolicy` | botão mostrar/ocultar; indicador simples da regra atendida |
| Termos | checkbox | obrigatório | "Li e aceito os [Termos de Participação]" (link abre em nova aba) |
| Privacidade | checkbox | obrigatório | "Estou ciente do [Aviso de Privacidade]" |

Botão: **Enviar meu cadastro** · link "← Voltar".

Abaixo do botão: "Não pedimos CPF nem dados bancários agora. Eles serão solicitados apenas se você for aprovado e tiver comissões a receber."

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
| **Backend ainda não disponível** (modo `api` sem endpoint) | "O cadastro ainda não está aberto. Esta é uma versão de homologação." Nunca simular sucesso. |
| **Modo demonstração** | Sucesso com faixa "SIMULAÇÃO: nenhum dado foi enviado ou salvo." |

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
