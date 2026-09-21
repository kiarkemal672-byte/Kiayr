'use strict';

/* ════════════════════════════════════════════════════════════════════════════
   js/app.js — الدُّرَّةُ الذَّهَبِيَّة | الإقلاع والتوجيه
   ─────────────────────────────────────────────────────────────────────────
   ١) تسلسل الإقلاع: I18N → DB → Session → التثبيت → السحابة → UI → SW
   ٢) إدارة التثبيت PWA: beforeinstallprompt (أندرويد/كروم)
      + إرشاد آيفون «إضافة إلى الشاشة الرئيسية»
   ٣) مزامنة حيّة بين نوافذ المتصفح (storage) + الربط عند عودة الاتصال
   ٤) كشف الديكور: إخفاء شاشة البداية بأدبٍ بعد أدنى زمنٍ للتلألؤ
   ════════════════════════════════════════════════════════════════════════════ */

/* ── تسميات خاصة بالإقلاع (خارج قاموس i18n المُرسَل) ── */
const APP_EXTRA = {
  ar: {
    alreadyInstalled: "التطبيق مثبَّتٌ بالفعل ✅",
    iosHint: "على آيفون: افتح قائمة المشاركة ⬆️ ثم «إضافة إلى الشاشة الرئيسية 📌»",
    genericHint: "ثبِّته من قائمة المتصفح: «تثبيت التطبيق / Add to Home Screen»"
  },
  en: {
    alreadyInstalled: "The app is already installed ✅",
    iosHint: "On iPhone: open the Share menu ⬆️ then “Add to Home Screen 📌”",
    genericHint: "Install it from the browser menu: “Install app / Add to Home Screen”"
  },
  am: {
    alreadyInstalled: "መተግበሪያው ቀድሞ ታክሏል ✅",
    iosHint: "በiPhone፡ የShare ምናሌውን ⬆️ ከፍተው «Add to Home Screen 📌» ይምረጡ",
    genericHint: "ከብራውዘር ምናሌው፡ «Install app / Add to Home Screen»"
  }
};
function appTx(key){
  const d = APP_EXTRA[I18N.lang] || APP_EXTRA.ar;
  return d[key] || APP_EXTRA.ar[key] || key;
}

/* ═══════════════════ ١) التثبيت PWA ═══════════════════ */
function setupInstall(){
  let deferred = null;

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    navigator.standalone === true;

  /* الحالة الابتدائية: مثبَّت | متاح (آيفون بالإرشاد) | غير مدعوم بعدُ */
  window.__installState = standalone ? 'installed' : (isIOS ? 'available' : 'unsupported');

  const topBtn = () => document.getElementById('btnInstall');
  const update = () => {
    const b = topBtn();
    if (b) b.hidden = window.__installState !== 'available';
  };

  /* أندرويد/كروم: اعترض النافذة الأصلية وأظهر زرّنا الذهبي */
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e;
    window.__installState = 'available';
    update();
  });

  window.addEventListener('appinstalled', () => {
    deferred = null;
    window.__installState = 'installed';
    update();
    if (window.UI) UI.toast('⤓ ' + appTx('alreadyInstalled'));
  });

  window.__installApp = async function(){
    if (deferred){
      deferred.prompt();
      try {
        const choice = await deferred.userChoice;
        if (choice && choice.outcome === 'accepted'){
          window.__installState = 'installed';
          update();
        }
      } catch(e){ /* المستخدم أغلقها */ }
      deferred = null;
      return;
    }
    if (isIOS && !standalone){ UI.toast('📌 ' + appTx('iosHint')); return; }
    if (standalone){ UI.toast('⤓ ' + appTx('alreadyInstalled')); return; }
    UI.toast('📌 ' + appTx('genericHint'));
  };

  update();
}

