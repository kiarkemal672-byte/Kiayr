'use strict';

/* ════════════════════════════════════════════════════════════════════════════
   js/i18n.js — الدُّرَّةُ الذَّهَبِيَّة
   نظام اللغات الثلاث: العربية (RTL) / English (LTR) / አማርኛ (LTR)

   ⚠️ دقّة الأمهرية — معجمٌ إسلاميٌّ إثيوبيٌّ مضبوط:
      كتاب   → ኪታብ        (وليس መጽሐፍ)
      قراءة  → ቂራአት       (وليس ንባብ)
      مطالعة → ሙጣለዓ
      متن    → መትን
      دَين   → ዕዳ
      اختبار → ፈተና
      حضر → መጥቷል | غاب → አልመጣም | تأخر → አርፎ ከነበረ
   ════════════════════════════════════════════════════════════════════════════ */

const I18N_DICTS = {

/* ══════════════════════════ ١) العربية ══════════════════════════ */
ar: {
_meta: { dir: "rtl" },

app: {
  title:    "الدُّرَّةُ الذَّهَبِيَّة",
  subtitle: "نُظُمُ الحَلَقَاتِ وَالقِرَاءَاتِ بِإِتقَان"
},

nav: {
  today: "اليوم", students: "الطلاب", turn: "الدَّور",
  exams: "الاختبارات", reports: "التقارير", settings: "الإعدادات"
},

tabs: {
  addReading: "إضافة قراءة أو درس جديد",
  newReading: "قراءة جديدة"
},

wiz: {
  hello:    "أهلاً وسهلاً بك في",
  helloSub: "لنُجهِّز تطبيقك في خطوتين",
  q1:       "ما أيّامُ دراستك؟",
  q1hint:   "اختر الأيام التي تعقد فيها حلقتك",
  q2:       "ما القراءاتُ والدروسُ التي تتابعها؟",
  q2hint:   "أضِفْ قراءةً واحدةً على الأقل، ويمكنك زيادة البقية لاحقاً بزر ➕",
  readingName: "اسم القراءة/الدرس", readingNamePh: "مثال: رواية ورش عن نافع",
  bookName: "اسم الكتاب (اختياري)",   bookNamePh: "مثال: الشاطبية",
  teacher:  "اسم الشيخ (اختياري)",    teacherPh:  "مثال: الشيخ محمد",
  addAnother: "+ قراءة أخرى",
  next: "التالي", back: "السابق", finish: "ابدأ الاستخدام"
},

read: {
  title: "قراءة جديدة", editTitle: "تعديل القراءة",
  name: "اسم القراءة/الدرس", book: "اسم الكتاب", teacher: "اسم الشيخ",
  confirmDelete: "سيُحذف هذه القراءة وكلُّ سجلاتها. أمتابع؟",
  saved: "تم الحفظ ✅", deleted: "تم الحذف"
},

students: {
  title: "الطلاب", sub: "سِجِلُّ طلابِ الحلقة",
  add: "طالب جديد", edit: "تعديل الطالب",
  name: "اسم الطالب", namePh: "مثال: عبد الرحمن أحمد",
  father: "اسم أبيه", fatherPh: "مثال: أحمد محمد",
  parentPhone: "هاتف الوالد", parentPhonePh: "09xxxxxxxx",
  parentPhoneHint: "رقمُ الوالد الذي يتبعُ هذا الطالبَ — وقد يكون الأبَ أو الأمَّ.",
  search: "ابحث بالاسم أو الهاتف…",
  none: "لا طلاب بعد", noneHint: "ابدأ بإضافة أوّل طالب",
  confirmDelete: "سيُحذف «{name}» بكلِّ سجلاته نهائياً. أمتابع؟",
  saved: "تم حفظ الطالب ✅", deleted: "تم الحذف",
  total1: "طالبٌ واحد", total2: "طالبان", totalN: "{n} طلاب",
  call: "اتصال"
},

att: {
  title: "حضورُ اليوم", sub: "سجِّل الحضورَ والتأخيرَ والكتاب",
  prev: "اليوم السابق", next: "اليوم التالي", today: "اليوم",
  present: "حاضر", absent: "غائب", late: "متأخر",
  minutes: "دقيقة", lateMinPh: "دقائق",
  book: "الكتاب", bookYes: "أخذ كتابه", bookNo: "خالي اليدين",
  saved: "تم الحفظ ✅",
  noSession: "اليوم ليس من أيام الدراسة",
  noSessionHint: "يمكنك تغيير الأيام من الإعدادات — أو التسجيل إن كان يوماً استثنائياً.",
  noSessionBtn: "تسجيل على أي حال",
  statPresent: "الحاضرون", statAbsent: "الغائبون",
  statLate: "المتأخرون", statNoBook: "بلا كتاب"
},

turn: {
  title: "دَورُ القِراءة", sub: "المتنُ والمطالعةُ بالدَّور مع تتبُّعِ الدَّين",
  matn: "قراءة المتن",    matnSub: "قارئٌ واحدٌ لا غير في اليوم",
  matnReader: "قارئُ المتن",
  mutala: "المطالعة",     mutalaSub: "طالبٌ أو طالبان في اليوم",
  mutalaReader: "المُطالِع",
  queue: "قائمة الدَّور", queueSub: "الترتيبُ والوصولُ إلى الدورة الثانية",
  todayTurn: "دَورُ اليوم", empty: "لا أحد مجدول",
  pick: "— اختر طالباً —",
  pickHint: "لم يوجد قارئٌ مجدول؛ اخترْ أنت الطالبَ الذي قرأ وطالع.",
  noStudents: "أضِفْ طلاباً أولاً",
  read: "قرأ ✅", didMutala: "طالع ✅",
  debt: "دَين", debt1: "دَينُ يومٍ واحد", debt2: "دَينُ يومين", debtN: "دَينُ {n} أيام",
  cycle: "الدورة {n}", done: "أتمَّ ✅",
  carryNote:  "غاب في يوم دوره، فيجلس دوره له للغد.",
  doubleNote: "غاب أيضاً، فيتضاعف عليه الدَّين.",
  seqNote:    "إذا حضر قرأ متتابعاً — يومَه والتاليَ والتالي — حتى يَصفو من الدَّين.",
  cleared: "صفا من الدَّين ✨",
  manualNote: "باختيارك اليدوي: الغائبُ والتاركُ جميعاً يصيرون مَدينين.",
  pickedSaved: "تم التسجيل ✅"
},

exam: {
  title: "الاختبارات", sub: "أنشئ اختبار PDF مضبوطَ الصفحات",
  new: "إنشاء اختبار",
  number: "رقم الاختبار", numberHint: "يُرقَّم تلقائياً: الأول، الثاني…",
  book: "اسم الكتاب", reading: "اسم القراءة", date: "التاريخ",
  pagesQ: "كم صفحةً الاختبار؟", onePage: "صفحة واحدة", twoPages: "صفحتان",
  autoFitNote: "سيُضبَط حجمُ الخطِّ تلقائياً: إن طال المحتوى صَغُر، وإن قصُر كَبُر، حتى تُملأ الصفحةُ تماماً.",
  typeEssay: "أسئلة جامدة (مقالية)", typeMcq: "أسئلة اختيارية", typeTf: "صح أو خطأ",
  addQ: "+ سؤال", qPh: "اكتب السؤال…",
  addOpt: "+ خيار", optPh: "الخيار", removeOpt: "حذف الخيار", removeQ: "حذف السؤال",
  generate: "توليد PDF", generating: "جارٍ التوليد…", ready: "جاهز! يتم التحميل…",
  results: "النتائج", addResult: "تسجيل نتيجة",
  score: "الدرجة", of: "من", saveResult: "حفظ النتيجة", resultSaved: "تم حفظ النتيجة ✅",
  list: "الاختبارات السابقة", empty: "لا اختبارات بعد",
  viewPdf: "عرض PDF", confirmDelete: "يُحذف هذا الاختبار نهائياً؟",
  saved: "تم حفظ الاختبار ✅"
},

pdf: {
  bism: "بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ",
  examWord: "اختبار رقم {n}",
  nameLabel: "الاسم", dateLabel: "التاريخ",
  bookLabel: "الكتاب", readingLabel: "القراءة",
  secEssay: "أَجِبْ عَنِ الأَسْئِلَةِ الآتِيَةِ",
  secMcq:   "اخْتَرِ الإِجَابَةَ الصَّحِيحَةَ عَنِ الأَسْئِلَةِ الآتِيَةِ",
  secTf:    "أَجِبْ عَنِ الأَسْئِلَةِ الآتِيَةِ بِصَحٍّ أَوْ خَطَأٍ",
  note: "بالتَّوْفِيقِ وَالسَّدَادِ"
},

rep: {
  title: "تقارير الوُّلْدَة", sub: "جهِّز التقريرَ وأرسله بضغطةٍ واحدة",
  weekly: "أسبوعي", monthly: "شهري",
  weekLabel: "الأسبوع", monthLabel: "الشهر",
  prev: "السابق", next: "التالي", current: "الحالي",
  pickStudent: "اختر الطالب", allStudents: "كل الطلاب",
  buildOne: "تجهيز التقرير", buildAll: "تجهيز الجميع بضغطة واحدة",
  buildAllHint: "يُجهَّز تقريرُ كلِّ طالبٍ ليُرسَل إلى والده",
  copy: "نسخ", share: "مشاركة", telegram: "تلغرام",
  telegramHint: "يفتح تلغرامَ مع الرسالة جاهزةً للإرسال",
  copied: "تم النسخ ✅", copyErr: "تعذَّر النسخ، انسخ يدوياً",
  shared: "فُتحت نافذة المشاركة",
  none: "لا سجلات في هذه الفترة",
  sendTitle: "إرسال إلى الوالد"
},

rpt: {
  salam: "السلامُ عليكم ورحمةُ اللهِ وبركاتُه",
  header: "📜 هذا تقريرُ {name} {period} لقراءةِ {reading}.",
  weekly: "الأسبوعيّ", monthly: "الشهريّ",
  came: "✅ حَضَر", absent: "❌ لم يحضر",
  lateN: "⏰ تأخَّر {n} دقيقة", late1: "⏰ تأخَّر دقيقةً واحدة",
  bookYes: "📝 أخذ كتابَه معه",
  bookNo:  "📝 جاء خاليَ اليدين دون كتابه",
  missedHdr: "إن فاتتْه المطالعةُ أو المتنُ:",
  missedMutala: "فاتتْه المطالعة",
  missedMatn:   "فاتتْه قراءةُ المتن",
  missedOn: "خلال هذا {period}، يوم {day}: {item}.",
  debtHdr: "الدَّين:",
  debtLine: "تراكم عليه دَينُ {n} من الأيام؛ فإذا حضر قرأ متتابعاً حتى يَصفو منه.",
  debtCleared: "قد صفَا من الدَّين ✅",
  examHdr: "كان هناك اختبار:",
  examScore: "أتى في الاختبار بـ {score} من {total}.",
  closing1: "لا تغفُلوا عن تشجيع أبنائكم ومتابعتهم.",
  closing2: "نشكرُ لكم اهتمامَكم وتعاونَكم."
},

set: {
  title: "الإعدادات", sub: "لغةُ التطبيقِ والمزامنةُ والبيانات",
  language: "اللغة",
  cloudTitle: "المزامنة السحابية",
  cloudDesc: "فعِّلها مرّةً واحدة، ثم يتحدَّث كلُّ شيءٍ تلقائياً عبر الإنترنت في كلِّ الأجهزة المرتبطة.",
  syncOn: "المزامنة مُفعَّلة", syncOff: "المزامنة متوقفة",
  enable: "تفعيل المزامنة", disable: "إيقاف",
  code: "رمزُ المزامنة",
  codeHint: "أدخِلْه في هاتفك الآخر مرّةً واحدة، ويتحدَّث كلُّ شيءٍ من تلقاء نفسه.",
  pair: "ربطُ جهازٍ برمز", pairPh: "الصق الرمز هنا", pairBtn: "ربط",
  paired: "تم الربط! جارٍ جلب البيانات…",
  pairErr: "رمزٌ غير صحيح أو تعذَّر الاتصال",
  unpair: "فكُّ الارتباط", unpairConfirm: "يُفكُّ الارتباطُ على هذا الجهاز فقط.",
  syncNow: "مزامنةٌ الآن", syncing: "جارٍ المزامنة…", synced: "تمت المزامنة ✅",
  autoNote: "تحديثٌ تلقائيٌّ كلَّ ٢٠ ثانية",
  lastSync: "آخر مزامنة", never: "لم تتم بعد",
  manageReadings: "إدارةُ القراءات", manageDays: "أيامُ الدراسة",
  days: "الأيام", readings: "القراءات",
  danger: "منطقةُ الخطر", clear: "محوُ كلِّ البيانات",
  clearConfirm: "سيُمحى كلُّ شيءٍ نهائياً ولا رجعة. أمؤكد؟", cleared: "تم المحو",
  backup: "نسخةٌ احتياطية", exportBtn: "تصدير ملف", importBtn: "استيراد ملف",
  imported: "تم الاستيراد ✅", importErr: "ملفٌ غير صالح",
  install: "ثبِّتِ التطبيق", installed: "مثبَّت ✅",
  about: "حول", version: "الإصدار"
},

gen: {
  save: "حفظ", cancel: "إلغاء", del: "حذف", edit: "تعديل", close: "إغلاق",
  confirm: "تأكيد", yes: "نعم", no: "لا", add: "إضافة", ok: "حسناً",
  error: "خطأ", required: "هذا الحقلُ مطلوب",
  date: "التاريخ", name: "الاسم", actions: "إجراءات",
  total: "المجموع", none: "لا شيء", today: "اليوم", all: "الكل",
  loading: "جارٍ التحميل…", saved: "تم الحفظ ✅", deleted: "تم الحذف",
  selectStudent: "اختر طالباً", studentLabel: "الطالب"
},

days: ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"],

optLetters: ["أ","ب","ج","د","هـ","و"]
},

/* ══════════════════════════ ٢) English ══════════════════════════ */
en: {
_meta: { dir: "ltr" },

app: {
  title:    "The Golden Pearl",
  subtitle: "Circle & Recitation Management"
},

nav: {
  today: "Today", students: "Students", turn: "Turn",
  exams: "Exams", reports: "Reports", settings: "Settings"
},

tabs: {
  addReading: "Add a new recitation or lesson",
  newReading: "New recitation"
},

wiz: {
  hello:    "Welcome to",
  helloSub: "Let's set up your app in two steps",
  q1:       "Which are your study days?",
  q1hint:   "Pick the days your circle meets",
  q2:       "Which recitations/lessons do you follow?",
  q2hint:   "Add at least one; you can add more later with the ➕ button",
  readingName: "Recitation/Lesson name", readingNamePh: "e.g., Warsh recitation",
  bookName: "Book name (optional)",   bookNamePh: "e.g., Ash-Shatibiyya",
  teacher:  "Teacher name (optional)", teacherPh: "e.g., Sheikh Mohammed",
  addAnother: "+ Another recitation",
  next: "Next", back: "Back", finish: "Start using"
},

read: {
  title: "New recitation", editTitle: "Edit recitation",
  name: "Recitation/Lesson name", book: "Book name", teacher: "Teacher name",
  confirmDelete: "This recitation and all its records will be deleted. Continue?",
  saved: "Saved ✅", deleted: "Deleted"
},

students: {
  title: "Students", sub: "Circle student registry",
  add: "New student", edit: "Edit student",
  name: "Student name", namePh: "e.g., Abdurrahman Ahmed",
  father: "Father's name", fatherPh: "e.g., Ahmed Mohammed",
  parentPhone: "Parent phone", parentPhonePh: "09xxxxxxxx",
  parentPhoneHint: "The parent's number that follows this student — it may be the father or the mother.",
  search: "Search by name or phone…",
  none: "No students yet", noneHint: "Start by adding the first student",
  confirmDelete: "\"{name}\" will be deleted with all records. Continue?",
  saved: "Student saved ✅", deleted: "Deleted",
  total1: "1 student", total2: "2 students", totalN: "{n} students",
  call: "Call"
},

att: {
  title: "Today's attendance", sub: "Record attendance, lateness and the book",
  prev: "Previous day", next: "Next day", today: "Today",
  present: "Present", absent: "Absent", late: "Late",
  minutes: "min", lateMinPh: "minutes",
  book: "Book", bookYes: "Brought book", bookNo: "Empty-handed",
  saved: "Saved ✅",
  noSession: "Today is not a study day",
  noSessionHint: "You can change the days in Settings — or record anyway on an exceptional day.",
  noSessionBtn: "Record anyway",
  statPresent: "Present", statAbsent: "Absent",
  statLate: "Late", statNoBook: "No book"
},

turn: {
  title: "Recitation turn", sub: "Matn & mutala'a by turn, with debt tracking",
  matn: "Matn recitation", matnSub: "Only ONE reader per day",
  matnReader: "Matn reader",
  mutala: "Mutala'a", mutalaSub: "One or two students per day",
  mutalaReader: "Mutala'a reader",
  queue: "Turn queue", queueSub: "Order and reaching the second round",
  todayTurn: "Today's turn", empty: "No one scheduled",
  pick: "— Pick a student —",
  pickHint: "No scheduled reader; you pick the student who read and studied.",
  noStudents: "Add students first",
  read: "Read ✅", didMutala: "Studied ✅",
  debt: "Debt", debt1: "1 day of debt", debt2: "2 days of debt", debtN: "{n} days of debt",
  cycle: "Round {n}", done: "Completed ✅",
  carryNote:  "He was absent on his turn day, so his turn stays for tomorrow.",
  doubleNote: "Absent again — his debt doubles.",
  seqNote:    "When he attends he reads consecutively — his day, then the next, and the next — until the debt is cleared.",
  cleared: "Debt cleared ✨",
  manualNote: "With manual picking: both the absent and the non-reading become debtors.",
  pickedSaved: "Recorded ✅"
},

exam: {
  title: "Exams", sub: "Create a page-accurate PDF exam",
  new: "Create exam",
  number: "Exam number", numberHint: "Numbered automatically: first, second…",
  book: "Book name", reading: "Recitation name", date: "Date",
  pagesQ: "How many pages?", onePage: "One page", twoPages: "Two pages",
  autoFitNote: "Font size auto-fits: too much content shrinks it, too little grows it, until the page is exactly filled.",
  typeEssay: "Essay questions", typeMcq: "Multiple choice", typeTf: "True or False",
  addQ: "+ Question", qPh: "Write the question…",
  addOpt: "+ Option", optPh: "Option", removeOpt: "Remove option", removeQ: "Remove question",
  generate: "Generate PDF", generating: "Generating…", ready: "Ready! Downloading…",
  results: "Results", addResult: "Record result",
  score: "Score", of: "of", saveResult: "Save result", resultSaved: "Result saved ✅",
  list: "Past exams", empty: "No exams yet",
  viewPdf: "View PDF", confirmDelete: "Delete this exam permanently?",
  saved: "Exam saved ✅"
},

pdf: {
  bism: "بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ",
  examWord: "Exam No. {n}",
  nameLabel: "Name", dateLabel: "Date",
  bookLabel: "Book", readingLabel: "Recitation",
  secEssay: "Answer the following questions",
  secMcq:   "Choose the correct answer to the following questions",
  secTf:    "Answer the following questions with True or False",
  note: "Best of luck!"
},

rep: {
  title: "Parent reports", sub: "Prepare and send with one tap",
  weekly: "Weekly", monthly: "Monthly",
  weekLabel: "Week", monthLabel: "Month",
  prev: "Previous", next: "Next", current: "Current",
  pickStudent: "Pick student", allStudents: "All students",
  buildOne: "Build report", buildAll: "Build all with one tap",
  buildAllHint: "Every student's report is prepared to be sent to his parent",
  copy: "Copy", share: "Share", telegram: "Telegram",
  telegramHint: "Opens Telegram with the message ready to send",
  copied: "Copied ✅", copyErr: "Copy failed, copy manually",
  shared: "Share sheet opened",
  none: "No records in this period",
  sendTitle: "Send to parent"
},

rpt: {
  salam: "Assalamu alaikum wa rahmatullahi wa barakatuh",
  header: "📜 This is {name}'s {period} report for {reading}.",
  weekly: "weekly", monthly: "monthly",
  came: "✅ Attended", absent: "❌ Did not attend",
  lateN: "⏰ Was {n} minutes late", late1: "⏰ Was 1 minute late",
  bookYes: "📝 Brought his book",
  bookNo:  "📝 Came empty-handed without his book",
  missedHdr: "Missed mutala'a or matn:",
  missedMutala: "missed the mutala'a",
  missedMatn:   "missed reading the matn",
  missedOn: "During this {period}, on {day}, he {item}.",
  debtHdr: "Debt:",
  debtLine: "He has accumulated {n} days of debt; he will read consecutively until he clears it.",
  debtCleared: "Has cleared his debt ✅",
  examHdr: "An exam was held:",
  examScore: "Scored {score} out of {total} in the exam.",
  closing1: "Please keep encouraging and following up your children.",
  closing2: "Thank you for your attention and cooperation."
},

set: {
  title: "Settings", sub: "Language, sync and data",
  language: "Language",
  cloudTitle: "Cloud sync",
  cloudDesc: "Enable it once; everything then syncs automatically over the internet across all paired devices.",
  syncOn: "Sync is ON", syncOff: "Sync is OFF",
  enable: "Enable sync", disable: "Disable",
  code: "Sync code",
  codeHint: "Enter it once on your other phone and everything updates by itself.",
  pair: "Pair a device by code", pairPh: "Paste the code here", pairBtn: "Pair",
  paired: "Paired! Fetching data…",
  pairErr: "Wrong code or connection failed",
  unpair: "Unpair", unpairConfirm: "Unpairs on this device only.",
  syncNow: "Sync now", syncing: "Syncing…", synced: "Synced ✅",
  autoNote: "Auto refresh every 20 seconds",
  lastSync: "Last sync", never: "Never",
  manageReadings: "Manage recitations", manageDays: "Study days",
  days: "Days", readings: "Recitations",
  danger: "Danger zone", clear: "Wipe all data",
  clearConfirm: "Everything will be permanently erased. Are you sure?", cleared: "Wiped",
  backup: "Backup", exportBtn: "Export file", importBtn: "Import file",
  imported: "Imported ✅", importErr: "Invalid file",
  install: "Install app", installed: "Installed ✅",
  about: "About", version: "Version"
},

gen: {
  save: "Save", cancel: "Cancel", del: "Delete", edit: "Edit", close: "Close",
  confirm: "Confirm", yes: "Yes", no: "No", add: "Add", ok: "OK",
  error: "Error", required: "This field is required",
  date: "Date", name: "Name", actions: "Actions",
  total: "Total", none: "None", today: "Today", all: "All",
  loading: "Loading…", saved: "Saved ✅", deleted: "Deleted",
  selectStudent: "Select a student", studentLabel: "Student"
},

days: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],

optLetters: ["A","B","C","D","E","F"]
},

