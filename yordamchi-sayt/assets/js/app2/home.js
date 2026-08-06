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
        /* Yuqori qator: salomlashuv + o'ng burchakda bildirishnoma qo'ng'irog'i */
        '<div class="h-top">' +
          '<div class="h-hello" id="h-hello"></div>' +
          '<div id="nt-bell-host">' + (window.Notify ? Notify.bellHtml() : '') + '</div>' +
        '</div>' +
        '<div class="rings" id="h-rings"></div>' +
        '<div id="h-lessons"></div>' +
        '<div class="hm-card">' +
          '<div class="hm-head">' +
            '<div class="hm-title"><b id="hm-total">0</b> <span id="hm-period">faollik</span></div>' +
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
      renderHello();
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

  /* Kun vaqtiga qarab salomlashuv — qo'ng'iroq yolg'iz turmasin */
  function renderHello() {
    var box = App.el('h-hello'); if (!box) return;
    var h = new Date().getHours();
    var greet = h < 5 ? 'Xayrli tun' : h < 12 ? 'Xayrli tong' : h < 18 ? 'Xayrli kun' : 'Xayrli kech';
    var name = (ls('user_name', '') || '').trim();
    box.innerHTML = '<b>' + App.esc(greet) + (name ? ', ' + App.esc(name) : '') + '</b>';
  }

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
  // Qadam — ko'rinayotgan oyna kengligiga teng (telefonda 6, desktopda 12)
  App.actions.hmBack = function () { HM_OFFSET += monthsToShow(); renderHeatmap(); };
  App.actions.hmFwd = function () {
    HM_OFFSET = Math.max(0, HM_OFFSET - monthsToShow());
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

  /* Bo'shliqlar tor ekranda kichikroq — shu hisobga kataklar kattaroq chiqadi.
     (`.hm-row` gap'i CSS'da ham shu qiymatlarga mos bo'lishi kerak.) */
  function gaps() {
    var narrow = (window.innerWidth || 1024) < 700;
    return { cell: narrow ? 2 : 3, month: narrow ? 4 : 6 };
  }

  /* Nechta oy ko'rsatiladi.
     Telefonda 6 oy — bu ekranga TO'LIQ sig'adi, ya'ni na siljitish, na
     karusel kerak (foydalanuvchi so'rovi). Kengroq ekranda 12 oy.
     Eski oylarni ko'rish uchun tepadagi ← → strelkalari bor — ular
     ko'rinayotgan oyna qadamiga teng suradi. */
  function monthsToShow() {
    var w = window.innerWidth || 1024;
    return w < 700 ? 6 : 12;
  }

  /* ---------- Faollik heatmap: bitta qator (LeetCode uslubi) ----------
     Oylar ALOHIDA bloklar — oralarida bo'shliq, oy nomi blok ostida.
     Katak o'lchami JS'da hisoblanadi (CSS `1fr` emas): ko'rsatilayotgan
     oylar soni mavjud enga qarab tanlangani uchun hammasi doim sig'adi. */
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

    // Ko'rsatiladigan oylar: joriy oy oxirgi bo'ladi
    var SHOW = monthsToShow();
    var months = [];
    for (var m = SHOW - 1; m >= 0; m--) {
      var d = new Date(today.getFullYear(), today.getMonth() - m - HM_OFFSET, 1);
      months.push({ y: d.getFullYear(), m: d.getMonth() });
    }

    /* Oy necha ustunga (haftaga) bo'linadi */
    function colsOf(mo) {
      var first = new Date(mo.y, mo.m, 1);
      var last = new Date(mo.y, mo.m + 1, 0);
      return Math.ceil((first.getDay() + last.getDate()) / 7);
    }

    /* Katak o'lchami — mavjud enni ANIQ formula bilan bo'lamiz. Umumiy en:
         cell*totalCols + cellGap*(totalCols - oylarSoni) + monthGap*(oylar-1)
       (har oy ichida `cols-1` ta katak oralig'i bor). Taxminiy bo'lish
       o'nlab piksel behuda ketkazardi — katak allaqachon kichkina bo'lgani
       uchun har piksel muhim. Oylar soni ekranga qarab tanlangani uchun
       natija DOIM sig'adi: siljitish/karusel yo'q. */
    var G = gaps();
    var CELL_GAP = G.cell, MONTH_GAP = G.month;
    var n = months.length;
    var totalCols = months.reduce(function (a, mo) { return a + colsOf(mo); }, 0);
    var w = wrap.clientWidth;
    var cell = Math.floor((w - CELL_GAP * (totalCols - n) - MONTH_GAP * (n - 1)) / totalCols);
    if (!isFinite(cell) || cell < 6) cell = 6;   // o'qib bo'ladigan eng kichik
    if (cell > 26) cell = 26;                    // keng ekranda cho'zilmasin

    /* Birinchi chizishda sahifa hali joylashmagan bo'lishi mumkin — o'shanda
       `clientWidth` haqiqiy kenglikni bermaydi va katak keraksiz kichik
       chiqadi. Shubhali bo'lsa keyingi kadrda qayta chizamiz. */
    if (w < 80) { setTimeout(renderHeatmap, 60); }

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

    // Bitta qator, to'liq sig'adi — siljitish yo'q
    wrap.innerHTML = '<div class="hm-row" id="hm-row" style="gap:' + MONTH_GAP + 'px">' +
                     months.map(monthHtml).join('') + '</div>';

    // Statistika — KO'RSATILAYOTGAN oylar oralig'i bo'yicha
    var active = 0, streak = 0, best = 0;
    var from = new Date(months[0].y, months[0].m, 1);
    for (var d2 = new Date(from); d2 <= today; d2.setDate(d2.getDate() + 1)) {
      if (set[key(d2)]) { active++; streak++; if (streak > best) best = streak; }
      else { streak = 0; }
    }

    App.el('hm-total').textContent = active;
    App.el('hm-days').textContent = active;
    App.el('hm-streak').textContent = best;
    // Sarlavha ko'rsatilayotgan davrga mos bo'lsin ("oxirgi bir yilda" emas)
    var lbl = App.el('hm-period');
    if (lbl) lbl.textContent = 'faollik — oxirgi ' + SHOW + ' oyda';
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
     (BoostDay.dayGroups) — localStorage'ni to'g'ridan-to'g'ri o'qish
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
    // Faqat Boostday kerak — vidjet endi sport ma'lumotini ishlatmaydi
    if (window.BoostDay) boot.push(window.BoostDay.ensureLoaded());

    /* `items` berilsa — kompyuterda (bo'sh joy ko'p) halqa yoniga vazifalar
       ro'yxati ham chiqadi (`.wd-detail`, faqat desktop kengligida ko'rinadi
       — CSS: @media min-width:980px). Telefonda hech narsa o'zgarmaydi. */
    function mkRing(pct, color, size, stroke, label, valLabel, arg, items) {
      var r = (size - stroke) / 2;
      var c = 2 * Math.PI * r;
      var on = Math.max(0, Math.min(100, pct)) / 100 * c;
      var detail = '';
      if (items && items.length) {
        var MAX = 6;
        detail = '<div class="wd-detail">' +
          items.slice(0, MAX).map(function (t) {
            return '<div class="wd-ditem' + (t.done ? ' done' : '') + '">' +
              (t.done ? '<span data-icon="check" data-icon-size="12"></span>' : '<i class="wd-dot"></i>') +
              '<span>' + App.esc(App.normTaskName(t.text)) + '</span></div>';
          }).join('') +
          (items.length > MAX ? '<div class="wd-ditem more">+' + (items.length - MAX) + ' ko\'proq</div>' : '') +
          '</div>';
      }
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
        detail +
        '</div>';
    }

    /* Halqalar: chapda bitta katta UMUMIY, o'ngda har bir bo'lim uchun
       kichkinasi. Bo'limlar — botda kiritilgan GURUHLAR + Sport.
       ("Jadval" va yagona "Boostday" halqalari olib tashlandi: ular bir
       xil ishni ikki marta ko'rsatardi.) */
    var RING_COLORS = ['var(--purple)', 'var(--success)', 'var(--coral)', 'var(--warn)', 'var(--accent)'];

    function paint(parts) {
      var totalTasks = 0, doneTasks = 0;
      parts.forEach(function (p) { totalTasks += p.total; doneTasks += p.done; });
      var pct = function (a, b) { return b ? Math.round((a / b) * 100) : 0; };

      var subs = parts.length
        ? parts.map(function (p, i) {
            return mkRing(pct(p.done, p.total), p.color || RING_COLORS[i % RING_COLORS.length],
                          54, 5, p.name, p.done + '/' + p.total, p.go, p.items);
          }).join('')
        : '<p class="wd-empty">Botda reja kiritilmagan</p>';

      box.innerHTML =
        '<div class="hsec" style="margin-top:24px"><h2>Kunlik statistika</h2></div>' +
        '<div class="wd-card">' +
          '<div class="wd-main">' +
            mkRing(pct(doneTasks, totalTasks), 'var(--accent)', 92, 8, 'Umumiy kun', doneTasks + ' / ' + totalTasks + ' vazifa') +
          '</div>' +
          '<div class="wd-sub">' + subs + '</div>' +
        '</div>';
      App.icons(box);
    }

    Promise.all(boot).then(function () {
      var parts = [];

      /* FAQAT botda kiritilgan guruhlar. Alohida "Sport" halqasi ATAYLAB
         yo'q: foydalanuvchi mashqlarni doim bot orqali qo'shadi, shuning
         uchun ular allaqachon o'z guruhida sanaladi — ikkinchi halqa
         qo'shilsa bitta ish ikki joyda ko'rinardi. */
      if (window.BoostDay && BoostDay.dayGroups) {
        try {
          BoostDay.dayGroups(ymd, dayOfWeek).forEach(function (g) {
            if (g.total) parts.push({ name: g.name, total: g.total, done: g.done, color: g.color, go: { v: 'boost' }, items: g.items });
          });
        } catch (e) {}
      }

      paint(parts);
    }).catch(function () { paint([]); });
  }

})();
