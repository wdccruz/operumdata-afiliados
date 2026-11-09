# Implantação na HostGator: comercial.operumdata.com

**Decisão da OperumData (09/11/2026):** a interface da plataforma comercial fica hospedada na **HostGator**, no subdomínio `https://comercial.operumdata.com`. O Supabase independente fornece banco, autenticação e APIs (Codex). O GitHub guarda o código e as versões. A operação não depende de GitHub Pages nem de nenhum serviço intermediário de DNS ou CDN.

| Rota | Arquivo no servidor | Conteúdo |
|---|---|---|
| `/` | `index.html` | Prospecção remota (página principal) |
| `/afiliados` | `afiliados.html` | Programa de afiliados |
| `/painel/` | `painel/index.html` | Área dos parceiros e da administração (Codex) |

Primeira etapa: publicar tudo em **homologação** (faixa de homologação, `noindex`, formulários públicos sem envio). Segunda etapa: ligar o frontend ao Supabase do Codex e testar. **Nenhum cadastro real** antes da integração homologada e dos termos jurídicos aprovados.

A publicação, a criação do subdomínio e qualquer alteração de DNS são feitas pela OperumData (ou com autorização expressa dela). Os agentes só preparam o pacote e as instruções.

## 1. Gerar o pacote

Requisito: Node.js 24.

```sh
# Painel do Codex sem fazer merge das branches (cópia somente leitura da pasta public/painel):
mkdir -p /tmp/codex && git fetch origin feat/backend-supabase
git archive origin/feat/backend-supabase public/painel | tar -x -C /tmp/codex

node tools/build-hostgator.js --painel /tmp/codex/public/painel
cd dist/hostgator/comercial && zip -r ../comercial-hostgator.zip . && cd -
```

Quando as duas branches estiverem unidas, basta `node tools/build-hostgator.js` (o script usa `public/painel` se existir).

O script:
- copia só os arquivos publicados (o protótipo antigo `prototipo.html`, `app.js`, `demo.js`, `style.css`, `demo.css` e o backend provisório `src/` ficam de fora);
- copia o painel sem o arquivo `_headers` (não é usado pelo Apache) e sem arquivos ocultos;
- **recusa o pacote** se encontrar `.env`, chave secreta do Supabase (`sb_secret_…`), token JWT, chave privada ou link interno quebrado;
- gera `dist/hostgator/MANIFESTO.txt` com a lista de arquivos e o hash de cada um, para conferência.

`dist/` não é versionado.

## 2. Estrutura na pasta do subdomínio

```
<pasta do subdomínio>/          ex.: /home/<usuario>/comercial.operumdata.com  ou  public_html/comercial
├── .htaccess                   rotas, HTTPS, cabeçalhos de segurança (arquivo oculto: não esquecer)
├── index.html                  /            Prospecção remota
├── afiliados.html              /afiliados   Afiliados
├── 404.html                    página de erro
├── termos.html, privacidade.html            textos provisórios (P9)
├── prospeccao-remota.html, entrar.html      endereços antigos (o .htaccess redireciona)
├── robots.txt                  bloqueia buscadores durante a homologação
├── css/landing.css
├── js/landing.js
├── assets/img/                 fotos das páginas
└── painel/                     /painel/     área dos parceiros e da administração
    ├── index.html, acesso.html, candidatura.html
    ├── *.js, painel.css
    └── vendor/supabase.js
```

Caminhos internos são relativos (`css/…`, `afiliados`, `painel/`, `../`). Só `404.html` usa caminhos absolutos (`/css/landing.css`), porque é exibida em qualquer endereço; por isso o site precisa estar na **raiz** do subdomínio, não em subpasta.

## 3. Painel da HostGator (cPanel)

### 3.1 Criar o subdomínio
cPanel → **Domínios** (ou **Subdomínios**, conforme a versão) → criar `comercial` em `operumdata.com`.
- Raiz do documento: aceitar a pasta sugerida e anotar o caminho.
- **Não** usar a raiz `public_html` (é de `operumdata.com`) nem a pasta de `parceiros.operumdata.com`.

### 3.2 Enviar os arquivos
cPanel → **Gerenciador de Arquivos** → abrir a pasta do subdomínio.
1. Configurações (canto superior direito) → marcar **Mostrar arquivos ocultos**.
2. **Carregar** `comercial-hostgator.zip` → selecionar o arquivo → **Extrair** na própria pasta → apagar o `.zip`.
3. Conferir na raiz da pasta: `.htaccess`, `index.html`, `afiliados.html`, `404.html`, pastas `css`, `js`, `assets`, `painel`.

Alternativa: FTP/SFTP com as credenciais da conta, enviando o **conteúdo** de `dist/hostgator/comercial/` (não a pasta `comercial` em si).

### 3.3 DNS
Verificar **no painel do provedor que efetivamente administra o DNS** de `operumdata.com`. Para descobrir qual é: consultar os servidores de nomes (nameservers) do domínio no registrador (Registro.br → domínio → DNS) ou com `nslookup -type=NS operumdata.com`.

- **Nameservers da HostGator:** o subdomínio criado no cPanel já gera o registro. Conferir em cPanel → **Zone Editor** que existe `comercial.operumdata.com` (tipo `A`).
- **Nameservers de outro provedor:** criar nesse provedor um registro **`A`**, nome `comercial`, valor = **IP da conta HostGator** (cPanel → coluna "Informações gerais" → "Endereço IP compartilhado"). Sem proxy ou CDN intermediário, para o certificado ser emitido. Não alterar os registros de `operumdata.com` e `parceiros`.

