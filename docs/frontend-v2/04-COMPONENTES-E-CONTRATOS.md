# Frontend v2 · 04 — Componentes, camada de dados e contratos

## 1. Decisões de arquitetura

- **Continuar sem framework e sem etapa de build.** JavaScript em módulos ES nativos (`<script type="module">`), CSS puro com variáveis. Motivos: o projeto já é assim, a CSP atual (`script-src 'self'`) é respeitada, o carregamento é mínimo e não é preciso criar outro projeto.
- **Nenhum script inline** (a CSP bloqueia). Configuração em arquivo `.js` separado.
- **Telas não conhecem URLs de API.** Telas chamam métodos de um `DataClient`. Existem duas implementações:
  - `DemoClient` — dados fictícios em memória, carregado **somente** quando `config.mode === 'demo'`.
  - `ApiClient` — esqueleto para a integração futura. Nesta fase, todo método rejeita com `ErroIntegracaoPendente` (código `BACKEND_PENDENTE`). As telas tratam esse erro com o estado "Disponível após integração".
- **Não ligar o `ApiClient` à API SQLite provisória** (`/api/register`, `/api/dashboard` etc.). Ela usa percentuais e níveis e será substituída. O backend em `src/` permanece intacto e seus testes devem continuar passando.
- **Endpoints sugeridos abaixo são propostas**, não APIs existentes. O Codex confirma ou ajusta ao projetar o backend sobre a infraestrutura do CRM.

## 2. Estrutura de pastas

```
public/
  index.html                      ← casca única; carrega config.js e js/main.js
  config.js                       ← gerado/servido por ambiente (ver §3)
  assets/
    fonts/                        ← Inter woff2 (opcional)
    img/                          ← somente imagens autorizadas
    icons.svg                     ← sprite de ícones
  css/
    tokens.css                    ← variáveis de cor, tipografia, espaço
    base.css                      ← reset, tipografia, foco, utilitários
    components.css                ← botões, campos, cartões, selos, tabelas, toasts
    landing.css
    app.css                       ← layout das áreas autenticadas
  js/
    main.js                       ← inicialização, escolha do DataClient, roteador
    core/
      router.js                   ← History API, rotas, guardas de acesso
      html.js                     ← template seguro (escape automático)
      format.js                   ← moeda (centavos → R$), datas pt-BR, telefone
      validate.js                 ← validadores puros de interface
      utm.js                      ← captura de origem
      store.js                    ← estado de sessão em memória
      errors.js                   ← classes de erro e mapeamento para mensagens
    data/
      contracts.js                ← enums e typedefs JSDoc (fonte única de vocabulário)
      client.js                   ← interface DataClient + fábrica
      api-client.js               ← esqueleto; métodos rejeitam BACKEND_PENDENTE
      demo/
        demo-client.js            ← implementação fictícia
        fixtures.js               ← dados fictícios (nomes "· fictícia", e-mails .test)
    ui/                           ← componentes de apresentação (sem acesso a dados)
      button.js  field.js  select.js  checkbox.js  chips.js  password-field.js
      stepper.js  card.js  money-card.js  status-badge.js  timeline.js
      data-list.js  empty-state.js  skeleton.js  toast.js  confirm-dialog.js
      env-banner.js  demo-panel.js  sticky-cta.js  facebook-invite.js  faq.js
    pages/                        ← telas: buscam dados via DataClient e montam componentes
      public/  landing.js  cadastro.js  cadastro-enviado.js  entrar.js  termos.js  privacidade.js
      afiliado/  inicio.js  indicacoes.js  indicacao-nova.js  indicacao-detalhe.js  comissoes.js  pagamentos.js  perfil.js  em-analise.js
      admin/  visao-geral.js  afiliados.js  afiliado-detalhe.js  indicacoes.js  indicacao-detalhe.js  comissoes.js  pagamentos.js  pagamento-novo.js  atividades.js
```

