/* efin.finance · AI เฝ้าพอร์ต — สคริปต์ร่วมทุกหน้า (vanilla JS, ไม่มี dependency) */
(function () {
  'use strict';

  /* ---------- Navbar: เงาเมื่อเลื่อน + เมนูมือถือ ---------- */
  var nav = document.querySelector('.nav');
  var burger = document.querySelector('.hamburger');
  var mobileNav = document.getElementById('mobile-nav');

  function onScrollNav() {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 8);
  }

  function setMenu(open) {
    if (!burger || !mobileNav) return;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'ปิดเมนู' : 'เปิดเมนู');
    mobileNav.classList.toggle('open', open);
  }

  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    mobileNav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  /* ---------- ลิงก์ที่ยังไม่มีปลายทาง ([data-link="pending"]) ----------
     ตอนนี้กดแล้วไม่ไปไหน เมื่อมีหน้าจริงให้ใส่ href และลบ data-link="pending" ออก */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-link="pending"]');
    if (a) e.preventDefault();
  });

  /* ---------- วัดผล: dataLayer event สำหรับ GTM / GA4 (เอกสารข้อ 4.1) ----------
     - view_item ตอนเปิดหน้า · select_item ตอนกดปุ่ม "จองที่นั่ง" ทั้ง 5 ปุ่ม ([data-book] = button_location)
     - ห้ามส่งชื่อ อีเมล เบอร์โทร หรือเลขผู้เสียภาษีของผู้ซื้อเข้า dataLayer
     - ครบ 10 ที่นั่งแล้ว: เปลี่ยน item_variant เป็น 'ราคาปกติ' และ price เป็น 9000
     - แท็กปุ่ม [data-gtm] (cta_click + button_name) ตั้งใน GTM เอง ไม่ได้ส่งจากสคริปต์นี้ */
  var courseItem = {
    item_id: 'ai-portfolio-watch-dec2026',
    item_name: 'คอร์ส AI เฝ้าพอร์ต: สร้างผู้ช่วยลงทุนส่วนตัวใน 2 วัน',
    item_category: 'efincourse',
    item_variant: 'Early Bird',
    price: 7900,
    quantity: 1
  };
  var dataLayer = (window.dataLayer = window.dataLayer || []);

  dataLayer.push({ ecommerce: null });
  dataLayer.push({
    event: 'view_item',
    ecommerce: { currency: 'THB', value: courseItem.price, items: [courseItem] }
  });

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-book]');
    if (!a) return;
    dataLayer.push({ ecommerce: null });
    dataLayer.push({
      event: 'select_item',
      button_location: a.getAttribute('data-book'),
      ecommerce: { items: [courseItem] }
    });
  });

  /* ---------- Reveal on scroll ([data-anim]) ---------- */
  var animEls = document.querySelectorAll('[data-anim]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('anim-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    animEls.forEach(function (el) { io.observe(el); });
  } else {
    animEls.forEach(function (el) { el.classList.add('anim-visible'); });
  }

  /* ---------- ปุ่มกลับขึ้นด้านบน ---------- */
  var backTop = document.querySelector('.back-top');
  function onScrollBackTop() {
    if (!backTop) return;
    var show = window.scrollY > 900;
    backTop.classList.toggle('visible', show);
    backTop.tabIndex = show ? 0 : -1;
  }
  if (backTop) {
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  window.addEventListener(
    'scroll',
    function () {
      onScrollNav();
      onScrollBackTop();
    },
    { passive: true }
  );
  onScrollNav();
  onScrollBackTop();

  /* ---------- Hero particles ----------
     port ของ Particles (hero-06) เป็น vanilla JS: จุดเล็กลอยช้าๆ จางที่ขอบ ขยับตามเมาส์เล็กน้อย
     สีจาก token --color-primary · หยุดเมื่อ hero พ้นจอ · reduced motion = วาดนิ่งครั้งเดียว */
  (function heroParticles() {
    var canvas = document.querySelector('.hero-particles');
    if (!canvas || !canvas.getContext) return;
    var host = canvas.parentElement;
    var ctx = canvas.getContext('2d');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var color = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#007dfe';
    var rgb = (function (hex) {
      hex = hex.replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
      var n = parseInt(hex, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(', ');
    })(color);
    var opt = { staticity: 50, ease: 80, size: 0.4, alphaScale: 0.5 }; // alphaScale: ความเข้มของจุด (1 = เท่าต้นฉบับ)
    var dpr = window.devicePixelRatio || 1;
    var w = 0, h = 0, circles = [], mouse = { x: 0, y: 0 }, running = false, raf = 0;

    function quantity() { return window.innerWidth < 768 ? 50 : 100; }

    function makeCircle() {
      return {
        x: Math.floor(Math.random() * w),
        y: Math.floor(Math.random() * h),
        tx: 0, ty: 0,
        size: Math.floor(Math.random() * 2) + opt.size,
        alpha: 0,
        target: parseFloat((Math.random() * 0.6 + 0.1).toFixed(1)) * opt.alphaScale,
        dx: (Math.random() - 0.5) * 0.1,
        dy: (Math.random() - 0.5) * 0.1,
        magnetism: 0.1 + Math.random() * 4,
      };
    }

    function draw(c) {
      ctx.beginPath();
      ctx.arc(c.x + c.tx, c.y + c.ty, c.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + rgb + ', ' + c.alpha + ')';
      ctx.fill();
    }

    function setup() {
      w = host.offsetWidth;
      h = host.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      circles = [];
      for (var i = 0; i < quantity(); i++) circles.push(makeCircle());
      if (reduce) {
        ctx.clearRect(0, 0, w, h);
        circles.forEach(function (c) { c.alpha = c.target; draw(c); });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = circles.length - 1; i >= 0; i--) {
        var c = circles[i];
        var edge = Math.min(c.x + c.tx - c.size, w - c.x - c.tx - c.size, c.y + c.ty - c.size, h - c.y - c.ty - c.size);
        var fade = Math.max(0, edge / 20);
        if (fade > 1) c.alpha = Math.min(c.alpha + 0.02, c.target);
        else c.alpha = c.target * fade;
        c.x += c.dx;
        c.y += c.dy;
        c.tx += (mouse.x / (opt.staticity / c.magnetism) - c.tx) / opt.ease;
        c.ty += (mouse.y / (opt.staticity / c.magnetism) - c.ty) / opt.ease;
        draw(c);
        if (c.x < -c.size || c.x > w + c.size || c.y < -c.size || c.y > h + c.size) circles[i] = makeCircle();
      }
      if (running) raf = requestAnimationFrame(frame);
    }

    function start() { if (!running && !reduce) { running = true; raf = requestAnimationFrame(frame); } }
    function stop() { running = false; cancelAnimationFrame(raf); }

    setup();
    if (!reduce) {
      window.addEventListener('mousemove', function (e) {
        var r = canvas.getBoundingClientRect();
        var x = e.clientX - r.left - w / 2;
        var y = e.clientY - r.top - h / 2;
        if (Math.abs(x) < w / 2 && Math.abs(y) < h / 2) { mouse.x = x; mouse.y = y; }
      }, { passive: true });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries[0].isIntersecting ? start() : stop();
        }).observe(host);
      } else {
        start();
      }
    }
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setup, 150);
    });
  })();

  /* ---------- 2 เทคนิคพิเศษ: sticky stack ----------
     การ์ดติด (position: sticky ใน CSS) และเมื่อใบถัดไปเลื่อนขึ้นมาทับ ใบล่างจะย่อ/มืดลงเล็กน้อย
     ปิดเอฟเฟกต์บนจอ ≤991px และเมื่อผู้ใช้ตั้ง reduced motion */
  (function techStack() {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.tech-stack .tech-card'));
    if (cards.length < 2) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var small = window.matchMedia('(max-width: 991px)');
    var ticking = false;

    function update() {
      ticking = false;
      cards.forEach(function (card, i) {
        var next = cards[i + 1];
        if (!next || small.matches) { card.style.transform = ''; card.style.filter = ''; return; }
        var stickTop = parseFloat(getComputedStyle(card).top) || 0;
        var nextStick = parseFloat(getComputedStyle(next).top) || 0;
        var start = stickTop + card.offsetHeight;          // ใบถัดไปเริ่มแตะขอบล่างของใบนี้
        var p = (start - next.getBoundingClientRect().top) / (start - nextStick);
        p = Math.max(0, Math.min(1, p));
        card.style.transform = 'scale(' + (1 - 0.05 * p).toFixed(4) + ')';
        card.style.filter = 'brightness(' + (1 - 0.35 * p).toFixed(3) + ')';
      });
    }
    function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    update();
  })();

  /* ---------- Hero floats: parallax ตาม scroll ----------
     ส่งระยะ scroll (จำกัดไม่เกินความสูง hero) เป็น --hero-scroll ให้ .hero-floats
     CSS คูณด้วย --fl-depth ของแต่ละใบ → การ์ดเลื่อนลงช้ากว่าเนื้อหา · reduced motion = ไม่ขยับ */
  (function heroFloatsParallax() {
    var wrap = document.querySelector('.hero-floats');
    if (!wrap) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var hero = wrap.parentElement;
    var ticking = false;

    function update() {
      ticking = false;
      var y = Math.max(0, Math.min(window.scrollY, hero.offsetHeight));
      wrap.style.setProperty('--hero-scroll', y.toFixed(1) + 'px');
    }
    function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    update();
  })();

  /* ---------- Hero grid มือถือ (≤767): กระจายช่องไอคอนในที่ว่างจริงของ hero ----------
     จอแคบข้อความกว้างเกือบเต็มจอ และตำแหน่งตัดบรรทัดเปลี่ยนตามความกว้าง → ตั้งตำแหน่งตายตัวไม่ได้
     วิธี: หาช่องตารางที่ไม่ทับข้อความ/กล่อง (ขยายขอบกัน 8px) ในแถว 2 ถึงแถวที่ mask ยังเห็นชัด (~73% ความสูง hero)
     แล้วเลือกทีละช่องแบบ "ไกลจากช่องที่เลือกแล้วมากที่สุด" (เริ่มจากโลโก้ 2 ช่องที่ชิดขอบแถว 2)
     ทุกช่องห่างกันอย่างน้อย 1 ช่องรอบด้าน (รวมแนวทแยง) และระยะรวม ≥3 ช่อง ไม่ให้กระจุก · ที่ไม่พอก็ใส่น้อยลง
     คำนวณใหม่เมื่อฟอนต์โหลด / เปลี่ยนขนาดจอ */
  (function heroGridMobile() {
    var grid = document.querySelector('.hero-grid');
    if (!grid || !window.matchMedia) return;
    var hero = grid.parentElement;
    var mq = window.matchMedia('(max-width: 767px)');
    var cells = Array.prototype.slice.call(grid.querySelectorAll('.hg-m'));
    if (!cells.length) return;

    /* ระยะ translateY ที่ animation ตอนเลื่อนเข้า ([data-anim]) ยังค้างอยู่ — หักออกให้ได้ตำแหน่งจริง */
    function animShift(el) {
      var a = el.closest('[data-anim]');
      if (!a) return 0;
      var m = getComputedStyle(a).transform;
      if (!m || m === 'none') return 0;
      var v = m.match(/matrix\(([^)]+)\)/);
      return v ? parseFloat(v[1].split(',')[5]) || 0 : 0;
    }

    function obstacles(top0) {
      var rects = [];
      function push(r, dy) {
        if (r.width && r.height) rects.push({ l: r.left - 8, r: r.right + 8, t: r.top - dy - top0 - 8, b: r.bottom - dy - top0 + 8 });
      }
      hero.querySelectorAll('.hero-title, .hero-desc, .hero-trust').forEach(function (el) {
        var dy = animShift(el);
        var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n;
        while ((n = w.nextNode())) {
          if (!n.textContent.trim()) continue;
          var rg = document.createRange();
          rg.selectNodeContents(n);
          Array.prototype.forEach.call(rg.getClientRects(), function (r) { push(r, dy); });
        }
      });
      hero.querySelectorAll('.hero-eyebrow, .hero-offer, .hero-cta .btn, .trust-avatar, .hero-strip').forEach(function (el) {
        push(el.getBoundingClientRect(), animShift(el));
      });
      return rects;
    }

    function layout() {
      if (!mq.matches) return;
      var cell = parseFloat(getComputedStyle(grid).getPropertyValue('--cell')) || 40;
      var box = grid.getBoundingClientRect();
      var W = grid.clientWidth, H = hero.offsetHeight;
      var top0 = hero.getBoundingClientRect().top;
      var obs = obstacles(top0);
      var x0 = W / 2 - cell / 2;                     /* ขอบซ้ายช่อง c = 0 */
      var cMin = Math.ceil(-x0 / cell), cMax = Math.floor((W - x0 - cell) / cell);
      var rMax = Math.floor((H * 0.73) / cell) - 1;
      var free = [];
      for (var r = 2; r <= rMax; r++) {
        for (var c = cMin; c <= cMax; c++) {
          var L = box.left + x0 + c * cell, R = L + cell, T = r * cell, B = T + cell;
          var hit = obs.some(function (o) { return Math.min(R, o.r) > Math.max(L, o.l) && Math.min(B, o.b) > Math.max(T, o.t); });
          if (!hit) free.push({ c: c, r: r });
        }
      }
      /* จุดเริ่ม: โลโก้ 2 ช่อง (แถว 2 ชิดขอบ) */
      var chosen = [{ c: cMin, r: 2 }, { c: cMax, r: 2 }];
      var picks = [];
      cells.forEach(function () {
        var best = null, bestD = -1;
        free.forEach(function (p) {
          var d = Infinity;
          chosen.forEach(function (q) {
            var dc = Math.abs(p.c - q.c), dr = Math.abs(p.r - q.r);
            if (dc < 2 && dr < 2) d = -1;            /* ติดกัน → ใช้ไม่ได้ */
            else d = Math.min(d, Math.sqrt(dc * dc + dr * dr * 1.4));
          });
          if (d > bestD) { bestD = d; best = p; }
        });
        if (best && bestD >= 3) { chosen.push(best); picks.push(best); }   /* ห่างกันอย่างน้อย ~3 ช่อง ไม่ให้กระจุก (จอแคบจะได้น้อยช่องลงเอง) */
      });
      picks.sort(function (a, b) { return a.r - b.r || a.c - b.c; });
      cells.forEach(function (el, i) {
        var p = picks[i];
        if (p) {
          el.style.setProperty('--c', p.c);
          el.style.setProperty('--r', p.r);
          el.style.display = '';
          el.classList.add('is-placed');
        } else {
          /* ไม่มีที่ว่างพอสำหรับช่องนี้ → ซ่อน (ไม่ค้างตำแหน่งเดิมจากรอบก่อน) */
          el.classList.remove('is-placed');
          el.style.display = 'none';
        }
      });
    }

    var t = 0;
    function request() { clearTimeout(t); t = setTimeout(layout, 120); }
    layout();
    /* ฟอนต์ไทยโหลดทีหลังทำให้บรรทัดตัดใหม่ → จัดใหม่ทุกครั้งที่ฟอนต์โหลดเสร็จ + เช็กซ้ำหลังหน้าโหลด */
    if (document.fonts) {
      if (document.fonts.ready) document.fonts.ready.then(layout);
      if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', request);
    }
    window.addEventListener('resize', request);
    window.addEventListener('load', function () { layout(); setTimeout(layout, 800); });
  })();

  /* ---------- Accordion (details.disclosure): ยืด-หด .35s ease แบบ RoboLab (.faq-answer max-height .35s) ----------
     ใช้ <details>/<summary> เดิม (อ่านสถานะเปิด/ปิดได้เอง) แค่เพิ่มการยืดความสูง · ใน .faq-list เปิดได้ทีละข้อ
     ไม่มี JS / reduced motion = เปิดปิดทันที */
  (function disclosures() {
    var items = Array.prototype.slice.call(document.querySelectorAll('details.disclosure'));
    if (!items.length) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* open = สถานะที่ต้องการ · ระหว่างหด [open] ยังอยู่ (ให้เห็นเนื้อหา) จึงใส่ .is-closing ให้ CSS แสดงหน้าตาแบบปิดทันที */
    function toggle(d, open) {
      d._target = open;
      var from = d.offsetHeight; /* ความสูงปัจจุบัน (รวมกรณีกำลังยืด/หดค้างอยู่) */
      if (d._anim) { d._anim.cancel(); d._anim = null; }
      d.classList.toggle('is-closing', !open);
      if (reduce || !d.animate) { d.open = open; d.classList.remove('is-closing'); return; }
      d.open = true;
      var frame = d.offsetHeight - d.clientHeight; /* ขอบบน+ล่าง */
      var to = open ? d.offsetHeight : d.querySelector('summary').offsetHeight + frame;
      var anim = d.animate({ height: [from + 'px', to + 'px'] }, { duration: 350, easing: 'ease', fill: 'forwards' });
      d._anim = anim;
      anim.onfinish = function () {
        if (!open) { d.open = false; d.classList.remove('is-closing'); }
        anim.cancel(); /* คืนความสูงอัตโนมัติ */
        if (d._anim === anim) d._anim = null;
      };
    }

    items.forEach(function (d) {
      var summary = d.querySelector('summary');
      if (!summary) return;
      summary.addEventListener('click', function (e) {
        e.preventDefault();
        var want = !(d._anim ? d._target : d.open);
        var group = want && d.closest('.faq-list');
        if (group) {
          Array.prototype.forEach.call(group.querySelectorAll('details.disclosure'), function (o) {
            if (o !== d && (o._anim ? o._target : o.open)) toggle(o, false);
          });
        }
        toggle(d, want);
      });
    });
  })();

  /* ---------- หัวข้อเรียน: tab วันที่ 1 / วันที่ 2 (WAI-ARIA tabs: คลิก, ←/→, Home/End) ----------
     ไม่มี JS = tablist ซ่อน (hidden) และการ์ดเรียงลงมาทั้ง 2 ใบ */
  (function dayTabs() {
    var list = document.querySelector('.day-tabs');
    if (!list) return;
    var tabs = Array.prototype.slice.call(list.querySelectorAll('.day-tab'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    if (panels.some(function (p) { return !p; })) return;

    panels.forEach(function (p, i) {
      p.setAttribute('role', 'tabpanel');
      p.setAttribute('aria-labelledby', tabs[i].id);
      p.setAttribute('tabindex', '0');
    });
    list.hidden = false;
    (list.closest('.curr-main') || list.parentElement).classList.add('has-tabs');

    /* วันเวลาของวันที่เลือก แสดงข้าง tab (.day-when) · .day-meta ในการ์ดเหลือไว้ให้โปรแกรมอ่านจอ
       แยก "วันที่ · เวลา" จาก .day-meta เป็น 2 ช่อง แต่ละช่องมีไอคอนนำหน้า (event = วันที่ · schedule = เวลา) */
    var when = document.querySelector('.day-when');
    /* แยกตรงคำว่า "เวลา" (ไม่แสดงคำนี้ · มีไอคอนนาฬิกาแทน) หรือตรง " · " · ข้อความในการ์ดยังมี "เวลา" ไว้ให้โปรแกรมอ่านจอ / ตอนไม่มี JS */
    function splitMeta(t) {
      var i = t.indexOf(' เวลา ');
      if (i > -1) return [t.slice(0, i), t.slice(i + 6)];
      return t.split(' · ');
    }
    var metas = panels.map(function (p) { var m = p.querySelector('.day-meta'); return m ? splitMeta(m.textContent.trim()) : []; });
    var whenText = [];
    if (when) {
      ['event', 'schedule'].forEach(function (icon) {
        var item = document.createElement('span');
        item.className = 'day-when-item';
        var ms = document.createElement('span');
        ms.className = 'ms';
        ms.textContent = icon;
        var txt = document.createElement('span');
        item.appendChild(ms);
        item.appendChild(txt);
        when.appendChild(item);
        whenText.push(txt);
      });
      when.hidden = false;
    }


    function select(i, focus) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panels[k].classList.toggle('is-active', on);
      });
      whenText.forEach(function (el, k) { el.textContent = metas[i][k] || ''; });
      if (focus) tabs[i].focus();
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); select(n, true); }
      });
    });
    select(0);
  })();

  /* ---------- หัวข้อเรียน: หน้าจอ n8n ในโน้ตบุ๊ก ----------
     ย่อ .n8n-stage (ออกแบบที่ 2000px = ความกว้างภาพต้นฉบับ) ตามขนาดภาพจริง · หยุด animation เมื่อพ้นจอ */
  (function n8nScreen() {
    var photo = document.querySelector('.curr-photo');
    var screen = photo && photo.querySelector('.n8n');
    if (!screen) return;

    var sec = document.getElementById('curriculum');
    var head = sec && sec.querySelector('.curr-head');

    function fit() {
      photo.style.setProperty('--curr-k', (photo.offsetWidth / 2000).toFixed(5));
      /* ขอบล่างหัวข้อ (จากขอบบน section) → CSS วางโน้ตบุ๊กใต้หัวข้อระยะคงที่
         ใช้ offsetTop (ตำแหน่ง layout) ไม่ใช่ getBoundingClientRect เพราะหัวข้อมี fade-up (transform) ตอนเข้าจอ */
      if (head) {
        var y = head.offsetHeight, el = head;
        while (el && el !== sec) { y += el.offsetTop; el = el.offsetParent; }
        sec.style.setProperty('--curr-head-b', y + 'px');
      }
    }
    fit();
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(fit);
      ro.observe(photo);
      if (head) ro.observe(head);
    } else window.addEventListener('resize', fit);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { screen.classList.toggle('is-paused', !entry.isIntersecting); });
      }).observe(photo);
    }
  })();

  /* ---------- หัวข้อเรียน: ผนัง + โน้ตบุ๊กเลื่อนช้ากว่าเนื้อหา 20% (แบบ RoboLab #why-robolab ซึ่งใช้ 25%) ----------
     เฉพาะจอ ≥1200px · --curr-shift = −0.2 × ขอบบน section (จากขอบบนจอ) → 0 ตอนขอบบน section ชนขอบบนจอ = ตำแหน่งที่ออกแบบ
     ก่อนถึงจุดนั้นขึ้นได้ไม่เกิน 40px (subtext ห่างโน้ตบุ๊ก 64) · หลังจากนั้นเลื่อนลงช้ากว่าเนื้อหาจน section พ้นจอ (สูงสุด .2H)
     --curr-h = ความสูง section ให้ไล่สีผนังใน ::before ตรงกับพื้นเดิม · ≤1199 / reduced motion = 0 (อยู่กับที่) */
  (function curriculumParallax() {
    var sec = document.getElementById('curriculum');
    if (!sec || !sec.querySelector('.curr-photo') || !window.matchMedia) return;
    var desk = window.matchMedia('(min-width: 1200px)');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var ticking = false;

    function size() { sec.style.setProperty('--curr-h', sec.offsetHeight + 'px'); }
    function update() {
      ticking = false;
      var shift = 0;
      if (desk.matches && !reduce.matches) {
        var top = sec.getBoundingClientRect().top;
        shift = Math.min(Math.max(-40, -0.12 * top), 0.12 * sec.offsetHeight);
      }
      sec.style.setProperty('--curr-shift', shift.toFixed(1) + 'px');
    }
    function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

    size();
    if ('ResizeObserver' in window) new ResizeObserver(function () { size(); request(); }).observe(sec);
    else window.addEventListener('resize', size);
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    update();
  })();

  /* ---------- กราฟ ([data-chart]): เล่น animation เมื่อเลื่อนมาถึง + นับตัวเลขขึ้น ([data-count]) ---------- */
  (function charts() {
    var charts = Array.prototype.slice.call(document.querySelectorAll('[data-chart]'));
    if (!charts.length) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function format(el, n) {
      var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var plain = el.hasAttribute('data-plain');          // ไม่ใส่เครื่องหมาย + ข้างหน้า
      var target = parseFloat(el.getAttribute('data-count'));
      var sign = target < 0 ? '−' : (plain ? '' : '+');   // เครื่องหมายตามค่าปลายทาง (ไม่กระโดด +0 → −)
      return sign + Math.abs(n).toFixed(dec) + (el.getAttribute('data-suffix') || '');
    }
    function countUp(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      if (document.hidden) { el.textContent = format(el, target); return; } // แท็บไม่ได้แสดงอยู่: ใส่ค่าสุดท้ายเลย
      var start = performance.now(), dur = 1100;
      function step(now) {
        var t = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = format(el, target * eased);
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    function play(chart) {
      if (chart.classList.contains('is-in')) return;
      chart.classList.add('is-in');
      if (!reduce) chart.querySelectorAll('[data-count]').forEach(countUp);
    }

    if (reduce || !('IntersectionObserver' in window)) { charts.forEach(play); return; }
    charts.forEach(function (chart) {
      chart.querySelectorAll('[data-count]').forEach(function (el) { el.textContent = format(el, 0); });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { play(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.35 });
    charts.forEach(function (chart) { io.observe(chart); });
  })();

  /* ---------- Hero: แฟ้มกระจก (พอร์ตจาก IconFolder) + มือจากภาพจริง ----------
     - วาดรูปทรงแฟ้ม (แถบหูแฟ้ม) ตามขนาดจริงของกล่อง ใช้เป็น clip-path + เส้นขอบ SVG
     - เลื่อนถึง 30% → .is-shown (แฟ้มเด้งขึ้น ไอคอนแผ่ออก) · hover / แตะ / Enter → .is-wide (แผ่กว้างขึ้น) */
  (function heroFolder() {
    var root = document.querySelector('.ifolder');
    if (!root) return;
    var stage = root.parentElement;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ย่อแฟ้มให้กว้างเท่าแฟ้มในภาพ (71.2% ของความกว้างภาพ)
    function fit() { root.style.setProperty('--s', (stage.offsetWidth * 0.712 / 420).toFixed(4)); }
    fit();
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(stage);
    else window.addEventListener('resize', fit);

    // รูปทรงแฟ้ม: หน้า = หูแฟ้มซ้าย, หลัง = หูแฟ้มขวา (สูตรเดียวกับต้นฉบับ)
    function pathL(w, h, r, d, tw, s) {
      return 'M0 ' + r + 'A' + r + ' ' + r + ' 0 0 1 ' + r + ' 0L' + tw + ' 0C' + (tw + s * 0.55) + ' 0 ' + (tw + s * 0.45) + ' ' + d + ' ' + (tw + s) + ' ' + d +
        'L' + (w - r) + ' ' + d + 'A' + r + ' ' + r + ' 0 0 1 ' + w + ' ' + (d + r) + 'L' + w + ' ' + (h - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (w - r) + ' ' + h +
        'L' + r + ' ' + h + 'A' + r + ' ' + r + ' 0 0 1 0 ' + (h - r) + 'Z';
    }
    function pathR(w, h, r, d, tw, s) {
      var x = w - tw;
      return 'M0 ' + (d + r) + 'A' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + d + 'L' + (x - s) + ' ' + d + 'C' + (x - s * 0.45) + ' ' + d + ' ' + (x - s * 0.55) + ' 0 ' + x + ' 0' +
        'L' + (w - r) + ' 0A' + r + ' ' + r + ' 0 0 1 ' + w + ' ' + r + 'L' + w + ' ' + (h - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (w - r) + ' ' + h +
        'L' + r + ' ' + h + 'A' + r + ' ' + r + ' 0 0 1 0 ' + (h - r) + 'Z';
    }
    [['.if-front', pathL, 0.42], ['.if-back', pathR, 0.4]].forEach(function (cfg) {
      var el = root.querySelector(cfg[0]);
      var w = el.offsetWidth, h = el.offsetHeight; // ขนาดภายในคงที่ (ย่อด้วย transform)
      var d = cfg[1](w, h, 24, 24, Math.round(w * cfg[2]), 46);
      el.style.clipPath = "path('" + d + "')";
      el.querySelector('path').setAttribute('d', d);
    });

    // เด้งขึ้นเมื่อเลื่อนถึง
    if (reduce || !('IntersectionObserver' in window)) root.classList.add('is-shown');
    else {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { root.classList.add('is-shown'); io.disconnect(); }
      }, { threshold: 0.3 });
      io.observe(root);
    }

    // เปิด/กางไอคอน
    var open = false, hover = false;
    function sync() { root.classList.toggle('is-wide', open || hover); root.setAttribute('aria-expanded', String(open)); }
    root.addEventListener('click', function () { open = !open; sync(); });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open = !open; sync(); }
    });
    root.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hover = true; sync(); } });
    root.addEventListener('pointerleave', function () { hover = false; setHi(null); sync(); });

    // ชี้ไอคอนทีละอัน: ยกขึ้น + โชว์ชื่อ + ไฮไลต์ tag ที่ตรงกัน
    var iconsBox = root.querySelector('.if-icons');
    var icons = root.querySelectorAll('.if-icon');
    var tags = root.querySelectorAll('.if-tag');
    function setHi(i) {
      icons.forEach(function (el, j) { el.classList.toggle('is-hi', j === i); });
      tags.forEach(function (el, j) { el.classList.toggle('is-hi', j === i); });
      iconsBox.classList.toggle('has-hi', i !== null);
    }
    icons.forEach(function (el, i) {
      var inner = el.querySelector('.if-inner');
      inner.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') setHi(i); });
      inner.addEventListener('pointerleave', function () { if (el.classList.contains('is-hi')) setHi(null); });
    });

  })();

  /* ---------- Countdown สู่วันเรียน ([data-countdown]) ---------- */
  document.querySelectorAll('[data-countdown]').forEach(function (row) {
    var target = new Date(row.getAttribute('data-countdown')).getTime();
    var nums = row.querySelectorAll('.cd-num');
    function pad(n) { return String(n).padStart(2, '0'); }
    function tick() {
      var left = Math.max(0, target - Date.now());
      var parts = [
        Math.floor(left / 86400000),
        Math.floor(left / 3600000) % 24,
        Math.floor(left / 60000) % 60,
        Math.floor(left / 1000) % 60,
      ];
      nums.forEach(function (el, i) { el.textContent = pad(parts[i]); });
    }
    tick();
    setInterval(tick, 1000);
  });
})();
