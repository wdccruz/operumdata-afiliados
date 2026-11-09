# Frontend v2 · 01 — Análise crítica e estratégia

> Escopo: somente frontend. Nenhuma tabela, migração ou alteração no banco do CRM. Nenhuma publicação em produção.
> Branch de trabalho: `feat/frontend-conversao` (criada a partir de `feat/frontend-demo`, que já contém `feat/homologacao`).

Documentos desta pasta:

| Arquivo | Conteúdo |
|---|---|
| `01-ANALISE-E-ESTRATEGIA.md` | Diagnóstico do frontend atual, revisão da comunicação, identidade visual |
| `02-LANDING-E-CADASTRO.md` | Seções da landing, textos finais, botões, formulário de cadastro, Facebook, UTM |
| `03-AREAS-AFILIADO-E-ADMIN.md` | Telas autenticadas do afiliado e da administração |
| `04-COMPONENTES-E-CONTRATOS.md` | Arquitetura de pastas, componentes, camada de dados e contratos |
| `05-STATUS-E-HOMOLOGACAO.md` | O que fica pronto / simulado / pendente de backend; critérios de teste e aceite |
| `06-PROMPT-CODEX.md` | Prompt técnico para o Codex implementar |
| `referencia-landing.html` | Referência visual estática da landing (não é a implementação) |

---

## 1. Diagnóstico do frontend atual

Analisado na branch `feat/frontend-demo` (commit `27a05a4`): `public/index.html`, `public/app.js` (120 linhas), `public/demo.js`, `public/style.css`, `public/demo.css`, `tools/preview-frontend.js`. Conferido no navegador em 390 × 844.

### 1.1 O que vale manter

- **Leveza técnica.** Sem framework, sem build, sem fontes ou scripts externos. A página carrega rápido e é compatível com a CSP atual (`script-src 'self'`). Manter essa linha.
- **Função `api()` como ponto único de acesso a dados.** Já existe um embrião de separação: as telas chamam `api()` e a demonstração responde por `window.frontendDemo.request`. A v2 formaliza isso.
- **Sinalização honesta de homologação** ("Dados fictícios", "Nenhum pagamento real"). O teste `test/app.test.js` exige o texto `HOMOLOGAÇÃO` na página; manter.
- **Escape de HTML (`esc`)**, mensagens com `aria-live`, foco em acessibilidade básica.

### 1.2 Problemas de conversão (mais graves)

1. **A primeira tela não diz quanto se ganha.** Nenhum valor em reais aparece em nenhuma parte da landing. O título "Sua rede pode ir mais longe" é genérico e não responde às cinco perguntas do visitante (quanto, o quê, quem, preciso vender, como me cadastro).
2. **No celular, o título começa a 389 px do topo.** A faixa de homologação e a barra "Explore a experiência" ocupam quase metade da primeira dobra. O botão principal fica a 643 px. Quem chega de anúncio vê controles de demonstração antes da oferta.
3. **Não existem as seções pedidas:** quanto você ganha, segmentos procurados, credibilidade, Facebook, perguntas frequentes.
4. **O cadastro pede "Nome fictício"** e só tem nome, e-mail e senha. Faltam WhatsApp, cidade/UF, perfil, setores e aceites. A senha mínima de 12 caracteres é uma barreira alta para tráfego de celular.
5. **Não há URLs por tela.** Tudo é trocado por botões no mesmo endereço. Um anúncio não pode apontar direto para `/cadastro`, o botão "voltar" do celular sai do site, e não dá para medir a página de cadastro separadamente.

### 1.3 Problemas de regra de negócio (o frontend ensina o modelo errado)

