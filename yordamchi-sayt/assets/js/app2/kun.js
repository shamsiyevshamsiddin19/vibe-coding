/* Kun hisobi — haftalik dars jadvali. To'liq saytdan tahrirlanadi va
   localStorage'da saqlanadi (server bilan sinxron).

   Jadval BO'SH boshlanadi — darslarni "+" tugmasi orqali o'zingiz qo'shasiz.
   Agar loyihani o'z guruhingiz uchun tayyor jadval bilan tarqatmoqchi
   bo'lsangiz, DEFAULT_SCHEDULE ichini quyidagi ko'rinishda to'ldiring:

     1: [ { start: "08:30", end: "10:00", room: "A-101",
            subject: "Matematika", color: "#3b82f6",
            weekType: "left" } ],   // weekType: "left" | "right" | yo'q (har hafta)

   Kalitlar — hafta kunlari: 0 = Yakshanba ... 6 = Shanba. */
(function () {
  'use strict';

  var STORE_KEY = 'kun_schedule_v1';

  var DEFAULT_SCHEDULE = {
    0: [], // Yakshanba
    1: [], // Dushanba
    2: [], // Seshanba
    3: [], // Chorshanba
    4: [], // Payshanba
    5: [], // Juma
    6: []  // Shanba
  };
  var DAY_SHORT = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
  var DAY_FULL = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
  /* "1-hafta / 2-hafta" (juft-toq) almashinuvi shu sanadan hisoblanadi —
     o'quv yilingiz birinchi haftasining dushanbasini yozing. */
  var REF_WEEK_START = new Date('2026-01-05T00:00:00');
  var COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#a855f7', '#f97316', '#14b8a6'];

  /* --- Jadval saqlash/o'qish --- */
  var SCHEDULE = null;
  function loadSchedule() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var v = JSON.parse(raw);
        if (v && typeof v === 'object') return v;
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
  }
  function saveSchedule() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(SCHEDULE)); } catch (e) {}
  }
  function ensureLoaded() { if (!SCHEDULE) SCHEDULE = loadSchedule(); }

  function isLeftWeekActive() {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var ref = new Date(REF_WEEK_START); ref.setHours(0, 0, 0, 0);
    var diffWeeks = Math.floor((today - ref) / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks % 2 === 0;
  }
  function isLessonActive(lesson) {
    if (!lesson.weekType) return true;
    var leftActive = isLeftWeekActive();
    return lesson.weekType === 'left' ? leftActive : !leftActive;
  }
  function dayTotalMins(dayIdx) {
    var lessons = SCHEDULE[dayIdx] || [];
    if (!lessons.length) return 0;
    var intervals = lessons.map(function (l) {
      var sp = l.start.split(':').map(Number), ep = l.end.split(':').map(Number);
      return [sp[0] * 60 + sp[1], ep[0] * 60 + ep[1]];
    }).sort(function (a, b) { return a[0] - b[0]; });
    var merged = [intervals[0]];
    for (var i = 1; i < intervals.length; i++) {
      var last = merged[merged.length - 1], cur = intervals[i];
      if (cur[0] <= last[1]) last[1] = Math.max(last[1], cur[1]); else merged.push(cur);
    }
    return merged.reduce(function (sum, iv) { return sum + (iv[1] - iv[0]); }, 0);
  }
  function totalTimeLabel(dayIdx) {
    var mins = dayTotalMins(dayIdx); if (!mins) return '';
    var h = Math.floor(mins / 60), m = mins % 60;
    return (h ? h + ' soat ' : '') + (m ? m + ' min' : '');
  }

  App.view('kun', {
    nav: 'kun',
    render: function (page, params) {
      ensureLoaded();
      var todayIdx = new Date().getDay();
      var sel = params.d !== undefined && params.d !== '' ? parseInt(params.d, 10) : todayIdx;
      var order = [1, 2, 3, 4, 5, 6, 0];

      page.innerHTML = '<div class="topbar" style="margin:-16px -15px 12px"><button class="icon-btn ghost" data-act="go" data-arg=\'{"v":"home"}\'><span data-icon="arrowLeft" data-icon-size="20"></span></button><h1>Kun hisobi</h1>' +
        '<button class="icon-btn ghost" data-act="kunAdd" data-arg=\'' + App.arg({ d: sel }) + '\' aria-label="Dars qo\'shish"><span data-icon="plus" data-icon-size="20"></span></button></div>' +
        '<div class="flex" style="gap:6px;overflow-x:auto;padding-bottom:4px;margin-bottom:16px">' +
        order.map(function (d) {
          var total = totalTimeLabel(d);
          return '<button class="chip-btn ' + (d === sel ? 'active' : '') + (d === todayIdx ? '' : '') + '" style="flex-shrink:0" data-act="go" data-arg=\'' + App.arg({ v: 'kun', p: { d: d } }) + '\'>' +
            DAY_SHORT[d] + (d === todayIdx ? ' •' : '') + '</button>';
        }).join('') + '</div>' +
        '<div class="between" style="margin-bottom:14px"><h2 style="font-size:16px;font-weight:700;margin:0">' + DAY_FULL[sel] + '</h2>' +
        (totalTimeLabel(sel) ? '<span class="muted" style="font-size:12.5px;font-weight:600">' + totalTimeLabel(sel) + '</span>' : '') + '</div>' +
        '<div id="kun-list"></div>';
      App.icons(page);

      var box = App.el('kun-list');
      var lessons = (SCHEDULE[sel] || []).slice().sort(function (a, b) { return a.start.localeCompare(b.start); });
      if (!lessons.length) {
        box.innerHTML = App.empty({ icon: 'calendar', title: 'Dars yo\'q', text: 'Yuqoridagi + tugmasi bilan dars qo\'shing.' });
        App.icons(box);
        return;
      }
      box.innerHTML = lessons.map(function (l) {
        var active = isLessonActive(l);
        var realIdx = (SCHEDULE[sel] || []).indexOf(l);
        return '<button class="list-row" style="opacity:' + (active ? '1' : '.5') + '" data-act="kunEdit" data-arg=\'' + App.arg({ d: sel, i: realIdx }) + '\'>' +
          '<span style="width:4px;align-self:stretch;border-radius:4px;background:' + l.color + ';flex-shrink:0"></span>' +
          '<div class="li-main"><div class="li-title">' + App.esc(l.subject) + '</div>' +
          '<div class="li-sub">' + l.start + '–' + l.end + ' · ' + App.esc(l.room) + (l.weekType && !active ? ' · keyingi hafta' : '') + '</div></div>' +
          '<span class="li-chev" data-icon="edit" data-icon-size="15"></span></button>';
      }).join('');
      App.icons(box);
    }
  });

  /* ---------- Dars qo'shish / tahrirlash ---------- */
  function lessonSheet(day, idx) {
    ensureLoaded();
    var isNew = idx === undefined || idx === null || idx < 0;
    var l = isNew ? { start: '08:30', end: '10:00', room: '', subject: '', color: COLORS[0], weekType: '' }
      : SCHEDULE[day][idx];

    var html =
      '<label class="field"><span>Fan / mashg\'ulot</span><input class="input" id="k-sub" value="' + App.esc(l.subject) + '"></label>' +
      '<div class="flex" style="gap:8px">' +
      '<label class="field" style="flex:1"><span>Boshlanish</span><input class="input" type="time" id="k-start" value="' + l.start + '"></label>' +
      '<label class="field" style="flex:1"><span>Tugash</span><input class="input" type="time" id="k-end" value="' + l.end + '"></label>' +
      '</div>' +
      '<label class="field"><span>Xona / joy</span><input class="input" id="k-room" value="' + App.esc(l.room) + '"></label>' +
      '<label class="field"><span>Kun</span><select class="input" id="k-day">' +
      [1, 2, 3, 4, 5, 6, 0].map(function (d) {
        return '<option value="' + d + '"' + (d === day ? ' selected' : '') + '>' + DAY_FULL[d] + '</option>';
      }).join('') + '</select></label>' +
      '<label class="field"><span>Takrorlanishi</span><select class="input" id="k-week">' +
      [['', 'Har hafta'], ['left', 'Faqat 1-hafta'], ['right', 'Faqat 2-hafta']].map(function (o) {
        return '<option value="' + o[0] + '"' + ((l.weekType || '') === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select></label>' +
      '<div class="list-label" style="margin-top:4px">Rang</div>' +
      '<div class="flex" id="k-colors" style="gap:8px;flex-wrap:wrap;margin-bottom:14px">' +
      COLORS.map(function (c) {
        return '<button type="button" class="k-col' + (c === l.color ? ' sel' : '') + '" data-c="' + c + '" style="background:' + c + '"></button>';
      }).join('') + '</div>' +
      (isNew ? '<button class="btn" id="k-save">Qo\'shish</button>'
        : '<div class="btn-row"><button class="btn danger" id="k-del">O\'chirish</button><button class="btn" id="k-save">Saqlash</button></div>');

    var sh = App.sheet(html, { title: isNew ? 'Yangi dars' : 'Darsni tahrirlash' });
    var color = l.color;
    sh.querySelectorAll('#k-colors .k-col').forEach(function (b) {
      b.onclick = function () {
        sh.querySelectorAll('#k-colors .k-col').forEach(function (x) { x.classList.remove('sel'); });
        b.classList.add('sel'); color = b.getAttribute('data-c');
      };
    });

    sh.querySelector('#k-save').onclick = function () {
      var subject = sh.querySelector('#k-sub').value.trim();
      if (!subject) return App.toast('Fan nomini kiriting');
      var newDay = parseInt(sh.querySelector('#k-day').value, 10);
      var item = {
        start: sh.querySelector('#k-start').value || '08:30',
        end: sh.querySelector('#k-end').value || '10:00',
        room: sh.querySelector('#k-room').value.trim(),
        subject: subject,
        color: color,
        weekType: sh.querySelector('#k-week').value
      };
      if (!item.weekType) delete item.weekType;

      if (!isNew) SCHEDULE[day].splice(idx, 1);       // eski joyidan olib tashlaymiz
      if (!SCHEDULE[newDay]) SCHEDULE[newDay] = [];
      SCHEDULE[newDay].push(item);
      saveSchedule();
      App.closeSheet();
      App.go('kun', { d: newDay });
    };

    if (!isNew) {
      sh.querySelector('#k-del').onclick = function () {
        App.confirm('"' + l.subject + '" darsi o\'chirilsinmi?', function () {
          SCHEDULE[day].splice(idx, 1); saveSchedule();
          App.closeSheet(); App.go('kun', { d: day });
        }, { danger: true, yes: 'O\'chirish' });
      };
    }
  }

  App.actions.kunAdd = function (a) { lessonSheet(parseInt(a.d, 10), -1); };
  App.actions.kunEdit = function (a) { lessonSheet(parseInt(a.d, 10), parseInt(a.i, 10)); };
})();
