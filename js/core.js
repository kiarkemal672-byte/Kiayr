'use strict';

/* ════════════════════════════════════════════════════════════════════════════
   js/core.js — الدُّرَّةُ الذَّهَبِيَّة | القلب
   ─────────────────────────────────────────────────────────────────────────
   ١) أدوات عامة + ناقل أحداث + حسابات التواريخ
   ٢) قاعدة البيانات المحلية (طلاب / قراءات / أيام / اختبارات)
   ٣) محرك الدَّور والدَّين — إعادةُ اشتقاقٍ كاملة بالتشغيل الزمني
   ٤) باني بيانات تقارير الوالدين
   ٥) محرك المزامنة السحابية (دفعٌ بعد كل تعديل + سحبٌ كل ٢٠ ثانية)
   ٦) الجلسة (القراءة النشطة / الشاشة النشطة)

   ══ قواعد محرك الدَّور والدَّين (كما رسمها المعلّم) ══
     • المتن: قارئٌ واحدٌ لا غير في اليوم، بالترتيب؛ ومن قرأ في هذه الدورة
       لا يعود إلا في الدورة الثانية.
     • المطالعة: طالبٌ أو طالبان في اليوم (باختيار المعلّم) بالترتيب كذلك،
       وقارئُ المتن والمطالِعُ مسلكان مستقلان يختلف أشخاصُهما.
     • إن غاب صاحبُ الدور أو حضر ولم يقرأ/لم يطالع ⇒ عليه «دَينٌ» (+١)
       ويجلس دوره له؛ لا يتقدَّم الصفُّ فوقه.
     • فإن تكرر ذلك في الغد وهكذا وهكذا ⇒ يتضاعف الدَّين (+١ كل يوم).
     • إذا حضر: يقرأ في اليوم الذي أتى فيه، وفي اليوم التالي، والتي بعده
       متتابعاً — كلُّ قراءةٍ تقضي قسطاً من الدَّين — حتى يكمل ويصفو.
     • إن لم يوجد قارئٌ مجدولٌ (كأن يغيب صاحبُه) اختار المعلّم بنفسه من
       يشاء؛ والغائبُ والتاركُ جميعاً يبقون مدينين.
     • المحرك نقيٌّ: لا يخزّن حالةً بل يشقُّها من السجل كلِّه، فلا تفسد
       الأيامُ ولا تحتاج ترتيباً خاصاً عند الفتح.
   ════════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────── ١) أدوات عامة ─────────────────────────── */
const U = {
  uid(){
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  },
  clone(o){ return JSON.parse(JSON.stringify(o)); },
  esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
      { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]
    ));
  },
  debounce(fn, ms){
    let t = null;
    return function(...a){
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, a), ms);
    };
  },
  byId(list){
    const m = {};
    for (const x of list) m[x.id] = x;
    return m;
  }
};

/* ناقل الأحداث — الواجهة تستمع إليه فتتحدّث ذاتياً عند أي تغيير أو مزامنة */
const Bus = {
  _m: {},
  on(ev, fn){ (this._m[ev] = this._m[ev] || []).push(fn); return () => this.off(ev, fn); },
  off(ev, fn){
    const a = this._m[ev];
    if (a) this._m[ev] = a.filter(f => f !== fn);
  },
  emit(ev, ...args){
    (this._m[ev] || []).forEach(fn => {
      try { fn(...args); } catch(e){ console.error('[Bus]', ev, e); }
    });
  }
};

