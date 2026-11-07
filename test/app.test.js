import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp, cnpjValue, domainValue } from '../src/app.js';

test('normalização de documentos e domínios', () => {
  assert.equal(cnpjValue('11.222.333/0001-81'), '11222333000181');
  assert.equal(domainValue('https://WWW.EMPRESA.TEST/caminho'), 'empresa.test');
  for (const invalid of ['00000000000000','11222333000180','<script>']) assert.throws(() => cnpjValue(invalid));
  for (const invalid of ['javascript:alert(1)','https://usuario:senha@empresa.test','localhost']) assert.throws(() => domainValue(invalid));
});

test('fluxo integrado, isolamento, permissões e controle financeiro', async t => {
  const origin = 'http://localhost:3100';
  const { app, db } = await createApp({ environment: 'test', dbPath: ':memory:', origin, adminEmail: 'admin@example.test', adminPassword: 'Senha-admin-teste-123!' });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.on('listening', resolve));
  t.after(() => new Promise(resolve => server.close(() => { db.close(); resolve(); })));
  const url = `http://127.0.0.1:${server.address().port}`;
  function client() {
    let cookie = '', csrf = '';
    return async (path, body, method = 'POST', options = {}) => {
      const res = await fetch(url + '/api' + path, { method: body === undefined ? 'GET' : method, headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: cookie, 'X-CSRF-Token': csrf, ...options.headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      const data = await res.json();
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) cookie = setCookie.split(';')[0];
      if (data.csrf) csrf = data.csrf;
      return { status: res.status, data, res };
    };
  }
  const guest = client(), admin = client(), alice = client(), bob = client();
  const company = { name: 'Empresa Fictícia', cnpj: '11.222.333/0001-81', domain: 'empresa.test' };
  assert.equal((await guest('/dashboard')).status, 401);
  assert.equal((await guest('/register', { name: 'Teste', email: 'bad', password: 'curta' })).status, 400);
  for (const name of ['alice','bob']) {
    assert.equal((await guest('/register', { name, email: `${name}@example.test`, password: 'Senha-ficticia-123!' })).status, 201);
  }
  assert.equal((await guest('/register', { name: 'Alice', email: 'ALICE@example.test', password: 'Senha-ficticia-123!' })).status, 409);
  assert.equal((await alice('/login', { email: 'alice@example.test', password: 'errada' })).status, 401);
  const login = await alice('/login', { email: 'alice@example.test', password: 'Senha-ficticia-123!' });
  assert.equal(login.status, 200);
  assert.match(login.res.headers.get('set-cookie'), /HttpOnly/);
  assert.match(login.res.headers.get('set-cookie'), /SameSite=Strict/);
  assert.equal((await alice('/companies', company)).status, 403);
  await bob('/login', { email: 'bob@example.test', password: 'Senha-ficticia-123!' });
  await admin('/login', { email: 'admin@example.test', password: 'Senha-admin-teste-123!' });
  let state = (await admin('/dashboard')).data;
  const aliceId = state.affiliates.find(u => u.name === 'alice').id;
  const bobId = state.affiliates.find(u => u.name === 'bob').id;
  assert.equal((await alice(`/affiliates/${aliceId}`, { status: 'approved' }, 'PATCH')).status, 403);
  assert.equal((await admin(`/affiliates/${aliceId}`, { status: 'approved' }, 'PATCH', { headers: { 'X-CSRF-Token': 'bad' } })).status, 403);
  assert.equal((await admin(`/affiliates/${aliceId}`, { status: 'approved' }, 'PATCH', { headers: { Origin: 'https://evil.test' } })).status, 403);
  for (const id of [aliceId, bobId]) assert.equal((await admin(`/affiliates/${id}`, { status: 'approved' }, 'PATCH')).status, 200);
  const created = await alice('/companies', company);
  assert.equal(created.status, 201);
  const companyId = created.data.id;
  assert.equal((await bob('/dashboard')).data.companies.length, 0);
  assert.equal((await bob('/companies', { ...company, domain: 'outra.test' })).status, 409);
  assert.equal((await bob('/companies', { ...company, cnpj: '04.252.011/0001-10', domain: 'https://www.empresa.test/' })).status, 409);
  assert.equal((await bob(`/companies/${companyId}`, { status: 'approved' }, 'PATCH')).status, 403);
  assert.equal((await admin('/payments', { company_id: companyId, period: '2026-11', base_cents: 100000 })).status, 400);
  await admin(`/companies/${companyId}`, { status: 'approved' }, 'PATCH');
  assert.equal((await alice('/dashboard')).data.tier.count, 1);
  const payment = await admin('/payments', { company_id: companyId, period: '2026-11', base_cents: 100000 });
  assert.equal(payment.status, 201);
  assert.equal(payment.data.amount_cents, 5000);
  assert.equal((await admin('/payments', { company_id: companyId, period: '2026-11', base_cents: 100000 })).status, 409);
  assert.equal((await admin('/payments', { company_id: companyId, period: '2026-13', base_cents: -1 })).status, 400);
  assert.equal((await bob('/dashboard')).data.payments.length, 0);
  assert.equal((await alice(`/payments/${payment.data.id}/pay`, { reference: 'teste' }, 'PATCH')).status, 403);
  assert.equal((await admin('/tiers/1', { name: 'Teste', min_companies: 1, rate_bps: 600 }, 'PATCH')).status, 400);
  assert.equal((await admin('/tiers/1', { name: 'Teste', min_companies: 0, rate_bps: 600 }, 'PATCH')).status, 200);
  assert.equal((await alice('/dashboard')).data.payments[0].rate_bps, 500);
  assert.equal((await admin(`/payments/${payment.data.id}/pay`, { reference: 'comprovante-ficticio' }, 'PATCH')).status, 200);
  assert.equal((await admin(`/payments/${payment.data.id}/pay`, { reference: 'duplicado' }, 'PATCH')).status, 409);
  assert.equal((await alice('/dashboard')).data.payments[0].status, 'paid');
  state = (await admin('/dashboard')).data;
  assert.ok(state.audit.some(a => a.action === 'payment.marked_paid_simulation'));
  assert.ok(!JSON.stringify(state).includes('password_hash'));
  assert.equal((await admin(`/affiliates/${aliceId}`, { status: 'rejected' }, 'PATCH')).status, 200);
  assert.equal((await alice('/companies', { ...company, cnpj: '04.252.011/0001-10', domain: 'nova.test' })).status, 403);
  assert.equal((await alice('/logout', {})).status, 200);
  assert.equal((await alice('/dashboard')).status, 401);
  const page = await fetch(url);
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-security-policy'), /script-src 'self'/);
  assert.match(await page.text(), /HOMOLOGAÇÃO/);
});

test('bloqueia ativação acidental em produção', async () => {
  await assert.rejects(createApp({ environment: 'production', dbPath: ':memory:' }), /Produção não está habilitada/);
});
