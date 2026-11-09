# Protótipo frontend

> A landing v2 substituiu a página inicial. Este protótipo (áreas de afiliado e administração com dados fictícios) continua disponível em `/prototipo.html`. Para exportar: `node tools/export-frontend.js CAMINHO.html`.

Foco atual: revisão visual e navegação. O navegador utiliza public/demo.js como fonte de dados fictícios. Não há chamadas à API, inicialização de banco ou autenticação real no fluxo do frontend. O backend anterior permanece preservado e fora do trabalho atual.

## Abrir

Executar `npm run preview:frontend` e acessar http://localhost:3200. Esse comando inicia somente um servidor estático local, sem dependências externas e sem banco.

Alternativamente, exportar um HTML independente:

```sh
node tools/export-frontend.js CAMINHO/operumdata-frontend.html
```

Abrir o HTML exportado no navegador. CSS, scripts e dados estão incorporados; não há fontes ou serviços externos necessários.

## Explorar

- Landing page, formulário de cadastro e formulário de login.
- Botão Painel do afiliado: perfil aprovado com empresas e comissões de exemplo.
- Botão Administração: gestão simulada de afiliados, empresas, regras de comissão, lançamentos e baixas.
- Botão Cadastro pendente: estado de aprovação e painel vazio.
- Busca por texto e filtros de situação nas listagens.
- Barra de evolução para o próximo nível de comissão.
- Restaurar exemplo: descarta alterações da demonstração e volta ao início.

As alterações são persistidas apenas no armazenamento local deste navegador. Senhas dos formulários não são armazenadas nem transmitidas. O login simulado abre o perfil fictício de Marina; também é possível navegar pelos botões de demonstração sem preencher senha. Não usar dados reais. A simulação simplifica regras e não valida titularidade ou existência de empresas.

## Validação

Interface conferida no navegador em desktop e viewport móvel de 390 × 844. Conferidos: troca de perfis, busca sem resultados, baixa simulada com atualização dos totais, cadastro pendente e restauração de dados. Verificações de sintaxe e testes existentes executados. As regras reais de segurança permanecem fora do escopo deste protótipo.

Nenhuma hospedagem, publicação em produção ou mudança nos sites atuais foi realizada.
