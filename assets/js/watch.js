/* หน้าดูย้อนหลัง (watch.html) — พฤติกรรมตาม RoboLab /watch
   - เลือกตอนจากสารบัญ / ปุ่มก่อนหน้า-ถัดไป → เปลี่ยนชื่อตอน หัวข้อ และไฮไลต์ในสารบัญ (วิดีโอยังล็อกทุกตอน)
   - หัวข้อวัน (section) กดเปิด-ปิดรายการตอน เปิดพร้อมกันหลายวันได้
   - จอ ≥1024: ปุ่มวงกลมซ่อน/แสดงสารบัญ · ≤1023: สารบัญเป็นแผ่นเลื่อนขึ้นจากล่าง ปิดด้วยฉากหลัง / ที่จับ / Esc / เลือกตอน */
(function () {
  'use strict';

  var root = document.querySelector('.cw-root');
  if (!root) return;

  var layout = root.querySelector('.cw-layout');
  var sidebar = document.getElementById('cw-sidebar');
  var toggle = root.querySelector('.cw-sidebar-toggle');
  var backdrop = root.querySelector('.cw-backdrop');
  var handle = root.querySelector('.cw-sidebar-handle');
  var openBtn = root.querySelector('.cw-bottom-lessons');
  var player = root.querySelector('.cw-player');
  var tSection = document.getElementById('cw-t-section');
  var tLesson = document.getElementById('cw-t-lesson');
  var tTopic = document.getElementById('cw-t-topic');
  var prev = document.getElementById('cw-prev');
  var next = document.getElementById('cw-next');
  var lessons = Array.prototype.slice.call(root.querySelectorAll('.cw-lesson-btn'));
  var mobile = window.matchMedia('(max-width: 1023px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var cur = 0;

  /* ---------- หัวข้อวัน: เปิด-ปิดรายการตอน ---------- */
  function setSection(sec, open) {
    var row = sec.querySelector('.cw-section-row');
    var list = sec.querySelector('.cw-lessons');
    sec.classList.toggle('is-open', open);
    row.setAttribute('aria-expanded', open ? 'true' : 'false');
    row.querySelector('.cw-section-chevron').textContent = open ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
    list.hidden = !open;
  }

  root.querySelectorAll('.cw-section-row').forEach(function (row) {
    row.addEventListener('click', function () {
      var sec = row.closest('.cw-section');
      setSection(sec, !sec.classList.contains('is-open'));
    });
  });

  /* ---------- เลือกตอน ---------- */
  function select(i, animate) {
    cur = Math.max(0, Math.min(lessons.length - 1, i));
    var b = lessons[cur];
    var sec = b.closest('.cw-section');
    lessons.forEach(function (x, k) {
      x.classList.toggle('cw-lesson-btn--active', k === cur);
      if (k === cur) x.setAttribute('aria-current', 'true');
      else x.removeAttribute('aria-current');
    });
    if (!sec.classList.contains('is-open')) setSection(sec, true);

    function apply() {
      /* ชื่อวันคัดลอกพร้อม span.nobr (ตัดบรรทัดตรงวลี) — เนื้อหาคงที่ในหน้า ไม่ใช่ข้อมูลจากผู้ใช้ */
      tSection.innerHTML = sec.querySelector('.cw-section-name').innerHTML;
      tLesson.textContent = b.querySelector('.cw-lesson-name').textContent;
      tTopic.textContent = b.getAttribute('data-topic') || '';
    }
    if (animate && !reduce.matches) {
      /* เฟดวิดีโอออกแล้วเข้าแบบ RoboLab (.18s) */
      player.classList.add('cw-player--fading');
      setTimeout(function () { apply(); player.classList.remove('cw-player--fading'); }, 180);
    } else {
      apply();
    }
    prev.disabled = cur === 0;
    next.disabled = cur === lessons.length - 1;
  }

  lessons.forEach(function (b, k) {
    b.addEventListener('click', function () {
      select(k, true);
      if (mobile.matches) closeSheet();
    });
  });
  prev.addEventListener('click', function () { select(cur - 1, true); });
  next.addEventListener('click', function () { select(cur + 1, true); });

  /* ---------- สารบัญ: จอใหญ่ = ซ่อน/แสดง · มือถือ = แผ่นเลื่อนขึ้น ---------- */
  var hideTimer = 0;

  function setOpen(open) {
    sidebar.classList.toggle('cw-sidebar--open', open);
    layout.classList.toggle('cw-layout--sidebar-closed', !open);
    toggle.classList.toggle('cw-sidebar-toggle--open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    /* สารบัญที่ปิดอยู่ไม่ให้แท็บเข้าไปได้ */
    if (open) sidebar.removeAttribute('inert');
    else sidebar.setAttribute('inert', '');
  }

  function openSheet() {
    clearTimeout(hideTimer);
    backdrop.hidden = false;
    setOpen(true);
    requestAnimationFrame(function () { backdrop.classList.add('cw-backdrop--visible'); });
    var active = lessons[cur];
    setTimeout(function () { (active || handle).focus({ preventScroll: false }); }, 50);
  }

  function closeSheet() {
    if (!sidebar.classList.contains('cw-sidebar--open')) return;
    setOpen(false);
    backdrop.classList.remove('cw-backdrop--visible');
    hideTimer = setTimeout(function () { backdrop.hidden = true; }, 280);
    openBtn.focus({ preventScroll: true });
  }

  toggle.addEventListener('click', function () {
    setOpen(!sidebar.classList.contains('cw-sidebar--open'));
  });
  openBtn.addEventListener('click', openSheet);
  backdrop.addEventListener('click', closeSheet);
  handle.addEventListener('click', closeSheet);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobile.matches) closeSheet();
  });

  /* ค่าเริ่มต้นตามขนาดจอ: จอใหญ่เปิดสารบัญ · มือถือปิด (เปลี่ยนเมื่อข้ามเส้น 1024) */
  function byViewport() {
    clearTimeout(hideTimer);
    backdrop.classList.remove('cw-backdrop--visible');
    backdrop.hidden = true;
    setOpen(!mobile.matches);
  }
  if (mobile.addEventListener) mobile.addEventListener('change', byViewport);
  else if (mobile.addListener) mobile.addListener(byViewport);

  byViewport();
  select(0, false);
})();