/* ═══════════════════ ٢) مزامنة حيّة بين النوافذ ═══════════════════ */
function setupCrossTab(){
  window.addEventListener('storage', e => {
    if (e.key !== Store.KEY || !e.newValue) return;
    try {
      const obj = JSON.parse(e.newValue);
      if (obj && (obj.rev || 0) >= (DB.data.rev || 0)){
        DB.data = obj;
        Bus.emit('change');
      }
    } catch(err){ /* تجاهُل */ }
  });
}

/* ═══════════════════ ٣) الربط عند عودة الاتصال ═══════════════════ */
function setupConnectivity(){
  window.addEventListener('online', () => {
    if (CloudSync.isActive()){
      CloudSync.push();   /* ارفع ما عدّلته دون اتصال */
      CloudSync.pull();   /* ثم اجلب ما استجدَّ من الأجهزة الأخرى */
    }
  });
}

/* ═══════════════════ ٤) عامل الخدمة (العمل دون اتصال) ═══════════════════ */
function registerSW(){
  if (!('serviceWorker' in navigator)) return;
  if (!location.protocol.startsWith('http')) return;   /* file:// — على Vercel يعمل */
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(reg => console.info('%c✦ عاملُ الخدمة يعمل — التطبيق جاهزٌ دون اتصال', 'color:#3ddc84'))
      .catch(err => console.warn('[sw] تعذَّر التسجيل:', err.message));
  });
}

/* ═══════════════════ ٥) إظهار التطبيق بأدب ═══════════════════ */
function revealApp(t0){
  const MIN_SPLASH = 1250;   /* أدنى زمنٍ لتلألؤ النجمة */
  const wait = Math.max(0, MIN_SPLASH - (performance.now() - t0));
  setTimeout(() => {
    const sp  = document.getElementById('splash');
    const app = document.getElementById('app');
    if (app) app.hidden = false;
    if (sp){
      sp.classList.add('hide');
      setTimeout(() => sp.remove(), 800);
    }
  }, wait);
}

/* ═══════════════════ ⭐ الإقلاع ═══════════════════ */
(function boot(){
  if (window.__gdBooted) return;     /* حمايةٌ من الإقلاع المزدوج */
  window.__gdBooted = true;
  const t0 = performance.now();

  try {
    /* ١) اللغة أولاً — كلُّ ما بعدها يتكلّم بها */
    I18N.init();

    /* ٢) القاعدة المحلية */
    DB.boot();

    /* ٣) الجلسة: نبدأ دائماً من اليوم الحاليّ */
    Session.load();
    Session.set({ attDate: Dates.today(), repRef: Dates.today() });
    if (Session.d.view === 'reports' && !Session.d.repMode) Session.set({ repMode: 'week' });

    /* ٤) التثبيت — قبل رسم الإعدادات التي تقرأ __installState */
    setupInstall();

    /* ٥) الأذان الحيّ بين النوافذ + الاتصال */
    setupCrossTab();
    setupConnectivity();

    /* ٦) المزامنة السحابية (الإقران التلقائي عبر #pair يُطلق هنا) */
    CloudSync.init();

    /* ٧) الواجهة — تستمع للأحداث ثم ترسم كلَّ شيء */
    UI.boot();

    /* ٨) عامل الخدمة */
    registerSW();

    /* ٩) الستار */
    revealApp(t0);
  } catch(err){
    /* حتى لو فشل شيء: أظهرِ التطبيق ولا تدَع المستخدم أمام شاشةٍ صمّاء */
    console.error('[boot]', err);
    const app = document.getElementById('app');
    const sp  = document.getElementById('splash');
    if (app) app.hidden = false;
    if (sp) sp.remove();
    if (window.UI) UI.toast('⚠ ' + t('gen.error'), 'err');
  }

  console.info(
    '%c✦ الدُّرَّةُ الذَّهَبِيَّة %c| اللغة: %s | القراءات: %d | الطلاب: %d | السحابة: %s',
    'color:#d4af37;font-weight:bold;font-size:14px',
    'color:#8d876f',
    I18N.lang.toUpperCase(),
    DB.readings().length,
    DB.students().length,
    CloudSync.isActive() ? 'مفعّلة ☁' : 'محليّة 💾'
  );
})();
