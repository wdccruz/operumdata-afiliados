# Frontend v2 · 07 — Parceria de Prospecção Comercial Remota

Modalidade para profissionais de telemarketing ativo, televendas e prospecção comercial. Ela é **separada** do programa de indicação (R$ 50 / R$ 150 / R$ 300), que continua igual.

> Nesta etapa existem só as páginas públicas e a especificação do painel. Não há banco, autenticação, distribuição de empresas nem pagamento. O backend e as permissões reais serão feitos depois pelo Codex com o **Supabase**. Nada aqui cria tabelas ou altera o CRM.

## 1. O que já está no frontend

| Item | Arquivo | Situação |
|---|---|---|
| Destaque "Tem experiência em telemarketing?" na página principal, depois de "Transforme seus contatos em comissões" | `public/index.html` (`#prospeccao-remota`) | Pronto |
| Link discreto no herói da página principal para o destaque | `public/index.html` (`.hero-alt`) | Pronto |
| Página exclusiva | `public/prospeccao-remota.html` | Pronto |
| Formulário de candidatura em 2 etapas, validação, máscara, captura de UTM | mesma página + `public/js/landing.js` | Pronto, **sem envio**: mostra "Envio ainda não disponível" |
| Painel do prospector | este documento, §4 | Especificado, não implementado |

Regras de comunicação aplicadas: o nome público é **Parceria de Prospecção Comercial Remota**; sem nomes de clientes internacionais; sem as expressões "vaga de emprego", "salário" ou "contratação de telemarketing"; sem promessa de ganho garantido.

### 1.1 Autonomia real (ajuste obrigatório de 09/11/2026)

A parceria é comercial, independente, por oportunidade e resultado. A plataforma inteira (páginas, painel e administração) deve refletir isso:

- Sem jornada fixa, controle de horas ou obrigação de disponibilidade. A disponibilidade do formulário é **opcional e só informativa**.
- Sem metas mínimas obrigatórias de ligações ou reuniões. Nenhuma tela cobra volume, ranking ou tempo conectado.
- Sem exclusividade.
- O parceiro **aceita ou recusa** cada lista de empresas oferecida.
- O painel acompanha empresas, reuniões, contratos e comissões, **não produtividade por hora**.
- Comissão de R$ 150 quando a contratação for efetivamente assinada e a origem validada.
- A OperumData conduz a reunião e a formalização contratual.
- A página tem a seção "Condições da parceria" e um aviso de aceite contratual: os termos completos são apresentados após a aprovação e o texto jurídico está em revisão. **Não afirmar que o aceite dos termos elimina vínculo trabalhista.** Nenhum cadastro ou parceria é ativado antes da aprovação jurídica.

## 2. Comissão da modalidade

- **R$ 150 por empresa** que assinar contrato com a OperumData a partir da prospecção validada. Parcela única.
- Não há pagamento por ligação, contato interessado ou reunião agendada.
- Contrato na própria reunião: comissão devida após assinatura e validação.
- Contrato posterior: a oportunidade continua vinculada ao prospector "conforme as regras do programa". **[A CONFIRMAR]** prazo de vínculo (ex.: 90 dias após a reunião) e o que acontece se outro canal trouxer a mesma empresa.
- Não se soma às modalidades do programa de indicação: cada empresa gera uma única comissão, para um único dono validado.

## 3. Candidatura (formulário público)

Identificação interna: `tipo = 'candidato_prospector_remoto'` (o formulário do programa de indicação usa `afiliado_indicador`). O valor vem de `form[data-tipo]`.

```js
/** @typedef {'telemarketing_ativo'|'televendas'|'vendas_b2b'|'agendamento_reunioes'|'outra'} ExperienciaPrincipal */
/** @typedef {'menos_1'|'1_3'|'3_5'|'mais_5'} TempoExperiencia */
/** @typedef {'eventual'|'alguns_dias'|'maioria_dias'} DisponibilidadeInformativa */

/** @typedef {Object} CandidaturaProspector
 * @property {'candidato_prospector_remoto'} tipo
 * @property {string} nome
 * @property {string} whatsapp            só dígitos, 10 ou 11
 * @property {string} email
 * @property {string} cidade
 * @property {string} uf
 * @property {ExperienciaPrincipal} experienciaPrincipal
 * @property {TempoExperiencia} tempoExperiencia
 * @property {DisponibilidadeInformativa} [disponibilidade]  opcional, só informativa
 * @property {boolean} possuiEquipamento   computador e meio adequado para ligações
 * @property {{ privacidadeECondicoes: { versao: string, aceitoEm: string } }} aceites
 * @property {Origem} [origem]              UTM da sessão (02 §4.4)
 */
```

