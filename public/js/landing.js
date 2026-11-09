// OperumData Afiliados · landing e página de prospecção remota (frontend v2).
// Os formulários NÃO enviam nem armazenam dados: o envio depende da integração futura com o backend.
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
    senha: v => v.length >= 12 || 'Use 12 ou mais caracteres.',
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
  $('btn-pw')?.addEventListener('click', e => { const p = $('f-senha'); const show = p.type === 'password'; p.type = show ? 'text' : 'password'; e.target.textContent = show ? 'Ocultar' : 'Mostrar'; });
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validStep('step2')) return;
    $('pending-api').classList.add('show');
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
