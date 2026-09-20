'use strict';

/* ════════════════════════════════════════════════════════════════════════════
   js/ui.js — الدُّرَّةُ الذَّهَبِيَّة | كلُّ شاشات التطبيق
   ─────────────────────────────────────────────────────────────────────────
   • المعالج الافتتاحي (الأيام ← القراءات)
   • شريط القراءات (زيادة من الأعلى ➕) والتنقل الستّي
   • شاشة اليوم: حضور ✅❌ / تأخير ⏰ بالدقائق / كتاب 📝 + ملخّص الدَّور
   • شاشة الدَّور: المتن (قارئ واحد) والمطالعة (خانة أو خانتان) +
     الاختيار اليدوي + قائمة الدَّور بالدُّيون + يوم الاختبار
   • شاشة الطلاب والإضافة/التعديل/البحث/الاتصال
   • شاشة الاختبارات: البنّاء (جامدة/اختيارية/صح-خطأ) + النتائج
   • شاشة الإعدادات: اللغة/السحابة والرمز وQR/الأيام/القراءات/النسخ/التثبيت
   ════════════════════════════════════════════════════════════════════════════ */

/* ── مفاتيح واجهة إضافية تُدمج في القواميس قبل تهيئة i18n ── */
const UI_EXTRA = {
  ar: { examDay:"يومُ اختبارٍ بلا دور", nextUp:"التالي", markAll:"الجميع",
        pdfNames:"PDF الأسماء" },
  en: { examDay:"Exam day — no turn", nextUp:"Next up", markAll:"All",
        pdfNames:"Names PDF" },
  am: { examDay:"የፈተና ቀን — ተራ የሌለበት", nextUp:"ቀጣይ", markAll:"ሁሉም",
        pdfNames:"የስሞች PDF" }
};
(function patchDicts(){
  if (window.I18N_DICTS){
    for (const l of Object.keys(UI_EXTRA)){
      if (I18N_DICTS[l]) Object.assign(I18N_DICTS[l], UI_EXTRA[l]);
    }
  }
})();

/* ── أدوات DOM صغيرة ── */
function h(html){
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}
function btn(label, cls, onClick, title){
  const b = h(`<button class="btn ${cls || ''}" ${title ? `title="${U.esc(title)}"` : ''}>${label}</button>`);
  if (onClick) b.addEventListener('click', onClick);
  return b;
}
function pad2(n){ return String(n).padStart(2, '0'); }