- Sem CPF, RG, dados bancários ou Pix. Sem senha nesta etapa: o acesso ao painel é criado só depois da aprovação (convite por e-mail).
- `DataClient.enviarCandidaturaProspector(dados)` → `{ id, situacao: 'em_analise' }`. No `ApiClient` atual rejeita com `BACKEND_PENDENTE`.
- Situações do candidato: `em_analise` → `aprovado` | `recusado`; depois `suspenso` / `reativado`. Mesmo vocabulário de `SituacaoAfiliado`.

## 4. Painel do prospector (planejado)

Rotas propostas (atrás de login, papel `prospector`):

| Rota | Tela | Conteúdo |
|---|---|---|
| `/prospector` | Resumo | Listas oferecidas aguardando sua decisão, empresas aceitas, retornos que você agendou, reuniões, contratos fechados, comissões previstas / liberadas / pagas |
| `/prospector/listas` | Listas oferecidas | Cada lista com quantidade e setores; botões **Aceitar** e **Recusar** (sem justificativa obrigatória) |
| `/prospector/empresas` | Minhas empresas | Só as empresas de listas que esta pessoa aceitou, com filtro por resultado e próxima ação. Pode devolver uma empresa a qualquer momento |
| `/prospector/empresas/:id` | Empresa | Dados comerciais autorizados para contato, orientações de abordagem, histórico de ligações, botão "Registrar contato" |
| `/prospector/reunioes` | Reuniões | Reuniões agendadas e realizadas, com a etapa atual |
| `/prospector/contratos` | Contratos | Empresas que assinaram, com a situação da comissão |
| `/prospector/comissoes` | Comissões | Parcelas `prevista` / `liberada` / `paga` / `cancelada` |

**Registrar contato** (formulário curto, celular primeiro):

- Resultado: `nao_atendeu` · `numero_invalido` · `retornar` · `sem_interesse` · `interessado` · `reuniao_agendada`
- Observação (texto curto)
- Próxima ação e data de retorno (obrigatória quando o resultado for `retornar` ou `interessado`)
- Data e hora da reunião (obrigatória quando `reuniao_agendada`), com aviso de que a reunião é feita pela equipe OperumData

Status comercial e financeiro aparecem em blocos separados, como no painel do afiliado (03).

O painel **não** mostra: horas trabalhadas, tempo online, ligações por hora, metas, ranking entre parceiros ou alertas de inatividade. O registro de contato existe para o parceiro organizar os próprios retornos e para a OperumData validar a origem da oportunidade.

**Administração** ganha: fila de candidatos a prospector, ofertas de listas (oferecer, ver aceite/recusa, recolher empresas devolvidas, transferir com motivo), visão de reuniões agendadas para a equipe comercial e validação da origem da oportunidade.

## 5. Contratos de dados do painel

```js
/** @typedef {'nao_atendeu'|'numero_invalido'|'retornar'|'sem_interesse'|'interessado'|'reuniao_agendada'} ResultadoContato */
/** @typedef {'oferecida'|'aceita'|'recusada'|'devolvida'|'transferida'|'expirada'|'convertida'} SituacaoAtribuicao */

/** @typedef {Object} EmpresaAtribuida
 * @property {string} atribuicaoId
 * @property {string} empresaId
 * @property {string} nomeEmpresa
 * @property {string} cidade
 * @property {string} uf
 * @property {string} [setor]
 * @property {{ nome?: string, cargo?: string, telefone: string, email?: string }} contatoAutorizado
 * @property {string} [orientacao]          roteiro ou observação da OperumData
 * @property {SituacaoAtribuicao} situacao
 * @property {ResultadoContato} [ultimoResultado]
 * @property {{ descricao: string, data: string }} [proximaAcao]
 * @property {string} atribuidaEm
 * @property {string} [expiraEm]
 */

/** @typedef {Object} OfertaLista
 * @property {string} id
 * @property {number} quantidadeEmpresas
 * @property {string[]} setores
 * @property {'oferecida'|'aceita'|'recusada'|'expirada'} situacao
 * @property {string} oferecidaEm
 * @property {string} [expiraEm]
 */

/** @typedef {Object} RegistroContato
 * @property {string} id
 * @property {string} atribuicaoId
 * @property {ResultadoContato} resultado
 * @property {string} [observacao]
 * @property {{ descricao: string, data: string }} [proximaAcao]
 * @property {string} [reuniaoEm]
 * @property {string} registradoEm
 */

/** @typedef {Object} ReuniaoAgendada
 * @property {string} id
 * @property {string} atribuicaoId
 * @property {string} nomeEmpresa
 * @property {string} dataHora
 * @property {'agendada'|'realizada'|'remarcada'|'cancelada'|'nao_compareceu'} situacao
 * @property {EtapaComercial} etapa         etapa comercial da oportunidade (04 §5)
 */
```

