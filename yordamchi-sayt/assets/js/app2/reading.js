/* Reading — interaktiv matn o'qish (Ingliz `en_reading`, Rus `ru_reading`).

   G'oya: tarjimalar matnning O'ZIDA oldindan yozib qo'yiladi, tizim esa
   ularni o'qib interaktiv qiladi. Onlayn tarjimon kerak emas — hamma narsa
   .md faylning ichida, shuning uchun oflaynda ham to'liq ishlaydi.

   FORMAT (.md fayl):
     # Sarlavha                     -> markazda turadigan sarlavha
     Bu {word|tarjima} bo'lgan gap. -> gap; {..|..} — bitta so'z tarjimasi
     :: Butun gapning tarjimasi.    -> oldingi gapga tegishli tarjima
     (bo'sh qator)                  -> yangi xatboshi

   Ekran tuzilishi (yuqoridan pastga):
     sarlavha (markazda) -> kitobdek toza matn -> pastda tinglash tugmasi.
   Tugma bosilganda videopleyer uslubidagi boshqaruv paneliga aylanadi.
   So'z/gapga bosilganda tarjima o'sha joyning YONIDA kichik oynachada
   (popover) chiqadi va undan to'g'ridan-to'g'ri lug'atga qo'shsa bo'ladi.

   Fayl kutubxonaning O'ZIDA saqlanadi (library.js `language_topics`),
   ya'ni papkalar, yuklash, nomini o'zgartirish — hammasi o'zgarishsiz. */