/* ───────────────────── ٢) حسابات التواريخ (محلية تماماً) ───────────────────── */
const Dates = {
  _p(n){ return String(n).padStart(2, '0'); },
  iso(d){ return d.getFullYear() + '-' + this._p(d.getMonth() + 1) + '-' + this._p(d.getDate()); },
  today(){ return this.iso(new Date()); },
  fromISO(s){
    const parts = String(s).split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  },
  add(iso, n){
    const d = this.fromISO(iso);
    d.setDate(d.getDate() + n);
    return this.iso(d);
  },
  dow(iso){ return this.fromISO(iso).getDay(); },   /* الأحد=0 … السبت=6 */
  weekStart(iso){                                    /* الاثنين رأسُ الأسبوع */
    const d = this.fromISO(iso);
    const diff = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - diff);
    return this.iso(d);
  },
  monthStart(iso){
    const d = this.fromISO(iso);
    return this.iso(new Date(d.getFullYear(), d.getMonth(), 1));
  },
  range(a, b){
    const out = [];
    let c = a;
    while (c <= b){ out.push(c); c = this.add(c, 1); }
    return out;
  },
  weekOf(iso){
    const from = this.weekStart(iso);
    return { from, to: this.add(from, 6) };
  },
  monthOf(iso){
    const d = this.fromISO(iso);
    return {
      from: this.iso(new Date(d.getFullYear(), d.getMonth(), 1)),
      to:   this.iso(new Date(d.getFullYear(), d.getMonth() + 1, 0))
    };
  }
};

/* ───────────────────── ٣) المخزن المحلي (مع بديلٍ في الذاكرة) ───────────────────── */
const Store = {
  KEY: 'gd_db_v1',
  MEM: {},
  get(k){
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : null;
    } catch(e){ return (k in this.MEM) ? this.MEM[k] : null; }
  },
  set(k, v){
    this.MEM[k] = v;
    try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){ /* وضع خاص */ }
  },
  del(k){
    delete this.MEM[k];
    try { localStorage.removeItem(k); } catch(e){}
  }
};

/* ───────────────────── ٤) قاعدة البيانات ─────────────────────
   الشكل:
   settings: { wizDone }
   students: [{id, name, father, parentPhone, createdAt}]
   readings: [{id, name, book, teacher, days:[0-6], studentIds:[], examCounter,
               days_data:{ "YYYY-MM-DD": { att:{sid:{p,late,book}},
                                           matn:{sid,manual}|null,
                                           mutala:[{sid,manual}],
                                           mutalaCount:1|2|null,
                                           noTurn:bool } }]
   exams:    [{id, rid, num, date, pages, book, readingName,
               questions:[{type:'essay'|'mcq'|'tf', text, opts:[..]}],
               results:{sid:{score,total}}, createdAt}]
   ─────────────────────────────────────────────────────────────── */
