/* Coding — texnologiyalar ma'lumotnomasi: nima ekani, vazifasi, qayerda ishlatiladi.
   Bu O'RGANISH bo'limi emas (u Tillar > Dasturlash'da) — bu qisqa ma'lumotnoma. */
(function () {
  'use strict';

  var TECH = [
    {
      g: 'Dasturlash tillari', ic: 'code', c: 'var(--accent)', items: [
        { n: 'Python', r: 'Umumiy maqsadli, o\'qishga oson til',
          d: 'Sintaksisi sodda bo\'lgani uchun tez yoziladi. Sun\'iy intellekt, ma\'lumot tahlili, server (backend) va avtomatlashtirish uchun eng ko\'p ishlatiladigan tillardan.',
          u: 'AI/ML, backend, skriptlar, ma\'lumot tahlili' },
        { n: 'JavaScript', r: 'Brauzerda ishlaydigan yagona til',
          d: 'Veb-sahifani "jonli" qiladi: tugma bosilishi, ma\'lumot yuklash, animatsiya. Node.js orqali serverda ham ishlaydi.',
          u: 'Frontend, backend (Node.js), mobil' },
        { n: 'TypeScript', r: 'Tur tekshiruvi qo\'shilgan JavaScript',
          d: 'JavaScript ustiga "bu o\'zgaruvchi son, bu matn" degan qoidalar qo\'shadi. Katta loyihada xatoni yozish paytidayoq ko\'rsatadi.',
          u: 'Katta frontend/backend loyihalar' },
        { n: 'C++', r: 'Tezlik talab qiladigan tizim tili',
          d: 'Xotira bilan bevosita ishlaydi, shuning uchun juda tez. Almashtirish evaziga — yozish murakkabroq.',
          u: 'O\'yin dvigatellari, drayverlar, olimpiada, embedded' },
        { n: 'Java', r: 'Korporativ tizimlar tili',
          d: '"Bir marta yoz, hamma joyda ishlaydi" tamoyili. Yirik banklar va korxonalarda keng tarqalgan.',
          u: 'Korporativ backend, Android' },
        { n: 'C#', r: 'Microsoft ekotizimi tili',
          d: '.NET platformasi uchun asosiy til. Unity o\'yin dvigatelida ham ishlatiladi.',
          u: 'Windows ilovalar, o\'yinlar (Unity), backend' },
        { n: 'Go', r: 'Server uchun sodda va tez til',
          d: 'Google yaratgan. Ko\'p vazifani bir vaqtda bajarish (concurrency) juda qulay qilingan.',
          u: 'Mikroservislar, tarmoq xizmatlari, DevOps vositalari' },
        { n: 'Rust', r: 'Xavfsiz va tez tizim tili',
          d: 'C++ darajasida tez, lekin xotira xatolarini kompilyatsiya paytidayoq to\'sadi.',
          u: 'Tizim dasturlari, brauzer dvigatellari, WebAssembly' },
        { n: 'PHP', r: 'Veb-server tili',
          d: 'Vebning katta qismi shu tilda yozilgan. WordPress, Laravel shu tilda.',
          u: 'Veb-saytlar, CMS' },
        { n: 'Kotlin', r: 'Android uchun zamonaviy til',
          d: 'Java o\'rnini bosdi — qisqaroq va xavfsizroq yoziladi.',
          u: 'Android ilovalar, backend' },
        { n: 'Swift', r: 'Apple qurilmalari tili',
          d: 'iPhone, iPad, Mac ilovalarini yozish uchun Apple yaratgan til.',
          u: 'iOS/macOS ilovalar' },
        { n: 'SQL', r: 'Ma\'lumotlar bazasi so\'rov tili',
          d: 'Dasturlash tili emas, so\'rov tili: bazadan ma\'lumot olish, qo\'shish, o\'zgartirish uchun.',
          u: 'Barcha relatsion bazalar' }
      ]
    },
    {
      g: 'Frontend (sayt tashqi ko\'rinishi)', ic: 'globe', c: 'var(--purple)', items: [
        { n: 'HTML', r: 'Sahifaning skeleti',
          d: 'Sahifada nima borligini bildiradi: sarlavha, matn, rasm, tugma. Dasturlash tili emas — belgilash tili.',
          u: 'Har qanday veb-sahifa' },
        { n: 'CSS', r: 'Sahifaning ko\'rinishi',
          d: 'Rang, o\'lcham, joylashuv, animatsiya — hammasi shu yerda. Turli ekranlarga moslash (responsive) ham CSS ishi.',
          u: 'Dizayn, moslashuvchan sahifa' },
        { n: 'React', r: 'Interfeys qurish kutubxonasi',
          d: 'Sahifani mustaqil "komponent"larga bo\'lib yozish imkonini beradi. Eng keng tarqalgan frontend vositasi.',
          u: 'Murakkab veb-ilovalar' },
        { n: 'Vue', r: 'React\'ga muqobil, o\'rganish osonroq',
          d: 'React bilan bir xil vazifani bajaradi, lekin kirish darajasi pastroq.',
          u: 'Veb-ilovalar' },
        { n: 'Next.js', r: 'React ustiga qurilgan to\'liq karkas',
          d: 'Sahifani serverda tayyorlash (SSR), marshrutlash, optimizatsiya — tayyor holda keladi. SEO uchun qulay.',
          u: 'Ishlab chiqarishga tayyor saytlar' },
        { n: 'Tailwind CSS', r: 'Tayyor CSS sinflari to\'plami',
          d: 'Alohida CSS fayl yozish o\'rniga HTML ichida `p-4 text-lg` kabi sinflar bilan uslub beriladi.',
          u: 'Tez dizayn qilish' },
        { n: 'Vite', r: 'Loyihani yig\'uvchi tezkor vosita',
          d: 'Yozgan kodingizni brauzer tushunadigan holga keltiradi va o\'zgarishni bir zumda ko\'rsatadi.',
          u: 'Frontend loyihalar' }
      ]
    },
    {
      g: 'Backend (server tomoni)', ic: 'file', c: 'var(--teal)', items: [
        { n: 'Node.js', r: 'JavaScript\'ni serverda ishlatish muhiti',
          d: 'Brauzerdan tashqarida JS kodini ishga tushiradi — shu tufayli bitta tilda ham frontend, ham backend yoziladi.',
          u: 'API, real-time xizmatlar' },
        { n: 'Express', r: 'Node.js uchun sodda karkas',
          d: 'Server yo\'llarini (`/api/users`) belgilash va so\'rovlarga javob berishni osonlashtiradi.',
          u: 'REST API' },
        { n: 'FastAPI', r: 'Python uchun tezkor API karkasi',
          d: 'Juda tez, avtomatik hujjat yaratadi va kiruvchi ma\'lumotni o\'zi tekshiradi. **Shu sayt shunda yozilgan.**',
          u: 'API, mikroservislar' },
        { n: 'Django', r: 'Python uchun "hammasi ichida" karkas',
          d: 'Admin panel, autentifikatsiya, baza bilan ishlash — hammasi tayyor keladi.',
          u: 'Yirik veb-loyihalar' },
        { n: 'Laravel', r: 'PHP uchun zamonaviy karkas',
          d: 'PHP\'da tartibli va o\'qiladigan kod yozishga imkon beradi.',
          u: 'Veb-ilovalar' },
        { n: 'Spring Boot', r: 'Java uchun asosiy karkas',
          d: 'Korporativ darajadagi xizmatlarni tez yig\'ish uchun.',
          u: 'Korporativ backend' }
      ]
    },
    {
      g: 'Ma\'lumotlar bazasi', ic: 'archive', c: 'var(--warn)', items: [
        { n: 'PostgreSQL', r: 'Kuchli relatsion baza',
          d: 'Ma\'lumotni jadvallarda saqlaydi, murakkab so\'rovlarni bajaradi, ishonchli. **Shu sayt shundan foydalanadi.**',
          u: 'Deyarli har qanday loyiha' },
        { n: 'MySQL', r: 'Eng keng tarqalgan relatsion baza',
          d: 'PostgreSQL bilan o\'xshash. Veb-hostinglarda ko\'proq uchraydi.',
          u: 'Veb-saytlar, CMS' },
        { n: 'SQLite', r: 'Bitta fayldagi kichik baza',
          d: 'Server talab qilmaydi — butun baza bitta faylda. Telefon ilovalari va kichik loyihalar uchun ideal.',
          u: 'Mobil ilovalar, prototiplar' },
        { n: 'MongoDB', r: 'Hujjatli (NoSQL) baza',
          d: 'Jadval emas, JSON ko\'rinishidagi hujjatlarni saqlaydi. Tuzilma tez-tez o\'zgaradigan ma\'lumot uchun qulay.',
          u: 'Tez o\'zgaruvchan ma\'lumot' },
        { n: 'Redis', r: 'Xotiradagi tezkor ombor',
          d: 'Ma\'lumotni diskda emas, operativ xotirada saqlaydi — shuning uchun juda tez. Kesh va navbat uchun.',
          u: 'Kesh, sessiya, navbat' }
      ]
    },
    {
      g: 'Mobil', ic: 'image', c: 'var(--coral)', items: [
        { n: 'Flutter', r: 'Bitta koddan iOS va Android',
          d: 'Google vositasi, Dart tilida yoziladi. Interfeysni o\'zi chizadi, shuning uchun ikkala platformada bir xil ko\'rinadi.',
          u: 'Kross-platforma ilovalar' },
        { n: 'React Native', r: 'React bilan mobil ilova',
          d: 'JavaScript/React bilingan bo\'lsangiz, mobil ilovani ham shu bilim bilan yozasiz.',
          u: 'Kross-platforma ilovalar' },
        { n: 'PWA', r: 'Sayt — ilova ko\'rinishida',
          d: 'Oddiy veb-sayt telefon bosh ekraniga o\'rnatiladi va internetsiz ham ishlaydi. **Shu sayt PWA.**',
          u: 'Do\'konsiz tarqatiladigan ilovalar' }
      ]
    },
    {
      g: 'Infratuzilma va vositalar', ic: 'settings', c: 'var(--success)', items: [
        { n: 'Git', r: 'Kod versiyalarini boshqarish',
          d: 'Har bir o\'zgarishni saqlaydi — istalgan vaqtda orqaga qaytish yoki jamoada birga ishlash mumkin.',
          u: 'Har qanday loyiha' },
        { n: 'Docker', r: 'Dasturni "quti"ga solish',
          d: 'Dastur va u talab qiladigan hamma narsani bitta konteynerga joylaydi — "menda ishlaydi, sizda ishlamaydi" muammosini yo\'q qiladi.',
          u: 'Deploy, muhitni bir xillashtirish' },
        { n: 'Nginx', r: 'Veb-server va teskari proksi',
          d: 'Kiruvchi so\'rovlarni qabul qilib, kerakli dasturga uzatadi. Statik fayllarni ham tez tarqatadi. **Shu saytda ishlaydi.**',
          u: 'Sayt tarqatish, HTTPS, yuk taqsimlash' },
        { n: 'Linux', r: 'Serverlarning asosiy tizimi',
          d: 'Dunyodagi serverlarning katta qismi Linux\'da ishlaydi. Terminal orqali boshqariladi.',
          u: 'Serverlar' },
        { n: 'CI/CD', r: 'Avtomatik tekshirish va joylash',
          d: 'Kod o\'zgarganda testlar o\'zi ishga tushadi va tayyor bo\'lsa serverga o\'zi joylanadi.',
          u: 'Jamoaviy ishlab chiqish' },
        { n: 'REST API', r: 'Dasturlar orasidagi til',
          d: 'Ilova server bilan qanday gaplashishini belgilaydigan qoidalar: `GET /users` — ro\'yxatni ol, `POST /users` — yangisini qo\'sh.',
          u: 'Frontend ↔ backend aloqasi' }
      ]
    },
    {
      g: 'AI va ma\'lumot tahlili', ic: 'trophy', c: 'var(--purple)', items: [
        { n: 'NumPy', r: 'Raqamli hisob-kitob kutubxonasi',
          d: 'Katta massivlar bilan tez ishlaydi. Deyarli barcha Python ma\'lumot vositalarining poydevori.',
          u: 'Matematik hisoblar' },
        { n: 'Pandas', r: 'Jadval ko\'rinishidagi ma\'lumot bilan ishlash',
          d: 'Excel jadvaliga o\'xshash ma\'lumotni kod bilan filtrlash, guruhlash, tozalash.',
          u: 'Ma\'lumot tahlili' },
        { n: 'PyTorch', r: 'Neyron tarmoq qurish',
          d: 'Chuqur o\'rganish (deep learning) modellarini yozish va o\'qitish uchun. Tadqiqotda eng ko\'p ishlatiladi.',
          u: 'AI modellar' },
        { n: 'scikit-learn', r: 'Klassik mashina o\'rganish',
          d: 'Regressiya, klasterlash, tasniflash kabi an\'anaviy algoritmlar tayyor holda.',
          u: 'Bashorat modellari' }
      ]
    }
  ];

  function techHeader(title, back) {
    return '<div class="topbar" style="margin:-16px -15px 12px">' +
      (back ? '<button class="icon-btn ghost" data-act="go" data-arg=\'' + App.arg({ v: back }) + '\'><span data-icon="arrowLeft" data-icon-size="20"></span></button>' : '') +
      '<h1>' + App.esc(title) + '</h1></div>';
  }

  function findTech(name) {
    for (var i = 0; i < TECH.length; i++) {
      var f = TECH[i].items.find(function (x) { return x.n === name; });
      if (f) return { t: f, g: TECH[i] };
    }
    return null;
  }

  App.view('coding', {
    nav: 'coding',
    render: function (page) {
      page.innerHTML = techHeader('Texnologiyalar', 'home') +
        '<input class="input" id="tc-q" placeholder="Qidirish: React, baza, mobil..." style="margin-bottom:14px">' +
        '<p class="muted" id="tc-count" style="font-size:12.5px;margin:0 0 10px"></p>' +
        '<div id="tc-list"></div>';
      App.icons(page);

      function render() {
        var q = (App.el('tc-q').value || '').trim().toLowerCase();
        var box = App.el('tc-list');
        var total = 0, html = '';

        TECH.forEach(function (grp) {
          var items = q
            ? grp.items.filter(function (x) {
                return (x.n + ' ' + x.r + ' ' + x.d + ' ' + x.u + ' ' + grp.g).toLowerCase().indexOf(q) >= 0;
              })
            : grp.items;
          if (!items.length) return;
          total += items.length;
          html += '<div class="list-label">' + App.esc(grp.g) + '</div>' +
            items.map(function (x) {
              return '<button class="list-row" data-act="go" data-arg=\'' + App.arg({ v: 'coding_tech', p: { n: x.n } }) + '\'>' +
                '<span class="li-ic" style="background:color-mix(in srgb,' + grp.c + ' 16%, transparent);color:' + grp.c +
                '"><span data-icon="' + grp.ic + '" data-icon-size="15"></span></span>' +
                '<div class="li-main"><div class="li-title">' + App.esc(x.n) + '</div>' +
                '<div class="li-sub">' + App.esc(x.r) + '</div></div>' +
                '<span class="li-chev" data-icon="arrowLeft" data-icon-size="16" style="transform:rotate(180deg)"></span></button>';
            }).join('');
        });

        App.el('tc-count').textContent = q ? total + ' ta topildi' : total + ' ta texnologiya';
        box.innerHTML = html || App.empty({ icon: 'code', title: 'Topilmadi', text: 'Boshqa so\'z bilan qidiring.' });
        App.icons(box);
      }
      App.el('tc-q').oninput = render;
      render();
    }
  });

  App.view('coding_tech', {
    nav: 'coding',
    render: function (page, params) {
      var found = findTech(params.n);
      if (!found) { App.go('coding'); return; }
      var x = found.t, g = found.g;

      page.innerHTML = techHeader(x.n, 'coding') +
        '<div class="tc-hero" style="background:color-mix(in srgb,' + g.c + ' 12%, transparent)">' +
        '<span class="tc-hero-ic" style="background:color-mix(in srgb,' + g.c + ' 20%, transparent);color:' + g.c + '">' +
        '<span data-icon="' + g.ic + '" data-icon-size="24"></span></span>' +
        '<div class="tc-hero-r">' + App.esc(x.r) + '</div>' +
        '<div class="tc-hero-g">' + App.esc(g.g) + '</div></div>' +

        '<div class="list-label">Nima qiladi</div>' +
        '<p style="font-size:14.5px;line-height:1.65;margin:0 1px 10px">' + mdBold(x.d) + '</p>' +

        '<div class="list-label">Qayerda ishlatiladi</div>' +
        '<div class="flex" style="flex-wrap:wrap;gap:7px;margin-bottom:8px">' +
        x.u.split(',').map(function (t) {
          return '<span class="chip-btn" style="pointer-events:none">' + App.esc(t.trim()) + '</span>';
        }).join('') + '</div>' +

        '<div class="list-label">Shu guruhdagi boshqalar</div>' +
        g.items.filter(function (o) { return o.n !== x.n; }).map(function (o) {
          return '<button class="list-row" data-act="go" data-arg=\'' + App.arg({ v: 'coding_tech', p: { n: o.n } }) + '\'>' +
            '<div class="li-main"><div class="li-title">' + App.esc(o.n) + '</div>' +
            '<div class="li-sub">' + App.esc(o.r) + '</div></div>' +
            '<span class="li-chev" data-icon="arrowLeft" data-icon-size="16" style="transform:rotate(180deg)"></span></button>';
        }).join('');
      App.icons(page);
    }
  });

  /* Matn ichidagi **qalin** belgilarini ajratadi (boshqa HTML kirmaydi — avval esc qilinadi) */
  function mdBold(s) {
    return App.esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');
  }
})();
