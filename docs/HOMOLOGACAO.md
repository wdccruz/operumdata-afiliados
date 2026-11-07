# Homologação e publicação

## Situação

Aplicação preparada para homologação. A URL externa depende de um serviço/servidor autorizado com Node.js 24 ou Docker, TLS e volume persistente exclusivo. Não há URL externa ativa nesta entrega. GitHub é o repositório do código; GitHub Pages não executa este backend.

## Provisionamento de homologação

1. Selecionar infraestrutura exclusiva sem alterar sites atuais. Não contratar recursos pagos sem orçamento autorizado.
2. Fazer checkout do commit da branch de desenvolvimento e executar npm ci ou construir o Dockerfile.
3. Configurar segredos ADMIN_EMAIL (fictício) e ADMIN_PASSWORD (12 a 128 caracteres). Nunca registrar seus valores no Git ou nos logs.
4. Definir APP_ENV=staging, PUBLIC_ORIGIN=https://host-temporario (sem barra final), COOKIE_SECURE=true, HOST=0.0.0.0, PORT=3100, DATABASE_PATH=/app/data/staging.sqlite.
5. Montar volume exclusivo e gravável pelo usuário node em /app/data; executar uma única instância. SQLite não deve ser compartilhado por réplicas.
6. Configurar proxy HTTPS válido no host temporário, sem utilizar afiliados.operumdata.com.
7. A migração 001_initial.sql é aplicada no início. Fazer snapshot consistente antes de futuras migrações em bancos existentes.
8. Verificar /api/health, cadastrar informações fictícias e entregar URL e credenciais por canal privado. Registrar o commit avaliado.

Docker local: com variáveis em .env, executar docker compose up --build -d. O Compose expõe apenas 127.0.0.1:3100. Para acesso externo, adicionar proxy TLS isolado no serviço escolhido.

## Roteiro de aceite

- Abrir landing page em desktop e celular.
- Cadastrar afiliado fictício, entrar, observar pendência e bloqueio de indicações.
- Aprovar pelo administrador, registrar empresa sintética e aprová-la.
- Repetir CNPJ e domínio, inclusive www/maiúsculas; conferir rejeição.
- Criar segundo afiliado e confirmar que não vê dados do primeiro.
- Validar níveis por empresas aprovadas; alterar regras provisórias.
- Lançar comissão por empresa e competência, conferir base, percentual e centavos.
- Alterar regra e confirmar preservação do percentual de lançamentos anteriores.
- Registrar baixa com referência fictícia e conferir bloqueio de baixa duplicada.
- Recusar afiliado; confirmar bloqueio de novas indicações e trilha de auditoria.
- Sair; confirmar exigência de login nas APIs protegidas.
- Confirmar persistência após reinício e testar restauração de backup em ambiente descartável.
- Corrigir problemas antes de solicitar aprovação de produção.

## Produção futura — não executar

Exige aprovação expressa. Antes: fechar regras comerciais, implementar os pontos pendentes do README, preparar infraestrutura e banco exclusivos de produção, backups/restauração, migrações, domínio e HTTPS, testes finais. Domínio previsto: afiliados.operumdata.com. Os sites operumdata.com e parceiros.operumdata.com devem permanecer inalterados.