const DB = {
  data: null,

  /* ── الإقلاع ── */
  boot(){
    this.data = Store.get(Store.KEY) || this._default();
    this._migrate();
  },
  _default(){
    return {
      v: 1, rev: 0, updatedAt: new Date().toISOString(),
      settings: { wizDone: false },
      students: [],
      readings: [],
      exams: []
    };
  },
  _migrate(){
    const d = this.data;
    d.v = 1;
    d.settings = d.settings || { wizDone: false };
    d.students = d.students || [];
    d.readings = d.readings || [];
    d.exams    = d.exams    || [];
    for (const r of d.readings){
      r.days         = r.days         || [0, 1, 2, 3, 6];
      r.studentIds   = r.studentIds   || [];
      r.days_data    = r.days_data    || {};
      r.examCounter  = r.examCounter  || 0;
    }
    for (const e of d.exams){
      e.results   = e.results   || {};
      e.questions = e.questions || [];
    }
  },

  /* ── الحفظ: يرفع rev محلياً، يبثّ للسحابة ── */
  save(remote){
    if (!remote){
      this.data.rev = (this.data.rev || 0) + 1;
      this.data.updatedAt = new Date().toISOString();
    }
    Store.set(Store.KEY, this.data);
    Bus.emit('change');
    if (!remote) CloudSync.schedulePush();
  },

  settings(){ return this.data.settings; },
  setSetting(k, v){ this.data.settings[k] = v; this.save(); },

  /* ══════════ الطلاب (سجلٌّ عامّ لكل القراءات) ══════════ */
  students(){ return this.data.students; },
  student(id){ return this.data.students.find(s => s.id === id) || null; },
  studentsOf(rid){
    const r = this.reading(rid);
    if (!r) return [];
    const m = U.byId(this.data.students);
    return r.studentIds.map(id => m[id]).filter(Boolean);
  },
  addStudent(rec, rid){
    const s = {
      id: U.uid(),
      name: String(rec.name || '').trim(),
      father: String(rec.father || '').trim(),
      parentPhone: String(rec.parentPhone || '').trim(),
      createdAt: new Date().toISOString()
    };
    this.data.students.push(s);
    if (rid) this.enroll(rid, s.id);
    this.save();
    return s;
  },
  updateStudent(id, patch){
    const s = this.student(id);
    if (!s) return null;
    Object.assign(s, patch);
    this.save();
    return s;
  },
  deleteStudent(id){
    this.data.students = this.data.students.filter(s => s.id !== id);
    for (const r of this.data.readings)
      r.studentIds = r.studentIds.filter(x => x !== id);
    for (const e of this.data.exams) delete e.results[id];
    this.save();
  },
  enroll(rid, sid){
    const r = this.reading(rid);
    if (r && r.studentIds.indexOf(sid) === -1){
      r.studentIds.push(sid);
      this.save();
    }
  },
  unenroll(rid, sid){
    const r = this.reading(rid);
    if (r){
      r.studentIds = r.studentIds.filter(x => x !== sid);
      this.save();
    }
  },

  /* ══════════ القراءات والدروس (كلٌّ منها عالَمٌ مستقل) ══════════ */
  readings(){ return this.data.readings; },
  reading(id){ return this.data.readings.find(r => r.id === id) || null; },
  addReading(rec){
    const r = {
      id: U.uid(),
      name: String(rec.name || '').trim(),
      book: String(rec.book || '').trim(),
      teacher: String(rec.teacher || '').trim(),
      days: (rec.days && rec.days.length ? rec.days.slice() : [0, 1, 2, 3, 6]).sort(function(a, b){ return a - b; }),
      studentIds: [],
      examCounter: 0,
      days_data: {},
      createdAt: new Date().toISOString()
    };
    this.data.readings.push(r);
    this.save();
    return r;
  },
  updateReading(id, patch){
    const r = this.reading(id);
    if (!r) return;
    Object.assign(r, patch);
    if (patch.days) r.days = patch.days.slice().sort(function(a, b){ return a - b; });
    this.save();
  },
  deleteReading(id){
    this.data.readings = this.data.readings.filter(r => r.id !== id);
    this.data.exams    = this.data.exams.filter(e => e.rid !== id);
    this.save();
  },
  isStudyDay(rid, iso){
    const r = this.reading(rid);
    return !!r && r.days.indexOf(Dates.dow(iso)) !== -1;
  },
  nextStudyDay(rid, fromISO, dir){
    dir = dir || 1;
    let c = Dates.add(fromISO, dir);
    for (let i = 0; i < 14; i++){
      if (this.isStudyDay(rid, c)) return c;
      c = Dates.add(c, dir);
    }
    return c;
  },

  /* ══════════ بيانات اليوم: حضور + سجلّ الدور ══════════ */
  day(rid, date, create){
    const r = this.reading(rid);
    if (!r) return null;
    if (!r.days_data[date]){
      if (!create) return null;
      r.days_data[date] = { att: {}, matn: null, mutala: [], mutalaCount: null };
    }
    return r.days_data[date];
  },
  _prune(r, date){
    const dd = r.days_data[date];
    if (!dd) return;
    const attEmpty = !dd.att || Object.keys(dd.att).length === 0;
    const restEmpty = !dd.matn && !(dd.mutala && dd.mutala.length) &&
                      (dd.mutalaCount == null) && !dd.noTurn;
    if (attEmpty && restEmpty) delete r.days_data[date]; /* لا هواءَ في السجلّ */
  },
  setAtt(rid, date, sid, patch){
    const r = this.reading(rid);
    const dd = this.day(rid, date, true);
    if (!r || !dd) return;
    dd.att[sid] = Object.assign(
      { p: null, late: null, book: null },
      dd.att[sid] || {},
      patch
    );
    if (dd.att[sid].p === 0){ dd.att[sid].late = null; dd.att[sid].book = null; }
    this._prune(r, date);
    this.save();
  },
  setMatn(rid, date, sid, manual){
    const r = this.reading(rid);
    const dd = this.day(rid, date, true);
    if (!r || !dd) return;
    dd.matn = sid ? { sid: sid, manual: !!manual } : null;
    this._prune(r, date);
    this.save();
  },
  setMutala(rid, date, arr){
    const r = this.reading(rid);
    const dd = this.day(rid, date, true);
    if (!r || !dd) return;
    dd.mutala = (arr || []).map(x => ({ sid: x.sid, manual: !!x.manual }));
    this._prune(r, date);
    this.save();
  },
  setMutalaCount(rid, date, n){
    const r = this.reading(rid);
    const dd = this.day(rid, date, true);
    if (!r || !dd) return;
    dd.mutalaCount = (n === 1 || n === 2) ? n : null;
    this._prune(r, date);
    this.save();
  },
  setNoTurn(rid, date, on){
    const r = this.reading(rid);
    if (!r) return;
    const dd = on ? this.day(rid, date, true) : this.day(rid, date, false);
    if (!dd) return;
    if (on) dd.noTurn = true;
    else delete dd.noTurn;
    this._prune(r, date);
    this.save();
  },

  /* إحصاءات يومٍ ما للعرض */
  attStats(rid, date){
    const out = { present: 0, absent: 0, late: 0, noBook: 0, recorded: 0 };
    const r = this.reading(rid);
    if (!r) return out;
    const dd = r.days_data[date];
    if (!dd || !dd.att) return out;
    for (const sid of r.studentIds){
      const a = dd.att[sid];
      if (!a || a.p === null || a.p === undefined) continue;
      out.recorded++;
      if (a.p === 1){
        out.present++;
        if (a.late && a.late > 0) out.late++;
        if (a.book === 0) out.noBook++;
      } else out.absent++;
    }
    return out;
  },

  /* ══════════ الاختبارات (مرقَّمة تلقائياً لكل قراءة) ══════════ */
  exams(rid){
    return this.data.exams
      .filter(e => e.rid === rid)
      .sort((a, b) => a.num - b.num);
  },
  exam(id){ return this.data.exams.find(e => e.id === id) || null; },
  nextExamNum(rid){
    const r = this.reading(rid);
    return r ? (r.examCounter + 1) : 1;
  },
  addExam(rec){
    const r = this.reading(rec.rid);
    let num = 1;
    if (r){ r.examCounter = (r.examCounter || 0) + 1; num = r.examCounter; }
    const e = Object.assign(
      { id: U.uid(), num: num, results: {}, createdAt: new Date().toISOString() },
      rec
    );
    this.data.exams.push(e);
    this.save();
    return e;
  },
  updateExam(id, patch){
    const e = this.exam(id);
    if (e){ Object.assign(e, patch); this.save(); }
  },
  deleteExam(id){
    this.data.exams = this.data.exams.filter(e => e.id !== id);
    this.save();
  },
  setExamResult(examId, sid, score, total){
    const e = this.exam(examId);
    if (!e) return;
    e.results[sid] = { score: Number(score) || 0, total: Number(total) || 0 };
    this.save();
  },

  /* ══════════ الخطر والنسخ الاحتياطي ══════════ */
  clearAll(){
    Store.del(Store.KEY);
    CloudSync.resetLocal();
    this.data = this._default();
    this.save();
  },
  exportJSON(){ return JSON.stringify(this.data, null, 2); },
  importJSON(text){
    try {
      const obj = JSON.parse(text);
      if (!obj || typeof obj !== 'object' ||
          !Array.isArray(obj.students) || !Array.isArray(obj.readings)) throw new Error('bad');
      this.data = obj;
      this._migrate();
      this.save();
      return true;
    } catch(e){ return false; }
  },
  importRemote(obj){                       /* من السحابة: يُقبل الأحدث فقط */
    if (!obj || obj.rev === undefined) return false;
    if ((obj.rev || 0) <= (this.data.rev || 0)) return false;
    this.data = obj;
    this._migrate();
    this.save(true);                       /* بلا رفع rev — فهو مصدرُه */
    return true;
  },
  forceImport(obj){                        /* عند الإقران: السحابة هي المرجع */
    if (!obj || typeof obj !== 'object') return false;
    this.data = obj;
    this._migrate();
    this.save(true);
    return true;
  }
};

