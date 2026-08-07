/* Workout — TURNIKDA BAJARILADIGAN ELEMENTLAR.
 *
 * Ro'yxat foydalanuvchi bergan 10 ta klassik turnik elementi (rus
 * atamalari bilan — voraut muhitida shu nomlar ishlatiladi). Tartib
 * ataylab o'zgartirilmagan: osondan qiyinga qarab boradi.
 *
 * Ko'rinishi ATAYLAB Sport bo'limidagi mashqlar ro'yxati bilan bir xil:
 * chapda rasm, o'rtada nom va qisqa ma'lumot, o'ngda "bajardim" belgisi.
 *
 * Rasm sifatida YouTube darsligining O'Z old ko'rinishi ishlatiladi
 * (img.youtube.com/vi/<id>/hqdefault.jpg) — u har doim aynan o'sha
 * elementni ko'rsatadi va video bilan bir manbadan keladi.
 * Barcha video ID lari oEmbed orqali BITTALAB tekshirilgan.
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

  var LVL = {
    1: { n: 'Oson', c: 'var(--success)' },
    2: { n: 'O\'rta', c: 'var(--warn)' },
    3: { n: 'Qiyin', c: 'var(--danger)' }
  };

  /* `base` — elementga kirishdan oldin kerak bo'lgan kuch (chip bo'lib
     ko'rinadi). `yt` — tekshirilgan YouTube darsligi. */
  var SKILLS = [
    {
      id: 'detskiy', n: 'Bolalar chiqishi', ru: 'ДЕТСКИЙ ВЫХОД', lvl: 1,
      goal: '1 toza takror',
      base: [{ n: 'Tortilish', v: '8 ta' }, { n: 'Brus', v: '8 ta' }],
      yt: 'gdShAAess9g',
      md: "**Nima beradi:** kuch bilan chiqishga (выход силой) birinchi qadam. " +
        "Ikkala qo'l birdan emas, NAVBAT bilan turnik ustiga o'tadi — shuning uchun " +
        "ancha yengil. Xalq orasida \"сплошные мучения\" deb ham ataladi, chunki " +
        "texnikasi qo'pol ko'rinadi.\n\n" +
        "## Bajarish\n" +
        "1. Turnikni ustidan, yelka kengligida ushlang. Bosh barmoq turnik ustida bo'lsa o'tish osonroq.\n" +
        "2. Tanani biroz silkitib, kuchli tortiling — ko'krak turnikga yaqinlashsin.\n" +
        "3. Eng yuqori nuqtada BIR qo'lni turnik ustiga chiqaring (tirsakni aylantiring).\n" +
        "4. O'sha qo'lga tayanib, ikkinchi qo'lni ham chiqaring.\n" +
        "5. Ikkala tirsakni to'g'irlab, upor holatiga turing.\n\n" +
        "## Tipik xatolar\n" +
        "- Juda kam balandlikka chiqish — qo'l o'tishga joy topmaydi\n" +
        "- Oyoq bilan haddan tashqari tepish (element umuman yo'qoladi)\n" +
        "- Yelka isitilmagan holda urinish\n\n" +
        "> **Maslahat:** Bu — o'rganish bosqichi, yakuniy maqsad emas. Harakat yo'li " +
        "o'rnashgach `ВЫХОД СИЛОЙ` ga o'ting va navbat bilan emas, IKKALA qo'lni " +
        "birga chiqarishga harakat qiling."
    },
    {
      id: 'perevorot', n: 'Ag\'darilib ko\'tarilish', ru: 'ПОДЪЁМ ПЕРЕВОРОТОМ', lvl: 1,
      goal: '3 × 3 takror',
      base: [{ n: 'Tortilish', v: '5 ta' }, { n: 'Oyoq ko\'tarish', v: '8 ta' }],
      yt: 'IsFtu8z9poU',
      md: "**Nima beradi:** turnikning eng klassik elementi — maktab dasturidan. " +
        "Qorin, orqa va panja birga ishlaydi; keyingi elementlarning ko'pi shu " +
        "harakat tuyg'usiga tayanadi.\n\n" +
        "## Bajarish\n" +
        "1. Turnikda osiling, qo'l yelka kengligidan biroz kengroq.\n" +
        "2. Bir vaqtda TORTILING va oyoqni yuqoriga — turnik OSHIB o'tadigan qilib — ko'taring.\n" +
        "3. Chanoqni turnikga yaqin tuting: qanchalik yaqin bo'lsa, aylanish shuncha yengil.\n" +
        "4. Oyoq turnikdan o'tgach tanani aylantiring va upor holatiga chiqing.\n" +
        "5. Nazorat bilan orqaga qaytib osiling.\n\n" +
        "## Tipik xatolar\n" +
        "- Oyoqni oldin ko'tarib, keyin tortilish (ikkisi BIRGA bo'lishi kerak)\n" +
        "- Chanoqni turnikdan uzoq tutish — aylanishga kuch yetmaydi\n" +
        "- Boshni orqaga tashlash\n\n" +
        "> **Maslahat:** Boshlashda past turnikdan foydalaning — oyoq yerga tegib " +
        "turadi va qo'rquv yo'qoladi."
    },
    {
      id: 'vihod-siloy', n: 'Kuch bilan chiqish', ru: 'ВЫХОД СИЛОЙ', lvl: 2,
      goal: '1 toza takror (silkinishsiz)',
      base: [{ n: 'Tortilish', v: '12 ta' }, { n: 'Brus', v: '15 ta' }, { n: 'Bolalar chiqishi', v: '5 ta' }],
      yt: '3ZknAy2Zjuo',
      md: "**Nima beradi:** turnikning eng mashhur elementi. Tortilish va brus " +
        "BIR harakatda birlashadi.\n\n" +
        "## Bajarish\n" +
        "1. Turnikni MAHKAM ushlang (bosh barmoq ustida).\n" +
        "2. Portlovchi tortilish qiling — turnik KO'KRAKNING pastigacha kelsin, iyakgacha emas.\n" +
        "3. Eng yuqori nuqtada tanani oldinga tashlang va bilakni turnik ustiga AYLANTIRING.\n" +
        "4. Tirsakni to'g'irlab yuqoriga turing (brus qismi).\n" +
        "5. Nazorat bilan qaytib tushing.\n\n" +
        "## Tipik xatolar\n" +
        "- Yetarli balandlikka chiqmaslik — o'tish nuqtasi yetmaydi\n" +
        "- O'tish paytida ikkilanish (harakat TEZ bo'lishi kerak)\n" +
        "- Faqat qo'l kuchiga tayanish\n\n" +
        "> **Diqqat:** Yelka bo'g'imiga katta yuk tushadi. Yaxshilab isining va " +
        "og'riq sezsangiz darhol to'xtang."
    },
    {
      id: 'sklepka', n: 'Yozilib ko\'tarilish', ru: 'ПОДЪЁМ РАЗГИБОМ (СКЛЁПКА)', lvl: 2,
      goal: '3 toza takror',
      base: [{ n: 'Oyoq ko\'tarish', v: '10 ta' }, { n: 'Tortilish', v: '8 ta' }],
      yt: 'u__tT8654Mg',
      md: "**Nima beradi:** gimnastik element. Kuch emas, TEXNIKA va vaqt " +
        "(timing) hal qiladi — shuning uchun kuchi kam bo'lsa ham o'rganish mumkin.\n\n" +
        "## Bajarish\n" +
        "1. Osilgan holatda oyoqni turnikga yaqin olib keling (deyarli tegizib).\n" +
        "2. Chanoqni pastga tushirayotgandek qilib, oyoqni OLDINGA va YUQORIGA keskin yozing.\n" +
        "3. Ayni o'sha lahzada qo'l bilan turnikni PASTGA bosing.\n" +
        "4. Tana turnik ustiga chiqadi — upor holatida tugating.\n\n" +
        "## Tipik xatolar\n" +
        "- Yozish va bosishni ALOHIDA qilish (ikkisi bir vaqtda bo'lishi shart)\n" +
        "- Oyoqni yetarlicha yuqoriga olib bormaslik\n" +
        "- Qo'lni bukib qolish — turnikni pastga bosish yo'qoladi\n\n" +
        "> **Maslahat:** Bu elementda kuch emas, ANIQ LAHZA muhim. Sekin " +
        "bajarib bo'lmaydi — bir zarb bilan qilinadi."
    },
    {
      id: 'kapitanskiy', n: 'Kapitan ko\'tarilishi', ru: 'КАПИТАНСКИЙ ПОДЪЁМ', lvl: 2,
      goal: '3 takror',
      base: [{ n: 'Tortilish', v: '10 ta' }, { n: 'Ag\'darilib ko\'tarilish', v: '3 ta' }],
      yt: '_qu9VvYYKKY',
      md: "**Nima beradi:** ag'darilib ko'tarilish bilan chiqishning oralig'idagi " +
        "element. Bir qo'l tayanch, ikkinchisi aylantiruvchi bo'lib ishlaydi.\n\n" +
        "## Bajarish\n" +
        "1. Osiling, tortilishni boshlang.\n" +
        "2. Tanani BIR tomonga biroz burang — o'sha tomondagi qo'l tayanch bo'ladi.\n" +
        "3. Tayanch qo'lga og'irlikni berib, ikkinchi qo'lni turnik ustiga olib chiqing.\n" +
        "4. Tanani aylantirib upor holatiga chiqing.\n\n" +
        "## Tipik xatolar\n" +
        "- Ikkala qo'lga teng yuk berishga urinish (element yo'qoladi)\n" +
        "- Tanani burmaslik\n" +
        "- Tayanch qo'lni bukib qo'yish\n\n" +
        "> **Maslahat:** Ikki tomonga ham o'rganing — bir tomonlama mashq " +
        "yelkalarni nomutanosib rivojlantiradi."
    },
    {
      id: 'basket-kip', n: 'Ikki oyoqlab ko\'tarilish', ru: 'ПОДЪЁМ ДВУМЯ (BASKET KIP)', lvl: 2,
      goal: '3 takror',
      base: [{ n: 'Yozilib ko\'tarilish', v: '3 ta' }, { n: 'Qorin', v: 'kuchli' }],
      yt: '0__Yu5qnkv8',
      md: "**Nima beradi:** silkinish energiyasini ko'tarilishga aylantirishni " +
        "o'rgatadi. Gimnastikada asosiy ko'nikmalardan.\n\n" +
        "## Bajarish\n" +
        "1. Osilgan holda yengil silkinish (mah) hosil qiling.\n" +
        "2. Oldinga silkinish oxirida oyoqni yig'ib, \"savat\" (basket) holatiga keling.\n" +
        "3. Orqaga qaytishda oyoqni keskin yozing va turnikni pastga bosing.\n" +
        "4. Tana turnik ustiga ko'tariladi.\n\n" +
        "## Tipik xatolar\n" +
        "- Silkinish juda kuchli — nazorat yo'qoladi\n" +
        "- Lahzani o'tkazib yuborish (kech yozish)\n" +
        "- Yelkani bo'sh qoldirish\n\n" +
        "> **Maslahat:** Avval `СКЛЁПКА` ni o'rganing — bu element o'shaning " +
        "silkinishli davomi."
    },
    {
      id: 'oficerskiy', n: 'Ofitser chiqishi', ru: 'ОФИЦЕРСКИЙ ВЫХОД', lvl: 3,
      goal: '3 takror (har ikki tomonga)',
      base: [{ n: 'Kuch bilan chiqish', v: '3 ta' }, { n: 'Tortilish', v: '12 ta' }],
      yt: '283MrPe5LxQ',
      md: "**Nima beradi:** kuch bilan chiqishning nazoratli, \"chiroyli\" shakli — " +
        "qo'llar navbat bilan, lekin SEKIN va toza o'tadi.\n\n" +
        "## Bajarish\n" +
        "1. Kuchli tortiling, ko'krakni turnikga yaqinlashtiring.\n" +
        "2. Bir qo'lni turnik ustiga NAZORAT bilan chiqaring — silkinishsiz.\n" +
        "3. Bir lahza shu holatda turing (aynan shu qism elementni ofitser qiladi).\n" +
        "4. Ikkinchi qo'lni ham chiqarib, upor holatiga turing.\n\n" +
        "## Tipik xatolar\n" +
        "- Silkinish bilan bajarish — u holda bu `детский выход` bo'lib qoladi\n" +
        "- Faqat bitta kuchli tomonga mashq qilish\n" +
        "- Yelkani oldinga cho'zib yuborish\n\n" +
        "> **Maslahat:** Farqi TEZLIKDA emas, NAZORATDA. Sekin bajarilsa ham " +
        "toza bo'lishi kerak."
    },
    {
      id: 'zamok', n: 'Orqaga silkinib ko\'tarilish', ru: 'ПОДЪЁМ МАХОМ НАЗАД (ЗАМОК)', lvl: 3,
      goal: '3 takror',
      base: [{ n: 'Ikki oyoqlab ko\'tarilish', v: '3 ta' }, { n: 'Upor', v: 'barqaror' }],
      yt: 'GvJe3MVk6tY',
      md: "**Nima beradi:** silkinishning ORQA nuqtasidan foydalanib ko'tarilish. " +
        "\"Замок\" (qulf) deb atalishiga sabab — tana turnik atrofida qulflanadi.\n\n" +
        "## Bajarish\n" +
        "1. Osilib silkinishni boshlang.\n" +
        "2. ORQAGA silkinishning eng yuqori nuqtasini kuting.\n" +
        "3. O'sha lahzada turnikni pastga bosib, chanoqni turnikga yaqinlashtiring.\n" +
        "4. Tana turnik ustiga chiqib, upor holatida qulflanadi.\n\n" +
        "## Tipik xatolar\n" +
        "- Oldinga silkinishda urinish (kuch teskari ishlaydi)\n" +
        "- Chanoqni uzoq tutish\n" +
        "- Panja ushlashini bo'shatib yuborish — tushib ketish xavfi\n\n" +
        "> **Diqqat:** Bu elementda panja bo'shasa turnikdan uchib ketish mumkin. " +
        "Past turnikda, yumshoq yerda o'rganing."
    },
    {
      id: 'iz-pod', n: 'Turnik ostidan chiqish', ru: 'ВЫХОД ИЗ-ПОД ТУРНИКА', lvl: 3,
      goal: '1 toza takror',
      base: [{ n: 'Kuch bilan chiqish', v: '5 ta' }, { n: 'Yelka', v: 'harakatchan' }],
      yt: 'ZTbaiTzMRJw',
      md: "**Nima beradi:** g'ayrioddiy boshlang'ich holatdan chiqish — yelka " +
        "harakatchanligini va fazoviy tuyg'uni rivojlantiradi.\n\n" +
        "## Bajarish\n" +
        "1. Turnikning ORQA tomonidan, teskari holatda osiling.\n" +
        "2. Silkinish bilan tanani turnik ostidan oldinga olib chiqing.\n" +
        "3. Ayni lahzada kuchli tortilib, qo'lni turnik ustiga aylantiring.\n" +
        "4. Upor holatiga chiqing.\n\n" +
        "## Tipik xatolar\n" +
        "- Yelkani isitmasdan urinish — jarohat xavfi yuqori\n" +
        "- Silkinishni kuch bilan almashtirishga urinish\n" +
        "- Turnikni juda tor ushlash\n\n" +
        "> **Diqqat:** Yelka bo'g'imi noqulay burchakda ishlaydi. Yelka " +
        "harakatchanligi yetarli bo'lmasa bu elementga kirishmang."
    },
    {
      id: 'cast-monkey', n: 'Upordan manki', ru: 'МАНКИ ИЗ УПОРА (CAST MONKEY)', lvl: 3,
      goal: '1 toza takror',
      base: [{ n: 'Upor', v: 'barqaror' }, { n: 'Kuch bilan chiqish', v: '5 ta' }],
      yt: '6yzDG7AiM-4',
      md: "**Nima beradi:** friston (freestyle) elementlariga kirish. Tana " +
        "turnikdan butunlay uzilib, qaytadan ushlanadi.\n\n" +
        "## Bajarish\n" +
        "1. Upor holatida turing (qo'l to'g'ri, tana turnik ustida).\n" +
        "2. Chanoqni orqaga uloqtirib (cast) tanani turnikdan uzoqlashtiring.\n" +
        "3. Qaytish energiyasidan foydalanib turnikni qo'yib yuboring.\n" +
        "4. Tana turnik atrofida aylanadi — qayta ushlab osilib qoling.\n\n" +
        "## Tipik xatolar\n" +
        "- Turnikni juda erta qo'yib yuborish\n" +
        "- Cast (uloqtirish) kuchsiz — aylanishga energiya yetmaydi\n" +
        "- Yumshoq yer tayyorlamaslik\n\n" +
        "> **Diqqat:** Bu ro'yxatdagi ENG XAVFLI element — tana turnikdan " +
        "uziladi. Faqat past turnikda, yumshoq yerda va imkoni bo'lsa " +
        "sherik bilan o'rganing."
    }
  ];

  function skill(id) { return SKILLS.find(function (s) { return s.id === id; }); }
  function ytThumb(id) { return 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg'; }
  function ytLink(id) { return 'https://www.youtube.com/watch?v=' + id; }

  /* =========================================================
     VIEW: workout — elementlar ro'yxati (Sport uslubida)
     ========================================================= */
  App.view('workout', {
    nav: 'sport',
    render: function (page) {
      var done = doneList().filter(function (id) { return !!skill(id); });
      var pct = Math.round((done.length / SKILLS.length) * 100);

      page.innerHTML =
        '<div class="topbar" style="margin:-16px -15px 12px">' +
        '<button class="icon-btn ghost" data-act="go" data-arg=\'{"v":"sport"}\'>' +
        '<span data-icon="arrowLeft" data-icon-size="20"></span></button>' +
        '<h1>Workout</h1>' +
        '<div style="flex:1"></div>' +
        '<span class="muted" style="font-size:12px;font-weight:700;font-family:var(--mono)">' +
        done.length + ' / ' + SKILLS.length + '</span></div>' +

        '<div class="wk-intro">' +
        '<b>Turnikda bajariladigan elementlar</b>' +
        '<p>Osondan qiyinga. Har bir elementda texnika, bazaviy kuch talabi va ' +
        'video darslik bor.</p>' +
        '<div class="wk-prog"><i style="width:' + pct + '%"></i></div>' +
        '</div>' +

        SKILLS.map(function (s, i) {
          var d = isDone(s.id), L = LVL[s.lvl] || LVL[1];
          return '<div class="list-row">' +
            '<span class="wk-th"><img src="' + ytThumb(s.yt) + '" alt="" loading="lazy"></span>' +
            '<button class="li-main" style="background:none;border:none;text-align:left;padding:0" ' +
            'data-act="go" data-arg=\'' + App.arg({ v: 'workout_skill', p: { id: s.id } }) + '\'>' +
            '<div class="li-title">' + (i + 1) + '. ' + App.esc(s.n) + '</div>' +
            '<div class="li-sub wk-ru">' + App.esc(s.ru) + '</div>' +
            '<div class="li-sub"><span style="color:' + L.c + ';font-weight:700">' + L.n + '</span>' +
            ' · ' + App.esc(s.goal) + '</div></button>' +
            '<button class="icon-btn ghost sp-log' + (d ? ' done' : '') + '" data-act="wkToggle" ' +
            'data-arg=\'' + App.arg({ id: s.id }) + '\' title="O\'zlashtirdim">' +
            '<span data-icon="check" data-icon-size="17"></span></button>' +
            '</div>';
        }).join('');

      App.icons(page);
    }
  });

  /* =========================================================
     VIEW: workout_skill — bitta element
     ========================================================= */
  App.view('workout_skill', {
    nav: 'sport',
    render: function (page, params) {
      var s = skill(params.id);
      if (!s) { App.go('workout'); return; }
      var d = isDone(s.id), L = LVL[s.lvl] || LVL[1];

      page.innerHTML =
        '<div class="topbar" style="margin:-16px -15px 12px">' +
        '<button class="icon-btn ghost" data-act="go" data-arg=\'{"v":"workout"}\'>' +
        '<span data-icon="arrowLeft" data-icon-size="20"></span></button>' +
        '<h1>' + App.esc(s.n) + '</h1></div>' +

        '<div class="wk-badge" style="--wk-c:' + L.c + '">' + App.esc(L.n) + '</div>' +
        '<div class="wk-ru-big">' + App.esc(s.ru) + '</div>' +

        /* Video — bosilgunicha faqat old ko'rinish, YouTube yuklanmaydi */
        '<div class="wk-video" id="wk-video" data-yt="' + s.yt + '">' +
        '<img src="' + ytThumb(s.yt) + '" alt="" loading="lazy">' +
        '<button class="wk-play" data-act="wkPlay" aria-label="Videoni ochish">' +
        '<span data-icon="play" data-icon-size="26"></span></button>' +
        '</div>' +
        '<a class="wk-ytlink" href="' + ytLink(s.yt) + '" target="_blank" rel="noopener">' +
        'YouTube\'da ochish</a>' +

        '<div class="wk-goalbox"><span data-icon="trophy" data-icon-size="16"></span>' +
        '<div><span>Maqsad</span><b>' + App.esc(s.goal) + '</b></div></div>' +

        ((s.base && s.base.length)
          ? '<div class="list-label">Bazaviy kuch</div><div class="wk-base">' +
            s.base.map(function (b) {
              return '<span class="wk-chip"><b>' + App.esc(b.v) + '</b>' + App.esc(b.n) + '</span>';
            }).join('') + '</div>'
          : '') +

        '<div class="list-label">Texnika</div>' +
        '<div class="md-content">' + App.md(s.md) + '</div>' +

        '<button class="btn' + (d ? ' sec' : '') + '" style="margin-top:18px" data-act="wkToggle" ' +
        'data-arg=\'' + App.arg({ id: s.id }) + '\'>' +
        (d ? '✓ O\'zlashtirilgan — bekor qilish' : 'O\'zlashtirdim') + '</button>';

      App.icons(page);
    }
  });

  /* Videoni bosilganda yuklaymiz — sahifa ochilishida YouTube so'ralmaydi. */
  App.actions.wkPlay = function () {
    var box = App.el('wk-video'); if (!box) return;
    var id = box.getAttribute('data-yt');
    box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1" ' +
      'title="Video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; ' +
      'encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
    box.classList.add('playing');
  };

  /* Sport bo'limidagi "Workout" plitkasi shu yerdan holatini oladi. */
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

    if (i < 0) {
      var s = skill(a.id);
      if (s) {
        App.call('log_activity', {
          section: 'sport', object: s.n, amount: 1, unit: 'element',
          meta: { kind: 'workout', ru: s.ru }
        }).catch(function () {});
      }
      App.toast('✅ O\'zlashtirildi!');
    }
    App.reload();
  };
})();
