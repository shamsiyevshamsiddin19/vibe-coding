/* Sport — mashqlar (kategoriya bo'yicha), og'irlik/set/takror, media (rasm/video/YouTube link) */
(function () {
  'use strict';

  var CATS = [
    { id: 'turnik', n: 'Turnik', c: 'var(--accent)', ic: 'spTurnik' },
    { id: 'brus', n: 'Brus', c: 'var(--purple)', ic: 'spBrus' },
    { id: 'ajimaniya', n: 'Ajimaniya', c: 'var(--teal)', ic: 'spPush' },
    { id: 'full', n: 'Full Body', c: 'var(--coral)', ic: 'spBody' },
    { id: 'grud', n: 'Ko\'krak', c: 'var(--warn)', ic: 'spChest' },
    { id: 'bitseps', n: 'Bitseps', c: 'var(--success)', ic: 'spBiceps' },
    { id: 'triseps', n: 'Triseps', c: 'var(--danger)', ic: 'spTriceps' },
    { id: 'orqa', n: 'Orqa', c: 'var(--accent)', ic: 'spBack' },
    { id: 'yelka', n: 'Yelka', c: 'var(--purple)', ic: 'spShoulder' },
    { id: 'oyoq', n: 'Oyoq', c: 'var(--teal)', ic: 'spLegs' },
    { id: 'kardio', n: 'Kardio', c: 'var(--coral)', ic: 'spCardio' },
    { id: 'armwresling', n: 'Armrestling', c: 'var(--warn)', ic: 'spArm' }
  ];
  function catInfo(id) {
    return CATS.find(function (c) { return c.id === id; }) || { id: id, n: id, c: 'var(--hint)', ic: 'trophy' };
  }

  /* Mashq belgisi: rasmi bo'lsa — o'sha rasm, bo'lmasa kategoriya belgisi */
  function exerciseThumb(e, info) {
    var img = (e.media || []).find(function (m) { return /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(m); });
    if (img) {
      var src = /^https?:\/\//i.test(img) ? img : '/' + String(img).replace(/^\/+/, '');
      return '<img class="ex-thumb" src="' + App.esc(src) + '" alt="" loading="lazy">';
    }
    return '<span class="li-ic" style="background:color-mix(in srgb,' + info.c + ' 16%, transparent);color:' + info.c +
      '"><span data-icon="' + info.ic + '" data-icon-size="16"></span></span>';
  }

  var S = { data: null };
  function loadAll(force) {
    if (S.data && !force) return Promise.resolve(S.data);
    return App.call('sport_get_all').then(function (j) { S.data = j.data || {}; return S.data; });
  }
  function topbar(title, backView, backParams) {
    return '<div class="topbar" style="margin:-16px -15px 12px">' +
      '<button class="icon-btn ghost" data-act="go" data-arg=\'' + App.arg({ v: backView, p: backParams || {} }) + '\'><span data-icon="arrowLeft" data-icon-size="20"></span></button>' +
      '<h1>' + App.esc(title) + '</h1></div>';
  }

  /* =========================================================
     VIEW: sport — kategoriyalar
     ========================================================= */
  App.view('sport', {
    nav: 'sport',
    render: function (page) {
      var logs = sportLog();
      page.innerHTML = '<div class="topbar" style="margin:-16px -15px 12px"><h1>Sport</h1></div>' +
        '<button class="list-row" data-act="go" data-arg=\'' + App.arg({ v: 'sport_history' }) + '\' style="margin-bottom:12px">' +
        '<span class="li-ic" style="background:var(--accent-soft);color:var(--accent)"><span data-icon="clock" data-icon-size="15"></span></span>' +
        '<div class="li-main"><div class="li-title">Mashg\'ulot tarixi</div>' +
        '<div class="li-sub">' + (logs.length ? logs.length + ' ta yozuv · oxirgisi ' + logs[logs.length - 1].d : 'Hali yozuv yo\'q') + '</div></div>' +
        '<span class="li-chev" data-icon="arrowLeft" data-icon-size="16" style="transform:rotate(180deg)"></span></button>' +
        '<div id="sport-cats"><div class="load-wrap"><div class="spinner"></div></div></div>';
      App.icons(page);
      loadAll().then(function (data) {
        var box = App.el('sport-cats'); if (!box) return;
        box.innerHTML = CATS.map(function (c) {
          var n = (data[c.id] || []).length;
          return '<button class="list-row" data-act="go" data-arg=\'' + App.arg({ v: 'sport_cat', p: { cat: c.id } }) + '\'>' +
            '<span class="li-ic" style="background:color-mix(in srgb,' + c.c + ' 16%, transparent);color:' + c.c + '"><span data-icon="' + c.ic + '" data-icon-size="17"></span></span>' +
            '<div class="li-main"><div class="li-title">' + c.n + '</div></div>' +
            '<span class="li-val">' + n + '</span>' +
            '<span class="li-chev" data-icon="arrowLeft" data-icon-size="16" style="transform:rotate(180deg)"></span></button>';
        }).join('');
        App.icons(box);
      });
    }
  });

  /* =========================================================
     VIEW: sport_cat — kategoriya ichidagi mashqlar
     ========================================================= */
  App.view('sport_cat', {
    nav: 'sport',
    render: function (page, params) {
      var cat = params.cat || '';
      var info = catInfo(cat);
      page.innerHTML = topbar(info.n, 'sport') +
        '<button class="btn sec" data-act="restTimer" style="margin-bottom:14px"><span data-icon="clock" data-icon-size="16"></span>Dam olish taymeri</button>' +
        '<div id="ex-list"><div class="load-wrap"><div class="spinner"></div></div></div>' +
        '<button class="btn" style="margin-top:14px" data-act="exerciseAdd" data-arg=\'' + App.arg({ cat: cat }) + '\'><span data-icon="plus" data-icon-size="16"></span>Mashq qo\'shish</button>';
      App.icons(page);
      loadAll().then(function (data) {
        var box = App.el('ex-list'); if (!box) return;
        var list = data[cat] || [];
        if (!list.length) { box.innerHTML = App.empty({ icon: 'trophy', title: 'Mashq yo\'q', text: 'Pastdagi tugma bilan qo\'shing.' }); return; }
        box.innerHTML = list.map(function (e) {
          var sub = exerciseSub(e) + (e.media && e.media.length ? ' · ' + e.media.length + ' media' : '');
          var done = loggedToday(e.id);
          return '<div class="list-row">' +
            exerciseThumb(e, info) +
            '<button class="li-main" style="background:none;border:none;text-align:left;padding:0" data-act="go" data-arg=\'' +
            App.arg({ v: 'sport_exercise', p: { cat: cat, id: e.id } }) + '\'>' +
            '<div class="li-title">' + App.esc(e.name) + '</div>' + (sub.trim() ? '<div class="li-sub">' + App.esc(sub) + '</div>' : '') + '</button>' +
            '<button class="icon-btn ghost sp-log' + (done ? ' done' : '') + '" data-act="sportLog" data-arg=\'' +
            App.arg({ cat: cat, id: e.id }) + '\' title="Bugun bajardim"><span data-icon="check" data-icon-size="17"></span></button>' +
            '</div>';
        }).join('');
        App.icons(box);
      });
    }
  });

  /* =========================================================
     VIEW: sport_exercise — bitta mashqning to'liq sahifasi
     ========================================================= */
  App.view('sport_exercise', {
    nav: 'sport',
    render: function (page, params) {
      var cat = params.cat || '', id = params.id;
      page.innerHTML = '<div id="ex-view"><div class="load-wrap"><div class="spinner"></div></div></div>';
      loadAll().then(function (data) {
        var e = (data[cat] || []).find(function (x) { return String(x.id) === String(id); });
        if (!e) { App.toast('Mashq topilmadi'); App.go('sport_cat', { cat: cat }); return; }
        renderExerciseView(page, cat, e);
      });
    }
  });

  function renderExerciseView(page, cat, e) {
    var t = PTYPE[effType(e)] || PTYPE.weight;
    var tgt = todayTarget(e);
    var steps = progressSteps(e);
    var base = t.field === 'weight' ? (e.weight || 0) : (e.reps || 0);
    var done = loggedToday(e.id);
    var auto = e.progress_mode !== 'manual' && e.increase;

    // Media galereyasi
    var media = (e.media || []).map(function (m) {
      var src = '/' + String(m).replace(/^\/+/, '');
      if (/^https?:\/\//i.test(m)) src = m;
      if (/\.(jpg|jpeg|png|gif|webp|avif)$/i.test(m)) {
        return '<img class="ex-media" src="' + App.esc(src) + '" alt="" loading="lazy">';
      }
      if (/youtube\.com|youtu\.be/i.test(m)) {
        return '<a class="ex-media ex-link" href="' + App.esc(m) + '" target="_blank" rel="noopener">' +
          '<span data-icon="play" data-icon-size="22"></span><span>Video</span></a>';
      }
      return '<video class="ex-media" src="' + App.esc(src) + '" controls preload="metadata"></video>';
    }).join('');

    page.innerHTML =
      '<div class="topbar" style="margin:-16px -15px 12px">' +
      '<button class="icon-btn ghost" data-act="go" data-arg=\'' + App.arg({ v: 'sport_cat', p: { cat: cat } }) + '\'><span data-icon="arrowLeft" data-icon-size="20"></span></button>' +
      '<h1>' + App.esc(e.name) + '</h1>' +
      '<button class="icon-btn ghost" id="exv-edit" aria-label="Tahrirlash"><span data-icon="edit" data-icon-size="18"></span></button></div>' +

      // Bugungi maqsad — asosiy blok
      '<div class="ex-hero">' +
      '<span class="ex-hero-ic" style="background:color-mix(in srgb,' + catInfo(cat).c + ' 18%, transparent);color:' + catInfo(cat).c + '">' +
      '<span data-icon="' + catInfo(cat).ic + '" data-icon-size="24"></span></span>' +
      '<div class="ex-hero-lbl">Bugungi maqsad</div>' +
      '<div class="ex-hero-val">' + tgt.value + '<span>' + tgt.unit + '</span></div>' +
      (e.sets ? '<div class="ex-hero-sub">' + e.sets + ' set' + (t.field === 'weight' && e.reps ? ' × ' + e.reps + ' takror' : '') + '</div>' : '') +
      '</div>' +

      // O'sish ma'lumoti
      '<div class="stat-strip" style="margin:16px 0">' +
      '<div class="s"><div class="n">' + base + '<span style="font-size:13px">' + tgt.unit + '</span></div><div class="l">Boshlang\'ich</div></div>' +
      '<div class="s"><div class="n" style="color:var(--success)">' + (e.increase ? '+' + e.increase : '—') + '</div><div class="l">Ortirish</div></div>' +
      '<div class="s"><div class="n">' + steps + '</div><div class="l">Marta oshgan</div></div>' +
      '</div>' +

      '<div class="list-row"><span class="li-ic" data-icon="refresh" data-icon-size="15"></span>' +
      '<div class="li-main"><div class="li-title">' + App.esc(t.n.split(' (')[0]) + ' oshadi</div>' +
      '<div class="li-sub">' + App.esc(PMODE[e.progress_mode] || '—') + (auto ? '' : ' · avtomatik emas') + '</div></div></div>' +
      (e.start_date
        ? '<div class="list-row"><span class="li-ic" data-icon="calendar" data-icon-size="15"></span>' +
          '<div class="li-main"><div class="li-title">Boshlangan</div><div class="li-sub">' + App.esc(e.start_date) + '</div></div></div>'
        : '') +

      (e.desc ? '<div class="list-label">Tavsif</div><p style="font-size:14px;line-height:1.6;margin:0 1px 8px">' + App.esc(e.desc) + '</p>' : '') +
      (media ? '<div class="list-label">Media</div><div class="ex-media-grid">' + media + '</div>' : '') +

      '<button class="btn" id="exv-done" style="margin-top:20px;background:' + (done ? 'var(--card)' : 'var(--success)') +
      ';color:' + (done ? 'var(--text)' : '#fff') + (done ? ';border:1px solid var(--border)' : '') + '">' +
      '<span data-icon="check" data-icon-size="17"></span>' + (done ? 'Bugun bajarilgan — bekor qilish' : 'Bugun bajardim') + '</button>' +
      '<button class="btn sec" id="exv-rest" style="margin-top:10px"><span data-icon="clock" data-icon-size="16"></span>Dam olish taymeri</button>';

    App.icons(page);
    App.el('exv-edit').onclick = function () {
      var sh = App.sheet(exerciseFormHtml(e), { title: e.name });
      bindExerciseForm(sh, cat, e);
    };
    App.el('exv-done').onclick = function () { App.actions.sportLog({ cat: cat, id: e.id }); };
    App.el('exv-rest').onclick = function () { App.actions.restTimer(); };
  }

  /* =========================================================
     O'sish tizimi: nima oshadi (og'irlik/takror/vaqt) va qachon oshadi
     ========================================================= */
  var PTYPE = {
    weight: { n: 'Og\'irlik (kg)', unit: 'kg', field: 'weight', step: '0.5' },
    reps:   { n: 'Takror (soni)',  unit: 'ta', field: 'reps',   step: '1' },
    time:   { n: 'Vaqt (soniya)',  unit: 's',  field: 'reps',   step: '1' }
  };
  var PMODE = {
    daily:     'Har kuni',
    even:      'Juft kunlari',
    odd:       'Toq kunlari',
    alternate: 'Kun ora',
    manual:    'Qo\'lda (avtomatik emas)'
  };

  function dstr(d) {
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  /* Eski (tur belgilanmagan) mashqlar uchun turni aqlli topish:
     og'irligi 0 bo'lib takrori bor bo'lsa — bu tana og'irligi bilan bajariladigan
     mashq (turnik/brus), ya'ni takror oshadi. Ma'lumot o'zgartirilmaydi, faqat ko'rsatish. */
  function effType(e) {
    var pt = e.progress_type || 'weight';
    if (pt === 'weight' && !(e.weight > 0) && (e.reps > 0)) return 'reps';
    return pt;
  }

  /* Berilgan sana o'sish kunimi? */
  function isProgressDay(mode, date, startDate) {
    if (mode === 'manual') return false;
    if (mode === 'daily') return true;
    var day = date.getDate();
    if (mode === 'even') return day % 2 === 0;
    if (mode === 'odd') return day % 2 === 1;
    if (mode === 'alternate') {
      if (!startDate) return true;
      var s = new Date(startDate + 'T00:00:00');
      var diff = Math.floor((date - s) / 86400000);
      return diff >= 0 && diff % 2 === 0;
    }
    return true;
  }

  /* Boshlanish sanasidan bugungacha nechta o'sish kuni bo'lgan */
  function progressSteps(e) {
    if (!e.start_date || e.progress_mode === 'manual') return 0;
    var s = new Date(e.start_date + 'T00:00:00');
    var today = new Date(); today.setHours(0, 0, 0, 0);
    if (isNaN(s.getTime()) || s > today) return 0;
    var n = 0, cur = new Date(s);
    // Birinchi kun boshlang'ich qiymat — o'sish keyingi o'sish kunlaridan boshlanadi
    cur.setDate(cur.getDate() + 1);
    var guard = 0;
    while (cur <= today && guard < 3650) {
      if (isProgressDay(e.progress_mode, cur, e.start_date)) n++;
      cur.setDate(cur.getDate() + 1);
      guard++;
    }
    return n;
  }

  /* Bugungi maqsad qiymati */
  function todayTarget(e) {
    var t = PTYPE[effType(e)] || PTYPE.weight;
    var base = t.field === 'weight' ? (e.weight || 0) : (e.reps || 0);
    var inc = e.increase || 0;
    var val = base + inc * progressSteps(e);
    return { value: Math.round(val * 100) / 100, unit: t.unit, label: t.n };
  }

  /* Qisqa tavsif: "20kg · 4x10 · har kuni +2.5kg" */
  function exerciseSub(e) {
    var t = PTYPE[effType(e)] || PTYPE.weight;
    var tgt = todayTarget(e);
    var parts = [];
    parts.push(tgt.value + tgt.unit + (t.field === 'reps' ? '' : ''));
    if (e.sets) parts.push(e.sets + ' set');
    if (e.increase) parts.push('+' + e.increase + tgt.unit + ' ' + (PMODE[e.progress_mode] || '').toLowerCase());
    return parts.join(' · ');
  }

  /* ---------- Mashq qo'shish/tahrirlash sheet ---------- */
  function exerciseFormHtml(e) {
    e = e || {};
    var mediaPreview = '';
    if (e.media && e.media.length) {
      mediaPreview = '<div class="list-label" style="margin-top:18px">Mavjud media (' + e.media.length + ')</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px">' +
        e.media.map(function (m) {
          if (/\.(jpg|jpeg|png|gif|webp|avif)$/i.test(m)) {
            return '<img src="/' + m.replace(/^\/+/, '') + '" style="width:56px;height:56px;border-radius:10px;object-fit:cover;border:1px solid var(--border)">';
          }
          return '<span style="width:56px;height:56px;border-radius:10px;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--hint)"><span data-icon="video" data-icon-size="20"></span></span>';
        }).join('') + '</div>' +
        '<label class="field" style="display:flex;align-items:center;gap:8px;flex-direction:row"><input type="checkbox" id="ex-replace" style="width:auto"><span style="margin:0">Yangi media eskilarini almashtirsin</span></label>';
    }
    var ptype = effType(e);
    var pmode = e.progress_mode || 'daily';
    var sdate = e.start_date || dstr(new Date());

    return '<label class="field"><span>Nomi</span><input class="input" id="ex-name" value="' + App.esc(e.name || '') + '" placeholder="Masalan: Tortilish"></label>' +
      '<label class="field"><span>Tavsif (ixtiyoriy)</span><textarea class="textarea" id="ex-desc" rows="2">' + App.esc(e.desc || '') + '</textarea></label>' +

      '<label class="field"><span>Nima oshadi?</span><select class="input" id="ex-ptype">' +
      Object.keys(PTYPE).map(function (k) {
        return '<option value="' + k + '"' + (k === ptype ? ' selected' : '') + '>' + PTYPE[k].n + '</option>';
      }).join('') + '</select></label>' +

      '<div style="display:flex;gap:10px">' +
      '<label class="field" style="flex:1"><span id="ex-base-lbl">Boshlang\'ich</span><input class="input" type="number" step="0.5" id="ex-base" value="' +
      (ptype === 'weight' ? (e.weight || '') : (e.reps || '')) + '"></label>' +
      '<label class="field" style="flex:1"><span id="ex-inc-lbl">Ortirish</span><input class="input" type="number" step="0.5" id="ex-increase" value="' + (e.increase || '') + '"></label>' +
      '</div>' +

      '<label class="field"><span>Qachon oshadi?</span><select class="input" id="ex-pmode">' +
      Object.keys(PMODE).map(function (k) {
        return '<option value="' + k + '"' + (k === pmode ? ' selected' : '') + '>' + PMODE[k] + '</option>';
      }).join('') + '</select></label>' +

      '<label class="field"><span>Boshlangan sana</span><input class="input" type="date" id="ex-sdate" value="' + sdate + '"></label>' +
      '<p class="muted" id="ex-preview" style="font-size:12.5px;margin:-6px 1px 12px"></p>' +

      '<div style="display:flex;gap:10px">' +
      '<label class="field" style="flex:1"><span>Setlar</span><input class="input" type="number" id="ex-sets" value="' + (e.sets || '') + '"></label>' +
      '<label class="field" style="flex:1" id="ex-reps-wrap"><span>Takrorlar</span><input class="input" type="number" id="ex-reps" value="' + (e.reps || '') + '"></label>' +
      '</div>' +
      '<label class="field"><span>Rasm/video qo\'shish (ixtiyoriy)</span><input type="file" class="input" id="ex-media" multiple accept="image/*,video/*"></label>' +
      '<label class="field"><span>YouTube/video link (ixtiyoriy)</span><input class="input" id="ex-link" placeholder="https://youtube.com/..."></label>' +
      mediaPreview +
      '<button class="btn" id="ex-save" style="margin-top:6px">Saqlash</button>' +
      (e.id ? '<button class="btn ghost" style="margin-top:10px;color:var(--danger);border-color:var(--danger-soft)" id="ex-del">O\'chirish</button>' : '');
  }

  function bindExerciseForm(sh, cat, existing) {
    // Tur o'zgarganda yorliqlar va ko'rinish moslashadi
    function syncLabels() {
      var t = PTYPE[sh.querySelector('#ex-ptype').value] || PTYPE.weight;
      sh.querySelector('#ex-base-lbl').textContent = 'Boshlang\'ich (' + t.unit + ')';
      sh.querySelector('#ex-inc-lbl').textContent = 'Ortirish (' + t.unit + ')';
      sh.querySelector('#ex-base').step = t.step;
      sh.querySelector('#ex-increase').step = t.step;
      // Takror/vaqt turida "Takrorlar" maydoni boshlang'ich bilan bir xil bo'ladi
      sh.querySelector('#ex-reps-wrap').style.display = (t.field === 'reps') ? 'none' : '';
      preview();
    }
    function preview() {
      var e = {
        progress_type: sh.querySelector('#ex-ptype').value,
        progress_mode: sh.querySelector('#ex-pmode').value,
        start_date: sh.querySelector('#ex-sdate').value,
        increase: parseFloat(sh.querySelector('#ex-increase').value) || 0
      };
      var base = parseFloat(sh.querySelector('#ex-base').value) || 0;
      if (e.progress_type === 'weight') e.weight = base; else e.reps = base;
      var t = todayTarget(e);
      var steps = progressSteps(e);
      var el = sh.querySelector('#ex-preview');
      if (e.progress_mode === 'manual' || !e.increase) {
        el.textContent = 'Avtomatik oshmaydi — qiymat o\'zgarmaydi.';
      } else {
        el.innerHTML = 'Bugungi maqsad: <b style="color:var(--text)">' + t.value + t.unit + '</b>' +
          ' (' + steps + ' marta oshgan · ' + (PMODE[e.progress_mode] || '').toLowerCase() + ')';
      }
    }
    ['#ex-ptype'].forEach(function (s) { sh.querySelector(s).onchange = syncLabels; });
    ['#ex-pmode', '#ex-sdate', '#ex-base', '#ex-increase'].forEach(function (s) {
      sh.querySelector(s).oninput = preview;
      sh.querySelector(s).onchange = preview;
    });
    syncLabels();

    sh.querySelector('#ex-save').onclick = function () {
      var name = sh.querySelector('#ex-name').value.trim();
      if (!name) return App.toast('Nomini kiriting');
      var ptype = sh.querySelector('#ex-ptype').value;
      var base = sh.querySelector('#ex-base').value || 0;
      var fd = new FormData();
      fd.append('id', existing && existing.id ? existing.id : 0);
      fd.append('category', cat);
      fd.append('name', name);
      fd.append('desc', sh.querySelector('#ex-desc').value.trim());
      fd.append('progress_type', ptype);
      fd.append('progress_mode', sh.querySelector('#ex-pmode').value);
      fd.append('start_date', sh.querySelector('#ex-sdate').value || '');
      // Og'irlik turida `weight`, takror/vaqt turida `reps` boshlang'ich qiymat bo'ladi
      fd.append('weight', ptype === 'weight' ? base : 0);
      fd.append('reps', ptype === 'weight' ? (sh.querySelector('#ex-reps').value || 0) : base);
      fd.append('increase', sh.querySelector('#ex-increase').value || 0);
      fd.append('sets', sh.querySelector('#ex-sets').value || 0);
      var replaceEl = sh.querySelector('#ex-replace');
      if (replaceEl && replaceEl.checked) fd.append('replace_media', '1');
      var files = sh.querySelector('#ex-media').files;
      for (var i = 0; i < files.length; i++) fd.append('media', files[i]);
      var link = sh.querySelector('#ex-link').value.trim();
      if (link) fd.append('media_links', link);

      var btn = sh.querySelector('#ex-save'); btn.textContent = 'Saqlanmoqda...'; btn.disabled = true;
      App.callForm('sport_save_exercise', fd).then(function (res) {
        App.closeSheet(); App.toast('✅ Saqlandi');
        S.data = res.data || null;
        App.reload();
      }).catch(function (e) { App.toast('⚠️ ' + e.message); btn.textContent = 'Saqlash'; btn.disabled = false; });
    };
    var delBtn = sh.querySelector('#ex-del');
    if (delBtn) {
      delBtn.onclick = function () {
        App.confirm('"' + existing.name + '" mashqi o\'chiriladi.', function () {
          App.call('sport_delete_exercise', { id: existing.id }).then(function () {
            App.closeSheet(); App.toast('O\'chirildi'); loadAll(true).then(App.reload);
          }).catch(function (e) { App.toast('⚠️ ' + e.message); });
        }, { danger: true, yes: 'O\'chirish' });
      };
    }
  }

  App.actions.exerciseAdd = function (a) {
    var sh = App.sheet(exerciseFormHtml(), { title: 'Yangi mashq' });
    bindExerciseForm(sh, a.cat, null);
  };
  App.actions.exerciseEdit = function (a) {
    var e = (S.data[a.cat] || []).find(function (x) { return x.id === a.id; });
    if (!e) return;
    var sh = App.sheet(exerciseFormHtml(e), { title: e.name });
    bindExerciseForm(sh, a.cat, e);
  };

  /* =========================================================
     Mashg'ulot tarixi — localStorage'da (server bilan sinxron)
     ========================================================= */
  var LOG_KEY = 'sport_log_v1';

  function sportLog() {
    try { var v = JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function saveLog(list) { try { localStorage.setItem(LOG_KEY, JSON.stringify(list.slice(-1000))); } catch (e) {} }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function loggedToday(id) {
    var t = today();
    return sportLog().some(function (x) { return x.d === t && String(x.id) === String(id); });
  }

  App.actions.sportLog = function (a) {
    var e = (S.data[a.cat] || []).find(function (x) { return String(x.id) === String(a.id); });
    if (!e) return;
    var list = sportLog(), t = today();
    var idx = list.findIndex(function (x) { return x.d === t && String(x.id) === String(a.id); });
    if (idx >= 0) {
      list.splice(idx, 1); saveLog(list);
      App.toast('Bekor qilindi');
    } else {
      list.push({ d: t, cat: a.cat, id: e.id, name: e.name, weight: e.weight || 0, sets: e.sets || 0, reps: e.reps || 0 });
      saveLog(list);
      App.toast('✅ Bajarildi: ' + e.name);
      if (window.Activity) Activity.mark();
    }
    App.reload();
  };

  /* ---------- Dam olish taymeri (setlar orasida) ---------- */
  var REST = { t: null, left: 0 };
  App.actions.restTimer = function () {
    var last = parseInt(localStorage.getItem('sport_rest_sec') || '90', 10);
    var html =
      '<div style="text-align:center">' +
      '<div id="rt-view" style="font-size:52px;font-weight:800;font-family:var(--mono);margin:6px 0 4px">' + fmt(last) + '</div>' +
      '<p class="muted" id="rt-hint" style="font-size:12.5px;margin:0 0 16px">Vaqtni tanlang va boshlang</p></div>' +
      '<div class="flex" id="rt-presets" style="gap:7px;flex-wrap:wrap;justify-content:center;margin-bottom:16px">' +
      [30, 60, 90, 120, 180].map(function (s) {
        return '<button class="chip-btn' + (s === last ? ' active' : '') + '" data-s="' + s + '">' + fmt(s) + '</button>';
      }).join('') + '</div>' +
      '<div class="btn-row"><button class="btn sec" id="rt-stop">To\'xtatish</button>' +
      '<button class="btn" id="rt-start">Boshlash</button></div>';
    var sh = App.sheet(html, { title: 'Dam olish taymeri' });
    var sec = last;

    function fmtNow() { sh.querySelector('#rt-view').textContent = fmt(REST.left > 0 ? REST.left : sec); }
    sh.querySelectorAll('#rt-presets .chip-btn').forEach(function (b) {
      b.onclick = function () {
        sh.querySelectorAll('#rt-presets .chip-btn').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        sec = +b.getAttribute('data-s');
        localStorage.setItem('sport_rest_sec', sec);
        stop(); fmtNow();
      };
    });
    function stop() { if (REST.t) { clearInterval(REST.t); REST.t = null; } REST.left = 0; }
    sh.querySelector('#rt-stop').onclick = function () { stop(); fmtNow(); sh.querySelector('#rt-hint').textContent = 'To\'xtatildi'; };
    sh.querySelector('#rt-start').onclick = function () {
      stop(); REST.left = sec;
      sh.querySelector('#rt-hint').textContent = 'Ketmoqda...';
      REST.t = setInterval(function () {
        REST.left--;
        var v = sh.querySelector('#rt-view');
        if (!v) { stop(); return; }               // oyna yopilgan
        v.textContent = fmt(Math.max(0, REST.left));
        if (REST.left <= 0) {
          stop(); v.textContent = '00:00';
          sh.querySelector('#rt-hint').textContent = '✅ Dam tugadi!';
          App.toast('⏱ Dam olish tugadi');
          try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {}
        }
      }, 1000);
    };
  };
  function fmt(s) { return ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + (s % 60)).slice(-2); }

  App.view('sport_history', {
    nav: 'sport',
    render: function (page) {
      var logs = sportLog().slice().reverse();
      page.innerHTML = topbar('Mashg\'ulot tarixi', 'sport') +
        (logs.length ? '' : App.empty({ icon: 'clock', title: 'Tarix bo\'sh', text: 'Mashq yonidagi ✓ tugmasi bilan bajarilganini belgilang.' })) +
        '<div id="sp-hist"></div>';
      App.icons(page);
      if (!logs.length) return;

      // Kun bo'yicha guruhlash
      var byDay = {}, order = [];
      logs.forEach(function (x) {
        if (!byDay[x.d]) { byDay[x.d] = []; order.push(x.d); }
        byDay[x.d].push(x);
      });

      // Og'irlik o'sishi: har mashq bo'yicha eng oxirgi va eng birinchi qiymat
      var byEx = {};
      sportLog().forEach(function (x) {
        if (!x.weight) return;
        if (!byEx[x.name]) byEx[x.name] = { first: x.weight, last: x.weight, n: 0 };
        byEx[x.name].last = x.weight; byEx[x.name].n++;
      });
      var grown = Object.keys(byEx).filter(function (k) { return byEx[k].last > byEx[k].first; });

      App.el('sp-hist').innerHTML =
        '<div class="stat-strip" style="margin:0 0 16px">' +
        '<div class="s"><div class="n">' + order.length + '</div><div class="l">Kun</div></div>' +
        '<div class="s"><div class="n">' + logs.length + '</div><div class="l">Mashq</div></div>' +
        '<div class="s"><div class="n" style="color:var(--success)">' + grown.length + '</div><div class="l">O\'sdi</div></div>' +
        '</div>' +
        (grown.length
          ? '<div class="list-label" style="margin-top:0">Og\'irlik o\'sishi</div>' +
            grown.map(function (k) {
              var g = byEx[k];
              return '<div class="list-row"><div class="li-main"><div class="li-title">' + App.esc(k) + '</div>' +
                '<div class="li-sub">' + g.first + ' kg → ' + g.last + ' kg</div></div>' +
                '<span class="li-val" style="color:var(--success);font-weight:800">+' + (g.last - g.first) + '</span></div>';
            }).join('')
          : '') +
        '<div class="list-label">Kunlar</div>' +
        order.map(function (d) {
          return '<div class="list-row"><div class="li-main"><div class="li-title">' + App.esc(d) + '</div>' +
            '<div class="li-sub">' + byDay[d].map(function (x) { return App.esc(x.name); }).join(', ') + '</div></div>' +
            '<span class="li-val">' + byDay[d].length + '</span></div>';
        }).join('');
    }
  });
})();