Os arquivos atuais `public/app.js`, `public/demo.js`, `public/style.css` e `public/demo.css` são substituídos. Manter no histórico do Git; não manter cópias mortas.

## 3. Configuração e modos

`public/config.js` (servido conforme ambiente, nunca com segredos):

```js
window.OPERUM_CONFIG = Object.freeze({
  environment: 'development' | 'staging' | 'production',
  mode: 'demo' | 'api',            // 'demo' proibido quando environment === 'production'
  apiBaseUrl: '/api/v2',           // usado só pelo ApiClient
  passwordPolicy: { minLength: 12, hint: 'Use 12 ou mais caracteres.' }, // espelha o backend
  links: {
    site: 'https://operumdata.com/',
    facebook: 'https://www.facebook.com/operumdata/',
    termos: '/termos',
    privacidade: '/privacidade'
  },
  termosVersao: 'A_CONFIRMAR',
  privacidadeVersao: 'A_CONFIRMAR'
});
```

Regras:
- `main.js` importa `demo/demo-client.js` **dinamicamente** só se `mode === 'demo'` e `environment !== 'production'`. Se a combinação for inválida, mostrar erro de configuração e não carregar a demo.
- Em modo demo: faixa de homologação, botão flutuante "Demo" e o selo "SIMULAÇÃO" nas ações das áreas internas. **O envio do cadastro público nunca simula recebimento**, nem em modo demo (ver 02 §4.3).
- `tools/preview-frontend.js` passa a servir `config.js` com `environment: 'development', mode: 'demo'` e precisa servir as subpastas com lista de extensões permitidas e proteção contra `..` (path traversal), além de devolver `index.html` para rotas sem extensão.
- O Express em `src/app.js` já serve `public/`. Não alterar sua lógica de API. Se for preciso o fallback de rotas para `index.html`, isso é uma mudança mínima e isolada, com teste.

## 4. Contrato `DataClient`

Todos os métodos retornam `Promise`. Valores monetários **sempre em centavos inteiros**. Datas em ISO 8601 UTC. Identificadores são strings opacas.

```js
/** @interface DataClient */

// Sessão e autenticação
getSessao(): Promise<Sessao | null>
entrar({ email, senha }): Promise<Sessao>
sair(): Promise<void>

// Cadastro de afiliado (público)
enviarCandidatura(dados: CandidaturaAfiliado): Promise<{ id: string, situacao: 'em_analise' }>

// Afiliado autenticado
getResumoAfiliado(): Promise<ResumoAfiliado>
listarMinhasIndicacoes(filtro: { etapa?, busca?, cursor? }): Promise<Pagina<IndicacaoResumo>>
getMinhaIndicacao(id): Promise<IndicacaoDetalhe>
criarIndicacao(dados: NovaIndicacao): Promise<IndicacaoDetalhe>
listarMinhasParcelas(filtro: { situacao?, cursor? }): Promise<Pagina<ParcelaComissao>>
listarMeusPagamentos(filtro: { cursor? }): Promise<Pagina<Pagamento>>
getMeuPerfil(): Promise<PerfilAfiliado>

// Administração
admin.getFilas(): Promise<FilasAdmin>
admin.listarAfiliados(filtro): Promise<Pagina<AfiliadoAdmin>>
admin.getAfiliado(id): Promise<AfiliadoAdminDetalhe>
admin.decidirAfiliado(id, { acao: 'aprovar'|'recusar'|'suspender'|'reativar', motivo? }): Promise<AfiliadoAdminDetalhe>
admin.listarIndicacoes(filtro): Promise<Pagina<IndicacaoAdmin>>
admin.getIndicacao(id): Promise<IndicacaoAdminDetalhe>
admin.resolverDuplicidade(id, { decisao: 'nao_duplicada'|'duplicada', indicacaoOriginalId?, observacao }): Promise<IndicacaoAdminDetalhe>
admin.validarModalidade(id, { modalidade, justificativa? }): Promise<IndicacaoAdminDetalhe>
admin.alterarEtapa(id, { etapa, dataEvento, observacao?, motivoEncerramento? }): Promise<IndicacaoAdminDetalhe>
admin.listarParcelas(filtro): Promise<Pagina<ParcelaComissaoAdmin>>
admin.liberarParcela(id, { observacao? }): Promise<ParcelaComissaoAdmin>
admin.cancelarParcela(id, { motivo }): Promise<ParcelaComissaoAdmin>
admin.listarPagamentos(filtro): Promise<Pagina<PagamentoAdmin>>
admin.registrarPagamento({ afiliadoId, parcelaIds, dataPagamento, referencia, totalEsperadoCentavos }): Promise<PagamentoAdmin>
admin.listarAtividades(filtro): Promise<Pagina<Atividade>>
```

