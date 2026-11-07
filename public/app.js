const main = document.querySelector('#main');
const notice = document.querySelector('#notice');
let dashboard, csrf, tabName = 'companies', noticeTimer;
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const money = cents => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const statusName = { pending: 'Pendente', approved: 'Aprovado', rejected: 'Recusado', paid: 'Pago · simulação' };
const badge = status => `<span class="badge ${esc(status)}">${esc(statusName[status] || status)}</span>`;
function message(text, error = false) { clearTimeout(noticeTimer); notice.textContent = text; notice.className = error ? 'error' : ''; noticeTimer = setTimeout(() => { notice.textContent = ''; }, 7500); }
async function api(path, body, method = 'POST') {
  return window.frontendDemo.request(path, body, body === undefined ? 'GET' : method);
}
function landing() {
  publicNav();
  main.innerHTML = `<section class="hero"><div class="hero-copy"><div class="eyebrow">Conexões que geram oportunidades</div><h1>Sua rede pode<br>ir <em>mais longe.</em></h1><p>Indique empresas para a OperumData e acompanhe cada oportunidade em um só lugar. Transparência do cadastro à comissão.</p><button data-view="register">Solicitar meu cadastro ↗</button></div><div class="hero-visual" aria-hidden="true"><div class="network"><small>SEU POTENCIAL, EM MOVIMENTO</small><h2>Conectar.<br>Indicar. Crescer.</h2><i class="bar"></i><i class="bar"></i><i class="bar"></i><div class="note">Uma visão clara da sua operação.<br>Empresas · Níveis · Comissões</div></div></div></section><section class="steps"><article class="step"><b>01 / FAÇA PARTE</b><h3>Solicite seu cadastro</h3><p>Crie sua conta. A equipe analisa e aprova sua participação no programa.</p></article><article class="step"><b>02 / CONECTE EMPRESAS</b><h3>Registre oportunidades</h3><p>Indique empresas e acompanhe a análise, com verificação de duplicidades.</p></article><article class="step"><b>03 / ACOMPANHE TUDO</b><h3>Tenha visibilidade</h3><p>Consulte seu nível, os lançamentos de comissão e o histórico de pagamentos.</p></article></section>`;
}
function auth(register = false) {
  publicNav();
  main.innerHTML = `<section class="auth"><div class="eyebrow">${register ? 'Comece sua jornada' : 'Bem-vindo de volta'}</div><h1>${register ? 'Faça novas conexões.' : 'Acesse sua conta.'}</h1><p>${register ? 'Cadastro sujeito à aprovação. Use somente dados fictícios neste ambiente.' : 'Acompanhe suas indicações e comissões de teste.'}</p><form id="${register ? 'register' : 'login'}">${register ? '<label for="name">Nome fictício</label><input id="name" name="name" autocomplete="name" maxlength="100" required>' : ''}<label for="email">E-mail</label><input id="email" name="email" type="email" autocomplete="username" maxlength="254" required><label for="password">Senha ${register ? '(mínimo de 12 caracteres)' : ''}</label><input id="password" name="password" type="password" autocomplete="${register ? 'new-password' : 'current-password'}" ${register ? 'minlength="12"' : ''} maxlength="128" required><button>${register ? 'Solicitar cadastro' : 'Entrar no painel'} →</button></form><p>${register ? 'Já tem conta?' : 'Ainda não participa?'} <button class="text" data-view="${register ? 'login' : 'register'}">${register ? 'Entrar' : 'Cadastrar'}</button></p></section>`;
}
const table = (headers, rows) => rows.length ? `<div class="table-wrap"><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : '<div class="empty">Nenhum registro por enquanto.</div>';
const input = (id, label, type = 'text', attrs = '') => `<label for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" ${attrs} required>`;
function renderDashboard() {
  const { user, companies, payments, affiliates, tier } = dashboard, admin = user.role === 'admin';
  document.querySelector('nav').innerHTML = '<button class="text" data-action="refresh">Atualizar painel</button><button data-action="logout">Sair ↗</button>';
  const pending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount_cents, 0);
  const paid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount_cents, 0);
  main.innerHTML = `<div class="page-title"><div><div class="eyebrow">${admin ? 'Gestão do programa' : 'Meu espaço de afiliado'}</div><h1>Olá, ${esc(user.name)}.</h1><p>${admin ? 'Acompanhe cadastros, oportunidades e a operação.' : 'Cada conexão, uma nova oportunidade.'}</p></div>${badge(user.status)}</div>${!admin && user.status !== 'approved' ? '<div class="callout">Seu cadastro está ' + esc(statusName[user.status].toLowerCase()) + '. O registro de empresas será liberado após aprovação da administração.</div>' : ''}<div class="metrics"><div class="metric"><small>${admin ? 'Afiliados cadastrados' : 'Seu nível atual'}</small><strong>${admin ? affiliates.length : esc(tier.name.replace(' · simulação', ''))}</strong></div><div class="metric"><small>Empresas aprovadas / total</small><strong>${companies.filter(c => c.status === 'approved').length} <small>/ ${companies.length}</small></strong></div><div class="metric"><small>Comissões pendentes · teste</small><strong>${money(pending)}</strong></div><div class="metric"><small>Pagamentos registrados · teste</small><strong>${money(paid)}</strong></div></div><div class="tabs">${[['companies','Empresas'],...(admin ? [['affiliates','Afiliados']] : []),['payments','Comissões e pagamentos'],['tiers','Níveis de comissão'],...(admin ? [['audit','Histórico de ações']] : [])].map(([id,label]) => `<button data-tab="${id}" class="${tabName === id ? 'active' : ''}">${label}</button>`).join('')}</div><section id="content"></section>`;
  const content = document.querySelector('#content');
  if (tabName === 'companies') {
    const rows = companies.map(c => `<tr><td><strong>${esc(c.name)}</strong><small>${esc(c.domain)}</small></td><td>${esc(c.cnpj)}${admin ? `<small>${esc(c.affiliate_name)}</small>` : ''}</td><td>${badge(c.status)}</td>${admin ? `<td><select aria-label="Status de ${esc(c.name)}" data-status="companies" data-id="${c.id}">${['pending','approved','rejected'].map(s => `<option value="${s}" ${c.status === s ? 'selected' : ''}>${statusName[s]}</option>`).join('')}</select></td>` : ''}</tr>`);
    content.innerHTML = `<div class="${!admin && user.status === 'approved' ? 'split' : ''}"><div class="panel"><h2>Empresas indicadas</h2><p>CNPJ e domínio são únicos em todo o programa.</p>${table(['Empresa','CNPJ / Afiliado','Situação',...(admin ? ['Alterar situação'] : [])], rows)}</div>${!admin && user.status === 'approved' ? `<aside class="panel"><h2>Nova indicação</h2><p>Use uma empresa fictícia e um domínio .test.</p><form id="company">${input('name','Razão social fictícia','text','maxlength="180"')}${input('cnpj','CNPJ numérico de teste','text','maxlength="18" placeholder="00.000.000/0000-00"')}${input('domain','Domínio fictício','text','placeholder="empresa.test" maxlength="253"')}<button>Registrar empresa →</button></form></aside>` : ''}</div>`;
  } else if (tabName === 'affiliates') {
    content.innerHTML = `<div class="panel"><h2>Participantes do programa</h2><p>A aprovação libera o registro de empresas. A suspensão bloqueia novas indicações.</p>${table(['Afiliado','Nível','Situação','Alterar situação'], affiliates.map(u => `<tr><td><strong>${esc(u.name)}</strong><small>${esc(u.email)}</small></td><td>${esc(u.tier.name)}<small>${u.tier.count} empresas aprovadas</small></td><td>${badge(u.status)}</td><td><select aria-label="Status de ${esc(u.name)}" data-status="affiliates" data-id="${u.id}">${['pending','approved','rejected'].map(s => `<option value="${s}" ${u.status === s ? 'selected' : ''}>${statusName[s]}</option>`).join('')}</select></td></tr>`))}</div>`;
  } else if (tabName === 'payments') {
    const eligible = companies.filter(c => c.status === 'approved' && affiliates.some(a => a.id === c.affiliate_id && a.status === 'approved'));
    content.innerHTML = `<div class="callout">Simulação financeira: os lançamentos registram comissões para validação. Marcar como pago não transfere dinheiro. O percentual fica preservado no lançamento.</div><div class="${admin ? 'split' : ''}"><div class="panel"><h2>Lançamentos de comissão</h2>${table(['Empresa / competência','Base','Percentual','Comissão','Situação',...(admin ? ['Registrar baixa'] : [])], payments.map(p => `<tr><td><strong>${esc(p.company_name)}</strong><small>${esc(p.period)} · ${esc(p.affiliate_name)}</small></td><td>${money(p.base_cents)}</td><td>${p.rate_bps / 100}%</td><td>${money(p.amount_cents)}</td><td>${badge(p.status)}${p.reference ? `<small>${esc(p.reference)}</small>` : ''}</td>${admin ? `<td>${p.status === 'pending' ? `<button data-pay="${p.id}">Marcar pago</button>` : '—'}</td>` : ''}</tr>`))}</div>${admin ? `<aside class="panel"><h2>Nova comissão</h2><form id="payment"><label for="company_id">Empresa aprovada</label><select id="company_id" name="company_id" required><option value="">Selecione</option>${eligible.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>${input('period','Competência','month')}${input('base','Base de cálculo (R$)','number','min="0.01" max="1000000" step="0.01"')}<button ${eligible.length ? '' : 'disabled'}>Calcular e lançar →</button></form></aside>` : ''}</div><div id="pay-form"></div>`;
  } else if (tabName === 'tiers') {
    content.innerHTML = `<div class="callout">Regras provisórias para homologação. O nível considera a quantidade de empresas aprovadas. Alterações afetam novos lançamentos; comissões já lançadas mantêm seu percentual.</div><div class="tier-grid">${dashboard.tiers.map(t => `<article class="panel"><form data-tier="${t.id}">${admin ? `${input('tier-name-' + t.id,'Nome do nível','text',`value="${esc(t.name)}" maxlength="80"`)}${input('tier-min-' + t.id,'A partir de empresas aprovadas','number',`value="${t.min_companies}" min="0" max="100000" step="1" ${t.min_companies === 0 ? 'readonly' : ''}`)}${input('tier-rate-' + t.id,'Comissão (%)','number',`value="${t.rate_bps / 100}" min="0" max="100" step="0.01"`)}<button>Salvar regra</button>` : `<div class="eyebrow">${esc(t.name)}</div><h1>${t.rate_bps / 100}%</h1><p>A partir de ${t.min_companies} empresas aprovadas.</p>`}</form></article>`).join('')}</div>`;
  } else if (tabName === 'audit') {
    content.innerHTML = `<div class="panel"><h2>Histórico de ações</h2><p>Últimos 50 eventos. Horários registrados em UTC.</p><div class="log">${dashboard.audit.map(a => `<p><strong>${esc(a.action)}</strong> · ${esc(a.actor_name || 'Sistema')}<br>${esc(a.created_at)} UTC · Registro ${esc(a.target_id)}<br>${esc(a.detail)}</p>`).join('') || 'Nenhum evento.'}</div></div>`;
  }
  if (!admin) {
    const next = dashboard.tiers.find(t => t.min_companies > tier.count);
    const progress = document.createElement('section');
    progress.className = 'level-progress';
    progress.innerHTML = `<div><span class="eyebrow">Sua evolução no programa</span><h2>${next ? `${next.min_companies - tier.count} ${next.min_companies - tier.count === 1 ? 'empresa' : 'empresas'} para chegar ao nível ${esc(next.name)}` : 'Você chegou ao maior nível do programa'}</h2><p>${tier.count} empresas aprovadas · comissão ilustrativa de ${tier.rate_bps / 100}%</p></div><div class="progress-track"><progress aria-label="Progresso para o próximo nível" value="${tier.count}" max="${next?.min_companies || Math.max(1,tier.count)}"></progress><span>${tier.count} / ${next?.min_companies || tier.count} empresas</span></div>`;
    document.querySelector('.tabs').before(progress);
  }
  if (['companies', 'affiliates', 'payments'].includes(tabName)) {
    const wrapper = content.querySelector('.table-wrap');
    if (wrapper) {
      const filters = document.createElement('div');
      filters.className = 'filters';
      filters.innerHTML = '<label class="search-label">Buscar registros<input id="search-records" type="search" placeholder="Buscar nome, empresa ou competência…"></label><label>Filtrar situação<select id="filter-status"><option value="">Todas as situações</option>' + (tabName === 'payments' ? '<option value="pending">Pendente</option><option value="paid">Pago</option>' : '<option value="pending">Pendente</option><option value="approved">Aprovado</option><option value="rejected">Recusado</option>') + '</select></label>';
      wrapper.before(filters);
      const result = document.createElement('p'); result.id = 'filter-result'; result.setAttribute('aria-live','polite'); wrapper.after(result);
    }
  }
}
function publicNav() {
  document.querySelector('nav').innerHTML = '<button class="text" data-view="landing">O programa</button><button class="text" data-view="login">Entrar</button><button data-view="register">Quero participar ↗</button>';
}
const demoBar = document.createElement('section');
demoBar.className = 'demo-bar';
demoBar.setAttribute('aria-label', 'Controles de demonstração');
demoBar.innerHTML = '<div><strong>Explore a experiência</strong><span>Escolha uma visão para testar as telas.</span></div><div class="demo-actions"><button data-demo="affiliate">Painel do afiliado</button><button data-demo="admin">Administração</button><button data-demo="pending">Cadastro pendente</button><button class="demo-reset" data-reset="true">Restaurar exemplo ↺</button></div>';
document.querySelector('header').after(demoBar);
async function loadDashboard() { dashboard = await api('/dashboard'); csrf = dashboard.csrf; renderDashboard(); }
document.addEventListener('click', async event => {
  const button = event.target.closest('button'); if (!button) return;
  try {
    if (button.dataset.demo) { window.frontendDemo.use(button.dataset.demo); tabName = 'companies'; await loadDashboard(); }
    if (button.dataset.reset) { window.frontendDemo.reset(); csrf = null; dashboard = null; landing(); message('Dados fictícios restaurados.'); }
    if (button.dataset.view) { button.dataset.view === 'landing' ? landing() : auth(button.dataset.view === 'register'); }
    if (button.dataset.tab) { tabName = button.dataset.tab; renderDashboard(); }
    if (button.dataset.action === 'refresh') await loadDashboard();
    if (button.dataset.action === 'logout') { await api('/logout', {}); csrf = null; dashboard = null; landing(); }
    if (button.dataset.pay) {
      const payment = dashboard.payments.find(p => p.id === button.dataset.pay);
      document.querySelector('#pay-form').innerHTML = `<section class="auth"><h2>Registrar pagamento de teste</h2><p>${esc(payment.company_name)} · ${money(payment.amount_cents)}. Esta ação registra a baixa no controle de homologação.</p><form data-payment="${payment.id}">${input('reference','Referência fictícia do comprovante','text','maxlength="120"')}<button>Confirmar registro de teste</button></form></section>`;
      document.querySelector('#reference').focus();
    }
  } catch (err) { message(err.message, true); }
});
document.addEventListener('change', async event => {
  const control = event.target;
  if (control.id === 'filter-status') filterRows();
  if (!control.dataset.status) return;
  control.disabled = true;
  try { await api(`/${control.dataset.status}/${control.dataset.id}`, { status: control.value }, 'PATCH'); await loadDashboard(); message('Situação atualizada.'); }
  catch (err) { message(err.message, true); await loadDashboard().catch(() => {}); }
});
function filterRows() {
  const search = document.querySelector('#search-records')?.value.toLocaleLowerCase('pt-BR') || '';
  const status = document.querySelector('#filter-status')?.value || '';
  const rows = [...document.querySelectorAll('#content tbody tr')];
  let visible = 0;
  for (const row of rows) {
    row.hidden = !row.textContent.toLocaleLowerCase('pt-BR').includes(search) || !!status && !row.querySelector(`.badge.${status}`);
    if (!row.hidden) visible++;
  }
  document.querySelector('#filter-result').textContent = visible ? `${visible} registro(s) encontrado(s).` : 'Nenhum registro corresponde à busca. Ajuste os filtros.';
}
document.addEventListener('input', event => { if (event.target.id === 'search-records') filterRows(); });
document.addEventListener('submit', async event => {
  event.preventDefault(); const form = event.target, values = Object.fromEntries(new FormData(form));
  const submit = form.querySelector('button'); if (submit.disabled) return; submit.disabled = true;
  try {
    if (form.id === 'register') { const result = await api('/register', values); auth(false); message(result.message); }
    else if (form.id === 'login') { const result = await api('/login', values); csrf = result.csrf; await loadDashboard(); }
    else if (form.id === 'company') { await api('/companies', values); await loadDashboard(); message('Empresa registrada para análise.'); }
    else if (form.id === 'payment') { await api('/payments', { company_id: values.company_id, period: values.period, base_cents: Math.round(Number(values.base) * 100) }); await loadDashboard(); message('Comissão de teste lançada.'); }
    else if (form.dataset.tier) { const id = form.dataset.tier; await api(`/tiers/${id}`, { name: values['tier-name-' + id], min_companies: Number(values['tier-min-' + id]), rate_bps: Math.round(Number(values['tier-rate-' + id]) * 100) }, 'PATCH'); await loadDashboard(); message('Regra atualizada.'); }
    else if (form.dataset.payment) { await api(`/payments/${form.dataset.payment}/pay`, values, 'PATCH'); await loadDashboard(); message('Baixa de teste registrada. Nenhum dinheiro foi transferido.'); }
  } catch (err) { message(err.message, true); }
  finally { submit.disabled = false; }
});
main.innerHTML = '<div class="loading">Carregando…</div>';
loadDashboard().catch(err => { if (err.status !== 401) message(err.message, true); landing(); });

