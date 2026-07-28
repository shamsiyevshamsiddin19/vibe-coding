/* Sozlamalar — grouped-list uslubi (iOS/Telegram kabi), cardlarsiz */
(function () {
  'use strict';
  function ls(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function dls() { try { return JSON.parse(ls('home_deadlines_v1', '[]')) || []; } catch (e) { return []; } }
  function saveDls(a) { localStorage.setItem('home_deadlines_v1', JSON.stringify(a)); }
  var THEME_LABEL = { auto: 'Avto', dark: 'Qorong\'u', light: 'Yorug\'' };

  function resizeImage(file, max, cb) {
    var r = new FileReader();
    r.onload = function () {
      var img = new Image();
      img.onload = function () {
        var w = img.width, h = img.height, sc = Math.min(1, max / Math.max(w, h));
        var c = document.createElement('canvas'); c.width = Math.round(w * sc); c.height = Math.round(h * sc);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.85));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  }

  App.view('settings', {
    nav: 'settings',
    render: function (page) {
      var theme = ls('app_theme', 'auto');
      var avatar = ls('user_avatar', '') || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(ls('user_name', 'Yordamchi')) + '&background=3b91f0&color=fff&size=180';
      var icon = App.appIconSrc();

      page.innerHTML =
        '<div class="topbar" style="margin:-16px -15px 6px"><button class="icon-btn ghost" data-act="go" data-arg=\'{"v":"home"}\'><span data-icon="arrowLeft" data-icon-size="20"></span></button><h1>Sozlamalar</h1></div>' +

        '<button class="list-row" data-act="editProfile" style="padding:10px 1px">' +
        '<img src="' + avatar + '" style="width:46px;height:46px;border-radius:50%;object-fit:cover;flex-shrink:0">' +
        '<div class="li-main"><div class="li-title">' + App.esc(ls('user_name', 'Ism kiritilmagan')) + '</div>' +
        '<div class="li-sub">' + App.esc(ls('user_bio', 'Bio yo\'q')) + '</div></div>' +
        '<span class="li-chev" data-icon="arrowLeft" data-icon-size="16" style="transform:rotate(180deg)"></span></button>' +

        '<div class="list-label">Ko\'rinish</div>' +
        '<div class="list-row" style="border-bottom:none;padding:9px 1px 15px">' +
        '<div class="seg" style="width:100%">' +
        Object.keys(THEME_LABEL).map(function (v) {
          return '<button class="' + (theme === v ? 'active' : '') + '" data-act="setTheme" data-arg=\'' + App.arg({ v: v }) + '\'>' + THEME_LABEL[v] + '</button>';
        }).join('') + '</div></div>' +
        '<div class="list-row" style="border-bottom:none;padding:9px 1px 15px;flex-direction:column;align-items:stretch;gap:8px">' +
        '<div class="between"><span style="font-size:14.5px;font-weight:600">Shrift o\'lchami</span>' +
        '<span class="muted mono" id="fs-val" style="font-size:12.5px">' + ls('app_font_size', '15') + 'px</span></div>' +
        '<input type="range" id="fs-range" min="13" max="19" step="1" value="' + ls('app_font_size', '15') + '" style="width:100%;accent-color:var(--accent)">' +
        '</div>' +

        '<button class="list-row" data-act="pickIcon">' +
        '<img data-app-icon src="' + icon + '" style="width:34px;height:34px;border-radius:10px;object-fit:cover;flex-shrink:0">' +
        '<div class="li-main"><div class="li-title">Ilova belgisi</div><div class="li-sub">Bosh ekran yorlig\'i uchun</div></div>' +
        '<span class="li-chev" data-icon="arrowLeft" data-icon-size="16" style="transform:rotate(180deg)"></span></button>' +

        '<div class="between list-label"><span>Deadlinelar</span>' +
        '<button data-act="addDeadline" style="background:none;border:none;color:var(--accent);font-size:12px;font-weight:700;text-transform:none;letter-spacing:0">+ Qo\'shish</button></div>' +
        '<div id="dl-list"></div>' +

        '<button class="list-row" data-act="navConfig">' +
        '<span class="li-ic" data-icon="menu" data-icon-size="15"></span>' +
        '<div class="li-main"><div class="li-title">Menyu bo\'limlari</div>' +
        '<div class="li-sub">Kerak bo\'lmaganini yashirish</div></div>' +
        '<span class="li-chev" data-icon="arrowLeft" data-icon-size="16" style="transform:rotate(180deg)"></span></button>' +

        '<div class="list-label">Ma\'lumotlar</div>' +
        '<button class="list-row" data-act="exportAll">' +
        '<span class="li-ic" data-icon="upload" data-icon-size="15" style="transform:rotate(180deg)"></span>' +
        '<div class="li-main"><div class="li-title">Zaxira nusxa olish</div>' +
        '<div class="li-sub">Maqsad, lug\'at, test va sozlamalar — JSON fayl</div></div>' +
        '<span class="li-chev" data-icon="arrowLeft" data-icon-size="16" style="transform:rotate(180deg)"></span></button>' +

        '<div class="list-label">Xavfsizlik</div>' +
        '<button class="list-row" data-act="logout" style="color:var(--danger)">' +
        '<span class="li-ic" style="background:var(--danger-soft);color:var(--danger)" data-icon="lock" data-icon-size="15"></span>' +
        '<div class="li-main"><div class="li-title" style="color:var(--danger)">Tizimdan chiqish</div></div></button>' +

        '<p class="muted" style="text-align:center;font-size:12px;margin:34px 0 8px">Yordamchi</p>' +
        '<input type="file" id="av-file" hidden accept="image/*"><input type="file" id="icon-file" hidden accept="image/*">';

      App.icons(page);
      renderDeadlines();

      App.el('fs-range').oninput = function () {
        localStorage.setItem('app_font_size', this.value);
        App.el('fs-val').textContent = this.value + 'px';
        App.applyFontSize();
      };

      App.el('av-file').onchange = function (e) {
        var f = e.target.files[0]; if (!f) return;
        resizeImage(f, 320, function (data) { localStorage.setItem('user_avatar', data); App.toast('✅ Rasm saqlandi'); App.reload(); });
      };
      App.el('icon-file').onchange = function (e) {
        var f = e.target.files[0]; if (!f) return;
        resizeImage(f, 512, function (data) {
          localStorage.setItem('app_custom_icon', data);
          // 192px nusxa tayyor bo'lgach hamma joyni (splash, sidebar, favicon, kirish ekrani) yangilaymiz
          resizeImage(f, 192, function (d192) {
            localStorage.setItem('app_custom_icon_192', d192);
            App.applyAppIcon();
            // Serverga ham yozamiz: haqiqiy PNG fayl + manifest yangilanadi. Bu telefon
            // bosh ekraniga yorliq QAYTA qo'shilganda yangi belgi tushishi uchun kerak
            // (Android eski yorliqning belgisini keshda saqlaydi, o'zi yangilamaydi).
            App.call('save_app_icon', { icon: data })
              .then(function () { App.toast('✅ Belgi yangilandi'); })
              .catch(function (err) { App.toast('⚠️ Serverga saqlanmadi: ' + err.message); });
            App.reload();
          });
        });
      };
    }
  });

  App.actions.editProfile = function () {
    var html =
      '<div class="flex" style="margin-bottom:16px"><img id="pf-av" src="' + (ls('user_avatar', '') || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(ls('user_name', 'Y')) + '&background=3b91f0&color=fff') + '" style="width:56px;height:56px;border-radius:50%;object-fit:cover">' +
      '<button class="btn sec sm" data-act="pickAvatar"><span data-icon="camera" data-icon-size="15"></span>Rasm</button></div>' +
      '<label class="field"><span>Ism</span><input class="input" id="set-name" value="' + App.esc(ls('user_name', '')) + '" placeholder="Ismingiz"></label>' +
      '<label class="field"><span>Shior (bio)</span><input class="input" id="set-bio" value="' + App.esc(ls('user_bio', '')) + '" placeholder="Maqsad sari olg\'a!"></label>' +
      '<button class="btn" data-act="saveProfile">Saqlash</button>';
    App.sheet(html, { title: 'Profil' });
  };
  App.actions.pickAvatar = function () { App.el('av-file').click(); };
  App.actions.pickIcon = function () { App.el('icon-file').click(); };
  App.actions.saveProfile = function () {
    localStorage.setItem('user_name', App.el('set-name').value.trim());
    var bio = App.el('set-bio').value.trim();
    if (bio) localStorage.setItem('user_bio', bio); else localStorage.removeItem('user_bio');
    App.closeSheet(); App.toast('✅ Saqlandi'); App.reload();
  };

  /* To'liq zaxira: serverdagi asosiy ma'lumot + brauzerdagi sozlamalar bitta JSON faylga */
  App.actions.exportAll = function () {
    App.toast('Zaxira tayyorlanmoqda...');
    var dump = {
      version: 1,
      olingan: new Date().toISOString(),
      manba: location.origin,
      local: {},
      server: {}
    };
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        dump.local[k] = localStorage.getItem(k);
      }
    } catch (e) {}

    // Serverdan: maqsadlar, lug'atlar (2 til), test tuzilishi va natijalar tarixi
    var jobs = [
      App.call('get_data', null, { query: 'db=Global_Data' }).then(function (j) { dump.server.goals = j; }),
      App.call('get_dict_data', null, { query: 'lang=english' }).then(function (j) { dump.server.dict_english = j; }),
      App.call('get_dict_data', null, { query: 'lang=russian' }).then(function (j) { dump.server.dict_russian = j; }),
      App.call('get_structure').then(function (j) { dump.server.quiz_structure = j; }),
      App.call('get_quiz_results').then(function (j) { dump.server.quiz_results = j; }),
      App.call('get_mistakes', null, { query: 'lang=english' }).then(function (j) { dump.server.mistakes_english = j; }),
      App.call('get_mistakes', null, { query: 'lang=russian' }).then(function (j) { dump.server.mistakes_russian = j; })
    ].map(function (p) { return p.catch(function () {}); }); // bittasi ishlamasa ham qolgani olinsin

    Promise.all(jobs).then(function () {
      var blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      var d = new Date();
      a.href = url;
      a.download = 'yordamchi-zaxira-' + d.getFullYear() + '-' +
        ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + '.json';
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
      App.toast('✅ Zaxira yuklab olindi');
    });
  };

  /* Menyu bo'limlarini ko'rsatish/yashirish */
  App.actions.navConfig = function () {
    if (!window.NavConfig) return;
    var hidden = NavConfig.hidden();
    var html =
      '<p class="muted" style="font-size:12.5px;margin:0 0 12px">Yashirilgan bo\'limlar menyudan olib tashlanadi. "Bosh" va "Sozlamalar" doim qoladi.</p>' +
      NavConfig.all.filter(function (i) { return i.v !== 'home' && i.v !== 'settings'; }).map(function (i) {
        var on = hidden.indexOf(i.v) < 0;
        return '<div class="list-row"><span class="li-ic" data-icon="' + i.ic + '" data-icon-size="15"></span>' +
          '<div class="li-main"><div class="li-title">' + i.n + '</div></div>' +
          '<button class="nv-tog' + (on ? ' on' : '') + '" data-v="' + i.v + '">' + (on ? 'Ko\'rinadi' : 'Yashirilgan') + '</button></div>';
      }).join('');
    var sh = App.sheet(html, { title: 'Menyu bo\'limlari' });
    sh.querySelectorAll('.nv-tog').forEach(function (b) {
      b.onclick = function () {
        var v = b.getAttribute('data-v');
        var cur = NavConfig.hidden();
        var i = cur.indexOf(v);
        if (i < 0) cur.push(v); else cur.splice(i, 1);
        localStorage.setItem('nav_hidden_v1', JSON.stringify(cur));
        var on = cur.indexOf(v) < 0;
        b.classList.toggle('on', on);
        b.textContent = on ? 'Ko\'rinadi' : 'Yashirilgan';
        if (window.NavRebuild) NavRebuild();
      };
    });
  };

  App.actions.setTheme = function (a) {
    if (a.v === 'auto') { document.documentElement.removeAttribute('data-theme'); localStorage.setItem('app_theme', 'auto'); }
    else { document.documentElement.setAttribute('data-theme', a.v); localStorage.setItem('app_theme', a.v); }
    App.reload();
  };

  App.actions.addDeadline = function () {
    var html =
      '<label class="field"><span>Nomi</span><input class="input" id="dl-n" placeholder="Masalan: IELTS"></label>' +
      '<label class="field"><span>Boshlanish</span><input class="input" type="date" id="dl-s"></label>' +
      '<label class="field"><span>Tugash</span><input class="input" type="date" id="dl-e"></label>' +
      '<button class="btn" id="dl-save">Qo\'shish</button>';
    var sh = App.sheet(html, { title: 'Yangi deadline' });
    sh.querySelector('#dl-save').onclick = function () {
      var n = sh.querySelector('#dl-n').value.trim(), s = sh.querySelector('#dl-s').value, e = sh.querySelector('#dl-e').value;
      if (!n || !e) return App.toast('Nomi va tugash sanasi kerak');
      var arr = dls(); arr.push({ id: 'dl_' + Date.now(), name: n, start: s, end: e, status: '' }); saveDls(arr);
      App.closeSheet(); App.reload();
    };
  };
  App.actions.delDeadline = function (a) {
    saveDls(dls().filter(function (d) { return d.id !== a.id; })); App.reload();
  };

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

  function renderDeadlines() {
    var box = App.el('dl-list'); if (!box) return;
    var arr = dls();
    if (!arr.length) { box.innerHTML = '<p class="muted" style="font-size:13px;margin:0 1px 4px">Deadline yo\'q</p>'; return; }
    box.innerHTML = arr.map(function (d) {
      return '<div class="list-row"><div class="li-ic" style="background:var(--warn);color:#3a2a08"><span data-icon="calendar" data-icon-size="15"></span></div>' +
        '<div class="li-main"><div class="li-title">' + App.esc(d.name) + '</div><div class="li-sub dl-count" id="dlc-' + d.id + '"></div></div>' +
        '<button class="icon-btn ghost" style="width:28px;height:28px" data-act="delDeadline" data-arg=\'' + App.arg({ id: d.id }) + '\'><span data-icon="trash" data-icon-size="14"></span></button></div>';
    }).join('');
    App.icons(box);
    arr.forEach(function (d) { startCountdown(d.id, new Date(d.end)); });
  }
})();
