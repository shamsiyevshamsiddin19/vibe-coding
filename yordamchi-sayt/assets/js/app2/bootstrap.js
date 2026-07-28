/* Navigatsiya konfiguratsiyasi + ishga tushirish */
(function () {
  'use strict';

  var NAV = [
    { v: 'home', n: 'Bosh', ic: 'home' },
    { v: 'fanlar', n: 'Testlar', ic: 'book' },
    { v: 'languages', n: 'Tillar', ic: 'globe' },
    { v: 'coding', n: 'Coding', ic: 'code' },
    { v: 'sport', n: 'Sport', ic: 'trophy' },
    { v: 'boost', n: 'Boostday', ic: 'message' },
    { v: 'kun', n: 'Kun hisobi', ic: 'calendar' },
    { v: 'arxiv', n: 'Arxiv', ic: 'archive' },
    { v: 'settings', n: 'Sozlamalar', ic: 'settings' }
  ];
  var BOTTOM = ['home', 'fanlar', 'languages', 'sport', '__more__'];

  /* Foydalanuvchi yashirgan bo'limlar (Sozlamalardan boshqariladi).
     'home' va 'settings' hech qachon yashirilmaydi — aks holda qaytib bo'lmaydi. */
  function hiddenSet() {
    try {
      var v = JSON.parse(localStorage.getItem('nav_hidden_v1') || '[]');
      return Array.isArray(v) ? v.filter(function (x) { return x !== 'home' && x !== 'settings'; }) : [];
    } catch (e) { return []; }
  }
  function visibleNav() {
    var h = hiddenSet();
    return NAV.filter(function (i) { return h.indexOf(i.v) < 0; });
  }
  window.NavConfig = { all: NAV, hidden: hiddenSet };
  // Sozlamalardan bo'lim yashirilganda menyuni darhol qayta quradi
  window.NavRebuild = function () { buildSidebar(); buildBottom(); };

  function buildSidebar() {
    var el = document.getElementById('side-nav');
    el.innerHTML = visibleNav().map(function (i) {
      return '<button class="side-link" data-nav="' + i.v + '" data-act="go" data-arg=\'' + App.arg({ v: i.v }) + '\'>' +
        '<span data-icon="' + i.ic + '" data-icon-size="20"></span>' + i.n + '</button>';
    }).join('');
    App.icons(el);
  }

  function buildBottom() {
    var el = document.getElementById('botnav');
    var h = hiddenSet();
    el.innerHTML = BOTTOM.filter(function (v) { return v === '__more__' || h.indexOf(v) < 0; }).map(function (v) {
      if (v === '__more__') {
        return '<a data-nav="__more__" data-act="moreMenu"><span data-icon="menu" data-icon-size="21"></span>Yana</a>';
      }
      var i = NAV.find(function (x) { return x.v === v; });
      return '<a data-nav="' + v + '" data-act="go" data-arg=\'' + App.arg({ v: v }) + '\'>' +
        '<span data-icon="' + i.ic + '" data-icon-size="21"></span>' + i.n + '</a>';
    }).join('');
    App.icons(el);
  }

  App.actions.moreMenu = function () {
    var h = hiddenSet();
    // Pastki panelga sig'magan + yashirilmagan barcha bo'limlar
    var items = NAV.map(function (i) { return i.v; })
      .filter(function (v) { return BOTTOM.indexOf(v) < 0 && h.indexOf(v) < 0; })
      .concat(['settings']);
    items = items.filter(function (v, i) { return items.indexOf(v) === i; });
    var html = items.map(function (v) {
      var i = NAV.find(function (x) { return x.v === v; });
      return '<button class="list-row" data-act="goClose" data-arg=\'' + App.arg({ v: v }) + '\'>' +
        '<span class="li-ic" data-icon="' + i.ic + '" data-icon-size="16"></span>' +
        '<div class="li-main"><div class="li-title">' + i.n + '</div></div>' +
        '<span class="li-chev" data-icon="arrowLeft" data-icon-size="16" style="transform:rotate(180deg)"></span></button>';
    }).join('');
    App.sheet(html, { title: 'Menyu' });
  };
  App.actions.goClose = function (a) { App.closeSheet(); App.go(a.v); };

  function boot() {
    // Serverdan sinxronlangan belgini hamma joyga qo'llaymiz (yangi qurilmada ham to'g'ri chiqsin)
    App.applyAppIcon();
    buildSidebar();
    buildBottom();
    App.boot();
    var sp = document.getElementById('splash');
    if (sp) { sp.classList.add('gone'); setTimeout(function () { sp.remove(); }, 350); }
  }

  // Storage bridge tayyor bo'lgach ishga tushiramiz (localStorage server bilan sinxron)
  function afterAuth() {
    if (window.RemoteStorageBridge && window.RemoteStorageBridge.whenReady) {
      var done = false;
      var go = function () { if (done) return; done = true; boot(); };
      window.RemoteStorageBridge.whenReady().then(go).catch(go);
      setTimeout(go, 4000); // xavfsizlik: baribir ishga tushiramiz
    } else {
      boot();
    }
  }

  // Avval kirish tekshiriladi — kirilmagan bo'lsa ilova umuman ochilmaydi.
  function start() {
    // 1) Darhol: localStorage'da belgi bo'lsa qo'llaymiz (sidebar inline skriptdan keyin turadi).
    App.applyAppIcon();
    App.applyFontSize();
    // 2) Serverdan sinxronlash tugagach yana qo'llaymiz — yangi qurilmada localStorage
    //    dastlab bo'sh bo'ladi, belgi faqat shundan keyin paydo bo'ladi. Bu kirish
    //    ekranida ham to'g'ri chiqishi uchun auth'dan mustaqil ishlaydi.
    if (window.RemoteStorageBridge && window.RemoteStorageBridge.whenReady) {
      window.RemoteStorageBridge.whenReady()
        .then(function () { App.applyAppIcon(); App.applyFontSize(); })
        .catch(function () {});
    }
    if (window.Auth && window.Auth.gate) window.Auth.gate(afterAuth);
    else afterAuth();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  // Service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('service-worker.js?v=20260727n1').catch(function () {});
    });
  }
})();