### 4.1 Endpoints sugeridos (PROPOSTA — não existem)

| Método | Rota sugerida |
|---|---|
| `getSessao` | `GET /api/v2/sessao` |
| `entrar` / `sair` | `POST /api/v2/sessao` / `DELETE /api/v2/sessao` |
| `enviarCandidatura` | `POST /api/v2/candidaturas` |
| `getResumoAfiliado` | `GET /api/v2/me/resumo` |
| `listarMinhasIndicacoes` / `criarIndicacao` | `GET` / `POST /api/v2/me/indicacoes` |
| `getMinhaIndicacao` | `GET /api/v2/me/indicacoes/:id` |
| `listarMinhasParcelas` | `GET /api/v2/me/parcelas` |
| `listarMeusPagamentos` | `GET /api/v2/me/pagamentos` |
| `getMeuPerfil` | `GET /api/v2/me/perfil` |
| `admin.*` | `/api/v2/admin/...` espelhando os nomes |

Toda escrita autenticada envia o token CSRF recebido na sessão (mesmo padrão do backend atual: cabeçalho `X-CSRF-Token`, cookie HttpOnly, `credentials: 'same-origin'`).

## 5. Tipos (JSDoc em `data/contracts.js`)

```js
/** @typedef {'em_analise'|'aprovado'|'recusado'|'suspenso'} SituacaoAfiliado */
/** @typedef {'em_analise'|'em_negociacao'|'contrato_assinado'|'em_gravacao'|'encerrada'} EtapaComercial */
/** @typedef {'prevista'|'liberada'|'paga'|'cancelada'} SituacaoFinanceira */
/** @typedef {'indicacao'|'apresentacao'|'prospeccao'} Modalidade */
/** @typedef {'contrato_validado'|'inicio_gravacoes'} GatilhoParcela */
/** @typedef {'energia_utilidades'|'hotelaria_servicos'|'confeccao_vestuario'|'construcao_civil'|'oficinas_manutencao'|'industrias'|'outros'} Segmento */
/** @typedef {'1-4'|'5-19'|'20-99'|'100+'} FaixaProfissionais */
/** @typedef {'representante_comercial'|'consultor'|'contador'|'corretor'|'prestador_servicos'|'empresario'|'autonomo'|'outro'} PerfilProfissional */

/** @typedef {{ utm_source?: string, utm_medium?: string, utm_campaign?: string, utm_content?: string, utm_term?: string, landingPath: string, capturedAt: string }} Origem */

/**
 * @typedef {Object} CandidaturaAfiliado
 * @property {string} nome
 * @property {string} email
 * @property {string} whatsapp            // E.164: +55DDNNNNNNNNN
 * @property {string} cidade
 * @property {string} uf                  // 2 letras
 * @property {PerfilProfissional} perfil
 * @property {string=} perfilOutro
 * @property {Segmento[]} setores         // ao menos 1
 * @property {string} senha               // nunca armazenada no cliente
 * @property {{ versao: string }} aceiteTermos
 * @property {{ versao: string }} cienciaPrivacidade
 * @property {Origem=} origem
 */

/**
 * @typedef {Object} Sessao
 * @property {{ id: string, nome: string, email: string, papel: 'afiliado'|'admin', situacao: SituacaoAfiliado }} usuario
 * @property {string[]} capacidades       // ex.: ['indicacao:criar','admin:afiliado:aprovar'] — decididas pelo backend
 * @property {string} csrf
 */

/**
 * @typedef {Object} NovaIndicacao
 * @property {{ nome: string, cnpj?: string, segmento: Segmento, segmentoOutro?: string, faixaProfissionais: FaixaProfissionais, cidade: string, uf: string, siteOuRede?: string }} empresa
 * @property {{ nome: string, cargo: string, telefone: string, email?: string, autorizouContato: true }} contato
 * @property {Modalidade} modalidadePretendida
 * @property {{ observacoes?: string, dataApresentacao?: string, nivelInteresse?: 'baixo'|'medio'|'alto', resumoQualificacao?: string, dataVisita?: string, proximoPasso?: string, confirmaAcompanhamento?: boolean }} participacao
 */

/**
 * @typedef {Object} ParcelaComissao
 * @property {string} id
 * @property {string} indicacaoId
 * @property {string} empresaNome
 * @property {Modalidade} modalidade
 * @property {number} numero              // 1 ou 2
 * @property {number} totalParcelas       // 1 ou 2
 * @property {number} valorCentavos       // 5000 | 15000
 * @property {GatilhoParcela} gatilho
 * @property {SituacaoFinanceira} situacao
 * @property {string=} liberadaEm
 * @property {string=} pagaEm
 * @property {string=} motivoCancelamento
 */

/**
 * @typedef {Object} IndicacaoResumo
 * @property {string} id
 * @property {string} empresaNome
 * @property {string} cidade
 * @property {string} uf
 * @property {Segmento} segmento
 * @property {EtapaComercial} etapa
 * @property {Modalidade} modalidadePretendida
 * @property {Modalidade|null} modalidadeValidada
 * @property {string} criadaEm
 * @property {string} atualizadaEm
 */

/**
 * @typedef {IndicacaoResumo & {
 *   empresa: NovaIndicacao['empresa'],
 *   contato: NovaIndicacao['contato'],
 *   participacao: NovaIndicacao['participacao'],
 *   historicoEtapas: { etapa: EtapaComercial, data: string, observacao?: string }[],
 *   motivoEncerramento?: string,
 *   parcelas: ParcelaComissao[]
 * }} IndicacaoDetalhe
 */

/**
 * @typedef {Object} ResumoAfiliado
 * @property {{ indicadas: number, emNegociacao: number, contratosAssinados: number, emGravacao: number, encerradas: number }} comercial
 * @property {{ previstaCentavos: number, liberadaCentavos: number, pagaCentavos: number }} financeiro
 * @property {{ texto: string, data: string, indicacaoId?: string }[]} ultimasMovimentacoes
 */

/** @typedef {{ id: string, dataPagamento: string, valorCentavos: number, parcelas: ParcelaComissao[], referenciaCurta?: string }} Pagamento */
/** @typedef {{ id: string, criadoEm: string, ator: { id: string, nome: string } | null, acao: string, alvoTipo: string, alvoId: string, detalhe: string }} Atividade */
/** @template T @typedef {{ itens: T[], proximoCursor: string | null, total?: number }} Pagina */

/**
 * @typedef {Object} IndicacaoAdminDetalhe  // IndicacaoDetalhe + campos internos
 * @property {{ id: string, nome: string, situacao: SituacaoAfiliado }} afiliado
 * @property {{ indicacaoId: string, criterio: 'cnpj'|'nome_cidade'|'telefone', empresaNome: string, afiliadoNome: string, criadaEm: string, etapa: EtapaComercial }[]} possiveisDuplicidades
 * @property {string[]} acoesPermitidas   // ex.: ['validar_modalidade','avancar_etapa','encerrar']
 */

/** @typedef {{ cadastrosEmAnalise: number, indicacoesEmAnalise: number, possiveisDuplicidades: number, modalidadesAValidar: number, parcelasALiberar: number, parcelasLiberadasCentavos: number }} FilasAdmin */
```

