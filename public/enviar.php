<?php
// Recebe a candidatura (Prospecção remota) ou o cadastro (Afiliados) em JSON e
// envia por e-mail para a equipe de parceiros. Solução provisória até o Supabase
// ser homologado. Nada é gravado no servidor.
//
// O destino e o login do e-mail NÃO ficam aqui nem no repositório: o script lê
// o mesmo enviar-config.php que o site parceiros.operumdata.com já usa no servidor.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function responder($status, $ok, $erro = null) {
  http_response_code($status);
  echo json_encode($erro ? ['ok' => $ok, 'erro' => $erro] : ['ok' => $ok]);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') responder(405, false, 'metodo');

$cfg = null;
foreach ([
  __DIR__ . '/enviar-config.php',
  dirname(__DIR__) . '/parceiros.operumdata.com/enviar-config.php',      // comercial.operumdata.com
  dirname(__DIR__, 2) . '/parceiros.operumdata.com/enviar-config.php',   // operumdata.com/comercial/
] as $p) {
  if (is_file($p)) { $cfg = require $p; break; }
}
if (!is_array($cfg) || empty($cfg['destino'])) responder(503, false, 'nao-configurado');

// Mesmo site apenas
$origem = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = $_SERVER['HTTP_HOST'] ?? '';
if ($origem !== '' && parse_url($origem, PHP_URL_HOST) !== preg_replace('/:\d+$/', '', $host)) responder(403, false, 'origem');

$bruto = file_get_contents('php://input', false, null, 0, 20000);
$d = json_decode($bruto ?: '', true);
if (!is_array($d)) responder(400, false, 'formato');

// Robô: campo oculto preenchido -> finge sucesso e não envia
if (!empty($d['site_url'])) responder(200, true);

// Limite simples por IP: 5 envios por hora
$ip = $_SERVER['REMOTE_ADDR'] ?? '0';
$marca = sys_get_temp_dir() . '/odc_' . hash('sha256', $ip . __DIR__);
$agora = time();
$hist = [];
if (is_file($marca)) $hist = array_filter(array_map('intval', explode(',', (string) file_get_contents($marca))), fn($t) => $t > $agora - 3600);
if (count($hist) >= 5) responder(429, false, 'limite');

function campo($d, $k, $max = 200) {
  $v = isset($d[$k]) && is_scalar($d[$k]) ? trim((string) $d[$k]) : '';
  $v = preg_replace('/[\x00-\x1F\x7F]/u', ' ', $v);
  return mb_substr($v, 0, $max);
}
function opcao($valor, $lista) { return $lista[$valor] ?? null; }

$tipos = [
  'candidato_prospector_remoto' => 'Candidatura · Prospecção remota',
  'afiliado_indicador' => 'Cadastro · Programa de afiliados',
];
$tipo = campo($d, 'tipo', 40);
if (!isset($tipos[$tipo])) responder(400, false, 'tipo');

$nome = campo($d, 'nome', 120);
$email = campo($d, 'email', 160);
$whats = preg_replace('/\D/', '', campo($d, 'whatsapp', 20));
$cidade = campo($d, 'cidade', 80);
$uf = strtoupper(campo($d, 'uf', 2));
$ufs = explode(' ', 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO');

if (count(preg_split('/\s+/', $nome)) < 2) responder(422, false, 'nome');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) responder(422, false, 'email');
if (!preg_match('/^\d{10,11}$/', $whats)) responder(422, false, 'whatsapp');
if ($cidade === '' || !in_array($uf, $ufs, true)) responder(422, false, 'cidade');
if (empty($d['aceite'])) responder(422, false, 'aceite');

$linhas = [
  $tipos[$tipo],
  '',
  'Nome: ' . $nome,
  'E-mail: ' . $email,
  'WhatsApp: ' . $whats . '  (https://wa.me/55' . $whats . ')',
  'Cidade: ' . $cidade . ' / ' . $uf,
];

if ($tipo === 'candidato_prospector_remoto') {
  $exp = opcao(campo($d, 'experiencia', 40), ['telemarketing_ativo' => 'Telemarketing ativo', 'televendas' => 'Televendas', 'vendas_b2b' => 'Vendas B2B', 'agendamento_reunioes' => 'Agendamento de reuniões', 'outra' => 'Outra']);
  $tempo = opcao(campo($d, 'tempo', 20), ['menos_1' => 'Menos de 1 ano', '1_3' => 'De 1 a 3 anos', '3_5' => 'De 3 a 5 anos', 'mais_5' => 'Mais de 5 anos']);
  $disp = opcao(campo($d, 'disponibilidade', 20), ['' => 'Prefiro não informar', 'eventual' => 'Eventual, conforme a agenda', 'alguns_dias' => 'Alguns dias por semana', 'maioria_dias' => 'A maioria dos dias']);
  $equip = opcao(campo($d, 'equipamento', 5), ['sim' => 'Sim', 'nao' => 'Ainda não']);
  if (!$exp || !$tempo || !$disp || !$equip) responder(422, false, 'perfil');
  array_push($linhas,
    'Experiência principal: ' . $exp,
    'Tempo de experiência: ' . $tempo,
    'Disponibilidade: ' . $disp,
    'Computador e meio para ligações: ' . $equip,
    '',
    'Aceitou o Aviso de Privacidade e as condições da candidatura: sim');
} else {
  $perfis = ['Representante comercial', 'Consultor', 'Contador', 'Corretor', 'Prestador de serviços para empresas', 'Empresário', 'Profissional autônomo', 'Outro'];
  $perfil = campo($d, 'perfil', 60);
  $todos = ['Energia', 'Hotelaria', 'Confecção', 'Construção civil', 'Oficinas', 'Indústrias', 'Outros'];
  $setores = is_array($d['setores'] ?? null) ? array_values(array_intersect($todos, array_map('strval', $d['setores']))) : [];
  if (!in_array($perfil, $perfis, true) || !$setores) responder(422, false, 'perfil');
  array_push($linhas,
    'Perfil profissional: ' . $perfil,
    'Setores com contatos: ' . implode(', ', $setores),
    '',
    'Aceitou os Termos de Participação e o Aviso de Privacidade: sim');
}

