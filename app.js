/* ==========================================================================
   ULISTEN — ứng dụng (router, bản đồ, đặt hẹn, phòng chờ, cuộc gọi)
   ========================================================================== */
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const D = window.VN_MAP, PROV = {}; D.provs.forEach(p => PROV[p.k] = p);
  const R = window.REGIONS, L = window.LISTENERS, SLOTS = window.SLOTS;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().replace(/^(tinh|thanh pho|tp\.?)\s+/, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const avCls = id => ['av-a', 'av-b', 'av-c', 'av-d'][[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 4];
  const store = { get: k => { try { return JSON.parse(localStorage.getItem('ulisten:' + k)); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem('ulisten:' + k, JSON.stringify(v)); } catch (e) {} }, del: k => { try { localStorage.removeItem('ulisten:' + k); } catch (e) {} } };
  const ICON = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><rect x="7" y="5.5" width="3.4" height="13" rx="1"/><rect x="13.6" y="5.5" width="3.4" height="13" rx="1"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    chev: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
    bolt: '<svg class="bolt" viewBox="0 0 24 24"><path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/></svg>',
    mic: '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>',
    micoff: '<svg viewBox="0 0 24 24"><path d="M3 3l18 18M9 9v2a3 3 0 0 0 5 2.2M15 9.5V6a3 3 0 0 0-5.8-1M5.5 11a6.5 6.5 0 0 0 10.4 5.2M18.5 11a6.4 6.4 0 0 1-.4 2.2M12 17.5V21"/></svg>',
    vol: '<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
    end: '<svg viewBox="0 0 24 24"><path d="M3 13.5c5-4.2 13-4.2 18 0l-1.9 2.7a1.2 1.2 0 0 1-1.5.4l-2.7-1.3a1.2 1.2 0 0 1-.7-1.1v-1.7a11.5 11.5 0 0 0-4.4 0v1.7a1.2 1.2 0 0 1-.7 1.1l-2.7 1.3a1.2 1.2 0 0 1-1.5-.4z"/></svg>',
    hand: '<svg viewBox="0 0 24 24"><path d="M12 21c-4 0-7-3-7-7V9.5a1.5 1.5 0 0 1 3 0V12M8 12V5.5a1.5 1.5 0 0 1 3 0V11M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6.5a1.5 1.5 0 0 1 3 0V14c0 4-2 7-5 7z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#f8b866" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7.5-3.6 7.5-9.4V5.3L12 2.6 4.5 5.3v6.3C4.5 17.4 12 21 12 21z"/><path d="M9 11.8l2.1 2.1 4-4"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  };

  /* ---------- toast & modal ---------- */
  let tT; function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(tT); tT = setTimeout(() => t.classList.remove('on'), 3200); }
  let lastFocus = null;
  function modal(html, onMount) {
    const m = $('#modal'), c = $('.modal-card', m); lastFocus = document.activeElement;
    c.innerHTML = `<button class="x" data-close aria-label="Đóng">${ICON.x}</button>` + html; m.hidden = false;
    document.body.style.overflow = 'hidden';
    onMount && onMount(c);
    setTimeout(() => { const f = c.querySelector('input,button.btn,[autofocus]'); f && f.focus(); }, 50);
  }
  function closeModal() { const m = $('#modal'); if (m.hidden) return; m.hidden = true; document.body.style.overflow = ''; m.dispatchEvent(new Event('closed')); lastFocus && lastFocus.focus && lastFocus.focus(); }
  $('#modal').addEventListener('click', e => { if (e.target.closest('[data-close]')) closeModal(); });

  /* ---------- status (open tonight?) ---------- */
  function updateStatus() {
    const h = new Date().getHours(), open = h >= HOURS.open && h < HOURS.close, chip = $('#statusChip');
    chip.classList.toggle('closed', !open);
    chip.lastElementChild.textContent = open ? 'Đang mở · tới 23:00' : (h < HOURS.open ? 'Tối nay mở 20:00 – 23:00' : 'Mở lại 20:00 tối mai');
  }
  updateStatus(); setInterval(updateStatus, 60000);
  addEventListener('scroll', () => $('#top').classList.toggle('solid', scrollY > 30), { passive: true });

  /* ---------- listeners helpers ---------- */
  const listenersIn = k => L.filter(l => l.prov === k);
  const activeProvs = [...new Set(L.map(l => l.prov))];
  // today's slots that have already passed become 'p' so they can't be booked
  const slotPassed = i => { const [h, m] = SLOTS[i].split(':').map(Number), d = new Date(); return d.getHours() * 60 + d.getMinutes() >= h * 60 + m; };
  const slotsOf = (l, day) => { const a = (day ? l.tmr : l.slots).split(''); return day ? a : a.map((s, i) => slotPassed(i) && s !== '-' ? 'p' : s); };
  const todayOver = () => slotPassed(SLOTS.length - 1);
  const earliest = (list, day = 0) => {
    for (let i = 0; i < SLOTS.length; i++) for (const l of list) if (slotsOf(l, day)[i] === 'f') return { l, i };
    return null;
  };
  function nearestActive(k) {
    const p = PROV[k]; let best = null, bd = 1e9;
    activeProvs.forEach(a => { if (a === k) return; const q = PROV[a]; const d = Math.hypot(q.c[0] - p.c[0], q.c[1] - p.c[1]) * (q.r === p.r ? 1 : 1.6); if (d < bd) { bd = d; best = a; } });
    return best;
  }

  /* ---------- audio player (shared) ---------- */
  // VOICES[k] may be one object or a list of voices (e.g. female + male)
  const vlist = k => { const v = VOICES[k]; return !v ? [] : Array.isArray(v) ? v : [v]; };
  const vparse = id => { const [k, i] = String(id).split('.'); return { k, v: vlist(k)[+i || 0] || {} }; };
  const vname = id => { const { k, v } = vparse(id); return PROV[k].n + (v.label ? ' · ' + v.label.toLowerCase() : ''); };
  const audio = new Audio(); audio.preload = 'none';
  const Player = {
    cur: null, sim: null,
    toggle(k, btn) {
      if (this.cur === k) { this.stop(); return; }
      this.stop(); this.cur = k; const v = vparse(k).v;
      $$(`[data-voice="${k}"]`).forEach(b => { b.innerHTML = ICON.pause; b.setAttribute('aria-label', 'Tạm dừng'); b.closest('.vc')?.classList.add('playing'); });
      const tick = (t, d) => $$(`.wv[data-voice-wave="${k}"]`).forEach(w => { const bars = w.children, n = bars.length, p = d ? t / d : 0; for (let i = 0; i < n; i++) bars[i].classList.toggle('p', i / n < p); w.parentElement.querySelector('.tm') && (w.parentElement.querySelector('.tm').textContent = '0:' + String(Math.floor(t)).padStart(2, '0')); });
      const simulate = () => { const d = 4, t0 = performance.now(); const f = () => { const t = (performance.now() - t0) / 1000; tick(Math.min(t, d), d); if (t < d && this.cur === k) this.sim = requestAnimationFrame(f); else if (this.cur === k) this.stop(); }; f(); };
      if (v && v.file) {
        audio.src = v.file; audio.currentTime = 0;
        audio.ontimeupdate = () => tick(audio.currentTime, audio.duration);
        audio.onended = () => this.stop();
        audio.play().catch(() => { toast('Chưa có tệp ghi âm — nhóm thêm file vào thư mục audio/'); simulate(); });
      } else simulate();
    },
    stop() {
      const k = this.cur; this.cur = null; audio.pause(); cancelAnimationFrame(this.sim);
      if (!k) return;
      $$(`[data-voice="${k}"]`).forEach(b => { b.innerHTML = ICON.play; b.setAttribute('aria-label', 'Nghe giọng ' + vname(k)); b.closest('.vc')?.classList.remove('playing'); });
      $$(`.wv[data-voice-wave="${k}"] i`).forEach(i => i.classList.remove('p'));
    }
  };
  function waveHTML(k, n = 36) { let s = 7 + String(k).length * 13, h = ''; for (let i = 0; i < n; i++) { s = (s * 9301 + 49297) % 233280; const env = .35 + .65 * Math.sin(Math.PI * (i + .5) / n); h += `<i style="height:${Math.max(4, (.3 + .7 * s / 233280) * env * 30)}px"></i>`; } return `<div class="wv" data-voice-wave="${k}" aria-hidden="true">${h}</div>`; }
  document.addEventListener('click', e => { const b = e.target.closest('[data-voice]'); if (b) { e.stopPropagation(); Player.toggle(b.dataset.voice, b); } });

  /* ---------- map ---------- */
  const hero = $('#hero'), mapBox = $('#mapBox'), panel = $('#panel'), tip = $('#mapTip');
  const map = new VNMap(mapBox, {
    active: activeProvs,
    onRegion: r => nav('#/ban-do/' + r),
    onProv: k => nav('#/ban-do/' + PROV[k].r + '/' + k),
    onBack: () => back(),
    onCountry: () => nav('#/ban-do'),
    onHover: h => showTip(h),
    onState: s => { mapBox.dataset.lit = s.region || ''; renderCrumb(s); }
  });
  function back() { if (map.level === 'province') nav('#/ban-do/' + map.region); else if (map.level === 'region') nav('#/ban-do'); }
  function renderCrumb(s) {
    const c = $('#crumb'); if (s.level === 'country') { c.innerHTML = ''; return; }
    c.innerHTML = `<button data-go="#/ban-do">Việt Nam</button><span class="sep">›</span>` +
      (s.level === 'province' ? `<button data-go="#/ban-do/${s.region}">${R[s.region].name}</button><span class="sep">›</span><b>${esc(PROV[s.prov].n)}</b>` : `<b>${R[s.region].name}</b>`) +
      `<span class="esc">Esc để lùi lại</span>`;
  }
  mapBox.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) nav(b.dataset.go); });
  $$('.zoombar button').forEach(b => b.addEventListener('click', () => {
    const z = b.dataset.zoom; if (z === 'in') map.zoomBy(.75); else if (z === 'out') { if (map.level === 'country') map.zoomBy(1.33); else back(); } else nav('#/ban-do');
  }));
  let tipPos = { x: 0, y: 0 };
  mapBox.addEventListener('pointermove', e => { const r = mapBox.getBoundingClientRect(); tipPos = { x: e.clientX - r.left, y: e.clientY - r.top }; placeTip(); });
  function placeTip() { if (tip.hidden) return; const W = mapBox.clientWidth; const x = tipPos.x + 280 > W ? tipPos.x - 280 : tipPos.x + 22; tip.style.left = x + 'px'; tip.style.top = Math.max(10, tipPos.y - 40) + 'px'; }
  function showTip(h) {
    if (matchMedia('(hover:none)').matches) return;
    if (map.level === 'country' && h.region) {
      const ps = D.provs.filter(p => p.r === h.region), act = ps.filter(p => activeProvs.includes(p.k));
      tip.innerHTML = `<p class="eyebrow">${R[h.region].name}</p><div class="t">${ps.length} tỉnh, thành</div>${act.length ? `<div class="s"><span class="live"></span>${act.map(p => p.n).join(', ')} đang có người trực</div>` : '<div class="s">Chưa có người trực tối nay</div>'}<div class="go">Bấm để xem các tỉnh →</div>`;
      tip.hidden = false; placeTip();
    } else if (map.level !== 'country' && h.prov) {
      const p = PROV[h.prov], n = listenersIn(h.prov).length;
      tip.innerHTML = `<div class="t">${esc(p.n)}</div>${p.old.length > 1 ? `<div>Gồm ${p.old.join(', ')} cũ</div>` : ''}<div class="s">${n ? `<span class="live"></span>${n} người lắng nghe đang trực` : `<span class="ring"></span>Chưa có người trực · gần nhất: ${PROV[nearestActive(h.prov)].n}`}</div>`;
      tip.hidden = false; placeTip();
    } else tip.hidden = true;
  }

  /* ---------- panel ---------- */
  function renderRegionPanel(r) {
    const ps = D.provs.filter(p => p.r === r).sort((a, b) => listenersIn(b.k).length - listenersIn(a.k).length || a.n.localeCompare(b.n, 'vi'));
    const n = ps.filter(p => listenersIn(p.k).length).length;
    panel.innerHTML = `<div class="pcard">
      <div class="hd"><p class="eyebrow">Miền · ${ps.length} tỉnh, thành</p><span class="chip${n ? ' on' : ''}">${n ? '<span class="live"></span>' : ''}${n} tỉnh có người trực</span></div>
      <h2>${R[r].name}</h2><p class="merged">Chọn tỉnh trên bản đồ hoặc trong danh sách.</p>
      <div class="lst">${ps.map(p => { const c = listenersIn(p.k).length, v = VOICES[p.k]; return `<button class="li" data-prov="${p.k}"><div class="grow"><div class="nm">${esc(p.n)}</div><div class="mt">${c ? c + ' người đang trực' : 'Chưa có người trực'}${p.old.length > 1 ? ' · gồm ' + p.old.slice(1).join(', ') : ''}</div></div>${v ? `<span class="chip on">Có lời chào</span>` : ''}${ICON.chev}</button>`; }).join('')}</div>
    </div>`;
  }
  function renderProvPanel(k) {
    const p = PROV[k], ls = listenersIn(k), v = VOICES[k], sib = D.provs.filter(q => q.r === p.r), i = sib.findIndex(q => q.k === k);
    const prev = sib[(i - 1 + sib.length) % sib.length], next = sib[(i + 1) % sib.length];
    const near = nearestActive(k), e = earliest(ls, todayOver() ? 1 : 0);
    panel.innerHTML = `<div class="pcard">
      <div class="hd"><p class="eyebrow">Tỉnh · ${R[p.r].name}</p><div class="nav2"><button data-prov="${prev.k}" aria-label="Tỉnh trước: ${esc(prev.n)}">← ${esc(prev.n)}</button><span>|</span><button data-prov="${next.k}" aria-label="Tỉnh sau: ${esc(next.n)}">${esc(next.n)} →</button></div></div>
      <div class="hd" style="align-items:flex-end"><h2>${esc(p.n)}</h2>${ls.length ? `<span class="chip on"><span class="live"></span>${ls.length} người đang trực</span>` : `<span class="chip">Chưa có người trực</span>`}</div>
      <p class="merged">${p.old.length > 1 ? 'Gồm ' + p.old.join(', ') + ' cũ' : 'Không thay đổi sau sáp nhập'}</p>
      ${v ? `<div class="voice"><div class="vlabel">Nghe giọng ${esc(p.n)}</div><div class="q">“${esc(COMMON_LINE)}”</div>${vlist(k).map((vv, j) => `<div class="player" style="margin-top:${j ? 12 : 0}px"><button class="play" data-voice="${k}.${j}" aria-label="Nghe giọng ${esc(vname(k + '.' + j))}">${ICON.play}</button>${vv.label ? `<span class="vtag">${esc(vv.label)}</span>` : ''}${waveHTML(k + '.' + j, vlist(k).length > 1 ? 30 : 40)}<span class="tm">0:00</span></div>`).join('')}</div>`
           : `<div class="empty-note">Chưa có lời chào thu sẵn bằng giọng ${esc(p.n)}.${VOICES[near] ? ` Nghe thử giọng gần nhất: <b>${esc(PROV[near].n)}</b>.` : ''} <button class="chip" data-modal="record" style="margin-top:10px">Góp tiếng quê ${esc(p.n)}</button></div>`}
      ${ls.length ? `<p class="sub">Người lắng nghe tối nay</p><div class="lst">${ls.map(l => { const f = slotsOf(l, todayOver() ? 1 : 0).indexOf('f'); return `<button class="li" data-book="${k}" data-l="${l.id}"><span class="av ${avCls(l.id)}">${l.name.split(' ').pop()[0]}</span><div class="grow"><div class="nm">${esc(l.name)}</div><div class="mt">Năm ${l.year} · ${esc(l.town)}</div></div><span class="chip">${f >= 0 ? (todayOver() ? 'tối mai ' : 'rảnh từ ') + SLOTS[f] : 'kín lịch'}</span></button>`; }).join('')}</div>
        <div class="acts"><a class="btn btn-a" href="#/hen/${k}">Chọn người lắng nghe</a>${e ? `<button class="btn btn-g" data-quick="${k}">${ICON.bolt.replace('class="bolt"', 'width="17" height="17" fill="none" stroke="#ffe0a3" stroke-width="1.7"')}Ghép nhanh</button>` : ''}</div>`
        : `<p class="sub">Tối nay</p><div class="empty-note">Chưa có người lắng nghe từ ${esc(p.n)}. Bạn vẫn có thể trò chuyện với <b>${esc(PROV[near].n)}</b> (giọng gần nhất) hoặc chọn <b>giọng bất kỳ</b>.</div>
        <div class="acts"><a class="btn btn-a" href="#/hen/${near}?scope=region">Giọng gần nhất</a><a class="btn btn-g" href="#/hen/${k}?scope=any">Giọng bất kỳ</a></div>`}
    </div>`;
  }
  panel.addEventListener('click', e => {
    const pv = e.target.closest('[data-prov]'); if (pv) { nav('#/ban-do/' + PROV[pv.dataset.prov].r + '/' + pv.dataset.prov); return; }
    const bk = e.target.closest('[data-book]'); if (bk) { nav(`#/hen/${bk.dataset.book}?l=${bk.dataset.l}`); return; }
    const q = e.target.closest('[data-quick]'); if (q) { const e2 = earliest(listenersIn(q.dataset.quick), todayOver() ? 1 : 0); nav(`#/hen/${q.dataset.quick}?l=${e2.l.id}&s=${e2.i}`); }
  });

  /* ---------- search (incl. old names) ---------- */
  const IDX = [];
  D.provs.forEach(p => {
    IDX.push({ k: p.k, t: norm(p.n), label: p.n });
    p.old.forEach(o => { if (norm(o) !== norm(p.n)) IDX.push({ k: p.k, t: norm(o), label: p.n, via: o }); });
    (ALIASES[p.k] || []).forEach(a => IDX.push({ k: p.k, t: norm(a), label: p.n, via: a }));
  });
  const q = $('#q'), qList = $('#qList'); let qSel = -1, qRes = [];
  function search(v) {
    const n = norm(v); if (!n) return [];
    const seen = new Set(), out = [];
    IDX.map(x => ({ ...x, sc: x.t.startsWith(n) ? 0 : x.t.split(' ').some(w => w.startsWith(n)) ? 1 : x.t.includes(n) ? 2 : 9 }))
      .filter(x => x.sc < 9).sort((a, b) => a.sc - b.sc || (a.via ? 1 : 0) - (b.via ? 1 : 0) || a.label.localeCompare(b.label, 'vi'))
      .forEach(x => { if (!seen.has(x.k)) { seen.add(x.k); out.push(x); } });
    return out.slice(0, 7);
  }
  function renderQ() {
    qRes = search(q.value); qSel = qRes.length ? 0 : -1;
    if (!q.value.trim()) { qList.hidden = true; q.setAttribute('aria-expanded', 'false'); return; }
    qList.innerHTML = qRes.length ? qRes.map((x, i) => { const c = listenersIn(x.k).length; return `<li role="option" id="qo${i}" data-k="${x.k}" aria-selected="${i === qSel}"><span>${esc(x.label)} ${x.via ? `<small>· gồm ${esc(x.via)} cũ</small>` : `<small>· ${R[PROV[x.k].r].name}</small>`}</span>${c ? `<span class="st"><span class="live"></span>${c} đang trực</span>` : ''}</li>`; }).join('')
      : `<li class="empty">Không tìm thấy “${esc(q.value)}”. Thử gõ tên tỉnh cũ hoặc thành phố.</li>`;
    qList.hidden = false; q.setAttribute('aria-expanded', 'true');
  }
  function pickQ(k) { q.value = ''; qList.hidden = true; q.blur(); nav('#/ban-do/' + PROV[k].r + '/' + k); }
  q.addEventListener('input', renderQ);
  q.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!qRes.length) return; qSel = (qSel + (e.key === 'ArrowDown' ? 1 : -1) + qRes.length) % qRes.length; $$('li', qList).forEach((li, i) => li.setAttribute('aria-selected', i === qSel)); q.setAttribute('aria-activedescendant', 'qo' + qSel); }
    else if (e.key === 'Enter') { if (qRes[qSel]) pickQ(qRes[qSel].k); }
    else if (e.key === 'Escape') { q.value = ''; renderQ(); q.blur(); e.stopPropagation(); }
  });
  qList.addEventListener('mousedown', e => { const li = e.target.closest('li[data-k]'); if (li) { e.preventDefault(); pickQ(li.dataset.k); } });
  q.addEventListener('blur', () => setTimeout(() => qList.hidden = true, 120));
  $$('[data-region]').forEach(b => b.addEventListener('click', () => nav('#/ban-do/' + b.dataset.region)));
  $$('[data-region]').forEach(b => { b.addEventListener('mouseenter', () => { if (map.level === 'country') { map.hover(D.provs.find(p => p.r === b.dataset.region).k); tip.hidden = true; } }); b.addEventListener('mouseleave', () => map.level === 'country' && map.hover(null)); });

  /* ---------- home sections ---------- */
  function renderVoices() {
    const first = Object.keys(VOICES)[0] + '.0';
    $('#lineCard').innerHTML = `<button class="play" data-voice="${first}" aria-label="Nghe giọng ${esc(vname(first))}">${ICON.play}</button><div style="flex:1"><div class="q">“${esc(COMMON_LINE)}”</div><div class="now">Bấm để nghe · giọng ${esc(vname(first))}</div></div>${waveHTML(first, 46)}`;
    const cards = Object.keys(VOICES).flatMap(k => vlist(k).map((vv, j) => { const c = listenersIn(k).length; return `<div class="vc card"><button class="play" data-voice="${k}.${j}" aria-label="Nghe giọng ${esc(vname(k + '.' + j))}">${ICON.play}</button><div class="grow"><div class="nm">${esc(PROV[k].n)}${vv.label ? ` <span class="vtag">${esc(vv.label)}</span>` : ''}</div><div class="s">${R[PROV[k].r].name}${c ? ' · ' + c + ' người đang trực' : ''}</div></div>${c ? '<span class="live"></span>' : ''}</div>`; }))
      .concat(VOICES_SOON.filter(k => !VOICES[k]).map(k => `<div class="vc card soon" aria-disabled="true"><span class="play ghost">${ICON.mic}</span><div class="grow"><div class="nm">${esc(PROV[k].n)}</div><div class="s">Đang thu âm</div></div></div>`))
      .concat([`<button class="vc card add" data-modal="record"><span class="play ghost" style="border:1px dashed rgba(248,184,102,.5);background:transparent"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f8b866" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span><div class="grow"><div class="nm">Góp tiếng quê bạn</div><div class="s">Thu một câu, khoảng 10 giây</div></div></button>`]);
    $('#voiceGrid').innerHTML = cards.join('');
    $$('#voiceGrid .play.ghost svg').forEach(s => { s.setAttribute('width', 18); s.setAttribute('height', 18); s.setAttribute('fill', 'none'); s.setAttribute('stroke', '#8f99c6'); s.setAttribute('stroke-width', '1.7'); });
    // mini map in step 1
    const sv = $('.step-vis.v1 svg'), NS = 'http://www.w3.org/2000/svg';
    D.provs.forEach(p => { const u = document.createElementNS(NS, 'use'); u.setAttribute('href', '#p-' + p.k); u.setAttribute('fill', p.k === 'hatinh' ? '#ffd892' : p.r === 'trung' ? '#e9a35a' : '#2c3876'); u.setAttribute('stroke', p.r === 'trung' ? '#c9773a' : '#3a478c'); u.setAttribute('stroke-width', '.8'); if (p.k === 'hatinh') u.setAttribute('transform', 'translate(0 -6)'); sv.appendChild(u); });
  }
  renderVoices();

  /* ---------- modals: record + join ---------- */
  document.addEventListener('click', e => {
    const m = e.target.closest('[data-modal]'); if (!m) return;
    if (m.dataset.modal === 'record') openRecorder(); else if (m.dataset.modal === 'join') openJoin();
  });
  function openRecorder() {
    modal(`<p class="eyebrow">Góp tiếng quê</p><h3 id="modalTitle">Đọc một câu bằng tiếng quê bạn</h3>
      <div class="voice" style="margin:14px 0"><div class="q" style="margin:0">“${esc(COMMON_LINE)}”</div></div>
      <div class="player" style="gap:16px"><button class="play" id="recBtn" aria-label="Bắt đầu thu">${ICON.mic.replace('<svg', '<svg width="20" height="20" fill="none" stroke="#3d1f08" stroke-width="1.8" stroke-linecap="round"')}</button><div class="meter" id="recMeter" style="flex:1;height:30px">${'<i></i>'.repeat(32)}</div><span class="tm" id="recT">0:00</span></div>
      <audio id="recOut" controls hidden style="width:100%;margin-top:14px"></audio>
      <p style="font-size:13px;margin-top:14px">Bản demo: bản thu chỉ phát lại trên máy bạn, chưa được gửi đi đâu.</p>
      <div class="m-acts"><button class="btn btn-g" data-close>Để sau</button></div>`, c => {
      let rec, stream, chunks = [], t0, raf, ana;
      const btn = $('#recBtn', c), bars = $$('#recMeter i', c);
      btn.addEventListener('click', async () => {
        if (rec && rec.state === 'recording') { rec.stop(); return; }
        try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (err) { toast('Không mở được micro — hãy cho phép trình duyệt dùng micro.'); return; }
        const ac = new (window.AudioContext || window.webkitAudioContext)(); ana = ac.createAnalyser(); ana.fftSize = 64; ac.createMediaStreamSource(stream).connect(ana);
        const buf = new Uint8Array(ana.frequencyBinCount);
        rec = new MediaRecorder(stream); chunks = []; rec.ondataavailable = e => chunks.push(e.data);
        rec.onstop = () => { cancelAnimationFrame(raf); stream.getTracks().forEach(t => t.stop()); ac.close(); const o = $('#recOut', c); o.src = URL.createObjectURL(new Blob(chunks)); o.hidden = false; btn.innerHTML = ICON.mic.replace('<svg', '<svg width="20" height="20" fill="none" stroke="#3d1f08" stroke-width="1.8" stroke-linecap="round"'); toast('Cảm ơn bạn! Nghe lại bản thu bên dưới.'); };
        rec.start(); t0 = Date.now(); btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="3" fill="#3d1f08"/></svg>';
        const f = () => { ana.getByteFrequencyData(buf); bars.forEach((b, i) => { const v = buf[i % buf.length] / 255; b.style.height = 20 + v * 80 + '%'; b.classList.toggle('on', v > .25); }); const s = Math.floor((Date.now() - t0) / 1000); $('#recT', c).textContent = '0:' + String(s).padStart(2, '0'); if (s >= 15) rec.stop(); else raf = requestAnimationFrame(f); }; f();
      });
      $('#modal').addEventListener('closed', () => { try { rec && rec.state === 'recording' && rec.stop(); } catch (e) {} }, { once: true });
    });
  }
  function openJoin() {
    modal(`<p class="eyebrow">Người lắng nghe</p><h3 id="modalTitle">Năm nhất của bạn từng khó khăn?</h3><p>Hãy là giọng nói mà bạn từng cần đến. Người lắng nghe là sinh viên năm 2–4, được giới thiệu qua hội đồng hương hoặc câu lạc bộ, phỏng vấn và hoàn thành khoá đào tạo của U-Care trước khi nhận ca.</p>
      <ul style="color:var(--ink-2);font-size:14.5px;line-height:1.9;padding-left:18px;margin:8px 0 0"><li>Tối đa 2 ca mỗi tuần, có giám sát và họp nhóm hằng tuần</li><li>Chứng nhận đào tạo và giờ tình nguyện</li><li>Không bao giờ phải xử lý một mình</li></ul>
      <div class="m-acts"><button class="btn btn-a" data-close onclick="setTimeout(()=>document.dispatchEvent(new CustomEvent('ul:toast',{detail:'Tụi mình sẽ mở đơn đăng ký sớm — cảm ơn bạn!'})),60)">Mình muốn tham gia</button></div>`);
  }
  document.addEventListener('ul:toast', e => toast(e.detail));
  document.addEventListener('click', e => { const s = e.target.closest('[data-scroll]'); if (!s) return; e.preventDefault(); const go = () => document.getElementById(s.dataset.scroll).scrollIntoView({ behavior: 'smooth' }); if (route().view !== 'home' || map.level !== 'country') { nav('#/'); setTimeout(go, 350); } else go(); });

  /* ==========================================================================
     BOOKING
     ========================================================================== */
  const B = { prov: null, scope: 'prov', g: '', topics: new Set(), day: 0, pick: null };
  function renderBook(k, params) {
    const p = PROV[k]; B.prov = k;
    B.scope = params.scope || (listenersIn(k).length ? 'prov' : 'region'); B.day = todayOver() ? 1 : 0; B.pick = null;
    if (params.l) { const l = L.find(x => x.id === params.l); if (l) { if (l.prov !== k) B.scope = PROV[l.prov].r === p.r ? 'region' : 'any'; const s = params.s != null ? +params.s : slotsOf(l, B.day).indexOf('f'); if (s >= 0 && slotsOf(l, B.day)[s] === 'f') B.pick = { id: l.id, i: s }; } }
    $('#bkStep1').textContent = 'Chạm · ' + p.n;
    $('#fTopic').innerHTML = TOPICS.map(t => `<button class="chip" role="checkbox" aria-checked="${B.topics.has(t)}" data-t="${esc(t)}">${esc(t)}</button>`).join('');
    $$('#fGender .chip').forEach(c => c.classList.toggle('on', c.dataset.g === B.g));
    $$('#fDay .chip').forEach(c => c.classList.toggle('on', +c.dataset.d === B.day));
    $('#fDay [data-d="0"]').textContent = todayOver() ? 'Tối nay (đã hết giờ)' : 'Tối nay';
    drawBook();
  }
  function pool(scope) {
    const p = PROV[B.prov];
    return L.filter(l => scope === 'prov' ? l.prov === B.prov : scope === 'region' ? PROV[l.prov].r === p.r : true);
  }
  function drawBook() {
    const p = PROV[B.prov];
    const opts = [['prov', `Cùng tỉnh · ${p.n}`], ['region', `Cùng miền · ${R[p.r].name}`], ['any', 'Giọng nào cũng được']];
    $('#fScope').innerHTML = opts.map(([v, t]) => `<button class="opt" role="radio" aria-checked="${B.scope === v}" data-scope="${v}"><span class="rd"></span>${esc(t)}<span class="ct">${pool(v).length} người</span></button>`).join('');
    let list = pool(B.scope).filter(l => !B.g || l.g === B.g);
    const hit = l => l.topics.filter(t => B.topics.has(t)).length;
    list.sort((a, b) => hit(b) - hit(a) || (a.prov === B.prov ? -1 : 0) - (b.prov === B.prov ? -1 : 0));
    $('.book-head h1').textContent = B.day ? 'Tối mai, ai đang trực?' : 'Tối nay, ai đang trực?';
    const e = earliest(list, B.day);
    $('#quick').innerHTML = e ? `${ICON.bolt}<div class="grow"><b>Ghép nhanh: người phù hợp rảnh sớm nhất</b><small>${esc(e.l.name)} · giọng ${esc(PROV[e.l.prov].n)} · ${SLOTS[e.i]} ${B.day ? 'tối mai' : 'tối nay'}</small></div><button class="btn btn-g btn-s" data-pick="${e.l.id}" data-i="${e.i}">Chọn luôn</button>` : `${ICON.bolt}<div class="grow"><b>Chưa có khung giờ trống phù hợp</b><small>Thử mở rộng phạm vi giọng hoặc chọn tối mai.</small></div>`;
    const head = `<div class="gr head" role="row"><div class="gh" role="columnheader">Người lắng nghe</div>${SLOTS.map(s => `<div class="gh" role="columnheader">${s}</div>`).join('')}</div>`;
    const rows = list.map(l => { const sl = slotsOf(l, B.day), picked = B.pick && B.pick.id === l.id;
      return `<div class="gr${picked ? ' picked' : ''}" role="row"><div class="who" role="rowheader"><span class="av ${avCls(l.id)}">${l.name.split(' ').pop()[0]}</span><div class="grow"><div class="nm">${esc(l.name)}</div><div class="intro">“${esc(l.intro)}”</div><div class="tags"><span class="tag">Năm ${l.year}</span><span class="tag">${esc(PROV[l.prov].n)}</span>${l.topics.map(t => `<span class="tag${B.topics.has(t) ? ' hit' : ''}">${esc(t)}</span>`).join('')}</div></div></div>` +
        sl.map((s, i) => { const sel = picked && B.pick.i === i; if (s === 'f') return `<button class="cell ${sel ? 's' : 'f'}" role="gridcell" data-pick="${l.id}" data-i="${i}" aria-pressed="${sel}" aria-label="${esc(l.name)} lúc ${SLOTS[i]}">${sel ? '✓ ' : ''}${SLOTS[i]}</button>`; if (s === 'b') return `<div class="cell b" role="gridcell" aria-label="${SLOTS[i]} đã kín"><span class="slot-m">${SLOTS[i]}&nbsp;</span>kín</div>`; if (s === 'p') return `<div class="cell o past" role="gridcell" aria-label="${SLOTS[i]} đã qua">đã qua</div>`; return `<div class="cell o" role="gridcell">—</div>`; }).join('') + `</div>`; }).join('');
    const wider = B.scope === 'prov' ? pool('region').length - pool('prov').length : B.scope === 'region' ? pool('any').length - pool('region').length : 0;
    const more = wider > 0 ? `<div class="more"><span>${wider} người khác ${B.scope === 'prov' ? 'ở ' + R[p.r].name : 'ở các miền khác'}</span><button data-scope="${B.scope === 'prov' ? 'region' : 'any'}">Mở rộng để xem thêm khung giờ →</button></div>` : '';
    $('#grid').innerHTML = list.length ? head + rows + more : `<div class="none">Không có ai khớp bộ lọc. <button class="chip" data-scope="any" style="margin-left:8px">Xem tất cả người lắng nghe</button></div>`;
    drawBar();
  }
  function drawBar() {
    const bar = $('#bkBar'); if (!B.pick) { bar.hidden = true; return; }
    const l = L.find(x => x.id === B.pick.id);
    bar.innerHTML = `<span class="av ${avCls(l.id)}" style="width:46px;height:46px;font-size:18px">${l.name.split(' ').pop()[0]}</span><div class="grow"><b>${esc(l.name)} · giọng ${esc(PROV[l.prov].n)} · ${SLOTS[B.pick.i]} ${B.day ? 'tối mai' : 'tối nay'}</b><small>Gọi ngay trên web. Đến giờ, trang sẽ báo để bạn bấm “Vào cuộc gọi” — không cần số điện thoại.</small></div><button class="btn btn-a" id="bkGo">Tiếp tục</button>`;
    bar.hidden = false;
  }
  $('#filters').addEventListener('click', e => {
    const s = e.target.closest('[data-scope]'); if (s) { B.scope = s.dataset.scope; drawBook(); return; }
    const g = e.target.closest('[data-g]'); if (g) { B.g = g.dataset.g; $$('#fGender .chip').forEach(c => c.classList.toggle('on', c === g)); drawBook(); return; }
    const t = e.target.closest('[data-t]'); if (t) { const v = t.dataset.t; B.topics.has(v) ? B.topics.delete(v) : B.topics.add(v); t.setAttribute('aria-checked', B.topics.has(v)); drawBook(); return; }
    const d = e.target.closest('[data-d]'); if (d) { B.day = +d.dataset.d; B.pick = null; $$('#fDay .chip').forEach(c => c.classList.toggle('on', c === d)); drawBook(); }
  });
  $('.book-main').addEventListener('click', e => {
    const s = e.target.closest('[data-scope]'); if (s) { B.scope = s.dataset.scope; drawBook(); $('#filters').scrollIntoView({ block: 'nearest' }); return; }
    const c = e.target.closest('[data-pick]'); if (c) { B.pick = { id: c.dataset.pick, i: +c.dataset.i }; drawBook(); }
  });
  $('#bkBar').addEventListener('click', e => { if (e.target.closest('#bkGo')) confirmBook(); });
  function confirmBook() {
    const l = L.find(x => x.id === B.pick.id), nick = store.get('nick') || '';
    modal(`<p class="eyebrow">Xác nhận hẹn</p><h3 id="modalTitle">${esc(l.name)} · ${SLOTS[B.pick.i]} ${B.day ? 'tối mai' : 'tối nay'}</h3>
      <div class="field"><label for="nick">Người lắng nghe gọi bạn là gì?</label><input type="text" id="nick" maxlength="20" value="${esc(nick)}" placeholder="Ví dụ: Lan" autocomplete="nickname"><small>Chỉ cần tên gọi, không cần tên thật.</small></div>
      <label class="check"><input type="checkbox" id="c1"><span>Mình hiểu đây là cuộc trò chuyện <b>lắng nghe</b>, không thay thế tư vấn hay điều trị tâm lý.</span></label>
      <label class="check"><input type="checkbox" id="c2"><span>Mình biết cuộc gọi được giữ kín và không ghi âm. Nếu có dấu hiệu nguy hiểm tới tính mạng, giám sát viên có thể kích hoạt hỗ trợ khẩn cấp.</span></label>
      <div class="m-acts"><button class="btn btn-g" data-close>Quay lại</button><button class="btn btn-a" id="okBook" disabled>Xác nhận hẹn</button></div>`, c => {
      const ok = $('#okBook', c), upd = () => ok.disabled = !($('#nick', c).value.trim() && $('#c1', c).checked && $('#c2', c).checked);
      c.addEventListener('input', upd); c.addEventListener('change', upd); upd();
      ok.addEventListener('click', () => {
        const nk = $('#nick', c).value.trim(); store.set('nick', nk);
        const d = new Date(); d.setDate(d.getDate() + B.day); const [h, m] = SLOTS[B.pick.i].split(':').map(Number); d.setHours(h, m, 0, 0);
        store.set('booking', { lid: l.id, prov: B.prov, slot: B.pick.i, day: B.day, at: d.getTime(), nick: nk, code: 'UL-' + String(d.getDate()).padStart(2, '0') + String(d.getMonth() + 1).padStart(2, '0') + '-' + Math.floor(1000 + Math.random() * 9000) });
        closeModal(); nav('#/phong-cho');
      });
    });
  }

  /* ==========================================================================
     WAITING ROOM
     ========================================================================== */
  let waitTimer, micStream, micRaf;
  function stopMic() { cancelAnimationFrame(micRaf); if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; } }
  function renderWait() {
    const bk = store.get('booking'), root = $('#waitRoot');
    if (!bk) { root.innerHTML = `<div style="grid-column:1/-1;text-align:center"><h1>Bạn chưa có lịch hẹn nào</h1><p class="sub">Chọn quê của bạn để bắt đầu.</p><a class="btn btn-a" href="#/ban-do">Mở bản đồ tiếng quê</a></div>`; return; }
    const l = L.find(x => x.id === bk.lid), st = { notif: typeof Notification !== 'undefined' && Notification.permission === 'granted', mic: false };
    root.innerHTML = `<div class="lamp"><svg viewBox="-200 -200 400 400" aria-hidden="true"><defs><linearGradient id="arc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe2a6"/><stop offset="1" stop-color="#e48a45"/></linearGradient></defs><circle r="190" fill="none" stroke="#9fb0e8" stroke-opacity=".07"/><circle r="160" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="5"/><circle id="arcP" r="160" fill="none" stroke="url(#arc)" stroke-width="5" stroke-linecap="round" stroke-dasharray="1005" stroke-dashoffset="1005" transform="rotate(-90)" style="transition:stroke-dashoffset 1s linear"/></svg><div class="face"><div class="t">${SLOTS[bk.slot]}</div><div class="s" id="cd">…</div></div></div>
      <div><p class="eyebrow">Phòng chờ · ${bk.day ? 'tối mai' : 'tối nay'}</p><h1>${esc(l.name)} sẽ trò chuyện với ${esc(bk.nick)} lúc ${SLOTS[bk.slot]}.</h1>
        <p class="sub">Đến giờ, nút “Vào cuộc gọi” sẽ sáng lên. Không cần nghĩ trước sẽ nói gì — “em mệt quá” cũng là một câu mở đầu rất ổn.</p>
        <div class="checklist">
          <div class="ck${st.notif ? ' ok' : ''}" id="ckN"><span class="n">${st.notif ? '✓' : '1'}</span><div class="grow"><b>Bật thông báo</b><small>Để trang nhắc bạn lúc ${SLOTS[bk.slot]}, kể cả khi đang ở tab khác.</small></div>${st.notif ? '' : '<button class="btn btn-g btn-s" id="btnN">Bật</button>'}</div>
          <div class="ck" id="ckM"><span class="n">2</span><div class="grow"><b>Kiểm tra micro</b><small id="micMsg">Nói thử một câu, vạch xanh sẽ nhảy theo giọng bạn.</small></div><div class="meter" id="micMeter" hidden>${'<i></i>'.repeat(12)}</div><button class="btn btn-g btn-s" id="btnM">Kiểm tra</button></div>
          <div class="ck"><span class="n">3</span><div class="grow"><b>Tìm một góc yên tĩnh</b><small>Đeo tai nghe nếu có, rót một cốc nước ấm.</small></div></div>
        </div>
        <div class="wait-acts"><button class="btn btn-a" id="btnJoin" disabled>Vào cuộc gọi</button><button class="btn btn-g btn-s" id="btnDemo">Vào sớm (bản demo)</button><a class="lnk" href="#/hen/${bk.prov}?l=${bk.lid}">Đổi giờ</a><button class="lnk" id="btnCancel">Huỷ hẹn</button></div>
        <p style="font-size:13px;color:var(--ink-3);margin-top:18px">Mã hẹn ${esc(bk.code)} · Bạn có thể huỷ bất cứ lúc nào, không cần giải thích.</p></div>`;
    const tick = () => {
      const ms = bk.at - Date.now(), join = $('#btnJoin'); if (!join) return;
      const m = Math.ceil(ms / 60000); let label;
      if (ms <= 0 && ms > -20 * 60000) label = 'đến giờ rồi'; else if (ms <= -20 * 60000) label = 'đã qua giờ hẹn'; else if (m < 60) label = 'còn ' + m + ' phút'; else label = 'còn ' + Math.floor(m / 60) + ' giờ ' + (m % 60) + ' phút';
      $('#cd').textContent = label; join.disabled = !(ms < 5 * 60000 && ms > -20 * 60000);
      const frac = Math.max(0, Math.min(1, 1 - ms / (60 * 60000))); $('#arcP').style.strokeDashoffset = 1005 * (1 - frac);
      if (ms < 5 * 60000 && ms > 4 * 60000 && st.notif && !bk.notified) { bk.notified = true; store.set('booking', bk); try { new Notification('ULISTEN', { body: `${l.name} sẵn sàng lúc ${SLOTS[bk.slot]}. Vào cuộc gọi nhé.`, icon: 'favicon.svg' }); } catch (e) {} }
    };
    tick(); clearInterval(waitTimer); waitTimer = setInterval(tick, 15000);
    $('#btnN') && $('#btnN').addEventListener('click', async () => { if (typeof Notification === 'undefined') { toast('Trình duyệt này chưa hỗ trợ thông báo.'); return; } const r = await Notification.requestPermission(); if (r === 'granted') { $('#ckN').classList.add('ok'); $('#ckN .n').textContent = '✓'; $('#btnN').remove(); toast('Đã bật thông báo.'); } else toast('Bạn có thể bật lại thông báo trong cài đặt trình duyệt.'); });
    $('#btnM').addEventListener('click', async () => {
      try { stopMic(); micStream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { $('#micMsg').textContent = 'Chưa dùng được micro. Hãy bấm biểu tượng ổ khoá trên thanh địa chỉ và cho phép micro.'; return; }
      const ac = new (window.AudioContext || window.webkitAudioContext)(), an = ac.createAnalyser(); an.fftSize = 256; ac.createMediaStreamSource(micStream).connect(an);
      const buf = new Uint8Array(an.fftSize), bars = $$('#micMeter i'); $('#micMeter').hidden = false; $('#btnM').hidden = true; let heard = 0;
      const f = () => { an.getByteTimeDomainData(buf); let s = 0; for (const v of buf) s += (v - 128) ** 2; const lv = Math.min(1, Math.sqrt(s / buf.length) / 30); bars.forEach((b, i) => { const on = i / bars.length < lv; b.classList.toggle('on', on); b.style.height = (30 + (on ? 70 * (1 - i / bars.length * .5) : 0)) + '%'; }); if (lv > .25) heard++; if (heard > 12 && !$('#ckM').classList.contains('ok')) { $('#ckM').classList.add('ok'); $('#ckM .n').textContent = '✓'; $('#micMsg').textContent = 'Micro hoạt động tốt.'; } micRaf = requestAnimationFrame(f); }; f();
    });
    const enter = () => { stopMic(); nav('#/goi'); };
    $('#btnJoin').addEventListener('click', enter); $('#btnDemo').addEventListener('click', enter);
    $('#btnCancel').addEventListener('click', () => modal(`<h3 id="modalTitle">Huỷ hẹn với ${esc(l.name)}?</h3><p>Huỷ cũng không sao đâu. Khi nào cần, ULISTEN vẫn ở đây mỗi tối.</p><div class="m-acts"><button class="btn btn-g" data-close>Giữ lịch hẹn</button><button class="btn btn-a" id="okCancel">Huỷ hẹn</button></div>`, c => $('#okCancel', c).addEventListener('click', () => { store.del('booking'); closeModal(); toast('Đã huỷ hẹn.'); nav('#/'); })));
  }

  /* ==========================================================================
     CALL (demo: real microphone, simulated listener)
     ========================================================================== */
  const C = { t0: 0, timer: null, raf: null, stream: null, ac: null, muted: false };
  function endCallMedia() { clearInterval(C.timer); cancelAnimationFrame(C.raf); if (C.stream) C.stream.getTracks().forEach(t => t.stop()); C.stream = null; if (C.ac) { C.ac.close(); C.ac = null; } }
  function renderCall() {
    const bk = store.get('booking'); if (!bk) { nav('#/phong-cho'); return; }
    const l = L.find(x => x.id === bk.lid), root = $('#callRoot'); C.muted = false;
    root.innerHTML = `<div class="badges"><span class="chip">Không ghi âm</span><span class="chip" id="net"><span class="live" style="background:var(--ok);box-shadow:0 0 0 4px rgba(155,227,184,.18)"></span>Kết nối tốt</span></div>
      <div class="ava" aria-hidden="true"><div class="r r1"></div><div class="r r2"></div><div class="r r3"></div><div class="core">${l.name.split(' ').pop()[0]}</div></div>
      <div class="nm">${esc(l.name)}</div><div class="meta">giọng ${esc(PROV[l.prov].n)} · năm ${l.year}</div>
      <div class="clock" id="clk" aria-live="off">00:00</div><div class="speaking" id="spk" aria-live="polite">Đang kết nối…</div>
      <aside class="side-note card"><div class="row">${ICON.shield}<div><b style="font-weight:400">Ca trực có giám sát</b><div style="font-size:13px;color:var(--ink-3)">Giám sát viên đang sẵn sàng</div></div></div><hr><p>Bạn có thể dừng bất cứ lúc nào. Không cần giải thích.</p><p>Cuộc gọi chỉ có giọng nói — không bật camera.</p></aside>
      <button class="help-btn" id="help">${ICON.hand}<span><b style="font-weight:400">Mình cần giúp ngay</b><small>Nối giám sát viên · số khẩn cấp 115</small></span></button>
      <div class="ctrl"><button class="cb" id="cMute" aria-pressed="false"><span class="o">${ICON.mic}</span><span class="lb2">Tắt tiếng</span></button><button class="cb" id="cVol" aria-expanded="false"><span class="o">${ICON.vol}</span>Âm lượng</button><button class="cb end" id="cEnd"><span class="o">${ICON.end}Kết thúc</span></button><div class="vol" id="volBox" hidden><input type="range" min="0" max="100" value="80" aria-label="Âm lượng"></div></div>`;
    const rings = $$('.ava .r', root), spk = $('#spk');
    const start = async () => {
      let an = null, buf;
      try { C.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); C.ac = new (window.AudioContext || window.webkitAudioContext)(); an = C.ac.createAnalyser(); an.fftSize = 256; C.ac.createMediaStreamSource(C.stream).connect(an); buf = new Uint8Array(an.fftSize); }
      catch (e) { toast('Chưa dùng được micro — bạn vẫn có thể nghe. Hãy cho phép micro để nói.'); }
      setTimeout(() => {
        C.t0 = Date.now(); spk.textContent = `${l.name} đang nghe bạn`;
        C.timer = setInterval(() => { const s = Math.floor((Date.now() - C.t0) / 1000); $('#clk').textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); if (s === 18 * 60) toast('Còn khoảng 2 phút — bạn có thể hẹn lần sau.'); }, 500);
        let quiet = 0;
        const f = () => {
          let lv = 0; if (an && !C.muted) { an.getByteTimeDomainData(buf); let s = 0; for (const v of buf) s += (v - 128) ** 2; lv = Math.min(1, Math.sqrt(s / buf.length) / 25); }
          const t = performance.now() / 1000; let other = 0;
          if (lv < .12) { quiet++; if (quiet > 90) other = Math.max(0, Math.sin(t * 2.1) * .5 + Math.sin(t * 5.3) * .25 + .2); } else quiet = 0;
          const v = Math.max(lv, other * .6);
          rings.forEach((r, i) => r.style.setProperty('--s', 1 + v * (0.06 + i * 0.03)));
          spk.textContent = lv >= .12 ? 'Bạn đang nói…' : other > .3 ? `${l.name} đang nói…` : `${l.name} đang nghe bạn`;
          C.raf = requestAnimationFrame(f);
        }; f();
      }, 1600);
    };
    start();
    $('#cMute').addEventListener('click', e => { C.muted = !C.muted; const b = e.currentTarget; b.setAttribute('aria-pressed', C.muted); b.querySelector('.o').innerHTML = C.muted ? ICON.micoff : ICON.mic; b.querySelector('.lb2').textContent = C.muted ? 'Bật tiếng' : 'Tắt tiếng'; if (C.stream) C.stream.getAudioTracks().forEach(t => t.enabled = !C.muted); toast(C.muted ? 'Đã tắt micro' : 'Đã bật micro'); });
    $('#cVol').addEventListener('click', e => { const v = $('#volBox'); v.hidden = !v.hidden; e.currentTarget.setAttribute('aria-expanded', !v.hidden); });
    $('#volBox input').addEventListener('input', e => audio.volume = e.target.value / 100);
    $('#cEnd').addEventListener('click', () => modal(`<h3 id="modalTitle">Kết thúc cuộc trò chuyện?</h3><p>Bạn có thể hẹn lại ${esc(l.name)} bất cứ tối nào.</p><div class="m-acts"><button class="btn btn-g" data-close>Nói tiếp</button><button class="btn btn-a" id="okEnd" style="background:var(--end);color:#fff;box-shadow:none">Kết thúc</button></div>`, c => $('#okEnd', c).addEventListener('click', () => { const dur = Math.floor((Date.now() - C.t0) / 1000); store.set('lastCall', { lid: l.id, prov: bk.prov, dur }); store.del('booking'); endCallMedia(); closeModal(); nav('#/xong'); })));
    $('#help').addEventListener('click', () => modal(`<p class="eyebrow" style="color:var(--red)">Cần giúp ngay</p><h3 id="modalTitle">Bạn không phải ở một mình với chuyện này.</h3>
      <a class="btn btn-a" href="tel:115" style="width:100%;margin-top:6px;background:var(--end);color:#fff;box-shadow:none">Gọi cấp cứu 115</a>
      <button class="btn btn-g" id="sup" style="width:100%;margin-top:10px">Nối với giám sát viên ca trực</button>
      <div id="supMsg"></div>
      <p style="font-size:13.5px;margin-top:16px">Nếu bạn hoặc ai đó đang gặp nguy hiểm tới tính mạng, hãy gọi 115 hoặc đến cơ sở y tế gần nhất ngay.</p>
      <div class="m-acts"><button class="btn btn-g" data-close>Quay lại cuộc trò chuyện</button></div>`, c => $('#sup', c).addEventListener('click', e => { e.currentTarget.disabled = true; $('#supMsg', c).innerHTML = `<div class="sup"><span class="live" style="background:var(--ok);box-shadow:0 0 0 4px rgba(155,227,184,.2)"></span>Đã báo giám sát viên ca trực. Họ đang tham gia cuộc gọi (bản demo).</div>`; })));
  }

  /* ---------- after call ---------- */
  function renderDone() {
    const lc = store.get('lastCall') || {}, l = L.find(x => x.id === lc.lid) || L[0];
    const opts = [['Nặng lòng hơn', '−2'], ['Hơi nặng', '−1'], ['Như cũ', '0'], ['Nhẹ hơn', '+1'], ['Nhẹ lòng nhiều', '+2']];
    $('#doneRoot').innerHTML = `<p class="eyebrow">Cảm ơn bạn đã ở đây tối nay</p><h1>Sau cuộc trò chuyện với ${esc(l.name)}, bạn thấy thế nào?</h1>
      <div class="scale" role="group" aria-label="Cảm nhận sau cuộc gọi">${opts.map(([t, v]) => `<button aria-pressed="false" data-v="${v}"><b>${v}</b>${t}</button>`).join('')}</div>
      <p style="font-size:13px;color:var(--ink-3)">Câu trả lời ẩn danh, chỉ dùng để cải thiện dịch vụ.</p>
      <label class="check"><input type="checkbox" id="ucare"><span>Mình muốn được giới thiệu tới <b>U-Care</b> để trò chuyện sâu hơn với chuyên gia.</span></label>
      <div class="m-acts" style="justify-content:center;max-width:520px;margin:20px auto 0"><a class="btn btn-a" href="#/hen/${l.prov}?l=${l.id}">Hẹn lần sau</a><a class="btn btn-g" href="#/">Về trang chủ</a></div>`;
    $$('.scale button').forEach(b => b.addEventListener('click', () => { $$('.scale button').forEach(x => x.setAttribute('aria-pressed', x === b)); toast('Cảm ơn bạn đã chia sẻ.'); }));
    $('#ucare').addEventListener('change', e => e.target.checked && toast('Giảng viên U-Care sẽ liên hệ qua ULISTEN trong giờ hành chính.'));
  }

  /* ==========================================================================
     ROUTER
     ========================================================================== */
  function route() {
    const h = location.hash.replace(/^#/, '') || '/'; const [path, qs] = h.split('?'); const parts = path.split('/').filter(Boolean);
    const params = Object.fromEntries(new URLSearchParams(qs || ''));
    if (!parts.length) return { view: 'home', params };
    if (parts[0] === 'ban-do') return { view: 'home', map: true, region: parts[1], prov: parts[2], params };
    if (parts[0] === 'hen' && PROV[parts[1]]) return { view: 'book', prov: parts[1], params };
    if (parts[0] === 'phong-cho') return { view: 'wait', params };
    if (parts[0] === 'goi') return { view: 'call', params };
    if (parts[0] === 'xong') return { view: 'done', params };
    return { view: 'home', params };
  }
  function nav(h) { if (location.hash === h) onRoute(); else location.hash = h; }
  let prevView = null;
  function onRoute() {
    const r = route();
    if (prevView === 'call' && r.view !== 'call') endCallMedia();
    if (prevView === 'wait' && r.view !== 'wait') { stopMic(); clearInterval(waitTimer); }
    Player.stop(); closeModal();
    $$('.view').forEach(v => v.hidden = v.dataset.view !== r.view);
    $('#foot').hidden = r.view === 'call';
    $('#bkBar').hidden = true;
    if (r.view === 'home') {
      const explore = !!(r.map && (r.region || r.prov));
      hero.classList.toggle('explore', explore);
      if (prevView !== 'home' || explore) scrollTo({ top: 0, behavior: prevView === 'home' ? 'smooth' : 'auto' });
      requestAnimationFrame(() => {
        if (r.prov && PROV[r.prov]) { map.go('province', r.prov, { animate: prevView === 'home' }); renderProvPanel(r.prov); }
        else if (r.region && R[r.region]) { map.go('region', r.region, { animate: prevView === 'home' }); renderRegionPanel(r.region); }
        else { map.go('country', null, { animate: prevView === 'home' }); if (r.map && prevView !== 'home') { } }
        tip.hidden = true;
      });
      document.title = r.prov && PROV[r.prov] ? `${PROV[r.prov].n} — ULISTEN` : r.region && R[r.region] ? `${R[r.region].name} — ULISTEN` : 'ULISTEN — Đường dây ấm tiếng quê';
    } else {
      scrollTo({ top: 0 });
      if (r.view === 'book') { renderBook(r.prov, r.params); document.title = 'Hẹn người lắng nghe — ULISTEN'; }
      if (r.view === 'wait') { renderWait(); document.title = 'Phòng chờ — ULISTEN'; }
      if (r.view === 'call') { renderCall(); document.title = 'Đang trò chuyện — ULISTEN'; }
      if (r.view === 'done') { renderDone(); document.title = 'Cảm ơn bạn — ULISTEN'; }
    }
    // header CTA reflects an existing booking
    const bk = store.get('booking'), cta = $('#ctaTop');
    if (bk && r.view !== 'wait' && r.view !== 'call') { cta.textContent = 'Lịch hẹn ' + SLOTS[bk.slot]; cta.href = '#/phong-cho'; } else { cta.textContent = 'Bắt đầu'; cta.href = '#/ban-do'; }
    $('#top').classList.toggle('solid', r.view !== 'home' || scrollY > 30);
    prevView = r.view;
  }
  addEventListener('hashchange', onRoute);
  addEventListener('keydown', e => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if (e.key === '/' && !typing && route().view === 'home') { e.preventDefault(); if (hero.classList.contains('explore')) nav('#/'); setTimeout(() => q.focus(), 60); }
    if (e.key === 'Escape' && !$('#modal').hidden) { closeModal(); return; }
    if (e.key === 'Escape' && route().view === 'home' && !typing) back();
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !typing && map.level === 'province' && route().view === 'home') {
      const sib = D.provs.filter(p => p.r === map.region), i = sib.findIndex(p => p.k === map.prov), n = sib[(i + (e.key === 'ArrowRight' ? 1 : -1) + sib.length) % sib.length];
      nav('#/ban-do/' + n.r + '/' + n.k);
    }
  });
  onRoute();
})();