/* ══════════════════════════ ٣) አማርኛ ══════════════════════════ */
am: {
_meta: { dir: "ltr" },

app: {
  title:    "ወርቃማው ዕንቁ",
  subtitle: "የትምህርት ክብና የቂራአት አስተዳደር"
},

nav: {
  today: "ዛሬ", students: "ተማሪዎች", turn: "ተራ",
  exams: "ፈተናዎች", reports: "ሪፖርቶች", settings: "ቅንብሮች"
},

tabs: {
  addReading: "አዲስ ቂራአት ወይም ትምህርት መጨመር",
  newReading: "አዲስ ቂራአት"
},

wiz: {
  hello:    "እንኳን ደህና መጡ ወደ",
  helloSub: "መተግበሪያዎን በሁለት ደረጃ እናዘጋጅልዎታለን",
  q1:       "የትምህርት ቀናትዎ የትኞቹ ናቸው?",
  q1hint:   "ክብዎ የሚካሄዱባቸውን ቀናት ይምረጡ",
  q2:       "የሚከታተሏቸው ቂራአቶች/ትምህርቶች ምንድን ናቸው?",
  q2hint:   "ቢያንስ አንድ ቂራአት ይጨምሩ፤ ቀሪዎቹን በ➕ አዝራር ኋላ ማስጨመር ይችላሉ",
  readingName: "የቂራአት/ትምህርት ስም", readingNamePh: "ምሳሌ፡ የወርሽ ቂራአት",
  bookName: "የኪታብ ስም (አማራጭ)",   bookNamePh: "ምሳሌ፡ ሻጢቢያ",
  teacher:  "የሼኽ ስም (አማራጭ)",    teacherPh:  "ምሳሌ፡ ሼኽ መሐመድ",
  addAnother: "+ ሌላ ቂራአት",
  next: "ቀጣይ", back: "ተመለስ", finish: "ጀምር"
},

read: {
  title: "አዲስ ቂራአት", editTitle: "ቂራአቱን ማስተካከል",
  name: "የቂራአት/ትምህርት ስም", book: "የኪታብ ስም", teacher: "የሼኽ ስም",
  confirmDelete: "ይህ ቂራአት ከሁሉም መዛግብቱ ጋር ይጠፋል። ይቀጥል?",
  saved: "ተመዝግቧል ✅", deleted: "ተሰርዟል"
},

students: {
  title: "ተማሪዎች", sub: "የክቡ ተማሪዎች መዝገብ",
  add: "አዲስ ተማሪ", edit: "ተማሪውን አስተካክል",
  name: "የተማሪው ስም", namePh: "ምሳሌ፡ አብዱራሕማን አሕመድ",
  father: "የአባቱ ስም", fatherPh: "ምሳሌ፡ አሕመድ መሐመድ",
  parentPhone: "የወላጅ ስልክ ቁጥር", parentPhonePh: "09…",
  parentPhoneHint: "ተማሪውን የሚከታተለው የወላጅ ቁጥር ነው፤ አባትም ሆነ እናት ሊሆን ይችላል።",
  search: "በስም ወይም በስልክ መፈለግ…",
  none: "እስካሁን ምንም ተማሪ የለም", noneHint: "የመጀመሪያውን ተማሪ ይጨምሩ",
  confirmDelete: "«{name}» ከሁሉም መዛግብቱ ጋር በቋሚታዊነት ይጠፋል። ይቀጥል?",
  saved: "ተማሪው ተመዝግቧል ✅", deleted: "ተሰርዟል",
  total1: "አንድ ተማሪ", total2: "ሁለት ተማሪዎች", totalN: "{n} ተማሪዎች",
  call: "ደውል"
},

att: {
  title: "የዛሬ መገኘት", sub: "መገኘትን፣ አርፎ መምጣትንና ኪታብን ይመዝግቡ",
  prev: "የቀደመው ቀን", next: "የሚቀጥለው ቀን", today: "ዛሬ",
  present: "መጥቷል", absent: "አልመጣም", late: "አርፎ ከነበረ",
  minutes: "ደቂቃ", lateMinPh: "ደቂቃዎች",
  book: "ኪታብ", bookYes: "ኪታብ ይዞ መጥቷል", bookNo: "ባዶ እጁ",
  saved: "ተመዝግቧል ✅",
  noSession: "ዛሬ የትምህርት ቀን አይደለም",
  noSessionHint: "ቀናቱን በቅንብሮች መቀየር ይችላሉ — ወይም አስፈላጊ ቀን ከሆነ ለመመዝገብ።",
  noSessionBtn: "ቢሆንም መዝግብ",
  statPresent: "የመጡ", statAbsent: "ያልመጡ",
  statLate: "አርፈው የመጡ", statNoBook: "ያለ ኪታብ"
},

turn: {
  title: "የቂራአት ተራ", sub: "መትንና ሙጣለዓ በተራ፣ ዕዳውንም እየተከታተለ",
  matn: "የመትን ቂራአት", matnSub: "በቀን አንድ ተማሪ ብቻ",
  matnReader: "የመትን ተማሪ",
  mutala: "ሙጣለዓ", mutalaSub: "በቀን አንድ ወይም ሁለት ተማሪዎች",
  mutalaReader: "የሙጣለዓ ተማሪ",
  queue: "የተራ ዝርዝር", queueSub: "ቅደም ተከተሉና ወደ ሁለተኛው ዙር መድረስ",
  todayTurn: "የዛሬ ተራ", empty: "የተመደበ የለም",
  pick: "— ተማሪ ይምረጡ —",
  pickHint: "ቀድሞ የተመደበ ተማሪ ስላልነበረ፤ ያነበበውንና ያጠናውን ተማሪ ራስዎ ይምረጡ።",
  noStudents: "መጀመሪያ ተማሪዎችን ይጨምሩ",
  read: "ቀርጦታል ✅", didMutala: "ሙጣለዓ አድርጎታል ✅",
  debt: "ዕዳ", debt1: "ዕዳ አንድ ቀን", debt2: "ዕዳ ሁለት ቀናት", debtN: "ዕዳ {n} ቀናት",
  cycle: "ዙር {n}", done: "አጠናቋል ✅",
  carryNote:  "በተራው ቀን ስላልመጣ ተራው ለነገ ይቆያል።",
  doubleNote: "እንደገና ስላልመጣ ዕዳው ተከልሎበታል።",
  seqNote:    "ሲመጣ ተከታታይ ቀናት እየነበበ እስኪያከክል ዕዳውን ይከድናል።",
  cleared: "ዕዳውን አክድኗል ✨",
  manualNote: "በእጅ ሲምረጡ፡ ያልመጣውም ያላነበበውም ተማሪ ዕዳ ይሆናል።",
  pickedSaved: "ተመዝግቧል ✅"
},

exam: {
  title: "ፈተናዎች", sub: "የገጽ ብዛቱ በትክክል የተስተካከለ PDF ፈተና ይስሩ",
  new: "ፈተና መስራት",
  number: "የፈተና ቁጥር", numberHint: "ራሱ ይቆጠራል፡ የመጀመሪያ፣ ሁለተኛ…",
  book: "የኪታብ ስም", reading: "የቂራአት ስም", date: "ቀን",
  pagesQ: "ፈተናው ስንት ገጽ ይሁን?", onePage: "አንድ ገጽ", twoPages: "ሁለት ገጽ",
  autoFitNote: "የፊደል መጠኑ ራሱ ይስተካከላል፡ ይዘቱ ቢጨምር ይታነሳል፣ ቢሰበር ይጨምራል፤ ገጹ ሙሉ በሙሉ እስኪሞል።",
  typeEssay: "የሰረዝ ጥያቄዎች", typeMcq: "የምርጫ ጥያቄዎች", typeTf: "እውነት ወይም ሀሰት",
  addQ: "+ ጥያቄ", qPh: "ጥያቄውን ይጻፉ…",
  addOpt: "+ ምርጫ", optPh: "ምርጫ", removeOpt: "ምርጫን አስወግድ", removeQ: "ጥያቄን አስወግድ",
  generate: "PDF አዘጋጅ", generating: "በማዘጋጀት ላይ…", ready: "ዝግጁ! በማውረድ ላይ…",
  results: "ውጤቶች", addResult: "ውጤት መዝግብ",
  score: "ነጥብ", of: "ከ", saveResult: "ውጤቱን መዝግብ", resultSaved: "ውጤቱ ተመዝግቧል ✅",
  list: "ያለፉ ፈተናዎች", empty: "እስካሁን ፈተና የለም",
  viewPdf: "PDF ተመልከት", confirmDelete: "ይህ ፈተና በቋሚታዊነት ይጠፋል?",
  saved: "ፈተናው ተመዝግቧል ✅"
},

pdf: {
  bism: "بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ",
  examWord: "ፈተና ቁጥር {n}",
  nameLabel: "ስም", dateLabel: "ቀን",
  bookLabel: "ኪታብ", readingLabel: "ቂራአት",
  secEssay: "ለሚከተሉት ጥያቄዎች ይመልሱ",
  secMcq:   "ከሚከተሉት ጥያቄዎች ትክክለኛውን መልስ ይምረጡ",
  secTf:    "ለሚከተሉት ጥያቄዎች በእውነት ወይም ሀሰት ይመልሱ",
  note: "መልካም ዕድል!"
},

rep: {
  title: "የወላጅ ሪፖርቶች", sub: "ሪፖርቱን በአንድ መታ ያዘጋጁት",
  weekly: "ሳምንታዊ", monthly: "ወርሃዊ",
  weekLabel: "ሳምንት", monthLabel: "ወር",
  prev: "የቀደመው", next: "ቀጣይ", current: "አሁን ያለው",
  pickStudent: "ተማሪ ይምረጡ", allStudents: "ሁሉም ተማሪዎች",
  buildOne: "ሪፖርት አዘጋጅ", buildAll: "ሁሉንም በአንድ መታ አዘጋጅ",
  buildAllHint: "የእያንዳንዱ ተማሪ ሪፖርት ለወላጁ እንዲላክ ይዘጋጃል",
  copy: "ቅዳ", share: "አጋራ", telegram: "ቴሌግራም",
  telegramHint: "ቴሌግራምን መልእክቱ ዝግጁ ሆኖ ይከፍታል",
  copied: "ተቀድቷል ✅", copyErr: "መቅዳት አልተቻለም፤ በእጅ ይቅዱ",
  shared: "የማጋራት መስኮት ተከፍቷል",
  none: "በዚህ ጊዜ ውስጥ መዝገብ የለም",
  sendTitle: "ወላጁ ዘንድ መላክ"
},

rpt: {
  salam: "السلام عليكم ورحمة الله وبركاته",
  header: "📜ይሄ የ{name} {period} የ{reading} ሪፖርት ነው ።",
  weekly: "ሳምንታዊ", monthly: "ወርሃዊ",
  came: "✅መጥቷል", absent: "❌አልመጣም",
  lateN: "⏰{n}ደቂቃዎችን አርፍዷል", late1: "⏰አንድ ደቂቃ አርፍዷል",
  bookYes: "📝ኪታብ ይዞ መጥቷል",
  bookNo:  "📝ኪታብ ሳይዝ ባዶ እጁን ነው የመጣው",
  missedHdr: "ሙጣለዓ ወይም መትን ካመለጠው፡",
  missedMutala: "ሙጣለዓ አምልጦታል",
  missedMatn:   "መትን መቅራት አምልጦታል",
  missedOn: "በዚህ {period} በ{day} እለት {item}።",
  debtHdr: "ዕዳ፡",
  debtLine: "{n} ቀናት ዕዳ ተከልሎበታል፤ እስኪያሟላ ተከታታይ እየነበበ ይከድናል።",
  debtCleared: "ዕዳውን አክድኗል ✅",
  examHdr: "ፈተና ከነበረ፡",
  examScore: "ፈተና ከ{total} {score} አምጥቷል።",
  closing1: "ልጆቻቹህን ከማበረታታት እና ከመከታተል አይዘንጉ።",
  closing2: "ለትኩረታችሁና ለትብብራችሁ እናመሰግናለን።"
},

set: {
  title: "ቅንብሮች", sub: "የመተግበሪያው ቋንቋ፣ ማመሳሰልና ዳታ",
  language: "ቋንቋ",
  cloudTitle: "ደመኛ ማመሳሰል (Cloud Sync)",
  cloudDesc: "አንድ ጊዜ ያንቁት፤ ከዚያ በኋላ በተገናኙት ሁሉም ስልኮች ላይ ሁሉም ነገር በኢንተርኔት ራሱ ይመሳሰዳል።",
  syncOn: "ማመሳሰው በርቷል", syncOff: "ማመሳሰው ታግዷል",
  enable: "ማመሳሰውን አንቃ", disable: "አጥፋ",
  code: "የማመሳሰሻ ኮድ",
  codeHint: "በሌላ ስልክዎ አንድ ጊዜ ብቻ ያስገቡት፤ ከዚያ ሁሉም ራሱ ይመሳሰዳል።",
  pair: "በኮድ ስልክ አገናኝ", pairPh: "ኮዱን እዚህ ይለጥፉ", pairBtn: "አገናኝ",
  paired: "ተገናኝቷል! ዳታው በማምጣት ላይ…",
  pairErr: "ኮዱ ልክ አይደለም ወይም መገናኘት አልተቻለም",
  unpair: "አገናኙን ፍታ", unpairConfirm: "አገናኙ በዚህ ስልክ ብቻ ይፈታል።",
  syncNow: "አሁን አመሳስል", syncing: "በማመሳሰል ላይ…", synced: "ተመሳስሏል ✅",
  autoNote: "በየ፳ ሰከንዱ ራሱ ይታደሳል",
  lastSync: "የመጨረሻ ማመሳሰያ", never: "ገና አልተደረገም",
  manageReadings: "ቂራአቶችን ማስተዳደር", manageDays: "የትምህርት ቀናት",
  days: "ቀናት", readings: "ቂራአቶች",
  danger: "አደገኛ ቦታ", clear: "ሁሉንም ዳታ አጥፋ",
  clearConfirm: "ሁሉም ነገር በቋሚታዊነት ይጠፋል፤ መልሶ አይገባም። ብቁ ነዎት?", cleared: "ተሰርዟል",
  backup: "መጠባበቂያ ቅጂ", exportBtn: "ፋይል ላክ", importBtn: "ፋይል አስገባ",
  imported: "ገብቷል ✅", importErr: "የተበላሸ ፋይል",
  install: "መተግበሪያውን አክል", installed: "ታክሏል ✅",
  about: "ስለ", version: "ቅጽ"
},

gen: {
  save: "መዝግብ", cancel: "ሰርዝ", del: "አስወግድ", edit: "አስተካክል", close: "ዝጋ",
  confirm: "አረጋግጥ", yes: "አዎ", no: "አይ", add: "ጨምር", ok: "እሺ",
  error: "ስህተት", required: "ይህ መስክ ያስፈልጋል",
  date: "ቀን", name: "ስም", actions: "ተግባራት",
  total: "ድምር", none: "ምንም", today: "ዛሬ", all: "ሁሉም",
  loading: "በመጫን ላይ…", saved: "ተመዝግቧል ✅", deleted: "ተሰርዟል",
  selectStudent: "ተማሪ ይምረጡ", studentLabel: "ተማሪ"
},

days: ["እሁድ","ሰኞ","ማክሰኞ","ረቡዕ","ሐሙስ","ዓርብ","ቅዳሜ"],

optLetters: ["ሀ","ለ","ሐ","መ","ሠ","ረ"]
}
};

