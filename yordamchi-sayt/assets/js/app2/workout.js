/* Workout — TURNIK MAHORATI bosqichma-bosqich.
 *
 * Osondan qiyinga qarab tuzilgan yo'l xaritasi: har bir ko'nikma o'zidan
 * oldingisini talab qiladi, shuning uchun tartibni buzib "muscle-up"ga
 * sakrab bo'lmaydi — u qulflangan turadi.
 *
 * Har ko'nikmada:
 *   - MAQSAD        — nimaga erishilsa o'zlashtirilgan hisoblanadi
 *   - BAZAVIY KUCH  — shu ko'nikmaga kirishdan oldin kerak bo'lgan kuch
 *                     (masalan 6 ta tortilish, 10 ta brus, 30 ta ajimaniya)
 *   - VIDEO         — YouTube darsligi (ID lar tekshirilgan, jonli)
 *   - TEXNIKA       — bajarish tartibi va tipik xatolar
 *
 * Rasm sifatida YouTube'ning O'Z old ko'rinishi ishlatiladi
 * (img.youtube.com/vi/<id>/hqdefault.jpg): u har doim aynan o'sha
 * mashqni ko'rsatadi va videoning o'zi bilan bir joydan keladi.
 */
(function () {
  'use strict';

  var DONE_KEY = 'workout_done_v1';

  function doneList() {
    try { var v = JSON.parse(localStorage.getItem(DONE_KEY) || '[]'); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function saveDone(a) { try { localStorage.setItem(DONE_KEY, JSON.stringify(a)); } catch (e) {} }
  function isDone(id) { return doneList().indexOf(id) >= 0; }

  var LEVELS = [
    { n: 1, t: 'Poydevor',        s: 'Turnikka hali tortila olmasangiz — shu yerdan',  c: 'var(--success)' },
    { n: 2, t: 'Birinchi tortilish', s: 'Toza tortilish va uni ko\'paytirish',          c: 'var(--accent)' },
    { n: 3, t: 'Kuch va hajm',    s: 'Takrorni oshirish, qorin va portlovchi kuch',     c: 'var(--warn)' },
    { n: 4, t: 'Mahorat',         s: 'Muscle-up va front lever',                        c: 'var(--coral)' }
  ];

  /* `need` — oldin o'zlashtirilishi shart bo'lgan ko'nikmalar.
     `base` — bazaviy kuch talabi (chip sifatida ko'rsatiladi). */
  var SKILLS = [
    {
      id: 'hang', lvl: 1, n: 'Osilib turish', en: 'Dead hang',
      goal: '3 × 30 soniya', need: [], base: [],
      yt: 'OT-wTpxP9uo',
      md: "**Nima beradi:** panja kuchi, yelka barqarorligi, umurtqani cho'zish. Turnikdagi HAMMA narsa shundan boshlanadi.\n\n" +
        "## Bajarish\n" +
        "1. Turnikni yelka kengligida, panja ustidan ushlang (kaft o'zingizdan tashqariga).\n" +
        "2. Bosh barmoqni turnik atrofiga o'rang — \"maymun ushlash\" emas.\n" +
        "3. Osiling, lekin **yelkani quloqqa yopishtirmang** — yelkani pastga torting.\n" +
        "4. Tanani tebranishdan to'xtating, qorinni siqing.\n" +
        "5. Bir tekis nafas oling.\n\n" +
        "## Tipik xatolar\n" +
        "- Yelkani bo'sh tashlash (butunlay osilib qolish) — yelka bo'g'imiga zarar\n" +
        "- Bosh barmoqni turnik ustida qoldirish — panja tez charchaydi\n" +
        "- Tebranib turish\n\n" +
        "> **Maslahat:** 30 soniya chiqmasa 3 × 10 dan boshlang, har hafta 5 soniya qo'shing. Panja kuchi tortilishdan oldin kerak."
    },
    {
      id: 'aussie', lvl: 1, n: 'Avstraliya tortilishi', en: 'Australian pull-up / inverted row',
      goal: '3 × 10 marta', need: ['hang'],
      base: [{ n: 'Osilib turish', v: '30 s' }],
      yt: '5Vy6mjhXg7s',
      md: "**Nima beradi:** tortilishning yengillashtirilgan shakli — orqa va bitsepsni tortilishga tayyorlaydi.\n\n" +
        "## Bajarish\n" +
        "1. Past turnik (ko'krak balandligida) toping.\n" +
        "2. Osiling, tovon yerda, tana **to'g'ri chiziq** — dumbani solintirmang.\n" +
        "3. Ko'krakni turnikga tortib keling.\n" +
        "4. Kurak suyaklarini bir-biriga siqing.\n" +
        "5. Sekin tushing.\n\n" +
        "## Tipik xatolar\n" +
        "- Chanoqni pastga solintirish\n" +
        "- Faqat qo'l bilan tortish, kurakni ishlatmaslik\n" +
        "- Yarim amplituda\n\n" +
        "> **Maslahat:** Og'irlashtirish uchun oyoqni balandroq joyga qo'ying — tana gorizontalga yaqinlashgani sari qiyinlashadi."
    },
    {
      id: 'negative', lvl: 1, n: 'Negativ tortilish', en: 'Negative pull-up',
      goal: '3 × 5 marta (har biri 3+ soniya)', need: ['aussie'],
      base: [{ n: 'Avstraliya', v: '10 ta' }, { n: 'Osilib turish', v: '30 s' }],
      yt: 'AGif4eaO1f8',
      md: "**Nima beradi:** birinchi tortilishga eng tez olib boradigan mashq. Mushak tushish paytida ham (eksentrik) kuchayadi.\n\n" +
        "## Bajarish\n" +
        "1. Stul yoki sakrash yordamida **yuqori** holatga chiqing (iyak turnik ustida).\n" +
        "2. Shu holatda bir soniya turing.\n" +
        "3. **Juda sekin** tushing — kamida 3 soniya, imkoni bo'lsa 5.\n" +
        "4. Pastda to'liq cho'zilib, keyin yana yuqoriga chiqing.\n\n" +
        "## Tipik xatolar\n" +
        "- Tez tushish (butun foyda shu sekinlikda)\n" +
        "- Pastda to'liq cho'zilmaslik\n" +
        "- Charchaganda tashlab yuborish — bu jarohat yo'li\n\n" +
        "> **Maslahat:** Haftada 3 marta. 5 ta × 5 soniya chiqsa — birinchi tortilishingiz tayyor."
    },

    {
      id: 'pullup', lvl: 2, n: 'Klassik tortilish', en: 'Pull-up',
      goal: '3 × 5 marta (toza)', need: ['negative'],
      base: [{ n: 'Negativ', v: '5 × 3 s' }],
      yt: 'CdtrfXK7bcg',
      md: "**Nima beradi:** turnikning asosiy mashqi — keng orqa mushagi, bitseps, panja.\n\n" +
        "## Bajarish\n" +
        "1. To'liq osilgan holatdan boshlang (qo'l tekis).\n" +
        "2. Kurakni pastga va orqaga torting — harakat **shundan** boshlanadi.\n" +
        "3. Ko'krakni turnikga qarab torting, tirsakni yon-pastga yo'naltiring.\n" +
        "4. Iyak turnikdan **oshsin**.\n" +
        "5. Nazorat bilan to'liq pastga tushing.\n\n" +
        "## Tipik xatolar\n" +
        "- Tebranib (kipping) ko'tarilish\n" +
        "- Yarim amplituda — iyak yetmaydi yoki pastda cho'zilmaydi\n" +
        "- Iyakni cho'zib \"aldash\"\n" +
        "- Nafasni butunlay ushlab qolish\n\n" +
        "> **Maslahat:** 5 ta toza tortilish 15 ta yarim tortilishdan qimmatliroq. Sifatni tezlikka almashtirmang."
    },
    {
      id: 'chinup', lvl: 2, n: 'Teskari ushlash tortilish', en: 'Chin-up',
      goal: '3 × 8 marta', need: ['pullup'],
      base: [{ n: 'Tortilish', v: '3 ta' }],
      yt: 'tB3X4TjTIes',
      md: "**Nima beradi:** bitsepsga ko'proq yuk tushadi, shuning uchun klassikdan osonroq — takrorni oshirishga yaxshi.\n\n" +
        "## Bajarish\n" +
        "1. Turnikni **pastdan** ushlang (kaft o'zingizga qaragan), yelka kengligida.\n" +
        "2. Kurakni pastga torting.\n" +
        "3. Tirsakni tanaga yaqin tutib yuqoriga torting.\n" +
        "4. Iyak turnikdan oshsin, sekin tushing.\n\n" +
        "## Tipik xatolar\n" +
        "- Tirsakni yon tomonga ochib yuborish\n" +
        "- Belni orqaga qattiq egish\n" +
        "- Yelkani ko'tarib qolish\n\n" +
        "> **Maslahat:** Klassik tortilish ko'paymay qolsa, bir necha hafta teskari ushlashga o'ting — umumiy kuch oshadi."
    },
    {
      id: 'kneeraise', lvl: 2, n: 'Osilib tizza ko\'tarish', en: 'Hanging knee raise',
      goal: '3 × 10 marta', need: ['hang'],
      base: [{ n: 'Osilib turish', v: '30 s' }],
      yt: 'p9hhX_Sx5v0',
      md: "**Nima beradi:** pastki qorin va panja. Front lever va muscle-up uchun poydevor.\n\n" +
        "## Bajarish\n" +
        "1. Turnikda osiling, tebranishni to'xtating.\n" +
        "2. Tizzani ko'krakka torting — **beldan emas, qorindan**.\n" +
        "3. Yuqorida chanoqni biroz yuqoriga buring (qorin shunda ishlaydi).\n" +
        "4. Sekin tushiring, tebranishga yo'l qo'ymang.\n\n" +
        "## Tipik xatolar\n" +
        "- Tebranib inersiya bilan ko'tarish\n" +
        "- Faqat sonni ishlatib qorinni qo'shmaslik\n" +
        "- Pastga tashlab yuborish\n\n" +
        "> **Maslahat:** Tebranishni to'xtatolmasangiz — bir oyoqni devorga tegizib turing yoki sherikdan chanog'ingizni ushlab turishini so'rang."
    },

    {
      id: 'pullup10', lvl: 3, n: '10 ta tortilish', en: '10 clean pull-ups',
      goal: 'Bir yondan 10 marta', need: ['pullup', 'chinup'],
      base: [{ n: 'Tortilish', v: '5 ta' }, { n: 'Teskari ushlash', v: '8 ta' }],
      yt: 'Hyrk8sSHTkk',
      md: "**Nima beradi:** 10 ta — mahorat elementlariga (muscle-up, front lever) kirish chegarasi.\n\n" +
        "## Qanday yetiladi\n" +
        "1. **Piramida:** 1-2-3-4-3-2-1 takror, orasida 60 s dam.\n" +
        "2. **Grease the groove:** kun davomida bir necha marta maksimalning yarmicha bajaring, hech qachon charchamaguncha emas.\n" +
        "3. Haftada 3 marta, ketma-ket kun emas.\n" +
        "4. Har hafta jami takrorni ~10% oshiring.\n\n" +
        "## Tipik xatolar\n" +
        "- Har kuni maksimalgacha ishlash — o'sish to'xtaydi\n" +
        "- Dam olishni qisqartirish (kuch uchun 2-3 daqiqa kerak)\n" +
        "- Uyquni va ovqatni hisobga olmaslik\n\n" +
        "> **Maslahat:** Kuch mashqda emas, DAM OLISHDA o'sadi. Haftada 3 kun yetarli."
    },
    {
      id: 'legraise', lvl: 3, n: 'Osilib to\'g\'ri oyoq ko\'tarish', en: 'Hanging leg raise',
      goal: '3 × 8 marta (oyoq tekis)', need: ['kneeraise'],
      base: [{ n: 'Tizza ko\'tarish', v: '10 ta' }],
      yt: 'EYe6dc_i4L0',
      md: "**Nima beradi:** qorinning eng kuchli mashqlaridan; front lever uchun shart.\n\n" +
        "## Bajarish\n" +
        "1. Osiling, yelkani pastga torting.\n" +
        "2. Oyoqni **tekis** holda gorizontalgacha ko'taring.\n" +
        "3. Yuqorida chanoqni yuqoriga buring.\n" +
        "4. Sekin tushiring — pastda tebranmang.\n\n" +
        "## Tipik xatolar\n" +
        "- Tizzani bukib \"aldash\"\n" +
        "- Tebranish hisobiga ko'tarish\n" +
        "- Nafasni ushlash\n\n" +
        "> **Maslahat:** Tekis oyoq og'ir kelsa oraliq bosqich: yarim bukilgan tizza bilan bajaring, asta-sekin ochib boring."
    },
    {
      id: 'explosive', lvl: 3, n: 'Portlovchi tortilish', en: 'Explosive pull-up',
      goal: '3 × 5 marta (ko\'krak turnikgacha)', need: ['pullup10'],
      base: [{ n: 'Tortilish', v: '10 ta' }],
      yt: 'XeErfmGSwfE',
      md: "**Nima beradi:** muscle-up uchun kerak bo'lgan tezlik va balandlik.\n\n" +
        "## Bajarish\n" +
        "1. To'liq osilgan holatdan boshlang.\n" +
        "2. **Maksimal tezlikda** yuqoriga torting.\n" +
        "3. Maqsad — turnik ko'krakning pastki qismiga tegsin (iyak emas).\n" +
        "4. Nazorat bilan tushing, keyingi takrorga tayyorlaning.\n\n" +
        "## Tipik xatolar\n" +
        "- Charchagan holda bajarish — tezlik yo'qoladi, mashq ma'nosini yo'qotadi\n" +
        "- Ko'p takror qilish (bu kuch emas, tezlik mashqi)\n" +
        "- Oyoq bilan qattiq tepish\n\n" +
        "> **Maslahat:** Har set 3-5 takrordan oshmasin va oralig'ida to'liq dam oling. Tezlik charchaganda o'rganilmaydi."
    },

    {
      id: 'muscleup', lvl: 4, n: 'Muscle-up', en: 'Bar muscle-up',
      goal: '1 toza takror', need: ['explosive'],
      base: [{ n: 'Tortilish', v: '10 ta' }, { n: 'Brus', v: '10 ta' }, { n: 'Portlovchi', v: '5 ta' }],
      yt: 'OB-AFDYNXAc',
      md: "**Nima beradi:** turnikning eng mashhur elementi — tortilish va brus bir harakatda.\n\n" +
        "## Bajarish\n" +
        "1. Turnikni **ustidan mahkam** ushlang, bosh barmoq turnik ustida bo'lsa o'tish osonroq.\n" +
        "2. Portlovchi tortilish qiling — ko'krak turnikgacha.\n" +
        "3. Eng yuqori nuqtada tanani **oldinga** tashlang va bilakni turnik ustiga aylantiring.\n" +
        "4. Tirsakni to'g'irlab yuqoriga turing (brus qismi).\n" +
        "5. Nazorat bilan qaytib tushing.\n\n" +
        "## Tipik xatolar\n" +
        "- Yetarli balandlikka chiqmaslik — o'tish nuqtasi yetmaydi\n" +
        "- O'tish paytida ikkilanish (tez bo'lishi kerak)\n" +
        "- Faqat qo'l kuchi bilan urinish\n" +
        "- Yelka isitilmagan holda urinish\n\n" +
        "> **Maslahat:** Avval past turnikda oyoq yordami bilan o'tish harakatini o'rganing. Harakat yo'li o'rnashgach kuch qo'shiladi.\n\n" +
        "> **Diqqat:** Yelka bo'g'imiga katta yuk tushadi — yaxshilab isining va og'riq sezsangiz to'xtang."
    },
    {
      id: 'tuckfl', lvl: 4, n: 'Tuck front lever', en: 'Tuck front lever',
      goal: '3 × 15 soniya', need: ['legraise', 'pullup10'],
      base: [{ n: 'Tortilish', v: '10 ta' }, { n: 'Oyoq ko\'tarish', v: '8 ta' }],
      yt: 'BwhZYpIdhro',
      md: "**Nima beradi:** front leverga birinchi haqiqiy qadam. Orqa, qorin va yelka birga ishlaydi.\n\n" +
        "## Bajarish\n" +
        "1. Turnikda osiling, qo'l tekis.\n" +
        "2. Kurakni pastga va orqaga torting (**kurak depressiyasi** — eng muhim qism).\n" +
        "3. Tizzani ko'krakka yig'ib, chanoqni yuqoriga aylantiring.\n" +
        "4. Orqangiz yerga parallel bo'lsin, tizza ko'krakda.\n" +
        "5. Nafasni ushlamasdan turing.\n\n" +
        "## Tipik xatolar\n" +
        "- Tirsakni bukish (bu boshqa mashq bo'lib qoladi)\n" +
        "- Kurakni ishlatmaslik — orqa bo'shashib qoladi\n" +
        "- Belni egib chanoqni tushirib qo'yish\n\n" +
        "> **Maslahat:** Qo'l tekis qolishiga alohida e'tibor bering. Tirsak bukilsa yuk orqadan bitsepsga o'tadi."
    },
    {
      id: 'frontlever', lvl: 4, n: 'To\'liq front lever', en: 'Full front lever',
      goal: '3 soniya (tana to\'liq gorizontal)', need: ['tuckfl'],
      base: [{ n: 'Tuck front lever', v: '15 s' }, { n: 'Tortilish', v: '12 ta' }],
      yt: '5g8-sj-8snc',
      md: "**Nima beradi:** turnikdagi eng nufuzli statik elementlardan biri.\n\n" +
        "## Bosqichlar (shu tartibda)\n" +
        "1. **Tuck** — tizza ko'krakda (15 s)\n" +
        "2. **Advanced tuck** — orqa gorizontal, tizza 90° (15 s)\n" +
        "3. **Bir oyoq** — bittasi tekis, ikkinchisi bukilgan (10 s)\n" +
        "4. **Straddle** — oyoq ochiq va tekis (10 s)\n" +
        "5. **Full** — oyoq birga va tekis\n\n" +
        "## Tipik xatolar\n" +
        "- Bosqichni tashlab ketish — eng ko'p uchraydigan xato\n" +
        "- Qo'lni bukish\n" +
        "- Chanoqni tushirib yuborish (tana \"banan\" bo'ladi)\n\n" +
        "> **Maslahat:** Bu bir necha OY lik ish. Har bosqichda 15 soniya barqaror ushlamaguncha keyingisiga o'tmang — shoshilish jarohatga olib keladi."
    }
  ];

  function skill(id) { return SKILLS.find(function (s) { return s.id === id; }); }
  function ytThumb(id) { return 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg'; }
  function ytLink(id) { return 'https://www.youtube.com/watch?v=' + id; }

  /* Ko'nikma OCHIQmi — barcha talab qilinganlari o'zlashtirilgan bo'lsa. */
  function unlocked(s) {
    return (s.need || []).every(function (n) { return isDone(n); });
  }

  /* =========================================================
     VIEW: workout — yo'l xaritasi
     ========================================================= */
  App.view('workout', {
    nav: 'sport',                     // Sport bo'limining ichki sahifasi
    render: function (page) {
      var done = doneList().filter(function (id) { return !!skill(id); });
      var pct = Math.round((done.length / SKILLS.length) * 100);

      var html =
        '<div class="topbar" style="margin:-16px -15px 12px">' +
        '<button class="icon-btn ghost" data-act="go" data-arg=\'{"v":"sport"}\'>' +
        '<span data-icon="arrowLeft" data-icon-size="20"></span></button>' +
        '<h1>Workout</h1>' +
        '<div style="flex:1"></div>' +
        '<span class="muted" style="font-size:12px;font-weight:700;font-family:var(--mono)">' +
        done.length + ' / ' + SKILLS.length + '</span></div>' +

        '<div class="wk-intro">' +
        '<b>Turnik mahorati — bosqichma-bosqich</b>' +
        '<p>Osondan qiyinga. Har bir ko\'nikma o\'zidan oldingisini talab qiladi — ' +
        'tartibni buzmang, aks holda jarohat xavfi ortadi.</p>' +
        '<div class="wk-prog"><i style="width:' + pct + '%"></i></div>' +
        '</div>';

      LEVELS.forEach(function (L) {
        var list = SKILLS.filter(function (s) { return s.lvl === L.n; });
        var ldone = list.filter(function (s) { return isDone(s.id); }).length;
        html += '<div class="wk-lvl" style="--wk-c:' + L.c + '">' +
          '<div class="wk-lvl-h"><span class="wk-lvl-n">' + L.n + '</span>' +
          '<div><b>' + App.esc(L.t) + '</b><span>' + App.esc(L.s) + '</span></div>' +
          '<span class="wk-lvl-c">' + ldone + '/' + list.length + '</span></div>';

        html += list.map(function (s) {
          var d = isDone(s.id), open = unlocked(s);
          var need = (s.need || []).filter(function (n) { return !isDone(n); })
            .map(function (n) { var x = skill(n); return x ? x.n : n; });
          return '<button class="wk-row' + (d ? ' done' : '') + (open ? '' : ' lock') + '"' +
            ' data-act="go" data-arg=\'' + App.arg({ v: 'workout_skill', p: { id: s.id } }) + '\'>' +
            '<span class="wk-th"><img src="' + ytThumb(s.yt) + '" alt="" loading="lazy">' +
            (d ? '<i class="wk-tick" data-icon="check" data-icon-size="14"></i>' : '') +
            (open ? '' : '<i class="wk-lockic" data-icon="lock" data-icon-size="15"></i>') +
            '</span>' +
            '<span class="wk-main">' +
            '<span class="wk-n">' + App.esc(s.n) + '</span>' +
            '<span class="wk-en">' + App.esc(s.en) + '</span>' +
            '<span class="wk-goal">' + App.esc(open ? s.goal : ('Avval: ' + need.join(', '))) + '</span>' +
            '</span>' +
            '<span class="wk-chev" data-icon="arrowLeft" data-icon-size="16" style="transform:rotate(180deg)"></span>' +
            '</button>';
        }).join('');
        html += '</div>';
      });

      page.innerHTML = html;
      App.icons(page);
    }
  });

  /* =========================================================
     VIEW: workout_skill — bitta ko'nikma
     ========================================================= */
  App.view('workout_skill', {
    nav: 'sport',
    render: function (page, params) {
      var s = skill(params.id);
      if (!s) { App.go('workout'); return; }
      var d = isDone(s.id), open = unlocked(s);
      var lvl = LEVELS.find(function (L) { return L.n === s.lvl; }) || LEVELS[0];

      var lockNote = '';
      if (!open) {
        var need = (s.need || []).filter(function (n) { return !isDone(n); })
          .map(function (n) { var x = skill(n); return x ? x.n : n; });
        lockNote = '<div class="wk-locknote"><span data-icon="lock" data-icon-size="15"></span>' +
          '<div>Bu ko\'nikma hali qulflangan.<br><b>Avval o\'zlashtiring:</b> ' +
          App.esc(need.join(', ')) + '</div></div>';
      }

      var baseHtml = (s.base && s.base.length)
        ? '<div class="list-label">Bazaviy kuch</div><div class="wk-base">' +
          s.base.map(function (b) {
            return '<span class="wk-chip"><b>' + App.esc(b.v) + '</b>' + App.esc(b.n) + '</span>';
          }).join('') + '</div>'
        : '';

      page.innerHTML =
        '<div class="topbar" style="margin:-16px -15px 12px">' +
        '<button class="icon-btn ghost" data-act="go" data-arg=\'{"v":"workout"}\'>' +
        '<span data-icon="arrowLeft" data-icon-size="20"></span></button>' +
        '<h1>' + App.esc(s.n) + '</h1></div>' +

        '<div class="wk-badge" style="--wk-c:' + lvl.c + '">' + s.lvl + '-bosqich · ' + App.esc(lvl.t) + '</div>' +

        /* Video — bosilgunicha faqat old ko'rinish, YouTube yuklanmaydi */
        '<div class="wk-video" id="wk-video" data-yt="' + s.yt + '">' +
        '<img src="' + ytThumb(s.yt) + '" alt="" loading="lazy">' +
        '<button class="wk-play" data-act="wkPlay" aria-label="Videoni ochish">' +
        '<span data-icon="play" data-icon-size="26"></span></button>' +
        '</div>' +
        '<a class="wk-ytlink" href="' + ytLink(s.yt) + '" target="_blank" rel="noopener">' +
        'YouTube\'da ochish</a>' +

        lockNote +

        '<div class="wk-goalbox"><span data-icon="trophy" data-icon-size="16"></span>' +
        '<div><span>Maqsad</span><b>' + App.esc(s.goal) + '</b></div></div>' +

        baseHtml +

        '<div class="list-label">Texnika</div>' +
        '<div class="md-content">' + App.md(s.md) + '</div>' +

        '<button class="btn' + (d ? ' sec' : '') + '" style="margin-top:18px" data-act="wkToggle" ' +
        'data-arg=\'' + App.arg({ id: s.id }) + '\'>' +
        (d ? '✓ O\'zlashtirilgan — bekor qilish' : 'O\'zlashtirdim') + '</button>';

      App.icons(page);
    }
  });

  /* Videoni bosilganda yuklaymiz — sahifa ochilishida YouTube so'ralmaydi
     (tezlik va maxfiylik uchun). */
  App.actions.wkPlay = function () {
    var box = App.el('wk-video'); if (!box) return;
    var id = box.getAttribute('data-yt');
    box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1" ' +
      'title="Video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; ' +
      'encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
    box.classList.add('playing');
  };

  /* Sport bo'limidagi "Workout" plitkasi shu yerdan o'z holatini oladi
     (sport.js chizadi — Workout alohida bo'lim emas, Sport ichida). */
  window.Workout = {
    progress: function () {
      var d = doneList().filter(function (id) { return !!skill(id); });
      return { done: d.length, total: SKILLS.length };
    }
  };

  App.actions.wkToggle = function (a) {
    var list = doneList();
    var i = list.indexOf(a.id);
    if (i >= 0) list.splice(i, 1); else list.push(a.id);
    saveDone(list);

    /* O'zlashtirilgan ko'nikma Faoliyat jurnaliga ham tushsin —
       Tarix va Statistikada ko'rinadi (sport.js bilan bir xil yo'l). */
    if (i < 0) {
      var s = skill(a.id);
      if (s) {
        App.call('log_activity', {
          section: 'sport', object: s.n, amount: 1, unit: 'ko\'nikma',
          meta: { kind: 'workout', level: s.lvl }
        }).catch(function () {});
      }
      App.toast('✅ O\'zlashtirildi!');
    }
    App.reload();
  };
})();
