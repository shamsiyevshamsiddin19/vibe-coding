/* Boostday bot — saytdan boshqarish. Barcha so'rovlar sayt backend'i orqali
   (/api?action=boost_*) ketadi; maxfiy kalit faqat serverda, brauzerga berilmaydi. */
(function () {
  'use strict';

  var TYPES = {
    daily_todo:  { n: 'Har kungi rejalar', ic: 'refresh', c: 'var(--success)', d: 'Har kuni belgilangan vaqtda yuboriladi' },
    todo:        { n: 'TO-DO',            ic: 'check',   c: 'var(--accent)',  d: 'Bitta sanaga vazifalar ro\'yxati' },
    super_todo:  { n: 'Super TO-DO',      ic: 'clock',   c: 'var(--purple)',  d: 'Vaqt hisoblagichli vazifalar' },
    daily_plan:  { n: 'Kunlik post',      ic: 'image',   c: 'var(--teal)',    d: 'Har kuni media/matn yuboriladi' },
    reminder:    { n: 'Eslatma',          ic: 'alert',   c: 'var(--warn)',    d: 'Bir marta yuboriladi' },
    challenge:   { n: 'Challenge',        ic: 'trophy',  c: 'var(--coral)',   d: 'Muddatli challenge posti' }
  };
  function tinfo(t) { return TYPES[t] || { n: t, ic: 'file', c: 'var(--hint)', d: '' }; }

  var B = { data: null, channels: null };

  function call(action, payload) {
    return App.call('boost_' + action, payload || {});
  }

  function topbar(title, back, params) {
    return '<div class="topbar" style="margin:-16px -15px 12px">' +
      (back ? '<button class="icon-btn ghost" data-act="go" data-arg=\'' + App.arg({ v: back, p: params || {} }) +
        '\'><span data-icon="arrowLeft" data-icon-size="20"></span></button>' : '') +
      '<h1>' + App.esc(title) + '</h1></div>';
  }

  /* Barcha rejalarni bitta ro'yxatga yig'adi */
  function allPlans(j) {
    return [].concat(j.daily_routines || [], j.todos || [], j.plans || [], j.reminders || []);
  }

  function planCount(p) {
    var groups = p.tasks || [];
    var n = 0;
    if (Array.isArray(groups)) {
      groups.forEach(function (g) { n += ((g && g.tasks) || []).length; });
    }
    return n;
  }
  function planDone(p) {
    var groups = p.tasks || [], n = 0;
    if (Array.isArray(groups)) {
      groups.forEach(function (g) {
        ((g && g.tasks) || []).forEach(function (t) { if (+t.status === 1) n++; });
      });
    }
    return n;
  }

  /* ---------- Asosiy sahifa ---------- */
  App.view('boost', {
    nav: 'boost',
    render: function (page) {
      page.innerHTML = '<div class="topbar" style="margin:-16px -15px 12px"><h1>Boostday</h1>' +
        '<button class="icon-btn ghost" data-act="boostChannels" aria-label="Kanallar"><span data-icon="settings" data-icon-size="18"></span></button></div>' +
        '<div id="bo-stats"></div>' +
        '<div id="bo-list"><div class="load-wrap"><div class="spinner"></div></div></div>' +
        '<button class="btn" style="margin-top:14px" data-act="boostNew"><span data-icon="plus" data-icon-size="16"></span>Yangi reja</button>';
      App.icons(page);

      call('stats').then(function (j) {
        var box = App.el('bo-stats'); if (!box) return;
        var s = j.summary || {};
        box.innerHTML = '<div class="stat-strip" style="margin:0 0 16px">' +
          '<div class="s"><div class="n">' + (s.days || 0) + '</div><div class="l">Faol kun</div></div>' +
          '<div class="s"><div class="n">' + (s.total_tasks || 0) + '</div><div class="l">Vazifa</div></div>' +
          '<div class="s"><div class="n" style="color:var(--success)">' + (s.percent || 0) + '%</div><div class="l">Bajarildi</div></div>' +
          '</div>';
      }).catch(function () {});

      call('list').then(function (j) {
        B.data = j;
        var box = App.el('bo-list'); if (!box) return;
        var list = allPlans(j).filter(function (p) { return p.status !== 'deleted'; });
        if (!list.length) {
          box.innerHTML = App.empty({ icon: 'refresh', title: 'Reja yo\'q', text: 'Pastdagi tugma bilan birinchi rejani qo\'shing.' });
          App.icons(box); return;
        }
        // Turi bo'yicha guruhlab ko'rsatamiz
        var order = ['daily_todo', 'todo', 'super_todo', 'daily_plan', 'challenge', 'reminder'];
        var html = '';
        order.forEach(function (t) {
          var items = list.filter(function (p) { return p.plan_type === t; });
          if (!items.length) return;
          html += '<div class="list-label">' + App.esc(tinfo(t).n) + '</div>' +
            items.map(function (p) {
              var ti = tinfo(p.plan_type);
              var total = planCount(p), done = planDone(p);
              var sub = [];
              if (p.time) sub.push('⏰ ' + p.time);
              if (total) sub.push(done + '/' + total + ' vazifa');
              if (p.date) sub.push(p.date);
              if (p.channel_name) sub.push(p.channel_name);
              return '<button class="list-row" data-act="go" data-arg=\'' + App.arg({ v: 'boost_plan', p: { id: p.id } }) + '\'>' +
                '<span class="li-ic" style="background:color-mix(in srgb,' + ti.c + ' 16%, transparent);color:' + ti.c +
                '"><span data-icon="' + ti.ic + '" data-icon-size="15"></span></span>' +
                '<div class="li-main"><div class="li-title">' + App.esc(p.channel_name || ti.n) + '</div>' +
                '<div class="li-sub">' + App.esc(sub.join(' · ')) + '</div></div>' +
                '<span class="li-chev" data-icon="arrowLeft" data-icon-size="16" style="transform:rotate(180deg)"></span></button>';
            }).join('');
        });
        box.innerHTML = html;
        App.icons(box);
      }).catch(function (e) {
        var box = App.el('bo-list');
        if (box) box.innerHTML = App.empty({ icon: 'alert', title: 'Ulanmadi', text: e.message });
      });
    }
  });

  /* ---------- Bitta reja ---------- */
  App.view('boost_plan', {
    nav: 'boost',
    render: function (page, params) {
      var id = params.id;
      page.innerHTML = '<div class="load-wrap"><div class="spinner"></div></div>';
      call('get', { id: id }).then(function (j) {
        var p = j.item; if (!p) { App.go('boost'); return; }
        renderPlan(page, p);
      }).catch(function (e) { App.toast('⚠️ ' + e.message); App.go('boost'); });
    }
  });

  function renderPlan(page, p) {
    var ti = tinfo(p.plan_type);
    var groups = Array.isArray(p.tasks) ? p.tasks : [];
    var total = planCount(p), done = planDone(p);
    var pct = total ? Math.round(done * 100 / total) : 0;

    page.innerHTML = topbar(ti.n, 'boost') +
      '<div class="bo-hero" style="background:color-mix(in srgb,' + ti.c + ' 12%, transparent)">' +
      '<span class="bo-hero-ic" style="background:color-mix(in srgb,' + ti.c + ' 20%, transparent);color:' + ti.c + '">' +
      '<span data-icon="' + ti.ic + '" data-icon-size="22"></span></span>' +
      '<div class="bo-hero-t">' + App.esc(p.channel_name || '—') + '</div>' +
      '<div class="bo-hero-s">' + App.esc(ti.d) + '</div></div>' +

      (total ? '<div class="stat-strip" style="margin:16px 0 8px">' +
        '<div class="s"><div class="n">' + total + '</div><div class="l">Vazifa</div></div>' +
        '<div class="s"><div class="n" style="color:var(--success)">' + done + '</div><div class="l">Bajarildi</div></div>' +
        '<div class="s"><div class="n">' + pct + '%</div><div class="l">Natija</div></div></div>' +
        '<div class="bar" style="margin:0 1px 14px"><i style="width:' + pct + '%"></i></div>' : '') +

      '<div class="list-row"><span class="li-ic" data-icon="clock" data-icon-size="15"></span>' +
      '<div class="li-main"><div class="li-title">Vaqt</div><div class="li-sub">' + App.esc(p.time || '—') +
      (p.week_mode && p.week_mode !== 'everyday' ? ' · ' + (p.week_mode === 'odd' ? 'toq kunlari' : 'juft kunlari') : '') +
      '</div></div></div>' +
      (p.date ? '<div class="list-row"><span class="li-ic" data-icon="calendar" data-icon-size="15"></span>' +
        '<div class="li-main"><div class="li-title">Sana</div><div class="li-sub">' + App.esc(p.date) + '</div></div></div>' : '') +
      (p.start_date ? '<div class="list-row"><span class="li-ic" data-icon="calendar" data-icon-size="15"></span>' +
        '<div class="li-main"><div class="li-title">Muddat</div><div class="li-sub">' + App.esc(p.start_date + ' — ' + (p.end_date || '')) + '</div></div></div>' : '') +

      '<div class="between list-label"><span>Vazifalar</span>' +
      '<button data-act="boostAddGroup" style="background:none;border:none;color:var(--accent);font-size:12px;font-weight:700;text-transform:none;letter-spacing:0">+ Bo\'lim</button></div>' +
      '<div id="bo-tasks"></div>' +

      '<div class="btn-row" style="margin-top:18px;flex-direction:column;gap:10px">' +
      '<button class="btn" id="bo-save">Saqlash</button>' +
      '<button class="btn ghost" id="bo-del" style="color:var(--danger);border-color:var(--danger-soft)">Rejani o\'chirish</button>' +
      '</div>';
    App.icons(page);

    // Tahrirlanadigan holat shu yerda saqlanadi
    page._plan = p;
    page._groups = groups.length ? JSON.parse(JSON.stringify(groups)) : [{ name: '', tasks: [] }];
    drawTasks(page);

    App.el('bo-save').onclick = function () { savePlan(page); };
    App.el('bo-del').onclick = function () {
      App.confirm('Bu reja o\'chiriladi. Bot endi uni yubormaydi.', function () {
        call('delete', { id: p.id }).then(function () { App.toast('O\'chirildi'); App.go('boost'); })
          .catch(function (e) { App.toast('⚠️ ' + e.message); });
      }, { danger: true, yes: 'O\'chirish' });
    };
  }

  function drawTasks(page) {
    var box = App.el('bo-tasks'); if (!box) return;
    var groups = page._groups;
    box.innerHTML = groups.map(function (g, gi) {
      return '<div class="bo-group" data-g="' + gi + '">' +
        '<div class="flex" style="gap:8px;margin-bottom:8px">' +
        '<input class="input bo-gname" data-g="' + gi + '" value="' + App.esc(g.name || '') +
        '" placeholder="Bo\'lim nomi (ixtiyoriy)" style="flex:1;font-weight:700">' +
        '<button class="icon-btn ghost bo-gdel" data-g="' + gi + '" style="width:34px;height:34px;color:var(--danger)">' +
        '<span data-icon="trash" data-icon-size="15"></span></button></div>' +
        (g.tasks || []).map(function (t, ti2) {
          var doneCls = +t.status === 1 ? ' done' : '';
          return '<div class="bo-task' + doneCls + '">' +
            '<button class="bo-check' + doneCls + '" data-g="' + gi + '" data-t="' + ti2 + '">' +
            (+t.status === 1 ? '✓' : '') + '</button>' +
            '<input class="input bo-ttext" data-g="' + gi + '" data-t="' + ti2 + '" value="' + App.esc(t.text || '') + '">' +
            '<button class="icon-btn ghost bo-tdel" data-g="' + gi + '" data-t="' + ti2 + '" style="width:30px;height:30px">' +
            '<span data-icon="x" data-icon-size="14"></span></button></div>';
        }).join('') +
        '<button class="btn sec sm bo-tadd" data-g="' + gi + '" style="width:100%;margin-top:4px">+ Vazifa</button>' +
        '</div>';
    }).join('');
    App.icons(box);

    box.querySelectorAll('.bo-gname').forEach(function (i) {
      i.oninput = function () { groups[+i.getAttribute('data-g')].name = i.value; };
    });
    box.querySelectorAll('.bo-ttext').forEach(function (i) {
      i.oninput = function () {
        groups[+i.getAttribute('data-g')].tasks[+i.getAttribute('data-t')].text = i.value;
      };
    });
    box.querySelectorAll('.bo-check').forEach(function (b) {
      b.onclick = function () {
        var t = groups[+b.getAttribute('data-g')].tasks[+b.getAttribute('data-t')];
        t.status = +t.status === 1 ? 0 : 1;
        drawTasks(page);
      };
    });
    box.querySelectorAll('.bo-tdel').forEach(function (b) {
      b.onclick = function () {
        groups[+b.getAttribute('data-g')].tasks.splice(+b.getAttribute('data-t'), 1);
        drawTasks(page);
      };
    });
    box.querySelectorAll('.bo-tadd').forEach(function (b) {
      b.onclick = function () {
        groups[+b.getAttribute('data-g')].tasks.push({ text: '', status: 0 });
        drawTasks(page);
      };
    });
    box.querySelectorAll('.bo-gdel').forEach(function (b) {
      b.onclick = function () {
        if (groups.length <= 1) { groups[0] = { name: '', tasks: [] }; drawTasks(page); return; }
        groups.splice(+b.getAttribute('data-g'), 1);
        drawTasks(page);
      };
    });
  }

  App.actions.boostAddGroup = function () {
    var page = App.el('page');
    page._groups.push({ name: '', tasks: [] });
    drawTasks(page);
  };

  function savePlan(page) {
    var p = page._plan;
    // Bo'sh vazifalarni tashlab yuboramiz
    var groups = page._groups.map(function (g) {
      return { name: g.name || '', tasks: (g.tasks || []).filter(function (t) { return (t.text || '').trim(); }) };
    }).filter(function (g) { return g.tasks.length || g.name; });

    var btn = App.el('bo-save'); btn.disabled = true; btn.textContent = 'Saqlanmoqda...';
    call('save', {
      id: p.id, plan_type: p.plan_type, channel_id: p.channel_id, channel_name: p.channel_name,
      time: p.time || '', date: p.date || '', start_date: p.start_date || '', end_date: p.end_date || '',
      week_mode: p.week_mode || 'everyday',
      items: JSON.stringify(p.items || []),
      tasks: JSON.stringify(groups)
    }).then(function () {
      App.toast('✅ Saqlandi'); btn.disabled = false; btn.textContent = 'Saqlash';
    }).catch(function (e) {
      App.toast('⚠️ ' + e.message); btn.disabled = false; btn.textContent = 'Saqlash';
    });
  }

  /* ---------- Yangi reja ---------- */
  App.actions.boostNew = function () {
    call('channels').then(function (j) {
      var chans = j.channels || [];
      if (!chans.length) {
        App.toast('Avval kanal ulang'); App.actions.boostChannels(); return;
      }
      var html =
        '<label class="field"><span>Reja turi</span><select class="input" id="bn-type">' +
        Object.keys(TYPES).map(function (k) {
          return '<option value="' + k + '">' + TYPES[k].n + '</option>';
        }).join('') + '</select></label>' +
        '<p class="muted" id="bn-desc" style="font-size:12.5px;margin:-6px 1px 12px"></p>' +
        '<label class="field"><span>Kanal</span><select class="input" id="bn-ch">' +
        chans.map(function (c) {
          return '<option value="' + App.esc(c.channel_id) + '">' + App.esc(c.channel_name) + '</option>';
        }).join('') + '</select></label>' +
        '<label class="field"><span>Vaqt (soat:daqiqa)</span><input class="input" type="time" id="bn-time" value="07:00"></label>' +
        '<label class="field" id="bn-date-w"><span>Sana</span><input class="input" type="date" id="bn-date"></label>' +
        '<div class="flex" style="gap:8px" id="bn-range-w">' +
        '<label class="field" style="flex:1"><span>Boshlanish</span><input class="input" type="date" id="bn-start"></label>' +
        '<label class="field" style="flex:1"><span>Tugash</span><input class="input" type="date" id="bn-end"></label></div>' +
        '<button class="btn" id="bn-save">Yaratish</button>';
      var sh = App.sheet(html, { title: 'Yangi reja' });

      function sync() {
        var t = sh.querySelector('#bn-type').value;
        sh.querySelector('#bn-desc').textContent = tinfo(t).d;
        sh.querySelector('#bn-date-w').style.display = (t === 'todo' || t === 'super_todo') ? '' : 'none';
        sh.querySelector('#bn-range-w').style.display = (t === 'challenge') ? '' : 'none';
      }
      sh.querySelector('#bn-type').onchange = sync; sync();

      sh.querySelector('#bn-save').onclick = function () {
        var t = sh.querySelector('#bn-type').value;
        var chSel = sh.querySelector('#bn-ch');
        var payload = {
          id: 0, plan_type: t,
          channel_id: chSel.value,
          channel_name: chSel.options[chSel.selectedIndex].text,
          time: sh.querySelector('#bn-time').value || '07:00',
          date: sh.querySelector('#bn-date').value || '',
          start_date: sh.querySelector('#bn-start').value || '',
          end_date: sh.querySelector('#bn-end').value || '',
          week_mode: 'everyday',
          items: '[]',
          tasks: JSON.stringify([{ name: '', tasks: [] }])
        };
        call('save', payload).then(function (res) {
          App.closeSheet(); App.toast('✅ Yaratildi');
          if (res.id) App.go('boost_plan', { id: res.id }); else App.reload();
        }).catch(function (e) { App.toast('⚠️ ' + e.message); });
      };
    }).catch(function (e) { App.toast('⚠️ ' + e.message); });
  };

  /* ---------- Kanallar ---------- */
  App.actions.boostChannels = function () {
    call('channels').then(function (j) {
      var chans = j.channels || [];
      var html =
        '<p class="muted" style="font-size:12.5px;margin:0 0 12px">Bot xabarlarni shu kanal/guruhlarga yuboradi. Bot kanalda admin bo\'lishi shart.</p>' +
        (chans.length
          ? chans.map(function (c) {
              return '<div class="list-row"><span class="li-ic" data-icon="message" data-icon-size="15"></span>' +
                '<div class="li-main"><div class="li-title">' + App.esc(c.channel_name) + '</div>' +
                '<div class="li-sub">' + App.esc(c.channel_id) + '</div></div>' +
                '<button class="icon-btn ghost bo-chdel" data-id="' + c.id + '" style="width:30px;height:30px">' +
                '<span data-icon="trash" data-icon-size="14"></span></button></div>';
            }).join('')
          : '<p class="muted" style="font-size:13px;margin:2px 1px 10px">Kanal ulanmagan.</p>') +
        '<label class="field" style="margin-top:12px"><span>Yangi kanal (@username yoki ID)</span>' +
        '<input class="input" id="bo-newch" placeholder="@mychannel"></label>' +
        '<button class="btn" id="bo-chadd">Ulash</button>';
      var sh = App.sheet(html, { title: 'Kanallar' });
      App.icons(sh);

      sh.querySelectorAll('.bo-chdel').forEach(function (b) {
        b.onclick = function () {
          call('delete_channel', { id: b.getAttribute('data-id') }).then(function () {
            App.closeSheet(); App.toast('O\'chirildi'); App.reload();
          }).catch(function (e) { App.toast('⚠️ ' + e.message); });
        };
      });
      sh.querySelector('#bo-chadd').onclick = function () {
        var v = sh.querySelector('#bo-newch').value.trim();
        if (!v) return App.toast('Kanal nomini kiriting');
        call('add_channel', { channel: v }).then(function () {
          App.closeSheet(); App.toast('✅ Ulandi'); App.reload();
        }).catch(function (e) { App.toast('⚠️ ' + e.message); });
      };
    }).catch(function (e) { App.toast('⚠️ ' + e.message); });
  };
})();