/* ══════════════════════════ المحرّك ══════════════════════════ */
const I18N = {
  LANGS: ["ar","en","am"],
  lang: "ar",

  /* التهيئة: قراءة اللغة المحفوظة وتطبيقها على <html lang dir> */
  init(){
    let saved = null;
    try { saved = localStorage.getItem("gd_lang"); } catch(e){ /* وضع خاص */ }
    this.lang = this.LANGS.includes(saved) ? saved : "ar";
    this.applyHtml();
    this._audit();
    return this.lang;
  },

  /* الوصول للقاموس الحالي */
  dict(){ return I18N_DICTS[this.lang] || I18N_DICTS.ar; },

  /* الترجمة: مسار منقّط "a.b.c" + استبدال {وسائط} — احتياطٌ إلى العربية ثم المفتاح نفسه */
  t(key, params){
    const cur = I18N_DICTS[this.lang] || I18N_DICTS.ar;
    let val = this._get(cur, key);
    if (val === undefined) val = this._get(I18N_DICTS.ar, key);
    let s = (val === undefined || val === null) ? key : String(val);
    if (params){
      for (const [k, v] of Object.entries(params)){
        s = s.split("{" + k + "}").join(String(v));
      }
    }
    return s;
  },

  _get(obj, path){
    const parts = path.split(".");
    let cur = obj;
    for (const p of parts){
      if (cur == null || typeof cur !== "object" || !(p in cur)) return undefined;
      cur = cur[p];
    }
    return cur;
  },

  /* تغيير اللغة + الحفظ + تطبيق الاتجاه */
  setLang(l){
    if (!this.LANGS.includes(l)) return false;
    this.lang = l;
    try { localStorage.setItem("gd_lang", l); } catch(e){}
    this.applyHtml();
    return true;
  },

  applyHtml(){
    const d = document.documentElement;
    d.setAttribute("lang", this.lang);
    d.setAttribute("dir", this.dir());
  },

  dir(){ return (I18N_DICTS[this.lang] || I18N_DICTS.ar)._meta.dir; },
  isRTL(){ return this.dir() === "rtl"; },

  /* الأيام — فهرسة JS: الأحد=0 … السبت=6 */
  dayNames(){ return this.dict().days; },
  dayName(x){
    const i = (x instanceof Date) ? x.getDay() : ((Number(x) % 7) + 7) % 7;
    return this.dict().days[i];
  },

  /* تنسيقات التواريخ: ሰኞ 08/06/2026 — كما في نموذج التقرير */
  _p(n){ return String(n).padStart(2, "0"); },
  fmtDate(d){ return this.dayName(d) + " " + this._p(d.getDate()) + "/" + this._p(d.getMonth()+1) + "/" + d.getFullYear(); },
  fmtShort(d){ return this._p(d.getDate()) + "/" + this._p(d.getMonth()+1) + "/" + d.getFullYear(); },
  fmtDayMonth(d){ return this.dayName(d) + " " + this._p(d.getDate()) + "/" + this._p(d.getMonth()+1); },

  /* حروف الخيارات: (أ)(ب)(ج) | (A)(B)(C) | (ሀ)(ለ)(ሐ) */
  optionLetters(){ return this.dict().optLetters; },

  /* صيغ الجمع لعدد الطلاب */
  studentsCount(n){
    if (this.lang === "ar"){
      if (n === 1) return this.t("students.total1");
      if (n === 2) return this.t("students.total2");
      return this.t("students.totalN", { n });
    }
    if (this.lang === "am"){
      if (n === 1) return this.t("students.total1");
      if (n === 2) return this.t("students.total2");
      return this.t("students.totalN", { n });
    }
    return n === 1 ? this.t("students.total1") : this.t("students.totalN", { n });
  },

  /* صيغ الدَّين: يومٌ واحد / يومان / {n} أيام */
  debtLabel(n){
    if (this.lang === "ar" && n === 1) return this.t("turn.debt1");
    if ((this.lang === "ar" || this.lang === "am") && n === 2) return this.t("turn.debt2");
    return this.t("turn.debtN", { n });
  },

  /* فحص اكتمال المفاتيح بين اللغات (تنبيه في وحدة التحكم فقط) */
  _audit(){
    try {
      const flat = (o, p = "") =>
        Object.entries(o).flatMap(([k, v]) =>
          (v && typeof v === "object" && !Array.isArray(v)) ? flat(v, p + k + ".") : [p + k]);
      const arKeys = flat(I18N_DICTS.ar);
      const missing = {};
      for (const l of ["en", "am"]){
        const set = new Set(flat(I18N_DICTS[l]));
        const m = arKeys.filter(k => !set.has(k));
        if (m.length) missing[l] = m;
      }
      const keys = Object.keys(missing);
      if (keys.length) console.warn("[i18n] مفاتيح ناقصة:", missing);
    } catch(e){ /* لا يعرقل التشغيل */ }
  }
};

/* التصدير العالمي — يستخدمه كلٌّ من core/ui/pdf/report/app */
window.I18N = I18N;
window.t = (k, p) => I18N.t(k, p);
