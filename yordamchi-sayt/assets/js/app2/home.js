/* Bosh sahifa — modern, flat, desktopda ikki ustunli dashboard */
(function () {
  'use strict';

  var UZ_MONTH_SHORT = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
  function todayLabel() {
    var d = new Date();
    return d.getDate() + '-' + UZ_MONTH_SHORT[d.getMonth()];
  }

  function ls(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function greeting() {
    var h = new Date().getHours();
    if (h < 6) return 'Xayrli tun'; if (h < 12) return 'Xayrli tong';
    if (h < 18) return 'Xayrli kun'; return 'Xayrli kech';
  }
  function dls() { try { return JSON.parse(ls('home_deadlines_v1', '[]')) || []; } catch (e) { return []; } }
  function upcomingDeadlines() {
    var now = new Date(); now.setHours(0, 0, 0, 0);
    return dls().filter(function (d) { return d.end && d.status !== 'done'; })
      .map(function (d) { var e = new Date(d.end); return { id: d.id, name: d.name, end: d.end, days: Math.ceil((e - now) / 86400000) }; })
      .filter(function (d) { return d.days >= 0; }).sort(function (a, b) { return a.days - b.days; });
  }

  App.view('home', {
    nav: 'home',
    render: function (page) {
      var avatar = ls('user_avatar', '') || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(ls('user_name', 'Yordamchi')) + '&background=3b91f0&color=fff&size=180';
      var name = App.esc(ls('user_name', 'Foydalanuvchi'));
      var bio = App.esc(ls('user_bio', 'Maqsad sari olg\'a!'));
      var upcoming = upcomingDeadlines();
      var dl = upcoming[0] || null;

      page.innerHTML =
        '<div style="padding:2px 0 18px">' +
        '<span class="muted" style="font-size:13px;font-weight:600">' + greeting() + '</span>' +
        '</div>' +

        '<div class="dash">' +
        '<div class="dash-main">' +
        '<div class="hero"><img src="' + avatar + '" alt=""><div><b>' + name + '</b><span>' + bio + '</span></div></div>' +
        streakHtml() +
        '<div class="stat-strip" id="home-stats"></div>' +
        '<div class="between" style="margin-top:6px"><h2 style="font-size:16px;font-weight:700;margin:0">Maqsadlar</h2>' +
        '<button class="icon-btn ghost" data-act="goalAdd" aria-label="Maqsad qo\'shish" style="width:34px;height:34px"><span data-icon="plus" data-icon-size="18"></span></button></div>' +
        '<div id="home-goals" style="margin-top:6px"></div>' +
        '</div>' +

        '<div class="dash-side">' +
        '<div class="between list-label" style="margin-top:0"><span>Deadlinelar</span>' +
        '<button data-act="addDeadline" style="background:none;border:none;color:var(--accent);font-size:12px;font-weight:700;text-transform:none;letter-spacing:0">+ Qo\'shish</button></div>' +
        '<div id="home-deadlines"></div>' +
        '</div>' +
        '</div>';

      App.icons(page);

      var g = Goals.data.loaded ? Goals.stats() : { done: 0, total: 0, pct: 0 };
      renderStats(g, dl);
      renderDeadlines(upcoming);

      var gbox = document.getElementById('home-goals');
      Goals.renderInto(gbox);
      if (!Goals.data.loaded) {
        Goals.load().then(function () {
          if (App.el('home-goals')) Goals.renderInto(App.el('home-goals'));
          if (App.el('home-stats')) renderStats(Goals.stats(), upcomingDeadlines()[0] || null);
        });
      }
    }
  });

  /* Faollik seriyasi — "N kun ketma-ket" + oxirgi 7 kun nuqtalari */
  function streakHtml() {
    if (!window.Activity) return '';
    var n = Activity.streak();
    var week = Activity.lastWeek();
    var msg = n === 0 ? 'Bugun boshlang' : n + ' kun ketma-ket';
    return '<div class="streak">' +
      '<div class="streak-main"><span class="streak-n">' + (n || '·') + '</span>' +
      '<span class="streak-t">' + App.esc(msg) + '</span></div>' +
      '<div class="streak-week">' + week.map(function (d) {
        return '<span class="sd' + (d.active ? ' on' : '') + (d.today ? ' now' : '') + '" title="' + d.label + '">' +
          '<i></i><b>' + d.label + '</b></span>';
      }).join('') + '</div></div>';
  }

  function renderStats(g, dl) {
    var box = App.el('home-stats'); if (!box) return;
    box.innerHTML =
      s(g.done + '/' + g.total, 'Maqsadlar') +
      s(g.pct + '%', 'Bajarilgan') +
      s(dl ? dl.days : '—', dl ? trunc(dl.name) : 'Deadline yo\'q') +
      s(todayLabel(), 'Bugun');
  }
  function s(n, l) { return '<div class="s"><div class="n">' + App.esc(n) + '</div><div class="l">' + App.esc(l) + '</div></div>'; }
  function trunc(v) { v = String(v || ''); return v.length > 11 ? v.slice(0, 10) + '…' : v; }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function countdownText(target) {
    var now = new Date();
    if (target <= now) return 'Tugadi';
    var y = target.getFullYear() - now.getFullYear();
    var m = target.getMonth() - now.getMonth();
    var d = target.getDate() - now.getDate();
    var h = target.getHours() - now.getHours();
    var mi = target.getMinutes() - now.getMinutes();
    var s = target.getSeconds() - now.getSeconds();
    if (s < 0) { s += 60; mi--; }
    if (mi < 0) { mi += 60; h--; }
    if (h < 0) { h += 24; d--; }
    if (d < 0) { d += new Date(target.getFullYear(), target.getMonth(), 0).getDate(); m--; }
    if (m < 0) { m += 12; y--; }
    return pad2(y) + ':' + pad2(m) + ':' + pad2(d) + ' ' + pad2(h) + ':' + pad2(mi) + ':' + pad2(s);
  }
  function startCountdown(id, target) {
    function tick() {
      var el = document.getElementById('dlc-' + id);
      if (!el) { clearInterval(timer); return; }
      el.textContent = countdownText(target);
    }
    var timer = setInterval(tick, 1000);
    tick();
  }

  function renderDeadlines(upcoming) {
    var box = App.el('home-deadlines'); if (!box) return;
    if (!upcoming.length) {
      box.innerHTML = '<p class="muted" style="font-size:13px;margin:2px 1px">Deadline yo\'q</p>';
      return;
    }
    var list = upcoming.slice(0, 6);
    box.innerHTML = list.map(function (d) {
      return '<div class="list-row"><div class="li-ic" style="background:var(--warn);color:#3a2a08"><span data-icon="calendar" data-icon-size="15"></span></div>' +
        '<div class="li-main"><div class="li-title">' + App.esc(d.name) + '</div><div class="li-sub dl-count" id="dlc-' + d.id + '"></div></div></div>';
    }).join('');
    App.icons(box);
    list.forEach(function (d) { startCountdown(d.id, new Date(d.end)); });
  }
})();