(function () {
  'use strict';

  /* Bo'lim kalitidan TTS tili va lug'at tili */
  function ttsLang(sec) { return String(sec || '').indexOf('ru_') === 0 ? 'ru-RU' : 'en-US'; }
  function dictLang(sec) { return String(sec || '').indexOf('ru_') === 0 ? 'russian' : 'english'; }

  var R = {
    sec: '', id: null, name: '', lang: 'en-US',
    blocks: [], sentences: [],
    playing: false, idx: -1, rate: 1, alive: false,
    barOpen: false
  };

  /* ================= Parser ================= */

  /* Gap matnini bo'laklarga ajratadi: {so'z|tarjima} annotatsiyalari va
     oddiy matn. Oddiy matn ichidan ham so'zlar ajratiladi (ular tarjimasiz,
     lekin baribir bosilsa o'qib beradi). */
  function tokenize(raw) {
    var out = [];
    var re = /\{([^{}|]+)\|([^{}]*)\}/g;
    var last = 0, m;
    function plain(s) {
      s.split(/([A-Za-zÀ-ÿА-Яа-яЁё'’-]+)/).forEach(function (part, i) {
        if (!part) return;
        if (i % 2 === 1) out.push({ k: 'w', w: part, t: '' });
        else out.push({ k: 'x', s: part });
      });
    }
    while ((m = re.exec(raw)) !== null) {
      if (m.index > last) plain(raw.slice(last, m.index));
      out.push({ k: 'w', w: m[1], t: (m[2] || '').trim() });
      last = m.index + m[0].length;
    }
    if (last < raw.length) plain(raw.slice(last));
    return out;
  }

  /* Gapning TTS uchun toza matni (annotatsiyalarsiz) */
  function plainText(raw) {
    return raw.replace(/\{([^{}|]+)\|[^{}]*\}/g, '$1').replace(/\s+/g, ' ').trim();
  }

  function parse(md) {
    var lines = String(md || '').replace(/\r/g, '').split('\n');
    var blocks = [], sentences = [];
    lines.forEach(function (line) {
      var h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) { blocks.push({ k: 'h', lvl: h[1].length, text: h[2].trim() }); return; }

      var tr = line.match(/^\s*::\s?(.*)$/);
      if (tr) {
        for (var i = blocks.length - 1; i >= 0; i--) {
          if (blocks[i].k === 's') { blocks[i].tr = tr[1].trim(); break; }
          if (blocks[i].k === 'h') break;
        }
        return;
      }

      if (/^\s*$/.test(line)) { blocks.push({ k: 'br' }); return; }

      var s = { k: 's', raw: line.trim(), tr: '', n: sentences.length };
      s.tokens = tokenize(s.raw);
      s.text = plainText(s.raw);
      blocks.push(s);
      sentences.push(s);
    });
    return { blocks: blocks, sentences: sentences };
  }

  /* ================= TTS ================= */

  function speak(text, done) {
    try { window.speechSynthesis.cancel(); } catch (e) {}
    if (!text) { if (done) done(); return; }
    var u = new SpeechSynthesisUtterance(text);
    u.lang = R.lang;
    u.rate = R.rate;
    if (done) u.onend = function () { if (R.alive) done(); };
    try { window.speechSynthesis.speak(u); } catch (e) { if (done) done(); }
  }

  function highlight(n) {
    var page = document.getElementById('page'); if (!page) return;
    page.querySelectorAll('.rd-s.reading').forEach(function (el) { el.classList.remove('reading'); });
    if (n < 0) return;
    var el = page.querySelector('.rd-s[data-n="' + n + '"]');
    if (el) {
      el.classList.add('reading');
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  function stopAll() {
    R.playing = false;
    R.alive = false;
    try { window.speechSynthesis.cancel(); } catch (e) {}
    highlight(-1);
    paintPlayer();
  }

  function step(n) {
    if (!R.playing || !R.alive) return;
    if (n >= R.sentences.length) {
      R.playing = false; R.idx = -1;
      highlight(-1); paintPlayer();
      App.toast('✅ Matn tugadi');
      if (window.Activity) Activity.mark();
      App.call('log_activity', {
        section: 'reading', object: R.name, amount: R.sentences.length,
        unit: 'gap', meta: { sec: R.sec, mode: 'listen' }
      }).catch(function () {});
      return;
    }
    R.idx = n;
    highlight(n);
    paintPlayer();
    speak(R.sentences[n].text, function () { step(n + 1); });
  }

  /* ================= Pastki pleyer =================
     Yopiq holatda — bitta tugma. Bosilganda videopleyerdagidek boshqaruv
     paneliga ochiladi: oldingi/keyingi gap, play/pause, progress va tezlik. */

  function paintPlayer() {
    var box = App.el('rd-player'); if (!box) return;

    if (!R.barOpen) {
      box.className = 'rd-player';
      box.innerHTML =
        '<button class="rd-open" data-act="rdOpenBar">' +
        '<span data-icon="volume" data-icon-size="18"></span>Matnni tinglash</button>';
      App.icons(box);
      return;
    }

    var total = R.sentences.length || 1;
    var cur = R.idx < 0 ? 0 : R.idx + 1;
    var pct = Math.round((cur / total) * 100);

    box.className = 'rd-player open';
    box.innerHTML =
      '<div class="rd-pl-top">' +
        '<div class="rd-pl-time">' + cur + ' / ' + total + ' gap</div>' +
        '<button class="rd-pl-x" data-act="rdCloseBar" aria-label="Yopish">' +
        '<span data-icon="close" data-icon-size="16"></span></button>' +
      '</div>' +
      '<div class="rd-pl-track"><div class="rd-pl-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="rd-pl-ctrls">' +
        '<button class="rd-pl-b" data-act="rdPrev" aria-label="Oldingi gap">' +
        '<span data-icon="skipBack" data-icon-size="20"></span></button>' +
        '<button class="rd-pl-play" data-act="rdToggle" aria-label="' + (R.playing ? 'To\'xtatish' : 'Boshlash') + '">' +
        '<span data-icon="' + (R.playing ? 'pause' : 'play') + '" data-icon-size="24"></span></button>' +
        '<button class="rd-pl-b" data-act="rdNext" aria-label="Keyingi gap">' +
        '<span data-icon="skipFwd" data-icon-size="20"></span></button>' +
        '<button class="rd-pl-rate" data-act="rdSpeed">' + rateLabel() + '</button>' +
      '</div>';
    App.icons(box);
  }

  function rateLabel() { return String(R.rate).replace(/\.?0+$/, '') + 'x'; }

  App.actions.rdOpenBar = function () { R.barOpen = true; paintPlayer(); };
  App.actions.rdCloseBar = function () {
    if (R.playing) { R.playing = false; try { window.speechSynthesis.cancel(); } catch (e) {} highlight(-1); }
    R.barOpen = false; paintPlayer();
  };

  App.actions.rdToggle = function () {
    if (R.playing) {
      R.playing = false;
      try { window.speechSynthesis.cancel(); } catch (e) {}
      paintPlayer();
      return;
    }
    if (!R.sentences.length) { App.toast('Matnda o\'qiladigan gap yo\'q'); return; }
    R.playing = true; R.alive = true;
    step(R.idx >= 0 && R.idx < R.sentences.length ? R.idx : 0);
  };

  App.actions.rdPrev = function () { jump(-1); };
  App.actions.rdNext = function () { jump(1); };
  function jump(d) {
    if (!R.sentences.length) return;
    /* Hali boshlanmagan (idx = -1) holatda "keyingi" BIRINCHI gapga olib
       boradi — `-1 + 1 = 0` emas, chunki -1 "hali hech qayerda" degani,
       "birinchidan oldin" degani emas (aks holda 1-gap tashlab ketilardi). */
    var n = R.idx < 0 ? 0 : R.idx + d;
    if (n < 0) n = 0;
    if (n >= R.sentences.length) n = R.sentences.length - 1;
    R.alive = true;
    if (R.playing) { try { window.speechSynthesis.cancel(); } catch (e) {} step(n); }
    else { R.idx = n; highlight(n); paintPlayer(); }
  }

  App.actions.rdSpeed = function () {
    var opts = [0.6, 0.75, 0.9, 1, 1.15, 1.3];
    R.rate = opts[(opts.indexOf(R.rate) + 1) % opts.length];
    try { localStorage.setItem('reading_rate', String(R.rate)); } catch (e) {}
    paintPlayer();
    if (R.playing) { try { window.speechSynthesis.cancel(); } catch (e) {} step(R.idx < 0 ? 0 : R.idx); }
  };

  /* ================= Tarjima oynachasi (popover) =================
     Bosilgan so'z/gapning YONIDA chiqadi (tepadagi panel emas) — o'qish
     joyidan ko'z uzilmasin. Ekran chetidan chiqib ketmasligi uchun
     gorizontal holati cheklanadi, joy bo'lmasa pastga tushadi. */

  var POP = null;
  function closePop() {
    if (POP) { POP.remove(); POP = null; }
    var page = document.getElementById('page');
    if (page) page.querySelectorAll('.rd-w.on,.rd-s.on').forEach(function (x) { x.classList.remove('on'); });
  }

  function openPop(anchor, opts) {
    closePop();
    if (anchor) anchor.classList.add('on');

    var p = document.createElement('div');
    p.className = 'rd-pop';
    p.innerHTML =
      '<div class="rd-pop-body">' +
        '<div class="rd-pop-src">' + App.esc(opts.src) + '</div>' +
        '<div class="rd-pop-tr">' + (opts.tr ? App.esc(opts.tr) : '<i>tarjima yozilmagan</i>') + '</div>' +
      '</div>' +
      '<div class="rd-pop-acts">' +
        '<button class="rd-pop-b" data-act="rdSay" data-arg=\'' + App.arg({ t: opts.say }) + '\'>' +
        '<span data-icon="volume" data-icon-size="15"></span>Tinglash</button>' +
        (opts.learn
          ? '<button class="rd-pop-b learn" data-act="rdLearn" data-arg=\'' +
            App.arg({ w: opts.src, t: opts.tr }) + '\'>' +
            '<span data-icon="check" data-icon-size="15"></span>O\'rganish</button>'
          : '') +
      '</div>' +
      '<span class="rd-pop-tip"></span>';
    document.body.appendChild(p);
    App.icons(p);

    place(p, anchor);
    POP = p;
  }

  /* Oynachani lange elementning tepasiga (joy bo'lmasa pastiga) qo'yadi */
  function place(p, anchor) {
    if (!anchor) return;
    var r = anchor.getBoundingClientRect();
    var pw = p.offsetWidth, ph = p.offsetHeight;
    var pad = 10;
    var left = r.left + r.width / 2 - pw / 2;
    left = Math.max(pad, Math.min(left, window.innerWidth - pw - pad));

    var top = r.top - ph - 10;
    var below = false;
    if (top < pad) { top = r.bottom + 10; below = true; }
    p.classList.toggle('below', below);

    p.style.left = Math.round(left) + 'px';
    p.style.top = Math.round(top) + 'px';

    // Uchburchak strelka aynan so'zning ustida tursin
    var tip = p.querySelector('.rd-pop-tip');
    if (tip) {
      var tx = r.left + r.width / 2 - left;
      tip.style.left = Math.round(Math.max(14, Math.min(tx, pw - 14))) + 'px';
    }
  }

  App.actions.rdSay = function (a) { R.alive = true; speak(a && a.t); };

  App.actions.rdWord = function (a, el) {
    R.alive = true;
    openPop(el, { src: a.w, tr: a.t, say: a.w, learn: true });
    speak(a.w);
  };

  App.actions.rdSent = function (a, el) {
    R.alive = true;
    var s = R.sentences[a.n]; if (!s) return;
    openPop(el, { src: s.text, tr: s.tr, say: s.text, learn: false });
  };

  /* Tashqariga bosilsa yopiladi; sahifa siljisa joyi yangilanadi */
  document.addEventListener('click', function (e) {
    if (!POP) return;
    if (e.target.closest('.rd-pop') || e.target.closest('.rd-w') || e.target.closest('.rd-s')) return;
    closePop();
  }, true);
  window.addEventListener('resize', function () { if (POP) closePop(); });

  /* ================= "O'rganish" — lug'atga qo'shish =================
     Kategoriya nomi MATN nomi bilan ataladi. `save_dict_cat` kategoriyani
     BUTUNLAY almashtiradi, shuning uchun avval mavjud so'zlar o'qib olinadi
     va yangisi ustiga qo'shiladi (aks holda oldingilari o'chib ketardi). */
  App.actions.rdLearn = function (a, el) {
    var word = String(a.w || '').trim();
    var tr = String(a.t || '').trim();
    if (!word) return;
    if (!tr) { App.toast('Bu so\'zning tarjimasi yozilmagan'); return; }

    var lang = dictLang(R.sec);
    var cat = R.name || 'Reading';
    if (el) { el.disabled = true; el.textContent = '...'; }

    App.call('get_dict_data', null, { query: 'lang=' + encodeURIComponent(lang) })
      .then(function (j) {
        var words = [];
        (j.items || []).forEach(function (it) {
          if (it.category === cat) words.push({ ru: it.word_ru, uz: it.word_uz });
        });
        var lower = word.toLowerCase();
        if (words.some(function (w) { return String(w.ru).toLowerCase() === lower; })) {
          return { already: true, n: words.length };
        }
        words.push({ ru: word, uz: tr });
        return App.call('save_dict_cat', { lang: lang, category: cat, words: words })
          .then(function () { return { already: false, n: words.length }; });
      })
      .then(function (r) {
        closePop();
        App.toast(r.already
          ? '"' + word + '" allaqachon "' + cat + '" lug\'atida'
          : '✅ "' + word + '" → "' + cat + '" lug\'ati (' + r.n + ' ta so\'z)');
      })
      .catch(function (e) {
        if (el) { el.disabled = false; }
        App.toast('⚠️ ' + e.message);
      });
  };

  /* ================= Chizish ================= */

  function bodyHtml(parsed) {
    if (!parsed.blocks.length) return '';
    var html = '', para = '';
    function flush() { if (para) { html += '<p class="rd-p">' + para + '</p>'; para = ''; } }

    parsed.blocks.forEach(function (b) {
      if (b.k === 'br') { flush(); return; }
      if (b.k === 'h') {
        flush();
        // Birinchi darajali sarlavha — MARKAZDA (matn boshlanishi shundan)
        var cls = b.lvl === 1 ? 'rd-h1' : 'rd-h2';
        var tag = b.lvl === 1 ? 'h2' : 'h3';
        html += '<' + tag + ' class="' + cls + '">' + App.esc(b.text) + '</' + tag + '>';
        return;
      }

      var inner = b.tokens.map(function (t) {
        if (t.k === 'x') return App.esc(t.s);
        return '<span class="rd-w' + (t.t ? ' has' : '') + '" data-act="rdWord" data-arg=\'' +
          App.arg({ w: t.w, t: t.t }) + '\'>' + App.esc(t.w) + '</span>';
      }).join('');

      para += '<span class="rd-s" data-n="' + b.n +
              '" data-act="rdSent" data-arg=\'' + App.arg({ n: b.n }) + '\'>' + inner + '</span> ';
    });
    flush();
    return html;
  }

  /* ================= Namuna fayl ================= */

  var SAMPLE_EN = [
    '# The Old Lighthouse',
    '',
    'The {old|eski} {lighthouse|mayoq} stood on the {cliff|qoya} above the sea.',
    ':: Eski mayoq dengiz ustidagi qoyada turardi.',
    'Every {night|kecha} its light {guided|yo\'l ko\'rsatardi} the {ships|kemalar} home.',
    ':: Har kecha uning nuri kemalarga uyga yo\'l ko\'rsatardi.',
    '',
    'One {winter|qish} the keeper {fell|kasal bo\'lib qoldi} ill.',
    ':: Bir qishda qorovul kasal bo\'lib qoldi.',
    'His {daughter|qizi} climbed the {stairs|zinapoya} alone and lit the {lamp|chiroq}.',
    ':: Uning qizi zinapoyaga yolg\'iz chiqdi va chiroqni yoqdi.',
    '',
    '# Qanday yoziladi',
    '',
    'Har gap alohida qatorda turadi.',
    ':: Bu qatorning tarjimasi — gapdan keyin `::` bilan yoziladi.',
    'So\'z tarjimasi gap ichida shunday yoziladi: {word|so\'z}.',
    ':: Faqat kerakli so\'zlarni belgilash yetarli, hammasi shart emas.'
  ].join('\n');

  var SAMPLE_RU = [
    '# Старый маяк',
    '',
    '{Старый|eski} {маяк|mayoq} стоял на {скале|qoya} над морем.',
    ':: Eski mayoq dengiz ustidagi qoyada turardi.',
    'Каждую {ночь|kecha} его свет {указывал|yo\'l ko\'rsatardi} путь {кораблям|kemalarga}.',
    ':: Har kecha uning nuri kemalarga yo\'l ko\'rsatardi.',
    '',
    '# Как писать',
    '',
    'Каждое предложение — на отдельной строке.',
    ':: Har gap alohida qatorda turadi.',
    'Перевод слова пишется так: {слово|so\'z}.',
    ':: So\'z tarjimasi shunday yoziladi.'
  ].join('\n');

  App.actions.rdSample = function (a) {
    App.closeSheet();
    var ru = String((a && a.sec) || R.sec).indexOf('ru_') === 0;
    App.download(ru ? 'namuna-chtenie.md' : 'namuna-reading.md', ru ? SAMPLE_RU : SAMPLE_EN);
    App.toast('Namuna fayl yuklandi — shu formatda yozing');
  };

  /* ================= VIEW: reading_doc ================= */

  App.view('reading_doc', {
    nav: 'languages',
    leave: function () { stopAll(); closePop(); },
    render: function (page, params) {
      R.sec = params.sec || 'en_reading';
      R.id = params.id;
      R.lang = ttsLang(R.sec);
      R.blocks = []; R.sentences = []; R.idx = -1;
      R.playing = false; R.alive = true; R.barOpen = false;
      try { R.rate = parseFloat(localStorage.getItem('reading_rate')) || 1; } catch (e) { R.rate = 1; }

      page.innerHTML =
        '<div class="topbar" style="margin:-16px -15px 12px">' +
        '<button class="icon-btn ghost" id="rd-back"><span data-icon="arrowLeft" data-icon-size="20"></span></button>' +
        '<h1 id="rd-title"></h1>' +
        '<button class="icon-btn ghost" id="rd-menu" style="margin-left:auto"><span data-icon="edit" data-icon-size="18"></span></button></div>' +
        '<div id="rd-body"><div class="load-wrap"><div class="spinner"></div></div></div>' +
        '<div class="rd-player" id="rd-player"></div>' +
        '<input type="file" id="rd-file" hidden accept=".md,.markdown,.txt,text/markdown,text/plain">';
      App.icons(page);
      loadDoc(page);
    }
  });

  function loadDoc(page) {
    App.call('get_topic', null, { query: 'id=' + encodeURIComponent(R.id) }).then(function (t) {
      var box = App.el('rd-body'); if (!box) return;
      R.name = t.name || 'Matn';
      var folder = (t.folder || '').trim();

      var back = page.querySelector('#rd-back');
      if (back) {
        back.setAttribute('data-act', 'go');
        back.setAttribute('data-arg', App.arg({ v: 'library', p: { sec: R.sec, path: folder } }));
      }

      if (!t.content) {
        box.innerHTML = App.empty({
          icon: 'book', title: 'Matn hali yo\'q',
          text: 'Tepadagi ✏ orqali .md yuklang yoki yozing. Format bilan tanishish uchun namuna faylni oling.'
        }) +
        '<button class="btn sec" data-act="rdSample" data-arg=\'' + App.arg({ sec: R.sec }) + '\' style="margin-top:12px">' +
        '<span data-icon="download" data-icon-size="16"></span>Namuna faylni yuklab olish</button>';
        App.icons(box);
        bindMenu(page, t);
        return;
      }

      var parsed = parse(t.content);
      R.blocks = parsed.blocks;
      R.sentences = parsed.sentences;

      /* Sarlavha: matnning birinchi `#` sarlavhasi bo'lsa o'sha, bo'lmasa
         fayl nomi. Ikki marta chiqmasligi uchun birinchisi bloklardan
         olib tashlanadi. */
      var title = R.name;
      if (parsed.blocks.length && parsed.blocks[0].k === 'h' && parsed.blocks[0].lvl === 1) {
        title = parsed.blocks[0].text;
        parsed.blocks = parsed.blocks.slice(1);
      }

      box.innerHTML =
        '<h1 class="rd-title">' + App.esc(title) + '</h1>' +
        '<p class="rd-hint">So\'z yoki gapga bosing — tarjimasi shu yerda chiqadi.</p>' +
        '<div class="rd-text">' + bodyHtml(parsed) + '</div>';
      App.icons(box);

      // Topbar sarlavhasi qisqa qolsin (fayl nomi), asosiysi matn ustida
      var h1 = page.querySelector('#rd-title');
      if (h1) h1.textContent = R.name;

      paintPlayer();
      bindMenu(page, t);
    }).catch(function (e) {
      var box = App.el('rd-body');
      if (box) box.innerHTML = App.empty({ icon: 'alert', title: 'Yuklanmadi', text: e.message });
    });
  }

  function bindMenu(page, t) {
    var btn = page.querySelector('#rd-menu'); if (!btn) return;
    btn.onclick = function () {
      var html =
        '<button class="list-row" id="rd-m-ed"><span class="li-ic" data-icon="edit" data-icon-size="15"></span>' +
        '<div class="li-main"><div class="li-title">' + (t.content ? 'Tahrirlash' : 'Yozish') + '</div>' +
        '<div class="li-sub">Tarjimalarni shu yerda qo\'shasiz</div></div></button>' +
        '<button class="list-row" id="rd-m-up"><span class="li-ic" data-icon="upload" data-icon-size="15"></span>' +
        '<div class="li-main"><div class="li-title">' + (t.content ? '.md faylni almashtirish' : '.md fayl yuklash') + '</div></div></button>' +
        (t.content
          ? '<button class="list-row" id="rd-m-dl"><span class="li-ic" data-icon="download" data-icon-size="15"></span>' +
            '<div class="li-main"><div class="li-title">.md faylni yuklab olish</div></div></button>'
          : '') +
        '<button class="list-row" data-act="rdSample" data-arg=\'' + App.arg({ sec: R.sec }) + '\'>' +
        '<span class="li-ic" data-icon="book" data-icon-size="15"></span>' +
        '<div class="li-main"><div class="li-title">Namuna fayl</div>' +
        '<div class="li-sub">Format qanday yozilishini ko\'rsatadi</div></div></button>';
      var sh = App.sheet(html, { title: R.name });
      App.icons(sh);
      sh.querySelector('#rd-m-up').onclick = function () { App.closeSheet(); App.el('rd-file').click(); };
      sh.querySelector('#rd-m-ed').onclick = function () { App.closeSheet(); editDoc(page, t); };
      var dl = sh.querySelector('#rd-m-dl');
      if (dl) dl.onclick = function () { App.closeSheet(); App.download(R.name + '.md', t.content); };
    };

    var fEl = App.el('rd-file');
    if (fEl) fEl.onchange = function (e) {
      var f = e.target.files[0]; if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        App.call('upload_topic_content', { id: R.id, part: 'content', content: String(fr.result || '') })
          .then(function () { App.toast('✅ Yuklandi'); loadDoc(page); })
          .catch(function (err) { App.toast('⚠️ ' + err.message); });
      };
      fr.readAsText(f);
      fEl.value = '';
    };
  }

  function editDoc(page, t) {
    var html =
      '<p class="muted" style="font-size:12px;margin:0 0 10px">' +
      'Har gap alohida qatorda. Gap tarjimasi keyingi qatorda <code>::</code> bilan. ' +
      'So\'z tarjimasi gap ichida <code>{word|so\'z}</code>.</p>' +
      '<label class="field"><span>Matn</span><textarea class="textarea" id="rd-ta" spellcheck="false">' +
      App.esc(t.content || '') + '</textarea></label>' +
      '<div class="btn-row"><button class="btn sec" data-act="closeSheet">Bekor</button>' +
      '<button class="btn" id="rd-ta-save">Saqlash</button></div>';
    var sh = App.sheet(html, { title: R.name, cls: 'editor-sheet' });
    sh.querySelector('#rd-ta-save').onclick = function () {
      App.call('upload_topic_content', { id: R.id, part: 'content', content: sh.querySelector('#rd-ta').value })
        .then(function () { App.closeSheet(); App.toast('✅ Saqlandi'); loadDoc(page); })
        .catch(function (err) { App.toast('⚠️ ' + err.message); });
    };
  }

  /* Kutubxona "Qo'shish" menyusi Reading bo'limida namuna faylni ham taklif qiladi */
  window.Reading = { isReadingSec: function (sec) { return /^(en|ru)_reading$/.test(sec || ''); } };

})();
