/* Arxiv — Nusxalar (copypaste), Saytlar, Qoidalar. localStorage'da (server bilan avto-sinxron). */
(function () {
  'use strict';

  var TYPES = {
    copy: { key: 'arxiv_copypaste', label: 'Nusxalar', icon: 'copy' },
    site: { key: 'arxiv_saytlar', label: 'Saytlar', icon: 'globe' },
    rule: { key: 'arxiv_qoidalar', label: 'Qoidalar', icon: 'file' }
  };
  var state = { tab: 'copy', q: '' };

  function read(type) { try { var v = JSON.parse(localStorage.getItem(TYPES[type].key) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function write(type, arr) { localStorage.setItem(TYPES[type].key, JSON.stringify(arr)); }
  function makeId(p) { return p + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8); }

  function faviconFor(url) {
    try { return 'https://www.google.com/s2/favicons?sz=64&domain=' + new URL(url).hostname; } catch (e) { return ''; }
  }
  function siteNameFrom(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return url; }
  }

  App.view('arxiv', {
    nav: 'arxiv',
    render: function (page) {
      page.innerHTML = '<div class="topbar" style="margin:-16px -15px 12px"><button class="icon-btn ghost" data-act="go" data-arg=\'{"v":"home"}\'><span data-icon="arrowLeft" data-icon-size="20"></span></button><h1>Arxiv</h1>' +
        '<button class="icon-btn ghost" data-act="arxivBackup" aria-label="Zaxira"><span data-icon="upload" data-icon-size="18"></span></button></div>' +
        '<div class="flex" style="gap:6px;margin-bottom:16px">' +
        Object.keys(TYPES).map(function (t) {
          return '<button class="chip-btn ' + (t === state.tab ? 'active' : '') + '" style="flex:1;justify-content:center" data-act="arxivTab" data-arg=\'{"t":"' + t + '"}\'>' + TYPES[t].label + '</button>';
        }).join('') + '</div>' +
        '<input class="input" id="ax-q" placeholder="Qidirish..." style="margin-bottom:12px" value="' + App.esc(state.q || '') + '">' +
        '<div id="arxiv-list"></div>' +
        '<button class="btn" style="margin-top:14px" data-act="arxivAdd" data-arg=\'{"t":"' + state.tab + '"}\'><span data-icon="plus" data-icon-size="16"></span>Qo\'shish</button>';
      App.icons(page);
      App.el('ax-q').oninput = function () { state.q = this.value; renderList(); };
      renderList();
    }
  });

  App.actions.arxivTab = function (a) { state.tab = a.t; state.q = ''; App.reload(); };

  /* Qidiruv — barcha matnli maydonlar bo'yicha */
  function matchesQuery(it, q) {
    if (!q) return true;
    var hay = [it.title, it.text, it.name, it.url, it.desc].filter(Boolean).join(' ').toLowerCase();
    return hay.indexOf(q.toLowerCase()) >= 0;
  }

  function renderList() {
    var box = App.el('arxiv-list'); if (!box) return;
    var q = (state.q || '').trim();
    var all = read(state.tab);
    var items = all.filter(function (it) { return matchesQuery(it, q); });
    if (!items.length) {
      box.innerHTML = App.empty({
        icon: TYPES[state.tab].icon,
        title: q ? 'Topilmadi' : 'Bo\'sh',
        text: q ? '"' + q + '" bo\'yicha natija yo\'q.' : 'Pastdagi tugma bilan qo\'shing.'
      });
      App.icons(box);
      return;
    }
    if (state.tab === 'site') {
      box.innerHTML = items.map(function (it) {
        return '<div class="list-row">' +
          '<img src="' + App.esc(it.img || faviconFor(it.url)) + '" style="width:29px;height:29px;border-radius:8px;flex-shrink:0;background:var(--card-2)" onerror="this.style.visibility=\'hidden\'">' +
          '<button class="li-main li-btn" data-act="arxivOpenSite" data-arg=\'' + App.arg({ id: it.id }) + '\'>' +
          '<div class="li-title">' + App.esc(it.name) + '</div><div class="li-sub">' + App.esc(it.desc || it.url) + '</div></button>' +
          '<button class="icon-btn ghost" style="width:28px;height:28px" data-act="arxivDelete" data-arg=\'' + App.arg({ t: 'site', id: it.id }) + '\'><span data-icon="trash" data-icon-size="14"></span></button></div>';
      }).join('');
    } else {
      box.innerHTML = items.map(function (it) {
        return '<button class="list-row" data-act="arxivView" data-arg=\'' + App.arg({ t: state.tab, id: it.id }) + '\'>' +
          '<span class="li-ic" data-icon="' + TYPES[state.tab].icon + '" data-icon-size="15"></span>' +
          '<div class="li-main"><div class="li-title">' + App.esc(it.title) + '</div></div>' +
          '<span class="li-chev" data-icon="arrowLeft" data-icon-size="16" style="transform:rotate(180deg)"></span></button>';
      }).join('');
    }
    App.icons(box);
  }

  App.actions.arxivAdd = function (a) {
    if (a.t === 'site') {
      var html = '<label class="field"><span>URL</span><input class="input" id="ax-url" placeholder="https://..."></label>' +
        '<label class="field"><span>Izoh (ixtiyoriy)</span><input class="input" id="ax-desc"></label>' +
        '<button class="btn" id="ax-save">Saqlash</button>';
      var sh = App.sheet(html, { title: 'Sayt qo\'shish' });
      sh.querySelector('#ax-save').onclick = function () {
        var url = sh.querySelector('#ax-url').value.trim();
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        try { new URL(url); } catch (e) { return App.toast('URL noto\'g\'ri'); }
        var arr = read('site');
        arr.unshift({ id: makeId('site'), url: url, name: siteNameFrom(url), img: faviconFor(url), desc: sh.querySelector('#ax-desc').value.trim(), created_at: new Date().toISOString() });
        write('site', arr); App.closeSheet(); App.reload();
      };
    } else {
      var html2 = '<label class="field"><span>Sarlavha</span><input class="input" id="ax-title"></label>' +
        '<label class="field"><span>Matn</span><textarea class="textarea" id="ax-text" rows="7"></textarea></label>' +
        '<button class="btn" id="ax-save2">Saqlash</button>';
      var sh2 = App.sheet(html2, { title: a.t === 'copy' ? 'Nusxa qo\'shish' : 'Qoida qo\'shish' });
      sh2.querySelector('#ax-save2').onclick = function () {
        var text = sh2.querySelector('#ax-text').value;
        if (!text.trim()) return App.toast('Matn bo\'sh bo\'lmasin');
        var title = sh2.querySelector('#ax-title').value.trim() || (text.length > 40 ? text.slice(0, 37) + '...' : text) || 'Nomsiz';
        var arr = read(a.t);
        arr.unshift({ id: makeId(a.t), title: title, text: text, created_at: new Date().toISOString() });
        write(a.t, arr); App.closeSheet(); App.reload();
      };
    }
  };

  App.actions.arxivView = function (a) {
    var items = read(a.t), it = items.find(function (x) { return x.id === a.id; }); if (!it) return;
    var html = '<div class="card" style="white-space:pre-wrap;font-size:13.5px;line-height:1.6;margin-bottom:14px">' + App.esc(it.text) + '</div>' +
      '<div class="btn-row"><button class="btn sec" data-act="arxivCopyText" data-arg=\'' + App.arg({ text: it.text }) + '\'>Nusxalash</button>' +
      '<button class="btn danger" data-act="arxivDelete" data-arg=\'' + App.arg({ t: a.t, id: a.id }) + '\'>O\'chirish</button></div>';
    App.sheet(html, { title: it.title });
  };
  App.actions.arxivOpenSite = function (a) {
    var items = read('site'), it = items.find(function (x) { return x.id === a.id; }); if (!it) return;
    window.open(it.url, '_blank', 'noopener');
  };
  App.actions.arxivCopyText = function (a) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(a.text).then(function () { App.toast('✅ Nusxalandi'); }).catch(function () { App.toast('⚠️ Nusxalab bo\'lmadi'); });
    } else { App.toast('⚠️ Brauzer qo\'llamaydi'); }
  };
  App.actions.arxivDelete = function (a) {
    App.closeSheet();
    App.confirm('O\'chirilsinmi?', function () {
      write(a.t, read(a.t).filter(function (x) { return x.id !== a.id; }));
      App.reload();
    }, { danger: true, yes: 'O\'chirish' });
  };

  /* ---------- Zaxira: JSON eksport/import ---------- */
  App.actions.arxivBackup = function () {
    var html =
      '<button class="list-row" data-act="arxivExport"><span class="li-ic" data-icon="upload" data-icon-size="15"></span><div class="li-main"><div class="li-title">Zaxira faylini yuklab olish</div><div class="li-sub">Barcha nusxa/sayt/qoidalar JSON fayl</div></div></button>' +
      '<button class="list-row" data-act="arxivImportPick"><span class="li-ic" data-icon="refresh" data-icon-size="15"></span><div class="li-main"><div class="li-title">Fayldan tiklash</div><div class="li-sub">Zaxira JSON faylini yuklash</div></div></button>' +
      '<input type="file" id="ax-import-file" hidden accept="application/json">';
    App.sheet(html, { title: 'Zaxira' });
  };
  App.actions.arxivExport = function () {
    var payload = { copy: read('copy'), site: read('site'), rule: read('rule'), exported_at: new Date().toISOString() };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'yordamchi_arxiv_backup.json';
    document.body.appendChild(a); a.click(); a.remove();
    App.toast('✅ Yuklab olindi');
  };
  App.actions.arxivImportPick = function () { App.el('ax-import-file').click(); };
  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'ax-import-file') {
      var file = e.target.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(reader.result);
          ['copy', 'site', 'rule'].forEach(function (t) {
            if (Array.isArray(data[t])) write(t, data[t]);
          });
          App.closeSheet(); App.toast('✅ Tiklandi'); App.reload();
        } catch (err) { App.toast('⚠️ Fayl noto\'g\'ri'); }
      };
      reader.readAsText(file);
    }
  });
})();
