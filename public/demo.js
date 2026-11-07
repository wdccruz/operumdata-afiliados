/* Protótipo visual: dados locais fictícios. Não autentica nem chama a API. */
(() => {
  const key = 'operumdata.frontend.v1';
  const initial = () => ({
    tiers: [{ id: 1, name: 'Inicial', min_companies: 0, rate_bps: 500 }, { id: 2, name: 'Crescimento', min_companies: 3, rate_bps: 750 }, { id: 3, name: 'Destaque', min_companies: 10, rate_bps: 1000 }],
    affiliates: [
      { id: 'marina', name: 'Marina Exemplo', email: 'marina@example.test', status: 'approved' },
      { id: 'rafael', name: 'Rafael Exemplo', email: 'rafael@example.test', status: 'pending' },
      { id: 'ana', name: 'Ana Demonstração', email: 'ana@example.test', status: 'approved' }
    ],
    companies: [
      { id: 'c1', affiliate_id: 'marina', name: 'Horizonte Tecnologia · fictícia', cnpj: '99000001000100', domain: 'horizonte.example.test', status: 'approved', created_at: '2026-11-01' },
      { id: 'c2', affiliate_id: 'marina', name: 'Vértice Consultoria · fictícia', cnpj: '99000002000100', domain: 'vertice.example.test', status: 'approved', created_at: '2026-11-02' },
      { id: 'c3', affiliate_id: 'marina', name: 'Aurora Digital · fictícia', cnpj: '99000003000100', domain: 'aurora.example.test', status: 'pending', created_at: '2026-11-04' },
      { id: 'c4', affiliate_id: 'ana', name: 'Órbita Serviços · fictícia', cnpj: '99000004000100', domain: 'orbita.example.test', status: 'approved', created_at: '2026-11-05' }
    ],
    payments: [
      { id: 'p1', company_id: 'c1', affiliate_id: 'marina', period: '2026-10', base_cents: 1200000, rate_bps: 500, amount_cents: 60000, status: 'paid', reference: 'DEMO-OUT-001' },
      { id: 'p2', company_id: 'c2', affiliate_id: 'marina', period: '2026-11', base_cents: 850000, rate_bps: 500, amount_cents: 42500, status: 'pending' },
      { id: 'p3', company_id: 'c4', affiliate_id: 'ana', period: '2026-11', base_cents: 1600000, rate_bps: 500, amount_cents: 80000, status: 'pending' }
    ],
    audit: [{ action: 'Demonstração iniciada', actor_name: 'Equipe OperumData', target_id: 'demo', detail: 'Dados fictícios para revisão de interface', created_at: '2026-11-07 10:00:00' }]
  });
  let state;
  try { state = JSON.parse(localStorage.getItem(key)) || initial(); } catch { state = initial(); }
  let profile = null;
  const clone = value => JSON.parse(JSON.stringify(value));
  const error = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
  const persist = () => { try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* Memória é suficiente para demonstração. */ } };
  const tierFor = id => {
    const count = state.companies.filter(c => c.affiliate_id === id && c.status === 'approved').length;
    return { ...[...state.tiers].sort((a,b) => b.min_companies - a.min_companies).find(t => t.min_companies <= count), count };
  };
  const log = (action, target) => { state.audit.unshift({ action, actor_name: profile?.name || 'Visitante', target_id: target, detail: 'Ação simulada no navegador', created_at: new Date().toISOString().slice(0,19).replace('T',' ') }); persist(); };
  const use = role => {
    profile = role === 'admin' ? { id: 'admin', name: 'Administração', email: 'admin@example.test', role: 'admin', status: 'approved' } : { ...state.affiliates.find(a => a.id === (role === 'pending' ? 'rafael' : 'marina')), role: 'affiliate' };
  };
  window.frontendDemo = {
    use,
    reset() { state = initial(); profile = null; persist(); },
    async request(path, body, method) {
      if (path === '/register') {
        if (state.affiliates.some(a => a.email === body.email.toLowerCase())) error('Este e-mail já está na demonstração.');
        const id = crypto.randomUUID();
        state.affiliates.push({ id, name: body.name.trim(), email: body.email.toLowerCase(), status: 'pending' });
        log('Cadastro fictício recebido', id);
        return { message: 'Cadastro simulado! Confira a solicitação no painel administrativo de demonstração.' };
      }
      if (path === '/login') { use('affiliate'); return { csrf: 'demo' }; }
      if (path === '/logout') { profile = null; return { ok: true }; }
      if (!profile) error('Selecione um perfil de demonstração.', 401);
      if (path === '/dashboard') {
        const admin = profile.role === 'admin';
        if (!admin) profile = { ...state.affiliates.find(a => a.id === profile.id), role: 'affiliate' };
        const companies = state.companies.filter(c => admin || c.affiliate_id === profile.id).map(c => ({ ...c, affiliate_name: state.affiliates.find(a => a.id === c.affiliate_id)?.name }));
        const payments = state.payments.filter(p => admin || p.affiliate_id === profile.id).map(p => ({ ...p, company_name: state.companies.find(c => c.id === p.company_id)?.name, affiliate_name: state.affiliates.find(a => a.id === p.affiliate_id)?.name }));
        return clone({ user: profile, csrf: 'demo', tiers: state.tiers, tier: tierFor(profile.id), companies, payments, affiliates: admin ? state.affiliates.map(a => ({ ...a, tier: tierFor(a.id) })) : [], audit: admin ? state.audit : [] });
      }
      if (path === '/companies' && method === 'POST') {
        if (profile.role !== 'affiliate' || profile.status !== 'approved') error('Escolha um afiliado aprovado.');
        const cnpj = body.cnpj.replace(/\D/g, '');
        if (cnpj.length !== 14) error('Informe 14 dígitos para simular o CNPJ.');
        let domain;
        try { domain = new URL(body.domain.includes('://') ? body.domain : `https://${body.domain}`).hostname.replace(/^www\./,'').toLowerCase(); } catch { error('Informe um domínio fictício válido.'); }
        if (!domain.endsWith('.test')) error('Use um domínio fictício terminado em .test.');
        if (state.companies.some(c => c.cnpj === cnpj || c.domain === domain)) error('Empresa já indicada. CNPJ ou domínio duplicado.');
        const id = crypto.randomUUID(); state.companies.unshift({ id, affiliate_id: profile.id, name: body.name, cnpj, domain, status: 'pending' }); log('Empresa indicada', id); return { id };
      }
      if (profile.role !== 'admin') error('Selecione o perfil administrativo para simular esta ação.', 403);
      const [, resource, id, action] = path.split('/');
      if (['affiliates','companies'].includes(resource) && id) {
        const record = state[resource].find(r => String(r.id) === id);
        if (!record) error('Registro não encontrado.');
        record.status = body.status; log('Situação atualizada', id); return { ok: true };
      }
      if (resource === 'tiers' && id) {
        const tier = state.tiers.find(t => String(t.id) === id);
        if (tier.min_companies === 0 && body.min_companies !== 0) error('O primeiro nível deve começar em zero.');
        if (state.tiers.some(t => String(t.id) !== id && t.min_companies === body.min_companies)) error('Já existe um nível com essa quantidade de empresas.');
        Object.assign(tier, body); log('Regra de comissão atualizada', id); return { ok: true };
      }
      if (resource === 'payments' && action === 'pay') {
        const payment = state.payments.find(p => p.id === id);
        if (payment.status === 'paid') error('Este lançamento já está pago na simulação.');
        payment.status = 'paid'; payment.reference = body.reference; log('Baixa de teste registrada', id); return { ok: true };
      }
      if (path === '/payments') {
        if (state.payments.some(p => p.company_id === body.company_id && p.period === body.period)) error('Já existe comissão para essa empresa nesta competência.');
        const company = state.companies.find(c => c.id === body.company_id);
        const rate = tierFor(company.affiliate_id).rate_bps, id = crypto.randomUUID();
        state.payments.unshift({ ...body, id, affiliate_id: company.affiliate_id, rate_bps: rate, amount_cents: Math.round(body.base_cents * rate / 10000), status: 'pending' });
        log('Comissão de teste lançada', id); return { id };
      }
      error('Ação não disponível nesta demonstração.');
    }
  };
})();
