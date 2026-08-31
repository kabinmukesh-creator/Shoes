/* ============================================================
   Rowan & Field — motion layer
   Loads on top of app.js. If GSAP is missing or the visitor asks
   for reduced motion, this file bails out and app.js's own
   IntersectionObserver reveals carry the page unchanged.
   ============================================================ */
(() => {
  'use strict';

  const g  = window.gsap;
  const ST = window.ScrollTrigger;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!g || !ST || reduce) return;

  g.registerPlugin(ST);
  document.documentElement.classList.add('gsap-on');

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- device tier -------------------------------------------
     Branch the work by what the device can actually do, not by width.
     Safari exposes no deviceMemory, so cores carry the decision there. */
  const cores = navigator.hardwareConcurrency || 4;
  const mem   = navigator.deviceMemory || 4;
  const touch = matchMedia('(pointer: coarse)').matches;
  // 4 cores is an ordinary phone, not a weak one — only flag genuinely thin hardware
  const LOW   = (navigator.deviceMemory && navigator.deviceMemory <= 2) || cores <= 2;
  const TIER  = { drops: LOW ? 6 : 14, blur: !LOW, smooth: !LOW };
  document.documentElement.dataset.tier = LOW ? 'low' : 'high';

  /* ============================================================
     1. Lenis — one RAF loop shared with GSAP
     ============================================================ */
  let lenis = null;
  if (window.Lenis && TIER.smooth) {
    lenis = new window.Lenis({
      duration: 1.05,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: touch,        // Lenis 1.x name; `smoothTouch` was 0.x
      syncTouchLerp: 0.075,    // gentler than default so iOS momentum still reads
      touchInertiaMultiplier: 12,
      touchMultiplier: 1.4,
      autoRaf: false           // GSAP drives the loop, not Lenis
    });
    lenis.on('scroll', ST.update);
    g.ticker.add(t => lenis.raf(t * 1000));
    g.ticker.lagSmoothing(0);
  }

  /* ============================================================
     2. Split headings into animatable words
     ============================================================ */
  function splitWords(el) {
    if (el.dataset.split) return $$('.wd > i', el);
    el.dataset.split = '1';
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3 && n.textContent.trim()) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(tok => {
            if (!tok.trim()) return frag.appendChild(document.createTextNode(tok));
            const w = document.createElement('span'); w.className = 'wd';
            const i = document.createElement('i'); i.textContent = tok;
            w.appendChild(i); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('wd')) walk(n);
      });
    };
    walk(el);
    return $$('.wd > i', el);
  }

  /* ============================================================
     3. Hero — load sequence, then scrubbed drift
     ============================================================ */
  const heroH = $('.hero__h');
  if (heroH) {
    const lines = $$('.hero__h span');
    g.set(lines, { yPercent: 108 });
    g.set(['.hero .eyebrow', '.hero__p', '.hero__cta', '.hero__foot'], { opacity: 0, y: 22 });

    g.timeline({ defaults: { ease: 'expo.out' }, delay: 0.15 })
      .to('.hero .eyebrow', { opacity: 1, y: 0, duration: 0.9 })
      .to(lines, { yPercent: 0, duration: 1.25, stagger: 0.085 }, '-=0.65')
      .to(['.hero__p', '.hero__cta'], { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, '-=0.8')
      .to('.hero__foot', { opacity: 1, y: 0, duration: 0.9 }, '-=0.7');

    // scrub: 1 rather than true — tuned for a touch drag's scroll range
    g.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } })
      .to('.hero__in', { y: -90, opacity: 0.25, ease: 'none' }, 0)
      .to('.hero__media img', { scale: 1.14, ease: 'none' }, 0);
  }

  /* ============================================================
     4. Headings — word rise
     ============================================================ */
  $$('.h2').forEach(h => {
    const words = splitWords(h);
    g.set(words, { yPercent: 105 });
    g.to(words, {
      yPercent: 0, duration: 0.95, ease: 'expo.out', stagger: 0.035,
      scrollTrigger: { trigger: h, start: 'top 88%' }
    });
  });

  /* ============================================================
     5. Image presentation — a wipe, not a fade
     The frame opens from the bottom while the photograph inside
     settles back from an over-scale, so the picture appears to be
     uncovered rather than faded in.
     ============================================================ */
  function present(frame, img, trigger) {
    g.set(frame, { clipPath: 'inset(100% 0% 0% 0%)' });
    g.set(img,   { scale: 1.22, transformOrigin: '50% 60%' });
    g.timeline({ scrollTrigger: { trigger: trigger || frame, start: 'top 90%' } })
      .to(frame, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.15, ease: 'expo.out' })
      .to(img,   { scale: 1, duration: 1.5, ease: 'expo.out' }, 0);
  }
  $$('.fig').forEach(f => { const i = $('img', f); if (i) present(f, i); });
  $$('.slide__m').forEach(m => { const i = $('img', m); if (i) present(m, i); });

  /* ---------- cards: batched so twelve triggers don't cost twelve passes */
  const cards = $$('.card');
  if (cards.length) {
    cards.forEach(c => {
      g.set($('.card__media', c), { clipPath: 'inset(100% 0% 0% 0%)' });
      g.set($('.card__media img', c), { scale: 1.25 });
      g.set($('.card__body', c), { opacity: 0, y: 16 });
    });
    ST.batch(cards, {
      start: 'top 92%',
      onEnter: batch => batch.forEach((c, n) => {
        g.timeline({ delay: n * 0.06 })
          .to($('.card__media', c), { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.out' })
          .to($('.card__media img', c), { scale: 1, duration: 1.3, ease: 'expo.out' }, 0)
          .to($('.card__body', c), { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.15);
      })
    });
  }

  /* ---------- everything else app.js used to reveal ---------- */
  $$('.reveal').forEach(el => {
    if (el.closest('.hero') || el.classList.contains('card') || el.classList.contains('fig')) {
      el.classList.add('in'); return;
    }
    g.fromTo(el, { opacity: 0, y: 26 }, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
      onStart: () => el.classList.add('in')
    });
  });

  /* ---------- workshop band ---------- */
  const work = $('.work');
  if (work) {
    g.fromTo('.work__bg img', { scale: 1.25, yPercent: -6 }, {
      scale: 1, yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: work, start: 'top bottom', end: 'bottom top', scrub: 1.2 }
    });
    g.to('.price', {
      opacity: 1, y: 0, stagger: 0.05, duration: 0.6, ease: 'power2.out',
      scrollTrigger: { trigger: '.prices', start: 'top 88%' }
    });
    g.set('.price', { opacity: 0, y: 18 });
  }

  /* ============================================================
     6. Marquees — scroll velocity, and a surge on tap
     Base drift always runs. Scrolling bends it: the text leans
     into the direction you are scrolling and speeds up with you.
     Tapping a band shoves it — direction flips and it races,
     then eases back to its resting drift.
     ============================================================ */
  const bands = $$('[data-marquee]').map(el => {
    const half = el.scrollWidth / 2 || 1;
    return {
      el, half,
      x: 0,
      base: (+el.dataset.speed || 40) * (+el.dataset.dir || 1),
      boost: 1,          // multiplier, tweened on tap
      lean: 0,           // scroll-velocity contribution
      dir: 1,
      on: true
    };
  });

  if (bands.length) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      const b = bands.find(b => b.el === e.target);
      if (b) b.on = e.isIntersecting;
    }));
    bands.forEach(b => io.observe(b.el));

    // scroll velocity → lean
    ST.create({
      start: 0, end: 'max',
      onUpdate: self => {
        // onUpdate only fires *while* scrolling, so this sets a spike that the
        // ticker below decays back to zero — otherwise the band would keep
        // racing at whatever speed you last scrolled at, forever.
        const v = g.utils.clamp(-2.4, 2.4, self.getVelocity() / 900);
        bands.forEach(b => {
          b.lean = v * 60;
          if (Math.abs(v) > 0.05) b.dir = v > 0 ? 1 : -1;
        });
      }
    });

    // tap to shove
    bands.forEach(b => {
      const band = b.el.parentElement;
      band.style.cursor = 'pointer';
      band.setAttribute('title', 'Tap to send the line the other way');
      band.addEventListener('pointerdown', () => {
        b.dir *= -1;
        g.killTweensOf(b);
        g.fromTo(b, { boost: 9 }, { boost: 1, duration: 2.1, ease: 'power2.out' });
      }, { passive: true });
    });

    g.ticker.add((time, dt) => {
      const s = dt / 1000;
      for (const b of bands) {
        b.lean *= Math.pow(0.015, s);   // settles back to its resting drift
        if (!b.on) continue;
        b.x -= (b.base * b.boost * b.dir + b.lean) * s;
        b.x = g.utils.wrap(-b.half, 0, b.x);
        b.el.style.transform = `translate3d(${b.x.toFixed(2)}px,0,0)`;
      }
    });
    addEventListener('resize', () => bands.forEach(b => { b.half = b.el.scrollWidth / 2 || b.half; }), { passive: true });
  }

  /* ---------- the wall rail drifts as you pass it ---------- */
  const railTrack = $('[data-rail-track]');
  if (railTrack && !touch) {
    g.fromTo(railTrack, { x: 40 }, {
      x: -40, ease: 'none',
      scrollTrigger: { trigger: '.wall', start: 'top bottom', end: 'bottom top', scrub: 1.4 }
    });
  }

  /* ============================================================
     7. Water-repellent tap
     The shop waterproofs boots, so the page behaves like a
     waxed upper: a tap lands, flattens, beads back up, and the
     droplets scatter and roll off rather than soaking in.
     ============================================================ */
  const cv = document.createElement('canvas');
  cv.className = 'wet';
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  let dpr = 1, W = 0, H = 0;

  function size() {
    dpr = Math.min(devicePixelRatio || 1, LOW ? 1.5 : 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  addEventListener('resize', size, { passive: true });

  const beads = [];
  const rings = [];
  let raf = 0;

  function splash(x, y) {
    const n = TIER.drops;
    rings.push({ x, y, r: 4, a: 0.5 });
    // the strike itself: flattens on impact, then beads back up
    beads.push({ x, y, vx: 0, vy: 0, r: 18, squash: 2.8, life: 1, decay: 0.011, roll: 0.06 });
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      const sp = 1.6 + Math.random() * 5.2;
      beads.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 1.4,
        r: 2.6 + Math.random() * 6.6,
        squash: 1.5 + Math.random(),
        life: 1,
        decay: 0.008 + Math.random() * 0.012,
        roll: 0.05 + Math.random() * 0.08
      });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function drawBead(b) {
    const r = b.r * (0.55 + b.life * 0.45);
    if (r < 0.4) return;
    // squash eases to a sphere — water pulling itself round on a surface it can't wet
    const sx = r * (1 + (b.squash - 1) * 0.55), sy = r / (1 + (b.squash - 1) * 0.35);
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.globalAlpha = Math.min(1, b.life * 1.25);

    // on a pale ground a droplet is read by its shadow and rim, not its fill
    ctx.beginPath();
    ctx.ellipse(0.8, sy * 0.46, sx * 0.96, sy * 0.56, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(21,24,27,.22)';
    ctx.fill();

    const gr = ctx.createRadialGradient(-sx * 0.32, -sy * 0.42, r * 0.1, 0, 0, r * 1.15);
    gr.addColorStop(0,   'rgba(255,255,255,.88)');
    gr.addColorStop(0.45,'rgba(188,212,226,.52)');
    gr.addColorStop(1,   'rgba(86,118,138,.46)');
    ctx.beginPath();
    ctx.ellipse(0, 0, sx, sy, 0, 0, Math.PI * 2);
    ctx.fillStyle = gr;
    ctx.fill();
    ctx.lineWidth = Math.max(0.6, r * 0.1);
    ctx.strokeStyle = 'rgba(43,66,80,.34)';   // meniscus edge
    ctx.stroke();
    ctx.lineWidth = Math.max(0.5, r * 0.06);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; // lit top edge
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(-sx * 0.34, -sy * 0.44, sx * 0.2, sy * 0.14, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.fill();
    ctx.restore();
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);

    for (let i = rings.length - 1; i >= 0; i--) {
      const s = rings[i];
      s.r += 5.5; s.a *= 0.9;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(96,132,152,${s.a})`;
      ctx.lineWidth = Math.max(0.4, 3 - s.r * 0.02);
      ctx.stroke();
      if (s.a < 0.02) rings.splice(i, 1);
    }

    for (let i = beads.length - 1; i >= 0; i--) {
      const b = beads[i];
      b.vy += 0.32;                 // gravity
      b.vx *= 0.975; b.vy *= 0.985; // it rolls, it doesn't stick
      b.x += b.vx; b.y += b.vy;
      b.squash += (1 - b.squash) * b.roll;
      b.life -= b.decay;
      if (b.life <= 0 || b.y - b.r > H) { beads.splice(i, 1); continue; }
      drawBead(b);
    }

    raf = (beads.length || rings.length) ? requestAnimationFrame(tick) : 0;
  }

  addEventListener('pointerdown', e => {
    if (beads.length > 140) return;
    splash(e.clientX, e.clientY);
  }, { passive: true });

  /* ---------- keep triggers honest after images and fonts land ---------- */
  addEventListener('load', () => ST.refresh());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ST.refresh());
})();
