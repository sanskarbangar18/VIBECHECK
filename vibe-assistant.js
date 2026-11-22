/* Vibe AI assistant for VibeClash. Self-contained add-on. */
(function () {
  if (window.__vibeAI) return;
  window.__vibeAI = true;

  const ENDPOINT = '/api/vibe-ai';
  const T = {
    en: { title:'Vibe AI', hello:'Hi! Main VibeClash ka Vibe AI hoon. Kisi bhi section ko analyze karwao, uska perfect version banwao, ya koi sawal poocho.', ph:'Yahan likho…', send:'Send', analyze:'Analyze', improve:'Perfect banao', sec:'✨ Vibe AI', ctx:'Ye section khula:', ask:'Analyze ya Perfect dabao, ya sawal likho.', thinking:'Soch raha hoon…', err:'Abhi reply nahi aa paya. Thodi der baad try karo.', copy:'Copy', copied:'Copied', open:'Open Vibe AI', close:'Close' },
    hi: { title:'Vibe AI', hello:'नमस्ते! मैं VibeClash का Vibe AI हूँ। किसी भी सेक्शन को analyze करवाओ, उसका perfect version बनवाओ, या कोई सवाल पूछो।', ph:'यहाँ लिखो…', send:'भेजो', analyze:'Analyze करो', improve:'Perfect बनाओ', sec:'✨ Vibe AI', ctx:'यह सेक्शन खुला:', ask:'Analyze या Perfect दबाओ, या सवाल लिखो।', thinking:'सोच रहा हूँ…', err:'अभी जवाब नहीं आ पाया। थोड़ी देर बाद कोशिश करो।', copy:'कॉपी', copied:'कॉपी हो गया', open:'Vibe AI खोलो', close:'बंद करो' },
    mr: { title:'Vibe AI', hello:'नमस्कार! मी VibeClash चा Vibe AI आहे. कोणताही विभाग analyze करून घ्या, त्याची perfect आवृत्ती बनवा, किंवा प्रश्न विचारा.', ph:'येथे लिहा…', send:'पाठवा', analyze:'Analyze करा', improve:'Perfect करा', sec:'✨ Vibe AI', ctx:'हा विभाग उघडला:', ask:'Analyze किंवा Perfect दाबा, किंवा प्रश्न लिहा.', thinking:'विचार करत आहे…', err:'आत्ता उत्तर मिळाले नाही. थोड्या वेळाने पुन्हा प्रयत्न करा.', copy:'कॉपी', copied:'कॉपी झाले', open:'Vibe AI उघडा', close:'बंद करा' }
  };
  const getLang = () => (T[document.documentElement.lang] ? document.documentElement.lang : 'en');
  const L = () => T[getLang()];
  const $ = s => document.querySelector(s);

  const CSS = `
  #vibe-fab{position:fixed;right:18px;bottom:20px;z-index:45;width:62px;height:62px;border-radius:50%;border:0;padding:0;cursor:pointer;background:linear-gradient(135deg,#7C3AED,#EC4899 60%,#06B6D4);box-shadow:0 14px 34px -10px #7C3AED;display:grid;place-items:center;transition:transform .15s}
  #vibe-fab:active{transform:scale(.94)}
  #vibe-fab svg{width:34px;height:34px}
  #vibe-panel{position:fixed;right:18px;bottom:94px;z-index:46;width:min(390px,calc(100vw - 28px));height:min(560px,70vh);display:flex;flex-direction:column;background:var(--bg,#0A0614);color:var(--fg,#F5F3FF);border:1px solid var(--line,rgba(255,255,255,.12));border-radius:22px;box-shadow:0 24px 60px -20px rgba(0,0,0,.6);overflow:hidden;font:15px Inter,'Noto Sans Devanagari',system-ui,sans-serif}
  #vibe-panel.vp-hide{display:none}
  .vp-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--line,rgba(255,255,255,.12));font:700 17px Outfit,Inter,sans-serif}
  .vp-head b{flex:1}
  .vp-x{background:none;border:0;color:inherit;font-size:24px;cursor:pointer;padding:0 4px;line-height:1}
  #vp-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
  .vp-m{max-width:88%}
  .vp-m.me{align-self:flex-end}
  .vp-t{white-space:pre-wrap;word-break:break-word;padding:10px 13px;border-radius:14px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);line-height:1.5}
  .vp-m.me .vp-t{background:linear-gradient(135deg,#7C3AED,#EC4899);border:0;color:#fff}
  .vp-cp{margin-top:4px;background:none;border:0;color:#A9A3C7;font-size:12px;cursor:pointer;padding:2px 4px}
  #vp-chips{display:flex;gap:8px;flex-wrap:wrap;padding:0 14px 8px}
  #vp-chips:empty{display:none}
  .vp-chip{border:1px solid rgba(255,255,255,.2);background:transparent;color:inherit;border-radius:99px;padding:6px 12px;font-size:13px;cursor:pointer}
  #vp-form{display:flex;gap:8px;padding:12px;border-top:1px solid var(--line,rgba(255,255,255,.12))}
  #vp-in{flex:1;min-width:0;padding:11px 13px;border-radius:12px;border:1px solid var(--line,rgba(255,255,255,.12));background:transparent;color:inherit;font:15px Inter,'Noto Sans Devanagari',system-ui,sans-serif}
  #vp-send{border:0;border-radius:12px;padding:0 16px;color:#fff;font-weight:600;background:linear-gradient(135deg,#7C3AED,#EC4899);cursor:pointer}
  button:disabled{opacity:.5;cursor:not-allowed}
  .vp-sec{margin-top:12px;border:1px solid rgba(124,58,237,.5);background:rgba(124,58,237,.12);color:inherit;border-radius:99px;padding:7px 14px;font:600 13px Inter,system-ui,sans-serif;cursor:pointer}
  .vp-sec:active{transform:scale(.97)}
  @media (max-width:520px){#vibe-panel{left:8px;right:8px;width:auto;bottom:86px;height:70vh}#vibe-fab{right:12px;bottom:14px}}
  `;

  let CONTEXT = null;
  const HIST = [];

  function msg(role, text){
    const wrap = document.createElement('div');
    wrap.className = 'vp-m' + (role === 'user' ? ' me' : '');
    const t = document.createElement('div');
    t.className = 'vp-t';
    t.textContent = text;
    wrap.appendChild(t);
    if (role === 'bot'){
      const cp = document.createElement('button');
      cp.type = 'button'; cp.className = 'vp-cp'; cp.textContent = L().copy;
      cp.onclick = () => { navigator.clipboard?.writeText(t.textContent); cp.textContent = L().copied; setTimeout(() => cp.textContent = L().copy, 1500) };
      wrap.appendChild(cp);
    }
    const box = $('#vp-msgs');
    box.appendChild(wrap);
    box.scrollTop = box.scrollHeight;
    return t;
  }

  async function ask(mode, text){
    const lab = L();
    const label = text || ((mode === 'analyze' ? lab.analyze : lab.improve) + (CONTEXT ? ' · ' + CONTEXT.title : ''));
    msg('user', label);
    const bot = msg('bot', lab.thinking);
    const controls = [...document.querySelectorAll('#vp-chips button, #vp-send')];
    controls.forEach(b => b.disabled = true);
    try{
      const r = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode, message: text || '',
          context: CONTEXT ? CONTEXT.text : '',
          contextTitle: CONTEXT ? CONTEXT.title : '',
          history: HIST.slice(-6),
          lang: getLang()
        })
      });
      if (!r.ok) throw new Error('status ' + r.status);
      const j = await r.json();
      const reply = j.reply || lab.err;
      bot.textContent = reply;
      HIST.push({ role:'user', text: label }, { role:'bot', text: reply });
    }catch{
      bot.textContent = lab.err;
    }finally{
      controls.forEach(b => b.disabled = false);
    }
  }

  function renderChips(){
    const c = $('#vp-chips');
    c.innerHTML = '';
    if (!CONTEXT) return;
    [['analyze', L().analyze], ['improve', L().improve]].forEach(([m, l]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'vp-chip'; b.textContent = l;
      b.onclick = () => ask(m, '');
      c.appendChild(b);
    });
  }

  function openPanel(){ $('#vibe-panel').classList.remove('vp-hide'); }
  function closePanel(){ $('#vibe-panel').classList.add('vp-hide'); }

  function openSection(sec, title){
    CONTEXT = {
      title: title.trim().slice(0, 80),
      text: (sec.innerText || sec.textContent || '').replace(/\n{3,}/g, '\n\n').slice(0, 5000)
    };
    renderChips();
    openPanel();
    msg('bot', L().ctx + ' ' + CONTEXT.title + '. ' + L().ask);
  }

  function decorate(){
    document.querySelectorAll('#app section').forEach(sec => {
      if (sec.dataset.vibe) return;
      const h = sec.querySelector('h1, h2');
      if (!h) return;
      sec.dataset.vibe = '1';
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'vp-sec'; b.textContent = L().sec;
      b.addEventListener('click', () => openSection(sec, h.textContent));
      h.insertAdjacentElement('afterend', b);
    });
  }

  function relabel(){
    const lab = L();
    $('#vibe-fab').setAttribute('aria-label', lab.open);
    $('#vp-title').textContent = lab.title;
    $('#vp-x').textContent = '×';
    $('#vp-x').setAttribute('aria-label', lab.close);
    $('#vp-in').placeholder = lab.ph;
    $('#vp-send').textContent = lab.send;
    renderChips();
  }

  function build(){
    const st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);

    const fab = document.createElement('button');
    fab.id = 'vibe-fab'; fab.type = 'button';
    fab.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M36 4 22 34h9l-4 26 15-32h-9z" fill="#fff" stroke="#06B6D4" stroke-width="2" stroke-linejoin="round"/></svg>';
    fab.onclick = () => $('#vibe-panel').classList.contains('vp-hide') ? openPanel() : closePanel();

    const panel = document.createElement('div');
    panel.id = 'vibe-panel'; panel.className = 'vp-hide';
    panel.setAttribute('role', 'dialog');
    panel.innerHTML = '<div class="vp-head"><b id="vp-title"></b><button class="vp-x" id="vp-x" type="button"></button></div>' +
      '<div id="vp-msgs"></div><div id="vp-chips"></div>' +
      '<form id="vp-form" autocomplete="off"><input id="vp-in" maxlength="800"><button type="submit" id="vp-send"></button></form>';
    document.body.append(fab, panel);

    $('#vp-x').onclick = closePanel;
    $('#vp-form').addEventListener('submit', e => {
      e.preventDefault();
      const v = $('#vp-in').value.trim();
      if (!v) return;
      $('#vp-in').value = '';
      ask('ask', v);
    });
    msg('bot', L().hello);
    relabel();
  }

  function boot(){
    build();
    decorate();
    new MutationObserver(decorate).observe(document.getElementById('app'), { childList: true });
    document.addEventListener('change', e => { if (e.target.id === 'langsel') setTimeout(relabel, 0) });
  }

  boot();
})();