Os tipos `AfiliadoAdmin`, `AfiliadoAdminDetalhe`, `IndicacaoAdmin`, `ParcelaComissaoAdmin` e `PagamentoAdmin` estendem os anteriores com dados do afiliado, origem (`Origem`), aceites e `acoesPermitidas`. O Codex completa esses typedefs no mesmo padrão.

### 5.1 Regras que pertencem ao backend (o frontend só exibe)

- Quem pode ver/agir em cada registro (isolamento entre afiliados, papel admin).
- Detecção de duplicidade e precedência.
- Geração das parcelas a partir da modalidade validada (50 / 150 / 150+150).
- Transição de etapas e de situação financeira; liberação ao ocorrer o gatilho.
- Totais financeiros do resumo.
- Política de senha, limite de tentativas, CSRF, sessão.
- Auditoria de toda ação administrativa e financeira.

O frontend pode ter um mapa **apenas de rótulos** (`MODALIDADES = { indicacao: { rotulo, valorCentavos: 5000 } ... }`) para exibir os cartões da landing e da escolha de modalidade. Ele não é usado para calcular valores devidos.

## 6. Modelo de erros

```js
class ErroDados extends Error { codigo; status; fieldErrors /* {campo: mensagem} */ }
```

| `codigo` | Origem | Exibição |
|---|---|---|
| `BACKEND_PENDENTE` | `ApiClient` nesta fase | Estado "Disponível após a integração com o sistema." |
| `VALIDACAO` (400/422) | servidor | erros por campo |
| `NAO_AUTENTICADO` (401) | servidor | redirecionar para `/entrar?voltar=...` |
| `SEM_PERMISSAO` (403) | servidor | "Você não tem acesso a esta área." |
| `NAO_ENCONTRADO` (404) | servidor | estado vazio específico |
| `CONFLITO` (409) | servidor | duplicidade / e-mail já cadastrado |
| `LIMITE` (429) | servidor | aguardar |
| `REDE` / `SERVIDOR` | rede / 5xx | tentar novamente |

