'use strict';

/* ════════════════════════════════════════════════════════════════════════════
   js/report.js — الدُّرَّةُ الذَّهَبِيَّة | تقارير الوالدين
   ─────────────────────────────────────────────────────────────────────────
   • بنّاء النصّ — يطابق هيكلَ المعلّم حرفياً:
       السلام عليكم…
       📌 ይሄ የ{name} {ሳምንታዊ/ወርሃዊ} የ{reading} ሪፖርት ነው ።
       ሰኞ 08/06   ✅መጥቷል / ❌አልመጣም / ⏰Nደቂቃዎችን አርፍዷል / 📝ኪታብ…
       ሙጣለዓ ወይም መትን ካመለጠው … ዕዳ … ፈተና ከነበረ …
       الخاتمة والتشجيع
   • أسبوعيّ/شهريّ + ملاحة الفترات
   • طالبٌ واحد (معاينة فورية) أو الجميع بضغطةٍ واحدة (نافذة إرسال)
   • إرسال: ✈️ تلغرام | 📋 نسخ | 📤 مشاركة — وأزرار PDF للتفاصيل
   ════════════════════════════════════════════════════════════════════════════ */

/* ── تسميات خاصة بالشاشة (تُدمج في القواميس قبل الإقلاع) ── */
const REP_EXTRA = {
  ar: { preview:  "معاينةُ التقرير",
        pdfDetails: "PDF التفاصيل",
        allBuilt:   "جهُزت تقاريرُ الجميع ✅ — افتح طالباً وأرسل لوالده",
        copyAll:    "نسخُ الجميع",
        pickHint:   "اختر طالباً لمعاينة تقريره فوراً" },
  en: { preview:  "Report preview",
        pdfDetails: "Details PDF",
        allBuilt:   "All reports built ✅ — open a student and send to the parent",
        copyAll:    "Copy all",
        pickHint:   "Pick a student to preview the report instantly" },
  am: { preview:  "የሪፖርት ቅድመ እይታ",
        pdfDetails: "ዝርዝር PDF",
        allBuilt:   "የሁሉም ሪፖርቶች ተዘጋጅተዋል ✅ — ተማሪ ከፍተው ለወላጁ ይላኩ",
        copyAll:    "ሁሉንም ቅዳ",
        pickHint:   "ሪፖርቱ ወዲያውኑ እንዲታይ ተማሪ ይምረጡ" }
};
(function(){
  if (window.I18N_DICTS)
    for (const l of Object.keys(REP_EXTRA)) Object.assign(I18N_DICTS[l], REP_EXTRA[l]);
})();