$utm = [];
foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as $k) {
  $v = preg_replace('/[^A-Za-z0-9._-]/', '', campo($d['origem'] ?? [], $k, 100));
  if ($v !== '') $utm[] = "$k=$v";
}
array_push($linhas,
  'Origem da campanha: ' . ($utm ? implode(' ', $utm) : '-'),
  'Enviado em: ' . gmdate('Y-m-d H:i') . ' UTC',
  'Página: https://' . $host . preg_replace('/[^A-Za-z0-9\/._-]/', '', campo($d, 'pagina', 80)));

$assunto = $tipos[$tipo] . ': ' . $nome;
$assuntoMime = '=?UTF-8?B?' . base64_encode($assunto) . '?=';
$corpo = implode("\r\n", $linhas);
$remetente = $cfg['remetente'] ?? ('nao-responda@' . preg_replace('/^www\./', '', $host));
$cab = [
  'From: OperumData Comercial <' . $remetente . '>',
  'Reply-To: ' . $email,
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=UTF-8',
  'Content-Transfer-Encoding: 8bit',
];

// Primeiro o envio autenticado (mesmo e-mail do parceiros); se falhar, mail() do servidor.
$ok = false;
$senha = $cfg['smtp']['senha'] ?? '';
if ($senha !== '' && $senha !== 'COLE_A_SENHA_AQUI') {
  $ok = enviar_smtp($cfg['smtp'], $cfg['destino'], $assuntoMime, $corpo, $email);
  if (!$ok) error_log('comercial/enviar.php: SMTP falhou, usando mail()');
}
if (!$ok) $ok = mail($cfg['destino'], $assuntoMime, $corpo, implode("\r\n", $cab), '-f' . $remetente);
if (!$ok) responder(502, false, 'envio');

$hist[] = $agora;
@file_put_contents($marca, implode(',', $hist), LOCK_EX);
responder(200, true);

// Cliente SMTP mínimo (SSL na porta 465, AUTH LOGIN), igual ao do parceiros.
function enviar_smtp($s, $destino, $assuntoMime, $corpo, $responderPara) {
  $host = $s['host'] ?? 'smtp.titan.email';
  $porta = (int) ($s['porta'] ?? 465);
  $usuario = $s['usuario'] ?? '';
  if ($usuario === '') return false;
  $ctx = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true]]);
  $f = @stream_socket_client("ssl://$host:$porta", $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $ctx);
  if (!$f) return false;
  stream_set_timeout($f, 15);
  $ler = function () use ($f) {
    $r = '';
    while (($l = fgets($f, 515)) !== false) { $r .= $l; if (isset($l[3]) && $l[3] === ' ') break; }
    return $r;
  };
  $cmd = function ($c, $esperado) use ($f, $ler) {
    if ($c !== null) fwrite($f, $c . "\r\n");
    return strpos($ler(), (string) $esperado) === 0;
  };
  $data = str_replace("\n.", "\n..", str_replace("\r\n", "\n", $corpo));
  $data = str_replace("\n", "\r\n", $data);
  $msg = implode("\r\n", [
    'From: OperumData Comercial <' . $usuario . '>',
    'To: <' . $destino . '>',
    'Reply-To: <' . $responderPara . '>',
    'Subject: ' . $assuntoMime,
    'Date: ' . date('r'),
    'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . substr(strrchr($usuario, '@'), 1) . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
  ]) . "\r\n\r\n" . $data;
  $ok = $cmd(null, 220)
    && $cmd('EHLO ' . ($_SERVER['HTTP_HOST'] ?? 'localhost'), 250)
    && $cmd('AUTH LOGIN', 334)
    && $cmd(base64_encode($usuario), 334)
    && $cmd(base64_encode($s['senha']), 235)
    && $cmd('MAIL FROM:<' . $usuario . '>', 250)
    && $cmd('RCPT TO:<' . $destino . '>', 250)
    && $cmd('DATA', 354)
    && $cmd($msg . "\r\n.", 250);
  @fwrite($f, "QUIT\r\n");
  fclose($f);
  return $ok;
}