## 7. Componentes de interface (resumo)

| Componente | Responsabilidade | Observações de acessibilidade |
|---|---|---|
| `Button` | variantes `primary` (laranja, ≥18 px), `dark`, `outline`, `link`; estado `loading` | `aria-busy`, área de toque ≥ 44 px |
| `Field` / `Select` / `Checkbox` / `Chips` / `PasswordField` | rótulo visível, ajuda, erro | `label for`, `aria-invalid`, `aria-describedby`; chips são `checkbox` reais |
| `Stepper` | etapas do cadastro | "Etapa 1 de 2" anunciado |
| `MoneyCard` | cartão de comissão (landing e escolha de modalidade) | modo `radio` para seleção |
| `StatusBadge` | `tipo: 'comercial'|'financeiro'|'afiliado'` + código → rótulo e cor | cor nunca é a única informação |
| `Timeline` | etapas comerciais | lista ordenada |
| `DataList` | tabela no desktop / cartões no celular, carregar mais | `<table>` com `<caption>` |
| `EmptyState`, `Skeleton`, `Toast` (`aria-live`), `ConfirmDialog` (`<dialog>`, foco preso) | estados | |
| `EnvBanner`, `DemoPanel` | homologação/demonstração | somente fora de produção |
| `StickyCta`, `FacebookInvite`, `Faq` | landing | `Faq` com `<details>` |

Regra: componentes de `ui/` recebem dados por parâmetro e devolvem nós DOM; não importam nada de `data/`.