/* ═══════════════════════════ محرّك التقارير ═══════════════════════════ */
const Reports = {
  _built: null,      /* { key, sid, text } — ذاكرة المعاينة */
  _cssDone: false,

  tx(k){
    const l = I18N.lang;
    return (REP_EXTRA[l] && REP_EXTRA[l][k]) || REP_EXTRA.ar[k] || k;
  },
  p2(n){ return String(n).padStart(2, '0'); },

  _css(){
    if (this._cssDone) return;
    this._cssDone = true;
    const st = document.createElement('style');
    st.textContent = `
.rep-details{ border:1px solid var(--line-soft); border-radius:12px;
  background:rgba(12,17,31,.5); overflow:hidden; }
.rep-details summary{ cursor:pointer; padding:10px 12px;
  display:flex; align-items:center; gap:10px; list-style:none; user-select:none; }
.rep-details summary::-webkit-details-marker{ display:none; }
.rep-details summary::after{ content:'▾'; color:var(--gold-2); flex:none; }
.rep-details[open] summary{ border-bottom:1px dashed var(--line-soft); }
.rep-details[open] summary::after{ content:'▴'; }
.rep-details .rep-body{ padding:10px 12px; display:flex; flex-direction:column; gap:10px; }
`;
    document.head.appendChild(st);
  },

  /* ════════ حسابات الفترات ════════ */
  periodLabel(mode, ref){
    if (mode === 'month'){
      const d = Dates.fromISO(Dates.monthOf(ref).from);
      return this.p2(d.getMonth() + 1) + '/' + d.getFullYear();
    }
    const w = Dates.weekOf(ref);
    return I18N.fmtShort(Dates.fromISO(w.from)) + ' → ' + I18N.fmtShort(Dates.fromISO(w.to));
  },
  shiftPeriod(mode, ref, dir){
    if (mode === 'week') return Dates.add(ref, dir * 7);
    const d = Dates.fromISO(ref);
    return Dates.iso(new Date(d.getFullYear(), d.getMonth() + dir, 1));
  },

  /* ════════════════════════════════════════════════════════════════════
     ★ بنّاء نصّ التقرير — هيكلُ المعلّم حرفياً
     ════════════════════════════════════════════════════════════════════ */
  buildText(rid, sid, mode, refISO){
    const r = DB.reading(rid);
    const s = DB.student(sid);
    if (!r || !s) return '';
    const data = ReportData.build(rid, sid, mode, refISO);
    const periodAdj  = t(mode === 'month' ? 'rpt.monthly' : 'rpt.weekly');   /* ሳምንታዊ */
    const periodNoun = t(mode === 'month' ? 'rep.monthLabel' : 'rep.weekLabel'); /* ሳምንት */
    const L = [];

    /* التحية والترويسة */
    L.push(t('rpt.salam'));
    L.push('');
    L.push(t('rpt.header', { name: s.name, period: periodAdj, reading: r.name }));
    L.push('');

    if (!data.entries.length && !data.missed.length && !data.exams.length){
      L.push(t('rep.none'));
      L.push('');
    }

    /* أيامُ الفترة بتفاصيلها */
    for (const e of data.entries){
      L.push(I18N.fmtDayMonth(Dates.fromISO(e.date)));
      if (e.p === 1){
        L.push(t('rpt.came'));
        if (e.late != null && e.late > 0)
          L.push(e.late === 1 ? t('rpt.late1') : t('rpt.lateN', { n: e.late }));
        if (e.book === 1)      L.push(t('rpt.bookYes'));
        else if (e.book === 0) L.push(t('rpt.bookNo'));
      } else {
        L.push(t('rpt.absent'));
      }
      L.push('');
    }

    /* ما فاته من مطالعةٍ أو متن */
    if (data.missed.length){
      L.push(t('rpt.missedHdr'));
      for (const m of data.missed){
        const item = t(m.lane === 'matn' ? 'rpt.missedMatn' : 'rpt.missedMutala');
        L.push(t('rpt.missedOn', {
          period: periodNoun,
          day: I18N.dayName(Dates.dow(m.date)),
          item: item
        }));
      }
      L.push('');
    }

    /* الدَّين: راهنُه، أو صفوُه إن كان قد قضاه */
    const debt = data.debt.matn + data.debt.mutala;
    if (debt > 0){
      L.push(t('rpt.debtHdr'));
      const nArg = (I18N.lang === 'ar') ? I18N.debtLabel(debt) : String(debt);
      L.push(t('rpt.debtLine', { n: nArg }));
      L.push('');
    } else if (data.missed.length){
      L.push(t('rpt.debtCleared'));
      L.push('');
    }

    /* الاختبارات ونتائجها */
    const withRes = data.exams.filter(x => x.res);
    if (withRes.length){
      L.push(t('rpt.examHdr'));
      for (const ex of withRes)
        L.push(t('rpt.examScore', { score: ex.res.score, total: ex.res.total }));
      L.push('');
    }

    /* الخاتمة */
    L.push(t('rpt.closing1'));
    L.push(t('rpt.closing2'));

    return L.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  },

  /* ════════════════════════════════════════════════════════════════════
     ★ الشاشة
     ════════════════════════════════════════════════════════════════════ */
  screen(){
    this._css();
    const wrap = h('<div class="screen"></div>');
    const rid = Session.rid();
    if (!rid){ wrap.appendChild(UI.noReadingEl()); return wrap; }
    const r = DB.reading(rid);
    if (!Session.d.repMode) Session.set({ repMode: 'week' });
    if (!Session.d.repRef)  Session.set({ repRef:  Dates.today() });
    const mode = Session.d.repMode === 'month' ? 'month' : 'week';
    const ref  = Session.d.repRef;
    const students = DB.studentsOf(rid);

    /* الترويسة + أزرار PDF للتفاصيل */
    const head = h(`<div class="screen-head"><div>
      <div class="screen-title">${U.esc(t('rep.title'))}</div>
      <div class="screen-sub">${U.esc(t('rep.sub'))} — ${U.esc(r.name)}</div></div>
      <div class="screen-actions"></div></div>`);
    const acts = head.querySelector('.screen-actions');
    if (window.PDFGen){
      acts.appendChild(btn('🖨 ' + U.esc(t('rep.weekly')), 'btn-sm',
        () => PDFGen.detailsList(rid, 'week', ref), U.esc(this.tx('pdfDetails'))));
      acts.appendChild(btn('🖨 ' + U.esc(t('rep.monthly')), 'btn-sm',
        () => PDFGen.detailsList(rid, 'month', ref), U.esc(this.tx('pdfDetails'))));
    }
    wrap.appendChild(head);

    if (!students.length){
      const c = UI.emptyEl('🧾', t('students.none'), t('students.noneHint'));
      c.querySelector('.empty').appendChild(btn('＋ ' + U.esc(t('students.add')), 'btn-gold', () => UI.studentModal(null)));
      wrap.appendChild(c);
      return wrap;
    }

    /* لوحة التحكم: النمط + الفترة + الطالب + البناء */
    const ctrl = h('<div class="card" style="display:flex;flex-direction:column;gap:12px"></div>');

    const modeRow = h('<div class="att-chips"></div>');
    for (const m of ['week', 'month']){
      const c = h(`<button class="chip day" data-on="${mode === m ? 1 : 0}">${U.esc(t(m === 'week' ? 'rep.weekly' : 'rep.monthly'))}</button>`);
      c.addEventListener('click', () => { Session.set({ repMode: m, repRef: Dates.today() }); UI.renderView(); });
      modeRow.appendChild(c);
    }
    ctrl.appendChild(modeRow);

    const nav = h('<div class="toolbar"></div>');
    nav.appendChild(btn('‹ ' + U.esc(t('rep.prev')), 'btn-sm', () => {
      Session.set({ repRef: this.shiftPeriod(mode, ref, -1) }); UI.renderView();
    }));
    nav.appendChild(h(`<span class="gold-text bold num" style="font-family:var(--font-title);font-size:1.05rem">${U.esc(this.periodLabel(mode, ref))}</span>`));
    nav.appendChild(btn(U.esc(t('rep.next')) + ' ›', 'btn-sm', () => {
      Session.set({ repRef: this.shiftPeriod(mode, ref, 1) }); UI.renderView();
    }));
    nav.appendChild(btn(U.esc(t('rep.current')), 'btn-sm btn-ghost', () => {
      Session.set({ repRef: Dates.today() }); UI.renderView();
    }));
    ctrl.appendChild(nav);

    const row = h('<div class="searchbar"></div>');
    const sel = h(`<select class="select" style="max-width:280px" aria-label="${U.esc(t('rep.pickStudent'))}"></select>`);
    const sidRaw = Session.d.repSid || 'all';
    const sid = students.some(s => s.id === sidRaw) ? sidRaw : 'all';
    sel.appendChild(h(`<option value="all">${U.esc(t('rep.allStudents'))}</option>`));
    for (const s of students)
      sel.appendChild(h(`<option value="${s.id}" ${sid === s.id ? 'selected' : ''}>${U.esc(s.name)}</option>`));
    sel.addEventListener('change', () => { Session.set({ repSid: sel.value }); UI.renderView(); });
    row.appendChild(sel);
    row.appendChild(h(`<span class="hint" style="align-self:center">${U.esc(this.tx('pickHint'))}</span>`));
    ctrl.appendChild(row);

    const buildRow = h('<div style="display:flex;flex-direction:column;gap:6px"></div>');
    buildRow.appendChild(btn('🧾 ' + U.esc(t('rep.buildAll')), 'btn-gold btn-block', () => this.buildAllModal(rid, mode, ref)));
    buildRow.appendChild(h(`<span class="hint" style="text-align:center">${U.esc(t('rep.buildAllHint'))}</span>`));
    ctrl.appendChild(buildRow);
    wrap.appendChild(ctrl);

    /* معاينة طالبٍ واحد (فورية عند اختياره) */
    if (sid !== 'all'){
      const key = [rid, sid, mode, ref].join('|');
      if (!this._built || this._built.key !== key)
        this._built = { key: key, sid: sid, text: this.buildText(rid, sid, mode, ref) };
      wrap.appendChild(this.resultCard(sid, this._built.text));
    }
    return wrap;
  },

  /* بطاقة معاينة تقريرٍ واحد + أدوات الإرسال */
  resultCard(sid, text){
    const s = DB.student(sid);
    if (!s) return h('<div></div>');
    const card = h(`<div class="card"><div class="card-head">
      <div class="card-title">🧾 ${U.esc(s.name)}
        <small class="muted small">${U.esc(s.father || '')}</small></div>
      <div class="card-tools"></div></div>
      <div class="hint" style="margin-bottom:8px">${U.esc(this.tx('preview'))}</div>
      <pre class="rep-pre"></pre>
      <div class="rep-tools" style="margin-top:10px"></div></div>`);
    if (s.parentPhone)
      card.querySelector('.card-tools').appendChild(
        h(`<a class="chip" href="tel:${U.esc(s.parentPhone)}">📞 ${U.esc(s.parentPhone)}</a>`));
    card.querySelector('.rep-pre').textContent = text;
    const tools = card.querySelector('.rep-tools');
    tools.appendChild(btn('📋 ' + U.esc(t('rep.copy')), 'btn-sm', () => this.copyText(text)));
    tools.appendChild(btn('📤 ' + U.esc(t('rep.share')), 'btn-sm', () => this.shareText(text)));
    tools.appendChild(btn('✈️ ' + U.esc(t('rep.telegram')), 'btn-sm btn-telegram',
      () => this.telegram(text), t('rep.telegramHint')));
    return card;
  },

  /* ════════════════════════════════════════════════════════════════════
     ★ الجميع بضغطةٍ واحدة — نافذة الإرسال
     ════════════════════════════════════════════════════════════════════ */
  buildAllModal(rid, mode, ref){
    const students = DB.studentsOf(rid);
    if (!students.length){ UI.toast(t('students.none'), 'err'); return; }

    const body = h('<div style="display:flex;flex-direction:column;gap:10px"></div>');
    const all = [];
    for (const s of students){
      const text = this.buildText(rid, s.id, mode, ref);
      all.push({ s: s, text: text });
      body.appendChild(this.studentReportDetails(s, text));
    }
    UI.toast(this.tx('allBuilt'));

    UI.modal({
      title: '🧾 ' + U.esc(t('rep.buildAll')) + ' — ' +
             U.esc(this.periodLabel(mode, ref)),
      body: body,
      lg: true,
      foot: [
        { label: '📋 ' + U.esc(this.tx('copyAll')), onClick: () => {
            this.copyText(all.map(x => x.text).join('\n\n════════════════\n\n'));
          } },
        { label: U.esc(t('gen.close')), onClick: c => c.close() }
      ]
    });
  },

  /* سطرُ طالبٍ في نافذة الجميع (يُفتح ليعرض التقرير وأدوات إرساله) */
  studentReportDetails(s, text){
    const d = h('<details class="rep-details"></details>');
    const ini = (s.name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('');
    const sum = h(`<summary>
      <span class="avatar">${U.esc(ini)}</span>
      <span class="grow"><b>${U.esc(s.name)}</b>
        <div class="muted small">${U.esc(s.parentPhone || '')}</div></span>
      ${s.parentPhone ? `<a class="chip" href="tel:${U.esc(s.parentPhone)}" title="${U.esc(t('students.call'))}">📞</a>` : ''}
    </summary>`);
    const bodyEl = h('<div class="rep-body"></div>');
    const pre = h('<pre class="rep-pre"></pre>');
    pre.textContent = text;
    bodyEl.appendChild(pre);
    const tools = h('<div class="rep-tools"></div>');
    tools.appendChild(btn('📋 ' + U.esc(t('rep.copy')), 'btn-sm', () => this.copyText(text)));
    tools.appendChild(btn('📤 ' + U.esc(t('rep.share')), 'btn-sm', () => this.shareText(text)));
    tools.appendChild(btn('✈️ ' + U.esc(t('rep.telegram')), 'btn-sm btn-telegram',
      () => this.telegram(text), t('rep.telegramHint')));
    bodyEl.appendChild(tools);
    d.append(sum, bodyEl);
    return d;
  },

  /* ════════ أدوات الإرسال الثلاث ════════ */
  async copyText(text){
    try {
      await navigator.clipboard.writeText(text);
      UI.toast(t('rep.copied'));
      return true;
    } catch(e){
      /* احتياطٌ للمتصفحات القديمة */
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch(e2){}
      ta.remove();
      UI.toast(ok ? t('rep.copied') : t('rep.copyErr'), ok ? 'ok' : 'err');
      return ok;
    }
  },

  async shareText(text){
    if (navigator.share){
      try {
        await navigator.share({ title: t('app.title'), text: text });
        UI.toast(t('rep.shared'));
        return;
      } catch(e){ /* أُلغيت أو فشلت → نعود إلى النسخ */ }
    }
    this.copyText(text);
  },

  telegram(text){
    /* يفتح تلغرام والرسالةُ جاهزةٌ للإرسال */
    const url = 'https://t.me/share/url?url=&text=' + encodeURIComponent(text);
    const w = window.open(url, '_blank');
    if (!w) UI.toast(t('rep.copyErr'), 'err');
  }
};

/* ── التصدير العالمي ── */
window.Reports = Reports;
console.info('%c🧾 باني تقارير الوالدين جاهز — بضغطةٍ واحدة', 'color:#d4af37');
