import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const derive = promisify(scrypt);
const root = fileURLToPath(new URL('../', import.meta.url));
const digest = value => createHash('sha256').update(value).digest('hex');
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const text = (value, label, max = 180) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail(400, `${label} inválido.`);
  return value.trim();
};
const emailValue = value => {
  const email = text(value, 'E-mail', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'E-mail inválido.');
  return email;
};
export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) fail(400, 'A senha deve ter de 12 a 128 caracteres.');
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${(await derive(password, salt, 64)).toString('hex')}`;
}
async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const candidate = await derive(password, salt, 64);
  return timingSafeEqual(candidate, Buffer.from(hash, 'hex'));
}
export function cnpjValue(value) {
  // Homologação usa CNPJs numéricos. Suporte alfanumérico deve ser validado antes de produção.
  const cnpj = text(value, 'CNPJ', 18).replace(/[.\/-]/g, '');
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) fail(400, 'CNPJ numérico inválido.');
  for (let len = 12; len <= 13; len++) {
    let sum = 0, weight = len - 7;
    for (let i = 0; i < len; i++) { sum += Number(cnpj[i]) * weight--; if (weight < 2) weight = 9; }
    const mod = sum % 11;
    if (Number(cnpj[len]) !== (mod < 2 ? 0 : 11 - mod)) fail(400, 'Dígitos verificadores do CNPJ inválidos.');
  }
  return cnpj;
}
export function domainValue(value) {
  const raw = text(value, 'Domínio', 253).toLowerCase();
  let url;
  try { url = new URL(raw.includes('://') ? raw : `https://${raw}`); } catch { fail(400, 'Domínio inválido.'); }
  const host = url.hostname.replace(/^www\./, '');
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port ||
    !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host)) fail(400, 'Domínio inválido.');
  return host;
}