1. **Comissões percentuais** (5%, 7,5%, 10%) sobre "base de cálculo" e "competência mensal". O programa real paga valores fixos de R$ 50, R$ 150 ou R$ 300 por empresa.
2. **Níveis por quantidade de empresas** ("Inicial", "Crescimento", "Destaque") e barra "faltam X empresas para o próximo nível". Isso não existe no programa e precisa sair.
3. **Status único misturado.** Empresas têm só `pendente/aprovada/recusada`; não há as etapas comerciais (Em análise → Em negociação → Contrato assinado → Em gravação). O financeiro tem só `pendente/pago`; faltam *prevista*, *liberada* e *paga*, e falta a divisão do R$ 300 em duas parcelas de R$ 150.
4. **Indicação exige CNPJ e domínio (site) únicos.** Boa parte do público-alvo (oficinas, confecções, construção) não tem site. Exigir domínio bloqueia indicações legítimas. A verificação de duplicidade deve ficar no backend com critérios mais amplos (CNPJ quando houver, nome + cidade, telefone).

### 1.4 Problemas de arquitetura

- `app.js` mistura roteamento, regras, cálculo de totais, templates e eventos num único arquivo de strings HTML.
- O frontend calcula totais e decide o que é "elegível" para comissão (`eligible = companies.filter(...)`). Na v2, decisões financeiras e de permissão vêm prontas do backend; o frontend só exibe.
- A demonstração (`demo.js`) é carregada sempre, inclusive no servidor Express. Precisa ser carregada **somente** quando o modo demonstração estiver ligado em desenvolvimento/homologação.
- A barra de demonstração é injetada no topo da página para qualquer visitante.

### 1.5 Problemas visuais

- Verde-escuro e verde-limão fora da identidade OperumData.
- Herói em bloco escuro com cartão girado e gradiente radial: decorativo, pesado e sem função.
- Botões usados como links de navegação (sem `href`), o que prejudica acessibilidade e compartilhamento.

---

## 2. Revisão da comunicação proposta

### 2.1 Texto original

> **CONHECE DONOS DE EMPRESAS? GANHE ATÉ R$ 300 POR NEGÓCIO CONCRETIZADO.**
> A OperumData está selecionando pessoas para indicar empresas ou participar da prospecção comercial de projetos internacionais de inteligência artificial e robótica. Você apresenta oportunidades e pode receber comissões conforme sua participação nos negócios concretizados.
> **QUERO SER AFILIADO**
> Sem custo de adesão. Cadastro sujeito à aprovação. Comissões condicionadas aos resultados e às regras do programa.

### 2.2 O que funciona

- A pergunta inicial seleciona o público certo em uma linha ("conhece donos de empresas?").
- Valor concreto em reais. "Até R$ 300" é forte e verificável.
- "Sem custo de adesão" e "sujeito à aprovação" geram confiança e afastam a cara de pirâmide.

### 2.3 O que melhorar

| Ponto | Problema | Proposta |
|---|---|---|
| "por negócio concretizado" | Vago. O visitante não sabe o que é "concretizado". | "por empresa que fechar contrato". |
| "até R$ 300" sozinho | Quem descobrir depois que a maioria ganha R$ 50 sente que foi isca. Isso derruba a confiança e gera reclamação no anúncio. | Mostrar logo abaixo do título os três valores: **R$ 50 · R$ 150 · R$ 300 conforme sua participação**. Mantém o "até R$ 300" como gancho e entrega transparência. |
| Subtítulo com 2 frases e ~45 palavras | Longo para celular. "Prospecção comercial de projetos internacionais" é abstrato. | Uma frase curta com a divisão de papéis: "Você apresenta a empresa. A OperumData cuida da negociação. Você recebe quando o contrato é assinado." |
| Falta dizer o que a empresa ganha | **É a maior lacuna.** O afiliado só indica com confiança se souber o que vai oferecer ao dono da empresa. Sem isso, o visitante não consegue se imaginar fazendo a abordagem. | Incluir uma linha "O que a empresa recebe" na seção Como funciona. **Texto depende de confirmação da OperumData** (ver pendências). |
| "Preciso vender algum produto?" não respondido | A dúvida mais comum de quem vem de anúncio. | Selo logo abaixo do botão: "Você não vende produto. Você indica empresas." |
| "selecionando pessoas" | Pode ser lido como vaga de emprego. Em anúncios Meta, linguagem de emprego pode levar a classificação diferente e reprovação. | Evitar "vaga", "emprego", "salário", "renda garantida". Usar "programa de indicação". |
| "QUERO SER AFILIADO" | Bom. "Afiliado" pode lembrar infoproduto digital para quem vem do TikTok, mas o contexto da página resolve. | Manter. Botão secundário: "Ver quanto posso ganhar" (âncora para os valores). |
| Rodapé de condições | Correto e necessário. | Manter, em linha única abaixo do botão: "Sem custo de adesão · Cadastro sujeito à aprovação · Pagamento após contrato assinado e validado". |

