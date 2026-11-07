# OperumData Afiliados

**Foco atual: frontend.** Para revisar as telas sem API ou banco, execute `npm run preview:frontend` e abra http://localhost:3200. Use os botões de perfis fictícios. Veja [instruções do protótipo](docs/FRONTEND.md). O backend descrito abaixo está preservado para trabalho futuro; o frontend atual usa somente dados locais simulados.

Aplicação de **homologação**, com frontend responsivo em português, API Node.js/Express e banco SQLite exclusivo persistente. Repositório privado e independente. GitHub armazena o código; GitHub Pages não executa o backend.

**Produção não está autorizada.** Os sites operumdata.com e parceiros.operumdata.com não são dependências deste projeto e devem permanecer inalterados.

## Executar localmente

Requisito: Node.js 24. Esta versão usa o módulo nativo node:sqlite.

1. Clonar o repositório e executar `npm ci`.
2. Copiar `.env.example` para `.env`.
3. Definir `ADMIN_EMAIL` com e-mail fictício (por exemplo admin@example.test) e `ADMIN_PASSWORD` com senha exclusiva entre 12 e 128 caracteres.
4. Executar `npm start` e abrir <http://localhost:3100>.
5. Entrar com as credenciais definidas. O administrador inicial é criado somente se ainda não existir administrador. Alterar a variável depois não redefine a senha.

O banco local fica em data/staging.sqlite, ignorado pelo Git. O servidor escuta apenas no loopback por padrão. Não há senha padrão no código.

## Operação disponível

- Landing page, solicitação de cadastro, login e logout.
- Afiliados começam pendentes; administrador aprova, recusa ou retorna à análise.
- Apenas afiliados aprovados registram empresas. Cada afiliado vê somente suas empresas e comissões.
- CNPJ **numérico** com dígitos verificadores e domínio normalizado. CNPJ e domínio têm unicidade global no banco. Não há consulta ao cadastro oficial ou comprovação de titularidade.
- Administrador analisa empresas, configura níveis, lança comissões e registra baixas com referência fictícia.
- Níveis calculados por quantidade de empresas aprovadas. Percentuais iniciais de 5%, 7,5% e 10% são **provisórios de simulação**, editáveis pela administração.
- Valores calculados em centavos; percentual preservado por lançamento. Uma comissão por empresa/competência mensal. Baixa duplicada bloqueada.
- Nenhuma transferência financeira ou integração bancária. Todos os pagamentos são registros de teste.
- Últimos 50 eventos na interface; trilha completa persistida no banco.

## Segurança e verificação

Senhas com scrypt/salt individual; sessões aleatórias armazenadas como hash; cookies HttpOnly e SameSite=Strict, com Secure obrigatório na origem HTTPS; expiração de 8 horas; CSRF e validação de origem; limite de tentativas de autenticação; SQL parametrizado; validação de entradas; CSP/Helmet; API sem cache. Permissões verificadas no servidor a cada requisição.

```sh
npm run check
npm test
npm audit --omit=dev --audit-level=high
```

Testes de integração com banco em memória e dados fictícios cobrem cadastro, login, aprovação, duplicidades, isolamento entre afiliados, permissões, CSRF, origem, comissões, preservação de percentual, baixa única, logout e bloqueio de produção. A CI verifica pushes e pull requests, sem deploy automático.

## Homologação externa

Ver [roteiro de infraestrutura e aceite](docs/HOMOLOGACAO.md). A URL externa precisa ser provisionada em um serviço autorizado com HTTPS e volume persistente. Dockerfile e Compose preparam um serviço Node único com banco exclusivo. Não executar múltiplas réplicas sobre o mesmo arquivo SQLite.

## Pendências antes de produção

Esta versão recusa APP_ENV=production e origens dos domínios atuais e futuro. O bloqueio é intencional; qualquer evolução exige aprovação expressa para publicação. Antes de produção: suporte a CNPJ alfanumérico, regras comerciais definitivas, recuperação de senha e verificação de e-mail, MFA administrativo, política de retenção, backups com restauração validada, monitoramento e dimensionamento. Ainda não há comprovação externa de empresas nem pagamentos automáticos.

## Referências

- [SQLite do Node.js 24](https://nodejs.org/docs/latest-v24.x/api/sqlite.html)
- [Segurança do Express](https://expressjs.com/en/advanced/best-practice-security/)