/* ════════════════════════════════════════════════════════════════════════════
   ٥) محرك الدَّور والدَّين — القلبُ النابض
   يعيد اشتقاق الحالة كاملةً من سجلّ الأيام؛ كلُّ استدعاءٍ تشغيلٌ زمنيٌّ نقيّ.
   ════════════════════════════════════════════════════════════════════════════ */
const TurnEngine = {

  /* الحساب الكامل لقراءةٍ ما */
  compute(reading){
    const order = (reading.studentIds || []).slice();
    const R = {
      matn:   this._lane(order),
      mutala: this._lane(order),
      log: []   /* {date, lane:'matn'|'mutala', sid, ev:'read'|'extra'|'miss'|'noread', owedAfter} */
    };
    const days = Object.keys(reading.days_data || {}).sort();
    for (const d of days){
      const dd = reading.days_data[d];
      const hasAtt = dd.att && Object.keys(dd.att).length > 0;
      if (!hasAtt && !dd.matn && !(dd.mutala && dd.mutala.length)) continue; /* يومٌ فارغ */
      this._stepMatn(R.matn, dd, d, R.log);
      this._stepMutala(R.mutala, dd, d, R.log);
    }
    return R;
  },

  _lane(order){
    const st = {};
    for (const sid of order) st[sid] = this._st();
    return { order: order, cycle: 1, pending: order.slice(), done: new Set(), st: st };
  },
  _st(){ return { owed: 0, served: false, reads: 0, misses: 0, lastRead: null }; },

  /* تدوير الدورة: إذا فرغ الرصيد بدأ الجميعُ دوراً ثانياً بترتيبهم الأصلي */
  _rotate(L){
    if (L.pending.length === 0 && L.order.length > 0){
      L.cycle++;
      L.pending = L.order.slice();
      L.done = new Set();
      for (const sid of L.order) L.st[sid].served = false;
    }
  },

  /* ── خطوة يوم: المتن (قارئٌ واحد) ── */
  _stepMatn(L, dd, d, log){
    if (dd.noTurn) return;                 /* يومٌ بلا دور: اختبارٌ أو نحوه */
    this._rotate(L);
    if (L.pending.length === 0) return;

    const sid = L.pending[0];
    const st  = L.st[sid];
    const att = dd.att ? dd.att[sid] : null;
    const rec = dd.matn || null;

    if (rec && rec.sid === sid){
      /* صاحبُ الدور قرأ: يومُه إن لم يكن قرأه، وإلا قسطٌ يقضي به من الدَّين */
      st.reads++;
      st.lastRead = d;
      if (!st.served) st.served = true;
      else st.owed = Math.max(0, st.owed - 1);
      log.push({ date: d, lane: 'matn', sid: sid, ev: 'read', owedAfter: st.owed });
    } else {
      if (rec){
        /* اختيارٌ يدوي: قرأ غيرُ صاحب الدور — قراءةٌ إضافية تُسجَّل له */
        const xs = L.st[rec.sid];
        if (xs){ xs.reads++; xs.lastRead = d; }
        log.push({ date: d, lane: 'matn', sid: rec.sid, ev: 'extra', owedAfter: xs ? xs.owed : 0 });
      }
      if (att){                            /* اليومُ مُسجَّل: تقييمُ صاحب الدور */
        st.owed++;
        st.misses++;
        log.push({ date: d, lane: 'matn', sid: sid,
                   ev: (att.p === 0 ? 'miss' : 'noread'), owedAfter: st.owed });
      }
    }
    this._sweep(L);
  },

  /* ── خطوة يوم: المطالعة (خانةٌ أو خانتان) ── */
  _stepMutala(L, dd, d, log){
    if (dd.noTurn) return;
    this._rotate(L);
    if (L.pending.length === 0) return;

    const slots = Math.max(1, Math.min(dd.mutalaCount || 2, L.pending.length));
    const onDuty = L.pending.slice(0, slots);
    const recs = dd.mutala || [];

    for (const sid of onDuty){
      const st  = L.st[sid];
      const att = dd.att ? dd.att[sid] : null;
      let rec = null;
      for (const r of recs){ if (r.sid === sid){ rec = r; break; } }

      if (rec){
        st.reads++;
        st.lastRead = d;
        if (!st.served) st.served = true;
        else st.owed = Math.max(0, st.owed - 1);
        log.push({ date: d, lane: 'mutala', sid: sid, ev: 'read', owedAfter: st.owed });
      } else if (att){
        st.owed++;
        st.misses++;
        log.push({ date: d, lane: 'mutala', sid: sid,
                   ev: (att.p === 0 ? 'miss' : 'noread'), owedAfter: st.owed });
      }
    }

    /* من قرأ/طالع من غير المُجدوَلين (اختيار المعلّم اليدوي) */
    for (const r of recs){
      if (onDuty.indexOf(r.sid) === -1){
        const xs = L.st[r.sid];
        if (xs){ xs.reads++; xs.lastRead = d; }
        log.push({ date: d, lane: 'mutala', sid: r.sid, ev: 'extra', owedAfter: xs ? xs.owed : 0 });
      }
    }
    this._sweep(L);
  },

  /* إخراجُ من أنهى دوره وصفا من الدَّين (من أيِّ موضعٍ في الصف) */
  _sweep(L){
    const keep = [];
    for (const sid of L.pending){
      const st = L.st[sid];
      if (st.served && st.owed === 0 && !L.done.has(sid)){
        L.done.add(sid);
      } else keep.push(sid);
    }
    L.pending = keep;
  },

  /* جدولُ اليوم للعرض: المجدولون + حالتُهم + من سُجِّل فعلاً */
  today(reading, dateISO){
    const R  = this.compute(reading);
    const dd = (reading.days_data || {})[dateISO] || {};
    const mCount = Math.max(1, dd.mutalaCount || 2);
    const matnSid = R.matn.pending[0] || null;

    return {
      date: dateISO,
      matn: {
        sid: matnSid,
        st: matnSid ? R.matn.st[matnSid] : null,
        cycle: R.matn.cycle,
        clearing: !!(matnSid && R.matn.st[matnSid].served && R.matn.st[matnSid].owed > 0),
        recorded: dd.matn ? dd.matn.sid : null,
        recordedManual: !!(dd.matn && dd.matn.manual),
        doneToday: !!(matnSid && dd.matn && dd.matn.sid === matnSid)
      },
      mutala: {
        cycle: R.mutala.cycle,
        slots: mCount,
        scheduled: R.mutala.pending.slice(0, mCount).map(sid => ({
          sid: sid,
          st: R.mutala.st[sid],
          doneToday: (dd.mutala || []).some(r => r.sid === sid)
        })),
        recorded: (dd.mutala || []).map(r => r.sid)
      },
      noTurn: !!dd.noTurn,
      state: R
    };
  }
};

