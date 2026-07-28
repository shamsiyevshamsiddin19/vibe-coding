/* Faollik: qaysi kunlar ishlagansiz — seriya (streak) va haftalik ko'rinish.
   localStorage'da saqlanadi, remote-storage ko'prigi orqali serverga sinxronlanadi. */
(function () {
  'use strict';

  var KEY = 'activity_days_v1';
  var MAX_DAYS = 400; // taxminan bir yil — ro'yxat cheksiz o'smasin

  function todayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }
  function write(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX_DAYS))); } catch (e) {}
  }

  /* Bugungi kunni faol deb belgilaydi (test yakunlansa, lug'at mashqi bo'lsa va h.k.) */
  function mark() {
    var t = todayKey();
    var list = read();
    if (list.indexOf(t) === -1) { list.push(t); list.sort(); write(list); }
  }

  /* Ketma-ket necha kun ishlangani. Bugun ishlanmagan bo'lsa ham, kecha ishlangan
     bo'lsa seriya uzilmagan hisoblanadi (kun tugamagan). */
  function streak() {
    var set = {};
    read().forEach(function (d) { set[d] = true; });
    var d = new Date();
    if (!set[todayKey(d)]) {
      d.setDate(d.getDate() - 1);
      if (!set[todayKey(d)]) return 0;
    }
    var n = 0;
    while (set[todayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  /* Oxirgi 7 kun: [{label, active, today}] — bosh sahifadagi mayda ko'rsatkich uchun */
  function lastWeek() {
    var names = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];
    var set = {};
    read().forEach(function (d) { set[d] = true; });
    var out = [], now = new Date();
    for (var i = 6; i >= 0; i--) {
      var d = new Date(now);
      d.setDate(now.getDate() - i);
      var k = todayKey(d);
      out.push({ label: names[d.getDay()], active: !!set[k], today: i === 0 });
    }
    return out;
  }

  function totalDays() { return read().length; }

  window.Activity = { mark: mark, streak: streak, lastWeek: lastWeek, totalDays: totalDays };
})();
