/* ============================================================
   Rowan & Field — front of house
   Vanilla JS, no framework, no build step.
   Everything degrades: with JS off you still get the shop.
   ============================================================ */
(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const money  = n => '£' + n.toFixed(n % 1 ? 2 : 0);

  /* ---------- image source helper ------------------------------------
     One place to change if you mirror the photography locally:
     swap PHOTO_BASE to './assets/img/' and set IDS to filenames.
     scripts/fetch-images.sh does exactly that.
  -------------------------------------------------------------------- */
  const LOCAL = document.documentElement.hasAttribute('data-local-photos');
  const PHOTO = (id, w, q = 78) => LOCAL
    ? `assets/img/${id}.jpg`
    : `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=${q}`;
  const SRCSET = id => LOCAL
    ? ''
    : `${PHOTO(id, 480, 70)} 480w, ${PHOTO(id, 800)} 800w, ${PHOTO(id, 1200)} 1200w`;

  /* ---------- stock ---------- */
  const STOCK = [
    { id:'nb990',  cat:'sneaker', brand:'New Balance',  name:'990v6',              price:210, img:'1542291026-7eec264c27ff', meta:'Grey pigskin & mesh · USA-made',      sizes:[7,8,9,10,11], out:[11],   flag:'', spare:'1595341888016-a392ef81b7de' },
    { id:'samba',  cat:'sneaker', brand:'adidas',       name:'Samba OG',           price:90,  img:'1600185365483-26d7a4cc7519', meta:'Black leather · gum sole',        sizes:[6,7,8,9,10,11], out:[6],  flag:'Back in', spare:'1607522370275-f14206abe5d3' },
    { id:'ch70',   cat:'sneaker', brand:'Converse',     name:'Chuck 70 Hi',        price:85,  img:'1560769629-975ec94e6a86', meta:'Egret canvas · vintage rubber',      sizes:[5,6,7,8,9,10,11], out:[], flag:'', spare:'1543163521-1bf539c55dd2' },
    { id:'am90',   cat:'sneaker', brand:'Nike',         name:'Air Max 90',         price:130, img:'1552346154-21d32810aba3', meta:'Infrared · visible air unit',        sizes:[7,8,9,10],   out:[7,10], flag:'Two pairs left', spare:'1512374382149-233c42b6a83b' },
    { id:'oldsk',  cat:'sneaker', brand:'Vans',         name:'Old Skool',          price:75,  img:'1595950653106-6c9ebd614d3a', meta:'Suede & canvas · waffle outsole', sizes:[6,7,8,9,10,11,12], out:[], flag:'', spare:'1518894781321-630e638d0742' },
    { id:'xt6',    cat:'sneaker', brand:'Salomon',      name:'XT-6',               price:175, img:'1549298916-b41d501d3772', meta:'Quicklace · Contagrip · trail',      sizes:[8,9,10,11],  out:[],     flag:'', spare:'1539185441755-769473a23570' },
    { id:'dm1460', cat:'boot',    brand:'Dr. Martens',  name:'1460 Eight-Eye',     price:159, img:'1449505278894-297fdb3edbc1', meta:'Smooth leather · Goodyear welt',  sizes:[6,7,8,9,10,11], out:[9],  flag:'', spare:'1520219306100-ec69c7596ec6' },
    { id:'blund',  cat:'boot',    brand:'Blundstone',   name:'500 Chelsea',        price:165, img:'1584735175315-9d5df23860e6', meta:'Stout brown · elastic gusset',    sizes:[7,8,9,10,11], out:[],    flag:'', spare:'1608256246200-53e635b5b65f' },
    { id:'ranger', cat:'boot',    brand:'Red Wing',     name:'Iron Ranger 8111',   price:329, img:'1520256862855-398228c41684', meta:'Amber Harness · Vibram 430',      sizes:[8,9,10,11],  out:[8],    flag:'Resoleable', spare:'1605812860427-4024433a70fd' },
    { id:'chats',  cat:'leather', brand:'Loake 1880',   name:'Chatsworth Oxford',  price:295, img:'1514989940723-e8e51635b782', meta:'Dark brown calf · leather sole',  sizes:[7,8,9,10,11], out:[],    flag:'', spare:'1533867617858-e7b97e060509' },
    { id:'bourt',  cat:'leather', brand:"Tricker's",    name:'Bourton Brogue',     price:520, img:'1531310197839-ccf54634509e', meta:'Acorn antique · commando sole',   sizes:[8,9,10],     out:[10],   flag:'Made in Northampton', spare:'1614252235316-8c857d38b5f4' },
    { id:'archie', cat:'leather', brand:'Grenson',      name:'Archie Derby',       price:275, img:'1582897085656-c636d006a246', meta:'Black grain · triple welt',       sizes:[7,8,9,10,11,12], out:[7], flag:'', spare:'1560343090-f0409e92791a' }
  ];

  const WALL = [
    { brand:'Nike',        name:'Air Force 1 Low',  price:115, img:'1491553895911-0055eca6402d', spare:'1595950653106-6c9ebd614d3a' },
    { brand:'ASICS',       name:'Gel-Kayano 14',    price:150, img:'1606107557195-0e29a4b5b4aa', spare:'1552346154-21d32810aba3' },
    { brand:'New Balance', name:'2002R',            price:140, img:'1608231387042-66d1773070a5', spare:'1600185365483-26d7a4cc7519' },
    { brand:'Reebok',      name:'Club C 85',        price:80,  img:'1525966222134-fcfa99b8ae77', spare:'1560769629-975ec94e6a86' },
    { brand:'Hoka',        name:'Clifton 9',        price:135, img:'1460353581641-37baddab0fa2', spare:'1549298916-b41d501d3772' },
    { brand:'Puma',        name:'Speedcat OG',      price:90,  img:'1556906781-9a412961c28c', spare:'1542291026-7eec264c27ff' }
  ];

  /* ---------- graceful image failure -------------------------------- */
  const SHOE_SVG = `<svg viewBox="0 0 64 32" fill="none" stroke="currentColor" stroke-width="1.4"
     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
     <path d="M3 24V11c0-1 .7-1.7 1.7-1.7h5.6c.9 0 1.7.5 2.1 1.3l2.4 4.6c.6 1.1 1.7 1.8 3 1.8h5.8c1.4 0 2.7.5 3.7 1.5l3 2.9c1 1 2.3 1.5 3.7 1.5H58c1.7 0 3 1.3 3 3v.6H6c-1.7 0-3-1.3-3-3Z"/>
     <path d="M13 15.5c1.6.9 3.4 1.3 5.3 1.3M8 9.3V6.6"/></svg>`;

  /* Two chances at a real photograph: the chosen frame, then a spare from the
     same set. Only if both are gone do we draw the plate. Never a broken icon. */
  function guardImage(img, label, spare) {
    let tries = 0;
    img.addEventListener('error', () => {
      tries++;
      if (tries === 1 && spare) {
        img.removeAttribute('srcset');
        img.src = PHOTO(spare, 1000);
        return;
      }
      if (img.dataset.failed) return;
      img.dataset.failed = '1';
      img.removeAttribute('srcset');
      img.classList.add('na');
      img.style.visibility = 'hidden';
      const host = img.parentElement;
      if (!host || host.querySelector('.na-note')) return;
      host.classList.add('imgwrap');
      const note = document.createElement('div');
      note.className = 'na-note';
      note.innerHTML = `${SHOE_SVG}<span>${label || 'photo unavailable'}</span>`;
      host.appendChild(note);
    });
  }

  $$('img').forEach(i => guardImage(i, i.alt.slice(0, 34), i.dataset.spare));

  /* ---------- build the floor --------------------------------------- */
  const grid = $('#grid');
  if (grid) {
    grid.innerHTML = STOCK.map(p => {
      const sizes = p.sizes.map(s =>
        `<b class="${p.out.includes(s) ? 'out' : ''}">UK ${s}</b>`).join('');
      const low = /left/i.test(p.flag);
      return `
      <article class="card reveal" data-cat="${p.cat}">
        <div class="card__media">
          ${p.flag ? `<span class="card__flag ${low ? 'card__flag--low' : ''}">${p.flag}</span>` : ''}
          <img loading="lazy" decoding="async" src="${PHOTO(p.img, 800)}" srcset="${SRCSET(p.img)}"
               sizes="(max-width:560px) 46vw, (max-width:900px) 44vw, 280px"
               alt="${p.brand} ${p.name}">
          <button class="card__add" data-add="${p.id}">Add to bag</button>
        </div>
        <div class="card__body">
          <span class="card__brand">${p.brand}</span>
          <h3 class="card__name">${p.name}<span class="card__price">${money(p.price)}</span></h3>
          <span class="card__meta">${p.meta}</span>
          <div class="card__sizes">${sizes}</div>
        </div>
      </article>`;
    }).join('');
    $$('#grid img').forEach((i, n) => guardImage(i, i.alt, STOCK[n].spare));
  }

  /* ---------- build the wall ---------------------------------------- */
  const track = $('[data-rail-track]');
  if (track) {
    track.innerHTML = WALL.map(p => `
      <article class="slide">
        <div class="slide__m">
          <img loading="lazy" decoding="async" src="${PHOTO(p.img, 800)}" srcset="${SRCSET(p.img)}"
               sizes="(max-width:700px) 78vw, 380px" alt="${p.brand} ${p.name}">
        </div>
        <div class="slide__b">
          <h3><small>${p.brand}</small>${p.name}</h3>
          <span>${money(p.price)}</span>
        </div>
      </article>`).join('');
    $$('[data-rail-track] img').forEach((i, n) => guardImage(i, i.alt, WALL[n].spare));
  }

  /* ---------- filters ----------------------------------------------- */
  $$('.chip').forEach(chip => chip.addEventListener('click', () => {
    $$('.chip').forEach(c => c.classList.toggle('is-on', c === chip));
    const f = chip.dataset.filter;
    $$('.card').forEach(c => c.classList.toggle('hide', f !== 'all' && c.dataset.cat !== f));
  }));

  /* ---------- reveal on scroll -------------------------------------- */
  const revealables = () => $$('.reveal:not(.in)');
  if (reduce || !('IntersectionObserver' in window)) {
    $$('.reveal').forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const sibs = [...(e.target.parentElement?.children || [])].filter(n => n.classList.contains('reveal'));
        const i = Math.min(sibs.indexOf(e.target), 5);
        e.target.style.setProperty('--d', `${Math.max(i, 0) * 70}ms`);
        e.target.classList.add('in');
        obs.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables().forEach(el => io.observe(el));
  }

  /* ---------- header ------------------------------------------------ */
  const hdr = $('#hdr');
  let lastY = 0;
  const onScrollHeader = () => {
    const y = scrollY;
    hdr.classList.toggle('solid', y > 40);
    hdr.classList.toggle('up', y > 420 && y > lastY && !document.body.classList.contains('lock'));
    lastY = y;
  };

  /* ---------- mobile menu ------------------------------------------- */
  const burger = $('[data-menu]'), nav = $('.nav');
  burger?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    hdr.classList.toggle('solid', open || scrollY > 40);
  });
  $$('.nav a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    burger?.setAttribute('aria-expanded', 'false');
  }));

  /* ---------- marquee (rAF, pauses off-screen) ----------------------- */
  const marquees = $$('[data-marquee]').map(el => {
    const half = el.scrollWidth / 2 || 1;
    return { el, half, x: 0, speed: (+el.dataset.speed || 40) * (+el.dataset.dir || 1), on: true };
  });
  if (marquees.length && !reduce) {
    const mio = new IntersectionObserver(es => es.forEach(e => {
      const m = marquees.find(m => m.el === e.target);
      if (m) m.on = e.isIntersecting;
    }));
    marquees.forEach(m => mio.observe(m.el));
  }

  /* ---------- parallax + rAF loop ------------------------------------ */
  const paras = reduce || coarse ? [] : $$('[data-parallax]');
  let ticking = false, last = performance.now();

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    if (!reduce) {
      for (const m of marquees) {
        if (!m.on) continue;
        m.x -= m.speed * dt;
        if (m.x <= -m.half) m.x += m.half;
        if (m.x > 0) m.x -= m.half;
        m.el.style.transform = `translate3d(${m.x.toFixed(2)}px,0,0)`;
      }
    }

    for (const el of paras) {
      const host = el.parentElement.getBoundingClientRect();
      if (host.bottom < -200 || host.top > innerHeight + 200) continue;
      const mid = host.top + host.height / 2 - innerHeight / 2;
      el.style.transform = `translate3d(0,${(-mid * (+el.dataset.parallax || .1)).toFixed(2)}px,0)`;
    }

    ticking = false;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onScrollHeader);
  }, { passive: true });
  onScrollHeader();

  addEventListener('resize', () => {
    marquees.forEach(m => { m.half = m.el.scrollWidth / 2 || m.half; });
  }, { passive: true });

  /* ---------- counters ---------------------------------------------- */
  $$('[data-count]').forEach(el => {
    const target = +el.dataset.count;
    if (reduce) { el.textContent = target.toLocaleString(); return; }
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), dur = 1500;
      const step = t => {
        const k = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))).toLocaleString();
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }), { threshold: .6 });
    io.observe(el);
  });

  /* ---------- rail: drag, arrows, progress --------------------------- */
  const rail = $('[data-rail]');
  if (rail) {
    const bar = $('[data-rail-bar]');
    const step = () => Math.min(rail.clientWidth * .8, 420);
    $('[data-rail-prev]')?.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
    $('[data-rail-next]')?.addEventListener('click', () => rail.scrollBy({ left:  step(), behavior: 'smooth' }));

    const sync = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      const k = max > 0 ? rail.scrollLeft / max : 0;
      if (bar) bar.style.transform = `translateX(${(k * ((1 - .22) / .22) * 100).toFixed(2)}%)`;
      $('[data-rail-prev]').disabled = rail.scrollLeft < 4;
      $('[data-rail-next]').disabled = rail.scrollLeft > max - 4;
    };
    rail.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
    addEventListener('resize', sync, { passive: true });
    sync();

    // pointer drag (desktop); touch keeps native momentum scrolling
    let down = false, x0 = 0, s0 = 0;
    rail.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') return;
      down = true; x0 = e.clientX; s0 = rail.scrollLeft; rail.classList.add('drag');
    });
    addEventListener('pointermove', e => {
      if (!down) return;
      rail.scrollLeft = s0 - (e.clientX - x0);
    }, { passive: true });
    addEventListener('pointerup', () => { down = false; rail.classList.remove('drag'); });
  }

  /* ---------- bag ---------------------------------------------------- */
  const bag = $('[data-bag]');
  const KEY = 'rf.bag.v1';
  let lines = [];
  try { lines = JSON.parse(localStorage.getItem(KEY)) || []; } catch { lines = []; }

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch {} };

  function renderBag() {
    const body = $('[data-bag-body]');
    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
    $('[data-bag-count]').textContent = lines.reduce((s, l) => s + l.qty, 0);
    $('[data-bag-total]').textContent = money(total);
    if (!lines.length) {
      body.innerHTML = `<p class="bag__empty">Nothing reserved yet. Add a pair from the floor and we'll hold it behind the counter.</p>`;
      return;
    }
    body.innerHTML = lines.map(l => `
      <div class="bagline">
        <img src="${PHOTO(l.img, 200, 65)}" alt="" loading="lazy">
        <div class="bagline__t">
          <b>${l.name}</b>
          <small>${l.brand} · ${money(l.price)}${l.qty > 1 ? ` × ${l.qty}` : ''}</small>
          <button class="bagline__x" data-drop="${l.id}">Remove</button>
        </div>
      </div>`).join('');
  }

  function openBag(open) {
    if (open) { bag.hidden = false; requestAnimationFrame(() => bag.classList.add('open')); document.body.classList.add('lock'); }
    else { bag.classList.remove('open'); document.body.classList.remove('lock'); setTimeout(() => { bag.hidden = true; }, 420); }
  }

  document.addEventListener('click', e => {
    const add = e.target.closest('[data-add]');
    if (add) {
      const p = STOCK.find(s => s.id === add.dataset.add);
      const line = lines.find(l => l.id === p.id);
      line ? line.qty++ : lines.push({ id:p.id, name:p.name, brand:p.brand, price:p.price, img:p.img, qty:1 });
      save(); renderBag(); openBag(true);
      return;
    }
    const drop = e.target.closest('[data-drop]');
    if (drop) { lines = lines.filter(l => l.id !== drop.dataset.drop); save(); renderBag(); return; }
    if (e.target.closest('[data-bag-open]')) return openBag(true);
    if (e.target.closest('[data-bag-close]')) return openBag(false);
    if (e.target.closest('[data-bag-reserve]')) {
      if (!lines.length) return;
      $('[data-bag-body]').innerHTML =
        `<p class="bag__empty">Held under your name for 48 hours. Ring 0115 960 0174 if you need longer — we're reasonable about it.</p>`;
      lines = []; save();
      $('[data-bag-count]').textContent = '0';
      $('[data-bag-total]').textContent = money(0);
    }
  });
  addEventListener('keydown', e => { if (e.key === 'Escape' && bag && !bag.hidden) openBag(false); });
  renderBag();

  /* ---------- fitting form ------------------------------------------- */
  $('[data-fit-form]')?.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.currentTarget, msg = $('[data-form-msg]');
    const name = f.elements.name.value.trim(), email = f.elements.email.value.trim();
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      msg.textContent = 'We need a name and an email we can actually reach you on.';
      return;
    }
    msg.textContent = `Thanks ${name.split(' ')[0]} — this is a demo front-end, so nothing was sent. In the shop, Alice would call you back the same day.`;
    f.reset();
  });

  /* ---------- misc ---------------------------------------------------- */
  const yr = $('[data-year]');
  if (yr) yr.textContent = new Date().getFullYear();
})();