/* ════════════════════════════════════════════════════════════════════════════
   ٦) باني بيانات تقرير الوالد (أسبوعي/شهري) — النصُّ يُنسَّق في report.js
   ════════════════════════════════════════════════════════════════════════════ */
const ReportData = {
  build(rid, sid, mode, refISO){
    const r = DB.reading(rid);
    if (!r) return null;
    const period = (mode === 'month')
      ? Dates.monthOf(refISO || Dates.today())
      : Dates.weekOf(refISO || Dates.today());

    /* حضورُ أيام الفترة: {date, p, late, book} */
    const entries = [];
    const allDays = Dates.range(period.from, period.to);
    for (const iso of allDays){
      const dd = r.days_data[iso];
      if (!dd || !dd.att) continue;
      const a = dd.att[sid];
      if (!a || a.p === null || a.p === undefined) continue;
      entries.push({ date: iso, p: a.p, late: a.late, book: a.book });
    }

    /* من سجلّ المحرك: ما فاته متنٌ أو مطالعةٌ خلال الفترة */
    const R = TurnEngine.compute(r);
    const missed = R.log.filter(l =>
      l.sid === sid &&
      (l.ev === 'miss' || l.ev === 'noread') &&
      l.date >= period.from && l.date <= period.to
    ).map(l => ({ date: l.date, lane: l.lane, ev: l.ev }));

    /* حالة الدَّين الراهنة */
    const mst = R.matn.st[sid]   || { owed: 0, misses: 0, reads: 0 };
    const ust = R.mutala.st[sid] || { owed: 0, misses: 0, reads: 0 };

    /* اختبارات الفترة ونتائجه */
    const exams = DB.exams(rid)
      .filter(e => e.date >= period.from && e.date <= period.to)
      .map(e => ({ num: e.num, date: e.date, res: e.results[sid] || null }));

    return {
      period: period,
      entries: entries,
      missed: missed,
      debt: { matn: mst.owed, mutala: ust.owed, misses: mst.misses + ust.misses },
      exams: exams
    };
  }
};