### 2.4 Texto recomendado para a primeira dobra

> Versão final aprovada na revisão 2: ver 02 §3, Seção 1. O bloco abaixo é a proposta original, mantida como histórico.

```
PROGRAMA DE INDICAÇÃO OPERUMDATA                       ← sobretítulo

Conhece donos de empresas?
Ganhe até R$ 300 por empresa que fechar contrato.      ← R$ 300 em laranja

Você apresenta a empresa. A OperumData cuida da negociação.
Você recebe quando o contrato é assinado.

[ R$ 50 Indicação ] [ R$ 150 Apresentação ] [ R$ 300 Prospecção ]   ← faixa compacta

[ QUERO SER AFILIADO ]                                  ← botão principal
Ver quanto posso ganhar ↓                               ← link secundário

✓ Você não vende produto   ✓ Sem custo de adesão   ✓ Cadastro sujeito à aprovação
```

**Teste A/B sugerido para os anúncios** (só quando houver medição autorizada):
- A: "Ganhe até R$ 300 por empresa que fechar contrato."
- B: "Ganhe de R$ 50 a R$ 300 por empresa que fechar contrato."
A versão B tende a converter um pouco menos no clique, mas gera candidatos mais alinhados e menos frustração. Recomendo começar com A **com a faixa de três valores visível**, que é o melhor dos dois.

### 2.5 Tom de voz

- Frases curtas, verbos diretos, "você".
- Números sempre em reais, nunca percentuais.
- Toda promessa de valor acompanhada da condição ("após contrato assinado e validado").
- Nada de "renda extra garantida", "dinheiro fácil", "ganhe sem esforço", contadores regressivos ou escassez falsa.

---

## 3. Identidade visual

### 3.1 Tokens

| Token | Valor | Uso |
|---|---|---|
| `--color-bg` | `#FFFFFF` | Fundo principal |
| `--color-bg-alt` | `#F7F7F5` | Seções alternadas (off-white) |
| `--color-text` | `#111418` | Títulos e texto principal (18,5:1 no branco) |
| `--color-text-2` | `#4B5563` | Texto de apoio (7,6:1) |
| `--color-muted` | `#6B7280` | Legendas, rótulos secundários (4,8:1 no branco; 4,5:1 no off-white) |
| `--color-line` | `#E5E7EB` | Bordas e divisões |
| `--color-accent` | `#FF5A1F` | Botão principal, destaques de valor, ícones de ênfase |
| `--color-accent-strong` | `#C2410C` | **Texto** laranja em tamanho normal, links, foco (5,2:1) |
| `--color-accent-soft` | `#FFF1EB` | Fundo de selo/destaque suave |
| `--color-success` | `#15803D` | Pago, concluído |
| `--color-warning` | `#B45309` | Aguardando, em análise |
| `--color-danger` | `#B91C1C` | Erros, recusado |
| `--radius` | `12px` (cartões), `10px` (botões, campos) | |
| `--shadow-card` | `0 1px 2px rgb(17 20 24 / .06)` | Somente cartões; sem sombras pesadas |

### 3.2 Regra de contraste do laranja (importante)

O laranja `#FF5A1F` com texto branco tem contraste **3,1:1**. Isso só atende WCAG AA para **texto grande** (≥ 18,7 px em negrito ou ≥ 24 px normal). Portanto:

