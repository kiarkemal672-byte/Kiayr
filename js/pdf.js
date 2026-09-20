'use strict';

/* ════════════════════════════════════════════════════════════════════════════
   js/pdf.js — الدُّرَّةُ الذَّهَبِيَّة | مولّد PDF
   ─────────────────────────────────────────────────────────────────────────
   ١) حقن أنماط القياس (كل المقاسات em — فتتمدّد وتنقبض مع «مقياس التكامُل»)
   ٢) محرّك التكامُل: بحثٌ ثنائيٌّ عن أكبر مقياسٍ يسع الصفحات المحددة بالضبط
        • كثيرٌ  ⇒ يصغُر حتى يسع     • قليلٌ ⇒ يكبُر حتى تمتلئ الصفحة
   ٣) تعليب الكتل على الصفحات (رأسُ الاستمرار في كل صفحةٍ تالية)
   ٤) بناة المستندات: الاختبار (٣ أنواع) / قائمة الأسماء / التفاصيل الأسبوعية
      والشهرية — ثم الالتقاط بـ html2canvas + jsPDF بدقة مضاعفة
   ════════════════════════════════════════════════════════════════════════════ */

/* ── تسميات إضافية خاصة بالمستندات (خارج قاموس i18n المُرسَل) ── */
const PDF_EXTRA = {
  ar: { cont: "تَابِع" },
  en: { cont: "(continued)" },
  am: { cont: "ቀጣይ" }
};

