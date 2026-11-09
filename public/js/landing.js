// OperumData Afiliados · landing e página de prospecção remota (frontend v2).
// Provisório (pedido de 09/11/2026): o formulário envia por e-mail para parceiros@operumdata.com via enviar.php.
// Nada é armazenado no navegador nem no servidor. Senha não é pedida nem enviada.
// O tipo de cadastro vem de form[data-tipo]: afiliado_indicador ou candidato_prospector_remoto.
(() => {
  // Origem da campanha: guarda só os parâmetros UTM na sessão, para anexar ao cadastro quando o envio existir.
  try {
    const key = 'od.origem';
    if (!sessionStorage.getItem(key)) {
      const q = new URLSearchParams(location.search), origem = {};
      for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
        const v = (q.get(k) || '').slice(0, 100).replace(/[^A-Za-z0-9._-]/g, '');
        if (v) origem[k] = v;
      }
      if (Object.keys(origem).length) sessionStorage.setItem(key, JSON.stringify({ ...origem, landingPath: location.pathname, capturedAt: new Date().toISOString() }));
    }
  } catch { /* armazenamento indisponível: a página funciona sem a origem */ }
  const $ = id => document.getElementById(id);
  const form = $('form-cadastro');
  const msgs = {
    nome: v => v.trim().split(/\s+/).length >= 2 || 'Informe nome e sobrenome.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Confira o e-mail. Exemplo: nome@email.com',
    whats: v => /^\d{10,11}$/.test(v.replace(/\D/g, '')) || 'Informe o WhatsApp com DDD. Exemplo: (11) 98765-4321',
    req: v => !!v.trim() || 'Preencha este campo.',
    check: (v, el) => el.checked || 'Marque para continuar.',
  };
  function setError(el, text) {
    const id = el.id + '-err';
    let box = $(id);
    if (text === true) { el.removeAttribute('aria-invalid'); box?.remove(); return true; }
    el.setAttribute('aria-invalid', 'true');
    if (!box) { box = document.createElement('div'); box.className = 'errmsg'; box.id = id; (el.closest('.pw') || el.closest('.check') || el).after(box); }
    el.setAttribute('aria-describedby', id);
    box.textContent = text;
    return false;
  }
  function check(el) {
    const rule = el.dataset.rule;
    if (rule === 'chips' || rule === 'radio') {
      const ok = !!el.querySelector('input:checked');
      return setError(el, ok || el.dataset.msg || 'Escolha uma opção.');
    }
    return setError(el, msgs[rule](el.value || '', el));
  }
  function validStep(step) {
    const fields = [...$(step).querySelectorAll('[data-rule]')];
    const bad = fields.filter(el => !check(el));
    if (bad.length) { (bad[0].matches('fieldset') ? bad[0].querySelector('input') : bad[0]).focus(); }
    return !bad.length;
  }
  // Erro aparece ao sair do campo; some enquanto a pessoa corrige (evita mudar o layout no momento do clique).
  form.addEventListener('focusout', e => { const el = e.target.closest('[data-rule]'); if (el && el.value !== '' && !el.matches('fieldset,[type=checkbox]') && msgs[el.dataset.rule](el.value, el) !== true) check(el); });
  const recheck = e => { const el = e.target.closest('[data-rule]'); if (el && el.hasAttribute('aria-invalid')) check(el); };
  form.addEventListener('input', recheck); form.addEventListener('change', recheck);
  $('f-whats').addEventListener('input', e => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 11);
    e.target.value = d.length > 6 ? `(${d.slice(0,2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}` : d.length > 2 ? `(${d.slice(0,2)}) ${d.slice(2)}` : d;
  });
  function go(n) {
    form.dataset.step = n;
    $('step1').hidden = n !== 1; $('step2').hidden = n !== 2;
    const step = $(n === 1 ? 'step1' : 'step2');
    $('step-label').textContent = step.dataset.label;
    $('pending-api').classList.remove('show');
    step.querySelector('input,select').focus();
  }
  $('btn-next').addEventListener('click', () => { if (validStep('step1')) go(2); });
  $('btn-back').addEventListener('click', () => go(1));
  const val = id => ($(id)?.value || '').trim();
  function dados() {
    let origem = {};
    try { origem = JSON.parse(sessionStorage.getItem('od.origem') || '{}'); } catch { /* sem origem */ }
    const d = {
      tipo: form.dataset.tipo, nome: val('f-nome'), email: val('f-email'), whatsapp: val('f-whats').replace(/\D/g, ''),
      cidade: val('f-cidade'), uf: val('f-uf'), site_url: val('f-site'), origem, pagina: location.pathname, aceite: true,
    };
    if (d.tipo === 'candidato_prospector_remoto') {
      Object.assign(d, { experiencia: val('f-experiencia'), tempo: val('f-tempo'), disponibilidade: val('f-disp'),
        equipamento: form.querySelector('input[name=equip]:checked')?.value || '' });
    } else {
      Object.assign(d, { perfil: val('f-perfil'),
        setores: [...form.querySelectorAll('#f-setores input:checked')].map(i => i.parentElement.textContent.trim()) });
    }
    return d;
  }
  const status = $('pending-api');
  function aviso(tipo, html) { status.className = 'pending-api show ' + tipo; status.innerHTML = html; }
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validStep('step2')) return;
    const btn = $('btn-send'), rotulo = btn.textContent;
    btn.disabled = true; btn.textContent = 'Enviando…';
    try {
      const r = await fetch('enviar.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados()) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.erro || String(r.status));
      form.querySelectorAll('.step').forEach(s => { s.hidden = true; });
      $('step-label').textContent = 'Recebido';
      aviso('ok', '<b>Recebemos seus dados.</b> A equipe OperumData vai analisar e responder pelo WhatsApp ou e-mail informado.');
      status.focus?.();
    } catch (err) {
      const limite = String(err.message) === 'limite';
      aviso('erro', '<b>' + (limite ? 'Muitos envios seguidos.' : 'Não foi possível enviar agora.') + '</b> Tente de novo em alguns minutos ou escreva para <a href="mailto:parceiros@operumdata.com">parceiros@operumdata.com</a>.');
      btn.disabled = false; btn.textContent = rotulo;
    }
  });
  // Link para uma seção recolhida (ex.: condições da parceria) abre o bloco.
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); const t = a && document.getElementById(a.getAttribute('href').slice(1));
    t?.querySelector('details')?.setAttribute('open', '');
  });
  // Botão fixo no celular: aparece depois do herói e some quando o formulário está visível.
  const sticky = $('sticky');
  if ('IntersectionObserver' in window) {
    const seen = new Map();
    const update = () => sticky.classList.toggle('off', !!(seen.get('hero-cta') || seen.get(form.closest('section').id)));
    const io = new IntersectionObserver(es => { es.forEach(x => seen.set(x.target.id, x.isIntersecting)); update(); });
    const formSection = form.closest('section');
    io.observe($('hero-cta')); io.observe(formSection);
  }
})();