/* ═════════════════════════════ المحرّك الرئيسي للواجهة ═════════════════════════════ */
const UI = {
  els: {},
  _force: {},     /* الأيام غير الدراسية التي سُجِّلت على أي حال */
  _wiz: null,     /* حالة المعالج الافتتاحي */

  tx(key){
    const l = I18N.lang;
    return (UI_EXTRA[l] && UI_EXTRA[l][key]) || UI_EXTRA.ar[key] || key;
  },

  /* ════════ الإقلاع ════════ */
  boot(){
    const g = id => document.getElementById(id);
    this.els = {
      splash: g('splash'),   splashSub: g('splashSub'),
      app: g('app'),         brandTitle: g('brandTitle'), brandSub: g('brandSub'),
      syncDot: g('syncDot'), langSelect: g('langSelect'),
      btnInstall: g('btnInstall'),
      readingTabs: g('readingTabs'), mainNav: g('mainNav'),
      view: g('view'),       foot: g('foot'),
      modalRoot: g('modalRoot'), toastRoot: g('toastRoot'),
      pdfStage: g('pdfStage')
    };
    this.els.splashSub.textContent = t('app.subtitle');
    this.els.langSelect.value = I18N.lang;
    this.els.langSelect.addEventListener('change', e => {
      I18N.setLang(e.target.value);
      this.renderAll();
    });
    this.els.btnInstall.addEventListener('click', () => {
      if (window.__installApp) window.__installApp();
    });

    Bus.on('sync', s => this.updateSyncDot(s));
    this.updateSyncDot(CloudSync.status);

    Bus.on('change',  () => this.renderAll());
    Bus.on('pulled',  () => this.renderAll());
    Bus.on('autopair', ok => this.toast(ok ? t('set.paired') : t('set.pairErr'), ok ? 'ok' : 'err'));

    this.renderAll();
  },

  /* ════════ نقطة المزامنة ════════ */
  updateSyncDot(s){
    const el = this.els.syncDot;
    if (!el) return;
    const prev = el.dataset.status;
    el.dataset.status = s;
    const map = { on: t('set.syncOn'), off: t('set.syncOff'), sync: t('set.syncing'), err: t('gen.error') };
    el.title = map[s] || '';
    if (s === 'on' && (prev === 'sync' || prev === 'err')){
      try { localStorage.setItem('gd_lastsync', String(Date.now())); } catch(e){}
    }
  },
  fmtTS(ts){
    const d = new Date(Number(ts));
    return d.getFullYear() + '/' + pad2(d.getMonth() + 1) + '/' + pad2(d.getDate()) +
           ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  },

  /* ════════ الرسم الشامل ════════ */
  renderAll(){
    const wiz = !DB.settings().wizDone;
    this.els.langSelect.value = I18N.lang;
    this.els.readingTabs.hidden = wiz;
    this.els.mainNav.hidden = wiz;
    this.renderBrand();
    if (!wiz){ this.renderTabs(); this.renderNav(); }
    this.renderView();
    this.renderFoot();
  },
  renderBrand(){
    this.els.brandTitle.textContent = t('app.title');
    const r = DB.reading(Session.rid());
    this.els.brandSub.textContent = r ? (r.book ? (r.name + ' — ' + r.book) : r.name) : '';
  },
  renderFoot(){
    this.els.foot.textContent = '✦ ' + t('app.title') + ' · v' +
      (document.documentElement.dataset.version || '1');
  },
  go(view){
    Session.set({ view });
    this.renderNav();
    this.renderView();
  },

  /* ════════ شريط القراءات (الزيادة من الأعلى ➕) ════════ */
  renderTabs(){
    const bar = this.els.readingTabs;
    bar.innerHTML = '';
    for (const r of DB.readings()){
      const active = r.id === Session.rid();
      const b = h(`<button class="rtab ${active ? 'active' : ''}" title="${U.esc(r.name)}">
        <span>${U.esc(r.name)}</span>
        <span class="rtab-count">${r.studentIds.length}</span>
        ${active ? `<span class="rtab-count" title="${U.esc(t('gen.edit'))}">✎</span>` : ''}
      </button>`);
      b.addEventListener('click', e => {
        if (e.target.textContent === '✎'){ this.readingModal(r); return; }
        if (!active){ Session.set({ rid: r.id }); this.renderAll(); }
      });
      bar.appendChild(b);
    }
    const add = h(`<button class="rtab-add" title="${U.esc(t('tabs.addReading'))}">＋</button>`);
    add.addEventListener('click', () => this.readingModal(null));
    bar.appendChild(add);
  },

  /* ════════ التنقل الرئيسي ════════ */
  renderNav(){
    const items = [
      ['today',    '📅', 'nav.today'],
      ['students', '👥', 'nav.students'],
      ['turn',     '🔁', 'nav.turn'],
      ['exams',    '✍️', 'nav.exams'],
      ['reports',  '🧾', 'nav.reports'],
      ['settings', '⚙️', 'nav.settings']
    ];
    const nav = this.els.mainNav;
    nav.innerHTML = '';
    for (const [view, ico, key] of items){
      const b = h(`<button class="navbtn ${Session.d.view === view ? 'active' : ''}">
        <span aria-hidden="true">${ico}</span><span>${U.esc(t(key))}</span></button>`);
      b.addEventListener('click', () => this.go(view));
      nav.appendChild(b);
    }
  },

  /* ════════ موجّه الشاشات ════════ */
  renderView(){
    const v = this.els.view;
    v.innerHTML = '';
    if (!DB.settings().wizDone){ v.appendChild(this.wizardEl()); return; }
    switch (Session.d.view){
      case 'students': v.appendChild(this.studentsEl()); break;
      case 'turn':     v.appendChild(this.turnEl());     break;
      case 'exams':    v.appendChild(this.examsEl());    break;
      case 'reports':
        if (window.Reports && Reports.screen) v.appendChild(Reports.screen());
        else v.appendChild(this.emptyEl('🧾', t('rep.title'), ''));
        break;
      case 'settings': v.appendChild(this.settingsEl()); break;
      default:         v.appendChild(this.todayEl());
    }
  },

  /* ═══════════════════ المعالج الافتتاحي ═══════════════════ */
  wizardEl(){
    if (!this._wiz) this._wiz = { step: 1, days: new Set([0,1,2,3,4]), rows: [{}] };
    const W = this._wiz;

    const wrap  = h('<div class="screen"></div>');
    const card  = h('<div class="card wiz"></div>');
    const steps = h('<div class="wiz-steps"><div class="wiz-step"></div><div class="wiz-step"></div></div>');
    card.appendChild(steps);
    wrap.appendChild(card);

    const render = () => {
      steps.querySelectorAll('.wiz-step').forEach((s, i) => s.classList.toggle('on', i < W.step));
      let body = card.querySelector('.wiz-body');
      if (body) body.remove();
      body = h('<div class="wiz-body" style="display:flex;flex-direction:column;gap:16px;margin-top:14px"></div>');

      if (W.step === 1){
        body.appendChild(h(`<div style="text-align:center">
          <h2 class="screen-title gold-text">${U.esc(t('wiz.hello'))} «${U.esc(t('app.title'))}»</h2>
          <p class="muted small">${U.esc(t('wiz.helloSub'))}</p></div>`));
        const f = h(`<div class="field">
          <label class="bold">${U.esc(t('wiz.q1'))}</label>
          <span class="hint">${U.esc(t('wiz.q1hint'))}</span>
          <div class="day-grid" style="margin-top:8px"></div></div>`);
        const dg = f.querySelector('.day-grid');
        I18N.dayNames().forEach((dn, i) => {
          const c = h(`<button type="button" class="chip day" data-on="${W.days.has(i) ? 1 : 0}">${U.esc(dn)}</button>`);
          c.addEventListener('click', () => {
            W.days.has(i) ? W.days.delete(i) : W.days.add(i);
            c.dataset.on = W.days.has(i) ? 1 : 0;
          });
          dg.appendChild(c);
        });
        body.appendChild(f);
        const row = h('<div style="display:flex;justify-content:flex-end"></div>');
        row.appendChild(btn(U.esc(t('wiz.next')) + ' ›', 'btn-gold', () => {
          if (!W.days.size){ this.toast(t('gen.required'), 'err'); return; }
          W.step = 2; render();
        }));
        body.appendChild(row);
      } else {
        body.appendChild(h(`<div class="field">
          <label class="bold">${U.esc(t('wiz.q2'))}</label>
          <span class="hint">${U.esc(t('wiz.q2hint'))}</span></div>`));
        const rows = h('<div style="display:flex;flex-direction:column;gap:10px"></div>');
        W.rows.forEach((row, i) => {
          const q = h(`<div class="q-edit">
            <div class="q-edit-head"><span class="q-num">${i + 1}</span>
              <div class="form-grid" style="flex:1"></div>
              ${W.rows.length > 1 ? '<button class="btn btn-sm btn-danger">✕</button>' : ''}
            </div></div>`);
          const grid = q.querySelector('.form-grid');
          const mk = (label, ph, key, req) => {
            const f = h(`<div class="field"><label>${U.esc(label)} ${req ? '<span class="req">*</span>' : ''}</label>
              <input class="input" placeholder="${U.esc(ph)}" value="${U.esc(row[key] || '')}"></div>`);
            f.querySelector('input').addEventListener('input', e => row[key] = e.target.value);
            grid.appendChild(f);
          };
          mk(t('wiz.readingName'), t('wiz.readingNamePh'), 'name', true);
          mk(t('wiz.bookName'),    t('wiz.bookNamePh'),    'book', false);
          mk(t('wiz.teacher'),     t('wiz.teacherPh'),     'teacher', false);
          const rm = q.querySelector('.btn-danger');
          if (rm) rm.addEventListener('click', () => { W.rows.splice(i, 1); render(); });
          rows.appendChild(q);
        });
        body.appendChild(rows);
        body.appendChild(btn('＋ ' + U.esc(t('wiz.addAnother')), 'btn-sm', () => {
          W.rows.push({}); render();
        }));
        const nav = h('<div style="display:flex;justify-content:space-between;gap:8px;margin-top:6px"></div>');
        nav.appendChild(btn('‹ ' + U.esc(t('wiz.back')), '', () => { W.step = 1; render(); }));
        nav.appendChild(btn(U.esc(t('wiz.finish')) + ' ✦', 'btn-gold', () => {
          const named = W.rows.filter(r => (r.name || '').trim());
          if (!named.length || !W.days.size){ this.toast(t('gen.required'), 'err'); return; }
          for (const row of named)
            DB.addReading({ name: row.name, book: row.book || '', teacher: row.teacher || '', days: [...W.days] });
          this._wiz = null;
          Session.set({ rid: DB.readings()[0].id, view: 'today' });
          DB.setSetting('wizDone', true);   /* ← يُطلق renderAll */
        }));
        body.appendChild(nav);
      }
      card.appendChild(body);
    };
    render();
    return wrap;
  },

  /* ═══════════════════ شاشة اليوم ═══════════════════ */
  todayEl(){
    const wrap = h('<div class="screen"></div>');
    const rid = Session.rid();
    if (!rid){ wrap.appendChild(this.noReadingEl()); return wrap; }
    const r = DB.reading(rid);
    if (!Session.d.attDate) Session.set({ attDate: Dates.today() });
    const date = Session.d.attDate;
    const dd = r.days_data[date] || null;
    const study = DB.isStudyDay(rid, date);
    const hasData = !!(dd && (Object.keys(dd.att || {}).length || dd.matn ||
                       (dd.mutala && dd.mutala.length) || dd.noTurn));
    const show = study || hasData || this._force[date];

    /* الترويسة + ملاحة التاريخ */
    const head = h(`<div class="screen-head"><div>
      <div class="screen-title">${U.esc(t('att.title'))}</div>
      <div class="screen-sub">${U.esc(I18N.fmtDate(Dates.fromISO(date)))}</div></div>
      <div class="screen-actions"></div></div>`);
    head.querySelector('.screen-actions').appendChild(this.dateNav(rid, date));
    wrap.appendChild(head);

    if (!show){
      const c = h(`<div class="card"><div class="empty">
        <div class="empty-ico">🌙</div>
        <div class="empty-title">${U.esc(t('att.noSession'))}</div>
        <p class="muted small">${U.esc(t('att.noSessionHint'))}</p></div></div>`);
      c.querySelector('.empty').appendChild(btn(U.esc(t('att.noSessionBtn')), 'btn-gold', () => {
        this._force[date] = true; this.renderView();
      }));
      wrap.appendChild(c);
      return wrap;
    }

    /* الإحصاءات */
    const st = DB.attStats(rid, date);
    wrap.appendChild(h(`<div class="stats">
      <div class="stat"><div class="stat-num ok">${st.present}</div><div class="stat-lbl">${U.esc(t('att.statPresent'))}</div></div>
      <div class="stat"><div class="stat-num err">${st.absent}</div><div class="stat-lbl">${U.esc(t('att.statAbsent'))}</div></div>
      <div class="stat"><div class="stat-num warn">${st.late}</div><div class="stat-lbl">${U.esc(t('att.statLate'))}</div></div>
      <div class="stat"><div class="stat-num">${st.noBook}</div><div class="stat-lbl">${U.esc(t('att.statNoBook'))}</div></div>
    </div>`));

    /* ملخّص الدَّور */
    wrap.appendChild(this.todayTurnCard(r, date));

    /* سجلّ الحضور */
    const students = DB.studentsOf(rid);
    const card = h(`<div class="card"><div class="card-head">
      <div class="card-title">✅❌ ${U.esc(t('att.sub'))}</div>
      <div class="card-tools"></div></div></div>`);
    const tools = card.querySelector('.card-tools');
    tools.appendChild(btn('✅ ' + U.esc(this.tx('markAll')), 'btn-sm', () => this.markAll(rid, date, 1)));
    tools.appendChild(btn('❌ ' + U.esc(this.tx('markAll')), 'btn-sm', () => this.markAll(rid, date, 0)));

    if (!students.length){
      const e = h(`<div class="empty"><div class="empty-ico">👥</div>
        <div class="empty-title">${U.esc(t('students.none'))}</div>
        <p class="muted small">${U.esc(t('students.noneHint'))}</p></div>`);
      e.appendChild(btn('＋ ' + U.esc(t('students.add')), 'btn-gold', () => this.studentModal(null)));
      card.appendChild(e);
    } else {
      const tw = h(`<div class="tbl-wrap"><table class="tbl"><thead><tr>
        <th>${U.esc(t('gen.name'))}</th><th>✅❌</th><th>⏰</th><th>📝</th>
      </tr></thead><tbody></tbody></table></div>`);
      const tb = tw.querySelector('tbody');
      for (const s of students) tb.appendChild(this.attRow(r, date, s));
      card.appendChild(tw);

      tw.addEventListener('click', e => {
        const b = e.target.closest('[data-act]');
        if (!b || b.disabled) return;
        const sid = b.dataset.sid;
        const cur = (((r.days_data[date] || {}).att || {})[sid]) || { p: null, late: null, book: null };
        if (b.dataset.act === 'att'){
          const np = cur.p === null ? 1 : (cur.p === 1 ? 0 : null);
          DB.setAtt(rid, date, sid, { p: np });
        } else if (b.dataset.act === 'late'){
          DB.setAtt(rid, date, sid, { late: cur.late == null ? 5 : null });
        } else if (b.dataset.act === 'book'){
          const nb = cur.book === null ? 1 : (cur.book === 1 ? 0 : null);
          DB.setAtt(rid, date, sid, { book: nb });
        }
      });
      tw.addEventListener('change', e => {
        if (e.target.dataset.act !== 'latemin') return;
        const v = parseInt(e.target.value, 10);
        DB.setAtt(rid, date, e.target.dataset.sid, { late: isNaN(v) ? null : Math.max(0, v) });
      });
    }
    wrap.appendChild(card);
    return wrap;
  },

  /* ملاحة التاريخ (تقفز بين أيام الدراسة) */
  dateNav(rid, date){
    const nav = h('<div class="toolbar"></div>');
    const go = d => { Session.set({ attDate: d }); this.renderView(); };
    nav.appendChild(btn('‹ ' + U.esc(t('att.prev')), 'btn-sm', () => go(DB.nextStudyDay(rid, date, -1))));
    nav.appendChild(btn(U.esc(t('att.today')), 'btn-sm btn-ghost', () => go(Dates.today())));
    nav.appendChild(btn(U.esc(t('att.next')) + ' ›', 'btn-sm', () => go(DB.nextStudyDay(rid, date, 1))));
    const inp = h(`<input type="date" class="input" style="max-width:160px" value="${date}">`);
    inp.addEventListener('change', e => { if (e.target.value) go(e.target.value); });
    nav.appendChild(inp);
    return nav;
  },

  /* صفّ طالبٍ في جدول الحضور */
  attRow(r, date, s){
    const dd = r.days_data[date] || {};
    const a = (dd.att || {})[s.id] || { p: null, late: null, book: null };
    const pres = a.p === 1, abs = a.p === 0;
    const attState = pres ? 'present' : abs ? 'absent' : '';
    const attLbl = pres ? '✅ ' + U.esc(t('att.present')) : abs ? '❌ ' + U.esc(t('att.absent')) : '—';
    const lateOn = pres && a.late != null;
    const bookState = a.book === 1 ? 'yes' : a.book === 0 ? 'no' : '';
    const bookLbl = a.book === 1 ? U.esc(t('att.bookYes')) : a.book === 0 ? U.esc(t('att.bookNo')) : '—';
    const ini = (s.name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('');
    return h(`<tr>
      <td><div style="display:flex;align-items:center;gap:8px">
        <span class="avatar">${U.esc(ini)}</span>
        <div><div class="bold">${U.esc(s.name)}</div><div class="muted small">${U.esc(s.father || '')}</div></div>
      </div></td>
      <td><button class="chip att" data-state="${attState}" data-act="att" data-sid="${s.id}">${attLbl}</button></td>
      <td><span class="att-chips">
        <button class="chip late" data-on="${lateOn ? 1 : 0}" data-act="late" data-sid="${s.id}" ${pres ? '' : 'disabled'}>⏰${lateOn ? ' ' + a.late + ' ' + U.esc(t('att.minutes')) : ''}</button>
        ${lateOn ? `<input type="number" min="0" inputmode="numeric" class="late-input" data-act="latemin" data-sid="${s.id}" value="${a.late}" title="${U.esc(t('att.lateMinPh'))}">` : ''}
      </span></td>
      <td><button class="chip book" data-state="${bookState}" data-act="book" data-sid="${s.id}" ${pres ? '' : 'disabled'}>📝 ${bookLbl}</button></td>
    </tr>`);
  },

  /* تسجيل حضور/غياب الجميع دفعةً واحدة */
  markAll(rid, date, p){
    const dd = DB.day(rid, date, true);
    if (!dd) return;
    for (const s of DB.studentsOf(rid)){
      dd.att[s.id] = Object.assign({ p: null, late: null, book: null }, dd.att[s.id] || {}, { p: p });
      if (p === 0){ dd.att[s.id].late = null; dd.att[s.id].book = null; }
    }
    DB.save();
  },

  /* ملخّص الدَّور في شاشة اليوم */
  todayTurnCard(r, date){
    const rid = r.id;
    const T = TurnEngine.today(r, date);
    const byId = U.byId(DB.students());
    const nameOf = sid => (byId[sid] ? byId[sid].name : '—');

    const card = h(`<div class="card"><div class="card-head">
      <div class="card-title">🔄 ${U.esc(t('turn.todayTurn'))}</div>
      <div class="card-tools"></div></div><div class="queue"></div></div>`);
    card.querySelector('.card-tools').appendChild(btn('⚙ ' + U.esc(t('turn.title')), 'btn-sm btn-ghost', () => this.go('turn')));
    const q = card.querySelector('.queue');

    if (T.noTurn){
      q.appendChild(h(`<div class="q-meta muted">🧪 ${U.esc(this.tx('examDay'))}</div>`));
      return card;
    }
    const attOf = sid => (((r.days_data[date] || {}).att || {})[sid] || null);

    /* المتن */
    if (T.matn.recorded){
      q.appendChild(h(`<div class="q-item today"><span class="q-pos">✓</span>
        <div class="q-main"><div class="q-name">${U.esc(nameOf(T.matn.recorded))} ${T.matn.recordedManual ? '<span title="' + U.esc(t('turn.pickHint')) + '">✋</span>' : ''}</div>
        <div class="q-meta">📖 ${U.esc(t('turn.read'))}</div></div></div>`));
    } else if (T.matn.sid){
      const st = T.matn.st;
      const debt = st && st.owed > 0 ? `<span class="debt-badge">${U.esc(I18N.debtLabel(st.owed))}</span>` : '';
      const item = h(`<div class="q-item today"><span class="q-pos">📖</span>
        <div class="q-main"><div class="q-name">${U.esc(nameOf(T.matn.sid))} ${debt}</div>
        <div class="q-meta">${U.esc(t('turn.cycle', { n: T.matn.cycle }))}</div></div></div>`);
      const b = btn(U.esc(t('turn.read')), 'btn-sm btn-gold', () => DB.setMatn(rid, date, T.matn.sid, false));
      if (attOf(T.matn.sid) && attOf(T.matn.sid).p === 0) b.disabled = true;
      item.appendChild(b);
      q.appendChild(item);
    } else {
      q.appendChild(h(`<div class="q-meta muted">${U.esc(t('turn.empty'))}</div>`));
    }

    /* المطالعة */
    const recs = (r.days_data[date] || {}).mutala || [];
    for (const rec of recs){
      q.appendChild(h(`<div class="q-item done"><span class="q-pos">✓</span>
        <div class="q-main"><div class="q-name">${U.esc(nameOf(rec.sid))} ${rec.manual ? '<span title="' + U.esc(t('turn.pickHint')) + '">✋</span>' : ''}</div>
        <div class="q-meta">${U.esc(t('turn.didMutala'))}</div></div></div>`));
    }
    if (recs.length < T.mutala.slots){
      for (const sch of T.mutala.scheduled.slice(0, T.mutala.slots - recs.length)){
        const debt = sch.st && sch.st.owed > 0 ? `<span class="debt-badge">${U.esc(I18N.debtLabel(sch.st.owed))}</span>` : '';
        const item = h(`<div class="q-item today"><span class="q-pos">🔁</span>
          <div class="q-main"><div class="q-name">${U.esc(nameOf(sch.sid))} ${debt}</div>
          <div class="q-meta">${U.esc(t('turn.cycle', { n: T.mutala.cycle }))}</div></div></div>`);
        const b = btn(U.esc(t('turn.didMutala')), 'btn-sm', () => this.toggleMutala(rid, date, sch.sid, false));
        if (attOf(sch.sid) && attOf(sch.sid).p === 0) b.disabled = true;
        item.appendChild(b);
        q.appendChild(item);
      }
    }
    if (!recs.length && !T.mutala.scheduled.length){
      q.appendChild(h(`<div class="q-meta muted">${U.esc(t('turn.empty'))}</div>`));
    }
    return card;
  },

  /* تبديل مطالعة طالبٍ في يومٍ ما */
  toggleMutala(rid, date, sid, manual){
    const dd = DB.day(rid, date, false) || {};
    const arr = (dd.mutala || []).slice();
    const i = arr.findIndex(x => x.sid === sid);
    if (i >= 0) arr.splice(i, 1);
    else arr.push({ sid: sid, manual: !!manual });
    DB.setMutala(rid, date, arr);
  },

  /* ═══════════════════ شاشة الدَّور ═══════════════════ */
  turnEl(){
    const wrap = h('<div class="screen"></div>');
    const rid = Session.rid();
    if (!rid){ wrap.appendChild(this.noReadingEl()); return wrap; }
    const r = DB.reading(rid);
    if (!Session.d.attDate) Session.set({ attDate: Dates.today() });
    const date = Session.d.attDate;
    const T = TurnEngine.today(r, date);
    const dd = r.days_data[date] || {};
    const byId = U.byId(DB.students());
    const nameOf = sid => (byId[sid] ? byId[sid].name : '—');
    const students = DB.studentsOf(rid);

    const head = h(`<div class="screen-head"><div>
      <div class="screen-title">${U.esc(t('turn.title'))}</div>
      <div class="screen-sub">${U.esc(t('turn.sub'))} — ${U.esc(I18N.fmtDate(Dates.fromISO(date)))}</div></div>
      <div class="screen-actions"></div></div>`);
    const acts = head.querySelector('.screen-actions');
    const noTurnChip = h(`<button class="chip day" data-on="${dd.noTurn ? 1 : 0}" title="${U.esc(this.tx('examDay'))}">🧪 ${U.esc(this.tx('examDay'))}</button>`);
    noTurnChip.addEventListener('click', () => DB.setNoTurn(rid, date, !dd.noTurn));
    acts.appendChild(noTurnChip);
    acts.appendChild(this.dateNav(rid, date));
    wrap.appendChild(head);

    if (dd.noTurn){
      wrap.appendChild(h(`<div class="card"><div class="empty">
        <div class="empty-ico">🧪</div>
        <div class="empty-title">${U.esc(this.tx('examDay'))}</div></div></div>`));
    } else {
      const grid = h('<div class="turngrid"></div>');
      grid.appendChild(this.matnTurnCol(r, date, T, nameOf, students));
      grid.appendChild(this.mutalaTurnCol(r, date, T, nameOf, students));
      wrap.appendChild(grid);
    }
    wrap.appendChild(this.queueCard(T, nameOf));
    return wrap;
  },

  /* عمود المتن */
  matnTurnCol(r, date, T, nameOf, students){
    const rid = r.id;
    const col = h(`<div class="card turncol"><div class="turncol-title">📖 ${U.esc(t('turn.matn'))}
      <small class="muted small">${U.esc(t('turn.matnSub'))}</small></div></div>`);
    const dd = r.days_data[date] || {};
    const attOf = sid => ((dd.att || {})[sid] || null);

    if (dd.matn){
      const c = h('<div class="turn-card today"></div>');
      const item = h(`<div class="q-item today"><span class="q-pos">✓</span>
        <div class="q-main"><div class="q-name">${U.esc(nameOf(dd.matn.sid))} ${dd.matn.manual ? '<span title="' + U.esc(t('turn.pickHint')) + '">✋</span>' : ''}</div>
        <div class="q-meta">📖 ${U.esc(t('turn.read'))}</div></div></div>`);
      item.appendChild(btn('✕', 'btn-sm btn-danger', () => DB.setMatn(rid, date, null), t('gen.cancel')));
      c.appendChild(item);
      const next = T.state.matn.pending[0];
      c.appendChild(h(`<div class="q-meta muted">▶ ${U.esc(this.tx('nextUp'))}: ${next ? U.esc(nameOf(next)) : U.esc(t('turn.empty'))}</div>`));
      col.appendChild(c);
    } else if (T.matn.sid){
      const sid = T.matn.sid, st = T.matn.st;
      const note = st.misses === 1 ? t('turn.carryNote')
                 : st.misses > 1 ? t('turn.doubleNote')
                 : (st.served && st.owed > 0 ? t('turn.seqNote') : '');
      const meta = U.esc(t('turn.cycle', { n: T.matn.cycle })) +
        (note ? ' — <span class="muted">' + U.esc(note) + '</span>' : '');
      const c = h(`<div class="turn-card today"><div class="q-item today">
        <span class="q-pos">${T.state.matn.pending.indexOf(sid) + 1}</span>
        <div class="q-main"><div class="q-name">${U.esc(nameOf(sid))}
          ${st.owed > 0 ? `<span class="debt-badge">${U.esc(I18N.debtLabel(st.owed))}</span>` : ''}
        </div><div class="q-meta">${meta}</div></div></div></div>`);
      const acts = h('<div class="turn-actions"></div>');
      const b = btn('📖 ' + U.esc(t('turn.read')), 'btn-gold btn-sm', () => DB.setMatn(rid, date, sid, false));
      const a = attOf(sid);
      if (a && a.p === 0) b.disabled = true;
      acts.appendChild(b);
      c.appendChild(acts);
      col.appendChild(c);
    } else {
      col.appendChild(h(`<div class="turn-card empty">${U.esc(t('turn.empty'))}${students.length ? '' : '<div class="hint">' + U.esc(t('turn.noStudents')) + '</div>'}</div>`));
    }

    /* الاختيار اليدوي — أنت تختار القارئ */
    const manual = h(`<div class="turn-card"><select class="turn-pick"></select>
      <div class="turn-actions"></div>
      <div class="hint">${U.esc(t('turn.pickHint'))} · ${U.esc(t('turn.manualNote'))}</div></div>`);
    const sel = manual.querySelector('select');
    sel.appendChild(h(`<option value="">${U.esc(t('turn.pick'))}</option>`));
    for (const s of students){
      if (dd.matn && dd.matn.sid === s.id) continue;
      const st = T.state.matn.st[s.id];
      const debt = st && st.owed > 0 ? ' ⚠' + st.owed : '';
      sel.appendChild(h(`<option value="${s.id}">${U.esc(s.name + debt)}</option>`));
    }
    manual.querySelector('.turn-actions').appendChild(btn(U.esc(t('gen.save')), 'btn-sm', () => {
      if (!sel.value){ this.toast(t('gen.required'), 'err'); return; }
      DB.setMatn(rid, date, sel.value, true);
      this.toast(t('turn.pickedSaved'));
    }));
    col.appendChild(manual);
    return col;
  },

  /* عمود المطالعة */
  mutalaTurnCol(r, date, T, nameOf, students){
    const rid = r.id;
    const col = h(`<div class="card turncol"><div class="turncol-title">🔁 ${U.esc(t('turn.mutala'))}
      <small class="muted small">${U.esc(t('turn.mutalaSub'))}</small></div></div>`);
    const dd = r.days_data[date] || {};
    const recs = dd.mutala || [];
    const slots = T.mutala.slots;
    const attOf = sid => ((dd.att || {})[sid] || null);

    /* خانة واحدة أم خانتان */
    const slotRow = h('<div class="att-chips" style="margin-bottom:8px"></div>');
    slotRow.title = t('turn.mutalaSub');
    for (const n of [1, 2]){
      const c = h(`<button class="chip day" data-on="${slots === n ? 1 : 0}" title="${U.esc(t('turn.mutalaSub'))}">${n}</button>`);
      c.addEventListener('click', () => DB.setMutalaCount(rid, date, n));
      slotRow.appendChild(c);
    }
    col.appendChild(slotRow);

    const todayCard = h('<div class="turn-card today"></div>');
    for (const rec of recs){
      const item = h(`<div class="q-item done"><span class="q-pos">✓</span>
        <div class="q-main"><div class="q-name">${U.esc(nameOf(rec.sid))} ${rec.manual ? '<span title="' + U.esc(t('turn.pickHint')) + '">✋</span>' : ''}</div>
        <div class="q-meta">${U.esc(t('turn.didMutala'))}</div></div></div>`);
      item.appendChild(btn('✕', 'btn-sm btn-danger', () => this.toggleMutala(rid, date, rec.sid, false), t('gen.cancel')));
      todayCard.appendChild(item);
    }
    if (recs.length < slots){
      for (const sch of T.mutala.scheduled.slice(0, slots - recs.length)){
        const st = sch.st;
        const note = st && st.misses === 1 ? t('turn.carryNote')
                   : st && st.misses > 1 ? t('turn.doubleNote') : '';
        const meta = U.esc(t('turn.cycle', { n: T.mutala.cycle })) +
          (note ? ' — <span class="muted">' + U.esc(note) + '</span>' : '');
        const item = h(`<div class="q-item today">
          <span class="q-pos">${T.state.mutala.pending.indexOf(sch.sid) + 1}</span>
          <div class="q-main"><div class="q-name">${U.esc(nameOf(sch.sid))}
            ${st && st.owed > 0 ? `<span class="debt-badge">${U.esc(I18N.debtLabel(st.owed))}</span>` : ''}
          </div><div class="q-meta">${meta}</div></div></div>`);
        const b = btn('🔁 ' + U.esc(t('turn.didMutala')), 'btn-sm btn-gold', () => this.toggleMutala(rid, date, sch.sid, false));
        const a = attOf(sch.sid);
        if (a && a.p === 0) b.disabled = true;
        item.appendChild(b);
        todayCard.appendChild(item);
      }
    }
    if (!todayCard.children.length){
      todayCard.classList.add('empty');
      todayCard.innerHTML = `<span>${U.esc(t('turn.empty'))}</span>${students.length ? '' : '<div class="hint">' + U.esc(t('turn.noStudents')) + '</div>'}`;
    }
    col.appendChild(todayCard);

    /* الاختيار اليدوي للمطالِع */
    const manual = h(`<div class="turn-card"><select class="turn-pick"></select>
      <div class="turn-actions"></div><div class="hint">${U.esc(t('turn.pickHint'))}</div></div>`);
    const sel = manual.querySelector('select');
    sel.appendChild(h(`<option value="">${U.esc(t('turn.pick'))}</option>`));
    for (const s of students){
      if (recs.some(x => x.sid === s.id)) continue;
      const st = T.state.mutala.st[s.id];
      const debt = st && st.owed > 0 ? ' ⚠' + st.owed : '';
      sel.appendChild(h(`<option value="${s.id}">${U.esc(s.name + debt)}</option>`));
    }
    manual.querySelector('.turn-actions').appendChild(btn(U.esc(t('gen.save')), 'btn-sm', () => {
      if (!sel.value){ this.toast(t('gen.required'), 'err'); return; }
      this.toggleMutala(rid, date, sel.value, true);
      this.toast(t('turn.pickedSaved'));
    }));
    col.appendChild(manual);
    return col;
  },

  /* بطاقة قائمة الدَّور الكاملة (المسلكان + الدورة + الدُّيون) */
  queueCard(T, nameOf){
    const card = h(`<div class="card"><div class="card-head">
      <div class="card-title">🔢 ${U.esc(t('turn.queue'))}</div>
      <small class="muted small">${U.esc(t('turn.queueSub'))}</small></div>
      <div class="grid g-2"></div>
      <div class="hint" style="margin-top:10px">${U.esc(t('turn.seqNote'))}</div></div>`);
    const grid = card.querySelector('.grid');
    grid.appendChild(this.queueCol('📖 ' + U.esc(t('turn.matn')),  T.state.matn,  nameOf));
    grid.appendChild(this.queueCol('🔁 ' + U.esc(t('turn.mutala')), T.state.mutala, nameOf));
    return card;
  },
  queueCol(title, lane, nameOf){
    const col = h(`<div><div class="turncol-title">${title}
      <small class="muted small">${U.esc(t('turn.cycle', { n: lane.cycle }))}</small></div>
      <div class="queue"></div></div>`);
    const q = col.querySelector('.queue');
    lane.pending.forEach((sid, i) => {
      const st = lane.st[sid];
      const debt = st && st.owed > 0 ? `<span class="debt-badge">${U.esc(I18N.debtLabel(st.owed))}</span>` : '';
      q.appendChild(h(`<div class="q-item ${i === 0 ? 'today' : ''}">
        <span class="q-pos">${i + 1}</span>
        <div class="q-main"><div class="q-name">${U.esc(nameOf(sid))}</div></div>${debt}</div>`));
    });
    for (const sid of lane.order){
      if (lane.done.has(sid)){
        q.appendChild(h(`<div class="q-item done"><span class="q-pos">✓</span>
          <div class="q-main"><div class="q-name">${U.esc(nameOf(sid))}</div>
          <div class="q-meta">${U.esc(t('turn.done'))}</div></div></div>`));
      }
    }
    if (!q.children.length) q.appendChild(h(`<div class="q-meta muted">${U.esc(t('turn.empty'))}</div>`));
    return col;
  },

  /* ═══════════════════ شاشة الطلاب ═══════════════════ */
  studentsEl(){
    const wrap = h('<div class="screen"></div>');
    const rid = Session.rid();
    const r = rid ? DB.reading(rid) : null;

    const head = h(`<div class="screen-head"><div>
      <div class="screen-title">${U.esc(t('students.title'))}</div>
      <div class="screen-sub">${U.esc(t('students.sub'))}</div></div>
      <div class="screen-actions"></div></div>`);
    const acts = head.querySelector('.screen-actions');
    acts.appendChild(btn('＋ ' + U.esc(t('students.add')), 'btn-gold', () => this.studentModal(null)));
    if (r && window.PDFGen)
      acts.appendChild(btn('🖨 ' + U.esc(this.tx('pdfNames')), 'btn-sm', () => PDFGen.namesList(rid)));
    wrap.appendChild(head);

    wrap.appendChild(h(`<div class="stats">
      <div class="stat"><div class="stat-num">${U.esc(I18N.studentsCount(DB.students().length))}</div>
      <div class="stat-lbl">${U.esc(t('students.title'))}</div></div></div>`));

    const card = h('<div class="card"><div class="card-head"><div class="card-title">👥</div><div class="card-tools grow"></div></div></div>');
    const tools = card.querySelector('.card-tools');
    const search = h(`<input class="input" placeholder="${U.esc(t('students.search'))}" style="max-width:340px;width:100%">`);
    tools.appendChild(search);
    tools.style.justifyContent = 'flex-end';

    const tbl = h(`<div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th>#</th><th>${U.esc(t('gen.name'))}</th><th>${U.esc(t('students.parentPhone'))}</th>
      ${r ? `<th>${U.esc(r.name)}</th>` : ''}<th style="text-align:end">${U.esc(t('gen.actions'))}</th>
    </tr></thead><tbody></tbody></table></div>`);
    card.appendChild(tbl);
    wrap.appendChild(card);

    const tb = tbl.querySelector('tbody');
    const renderRows = () => {
      const q = (search.value || '').trim().toLowerCase();
      tb.innerHTML = '';
      const list = DB.students().filter(s =>
        !q || (s.name || '').toLowerCase().includes(q) ||
              (s.father || '').toLowerCase().includes(q) ||
              (s.parentPhone || '').includes(q));
      if (!list.length){
        tb.appendChild(h(`<tr><td colspan="5" class="muted" style="text-align:center;padding:22px">${U.esc(t('students.none'))}</td></tr>`));
        return;
      }
      list.forEach((s, i) => {
        const enrolled = r ? r.studentIds.includes(s.id) : false;
        const ini = (s.name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('');
        const tr = h(`<tr>
          <td class="num muted">${i + 1}</td>
          <td><div style="display:flex;align-items:center;gap:8px">
            <span class="avatar">${U.esc(ini)}</span>
            <div><div class="bold">${U.esc(s.name)}</div><div class="muted small">${U.esc(s.father || '')}</div></div>
          </div></td>
          <td>${s.parentPhone ? `<a class="chip" href="tel:${U.esc(s.parentPhone)}">📞 ${U.esc(s.parentPhone)}</a>` : '<span class="muted">—</span>'}</td>
          ${r ? `<td><button class="chip day" data-on="${enrolled ? 1 : 0}" title="${U.esc(r.name)}">${enrolled ? '✔' : '＋'}</button></td>` : ''}
          <td><div class="row-actions"></div></td></tr>`);
        const enrollBtn = tr.querySelector('[data-on]');
        if (enrollBtn) enrollBtn.addEventListener('click', () => {
          enrolled ? DB.unenroll(rid, s.id) : DB.enroll(rid, s.id);
        });
        const ra = tr.querySelector('.row-actions');
        ra.appendChild(btn('✎', 'btn-sm', () => this.studentModal(s), t('students.edit')));
        ra.appendChild(btn('🗑', 'btn-sm btn-danger', async () => {
          if (await this.confirm(U.esc(t('students.confirmDelete', { name: s.name }))))
            DB.deleteStudent(s.id);
        }, t('gen.del')));
        tb.appendChild(tr);
      });
    };
    search.addEventListener('input', renderRows);
    renderRows();
    return wrap;
  },

  /* نافذة إضافة/تعديل طالب */
  studentModal(s){
    const rid = Session.rid();
    const r = rid ? DB.reading(rid) : null;
    const isNew = !s;
    let enroll = isNew ? !!r : (r ? r.studentIds.includes(s.id) : false);

    const body = h(`<div class="form-grid">
      <div class="field"><label>${U.esc(t('students.name'))} <span class="req">*</span></label>
        <input class="input" id="stName" placeholder="${U.esc(t('students.namePh'))}" value="${s ? U.esc(s.name) : ''}"></div>
      <div class="field"><label>${U.esc(t('students.father'))} <span class="req">*</span></label>
        <input class="input" id="stFather" placeholder="${U.esc(t('students.fatherPh'))}" value="${s ? U.esc(s.father || '') : ''}"></div>
      <div class="field"><label>${U.esc(t('students.parentPhone'))} <span class="req">*</span></label>
        <input class="input" id="stPhone" inputmode="tel" placeholder="${U.esc(t('students.parentPhonePh'))}" value="${s ? U.esc(s.parentPhone || '') : ''}">
        <span class="hint">${U.esc(t('students.parentPhoneHint'))}</span></div>
      ${r ? `<div class="field"><label>${U.esc(r.name)}</label><div class="att-chips" id="stEnroll"></div></div>` : ''}
    </div>`);
    if (r){
      const chip = h(`<button type="button" class="chip day" data-on="${enroll ? 1 : 0}">${enroll ? '✔' : '＋'}</button>`);
      chip.addEventListener('click', () => { enroll = !enroll; chip.dataset.on = enroll ? 1 : 0; });
      body.querySelector('#stEnroll').appendChild(chip);
    }

    this.modal({
      title: (isNew ? '＋ ' : '✎ ') + U.esc(t(isNew ? 'students.add' : 'students.edit')),
      body: body,
      foot: [
        { label: U.esc(t('gen.save')), cls: 'btn-gold', onClick: c => {
            const name   = c.el.querySelector('#stName').value.trim();
            const father = c.el.querySelector('#stFather').value.trim();
            const phone  = c.el.querySelector('#stPhone').value.trim();
            if (!name || !father || !phone){ this.toast(t('gen.required'), 'err'); return; }
            if (isNew){
              const ns = DB.addStudent({ name, father, parentPhone: phone }, enroll ? rid : null);
              void ns;
            } else {
              DB.updateStudent(s.id, { name, father, parentPhone: phone });
              if (r){
                if (enroll && !r.studentIds.includes(s.id)) DB.enroll(rid, s.id);
                if (!enroll && r.studentIds.includes(s.id)) DB.unenroll(rid, s.id);
              }
            }
            this.toast(t('students.saved'));
            c.close();
          } },
        { label: U.esc(t('gen.cancel')), onClick: c => c.close() }
      ]
    });
  },

  /* ═══════════════════ شاشة الاختبارات ═══════════════════ */
  examsEl(){
    const wrap = h('<div class="screen"></div>');
    const rid = Session.rid();
    if (!rid){ wrap.appendChild(this.noReadingEl()); return wrap; }

    const head = h(`<div class="screen-head"><div>
      <div class="screen-title">${U.esc(t('exam.title'))}</div>
      <div class="screen-sub">${U.esc(t('exam.sub'))}</div></div>
      <div class="screen-actions"></div></div>`);
    head.querySelector('.screen-actions').appendChild(btn('＋ ' + U.esc(t('exam.new')), 'btn-gold', () => this.examBuilder()));
    wrap.appendChild(head);

    const card = h('<div class="card"></div>');
    const list = DB.exams(rid);
    if (!list.length){
      card.innerHTML = `<div class="empty"><div class="empty-ico">✍️</div>
        <div class="empty-title">${U.esc(t('exam.empty'))}</div></div>`;
    } else {
      const tw = h(`<div class="tbl-wrap"><table class="tbl"><thead><tr>
        <th>${U.esc(t('exam.number'))}</th><th>${U.esc(t('gen.date'))}</th>
        <th title="${U.esc(t('exam.pagesQ'))}">📄</th><th>❓</th>
        <th style="text-align:end">${U.esc(t('gen.actions'))}</th></tr></thead><tbody></tbody></table></div>`);
      const tb = tw.querySelector('tbody');
      for (const e of list){
        const tr = h(`<tr>
          <td class="num bold">${e.num}</td>
          <td class="num">${U.esc(e.date || '')}</td>
          <td class="num">📄 ${e.pages || 1}</td>
          <td class="num">${e.questions.length}</td>
          <td><div class="row-actions"></div></td></tr>`);
        const ra = tr.querySelector('.row-actions');
        ra.appendChild(btn('🖨 ' + U.esc(t('exam.viewPdf')), 'btn-sm', () => {
          if (window.PDFGen) PDFGen.exam(e);
        }));
        ra.appendChild(btn('📊', 'btn-sm', () => this.examResultsModal(e), t('exam.results')));
        ra.appendChild(btn('🗑', 'btn-sm btn-danger', async () => {
          if (await this.confirm(U.esc(t('exam.confirmDelete')))) DB.deleteExam(e.id);
        }, t('gen.del')));
        tb.appendChild(tr);
      }
      card.appendChild(tw);
    }
    wrap.appendChild(card);
    return wrap;
  },

  /* بنّاء الاختبار — الأنواع الثلاثة */
  examBuilder(){
    const rid = Session.rid();
    const r = DB.reading(rid);
    if (!r){ this.toast(t('gen.error'), 'err'); return; }

    const draft = {
      date: Dates.today(), book: r.book || '', readingName: r.name,
      pages: 1, secs: { essay: [], mcq: [], tf: [] }
    };
    const secKey = { essay: 'typeEssay', mcq: 'typeMcq', tf: 'typeTf' };
    const secIco = { essay: '🖊', mcq: '⚖️', tf: '✔️✖️' };
    const bodyEl = h('<div style="display:flex;flex-direction:column;gap:14px"></div>');

    const ctx = this.modal({
      title: '✍️ ' + U.esc(t('exam.new')),
      body: bodyEl, lg: true,
      foot: [
        { label: '🖨 ' + U.esc(t('exam.generate')), cls: 'btn-gold', onClick: () => {
            const qs = [];
            for (const q of draft.secs.essay)
              if (q.text.trim()) qs.push({ type: 'essay', text: q.text.trim(), opts: [] });
            let mcqBad = false;
            for (const q of draft.secs.mcq){
              if (!q.text.trim()) continue;
              const opts = q.opts.map(o => o.trim()).filter(Boolean);
              if (opts.length < 2){ mcqBad = true; continue; }
              qs.push({ type: 'mcq', text: q.text.trim(), opts: opts });
            }
            for (const q of draft.secs.tf)
              if (q.text.trim()) qs.push({ type: 'tf', text: q.text.trim(), opts: [] });
            if (!qs.length || mcqBad){ this.toast(t('gen.required'), 'err'); return; }
            const e = DB.addExam({
              rid: rid, date: draft.date || Dates.today(), pages: draft.pages,
              book: draft.book.trim(), readingName: draft.readingName.trim() || r.name,
              questions: qs
            });
            ctx.close();
            this.toast(t('exam.saved'));
            if (window.PDFGen) PDFGen.exam(e);
          } },
        { label: U.esc(t('gen.cancel')), onClick: c => c.close() }
      ]
    });

    const render = () => {
      bodyEl.innerHTML = '';

      /* البيانات الأساسية */
      const meta = h(`<div class="form-grid">
        <div class="field"><label>${U.esc(t('exam.number'))}</label>
          <input class="input" value="${DB.nextExamNum(rid)}" disabled>
          <span class="hint">${U.esc(t('exam.numberHint'))}</span></div>
        <div class="field"><label>${U.esc(t('gen.date'))}</label>
          <input type="date" class="input" id="exDate" value="${draft.date}"></div>
        <div class="field"><label>${U.esc(t('exam.book'))}</label>
          <input class="input" id="exBook" placeholder="${U.esc(t('wiz.bookNamePh'))}" value="${U.esc(draft.book)}"></div>
        <div class="field"><label>${U.esc(t('exam.reading'))}</label>
          <input class="input" id="exRead" value="${U.esc(draft.readingName)}"></div>
        <div class="field"><label>${U.esc(t('exam.pagesQ'))}</label>
          <div class="att-chips" id="exPages"></div>
          <span class="hint">${U.esc(t('exam.autoFitNote'))}</span></div>
      </div>`);
      bodyEl.appendChild(meta);
      meta.querySelector('#exDate').addEventListener('change', e => draft.date = e.target.value || Dates.today());
      meta.querySelector('#exBook').addEventListener('input', e => draft.book = e.target.value);
      meta.querySelector('#exRead').addEventListener('input', e => draft.readingName = e.target.value);
      const pg = meta.querySelector('#exPages');
      for (const n of [1, 2]){
        const c = h(`<button type="button" class="chip day" data-on="${draft.pages === n ? 1 : 0}">${U.esc(t(n === 1 ? 'exam.onePage' : 'exam.twoPages'))}</button>`);
        c.addEventListener('click', () => { draft.pages = n; render(); });
        pg.appendChild(c);
      }

      /* الأقسام الثلاثة */
      for (const sec of ['essay', 'mcq', 'tf']){
        const list = draft.secs[sec];
        const secEl = h(`<div class="card" style="padding:10px"><div class="card-head">
          <div class="card-title">${secIco[sec]} ${U.esc(t('exam.' + secKey[sec]))}
            <span class="rtab-count">${list.length}</span></div>
          <div class="card-tools"></div></div><div class="q-list" style="display:flex;flex-direction:column;gap:9px"></div></div>`);
        secEl.querySelector('.card-tools').appendChild(btn('＋ ' + U.esc(t('exam.addQ')), 'btn-sm', () => {
          list.push(sec === 'mcq' ? { text: '', opts: ['', ''] } : { text: '' });
          render();
        }));
        const ql = secEl.querySelector('.q-list');

        list.forEach((q, qi) => {
          const qEl = h(`<div class="q-edit">
            <div class="q-edit-head"><span class="q-num">${qi + 1}</span>
              <textarea class="textarea" style="min-height:54px;flex:1" placeholder="${U.esc(t('exam.qPh'))}">${U.esc(q.text)}</textarea>
              <button class="btn btn-sm btn-danger" title="${U.esc(t('exam.removeQ'))}">✕</button></div>
            ${sec === 'mcq' ? '<div class="opts" style="display:flex;flex-direction:column;gap:6px"></div>' : ''}
          </div>`);
          qEl.querySelector('textarea').addEventListener('input', e => q.text = e.target.value);
          qEl.querySelector('.btn-danger').addEventListener('click', () => { list.splice(qi, 1); render(); });

          if (sec === 'mcq'){
            const opts = qEl.querySelector('.opts');
            const renderOpts = () => {
              opts.innerHTML = '';
              const L = I18N.optionLetters();
              q.opts.forEach((o, oi) => {
                const row = h(`<div class="opt-row">
                  <span class="q-num">(${L[oi] || '·'})</span>
                  <input class="input" placeholder="${U.esc(t('exam.optPh'))}" value="${U.esc(o)}">
                  <button class="btn btn-sm btn-danger" title="${U.esc(t('exam.removeOpt'))}">✕</button></div>`);
                row.querySelector('.input').addEventListener('input', e => q.opts[oi] = e.target.value);
                row.querySelector('button').addEventListener('click', () => {
                  if (q.opts.length <= 2){ this.toast(t('gen.required'), 'err'); return; }
                  q.opts.splice(oi, 1); renderOpts();
                });
                opts.appendChild(row);
              });
              opts.appendChild(btn('＋ ' + U.esc(t('exam.addOpt')), 'btn-sm btn-ghost', () => { q.opts.push(''); renderOpts(); }));
            };
            renderOpts();
          }
          ql.appendChild(qEl);
        });
        bodyEl.appendChild(secEl);
      }
    };
    render();
  },

  /* نافذة نتائج اختبار */
  examResultsModal(e){
    const students = DB.studentsOf(e.rid);
    const total0 = e.questions.length || 10;
    const body = h(`<div>
      <div class="form-grid">
        <div class="field"><label>${U.esc(t('exam.score'))} (${U.esc(t('exam.of'))}…)</label>
          <input type="number" min="0" class="input" id="rzTotal" value="${total0}" style="max-width:140px"></div>
      </div>
      <div class="tbl-wrap" style="margin-top:10px"><table class="tbl"><thead><tr>
        <th>${U.esc(t('gen.name'))}</th><th>${U.esc(t('exam.score'))}</th></tr></thead><tbody></tbody></table></div>
    </div>`);
    const tb = body.querySelector('tbody');
    if (!students.length){
      tb.appendChild(h(`<tr><td colspan="2" class="muted" style="text-align:center;padding:18px">${U.esc(t('students.none'))}</td></tr>`));
    }
    for (const s of students){
      const cur = (e.results || {})[s.id];
      tb.appendChild(h(`<tr><td>${U.esc(s.name)}</td>
        <td><input type="number" min="0" class="input" style="width:92px" data-sid="${s.id}"
          value="${cur ? cur.score : ''}" placeholder="${total0}"></td></tr>`));
    }
    this.modal({
      title: '📊 ' + U.esc(t('exam.results')) + ' — ' + U.esc(t('pdf.examWord', { n: e.num })),
      body: body,
      foot: [
        { label: U.esc(t('exam.saveResult')), cls: 'btn-gold', onClick: c => {
            const exam = DB.exam(e.id);
            if (!exam) { c.close(); return; }
            exam.results = exam.results || {};
            const total = parseInt(c.el.querySelector('#rzTotal').value, 10) || total0;
            c.el.querySelectorAll('input[data-sid]').forEach(inp => {
              if (inp.value !== '')
                exam.results[inp.dataset.sid] = { score: parseInt(inp.value, 10) || 0, total: total };
            });
            DB.save();
            this.toast(t('exam.resultSaved'));
            c.close();
          } },
        { label: U.esc(t('gen.cancel')), onClick: c => c.close() }
      ]
    });
  },

  /* ═══════════════════ شاشة الإعدادات ═══════════════════ */
  settingsEl(){
    const wrap = h('<div class="screen"></div>');
    wrap.appendChild(h(`<div class="screen-head"><div>
      <div class="screen-title">${U.esc(t('set.title'))}</div>
      <div class="screen-sub">${U.esc(t('set.sub'))}</div></div></div>`));

    const rid = Session.rid();
    const r = rid ? DB.reading(rid) : null;

    /* ١) اللغة */
    const langCard = h(`<div class="card"><div class="card-head">
      <div class="card-title">🌐 ${U.esc(t('set.language'))}</div></div></div>`);
    const langSel = h(`<select class="select" style="max-width:230px">
      <option value="ar" ${I18N.lang === 'ar' ? 'selected' : ''}>العربية</option>
      <option value="en" ${I18N.lang === 'en' ? 'selected' : ''}>English</option>
      <option value="am" ${I18N.lang === 'am' ? 'selected' : ''}>አማርኛ</option></select>`);
    langSel.addEventListener('change', e => {
      I18N.setLang(e.target.value);
      this.renderAll();
    });
    langCard.appendChild(langSel);
    wrap.appendChild(langCard);

    /* ٢) المزامنة السحابية */
    wrap.appendChild(this.cloudCard());

    /* ٣) أيام الدراسة للقراءة النشطة */
    if (r){
      const daysCard = h(`<div class="card"><div class="card-head">
        <div class="card-title">📅 ${U.esc(t('set.manageDays'))} — ${U.esc(r.name)}</div></div>
        <div class="day-grid" style="margin-top:8px"></div></div>`);
      const dg = daysCard.querySelector('.day-grid');
      const daysSet = new Set(r.days);
      I18N.dayNames().forEach((dn, i) => {
        const c = h(`<button class="chip day" data-on="${daysSet.has(i) ? 1 : 0}">${U.esc(dn)}</button>`);
        c.addEventListener('click', () => {
          daysSet.has(i) ? daysSet.delete(i) : daysSet.add(i);
          c.dataset.on = daysSet.has(i) ? 1 : 0;
          DB.updateReading(rid, { days: [...daysSet] });
        });
        dg.appendChild(c);
      });
      wrap.appendChild(daysCard);
    }

    /* ٤) إدارة القراءات */
    const readsCard = h(`<div class="card"><div class="card-head">
      <div class="card-title">📚 ${U.esc(t('set.manageReadings'))}</div>
      <div class="card-tools"></div></div><div class="queue" style="margin-top:8px"></div></div>`);
    readsCard.querySelector('.card-tools').appendChild(btn('＋ ' + U.esc(t('tabs.newReading')), 'btn-sm btn-gold', () => this.readingModal(null)));
    const rq = readsCard.querySelector('.queue');
    for (const rd of DB.readings()){
      const item = h(`<div class="q-item ${rd.id === rid ? 'today' : ''}">
        <span class="q-pos">📖</span>
        <div class="q-main"><div class="q-name">${U.esc(rd.name)}</div>
        <div class="q-meta">${U.esc(rd.book || '')}${rd.teacher ? ' · ' + U.esc(rd.teacher) : ''} · 👥 ${rd.studentIds.length}</div></div>
        <div class="row-actions"></div></div>`);
      const ra = item.querySelector('.row-actions');
      ra.appendChild(btn('✎', 'btn-sm', () => this.readingModal(rd), t('gen.edit')));
      ra.appendChild(btn('🗑', 'btn-sm btn-danger', async () => {
        if (await this.confirm(U.esc(t('read.confirmDelete')))) DB.deleteReading(rd.id);
      }, t('gen.del')));
      rq.appendChild(item);
    }
    if (!DB.readings().length)
      rq.appendChild(h(`<div class="q-meta muted">${U.esc(t('turn.empty'))}</div>`));
    wrap.appendChild(readsCard);

    /* ٥) النسخ الاحتياطي */
    const bkCard = h(`<div class="card"><div class="card-head">
      <div class="card-title">💾 ${U.esc(t('set.backup'))}</div>
      <div class="card-tools"></div></div></div>`);
    const bkTools = bkCard.querySelector('.card-tools');
    bkTools.appendChild(btn('⬇ ' + U.esc(t('set.exportBtn')), 'btn-sm', () => {
      const blob = new Blob([DB.exportJSON()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'durra-backup-' + Dates.today() + '.json';
      a.click();
      URL.revokeObjectURL(a.href);
    }));
    const fileInp = h('<input type="file" accept=".json,application/json" hidden>');
    fileInp.addEventListener('change', () => {
      const f = fileInp.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        if (DB.importJSON(rd.result)) this.toast(t('set.imported'));
        else this.toast(t('set.importErr'), 'err');
      };
      rd.readAsText(f);
    });
    bkTools.appendChild(fileInp);
    bkTools.appendChild(btn('⬆ ' + U.esc(t('set.importBtn')), 'btn-sm', () => fileInp.click()));
    wrap.appendChild(bkCard);

    /* ٦) التثبيت */
    const instState = window.__installState || 'unsupported';
    const instCard = h(`<div class="card"><div class="card-head">
      <div class="card-title">⤓ ${U.esc(t('set.install'))}</div>
      <div class="card-tools"></div></div></div>`);
    const instTools = instCard.querySelector('.card-tools');
    if (instState === 'installed'){
      instTools.appendChild(h(`<span class="chip" style="color:var(--ok)">✔ ${U.esc(t('set.installed'))}</span>`));
    } else {
      const b = btn(U.esc(t('set.install')), 'btn-sm btn-gold', () => { if (window.__installApp) window.__installApp(); });
      if (instState !== 'available') b.disabled = true;
      instTools.appendChild(b);
    }
    wrap.appendChild(instCard);

    /* ٧) الخطر */
    const dgCard = h(`<div class="card" style="border-color:rgba(255,90,90,.35)"><div class="card-head">
      <div class="card-title" style="color:var(--err)">⚠️ ${U.esc(t('set.danger'))}</div>
      <div class="card-tools"></div></div></div>`);
    dgCard.querySelector('.card-tools').appendChild(btn(U.esc(t('set.clear')), 'btn-sm btn-danger', async () => {
      if (await this.confirm(U.esc(t('set.clearConfirm')))){
        Session.set({ rid: null, view: 'today', attDate: null });
        DB.clearAll();
      }
    }));
    wrap.appendChild(dgCard);

    /* ٨) حول */
    wrap.appendChild(h(`<div class="card"><div class="card-head">
      <div class="card-title">ℹ️ ${U.esc(t('set.about'))}</div></div>
      <div class="muted small">✦ ${U.esc(t('app.title'))} — ${U.esc(t('app.subtitle'))}<br>
      ${U.esc(t('set.version'))}: ${document.documentElement.dataset.version || '1.0.0'}</div></div>`));

    return wrap;
  },

  /* بطاقة المزامنة السحابية (الرمز + QR + الإقران) */
  cloudCard(){
    const card = h(`<div class="card"><div class="card-head">
      <div class="card-title">☁️ ${U.esc(t('set.cloudTitle'))}</div>
      <div class="card-tools"><span class="chip" id="csStat"></span></div></div>
      <p class="muted small">${U.esc(t('set.cloudDesc'))}</p>
      <div id="csBody" style="display:flex;flex-direction:column;gap:12px;margin-top:10px"></div></div>`);
    const stat = card.querySelector('#csStat');
    stat.textContent = CloudSync.isActive() ? t('set.syncOn') : t('set.syncOff');
    stat.style.color = CloudSync.isActive() ? 'var(--ok)' : 'var(--ink-faint)';
    const body = card.querySelector('#csBody');

    if (CloudSync.isActive()){
      /* الرمز + نسخه */
      const codeRow = h('<div class="rep-tools"></div>');
      codeRow.appendChild(h(`<span>${U.esc(t('set.code'))}: <b class="gold-text" style="letter-spacing:1px">${U.esc(CloudSync.codeGrouped())}</b></span>`));
      codeRow.appendChild(btn('📋 ' + U.esc(t('rep.copy')), 'btn-sm', () => {
        navigator.clipboard.writeText(CloudSync.code())
          .then(() => this.toast(t('rep.copied')))
          .catch(() => this.toast(t('rep.copyErr'), 'err'));
      }));
      body.appendChild(codeRow);

      /* رمز QR للإقران التلقائي */
      const url = CloudSync.pairURL();
      if (url){
        body.appendChild(h(`<div style="text-align:center">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${encodeURIComponent(url)}"
               width="170" height="170" alt="QR"
               style="border-radius:12px;border:1px solid var(--line);background:#fff;padding:6px">
          <div class="hint">${U.esc(t('set.codeHint'))}</div></div>`));
      }

      /* إقران جهازٍ آخر بالرمز */
      const pairRow = h('<div class="searchbar"></div>');
      const pin = h(`<input class="input" placeholder="${U.esc(t('set.pairPh'))}" inputmode="numeric">`);
      const pbtn = btn(U.esc(t('set.pairBtn')), 'btn-sm btn-gold', async () => {
        const ok = await CloudSync.pair(pin.value);
        this.toast(ok ? t('set.paired') : t('set.pairErr'), ok ? 'ok' : 'err');
        if (ok) this.renderAll();
      });
      pairRow.append(pin, pbtn);
      body.appendChild(pairRow);

      /* أزرار التشغيل */
      const ops = h('<div class="rep-tools"></div>');
      ops.appendChild(btn('🔄 ' + U.esc(t('set.syncNow')), 'btn-sm', () => {
        this.toast(t('set.syncing'));
        CloudSync.push(); CloudSync.pull();
      }));
      ops.appendChild(btn(U.esc(t('set.disable')), 'btn-sm btn-danger', async () => {
        if (await this.confirm(U.esc(t('set.unpairConfirm')))){
          await CloudSync.disable();
          this.renderAll();
        }
      }));
      body.appendChild(ops);

      const ts = (() => { try { return localStorage.getItem('gd_lastsync'); } catch(e){ return null; } })();
      body.appendChild(h(`<div class="hint">⏱ ${U.esc(t('set.lastSync'))}: ${ts ? this.fmtTS(ts) : U.esc(t('set.never'))} · ${U.esc(t('set.autoNote'))}</div>`));
    } else {
      body.appendChild(btn('☁️ ' + U.esc(t('set.enable')), 'btn-gold', async () => {
        const ok = await CloudSync.enable();
        if (!ok) this.toast(t('gen.error'), 'err');
        this.renderAll();
      }));
    }
    return card;
  },

  /* نافذة قراءة/درس جديدة أو تعديلها */
  readingModal(rd){
    const isNew = !rd;
    const daysSet = new Set(rd ? rd.days : [0, 1, 2, 3, 4]);
    const body = h(`<div class="form-grid">
      <div class="field"><label>${U.esc(t('read.name'))} <span class="req">*</span></label>
        <input class="input" id="rmName" placeholder="${U.esc(t('wiz.readingNamePh'))}" value="${rd ? U.esc(rd.name) : ''}"></div>
      <div class="field"><label>${U.esc(t('read.book'))}</label>
        <input class="input" id="rmBook" placeholder="${U.esc(t('wiz.bookNamePh'))}" value="${rd ? U.esc(rd.book || '') : ''}"></div>
      <div class="field"><label>${U.esc(t('read.teacher'))}</label>
        <input class="input" id="rmTeach" placeholder="${U.esc(t('wiz.teacherPh'))}" value="${rd ? U.esc(rd.teacher || '') : ''}"></div>
      <div class="field"><label>${U.esc(t('set.days'))}</label><div class="day-grid" id="rmDays"></div></div>
    </div>`);
    const dg = body.querySelector('#rmDays');
    I18N.dayNames().forEach((dn, i) => {
      const c = h(`<button type="button" class="chip day" data-on="${daysSet.has(i) ? 1 : 0}">${U.esc(dn)}</button>`);
      c.addEventListener('click', () => {
        daysSet.has(i) ? daysSet.delete(i) : daysSet.add(i);
        c.dataset.on = daysSet.has(i) ? 1 : 0;
      });
      dg.appendChild(c);
    });

    this.modal({
      title: (isNew ? '＋ ' + U.esc(t('tabs.newReading')) : '✎ ' + U.esc(t('read.editTitle'))),
      body: body,
      foot: [
        { label: U.esc(t('gen.save')), cls: 'btn-gold', onClick: c => {
            const name = c.el.querySelector('#rmName').value.trim();
            if (!name || !daysSet.size){ this.toast(t('gen.required'), 'err'); return; }
            const rec = {
              name: name,
              book: c.el.querySelector('#rmBook').value.trim(),
              teacher: c.el.querySelector('#rmTeach').value.trim(),
              days: [...daysSet].sort((a, b) => a - b)
            };
            if (isNew){
              const nr = DB.addReading(rec);
              Session.set({ rid: nr.id });
            } else DB.updateReading(rd.id, rec);
            this.toast(t('read.saved'));
            c.close();
          } },
        { label: U.esc(t('gen.cancel')), onClick: c => c.close() }
      ]
    });
  },

  /* ════════ حالة فارغة عامة ════════ */
  emptyEl(ico, title, hint){
    return h(`<div class="card"><div class="empty">
      <div class="empty-ico">${ico}</div>
      <div class="empty-title">${U.esc(title)}</div>
      ${hint ? `<p class="muted small">${U.esc(hint)}</p>` : ''}</div></div>`);
  },
  noReadingEl(){
    const w = h('<div class="screen"></div>');
    const c = this.emptyEl('📚', t('tabs.newReading'), t('wiz.q2hint'));
    c.querySelector('.empty').appendChild(btn('＋ ' + U.esc(t('tabs.newReading')), 'btn-gold', () => this.readingModal(null)));
    w.appendChild(c);
    return w;
  },

  /* ════════ النوافذ والتنبيهات ════════ */
  modal(opts){
    const root = this.els.modalRoot;
    const back = h('<div class="modal-back"></div>');
    const box  = h(`<div class="modal${opts.lg ? ' lg' : ''}" role="dialog" aria-modal="true"></div>`);
    const head = h(`<div class="modal-head"><div class="modal-title">${opts.title || ''}</div>
      <button class="modal-close" aria-label="${U.esc(t('gen.close'))}">✕</button></div>`);
    const bodyEl = h('<div class="modal-body"></div>');
    if (typeof opts.body === 'string') bodyEl.innerHTML = opts.body;
    else if (opts.body) bodyEl.appendChild(opts.body);
    box.append(head, bodyEl);

    const close = () => back.remove();
    head.querySelector('.modal-close').addEventListener('click', close);
    back.addEventListener('click', e => { if (e.target === back) close(); });

    const ctx = { el: box, body: bodyEl, close: close };
    if (opts.foot && opts.foot.length){
      const footEl = h('<div class="modal-foot"></div>');
      for (const f of opts.foot)
        footEl.appendChild(btn(f.label, f.cls || '', () => f.onClick && f.onClick(ctx)));
      box.appendChild(footEl);
    }
    back.appendChild(box);
    root.appendChild(back);
    if (opts.onOpen) opts.onOpen(ctx);
    return ctx;
  },

  confirm(msg){
    return new Promise(res => {
      let done = false;
      const fin = v => { if (!done){ done = true; res(v); } };
      this.modal({
        title: '⚠️ ' + U.esc(t('gen.confirm')),
        body: `<p style="line-height:1.9">${msg}</p>`,
        foot: [
          { label: U.esc(t('gen.yes')), cls: 'btn-gold', onClick: c => { c.close(); fin(true); } },
          { label: U.esc(t('gen.no')),  onClick: c => { c.close(); fin(false); } }
        ]
      });
    });
  },

  toast(msg, type){
    const el = h(`<div class="toast ${type || 'ok'}">${msg}</div>`);
    this.els.toastRoot.appendChild(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 420);
    }, 2600);
  }
};

/* ── التصدير العالمي ── */
window.UI  = UI;
window.h   = h;
window.btn = btn;