Testar: `nslookup comercial.operumdata.com` deve devolver o IP da HostGator.

### 3.4 HTTPS
cPanel → **Status do SSL/TLS** → selecionar `comercial.operumdata.com` → **Executar AutoSSL**. Esperar o certificado aparecer como válido (minutos a algumas horas, depois que o DNS responde).

O `.htaccess` já redireciona `http://` para `https://`. Antes do certificado sair, o navegador mostra aviso de segurança; isso some quando o AutoSSL conclui. Depois de confirmar o HTTPS por alguns dias, pode-se ativar o HSTS descomentando a linha `Strict-Transport-Security` no `.htaccess`.

### 3.5 Módulos do Apache
O `.htaccess` usa `mod_rewrite` (rotas e HTTPS) e `mod_headers` (segurança e cache), ativos por padrão na hospedagem compartilhada da HostGator. Se `/afiliados` der 404 ou faltarem os cabeçalhos, abrir chamado no suporte pedindo `AllowOverride All` e esses módulos.

## 4. O que o `.htaccess` faz

| Pedido | Resposta |
|---|---|
| `/`, `/afiliados`, `/termos`, `/privacidade` | 200 (página correspondente) |
| `/painel` | 301 → `/painel/` (200) |
| `/afiliados.html`, `/afiliados/` | 301 → `/afiliados` |
| `/index.html`, `/prospeccao-remota(.html)` | 301 → `/` |
| `/entrar`, `/entrar.html` | 301 → `/painel/` |
| `http://…` | 301 → `https://…` |
| `/.env`, `/.htaccess`, `/.git/…`, listagem de pastas | 403 |
| endereço inexistente | 404 com `404.html` |

Parâmetros de campanha (`?utm_source=…`) são mantidos nos redirecionamentos. Atualizar a página (F5) em qualquer rota funciona, porque cada rota corresponde a um arquivo real.

Cabeçalhos: `Content-Security-Policy` sem scripts ou estilos inline e `connect-src` liberado só para `https://*.supabase.co`; `X-Frame-Options: DENY`; `X-Content-Type-Options`; `Referrer-Policy`; `X-Robots-Tag: noindex` (homologação). Cache: HTML sem cache, CSS/JS 1 hora, imagens 7 dias.

Testado em Apache 2.4 local com o pacote completo (09/11/2026): todas as linhas da tabela acima, carregamento e recarga de `/`, `/afiliados` e `/painel/` em celular e computador, sem erros de CSP.

## 5. Dependências do Supabase (Codex)

Para o `/painel/` funcionar no novo endereço, no projeto Supabase independente:
- Auth → URL Configuration: **Site URL** e **Redirect URLs** com `https://comercial.operumdata.com/painel/` e `https://comercial.operumdata.com/painel/acesso.html`.
- Edge Functions: permitir a origem `https://comercial.operumdata.com` (CORS).
- `painel/config.js` contém **só** a URL do projeto e a chave publicável. Nenhuma chave secreta vai para a HostGator.

Observação: na versão atual do Codex, `painel/candidatura.html` grava candidaturas fictícias no banco de teste. Decidir com o Codex se essa página fica acessível na homologação pública ou sai do pacote.

## 6. Conferência depois de publicar

```sh
for p in / /afiliados /afiliados.html /painel /painel/ /entrar.html /naoexiste /.env; do
  curl -s -o /dev/null -w "%{http_code} %{redirect_url}  $p\n" "https://comercial.operumdata.com$p"
done
curl -sI https://comercial.operumdata.com/afiliados | grep -i -E "content-security|x-robots"
```

Esperado: 200, 200, 301, 301, 200, 301, 404, 403 (como na tabela da seção 4). Abrir `/`, `/afiliados` e `/painel/` no celular e no computador e recarregar cada uma. Só declarar o endereço funcionando depois desses testes.

## 7. Atualizações

Gerar o pacote de novo e enviar por cima (mesma pasta). HTML não fica em cache; CSS e JS podem levar até 1 hora para atualizar no navegador de quem já visitou.

## 8. Saída da homologação (somente com autorização da OperumData)

Remover a faixa HOMOLOGAÇÃO das páginas, o `<meta name="robots" content="noindex">`, a linha `X-Robots-Tag` do `.htaccess` e o `Disallow: /` do `robots.txt`; ativar o HSTS; trocar `environment` em `painel/config.js` para o projeto de produção; ligar o envio dos formulários públicos.

## 9. Não fazer

- Não alterar as pastas, o DNS ou o conteúdo de `operumdata.com` e `parceiros.operumdata.com`.
- Não enviar `.env`, `src/`, `supabase/`, `node_modules/` ou o protótipo antigo para a HostGator. O pacote do script já exclui tudo isso.
- Não usar a HostGator para backend Node.js: o backend é o Supabase.

## Prévia provisória no GitHub Pages

Enquanto o subdomínio não estiver no ar, a cópia em https://wdccruz.github.io/operumdata-afiliados/ (branch `gh-pages`) continua servindo só para revisão visual das páginas públicas. Não faz parte da operação e pode ser desativada quando a HostGator estiver publicada.