const PDFGen = {

  BASE: 16.5,          /* حجم الخطّ الأساسي عند المقياس ١ */
  MIN_S: 0.30,         /* أدنى انكماش (محتوى ضخم في صفحةٍ واحدة) */
  MAX_S: 1.75,         /* أعلى تمدّد (محتوى قليل يملأ الصفحة) */
  _cssDone: false,

  esc(s){ return U.esc(s); },
  _x(k){ const l = I18N.lang; return (PDF_EXTRA[l] && PDF_EXTRA[l][k]) || PDF_EXTRA.ar[k]; },

  /* ════════ ١) حقن الأنماط (em بالكامل — عضويّة التمدّد) ════════ */
  _ensure(){
    if (this._cssDone) return;
    this._cssDone = true;
    const st = document.createElement('style');
    st.id = 'pdfFitCss';
    st.textContent = `
/* — مقياس التكامُل: كل شيء em يتبع fontSize للحاوية — */
.pdf-fit{ font-size:16.5px; }
.pdf-fit .pdf-bism{ font-size:1.52em; }
.pdf-fit .pdf-doc-title{ font-size:1.34em; }
.pdf-fit .pdf-sub{ font-size:.92em; }
.pdf-fit .pdf-meta{ font-size:.92em; padding:.35em .8em; }
.pdf-fit .pdf-nameline{ font-size:.98em; margin:.5em 0 .3em; }
.pdf-fit .pdf-sec{ font-size:1.12em; margin:.8em 0 .62em; padding:.3em .65em; }
.pdf-fit .pdf-q{ font-size:1em; margin-bottom:.12em; }
.pdf-fit .pdf-sep{ margin:.34em 0 .8em; }
.pdf-fit .pdf-opts{ gap:.12em 1.4em; margin:.12em .1em .05em; }
.pdf-fit .pdf-opt{ font-size:.97em; }
.pdf-fit .pdf-op-par{ font-size:1.08em; }
.pdf-fit .pdf-footnote{ font-size:.76em; }
.pdf-fit .pdf-tf .blank{ width:5.6em; }

/* — النوع الثالث: أخضرٌ ملكيّ — */
.pdf-sec.tf{ background:#1f6b45; box-shadow:inset 0 0 0 1.4px #14512f, 0 2px 5px rgba(10,40,20,.25); }

/* — خانة ( صح / خطأ ) بين قوسين عريضتين — */
.pdf-tfbox{
  font-weight:700; color:#7a5a10; letter-spacing:.28em;
  margin-inline-end:.4em; white-space:nowrap;
}

/* — رأس الاستمرار في الصفحات التالية — */
.pdf-cont{
  font-size:.86em; font-weight:700; color:#6b4e12;
  border:1.1px solid #c9a544; border-radius:.45em;
  padding:.18em .75em; margin-bottom:.6em;
  display:flex; justify-content:space-between; gap:1em;
  background:rgba(212,175,55,.08);
}

/* — كتلة السؤال (تُقيّ هوامش أبنائها فتصحّ القياسات) — */
.pdf-qblock{ overflow:hidden; }

/* — قائمة الأسماء — */
.pdf-name-row{
  font-size:1.06em; padding:.5em .25em;
  border-bottom:1px solid #cfc19a;
  display:flex; gap:.7em; align-items:baseline;
}
.pdf-name-row .n{ color:#7a5a10; font-weight:700; min-width:1.9em; }

/* — جدول التفاصيل (صفوف شبكية قابلة للتعليب) — */
.pdf-row{
  display:grid;
  grid-template-columns:1.7em minmax(0,1.85fr) minmax(0,1fr) 2.4em 2.2em 2.9em 2.4em 5.2em 4.4em;
  gap:.4em; align-items:center;
  padding:.3em .5em;
  border-bottom:1px solid #d8c9a0;
  font-size:.92em;
}
.pdf-row .c{ text-align:center; font-variant-numeric:tabular-nums; }
.pdf-row .c.ok{ color:#1d6b34; font-weight:700; }
.pdf-row .c.err{ color:#8d2230; font-weight:700; }
.pdf-row .nm{ min-width:0; }
.pdf-row .nm b{ display:block; line-height:1.35; }
.pdf-row .nm small{ color:#6b5a33; font-size:.78em; }
.pdf-row.head{
  background:#a3771a; color:#fff; font-weight:700;
  border-bottom:1.5px solid #7c5a12; text-align:center;
}
.pdf-row.head .nm{ text-align:start; }

/* — خطوط المستند بحسب لغة الواجهة — */
html[lang="am"] .pdf-page{ font-family:'Noto Serif Ethiopic','Noto Sans Ethiopic',serif; }
html[lang="en"] .pdf-page{ font-family:'Cormorant Garamond',Georgia,serif; }
`;
    document.head.appendChild(st);
  },

  /* ════════ ٢) صفحة قياس جديدة على المسرح ════════ */
  _newPage(){
    const stage = document.getElementById('pdfStage');
    const page = h('<div class="pdf-page"><div class="pdf-content pdf-fit"></div></div>');
    stage.appendChild(page);
    return { page, content: page.firstChild };
  },

  /* الارتفاع الخارجي لكتلةٍ (بما فيها هامشاها) */
  _outer(el){
    const cs = getComputedStyle(el);
    return el.offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
  },
  _setScale(content, s){ content.style.fontSize = (this.BASE * s).toFixed(2) + 'px'; },

  /* ════════ ٣) التعليب: توزيع الكتل على سِعَات الصفحات ════════ */
  _pack(blocks, caps, force){
    const list = [];
    let cur = [], used = 0, ci = 0;
    for (const b of blocks){
      const hb = this._outer(b);
      if (used + hb > caps[ci] + 1.5){
        if (!cur.length){
          if (!force) return { ok:false, list:[] };
          list.push([b]); ci++;
          if (ci >= caps.length) return { ok:false, list:[] };
          continue;
        }
        list.push(cur); ci++;
        if (ci >= caps.length) return { ok:false, list:[] };
        cur = []; used = 0;
      }
      cur.push(b); used += hb;
    }
    if (cur.length) list.push(cur);
    return { ok:true, list };
  },

  /* قسمةٌ متوازنة حين يقلُّ المحتوى عن عدد الصفحات المطلوب */
  _balance(blocks, N, caps){
    const sums = blocks.map(b => this._outer(b));
    const total = sums.reduce((a, b) => a + b, 0) || 1;
    const groups = [];
    let cur = [], used = 0, target = total / N;
    for (let i = 0; i < blocks.length; i++){
      cur.push(blocks[i]); used += sums[i];
      if (groups.length < N - 1 && used >= target * (groups.length + 1)){
        groups.push(cur); cur = []; used = 0;
      }
    }
    if (cur.length) groups.push(cur);
    while (groups.length < N) groups.push([]);
    return groups.slice(0, N);
  },

  /* ════════ ٤) محرّك التكامُل — البحث الثنائيّ عن أكبر مقياسٍ يسع ════════ */
  /* capsAt(): دالّةٌ تُرجع سِعَات الصفحات عند المقياس الحالي (تعتمد على
     ارتفاع رؤوس الاستمرار التي تتبع المقياس أيضاً)                        */
  _search(content, blocks, capsAt, min, max){
    const fits = s => {
      this._setScale(content, s);
      const g = this._pack(blocks, capsAt());
      return g.ok;
    };
    if (fits(max)) return max;
    if (!fits(min)) return null;
    let lo = min, hi = max, best = min;
    for (let i = 0; i < 22; i++){
      const mid = (lo + hi) / 2;
      if (fits(mid)){ best = mid; lo = mid; }
      else hi = mid;
    }
    return best;
  },

  /* ════════ التخطيط الكامل: يعيد { scale, groups } ════════ */
  /* content: حاوية قياس تحوي الكتل كلَّها بترتيبها
     opts: { fixedN: 1|2|null(auto), perPageEls: [رؤوس الصفحات التالية] }   */
  _layout(content, blocks, opts){
    const avail = content.clientHeight || 1035;
    const extras = opts.perPageEls || [];

    /* رؤوس الاستمرار تُقاس داخل المحتوى (ملحقةً آخرَه ثم تُستبعد) */
    for (const ex of extras) content.appendChild(ex);
    const capsN = () => {
      const extraH = extras.reduce((a, el) => a + this._outer(el), 0);
      const N = opts.fixedN || 60;
      const caps = [avail];
      for (let i = 1; i < N; i++) caps.push(Math.max(120, avail - extraH));
      return caps;
    };

    let scale, groups;
    if (opts.fixedN){
      const N = opts.fixedN;
      scale = this._search(content, blocks, capsN, this.MIN_S, this.MAX_S) || this.MIN_S;
      this._setScale(content, scale);
      let g = this._pack(blocks, capsN(), scale === this.MIN_S);
      groups = g.list;
      if (groups.length && groups.length < N && scale >= this.MAX_S - 0.01){
        groups = this._balance(blocks, N, capsN());   /* املأ الصفحات كلَّها */
      }
      if (!groups.length) groups = [blocks.slice()];
    } else {
      /* محاولة صفحةٍ واحدة بأكبر مقياس */
      const capsOne = () => [avail];
      const s1 = this._search(content, blocks, capsOne, 0.8, this.MAX_S);
      if (s1){
        scale = s1;
        groups = [blocks.slice()];
      } else {
        scale = 0.8;
        this._setScale(content, scale);
        groups = this._pack(blocks, capsN(), true).list || [blocks.slice()];
      }
    }

    for (const ex of extras) ex.remove();
    return { scale, groups, avail };
  },

  /* ════════ بناء الصفحات الحقيقية من المجموعات ════════ */
  _buildPages(groups, scale, opts, tailEl){
    const stage = document.getElementById('pdfStage');
    const pages = [];
    const extras = opts.perPageEls || [];
    groups.forEach((grp, i) => {
      const { page, content } = this._newPage();
      this._setScale(content, scale);
      if (i > 0) for (const ex of extras) content.appendChild(ex.cloneNode(true));
      for (const b of grp) content.appendChild(b);   /* نقلٌ فعليّ من حاوية القياس */
      if (tailEl && i === groups.length - 1) content.appendChild(tailEl);
      pages.push(page);
    });
    /* إزالة صفحات القياس الفارغة الباقية */
    stage.querySelectorAll('.pdf-page').forEach(p => {
      if (!pages.includes(p) && !p.querySelector('.pdf-q, .pdf-name-row, .pdf-row, .pdf-qblock, .pdf-sec')) p.remove();
    });
    return pages;
  },

  /* ════════ تهيئة الخطوط قبل الالتقاط ════════ */
  async _prepare(){
    this._ensure();
    try {
      await Promise.all([
        document.fonts.load('400 20px Amiri'),
        document.fonts.load('700 20px Amiri'),
        document.fonts.load('700 20px "Aref Ruqaa"'),
        document.fonts.load('400 20px "Noto Serif Ethiopic"'),
        document.fonts.load('700 20px "Noto Serif Ethiopic"'),
        document.fonts.load('600 20px "Cormorant Garamond"')
      ]);
    } catch(e){ /* تستمر بالخطوط المتاحة */ }
    try { await document.fonts.ready; } catch(e){}
  },

  /* ════════ الالتقاط: html2canvas بدقة مضاعفة + jsPDF ════════ */
  async _capture(pages, filename){
    const stage = document.getElementById('pdfStage');
    try{
      if (!window.jspdf || !window.html2canvas) throw new Error('libs');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit:'mm', format:'a4', orientation:'portrait' });
      for (let i = 0; i < pages.length; i++){
        if (i) pdf.addPage();
        const cv = await html2canvas(pages[i], {
          scale: 2, backgroundColor: '#fffdf7', logging: false, useCORS: true
        });
        pdf.addImage(cv.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297, null, 'FAST');
      }
      pdf.save(filename);
      if (window.UI) UI.toast(t('exam.ready'));
    } catch(e){
      console.error('[pdf]', e);
      if (window.UI) UI.toast('⚠ PDF: ' + t('gen.error'), 'err');
    } finally {
      stage.innerHTML = '';
    }
  },

  /* ════════════════════════════════════════════════════════════════════
     ★ إنشاء اختبار PDF — صفحةٌ أو صفحتان بالضبط، متكاملة
     ════════════════════════════════════════════════════════════════════ */
  async exam(e){
    if (!e || !e.questions || !e.questions.length){
      if (window.UI) UI.toast(t('gen.required'), 'err');
      return;
    }
    await this._prepare();
    if (window.UI) UI.toast('🖨 ' + t('exam.generating'));
    await new Promise(r => setTimeout(r, 60));

    const N = (e.pages === 2) ? 2 : 1;
    const { content } = this._newPage();          /* صفحة القياس */
    const blocks = [];

    /* ── الترويسة: البسملة + العنوان + الكتاب والقراءة + الرقم والتاريخ + سطر الاسم ── */
    const head = h('<div class="pdf-qblock"></div>');
    head.appendChild(h(`<div class="pdf-bism">${this.esc(t('pdf.bism'))}</div>`));
    head.appendChild(h(`<div class="pdf-doc-title">${this.esc(this._examTitle(e))}</div>`));
    const subBits = [];
    if (e.book) subBits.push(this.esc(t('pdf.bookLabel')) + ': ' + this.esc(e.book));
    if (e.readingName) subBits.push(this.esc(t('pdf.readingLabel')) + ': ' + this.esc(e.readingName));
    if (subBits.length) head.appendChild(h(`<div class="pdf-sub">${subBits.join('  ·  ')}</div>`));
    head.appendChild(h(`<div class="pdf-meta">
      <span>${this.esc(t('pdf.examWord', { n: e.num }))}</span>
      <span>${this.esc(t('pdf.dateLabel'))}: ${this.esc(e.date || Dates.today())}</span>
    </div>`));
    head.appendChild(h(`<div class="pdf-nameline">
      <span>${this.esc(t('pdf.nameLabel'))}:</span><span class="blank"></span>
      <span>${this.esc(t('pdf.dateLabel'))}:</span><span class="blank" style="max-width:32%"></span>
    </div>`));
    blocks.push(head);

    /* ── الأقسام الثلاثة بترقيمٍ متّصل وسطرٍ فاصلٍ جليٍّ تحت كل سؤال ── */
    const L = I18N.optionLetters();
    const secKey = { essay:'pdf.secEssay', mcq:'pdf.secMcq', tf:'pdf.secTf' };
    const secCls = { essay:'', mcq:'alt', tf:'tf' };
    let qn = 0;
    for (const type of ['essay', 'mcq', 'tf']){
      const qs = e.questions.filter(q => q.type === type);
      if (!qs.length) continue;
      blocks.push(h(`<div class="pdf-sec ${secCls[type]}">${this.esc(t(secKey[type]))}</div>`));
      for (const q of qs){
        qn++;
        const w = h('<div class="pdf-qblock"></div>');
        if (type === 'tf'){
          w.appendChild(h(`<div class="pdf-q pdf-tf">
            <span class="pdf-tfbox">(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</span>
            <b>${qn}.</b> ${this.esc(q.text)}</div>`));
        } else {
          w.appendChild(h(`<div class="pdf-q"><b>${qn}.</b> ${this.esc(q.text)}</div>`));
        }
        if (type === 'mcq' && q.opts && q.opts.length){
          const opts = h('<div class="pdf-opts"></div>');
          q.opts.forEach((o, i) => opts.appendChild(
            h(`<span class="pdf-opt"><span class="pdf-op-par">(${this.esc(L[i] || '·')})</span> ${this.esc(o)}</span>`)
          ));
          w.appendChild(opts);
        }
        w.appendChild(h('<div class="pdf-sep"></div>'));
        blocks.push(w);
      }
    }

    /* ── الذيل ── */
    const tail = h(`<div class="pdf-footnote">✦ ${this.esc(t('pdf.note'))} ✦</div>`);

    /* ── رأس الاستمرار للصفحة الثانية ── */
    const cont = N === 2
      ? h(`<div class="pdf-cont"><span>${this.esc(t('pdf.examWord', { n: e.num }))}</span><span>${this.esc(this._x('cont'))}</span></div>`)
      : null;

    for (const b of blocks) content.appendChild(b);

    const { scale, groups } = this._layout(content, blocks, {
      fixedN: N, perPageEls: cont ? [cont] : []
    });
    const pages = this._buildPages(groups, scale, { perPageEls: cont ? [cont] : [] }, tail);
    await this._capture(pages, `exam-${e.num}-${e.date || Dates.today()}.pdf`);
  },

  /* عنوان الاختبار بالترتيب اللفظي: الأول… العاشر… ثم «رقم N» */
  _examTitle(e){
    const n = e.num || 1;
    if (I18N.lang === 'ar'){
      const ord = ['','الأَوَّل','الثَّانِي','الثَّالِث','الرَّابِع','الخَامِس','السَّادِس','السَّابِع','الثَّامِن','التَّاسِع','العَاشِر',
        'الحَادِيَ عَشَرَ','الثَّانِيَ عَشَرَ','الثَّالِثَ عَشَرَ'][n];
      return ord ? ('الاِخْتِبَارُ ' + ord) : ('الاِخْتِبَارُ رَقْمُ ' + n);
    }
    if (I18N.lang === 'am') return n + 'ኛ ፈተና';
    const suf = (n % 100 >= 11 && n % 100 <= 13) ? 'th'
      : ['th','st','nd','rd'][n % 10] || 'th';
    return 'The ' + n + suf + ' Exam';
  },

  /* ════════════════════════════════════════════════════════════════════
     ★ قائمة الأسماء فقط
     ════════════════════════════════════════════════════════════════════ */
  async namesList(rid){
    const r = DB.reading(rid);
    const students = r ? DB.studentsOf(rid) : [];
    if (!students.length){
      if (window.UI) UI.toast(t('students.none'), 'err');
      return;
    }
    await this._prepare();
    if (window.UI) UI.toast('🖨 ' + t('exam.generating'));
    await new Promise(res => setTimeout(res, 60));

    const { content } = this._newPage();
    const blocks = [];

    const head = h('<div class="pdf-qblock"></div>');
    head.appendChild(h(`<div class="pdf-doc-title">${this.esc(t('students.title'))} — ${this.esc(r.name)}</div>`));
    head.appendChild(h(`<div class="pdf-sub">${this.esc(t('pdf.readingLabel'))}: ${this.esc(r.name)}${r.book ? '  ·  ' + this.esc(t('pdf.bookLabel')) + ': ' + this.esc(r.book) : ''}  ·  ${this.esc(t('pdf.dateLabel'))}: ${this.esc(Dates.today())}</div>`));
    head.appendChild(h('<div class="pdf-sep" style="margin-top:.6em"></div>'));
    blocks.push(head);

    students.forEach((s, i) => {
      blocks.push(h(`<div class="pdf-name-row"><span class="n">${i + 1}.</span><b>${this.esc(s.name)}</b></div>`));
    });

    const tail = h(`<div class="pdf-footnote">✦ ${this.esc(I18N.studentsCount(students.length))}  ·  ${this.esc(Dates.today())} ✦</div>`);
    const cont = h(`<div class="pdf-cont"><span>${this.esc(t('students.title'))} — ${this.esc(r.name)}</span><span>${this.esc(this._x('cont'))}</span></div>`);

    for (const b of blocks) content.appendChild(b);
    const { scale, groups } = this._layout(content, blocks, { fixedN: null, perPageEls: [cont] });
    const pages = this._buildPages(groups, scale, { perPageEls: [cont] }, tail);
    await this._capture(pages, `students-names-${Dates.today()}.pdf`);
  },

  /* ════════════════════════════════════════════════════════════════════
     ★ تفاصيل الطلاب — أسبوعي / شهري
     ════════════════════════════════════════════════════════════════════ */
  async detailsList(rid, mode, refISO){
    const r = DB.reading(rid);
    if (!r){
      if (window.UI) UI.toast(t('gen.error'), 'err');
      return;
    }
    const students = DB.studentsOf(rid);
    if (!students.length){
      if (window.UI) UI.toast(t('students.none'), 'err');
      return;
    }
    await this._prepare();
    if (window.UI) UI.toast('🖨 ' + t('exam.generating'));
    await new Promise(res => setTimeout(res, 60));

    const period = (mode === 'month')
      ? Dates.monthOf(refISO || Dates.today())
      : Dates.weekOf(refISO || Dates.today());
    const modeLbl = t(mode === 'month' ? 'rep.monthly' : 'rep.weekly');

    /* إحصاءات كل طالب على أيام الفترة */
    const stats = {};
    for (const iso of Object.keys(r.days_data)){
      if (iso < period.from || iso > period.to) continue;
      const dd = r.days_data[iso];
      if (!dd || !dd.att) continue;
      for (const sid of Object.keys(dd.att)){
        const a = dd.att[sid];
        if (a.p === null || a.p === undefined) continue;
        const st = stats[sid] = stats[sid] || { p:0, a:0, late:0, nob:0 };
        if (a.p === 1){
          st.p++;
          if (a.late && a.late > 0) st.late += a.late;
          if (a.book === 0) st.nob++;
        } else st.a++;
      }
    }

    /* الدُّيون من محرك الدَّور */
    const R = TurnEngine.compute(r);

    /* آخر اختبارٍ في الفترة ونتيجته */
    const exams = DB.exams(rid).filter(x => x.date >= period.from && x.date <= period.to);
    const lastExam = exams.length ? exams[exams.length - 1] : null;

    const { content } = this._newPage();
    const blocks = [];

    /* الترويسة */
    const head = h('<div class="pdf-qblock"></div>');
    head.appendChild(h(`<div class="pdf-doc-title">${this.esc(modeLbl)} — ${this.esc(r.name)}</div>`));
    head.appendChild(h(`<div class="pdf-sub">
      ${this.esc(I18N.fmtShort(Dates.fromISO(period.from)))} → ${this.esc(I18N.fmtShort(Dates.fromISO(period.to)))}
       ·  ${this.esc(t('pdf.dateLabel'))}: ${this.esc(Dates.today())}</div>`));
    head.appendChild(h(`<div class="pdf-meta">
      <span>${this.esc(t('att.statPresent'))} ✅</span><span>${this.esc(t('att.statAbsent'))} ❌</span>
      <span>⏰ ${this.esc(t('att.minutes'))}</span><span>${this.esc(t('att.statNoBook'))} 📝</span>
      <span>${this.esc(t('turn.debt'))} ⚠</span><span>${this.esc(t('exam.results'))} 📊</span>
    </div>`));
    blocks.push(head);

    /* رأس الأعمدة (يتكرر في كل صفحة) */
    const colHead = h(`<div class="pdf-row head">
      <span class="rnum">#</span><span class="nm">${this.esc(t('gen.name'))}</span>
      <span>${this.esc(t('students.parentPhone'))}</span>
      <span class="c">✅</span><span class="c">❌</span><span class="c">⏰</span>
      <span class="c">📝</span><span class="c">📖/🔁</span><span class="c">📊</span>
    </div>`);
    blocks.push(colHead);

    /* الصفوف */
    students.forEach((s, i) => {
      const st = stats[s.id] || { p:0, a:0, late:0, nob:0 };
      const md = (R.matn.st[s.id]  || { owed:0 }).owed;
      const ud = (R.mutala.st[s.id] || { owed:0 }).owed;
      const debt = (md + ud) > 0 ? `📖${md}·🔁${ud}` : '—';
      const res  = lastExam ? (lastExam.results[s.id] || null) : null;
      const ex   = res ? `${res.score}/${res.total}` : '—';
      blocks.push(h(`<div class="pdf-row">
        <span class="rnum">${i + 1}</span>
        <span class="nm"><b>${this.esc(s.name)}</b><small>${this.esc(s.father || '')}</small></span>
        <span>${this.esc(s.parentPhone || '—')}</span>
        <span class="c ok">${st.p}</span><span class="c err">${st.a}</span>
        <span class="c">${st.late || '—'}</span><span class="c">${st.nob || '—'}</span>
        <span class="c">${this.esc(debt)}</span><span class="c">${this.esc(ex)}</span>
      </div>`));
    });

    const tail = h(`<div class="pdf-footnote">✦ ${this.esc(I18N.studentsCount(students.length))}  ·  ${this.esc(modeLbl)}  ·  ${this.esc(Dates.today())} ✦</div>`);
    const cont = h(`<div class="pdf-cont"><span>${this.esc(modeLbl)} — ${this.esc(r.name)}</span><span>${this.esc(this._x('cont'))}</span></div>`);

    for (const b of blocks) content.appendChild(b);
    const { scale, groups } = this._layout(content, blocks, { fixedN: null, perPageEls: [cont, colHead.cloneNode(true)] });
    const pages = this._buildPages(groups, scale, { perPageEls: [cont, colHead.cloneNode(true)] }, tail);
    await this._capture(pages, `details-${mode === 'month' ? 'monthly' : 'weekly'}-${Dates.today()}.pdf`);
  }
};

/* ── التصدير العالمي ── */
window.PDFGen = PDFGen;
console.info('%c🖨 مولّد PDF جاهز — التكامُل بالبحث الثنائيّ', 'color:#d4af37');