/* ════════════════════════════════════════════════════════════════════════════
   ٧) المزامنة السحابية
   خزّانٌ عامٌّ بلا مفاتيح ولا حساب (jsonblob). عند التفعيل يُنشأ «خزّان»
   ويرمز إليه برمزٍ قصير (أو مسحِ QR يُقرن تلقائياً عبر #pair)؛ ثم:
     • كل تعديلٍ محلي ⇒ دفعٌ للسحابة (بعد مهلة ٢٫٥ ثانية)
     • كل ٢٠ ثانية وعند العودة للتطبيق ⇒ سحبٌ وإن كان أحدث حلَّ محلَّه
   ════════════════════════════════════════════════════════════════════════════ */
const CloudSync = {
  API: 'https://jsonblob.com/api/jsonBlob/',
  CFG_KEY: 'gd_cloud',
  cfg: null,               /* { blob } */
  status: 'off',           /* off | on | sync | err */
  _pullTimer: null,
  _vlAdded: false,
  _debouncedPush: null,

  init(){
    this.cfg = Store.get(this.CFG_KEY) || null;
    this._debouncedPush = U.debounce(() => this.push(), 2500);
    if (this.cfg && this.cfg.blob) this.start();
    else this.setStatus('off');
    this._autoPair();
  },
  _autoPair(){
    const m = (location.hash || '').match(/pair=([0-9]+)/);
    if (!m) return;
    const code = m[1];
    try { history.replaceState(null, '', location.pathname + location.search); } catch(e){}
    this.pair(code).then(ok => Bus.emit('autopair', ok));
  },
  setStatus(s){ this.status = s; Bus.emit('sync', s); },
  isActive(){ return !!(this.cfg && this.cfg.blob); },
  code(){ return this.cfg ? String(this.cfg.blob) : ''; },
  codeGrouped(){ return this.code().replace(/(\d{4})(?=\d)/g, '$1-'); },
  pairURL(){
    if (!this.isActive()) return null;
    return location.origin + location.pathname + '#pair=' + this.code();
  },

  async enable(){
    try {
      this.setStatus('sync');
      const res = await fetch(this.API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(DB.data)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      let id = res.headers.get('X-jsonblob') ||
               (res.headers.get('Location') || '').split('/').pop();
      if (!id) throw new Error('no-blob-id');
      this.cfg = { blob: String(id) };
      Store.set(this.CFG_KEY, this.cfg);
      this.start();
      return true;
    } catch(e){
      console.error('[sync:enable]', e);
      this.setStatus('err');
      return false;
    }
  },

  async disable(){
    this.stop();
    this.cfg = null;
    Store.del(this.CFG_KEY);
    this.setStatus('off');
  },
  resetLocal(){
    this.stop();
    this.cfg = null;
    Store.del(this.CFG_KEY);
    this.setStatus('off');
  },

  start(){
    this.stop();
    this.setStatus('on');
    this._pullTimer = setInterval(() => this.pull(), 20000);
    if (!this._vlAdded){
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) this.pull();
      });
      this._vlAdded = true;
    }
    this.pull();
  },
  stop(){
    if (this._pullTimer){ clearInterval(this._pullTimer); this._pullTimer = null; }
  },

  schedulePush(){
    if (this.isActive() && this._debouncedPush) this._debouncedPush();
  },
  async push(){
    if (!this.isActive()) return;
    try {
      this.setStatus('sync');
      const res = await fetch(this.API + this.cfg.blob, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(DB.data)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      this.setStatus('on');
    } catch(e){
      console.error('[sync:push]', e);
      this.setStatus('err');
    }
  },
  async pull(){
    if (!this.isActive()) return;
    try {
      const res = await fetch(this.API + this.cfg.blob, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const obj = await res.json();
      const remoteRev = (obj && obj.rev) || 0;
      const localRev  = (DB.data && DB.data.rev) || 0;
      if (remoteRev > localRev){
        DB.importRemote(obj);
        Bus.emit('pulled');
      }
      if (this.status !== 'sync') this.setStatus('on');
    } catch(e){
      console.error('[sync:pull]', e);
      this.setStatus('err');
    }
  },
  async pair(code){
    const blob = String(code || '').replace(/[^0-9]/g, '');
    if (!blob) return false;
    try {
      this.setStatus('sync');
      const res = await fetch(this.API + blob, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const obj = await res.json();
      this.cfg = { blob: blob };
      Store.set(this.CFG_KEY, this.cfg);
      if (obj && obj.rev !== undefined) DB.forceImport(obj);
      this.start();
      return true;
    } catch(e){
      console.error('[sync:pair]', e);
      this.setStatus('err');
      return false;
    }
  }
};

/* ───────────────────── ٨) الجلسة (القراءة والشاشة النشطة) ───────────────────── */
const Session = {
  KEY: 'gd_session',
  d: { rid: null, view: 'today', attDate: null, repMode: 'week', repRef: null },
  load(){
    const s = Store.get(this.KEY);
    if (s) Object.assign(this.d, s);
  },
  set(patch){
    Object.assign(this.d, patch);
    Store.set(this.KEY, this.d);
  },
  rid(){
    if (this.d.rid && DB.reading(this.d.rid)) return this.d.rid;
    const first = DB.readings()[0];
    if (first){ this.set({ rid: first.id }); return first.id; }
    return null;
  }
};

/* ───────────────────── التصدير العالمي ───────────────────── */
window.U           = U;
window.Bus         = Bus;
window.Dates       = Dates;
window.Store       = Store;
window.DB          = DB;
window.TurnEngine  = TurnEngine;
window.ReportData  = ReportData;
window.CloudSync   = CloudSync;
window.Session     = Session;

console.info(
  '%c✦ الدُّرَّةُ الذَّهَبِيَّة %c— القلبُ ينبض، والدَّورُ يُشقُّ من السجلّ نقيّاً',
  'color:#d4af37;font-weight:bold;font-size:14px',
  'color:#8d876f'
);