- **Botão principal:** fundo `#FF5A1F`, texto branco, **mínimo 18 px / peso 700** (altura 52–56 px). Atende AA texto grande.
- **Botões pequenos** (tabelas, áreas internas): não usar laranja com texto branco abaixo de 18 px. Usar botão escuro `#111418` com texto branco, ou botão contornado com texto `#C2410C`.
- **Texto e links laranja** em tamanho normal: sempre `#C2410C`, nunca `#FF5A1F`.
- Valores grandes (R$ 300 no título, ≥ 32 px) podem usar `#FF5A1F`.

### 3.3 Tipografia

- Pilha: `Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`.
- Inter **auto-hospedada** (subconjunto latino, woff2, `font-display: swap`) ou apenas fontes do sistema. Nada de Google Fonts ou CDN (CSP e desempenho).
- Escala no celular: H1 32–36 px / 1,15; H2 24 px; corpo 16–17 px / 1,55; legendas 14 px. Nunca menos de 14 px.
- Desktop: H1 até 52 px, `letter-spacing: -0,02em`.

### 3.4 Espaçamento, ícones e imagens

- Grade de 8 px. Seções com 56–72 px de respiro no celular, 96 px no desktop.
- Largura de leitura máxima de 680 px nos textos; conteúdo até 1120 px.
- Ícones de traço simples (1,5–2 px), monocromáticos, inline SVG, 20–24 px.
- **Revisão 4 (09/11/2026):** a pedido do Wagner, o herói usa uma foto de pessoas em ambiente empresarial (`docs/frontend-v2/hero-afiliados.webp`, Unsplash photo-1600880292203-757bb62b4baf, Licença Unsplash: uso comercial gratuito, sem atribuição obrigatória). No celular, a foto fica abaixo do botão para não empurrar o cadastro; no desktop, ocupa a coluna direita com o cartão de comissões sobreposto. O Codex deve hospedar a imagem localmente em `public/assets/img/` (sem CDN externo) e trocá-la por foto real da OperumData quando houver.
- Imagens: **somente fotos reais fornecidas pela OperumData** (equipe, gravações, empresas parceiras com autorização). Não usar banco de imagens com pessoas genéricas sorrindo. Até receber as fotos, usar blocos neutros com ícones. Toda imagem com `width`/`height`, `loading="lazy"` (exceto acima da dobra) e WebP/AVIF ≤ 120 KB.
- Animação: apenas transições de 150–200 ms em hover/foco; respeitar `prefers-reduced-motion`.

---

## 4. Pendências de negócio que afetam textos e telas

**Atualização 09/11/2026 (revisão 2):** a OperumData forneceu os textos de "O que a empresa recebe", "Quem pode participar", "Empresas já indicadas" e "Quem é a OperumData" (ver 02 §3). A landing não tem mais nenhum `[A CONFIRMAR]`. Os itens 1, 2 (parcialmente), 4 e 8 abaixo estão resolvidos para a landing; os demais continuam pendentes e afetam apenas telas internas, Termos e Aviso de Privacidade.

1. **O que a empresa indicada recebe ou paga ao participar dos projetos?** (essencial para a abordagem do afiliado)
2. **Regra de duplicidade:** se duas pessoas indicarem a mesma empresa, qual indicação vale? Existe prazo de validade da indicação?
3. **Prazo de pagamento** após a comissão ser liberada, e forma de pagamento (Pix, transferência, nota fiscal para PJ).
4. **Requisitos de participação:** idade mínima, pessoa física e/ou jurídica, regiões atendidas.
5. **Prazo médio de análise** do cadastro e canal de retorno (WhatsApp, e-mail).
6. **Comissão cancelada** se o contrato for rescindido antes das gravações? E a segunda parcela do R$ 300 se as gravações não começarem?
7. **Textos jurídicos:** Termos de Participação e Aviso de Privacidade (versão, URL) e frase sobre ausência de vínculo empregatício.
8. **Fatos para credibilidade:** países, parceiros, projetos e números que podem ser citados publicamente; fotos autorizadas.
