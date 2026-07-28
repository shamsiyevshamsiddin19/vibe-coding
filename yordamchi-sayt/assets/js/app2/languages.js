/* Tillar: Ingliz, Rus, Coding — hublar. Real kontent (Listening/Grammar/Vocab) keyingi bosqichda. */
(function () {
  'use strict';

  App.view('languages', {
    nav: 'languages',
    render: function (page) {
      page.innerHTML =
        header('Tillar', null) +
        '<div class="tiles" style="grid-template-columns:1fr">' +
        langCard('english', 'globe', 'Ingliz tili', 'Listening, Reading, Grammar...') +
        langCard('russian', 'message', 'Rus tili', 'Grammatika, Lug\'at, Listening...') +
        langCard('grammar', 'code', 'Dasturlash', 'Mavzular, testlar va o\'yinlar', { lang: 'coding' }) +
        '</div>';
      App.icons(page);
    }
  });

  function langCard(v, ic, n, s, params) {
    return '<button class="row card-tap" data-act="go" data-arg=\'' + App.arg({ v: v, p: params || {} }) + '\' style="padding:16px">' +
      '<span class="ic" style="width:44px;height:44px;border-radius:13px;background:var(--accent-soft);color:var(--accent);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0"><span data-icon="' + ic + '" data-icon-size="22"></span></span>' +
      '<div class="row-main"><div class="row-title" style="font-size:15.5px">' + n + '</div><div class="row-sub">' + s + '</div></div>' +
      '<span class="row-arrow" data-icon="arrowLeft" data-icon-size="16" style="transform:rotate(180deg)"></span></button>';
  }

  function header(title, back) {
    return '<div class="topbar" style="margin:-16px -15px 12px">' +
      (back ? '<button class="icon-btn ghost" data-act="go" data-arg=\'' + App.arg({ v: back }) + '\'><span data-icon="arrowLeft" data-icon-size="20"></span></button>' : '') +
      '<h1>' + App.esc(title) + '</h1></div>';
  }

  function skillList(page, title, back, skills) {
    page.innerHTML = header(title, back) + skills.map(function (sk) {
      var soon = !sk.ready;
      return '<button class="row card-tap" style="margin-top:9px" ' + (soon ? 'data-act="skillSoon" data-arg=\'' + App.arg({ n: sk.n }) + '\'' : 'data-act="go" data-arg=\'' + App.arg({ v: sk.v, p: sk.p || {} }) + '\'') + '>' +
        '<span class="row-ic" data-icon="' + sk.ic + '" data-icon-size="20"></span>' +
        '<div class="row-main"><div class="row-title">' + App.esc(sk.n) + '</div>' + (soon ? '<div class="row-sub">Tez orada</div>' : '') + '</div>' +
        (soon ? '<span class="chip-btn" style="pointer-events:none;padding:4px 10px;font-size:11px">Tez orada</span>' : '<span class="row-arrow" data-icon="arrowLeft" data-icon-size="16" style="transform:rotate(180deg)"></span>') +
        '</button>';
    }).join('');
    App.icons(page);
  }

  App.actions.skillSoon = function (a) {
    App.toast('“' + a.n + '” tez orada tayyor bo\'ladi');
  };

  App.view('english', {
    nav: 'languages',
    render: function (page) {
      skillList(page, 'Ingliz tili', 'languages', [
        { n: 'Listening', ic: 'headphones', ready: false, v: 'english' },
        { n: 'Reading', ic: 'book', ready: false },
        { n: 'Grammar', ic: 'edit', ready: true, v: 'grammar', p: { lang: 'english' } },
        { n: 'Vocabulary', ic: 'list', ready: true, v: 'vocab', p: { lang: 'english' } },
        { n: 'Writing', ic: 'edit', ready: false },
        { n: 'Speaking', ic: 'mic', ready: false },
        { n: 'Mashqlar', ic: 'play', ready: true, v: 'practice', p: { lang: 'english' } }
      ]);
    }
  });

  App.view('russian', {
    nav: 'languages',
    render: function (page) {
      skillList(page, 'Rus tili', 'languages', [
        { n: 'Grammatika', ic: 'edit', ready: true, v: 'grammar', p: { lang: 'russian' } },
        { n: 'Lug\'at', ic: 'list', ready: true, v: 'vocab', p: { lang: 'russian' } },
        { n: 'Listening', ic: 'headphones', ready: false },
        { n: 'Говорение', ic: 'mic', ready: false },
        { n: 'Письмо', ic: 'edit', ready: false },
        { n: 'Шэдоуинг', ic: 'refresh', ready: false },
        { n: 'Mashqlar', ic: 'play', ready: true, v: 'practice', p: { lang: 'russian' } }
      ]);
    }
  });

  // `coding` view alohida faylda (coding.js) — texnologiyalar ma'lumotnomasi.
  // Tillar > Dasturlash esa `grammar` (lang=coding) — o'rganish bo'limi.
})();
