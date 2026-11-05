/* ==========================================================================
   ULISTEN — bản đồ giọng quê (34 tỉnh, thành)
   3 cấp: toàn quốc → miền → tỉnh. Nổi 3D khi rê chuột, zoom mượt, kéo/cuộn để
   phóng to, bản đồ thu nhỏ, nhãn Hoàng Sa – Trường Sa luôn hiển thị.
   ========================================================================== */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (t, a = {}, p) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  class VNMap {
    constructor(box, opt) {
      this.box = box; this.opt = opt; this.D = window.VN_MAP;
      this.byK = {}; this.D.provs.forEach(p => this.byK[p.k] = p);
      this.level = 'country'; this.region = null; this.prov = null; this.hoverR = null; this.hoverP = null;
      this.lifts = new Map(); this.active = new Set(opt.active || []);
      this.build(); this.bind();
      this.vb = this.fit(this.full()); this.applyVB();
      new ResizeObserver(() => { if (!this.anim) { this.vb = this.fit(this.targetBox || this.full()); this.applyVB(); } }).observe(this.box);
    }

    /* ---------- build SVG ---------- */
    build() {
      const svg = this.svg = el('svg', { class: 'vn', role: 'img', 'aria-label': 'Bản đồ Việt Nam 34 tỉnh, thành. Chọn miền rồi chọn tỉnh.', preserveAspectRatio: 'xMidYMid meet' });
      this.box.querySelector('.map-svg').appendChild(svg);
      const defs = el('defs', {}, svg);
      defs.innerHTML = `
        <linearGradient id="g-dim" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="260" y2="873"><stop offset="0" stop-color="#2d3978"/><stop offset="1" stop-color="#222b62"/></linearGradient>
        <linearGradient id="g-lit" gradientUnits="userSpaceOnUse" x1="100" y1="120" x2="420" y2="760"><stop offset="0" stop-color="#ffe3ab"/><stop offset=".5" stop-color="#f8b866"/><stop offset="1" stop-color="#ea8e45"/></linearGradient>
        <linearGradient id="g-hot" gradientUnits="userSpaceOnUse" x1="100" y1="120" x2="420" y2="760"><stop offset="0" stop-color="#fff5dc"/><stop offset="1" stop-color="#ffc979"/></linearGradient>
        <filter id="f-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="12"/></filter>
        <filter id="f-shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
        <radialGradient id="g-dot"><stop offset="0" stop-color="#fff6de"/><stop offset=".35" stop-color="#ffc56e" stop-opacity=".9"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>`;
      this.D.provs.forEach(p => el('path', { id: 'p-' + p.k, d: p.d }, defs));
      for (const r in this.D.regions) el('path', { id: 'rg-' + r, d: this.D.regions[r] }, defs);
      el('path', { id: 'isl-hoangsa', d: this.D.isl.hoangsa }, defs);
      el('path', { id: 'isl-truongsa', d: this.D.isl.truongsa }, defs);

      this.bg = el('rect', { class: 'sea', x: -2000, y: -2000, width: 5000, height: 5000 }, svg);
      this.gGlow = el('g', { class: 'l-glow' }, svg);
      for (const r in this.D.regions) el('use', { href: '#rg-' + r, class: 'rglow', 'data-r': r, filter: 'url(#f-glow)' }, this.gGlow);
      this.gBase = el('g', { class: 'l-base' }, svg);
      this.D.provs.forEach(p => el('use', { href: '#p-' + p.k, class: 'pv', 'data-k': p.k, 'data-r': p.r }, this.gBase));
      this.gIsl = el('g', { class: 'l-isl' }, svg);
      el('use', { href: '#isl-hoangsa', class: 'isl', 'data-r': 'trung' }, this.gIsl);
      el('use', { href: '#isl-truongsa', class: 'isl', 'data-r': 'trung' }, this.gIsl);
      this.gLift = el('g', { class: 'l-lift' }, svg);
      this.gMk = el('g', { class: 'l-mk' }, svg);
      this.gLab = el('g', { class: 'l-lab' }, svg);
      this.drawMarkers();

      // island bounding boxes for HTML labels
      this.islBox = {};
      ['hoangsa', 'truongsa'].forEach(k => this.islBox[k] = svg.querySelector('#isl-' + k).getBBox());
      this.regionBox = {};
      for (const r in this.D.regions) this.regionBox[r] = svg.querySelector('#rg-' + r).getBBox();

      // minimap
      const mm = this.box.querySelector('.minimap svg');
      if (mm) {
        mm.setAttribute('viewBox', '0 0 812 873');
        this.D.provs.forEach(p => el('use', { href: '#p-' + p.k, class: 'pv', 'data-r': p.r }, mm));
        el('use', { href: '#isl-hoangsa', class: 'isl' }, mm); el('use', { href: '#isl-truongsa', class: 'isl' }, mm);
        this.mmRect = el('rect', { class: 'mm-view', rx: 10 }, mm);
        this.mm = mm;
      }
    }
    drawMarkers() {
      this.gMk.innerHTML = '';
      this.active.forEach(k => {
        const p = this.byK[k]; if (!p) return;
        const g = el('g', { class: 'mk', 'data-k': k, transform: `translate(${p.c[0]} ${p.c[1]})` }, this.gMk);
        const inner = el('g', { class: 'mk-in' }, g);
        el('circle', { r: 11, fill: 'url(#g-dot)' }, inner);
        el('circle', { r: 6, class: 'mk-ring' }, inner);
        el('circle', { r: 2.6, class: 'mk-core' }, inner);
      });
    }

    /* ---------- geometry ---------- */
    full() { return { x: -10, y: -6, w: 832, h: 885 }; }
    boxFor(r) {
      const b = this.regionBox[r]; let x = b.x, y = b.y, x2 = b.x + b.width, y2 = b.y + b.height;
      if (r === 'trung') { const h = this.islBox.hoangsa; x2 = Math.max(x2, h.x + h.width + 40); }
      const pad = 26; return { x: x - pad, y: y - pad, w: (x2 - x) + pad * 2, h: (y2 - y) + pad * 2 };
    }
    fit(b) {
      const W = this.box.clientWidth || 1, H = this.box.clientHeight || 1, a = W / H;
      let { x, y, w, h } = b;
      if (w / h > a) { const nh = w / a; y -= (nh - h) / 2; h = nh; } else { const nw = h * a; x -= (nw - w) / 2; w = nw; }
      return { x, y, w, h };
    }
    applyVB() {
      const v = this.vb; this.svg.setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`);
      this.scale = (this.box.clientWidth || 1) / v.w;
      this.svg.style.setProperty('--px', (1 / this.scale).toFixed(4));
      this.updateOverlay();
    }
    animateTo(b, dur = 650) {
      const to = this.fit(b); this.targetBox = b;
      if (reduce) { this.vb = to; this.applyVB(); this.afterZoom(); return; }
      const from = { ...this.vb }, t0 = performance.now();
      cancelAnimationFrame(this.anim); this.svg.classList.add('zooming');
      const step = now => {
        const t = Math.min(1, (now - t0) / dur), e = ease(t);
        this.vb = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, w: from.w + (to.w - from.w) * e, h: from.h + (to.h - from.h) * e };
        this.applyVB();
        if (t < 1) this.anim = requestAnimationFrame(step); else { this.anim = null; this.svg.classList.remove('zooming'); this.afterZoom(); }
      };
      this.anim = requestAnimationFrame(step);
    }
    afterZoom() { this.drawLabels(); }
    toUser(cx, cy) { const r = this.box.getBoundingClientRect(); return { x: this.vb.x + (cx - r.left) / r.width * this.vb.w, y: this.vb.y + (cy - r.top) / r.height * this.vb.h }; }
    toScreen(x, y) { return { x: (x - this.vb.x) * this.scale, y: (y - this.vb.y) * this.scale }; }

    /* ---------- overlay: island labels + minimap ---------- */
    updateOverlay() {
      const W = this.box.clientWidth, H = this.box.clientHeight;
      ['hoangsa', 'truongsa'].forEach(k => {
        const tag = this.box.querySelector(`.isl-tag[data-k="${k}"]`); if (!tag) return;
        const b = this.islBox[k], cx = b.x + b.width / 2, cy = b.y + b.height / 2;
        const s = this.toScreen(cx, k === 'truongsa' ? cy : b.y + b.height);
        const m = 34, inside = s.x > m && s.x < W - m && s.y > m && s.y < H - m;
        let x = s.x, y = s.y + (k === 'truongsa' ? 0 : 10);
        tag.classList.toggle('edge', !inside);
        if (!inside) {
          const ang = Math.atan2(s.y - H / 2, s.x - W / 2);
          x = Math.min(W - 80, Math.max(80, s.x)); y = Math.min(H - 44, Math.max(56, s.y));
          tag.style.setProperty('--ang', (ang * 180 / Math.PI) + 'deg');
        }
        tag.style.transform = `translate(${x}px, ${y}px) translate(-50%, 0)`;
      });
      if (this.mmRect) {
        const v = this.vb; this.mmRect.setAttribute('x', v.x); this.mmRect.setAttribute('y', v.y);
        this.mmRect.setAttribute('width', v.w); this.mmRect.setAttribute('height', v.h);
      }
    }

    /* ---------- 3D lift ---------- */
    liftShow(key, kind, depth) {
      if (this.lifts.has(key)) { const L = this.lifts.get(key); clearTimeout(L.t); L.g.classList.add('on'); return; }
      const href = kind === 'region' ? '#rg-' + key : '#p-' + key;
      const g = el('g', { class: 'lift ' + kind, style: `--d:${depth}` }, this.gLift);
      el('use', { href, class: 'sh', filter: 'url(#f-shadow)' }, g);
      el('use', { href, class: 'gl', filter: 'url(#f-glow)' }, g);
      for (let i = 0; i < depth; i++) {
        const t = i / depth, c = `rgb(${Math.round(122 + 70 * t)},${Math.round(58 + 42 * t)},${Math.round(20 + 22 * t)})`;
        el('use', { href, class: 'sd', fill: c, stroke: c, style: `--i:${i}` }, g);
      }
      const top = el('g', { class: 'top' }, g);
      if (kind === 'region') this.D.provs.filter(p => p.r === key).forEach(p => el('use', { href: '#p-' + p.k, class: 'pv-top' }, top));
      else el('use', { href, class: 'pv-hot' }, top);
      this.lifts.set(key, { g });
      requestAnimationFrame(() => requestAnimationFrame(() => g.classList.add('on')));
      // markers & labels ride up with the lifted shape
      this.gMk.querySelectorAll('.mk').forEach(m => { const p = this.byK[m.dataset.k]; if ((kind === 'region' && p.r === key) || m.dataset.k === key) m.style.setProperty('--up', -depth); });
      this.gLab.querySelectorAll('text').forEach(t => { if (t.dataset.k === key) t.style.setProperty('--up', -depth); });
    }
    liftHide(key) {
      const L = this.lifts.get(key); if (!L) return;
      L.g.classList.remove('on'); clearTimeout(L.t);
      L.t = setTimeout(() => { L.g.remove(); this.lifts.delete(key); }, reduce ? 0 : 380);
      this.gMk.querySelectorAll('.mk').forEach(m => { const p = this.byK[m.dataset.k]; if (m.dataset.k === key || (p.r === key && !this.lifts.has(m.dataset.k))) m.style.setProperty('--up', 0); });
      this.gLab.querySelectorAll('text').forEach(t => { if (t.dataset.k === key) t.style.setProperty('--up', 0); });
    }
    clearLifts(except = []) { [...this.lifts.keys()].forEach(k => { if (!except.includes(k)) this.liftHide(k); }); }

    /* ---------- labels ---------- */
    drawLabels() {
      this.gLab.innerHTML = '';
      if (this.level === 'country') return;
      const s = 1 / this.scale;
      this.D.provs.filter(p => p.r === this.region).forEach(p => {
        const small = p.a < 1000, fs = (small ? 11 : 12.5) * s;
        const isSel = p.k === this.prov;
        const t = el('text', { x: p.c[0], y: p.c[1] + (this.active.has(p.k) ? 17 * s : 4 * s), 'data-k': p.k, class: 'lab' + (isSel ? ' sel' : ''), 'font-size': fs, 'text-anchor': 'middle' }, this.gLab);
        t.textContent = p.n.replace('TP. ', '');
        if (isSel) t.style.setProperty('--up', -this.depthSel());
      });
    }
    depthSel() { return this.level === 'country' ? 12 : 10; }

    /* ---------- state ---------- */
    setLit(r) { if (r) this.svg.setAttribute('data-lit', r); else this.svg.removeAttribute('data-lit'); if (this.mm) { if (r) this.mm.setAttribute('data-lit', r); else this.mm.removeAttribute('data-lit'); } }
    go(level, key, { animate = true } = {}) {
      const prev = { level: this.level, region: this.region, prov: this.prov };
      if (level === 'country') { this.level = 'country'; this.region = null; this.prov = null; this.clearLifts(); this.setLit(null); this.svg.dataset.level = 'country'; animate ? this.animateTo(this.full()) : (this.vb = this.fit(this.full()), this.applyVB(), this.afterZoom()); }
      if (level === 'region') {
        this.level = 'region'; this.region = key; this.prov = null; this.clearLifts(); this.setLit(key); this.svg.dataset.level = 'region';
        if (prev.region !== key || prev.level === 'country' || !animate) animate ? this.animateTo(this.boxFor(key)) : (this.vb = this.fit(this.boxFor(key)), this.applyVB(), this.afterZoom()); else this.drawLabels();
      }
      if (level === 'province') {
        const p = this.byK[key]; this.prov = key; this.level = 'province'; this.svg.dataset.level = 'province';
        const rChanged = this.region !== p.r; this.region = p.r; this.setLit(p.r); this.clearLifts([key]);
        this.liftShow(key, 'prov', this.depthSel());
        if (rChanged || prev.level === 'country' || !animate) animate ? this.animateTo(this.boxFor(p.r)) : (this.vb = this.fit(this.boxFor(p.r)), this.applyVB(), this.afterZoom());
        else this.drawLabels();
      }
      this.box.dataset.level = this.level;
      this.opt.onState && this.opt.onState({ level: this.level, region: this.region, prov: this.prov });
    }
    zoomBy(f, cx, cy) {
      const W = this.box.clientWidth, H = this.box.clientHeight;
      const u = cx == null ? { x: this.vb.x + this.vb.w / 2, y: this.vb.y + this.vb.h / 2 } : this.toUser(cx, cy);
      let w = Math.min(1400, Math.max(110, this.vb.w * f)); const k = w / this.vb.w; const h = this.vb.h * k;
      this.vb = { x: u.x - (u.x - this.vb.x) * k, y: u.y - (u.y - this.vb.y) * k, w, h }; this.targetBox = { ...this.vb };
      this.applyVB(); clearTimeout(this.lt); this.lt = setTimeout(() => this.drawLabels(), 120);
    }

    /* ---------- events ---------- */
    bind() {
      const svg = this.svg; let down = null, moved = false, pts = new Map(), pinch = null;
      svg.addEventListener('pointermove', e => {
        if (down && pts.size === 1) {
          const dx = e.clientX - down.x, dy = e.clientY - down.y;
          if (!moved && Math.hypot(dx, dy) > 6) { moved = true; svg.classList.add('panning'); }
          if (moved) { this.vb = { ...down.vb, x: down.vb.x - dx / this.scale, y: down.vb.y - dy / this.scale }; this.targetBox = { ...this.vb }; this.applyVB(); }
          return;
        }
        if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pinch && pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); this.zoomBy(pinch.d / d, (a.x + b.x) / 2, (a.y + b.y) / 2); pinch.d = d; return; }
        if (e.pointerType !== 'mouse') return;
        const t = e.target.closest('.pv'); this.hover(t ? t.dataset.k : null);
      });
      svg.addEventListener('pointerleave', () => this.hover(null));
      svg.addEventListener('pointerdown', e => {
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) }; down = null; moved = true; return; }
        down = { x: e.clientX, y: e.clientY, vb: { ...this.vb } }; moved = false;
      });
      const up = e => {
        pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
        if (!down) { if (!pts.size) moved = false; return; }
        const wasMoved = moved; down = null; svg.classList.remove('panning');
        if (wasMoved) return;
        const t = e.target.closest('.pv');
        if (!t) { this.opt.onBack && this.opt.onBack(); return; }
        this.click(t.dataset.k);
      };
      svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', e => { pts.delete(e.pointerId); down = null; pinch = null; });
      this.box.addEventListener('wheel', e => { e.preventDefault(); this.zoomBy(Math.exp(e.deltaY * 0.0016), e.clientX, e.clientY); }, { passive: false });
      this.mm && this.mm.addEventListener('click', () => this.opt.onCountry && this.opt.onCountry());
    }
    hover(k) {
      const p = k ? this.byK[k] : null;
      if (this.level === 'country') {
        const r = p ? p.r : null;
        if (r === this.hoverR) return;
        if (this.hoverR) this.liftHide(this.hoverR);
        this.hoverR = r; this.setLit(r); if (r) this.liftShow(r, 'region', 12);
        this.opt.onHover && this.opt.onHover({ region: r });
      } else {
        if (k === this.hoverP) return;
        if (this.hoverP && this.hoverP !== this.prov) this.liftHide(this.hoverP);
        this.hoverP = k;
        if (k && k !== this.prov && p.r === this.region) this.liftShow(k, 'prov', 5);
        this.opt.onHover && this.opt.onHover({ prov: k && p.r === this.region ? k : null, region: p ? p.r : null });
      }
    }
    click(k) {
      const p = this.byK[k];
      if (this.level === 'country') { this.hoverR = null; this.opt.onRegion(p.r); }
      else if (p.r !== this.region) { this.hoverP = null; this.opt.onRegion(p.r); }
      else { this.hoverP = null; this.opt.onProv(k); }
    }
  }
  window.VNMap = VNMap;
})();
