/* ============================================================
   Yordamchi — yangi SPA yadrosi (router + api + ui helpers)
   ============================================================ */
(function () {
  'use strict';

  var views = {};        // name -> { title, icon, render(page, params) }
  var current = null;
  var pageEl = null;

  var App = {
    api: '/api',
    state: {},

    view: function (name, def) { views[name] = def; return App; },

    /* Ko'rinishga o'tish. params ixtiyoriy — oddiy (string/raqam) qiymatlar avtomatik
       URL query-ga yoziladi (chuqur link + sahifa yangilash uchun). */
    go: function (name, params, opts) {
      opts = opts || {};
      if (!views[name]) name = 'home';
      var v = views[name];
      current = name;
      params = params || {};
      App.state._lastParams = params;
      var qs = App._serializeParams(params);
      var hash = '#/' + name + (qs ? '?' + qs : '');
      if (!opts.silent && location.hash !== hash) {
        history.pushState({ view: name, params: params }, '', hash);
      }
      App._renderChrome(name, v);
      pageEl.scrollTop = 0;
      window.scrollTo(0, 0);
      pageEl.innerHTML = '';
      try {
        v.render(pageEl, params || {});
      } catch (e) {
        console.error('View render error', name, e);
        pageEl.innerHTML = '<div class="empty"><b>Xatolik</b><span>' + App.esc(e.message) + '</span></div>';
      }
      App.icons(pageEl);
    },

    _serializeParams: function (params) {
      var parts = [];
      Object.keys(params).forEach(function (k) {
        var v = params[k];
        if (v === null || v === undefined || typeof v === 'object') return;
        parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
      });
      return parts.join('&');
    },

    _renderChrome: function (name, v) {
      document.querySelectorAll('[data-nav]').forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('data-nav') === (v.nav || name));
      });
    },

    reload: function () { App.go(current, App.state._lastParams || {}, { silent: true }); },

    /* ---- API ---- */
    call: function (action, payload, opts) {
      opts = opts || {};
      var url = App.api + '?action=' + encodeURIComponent(action) + (opts.query ? '&' + opts.query : '');
      var init = { method: opts.method || (payload ? 'POST' : 'GET'), cache: 'no-store' };
      if (payload !== undefined && payload !== null) {
        init.body = JSON.stringify(payload);
        init.headers = { 'Content-Type': 'application/json' };
      }
      return fetch(url, init).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok || (j && j.success === false)) {
            throw new Error((j && (j.error || j.message)) || ('HTTP ' + r.status));
          }
          return j;
        });
      });
    },

    /* multipart/form-data so'rov (fayl yuklash uchun) — ba'zi action'lar (masalan sport_save_exercise) buni maxsus qabul qiladi */
    callForm: function (action, formData) {
      var url = App.api + '?action=' + encodeURIComponent(action);
      return fetch(url, { method: 'POST', body: formData, cache: 'no-store' }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok || (j && j.success === false)) {
            throw new Error((j && (j.error || j.message)) || ('HTTP ' + r.status));
          }
          return j;
        });
      });
    },

    /* ---- UI: toast ---- */
    toast: function (msg, kind) {
      var t = document.getElementById('toast');
      if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
      t.textContent = msg;
      t.classList.add('show');
      clearTimeout(App._tT);
      App._tT = setTimeout(function () { t.classList.remove('show'); }, 2600);
    },

    /* ---- UI: bottom sheet ----
       open(html, {title}) -> qaytaradi content elementi */
    sheet: function (html, opts) {
      opts = opts || {};
      App.closeSheet();
      var back = document.createElement('div'); back.className = 'sheet-back';
      var sh = document.createElement('div'); sh.className = 'sheet';
      sh.innerHTML = '<div class="sheet-grip"></div>' + (opts.title ? '<h3>' + App.esc(opts.title) + '</h3>' : '') + html;
      document.body.appendChild(back); document.body.appendChild(sh);
      App.icons(sh);
      back.onclick = App.closeSheet;
      void sh.offsetHeight; // majburiy reflow — keyingi class qo'shilishi CSS transition bilan animatsiya qilinishi uchun
      back.classList.add('show'); sh.classList.add('show');
      App._sheet = { back: back, sh: sh };
      return sh;
    },
    closeSheet: function () {
      if (!App._sheet) return;
      var s = App._sheet; App._sheet = null;
      s.sh.classList.remove('show'); s.back.classList.remove('show');
      setTimeout(function () { s.sh.remove(); s.back.remove(); }, 280);
    },

    /* ---- UI: confirm ---- */
    confirm: function (msg, onYes, opts) {
      opts = opts || {};
      var html = '<p class="muted" style="margin:0 0 18px">' + App.esc(msg) + '</p>' +
        '<div class="btn-row"><button class="btn sec" data-act="closeSheet">Bekor</button>' +
        '<button class="btn ' + (opts.danger ? 'danger' : '') + '" id="cfm-yes">' + App.esc(opts.yes || 'Ha') + '</button></div>';
      var sh = App.sheet(html, { title: opts.title || 'Tasdiqlang' });
      sh.querySelector('#cfm-yes').onclick = function () { App.closeSheet(); onYes && onYes(); };
    },

    /* ---- UI: prompt (bitta matn kiritish) ---- */
    prompt: function (opts, onOk) {
      opts = opts || {};
      var html = '<label class="field"><span>' + App.esc(opts.label || '') + '</span>' +
        (opts.multiline
          ? '<textarea class="textarea" id="pr-in" rows="4"></textarea>'
          : '<input class="input" id="pr-in" />') + '</label>' +
        '<div class="btn-row"><button class="btn sec" data-act="closeSheet">Bekor</button>' +
        '<button class="btn" id="pr-ok">' + App.esc(opts.ok || 'Saqlash') + '</button></div>';
      var sh = App.sheet(html, { title: opts.title || '' });
      var inp = sh.querySelector('#pr-in');
      if (opts.value) inp.value = opts.value;
      setTimeout(function () { inp.focus(); }, 350);
      var submit = function () {
        var v = inp.value.trim();
        if (!v && !opts.allowEmpty) { App.toast('Bo\'sh bo\'lmasin'); return; }
        App.closeSheet(); onOk && onOk(v);
      };
      sh.querySelector('#pr-ok').onclick = submit;
      if (!opts.multiline) inp.onkeydown = function (e) { if (e.key === 'Enter') submit(); };
    },

    /* ---- helpers ---- */
    esc: function (v) { var d = document.createElement('div'); d.textContent = v == null ? '' : String(v); return d.innerHTML; },
    /* --- Ilova belgisi (icon) — bitta manba, hamma joyda bir xil ---
       `data-app-icon` atributi qo'yilgan har qanday <img>/<link> avtomatik yangilanadi:
       splash, sidebar, favicon, apple-touch-icon, kirish ekrani, sozlamalar. */
    appIconSrc: function () {
      try {
        return localStorage.getItem('app_custom_icon_192') ||
               localStorage.getItem('app_custom_icon') ||
               'assets/icons/custom-app-icon-192.png';
      } catch (e) { return 'assets/icons/custom-app-icon-192.png'; }
    },
    applyAppIcon: function () {
      var src = App.appIconSrc();
      document.querySelectorAll('[data-app-icon]').forEach(function (el) {
        if (el.tagName === 'LINK') el.setAttribute('href', src);
        else el.src = src;
      });
    },

    /* Foydalanuvchi tanlagan shrift o'lchamini butun saytga qo'llaydi */
    applyFontSize: function () {
      try {
        var v = parseInt(localStorage.getItem('app_font_size') || '15', 10);
        if (isNaN(v) || v < 13 || v > 19) v = 15;
        document.body.style.fontSize = v + 'px';
      } catch (e) {}
    },

    /* data-arg='...' HTML atributi ichiga xavfsiz joylash uchun — matnda ' (apostrof) bo'lsa
       (masalan "So'z", "Bo'lim") atribut vaqtidan oldin yopilib ketmasligi uchun escape qilinadi. */
    arg: function (obj) { return JSON.stringify(obj).replace(/'/g, '&#39;'); },
    icons: function (root) { if (window.AppIcons) window.AppIcons.render(root || document); },
    el: function (id) { return document.getElementById(id); },
    coming: function (page, o) {
      o = o || {};
      page.innerHTML = '<div class="soon"><div class="soon-ic"><span data-icon="' + (o.icon || 'lock') +
        '" data-icon-size="30"></span></div><b>' + App.esc(o.title || 'Tez orada') + '</b><p>' +
        App.esc(o.text || 'Bu bo\'lim ustida ish olib borilmoqda. Tez orada tayyor bo\'ladi.') +
        '</p><span class="soon-badge">Tez orada</span></div>';
      App.icons(page);
    },
    empty: function (o) {
      o = o || {};
      return '<div class="empty"><span data-icon="' + (o.icon || 'list') + '" data-icon-size="34"></span><b>' +
        App.esc(o.title || 'Bo\'sh') + '</b><span>' + App.esc(o.text || '') + '</span></div>';
    }
  };

  /* Global action delegatsiya: data-act="name" data-arg='json' */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]');
    if (!t) return;
    var name = t.getAttribute('data-act');
    var arg = t.getAttribute('data-arg');
    if (arg) { try { arg = JSON.parse(arg); } catch (x) {} }
    if (name === 'closeSheet') { App.closeSheet(); return; }
    if (name === 'go') { App.go(arg && arg.v, arg && arg.p); return; }
    if (App.actions && App.actions[name]) { e.preventDefault(); App.actions[name](arg, t); }
  });
  App.actions = {};

  /* Orqaga tugmasi */
  window.addEventListener('popstate', function (e) {
    App.closeSheet();
    var st = e.state;
    if (st && st.view) App.go(st.view, st.params, { silent: true });
    else App.go('home', {}, { silent: true });
  });

  App.boot = function () {
    pageEl = document.getElementById('page');
    var start = 'home', params = {};
    var m = (location.hash || '').match(/^#\/([\w-]+)(?:\?(.*))?$/);
    if (m) {
      if (views[m[1]]) start = m[1];
      if (m[2]) {
        m[2].split('&').forEach(function (pair) {
          if (!pair) return;
          var eq = pair.indexOf('=');
          var k = decodeURIComponent(eq >= 0 ? pair.slice(0, eq) : pair);
          var v = eq >= 0 ? decodeURIComponent(pair.slice(eq + 1)) : '';
          params[k] = v;
        });
      }
    }
    App.go(start, params, { silent: true });
  };

  window.App = App;
})();