Métodos do `DataClient` (todos rejeitam com `BACKEND_PENDENTE` no `ApiClient` desta fase):

```js
enviarCandidaturaProspector(dados: CandidaturaProspector)
prospector.getResumo(): Promise<ResumoProspector>
prospector.listarOfertas(): Promise<Pagina<OfertaLista>>
prospector.responderOferta(ofertaId, { decisao: 'aceitar'|'recusar' }): Promise<OfertaLista>
prospector.devolverEmpresa(atribuicaoId, { observacao? }): Promise<EmpresaAtribuida>
prospector.listarCarteira(filtro: { resultado?, retornoAte?, busca?, cursor? }): Promise<Pagina<EmpresaAtribuida>>
prospector.getEmpresa(atribuicaoId): Promise<EmpresaAtribuida & { contatos: RegistroContato[] }>
prospector.registrarContato(atribuicaoId, dados): Promise<RegistroContato>
prospector.listarReunioes(filtro): Promise<Pagina<ReuniaoAgendada>>
prospector.listarContratos(filtro): Promise<Pagina<IndicacaoResumo>>
prospector.listarParcelas(filtro): Promise<Pagina<ParcelaComissao>>
admin.listarCandidatosProspector(filtro) / admin.decidirProspector(id, { acao, motivo? })
admin.oferecerLista({ prospectorId, empresaIds, expiraEm? })   // vira atribuição só após aceite
admin.devolverAtribuicao(id, { motivo }) / admin.transferirAtribuicao(id, { paraProspectorId, motivo })
admin.validarOrigem(indicacaoId, { atribuicaoId, decisao, observacao? })
```

Endpoints sugeridos (PROPOSTA, não existem): `POST /api/v2/candidaturas-prospector`, `GET /api/v2/prospector/...`, `POST /api/v2/prospector/empresas/:id/contatos`, `/api/v2/admin/prospectores/...`, `/api/v2/admin/atribuicoes/...`. Se o Codex usar o cliente do Supabase direto no navegador, o `ApiClient` troca `request()` pelas chamadas do SDK, mantendo a mesma interface.

## 6. Regras que pertencem ao backend (Supabase, fase seguinte)

O frontend só exibe. A proteção real é do banco e das funções do servidor:

- **Uma atribuição ativa por empresa.** Ex.: índice único parcial em `atribuicoes(empresa_id) where situacao in ('oferecida','aceita')`. A empresa só fica com o parceiro depois do aceite; recusa ou devolução a libera. Distribuir, devolver ou transferir só pela administração, com registro de quem fez e por quê.
- **Isolamento.** Políticas RLS para o prospector ler apenas as atribuições onde `prospector_id = auth.uid()` e os registros de contato dessas atribuições. Nenhuma consulta pública lista empresas.
- **Dados de contato só os autorizados**, sem expor outros campos do cadastro da empresa.
- **Comissão de R$ 150** gerada pelo servidor quando o contrato é assinado e a origem é validada; nunca a partir de dados vindos do navegador.
- **Vínculo após a reunião** conforme o prazo que a OperumData definir ([A CONFIRMAR]).
- Candidato a prospector e afiliado indicador são cadastros separados; a mesma pessoa pode ter os dois, mas cada empresa gera uma única comissão.
- Auditoria de atribuições, contatos registrados, validações e pagamentos.

Proposta de tabelas, só para referência do Codex (não criar agora): `prospectores`, `atribuicoes`, `registros_contato`, `reunioes`, mais o vínculo `indicacoes.atribuicao_id` para a origem da oportunidade.

## 7. Critérios de homologação desta modalidade

- [ ] Destaque visível na página principal sem rolar até o rodapé, abaixo das modalidades de indicação, com botão "Quero ser prospector remoto" que abre `prospeccao-remota.html`.
- [ ] As comissões R$ 50 / R$ 150 / R$ 300 da página principal continuam iguais.
- [ ] Página exclusiva com título, subtítulo, 4 vantagens, 5 passos e o aviso "Importante" com o texto aprovado.
- [ ] Nenhum nome de cliente internacional; nenhuma ocorrência de "vaga de emprego", "salário" ou "contratação de telemarketing"; nenhuma promessa de ganho garantido.
- [ ] Seção "Condições da parceria" com autonomia (sem jornada, metas ou exclusividade; aceitar ou recusar listas) e aviso de aceite contratual em revisão jurídica, sem dizer que o aceite elimina vínculo trabalhista.
- [ ] Disponibilidade opcional e informativa.
- [ ] Formulário com os 9 itens pedidos, sem CPF, dados bancários ou Pix, e sem mensagem de envio concluído.
- [ ] Sem rolagem horizontal e botão principal visível na primeira tela em 360 × 640 e 390 × 844; desktop 1280.
