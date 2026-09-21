'use strict';

/* ════════════════════════════════════════════════════════════════════════════
   sw.js — الدُّرَّةُ الذَّهَبِيَّة | عامل الخدمة
   ─────────────────────────────────────────────────────────────────────────
   الاستراتيجية:
     • صفحة التنقّل (index.html) : شبكة أولاً — فيأتي التحديث فور نشره —
       ومع السقوط دون اتصال تُقدَّم النسخة المخزّنة.
     • مكتبات CDN وخطوط جوجل    : ذاكرة أولاً + تحديثٌ صامت في الخلف
       (يعمل PDF والخطوط المشكولة دون اتصال بعد أول فتحٍ متصل).
     • ملفات الموقع              : قديمٌ فوراً + تحديث في الخلف (SWR).
     • jsonblob + QR             : شبكةٌ دائماً ولا تُخزَّن أبداً —
       فسحابتك يجب أن تبقى حيّةً صادقةً في كل مرة.
     • عند كل إصدار: غيِّر VERSION فيُنظَّف القديم تلقائياً.
   ════════════════════════════════════════════════════════════════════════════ */

const VERSION       = 'durra-gold-v1.0.0';
const SHELL_CACHE   = 'durra-shell-'   + VERSION;
const RUNTIME_CACHE = 'durra-runtime-' + VERSION;
const CDN_CACHE     = 'durra-cdn-'     + VERSION;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './css/style.css',
  './js/i18n.js',
  './js/core.js',
  './js/ui.js',
  './js/pdf.js',
  './js/report.js',
  './js/app.js'
];

const CDN_LIBS = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

/* هؤلاء لا يُخزَّنون أبداً — السحابة حيّة، ورمز QR يتغيّر بحسب رمز الإقران */
const NEVER_CACHE = ['jsonblob.com', 'api.qrserver.com'];

/* ── التثبيت: خزّن الهيكل، وحاول جلب المكتبات (لا يفشل إن كنت دون اتصال) ── */
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL_CACHE);
    await shell.addAll(APP_SHELL);
    try {
      const cdn = await caches.open(CDN_CACHE);
      await Promise.allSettled(CDN_LIBS.map(u => cdn.add(u)));
    } catch(e){ /* أفضل جهد */ }
    await self.skipWaiting();
  })());
});

/* ── التنشيط: تنظيف إصدارات القديم والاستيلاء الفوري ── */
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, RUNTIME_CACHE, CDN_CACHE]);
    const names = await caches.keys();
    await Promise.all(names.map(n => keep.has(n) ? null : caches.delete(n)));
    await self.clients.claim();
  })());
});

/* ── الاعتراض ── */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch(e){ return; }

  /* السحابة ورمز QR: شبكةٌ صِرفة — لا حكم لي عليهما */
  if (NEVER_CACHE.some(h => url.hostname === h || url.hostname.endsWith('.' + h))) return;

  /* التنقّل: شبكة أولاً */
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')){
    event.respondWith(navigation(req));
    return;
  }

  /* المكتبات والخطوط: ذاكرة أولاً */
  const isCDN = CDN_LIBS.indexOf(req.url) !== -1 ||
                url.hostname === 'fonts.googleapis.com' ||
                url.hostname === 'fonts.gstatic.com'    ||
                url.hostname.endsWith('.cdnjs.cloudflare.com');
  if (isCDN){
    event.respondWith(cacheFirst(req, CDN_CACHE));
    return;
  }

  /* ملفات الموقع: قديم فوراً + تحديث خلفي */
  if (url.origin === self.location.origin){
    event.respondWith(staleWhileRevalidate(req));
  }
});

/* ── الرسائل (لتحديثٍ فوريّ عند الحاجة مستقبلاً) ── */
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

/* ════════════════════ الاستراتيجيات ════════════════════ */

/* شبكة أولاً للصفحة — مع تحديث النسخة المخزّنة في كل نجاح */
async function navigation(req){
  const shell = await caches.open(SHELL_CACHE);
  try {
    const fresh = await fetch(req);
    if (fresh && fresh.ok) shell.put('./index.html', fresh.clone());
    return fresh;
  } catch(e){
    const hit = (await caches.match(req)) ||
                (await shell.match('./index.html')) ||
                (await shell.match('./'));
    if (hit) return hit;
    return new Response(
      '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<body dir="rtl" style="background:#070a12;color:#d4af37;font-family:serif;text-align:center;padding:2rem;line-height:2">' +
      'التطبيقُ لم يُثبَّت للعمل دون اتصالٍ بعد.<br>افتحه مرةً أخرى وهو متصلٌ بالإنترنت ثم أعد المحاولة.</body>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 }
    );
  }
}

/* ذاكرة أولاً + تحديثٌ صامت */
async function cacheFirst(req, cacheName){
  const c = await caches.open(cacheName);
  const hit = await c.match(req, { ignoreVary: true });
  if (hit){
    revalidate(req, c);
    return hit;
  }
  try {
    const fresh = await fetch(req);
    if (fresh && (fresh.ok || fresh.type === 'opaque')) c.put(req, fresh.clone());
    return fresh;
  } catch(e){
    return new Response('', { status: 504, statusText: 'offline' });
  }
}

/* قديمٌ فوراً، وجديدٌ في الخلف */
async function staleWhileRevalidate(req){
  const c = await caches.open(RUNTIME_CACHE);
  const hit = await c.match(req, { ignoreVary: true });
  const net = fetch(req).then(res => {
    if (res && res.ok) c.put(req, res.clone());
    return res;
  }).catch(() => null);
  if (hit){
    net.catch(() => {});
    return hit;
  }
  const fresh = await net;
  if (fresh) return fresh;
  return new Response('', { status: 504, statusText: 'offline' });
}

/* تحديثٌ صامت */
async function revalidate(req, cache){
  try {
    const res = await fetch(req);
    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
  } catch(e){ /* صمت */ }
}