export async function createApp(config = {}) {
  const environment = config.environment ?? process.env.APP_ENV ?? 'staging';
  if (!['staging', 'test'].includes(environment)) throw new Error('Esta versão é exclusiva de homologação. Produção não está habilitada.');
  const dbPath = config.dbPath ?? process.env.DATABASE_PATH ?? './data/staging.sqlite';
  if (dbPath !== ':memory:') mkdirSync(dirname(resolve(dbPath)), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  db.exec(readFileSync(resolve(root, 'migrations/001_initial.sql'), 'utf8'));
  const query = (sql, ...args) => db.prepare(sql).all(...args);
  const one = (sql, ...args) => db.prepare(sql).get(...args);
  const run = (sql, ...args) => db.prepare(sql).run(...args);
  const audit = (actor, action, target, detail = {}) => run('INSERT INTO audit(actor_id,action,target_id,detail) VALUES(?,?,?,?)', actor, action, target, JSON.stringify(detail));
  const transaction = fn => { db.exec('BEGIN IMMEDIATE'); try { const result = fn(); db.exec('COMMIT'); return result; } catch (err) { db.exec('ROLLBACK'); throw err; } };
  const adminEmail = config.adminEmail ?? process.env.ADMIN_EMAIL;
  const adminPassword = config.adminPassword ?? process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword && !one('SELECT id FROM users WHERE role=?', 'admin')) {
    run('INSERT INTO users(id,name,email,password_hash,role,status) VALUES(?,?,?,?,?,?)', randomUUID(), 'Administração · homologação', emailValue(adminEmail), await hashPassword(adminPassword), 'admin', 'approved');
  }
  const dummyHash = await hashPassword(randomBytes(24).toString('hex'));
  const origin = config.origin ?? process.env.PUBLIC_ORIGIN ?? 'http://localhost:3100';
  const originUrl = new URL(origin);
  if (originUrl.origin !== origin || ['afiliados.operumdata.com', 'operumdata.com', 'parceiros.operumdata.com'].includes(originUrl.hostname)) throw new Error('Origem de homologação inválida ou reservada para produção.');
  const secure = config.secure ?? process.env.COOKIE_SECURE === 'true';
  if (originUrl.protocol === 'https:' && !secure) throw new Error('HTTPS exige COOKIE_SECURE=true.');
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ strictTransportSecurity: secure ? undefined : false, contentSecurityPolicy: { directives: { 'upgrade-insecure-requests': secure ? [] : null } } }));
  app.use(express.json({ limit: '16kb' }));
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('origin') !== origin) return res.status(403).json({ error: 'Origem não autorizada.' });
    const token = req.headers.cookie?.split(';').map(p => p.trim()).find(p => p.startsWith('od_session='))?.slice(11);
    if (token && /^[a-f0-9]{64}$/.test(token)) {
      const session = one('SELECT s.csrf,s.token_hash,u.id,u.name,u.email,u.role,u.status FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?', digest(token), Date.now());
      if (session) { req.user = session; req.sessionHash = session.token_hash; }
    }
    if (req.user && !['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('x-csrf-token') !== req.user.csrf) return res.status(403).json({ error: 'Token de segurança inválido. Atualize a página.' });
    next();
  });
  const requireUser = (req, res, next) => req.user ? next() : res.status(401).json({ error: 'Entre na sua conta.' });
  const requireAdmin = (req, res, next) => req.user?.role === 'admin' ? next() : res.status(403).json({ error: 'Acesso exclusivo da administração.' });
  const requireApproved = (req, res, next) => req.user?.role === 'affiliate' && req.user.status === 'approved' ? next() : res.status(403).json({ error: 'Cadastro de afiliado ainda não aprovado.' });
  const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: environment === 'test' ? 1000 : 20, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Muitas tentativas. Aguarde 15 minutos.' } });
  app.get('/api/health', (req, res) => res.json({ status: 'ok', environment }));
  app.post('/api/register', authLimit, async (req, res) => {
    const name = text(req.body.name, 'Nome', 100), email = emailValue(req.body.email);
    const hash = await hashPassword(req.body.password), id = randomUUID();
    if (one('SELECT id FROM users WHERE email=?', email)) fail(409, 'Cadastro já existente para este e-mail.');
    transaction(() => { run('INSERT INTO users(id,name,email,password_hash,role,status) VALUES(?,?,?,?,?,?)', id, name, email, hash, 'affiliate', 'pending'); audit(id, 'affiliate.registered', id); });
    res.status(201).json({ message: 'Cadastro recebido. Aguarde a aprovação da administração.' });
  });
  app.post('/api/login', authLimit, async (req, res) => {
    const email = emailValue(req.body.email);
    const password = typeof req.body.password === 'string' && req.body.password.length <= 128 ? req.body.password : '';
    const user = one('SELECT * FROM users WHERE email=?', email);
    const valid = await verifyPassword(password, user?.password_hash ?? dummyHash);
    if (!user || !valid) fail(401, 'E-mail ou senha incorretos.');
    const token = randomBytes(32).toString('hex'), csrf = randomBytes(32).toString('hex');
    transaction(() => {
      run('DELETE FROM sessions WHERE expires_at<?', Date.now());
      if (req.sessionHash) run('DELETE FROM sessions WHERE token_hash=?', req.sessionHash);
      run('INSERT INTO sessions VALUES(?,?,?,?)', digest(token), user.id, csrf, Date.now() + 8 * 60 * 60 * 1000);
      audit(user.id, 'session.login', user.id);
    });
    res.cookie('od_session', token, { httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge: 8 * 60 * 60 * 1000 });
    res.json({ csrf });
  });
  app.post('/api/logout', requireUser, (req, res) => {
    run('DELETE FROM sessions WHERE token_hash=?', req.sessionHash);
    res.clearCookie('od_session', { httpOnly: true, secure, sameSite: 'strict', path: '/' }); res.json({ ok: true });
  });
  const tiers = () => query('SELECT * FROM tiers ORDER BY min_companies');
  const tierFor = id => {
    const count = one("SELECT count(*) AS n FROM companies WHERE affiliate_id=? AND status='approved'", id).n;
    return { ...one('SELECT * FROM tiers WHERE min_companies<=? ORDER BY min_companies DESC LIMIT 1', count), count };
  };
  app.get('/api/dashboard', requireUser, (req, res) => {
    const admin = req.user.role === 'admin';
    const user = { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role, status: req.user.status };
    res.json({ user, csrf: req.user.csrf, tiers: tiers(), tier: tierFor(user.id),
      affiliates: admin ? query("SELECT id,name,email,status,created_at FROM users WHERE role='affiliate' ORDER BY created_at DESC").map(u => ({ ...u, tier: tierFor(u.id) })) : [],
      companies: query(`SELECT c.*,u.name AS affiliate_name FROM companies c JOIN users u ON u.id=c.affiliate_id ${admin ? '' : 'WHERE c.affiliate_id=?'} ORDER BY c.created_at DESC`, ...(admin ? [] : [user.id])),
      payments: query(`SELECT p.*,c.name AS company_name,u.name AS affiliate_name FROM payments p JOIN companies c ON c.id=p.company_id JOIN users u ON u.id=p.affiliate_id ${admin ? '' : 'WHERE p.affiliate_id=?'} ORDER BY p.created_at DESC`, ...(admin ? [] : [user.id])),
      audit: admin ? query('SELECT a.*,u.name AS actor_name FROM audit a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.id DESC LIMIT 50') : [] });
  });
  app.patch('/api/affiliates/:id', requireUser, requireAdmin, (req, res) => {
    const status = req.body.status;
    if (!['approved', 'rejected', 'pending'].includes(status)) fail(400, 'Status inválido.');
    const user = one("SELECT * FROM users WHERE id=? AND role='affiliate'", req.params.id);
    if (!user) fail(404, 'Afiliado não encontrado.');
    transaction(() => { run('UPDATE users SET status=? WHERE id=?', status, user.id); audit(req.user.id, 'affiliate.status', user.id, { from: user.status, to: status }); });
    res.json({ ok: true });
  });
  app.post('/api/companies', requireUser, requireApproved, (req, res) => {
    const name = text(req.body.name, 'Razão social'), cnpj = cnpjValue(req.body.cnpj), domain = domainValue(req.body.domain);
    if (one('SELECT id FROM companies WHERE cnpj=? OR domain=?', cnpj, domain)) fail(409, 'Empresa já registrada. CNPJ ou domínio duplicado.');
    const id = randomUUID();
    transaction(() => { run('INSERT INTO companies(id,affiliate_id,name,cnpj,domain) VALUES(?,?,?,?,?)', id, req.user.id, name, cnpj, domain); audit(req.user.id, 'company.registered', id); });
    res.status(201).json({ id });
  });
  app.patch('/api/companies/:id', requireUser, requireAdmin, (req, res) => {
    const status = req.body.status;
    if (!['approved', 'rejected', 'pending'].includes(status)) fail(400, 'Status inválido.');
    const company = one('SELECT * FROM companies WHERE id=?', req.params.id);
    if (!company) fail(404, 'Empresa não encontrada.');
    transaction(() => { run('UPDATE companies SET status=? WHERE id=?', status, company.id); audit(req.user.id, 'company.status', company.id, { from: company.status, to: status }); });
    res.json({ ok: true });
  });
  app.patch('/api/tiers/:id', requireUser, requireAdmin, (req, res) => {
    const name = text(req.body.name, 'Nome do nível', 80), { min_companies: min, rate_bps: rate } = req.body;
    if (!Number.isSafeInteger(min) || min < 0 || min > 100000 || !Number.isSafeInteger(rate) || rate < 0 || rate > 10000) fail(400, 'Limite ou comissão inválidos.');
    const tier = one('SELECT * FROM tiers WHERE id=?', req.params.id);
    if (!tier) fail(404, 'Nível não encontrado.');
    if (tier.min_companies === 0 && min !== 0) fail(400, 'O primeiro nível deve começar em zero.');
    transaction(() => { run('UPDATE tiers SET name=?,min_companies=?,rate_bps=? WHERE id=?', name, min, rate, tier.id); audit(req.user.id, 'tier.updated', String(tier.id), { name, min, rate }); });
    res.json({ ok: true });
  });
  app.post('/api/payments', requireUser, requireAdmin, (req, res) => {
    const { company_id: companyId, period, base_cents: base } = req.body;
    if (typeof period !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(period) || !Number.isSafeInteger(base) || base <= 0 || base > 100000000) fail(400, 'Competência ou base de cálculo inválida.');
    const company = one("SELECT c.* FROM companies c JOIN users u ON u.id=c.affiliate_id WHERE c.id=? AND c.status='approved' AND u.status='approved'", text(companyId, 'Empresa'));
    if (!company) fail(400, 'Selecione uma empresa aprovada de afiliado aprovado.');
    if (one('SELECT id FROM payments WHERE company_id=? AND period=?', company.id, period)) fail(409, 'Comissão já lançada para esta empresa e competência.');
    const tier = tierFor(company.affiliate_id), amount = Math.round(base * tier.rate_bps / 10000);
    if (amount < 1) fail(400, 'Comissão calculada deve ser maior que zero.');
    const id = randomUUID();
    transaction(() => { run('INSERT INTO payments(id,company_id,affiliate_id,period,base_cents,rate_bps,amount_cents) VALUES(?,?,?,?,?,?,?)', id, company.id, company.affiliate_id, period, base, tier.rate_bps, amount); audit(req.user.id, 'payment.created', id, { base, rate: tier.rate_bps, amount, period }); });
    res.status(201).json({ id, amount_cents: amount });
  });
  app.patch('/api/payments/:id/pay', requireUser, requireAdmin, (req, res) => {
    const reference = text(req.body.reference, 'Referência de pagamento', 120);
    const payment = one('SELECT * FROM payments WHERE id=?', req.params.id);
    if (!payment) fail(404, 'Lançamento não encontrado.');
    if (payment.status === 'paid') fail(409, 'Lançamento já marcado como pago.');
    transaction(() => { run("UPDATE payments SET status='paid',reference=?,paid_at=CURRENT_TIMESTAMP WHERE id=?", reference, payment.id); audit(req.user.id, 'payment.marked_paid_simulation', payment.id, { reference }); });
    res.json({ ok: true });
  });
  app.use('/api', (req, res) => res.status(404).json({ error: 'Recurso não encontrado.' }));
  app.use(express.static(resolve(root, 'public')));
  app.use((err, req, res, next) => {
    const constraint = String(err.code).includes('SQLITE_CONSTRAINT') || String(err.message).includes('UNIQUE constraint failed');
    const status = err.status ?? (constraint ? 409 : 500);
    if (status >= 500) console.error('Falha interna:', err.code ?? err.name);
    res.status(status).json({ error: status >= 500 ? 'Erro interno. Tente novamente.' : constraint ? 'Registro duplicado ou dados conflitantes.' : err.message });
  });
  return { app, db };
}
