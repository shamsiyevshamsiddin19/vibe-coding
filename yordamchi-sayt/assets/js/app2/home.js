/* Bosh sahifa.
   Tuzilishi: halqali ko'rsatkichlar -> bugungi darslar -> faollik heatmap'i
   (oxirgi bir yil) -> kunlik statistika.
   Maqsadlarning to'liq boshqaruvi alohida "goals" bo'limida. */
(function () {
  'use strict';

  function ls(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }

  App.view('home', {
    nav: 'home',
    render: function (page) {
      page.innerHTML =
        '<div class="rings" id="h-rings"></div>' +
        '<div id="h-lessons"></div>' +
        '<div class="hm-card">' +
          '<div class="hm-head">' +
            '<div class="hm-title"><b id="hm-total">0</b> <span>faollik — oxirgi bir yilda</span></div>' +
            '<div class="hm-stats"><span>Faol kunlar: <b id="hm-days">0</b></span>' +
            '<span>Eng uzun seriya: <b id="hm-streak">0</b></span></div>' +
          '</div>' +
          '<div class="hm-nav">' +
            '<button class="hm-arrow" data-act="hmBack" aria-label="Oldingi">' +
            '<span data-icon="arrowLeft" data-icon-size="15"></span></button>' +
            '<span class="hm-range" id="hm-range"></span>' +
            '<button class="hm-arrow" data-act="hmFwd" aria-label="Keyingi" id="hm-fwd">' +
            '<span data-icon="arrowLeft" data-icon-size="15" style="transform:rotate(180deg)"></span></button>' +
          '</div>' +
          '<div class="hm-wrap" id="hm-wrap"></div>' +
        '</div>' +
        '<div id="h-widget"></div>';

      App.icons(page);
      renderLessons();
      if (window.LmsDay) LmsDay.ensureLoaded().then(renderLessons).catch(function () {});
      renderHeatmap();
      renderDailyWidget();
      bindResize();

      var g = (window.Goals && Goals.data && Goals.data.loaded) ? Goals.stats() : { done: 0, total: 0, pct: 0 };
      renderRings(g);
      if (window.Goals && !Goals.data.loaded) {
        Goals.load().then(function () { renderRings(Goals.stats()); }).catch(function () {});
      }
    },
    leave: function () { unbindResize(); }
  });

  /* ---------- Halqali ko'rsatkichlar ---------- */
  function ringSvg(pct, color) {
    var r = 22, c = 2 * Math.PI * r;
    var on = Math.max(0, Math.min(100, pct)) / 100 * c;
    return '<svg viewBox="0 0 52 52">' +
      '<circle class="bgc" cx="26" cy="26" r="' + r + '" fill="none" stroke-width="5"></circle>' +
      '<circle class="fgc" cx="26" cy="26" r="' + r + '" fill="none" stroke-width="5" ' +
      'style="stroke:' + color + '" stroke-dasharray="' + on.toFixed(1) + ' ' + c.toFixed(1) + '"></circle>' +
      '</svg>';
  }
  function renderRings(g) {
    var box = App.el('h-rings'); if (!box) return;
    var streak = (window.Activity && Activity.streak) ? Activity.streak() : 0;
    // Seriya halqasi 30 kunlik maqsadga nisbatan to'ladi
    var sPct = Math.min(100, Math.round((streak / 30) * 100));
    box.innerHTML =
      '<div class="ring-card">' +
        '<div class="ring">' + ringSvg(g.pct, 'var(--accent)') +
          '<div class="ring-mid">' + g.pct + '%</div></div>' +
        '<div class="ring-lb"><b>' + g.done + '/' + g.total + '</b><span>Maqsad</span></div>' +
      '</div>' +
      '<div class="ring-card">' +
        '<div class="ring">' + ringSvg(sPct, 'var(--warn)') +
          '<div class="ring-mid">' + (streak || '·') + '</div></div>' +
        '<div class="ring-lb"><b>' + (streak ? streak + ' kun' : 'Boshlang') + '</b><span>Ketma-ket</span></div>' +
      '</div>';
  }

  /* ---------- Bugungi darslar ---------- */
  function nowMins() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  function toMins(t) { var p = String(t || '').split(':'); return (+p[0] || 0) * 60 + (+p[1] || 0); }

  function renderLessons() {
    var box = App.el('h-lessons'); if (!box) return;
    if (!window.Kun || !Kun.dayLessons) { box.innerHTML = ''; return; }
    var list = [];
    try { list = Kun.dayLessons(); } catch (e) { list = []; }
    if (!list.length) { box.innerHTML = ''; return; }

    var n = nowMins();
    box.innerHTML =
      '<div class="hsec"><h2>Bugungi reja</h2>' +
      '<button class="lnk" data-act="go" data-arg=\'{"v":"kun"}\'>Kun hisobi</button></div>' +
      list.map(function (l) {
        var live = n >= toMins(l.start) && n < toMins(l.end);
        var past = n >= toMins(l.end);
        return '<div class="les' + (live ? ' now' : '') + (past ? ' past' : '') + (l.done ? ' done' : '') + '">' +
          '<div class="les-t">' + App.esc(l.start) + '<br>' + App.esc(l.end) + '</div>' +
          '<div class="les-bar" style="background:' + (l.color || 'var(--accent)') + '"></div>' +
          '<div class="les-m"><b>' + App.esc(l.subject) + '</b>' +
          '<span>' + App.esc(l.room || '') + (live ? ' · hozir' : '') + '</span></div>' +
          '</div>';
      }).join('');
  }

  /* Nechta oy ORQAGA surilgan (0 = joriy oygacha) — eski tarixni ko'rish uchun. */
  var HM_OFFSET = 0;
  App.actions.hmBack = function () { HM_OFFSET += 6; renderHeatmap(); };
  App.actions.hmFwd = function () {
    HM_OFFSET = Math.max(0, HM_OFFSET - 6);
    renderHeatmap();
  };

  /* Ekran o'lchami o'zgarganda qator soni ham o'zgaradi — qayta chizamiz. */
  var RESIZE_T = null;
  function onResize() {
    clearTimeout(RESIZE_T);
    RESIZE_T = setTimeout(function () { if (App.el('hm-wrap')) renderHeatmap(); }, 200);
  }
  function bindResize() { window.addEventListener('resize', onResize); }
  function unbindResize() { window.removeEventListener('resize', onResize); clearTimeout(RESIZE_T); }

  /* Katakning eng kichik ruxsat etilgan o'lchami (px).
     12 oy HAR DOIM bitta qatorda turadi (foydalanuvchi so'rovi). Ekranga
     sig'sa — kataklar kengayib butun enni egallaydi; sig'masa (telefon)
     katak shu eng kichik o'lchamda qoladi va qator GORIZONTAL SILJIYDI
     (GitHub/LeetCode telefonda aynan shunday). Kataklarni ekranga
     tiqishtirib maydalashtirish YO'Q — aynan shu shikoyat bo'lgan. */
  var MIN_CELL = 12;
  var CELL_GAP = 3;    // kataklar orasi
  var MONTH_GAP = 6;   // oy bloklari orasi (app.css `.hm-row` gap bilan bir xil)

  /* ---------- Faollik heatmap: 12 oy, bitta qator (LeetCode uslubi) ----------
     Oylar ALOHIDA bloklar — oralarida bo'shliq, oy nomi blok ostida.
     Katak o'lchami JS'da hisoblanadi (CSS `1fr` emas), chunki siljish
     kerakmi-yo'qmi shunga qarab hal bo'ladi. */
  function renderHeatmap() {
    var wrap = App.el('hm-wrap'); if (!wrap) return;
    var set = {};
    try {
      (JSON.parse(ls('activity_days_v1', '[]')) || []).forEach(function (d) { set[d] = true; });
    } catch (e) {}

    function key(d) {
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
             String(d.getDate()).padStart(2, '0');
    }

    var MON = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var todayKey = key(today);

    // Oxirgi 12 oy: joriy oy oxirgi bo'ladi
    var months = [];
    for (var m = 11; m >= 0; m--) {
      var d = new Date(today.getFullYear(), today.getMonth() - m - HM_OFFSET, 1);
      months.push({ y: d.getFullYear(), m: d.getMonth() });
    }

    /* Oy necha ustunga (haftaga) bo'linadi */
    function colsOf(mo) {
      var first = new Date(mo.y, mo.m, 1);
      var last = new Date(mo.y, mo.m + 1, 0);
      return Math.ceil((first.getDay() + last.getDate()) / 7);
    }

    /* Katak o'lchamini mavjud enga qarab hisoblaymiz.
       Sig'sa — kengaytiramiz; sig'masa MIN_CELL'da qoldiramiz (qator siljiydi). */
    var totalCols = months.reduce(function (a, mo) { return a + colsOf(mo); }, 0);
    var avail = Math.max(0, wrap.clientWidth - MONTH_GAP * (months.length - 1));
    var cell = Math.floor(avail / totalCols) - CELL_GAP;
    if (!isFinite(cell) || cell < MIN_CELL) cell = MIN_CELL;
    if (cell > 26) cell = 26;   // juda keng ekranda cho'zilib ketmasin

    function monthHtml(mo) {
      var first = new Date(mo.y, mo.m, 1);
      var last = new Date(mo.y, mo.m + 1, 0);
      var cols = colsOf(mo);

      // Ustun × qator kataklari; oyga tegishli bo'lmagan katak bo'sh
      var cells = [];
      for (var c = 0; c < cols; c++) {
        for (var r = 0; r < 7; r++) {
          var dayNum = c * 7 + r - first.getDay() + 1;
          if (dayNum < 1 || dayNum > last.getDate()) { cells.push(null); continue; }
          cells.push(new Date(mo.y, mo.m, dayNum));
        }
      }

      var inner = cells.map(function (d) {
        if (!d) return '<i class="pad"></i>';
        var k = key(d);
        if (d > today) return '<i class="fut"></i>';
        var on = !!set[k];
        return '<i data-l="' + (on ? 4 : 0) + '"' + (k === todayKey ? ' class="now"' : '') +
               ' title="' + k + '" style="cursor:pointer" data-act="go" data-arg=\'' + App.arg({ v: 'tarix_day', p: { date: k } }) + '\'></i>';
      }).join('');

      return '<div class="hm-mo">' +
             '<div class="hm-mo-grid" style="gap:' + CELL_GAP + 'px;' +
             'grid-template-columns:repeat(' + cols + ',' + cell + 'px);' +
             'grid-template-rows:repeat(7,' + cell + 'px)">' +
             inner + '</div>' +
             '<div class="hm-mo-lb">' + MON[mo.m] + '</div></div>';
    }

    // 12 oy — BITTA qator (sig'masa gorizontal siljiydi)
    wrap.innerHTML = '<div class="hm-row" id="hm-row">' + months.map(monthHtml).join('') + '</div>';

    /* Sig'magan holatda joriy oy ko'rinib tursin — qator OXIRIGA suriladi.
       Aks holda telefonda bir yil oldingi oy ochilib turardi. */
    var row = App.el('hm-row');
    if (row && row.scrollWidth > row.clientWidth) row.scrollLeft = row.scrollWidth;

    // Statistika — oxirgi 12 oy oralig'idagi kunlar bo'yicha
    var active = 0, streak = 0, best = 0;
    var from = new Date(months[0].y, months[0].m, 1);
    for (var d2 = new Date(from); d2 <= today; d2.setDate(d2.getDate() + 1)) {
      if (set[key(d2)]) { active++; streak++; if (streak > best) best = streak; }
      else { streak = 0; }
    }

    App.el('hm-total').textContent = active;
    App.el('hm-days').textContent = active;
    App.el('hm-streak').textContent = best;
    App.el('hm-range').textContent = MON[months[0].m] + ' ' + months[0].y + ' — ' +
      MON[months[months.length - 1].m] + ' ' + months[months.length - 1].y;
    var fw = App.el('hm-fwd');
    if (fw) {
      fw.style.opacity = HM_OFFSET === 0 ? '0.3' : '1';
      fw.style.pointerEvents = HM_OFFSET === 0 ? 'none' : 'auto';
    }
  }

  /* ---------- Kunlik statistika ----------
     MUHIM: raqamlar boshqa modullarning OMMAVIY API'sidan olinadi
     (BoostDay/Kun/SportBridge) — localStorage'ni to'g'ridan-to'g'ri o'qish
     EMAS. Ilgari shu yerda `boost_tasks_v1`/`kun_log_v1`/`sport_data_v1`
     kabi MAVJUD BO'LMAGAN kalitlar o'qilgani uchun hamma ko'rsatkich doim
     0 bo'lib turardi. */
  function renderDailyWidget() {
    var box = App.el('h-widget'); if (!box) return;

    box.innerHTML = '<div class="hsec" style="margin-top:24px"><h2>Kunlik statistika</h2></div>' +
      '<div class="load-wrap"><div class="spinner"></div></div>';

    var d = new Date();
    var ymd = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    var dayOfWeek = d.getDay();

    var boot = [];
    if (window.BoostDay) boot.push(window.BoostDay.ensureLoaded());
    if (window.SportBridge) boot.push(window.SportBridge.ensureLoaded());

    function mkRing(pct, color, size, stroke, label, valLabel, arg) {
      var r = (size - stroke) / 2;
      var c = 2 * Math.PI * r;
      var on = Math.max(0, Math.min(100, pct)) / 100 * c;
      return '<div class="wd-ring"' +
        (arg ? ' data-act="go" data-arg=\'' + App.arg(arg) + '\' style="cursor:pointer"' : '') + '>' +
        '<div class="wd-ring-svg" style="width:' + size + 'px;height:' + size + 'px">' +
        '<svg viewBox="0 0 ' + size + ' ' + size + '">' +
        '<circle cx="' + (size / 2) + '" cy="' + (size / 2) + '" r="' + r + '" fill="none" stroke="var(--border)" stroke-width="' + stroke + '"></circle>' +
        '<circle cx="' + (size / 2) + '" cy="' + (size / 2) + '" r="' + r + '" fill="none" stroke="' + color +
        '" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + on.toFixed(1) + ' ' + c.toFixed(1) + '"></circle>' +
        '</svg>' +
        '<div class="wd-ring-mid" style="font-size:' + Math.round(size / 4.2) + 'px">' + pct + '%</div>' +
        '</div>' +
        '<div class="wd-lbl">' + App.esc(label) + '</div>' +
        '<div class="wd-val">' + App.esc(valLabel) + '</div>' +
        '</div>';
    }

    function paint(bTot, bDone, kTot, kDone, sTot, sDone) {
      var totalTasks = bTot + kTot + sTot;
      var doneTasks = bDone + kDone + sDone;
      var pct = function (a, b) { return b ? Math.round((a / b) * 100) : 0; };

      box.innerHTML =
        '<div class="hsec" style="margin-top:24px"><h2>Kunlik statistika</h2></div>' +
        '<div class="wd-card">' +
          '<div class="wd-main">' +
            mkRing(pct(doneTasks, totalTasks), 'var(--accent)', 92, 8, 'Umumiy kun', doneTasks + ' / ' + totalTasks + ' vazifa') +
          '</div>' +
          '<div class="wd-sub">' +
            mkRing(pct(bDone, bTot), 'var(--purple)', 54, 5, 'Boostday', bDone + '/' + bTot, { v: 'boost' }) +
            mkRing(pct(kDone, kTot), 'var(--success)', 54, 5, 'Jadval', kDone + '/' + kTot, { v: 'kun' }) +
            mkRing(pct(sDone, sTot), 'var(--teal)', 54, 5, 'Sport', sDone + '/' + sTot, { v: 'sport' }) +
          '</div>' +
        '</div>';
      App.icons(box);
    }

    Promise.all(boot).then(function () {
      var bTot = 0, bDone = 0;
      if (window.BoostDay) {
        try {
          window.BoostDay.dayItems(ymd, dayOfWeek).forEach(function (b) {
            bTot += b.total; bDone += b.done;
          });
        } catch (e) {}
      }

      var kTot = 0, kDone = 0;
      if (window.Kun) {
        try {
          window.Kun.dayLessons().forEach(function (k) { kTot++; if (k.done) kDone++; });
        } catch (e) {}
      }

      var sTot = 0, sDone = 0;
      if (window.SportBridge) {
        try {
          var pend = window.SportBridge.todayPending() || [];
          var done = window.SportBridge.doneToday() || [];
          sDone = done.length;
          sTot = pend.length + done.length;
        } catch (e) {}
      }

      paint(bTot, bDone, kTot, kDone, sTot, sDone);
    }).catch(function () { paint(0, 0, 0, 0, 0, 0); });
  }

})();
