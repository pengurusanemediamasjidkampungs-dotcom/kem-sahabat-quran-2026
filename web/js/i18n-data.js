/**
 * Translation tables for the public page.
 *
 * Every entry is [Bahasa Melayu, English, العربية] so a missing language is
 * obvious during review. Values may contain {placeholders} filled in by t().
 *
 * Rules:
 * - Internal values sent to the server (Lelaki, Perempuan, ya, tidak) are NOT
 *   translated; only the labels the visitor sees.
 * - Proper nouns (mosque, surah, Yayasan Restu, Muzium Sultan Alam Shah) keep
 *   their Malay form so letters and directions stay consistent.
 */

export const STRINGS = {
  /* ---------- Meta and accessibility ---------- */
  'meta.title': [
    'Kem Sahabat Quran 2026 — Daftar Sekarang',
    'Kem Sahabat Quran 2026 — Register Now',
    'مخيم صاحب القرآن 2026 — سجّل الآن'
  ],
  'meta.description': [
    'Kem Sahabat Quran (KSQ) 2026: 14–16 Disember 2026, Masjid Kampung Sungai Lang Baru, Banting. 40 peserta sahaja. Yuran promosi RM120, daftar online RM110.',
    'Kem Sahabat Quran (KSQ) 2026: 14–16 December 2026, Kampung Sungai Lang Baru Mosque, Banting. Only 40 participants. Promotional fee RM120, online registration RM110.',
    'مخيم صاحب القرآن 2026: 14–16 ديسمبر 2026، مسجد كامبونغ سوغاي لانغ بارو، بنتنغ. 40 مشاركًا فقط. الرسوم الترويجية RM120، والتسجيل الإلكتروني RM110.'
  ],
  'a11y.skip': [
    'Lompat ke borang pendaftaran',
    'Skip to the registration form',
    'تخطَّ إلى نموذج التسجيل'
  ],
  'a11y.brand': [
    'Kem Sahabat Quran 2026 — kembali ke atas',
    'Kem Sahabat Quran 2026 — back to top',
    'مخيم صاحب القرآن 2026 — العودة إلى الأعلى'
  ],
  'a11y.nav': ['Navigasi utama', 'Main navigation', 'التنقل الرئيسي'],
  'a11y.menu': ['Menu halaman', 'Page menu', 'قائمة الصفحة'],
  'a11y.logo': [
    'Logo Masjid Kampung Sungai Lang Baru',
    'Kampung Sungai Lang Baru Mosque logo',
    'شعار مسجد كامبونغ سوغاي لانغ بارو'
  ],
  'a11y.quota': [
    'Maklumat pendaftaran langsung',
    'Live registration information',
    'معلومات التسجيل المباشرة'
  ],
  'a11y.photo': [
    'Pandangan udara Masjid Kampung Sungai Lang Baru',
    'Aerial view of Kampung Sungai Lang Baru Mosque',
    'منظر جوي لمسجد كامبونغ سوغاي لانغ بارو'
  ],
  'a11y.radioQuran': [
    'Kelancaran membaca Al-Quran',
    'Quran reading fluency',
    'طلاقة قراءة القرآن'
  ],
  'a11y.lang': ['Pilih bahasa', 'Choose language', 'اختر اللغة'],

  /* ---------- Header and navigation ---------- */
  'brand.name': ['Kem Sahabat Quran', 'Kem Sahabat Quran', 'مخيم صاحب القرآن'],
  'brand.sub': [
    'Masjid Kg. Sungai Lang Baru · Banting',
    'Kg. Sungai Lang Baru Mosque · Banting',
    'مسجد كامبونغ سوغاي لانغ بارو · بنتنغ'
  ],
  'nav.menu': ['Menu', 'Menu', 'القائمة'],
  'nav.program': ['Program', 'Programme', 'البرنامج'],
  'nav.schedule': ['Jadual', 'Schedule', 'الجدول'],
  'nav.poster': ['Poster', 'Poster', 'الملصق'],
  'nav.faq': ['Soalan', 'FAQ', 'الأسئلة'],
  'nav.register': ['Daftar', 'Register', 'التسجيل'],

  /* ---------- Hero ---------- */
  'hero.eyebrow': [
    'Masjid Kampung Sungai Lang Baru, Banting',
    'Kampung Sungai Lang Baru Mosque, Banting',
    'مسجد كامبونغ سوغاي لانغ بارو، بنتنغ'
  ],
  'hero.titleHtml': [
    'Kem <span>Sahabat</span><br>Quran 2026',
    'Kem <span>Sahabat</span><br>Quran 2026',
    'مخيم <span>صاحب</span><br>القرآن 2026'
  ],
  'hero.slogan': [
    '“Membina Jiwa, Mengungguli Akhlak dengan Kalamullah.”',
    '“Building Souls, Excelling in Character through the Words of Allah.”',
    '«بناء الأرواح والتفوق في الأخلاق بكلام الله.»'
  ],
  'hero.chipDate': [
    '<b>14–16 Dis 2026</b> · Isnin–Rabu',
    '<b>14–16 Dec 2026</b> · Monday–Wednesday',
    '<b>14–16 ديسمبر 2026</b> · الاثنين–الأربعاء'
  ],
  'hero.chipTime': [
    '8:00 pagi – 5:00 petang',
    '8:00 am – 5:00 pm',
    '8:00 صباحًا – 5:00 مساءً'
  ],
  'hero.chipPlace': [
    'Hari 1–2: Masjid · Hari 3: Shah Alam',
    'Day 1–2: Mosque · Day 3: Shah Alam',
    'اليوم 1–2: المسجد · اليوم 3: شاه علم'
  ],
  'hero.chipQuota': [
    '<b>40 peserta</b> sahaja',
    '<b>40 participants</b> only',
    '<b>40 مشاركًا</b> فقط'
  ],
  'hero.cta1': ['Daftar sekarang', 'Register now', 'سجّل الآن'],
  'hero.cta2': ['Kenali program', 'About the programme', 'تعرّف على البرنامج'],
  'hero.note': [
    'Program harian, tidak bermalam. Untuk remaja 10 tahun ke atas yang lancar membaca Al-Quran.',
    'A daily programme with no overnight stay. For teenagers aged 10 and above who can read the Quran fluently.',
    'برنامج نهاري دون مبيت. للناشئين من عمر 10 سنوات فما فوق ممن يقرؤون القرآن بطلاقة.'
  ],
  'hero.quotaLabel': [
    'daripada 40 slot masih terbuka',
    'of 40 places still open',
    'من أصل 40 مقعدًا لا تزال متاحة'
  ],
  'hero.photoLabel': [
    'Masjid Kampung Sungai Lang Baru',
    'Kampung Sungai Lang Baru Mosque',
    'مسجد كامبونغ سوغاي لانغ بارو'
  ],

  /* ---------- Live panel ---------- */
  'live.program': ['Kiraan detik program', 'Programme countdown', 'العد التنازلي للبرنامج'],
  'live.close': ['Pendaftaran ditutup', 'Registration closes', 'إغلاق التسجيل'],
  'live.slot': ['Baki slot', 'Places left', 'المقاعد المتبقية'],
  'live.slotOfPrefix': ['daripada', 'of', 'من أصل'],
  'live.slotOfSuffix': ['slot', 'places', 'مقعدًا'],
  'live.priceOnline': [
    'Daftar online: RM110',
    'Online registration: RM110',
    'التسجيل الإلكتروني: RM110'
  ],
  'price.original': ['Harga asal', 'Original price', 'السعر الأصلي'],
  'price.promo': ['Yuran promosi', 'Promotional fee', 'الرسوم الترويجية'],
  'live.slotNote': ['Mengemas kini…', 'Updating…', 'جارٍ التحديث…'],
  'live.closeNote': [
    'Tarikh tutup akan dipaparkan.',
    'The closing date will be shown here.',
    'سيُعرض تاريخ الإغلاق هنا.'
  ],
  'live.programPhase': [
    'Menunggu tarikh program…',
    'Waiting for the programme date…',
    'في انتظار تاريخ البرنامج…'
  ],
  'unit.days': ['hari', 'days', 'أيام'],
  'unit.hours': ['jam', 'hours', 'ساعات'],
  'unit.minutes': ['minit', 'minutes', 'دقائق'],
  'unit.seconds': ['saat', 'seconds', 'ثوانٍ'],

  /* ---------- Programme section ---------- */
  'program.eyebrow': ['Tiga hari yang bermakna', 'Three meaningful days', 'ثلاثة أيام ذات معنى'],
  'program.title': [
    'Satu kem, tiga hari, satu perjalanan',
    'One camp, three days, one journey',
    'مخيم واحد، ثلاثة أيام، رحلة واحدة'
  ],
  'program.lead': [
    'Peserta menghafaz surah pilihan, membina adab dan kepimpinan, kemudian menyempurnakan tasmik dalam lawatan sambil belajar ke Shah Alam.',
    'Participants memorise selected surahs, build good character and leadership, then complete their tasmik on an educational visit to Shah Alam.',
    'يحفظ المشاركون سورًا مختارة، ويبنون الأدب والقيادة، ثم يُتمّون التسميع في زيارة تعليمية إلى شاه علم.'
  ],
  'day1.kicker': ['Isnin · 14 Disember 2026', 'Monday · 14 December 2026', 'الاثنين · 14 ديسمبر 2026'],
  'day1.title': [
    'Hafazan dan pembinaan jiwa',
    'Memorisation and character building',
    'الحفظ وبناء الروح'
  ],
  'day1.place': [
    'Masjid Kampung Sungai Lang Baru, Banting.',
    'Kampung Sungai Lang Baru Mosque, Banting.',
    'مسجد كامبونغ سوغاي لانغ بارو، بنتنغ.'
  ],
  'day1.body': [
    'Pendaftaran, taklimat, teknik hafazan pantas, mula Surah Al-Mulk, slot akhlak, muraja’ah dan tasmik kumpulan kecil.',
    'Registration, briefing, fast memorisation technique, starting Surah Al-Mulk, character session, muraja’ah and small-group tasmik.',
    'التسجيل، والإحاطة، وتقنية الحفظ السريع، وبدء سورة الملك، وجلسة الأخلاق، والمراجعة، والتسميع في مجموعات صغيرة.'
  ],
  'day2.kicker': ['Selasa · 15 Disember 2026', 'Tuesday · 15 December 2026', 'الثلاثاء · 15 ديسمبر 2026'],
  'day2.title': [
    'Hafazan lanjutan dan kepimpinan',
    'Advanced memorisation and leadership',
    'الحفظ المتقدم والقيادة'
  ],
  'day2.place': [
    'Masjid Kampung Sungai Lang Baru, Banting.',
    'Kampung Sungai Lang Baru Mosque, Banting.',
    'مسجد كامبونغ سوغاي لانغ بارو، بنتنغ.'
  ],
  'day2.body': [
    'Hafazan Surah As-Sajdah, Al-Insan dan permulaan Al-Kahfi mengikut kemampuan, slot kepimpinan remaja, tasmik percubaan dan taklimat Hari 3.',
    'Memorising Surah As-Sajdah, Al-Insan and the start of Al-Kahfi according to ability, youth leadership session, practice tasmik and Day 3 briefing.',
    'حفظ سورة السجدة والإنسان وبداية الكهف حسب القدرة، وجلسة قيادة الناشئين، وتسميع تدريبي، وإحاطة اليوم الثالث.'
  ],
  'day3.kicker': ['Rabu · 16 Disember 2026', 'Wednesday · 16 December 2026', 'الأربعاء · 16 ديسمبر 2026'],
  'day3.title': ['Jaulah ke Shah Alam', 'Visit to Shah Alam', 'الجولة إلى شاه علم'],
  'day3.place': [
    'Yayasan Restu, Muzium Sultan Alam Shah, Masjid Negeri Shah Alam.',
    'Yayasan Restu, Sultan Alam Shah Museum, Shah Alam State Mosque.',
    'مؤسسة رستو، ومتحف السلطان عالم شاه، ومسجد الولاية في شاه علم.'
  ],
  'day3.bodyHtml': [
    'Lawatan sambil belajar, solat Zohor berjemaah, makan tengah hari dan <b>tasmik kemuncak</b> di sekitar masjid dan tasik.',
    'Educational visit, congregational Zohor prayer, lunch and the <b>final tasmik</b> around the mosque and lake.',
    'زيارة تعليمية، وصلاة الظهر جماعة، والغداء، و<b>التسميع الختامي</b> حول المسجد والبحيرة.'
  ],
  'hafazan.kicker': ['Sasaran hafazan', 'Memorisation target', 'هدف الحفظ'],
  'hafazan.title': ['Empat surah pilihan', 'Four selected surahs', 'أربع سور مختارة'],
  'hafazan.more': ['Penjelasan lanjut', 'More details', 'شرح أوفى'],
  'hafazan.mulk.name': ['Surah Al-Mulk', 'Surah Al-Mulk', 'سورة الملك'],
  'hafazan.mulk.verses': ['30 ayat', '30 verses', '30 آية'],
  'hafazan.mulk.theme': [
    'Tema: Kedaulatan Allah dan ujian hidup.',
    'Theme: Allah’s sovereignty and the tests of life.',
    'الموضوع: سيادة الله وابتلاءات الحياة.'
  ],
  'hafazan.mulk.detail': [
    'Surah ini membuka dengan penegasan bahawa seluruh kerajaan dan kekuasaan mutlak hanya milik Allah (Al-Malik al-Mulk). Kehidupan dan kematian dicipta sebagai ujian untuk melihat siapa yang terbaik amalannya, bukan sekadar banyak amalannya. Ia juga mengingatkan tentang azab kubur dan pentingnya ketakwaan serta amal soleh sebagai persiapan menghadap kedaulatan Allah. Justeru, Al-Mulk meletakkan asas kesedaran bahawa hidup ini bukan milik kita, tetapi amanah di bawah pemerintahan Allah.',
    'The surah opens by affirming that all dominion and absolute authority belong to Allah alone (Al-Malik al-Mulk). Life and death are created as a test to see who is best in deeds, not merely who does the most. It also reminds us of the punishment of the grave and the importance of taqwa (God-consciousness) and righteous deeds as preparation to meet Allah’s sovereignty. Al-Mulk therefore establishes the awareness that our lives are not our own, but a trust under Allah’s rule.',
    'تبدأ السورة بتأكيد أن الملك والسلطان المطلق لله وحده (الملك المالك). وقد خُلق الموت والحياة ابتلاءً لينظر أيُّكم أحسن عملًا، لا أكثرهم عملًا. وتذكّر بعذاب القبر وبأهمية التقوى والعمل الصالح استعدادًا للقاء سيادة الله. ومن هنا تضع سورة الملك أساس الوعي بأن حياتنا ليست ملكًا لنا، بل أمانة تحت حكم الله.'
  ],
  'hafazan.kahfi.name': ['Surah Al-Kahfi', 'Surah Al-Kahfi', 'سورة الكهف'],
  'hafazan.kahfi.verses': ['110 ayat', '110 verses', '110 آية'],
  'hafazan.kahfi.theme': [
    'Tema: Ujian iman, harta, ilmu, dan kuasa.',
    'Theme: Tests of faith, wealth, knowledge and power.',
    'الموضوع: ابتلاءات الإيمان والمال والعلم والسلطة.'
  ],
  'hafazan.kahfi.note': [
    'Nota: Pembahagian ayat ditentukan ustaz mengikut kemampuan peserta.',
    'Note: The division of verses is decided by the ustaz according to each participant’s ability.',
    'ملاحظة: يحدّد الأستاذ تقسيم الآيات حسب قدرة كل مشارك.'
  ],
  'hafazan.kahfi.detail': [
    'Al-Kahfi memaparkan empat kisah utama yang masing-masing mewakili ujian kehidupan: Ashabul Kahfi (ujian mempertahankan iman dalam masyarakat yang menindas), Pemilik Dua Kebun (ujian kekayaan dan kesombongan, serta pentingnya syukur dan tawadhu’), Nabi Musa dan Khidir (ujian ilmu dan kesabaran dalam menerima hikmah Allah yang tidak terjangkau akal), dan Zulkarnain (ujian kekuasaan dan keadilan dalam kepimpinan). Kisah-kisah ini mengajar bahawa setiap ujian—sama ada iman, harta, ilmu, atau kuasa—menuntut kesabaran, ketundukan, dan pergantungan kepada Allah, selari dengan tema kedaulatan-Nya.',
    'Al-Kahfi presents four main stories, each representing a test of life: the People of the Cave (standing firm in faith in an oppressive society), the Owner of Two Gardens (the test of wealth and arrogance, and the importance of gratitude and humility), Prophet Musa and Khidir (the test of knowledge and patience in accepting Allah’s wisdom beyond human reasoning), and Zulkarnain (the test of power and justice in leadership). These stories teach that every test — whether of faith, wealth, knowledge or power — requires patience, submission and reliance on Allah, in line with the theme of His sovereignty.',
    'تعرض سورة الكهف أربع قصص رئيسية، تمثّل كل منها ابتلاءً من ابتلاءات الحياة: أصحاب الكهف (الثبات على الإيمان في مجتمع قاهر)، وصاحب الجنتين (ابتلاء المال والغرور، وأهمية الشكر والتواضع)، وموسى والخضر (ابتلاء العلم والصبر على قبول حكمة الله التي لا تدركها العقول)، وذو القرنين (ابتلاء السلطة والعدل في القيادة). وتعلّم هذه القصص أن كل ابتلاء — سواء في الإيمان أو المال أو العلم أو السلطة — يستدعي الصبر والخضوع والتوكل على الله، بما يوافق موضوع سيادته.'
  ],
  'hafazan.sajdah.name': ['Surah As-Sajdah', 'Surah As-Sajdah', 'سورة السجدة'],
  'hafazan.sajdah.verses': ['30 ayat', '30 verses', '30 آية'],
  'hafazan.sajdah.theme': [
    'Tema: Ketundukan kepada Allah dan keyakinan Hari Akhirat.',
    'Theme: Submission to Allah and certainty in the Hereafter.',
    'الموضوع: الخضوع لله واليقين بالآخرة.'
  ],
  'hafazan.sajdah.detail': [
    'Surah ini dinamakan sempena sujud (ketundukan) dalam ayat 15. Tema utamanya ialah menghapuskan keraguan tentang Tauhid, Hari Akhirat, dan Kenabian, serta mengajak manusia tunduk kepada Allah Yang Maha Esa sebagai Pencipta dan Pengatur alam. Ia menggambarkan penyesalan orang kafir yang baru mahu sujud di akhirat, tetapi sujud mereka sudah tidak berguna. Justeru, As-Sajdah menuntut respons praktikal terhadap kedaulatan Allah, iaitu ketundukan jiwa dan pengharapan sepenuhnya kepada-Nya dalam kehidupan dunia.',
    'The surah is named after the prostration (submission) in verse 15. Its main theme is to remove doubt about the Oneness of Allah, the Hereafter and prophethood, and to call people to submit to Allah, the One who creates and governs the universe. It depicts the regret of the disbelievers who only wish to prostrate in the Hereafter, when their prostration is no longer of any use. As-Sajdah therefore demands a practical response to Allah’s sovereignty: a soul that submits and places complete hope in Him in this worldly life.',
    'سُمّيت السورة بالسجدة (الخضوع) في الآية 15. وموضوعها الرئيسي إزالة الشك في التوحيد والآخرة والنبوة، ودعوة الناس إلى الخضوع لله الواحد الأحد، الخالق والمدبّر للكون. وتصوّر ندم الكافرين الذين يتمنّون السجود في الآخرة، وقد صار سجودهم لا ينفع. لذا تطالب السجدة باستجابة عملية لسيادة الله، وهي خضوع النفس والتوكل الكامل عليه في الحياة الدنيا.'
  ],
  'hafazan.insan.name': ['Surah Al-Insan', 'Surah Al-Insan', 'سورة الإنسان'],
  'hafazan.insan.verses': ['31 ayat', '31 verses', '31 آية'],
  'hafazan.insan.theme': [
    'Tema: Syukur, pengorbanan, dan tanggungjawab hamba.',
    'Theme: Gratitude, sacrifice and the servant’s responsibility.',
    'الموضوع: الشكر والتضحية ومسؤولية العبد.'
  ],
  'hafazan.insan.detail': [
    'Surah ini bermula dengan penciptaan manusia dan petunjuk yang diberikan Allah, serta pilihan antara syukur atau kufur (mengingkari). Ia kemudian memuji golongan abrar (orang-orang soleh) yang menunaikan nazar, memberi makan kepada fakir miskin, anak yatim, dan tawanan semata-mata kerana Allah, tanpa mengharapkan balasan, serta takut kepada Hari Kiamat. Al-Insan menegaskan bahawa tanggungjawab hamba ialah menggunakan nikmat dan kebebasan memilih untuk berkorban dan bersyukur, bukan tenggelam dalam cinta dunia.',
    'The surah begins with the creation of man and the guidance Allah has given, and the choice between gratitude or denial. It then praises the abrar (the righteous), who fulfil their vows, feed the poor, the orphan and the captive solely for Allah’s sake, without expecting any reward, and who fear the Day of Judgement. Al-Insan affirms that the servant’s responsibility is to use blessings and the freedom of choice to sacrifice and give thanks, rather than drown in love of the world.',
    'تبدأ السورة بخلق الإنسان والهداية التي منحها الله، وبالاختيار بين الشكر أو الكفر. ثم تثني على الأبرار الذين يوفون بالنذر، ويطعمون الفقير واليتيم والأسير لوجه الله وحده، دون انتظار جزاء، ويخشون يوم القيامة. وتؤكد سورة الإنسان أن مسؤولية العبد هي استخدام النعم وحرية الاختيار في التضحية والشكر، لا في الغرق في حب الدنيا.'
  ],
  'isi.kicker': ['Pengisian utama', 'Main activities', 'البرامج الرئيسية'],
  'isi.title': [
    'Belajar, bina jiwa, berbakti',
    'Learn, build character, serve',
    'تعلّم، وابنِ الروح، واخدم'
  ],
  'isi.i1': [
    'Teknik Hafazan Pantas dan sesi tasmik',
    'Fast Memorisation Technique and tasmik sessions',
    'تقنية الحفظ السريع وجلسات التسميع'
  ],
  'isi.i2': [
    'Slot Motivasi Pembinaan Jiwa: adab dan akhlak',
    'Character Building session: manners and morals',
    'جلسة بناء الروح: الأدب والأخلاق'
  ],
  'isi.i3': ['Slot Kepimpinan Remaja', 'Youth Leadership session', 'جلسة قيادة الناشئين'],
  'isi.i4': [
    'Jaulah Sahabat Quran ke Shah Alam',
    'Sahabat Quran visit to Shah Alam',
    'جولة صاحب القرآن إلى شاه علم'
  ],
  'isi.i5': [
    'Tasmik kemuncak di sekitar Masjid Negeri dan tasik',
    'Final tasmik around the State Mosque and the lake',
    'التسميع الختامي حول مسجد الولاية والبحيرة'
  ],
  'fact.capacity.label': ['Kapasiti', 'Capacity', 'السعة'],
  'fact.capacity.value': ['40 peserta sahaja', 'Only 40 participants', '40 مشاركًا فقط'],
  'fact.require.label': ['Syarat', 'Requirements', 'الشروط'],
  'fact.require.value': [
    '10 tahun ke atas · lancar Al-Quran',
    'Aged 10 and above · fluent in the Quran',
    '10 سنوات فما فوق · إتقان قراءة القرآن'
  ],
  'fact.concept.label': ['Konsep', 'Format', 'الصيغة'],
  'fact.concept.value': [
    'Program harian, tidak bermalam',
    'Daily programme, no overnight stay',
    'برنامج نهاري دون مبيت'
  ],
  'fact.fee.label': ['Yuran', 'Fee', 'الرسوم'],
  'fact.fee.value': ['RM120 · online RM110', 'RM120 · online RM110', 'RM120 · إلكتروني RM110'],

  /* ---------- Schedule ---------- */
  'jadual.eyebrow': ['Aturcara penuh', 'Full itinerary', 'البرنامج الكامل'],
  'jadual.title': [
    'Jadual Hari 1 hingga Hari 3',
    'Schedule for Day 1 to Day 3',
    'جدول اليوم 1 إلى اليوم 3'
  ],
  'jadual.lead': [
    'Jadual ini berdasarkan Modul Program. Waktu solat ialah anggaran untuk Selangor dan perlu disemak dengan jadual rasmi JAKIM/JAIS.',
    'This schedule is based on the Programme Module. Prayer times are estimates for Selangor and should be checked against the official JAKIM/JAIS timetable.',
    'هذا الجدول مبني على وحدة البرنامج. أوقات الصلاة تقديرية لولاية سيلانغور ويجب التحقق منها من الجدول الرسمي لـ JAKIM/JAIS.'
  ],
  's1.summary': [
    'Hari 1 — Isnin, 14 Disember 2026 · Masjid Kg. Sungai Lang Baru',
    'Day 1 — Monday, 14 December 2026 · Kg. Sungai Lang Baru Mosque',
    'اليوم 1 — الاثنين، 14 ديسمبر 2026 · مسجد كامبونغ سوغاي لانغ بارو'
  ],
  's2.summary': [
    'Hari 2 — Selasa, 15 Disember 2026 · Masjid Kg. Sungai Lang Baru',
    'Day 2 — Tuesday, 15 December 2026 · Kg. Sungai Lang Baru Mosque',
    'اليوم 2 — الثلاثاء، 15 ديسمبر 2026 · مسجد كامبونغ سوغاي لانغ بارو'
  ],
  's3.summary': [
    'Hari 3 — Rabu, 16 Disember 2026 · Shah Alam (bas)',
    'Day 3 — Wednesday, 16 December 2026 · Shah Alam (bus)',
    'اليوم 3 — الأربعاء، 16 ديسمبر 2026 · شاه علم (حافلة)'
  ],
  'table.time': ['Masa', 'Time', 'الوقت'],
  'table.activity': ['Aktiviti', 'Activity', 'النشاط'],
  's1.r1': [
    'Pendaftaran peserta, pengagihan tag dan modul',
    'Participant registration, tag and module distribution',
    'تسجيل المشاركين وتوزيع البطاقات والوحدات'
  ],
  's1.r2': [
    'Perasmian, taklimat program, bacaan doa dan ta’aruf',
    'Opening, programme briefing, prayer and introductions',
    'الافتتاح، وإحاطة البرنامج، والدعاء، والتعارف'
  ],
  's1.r3': [
    'Teknik Hafazan Pantas (sesi 1): pengenalan teknik; mula Surah Al-Mulk',
    'Fast Memorisation Technique (session 1): introduction to the technique; starting Surah Al-Mulk',
    'تقنية الحفظ السريع (الجلسة 1): التعريف بالتقنية؛ بدء سورة الملك'
  ],
  's1.r4': ['Minum pagi dan rehat', 'Morning break and rest', 'استراحة الصباح والراحة'],
  's1.r5': [
    'Hafazan Surah Al-Mulk (sesi 2) secara berkumpulan',
    'Memorising Surah Al-Mulk (session 2) in groups',
    'حفظ سورة الملك (الجلسة 2) في مجموعات'
  ],
  's1.r6': [
    'Solat Zohor, makan tengah hari dan rehat',
    'Zohor prayer, lunch and rest',
    'صلاة الظهر، والغداء، والراحة'
  ],
  's1.r7': [
    'Slot Motivasi Pembinaan Jiwa: Adab dan Akhlak',
    'Character Building session: Manners and Morals',
    'جلسة بناء الروح: الأدب والأخلاق'
  ],
  's1.r8': ['Minum petang', 'Afternoon tea', 'استراحة العصر'],
  's1.r9': [
    'Muraja’ah dan tasmik kumpulan kecil',
    'Muraja’ah and small-group tasmik',
    'المراجعة والتسميع في مجموعات صغيرة'
  ],
  's1.r10': [
    'Solat Asar, refleksi hari pertama, doa dan bersurai',
    'Asar prayer, first-day reflection, prayer and dismissal',
    'صلاة العصر، ومراجعة اليوم الأول، والدعاء، والانصراف'
  ],
  's2.r1': [
    'Kehadiran, bacaan doa dan muraja’ah Surah Al-Mulk',
    'Attendance, prayer and muraja’ah of Surah Al-Mulk',
    'الحضور، والدعاء، ومراجعة سورة الملك'
  ],
  's2.r2': [
    'Teknik Hafazan Pantas (sesi 3): Surah As-Sajdah',
    'Fast Memorisation Technique (session 3): Surah As-Sajdah',
    'تقنية الحفظ السريع (الجلسة 3): سورة السجدة'
  ],
  's2.r3': ['Minum pagi dan rehat', 'Morning break and rest', 'استراحة الصباح والراحة'],
  's2.r4': [
    'Hafazan Surah Al-Insan dan permulaan Surah Al-Kahfi (mengikut kemampuan)',
    'Memorising Surah Al-Insan and starting Surah Al-Kahfi (according to ability)',
    'حفظ سورة الإنسان وبداية سورة الكهف (حسب القدرة)'
  ],
  's2.r5': [
    'Solat Zohor, makan tengah hari dan rehat',
    'Zohor prayer, lunch and rest',
    'صلاة الظهر، والغداء، والراحة'
  ],
  's2.r6': [
    'Slot Motivasi Pembinaan Jiwa: Kepimpinan Remaja',
    'Character Building session: Youth Leadership',
    'جلسة بناء الروح: قيادة الناشئين'
  ],
  's2.r7': ['Minum petang', 'Afternoon tea', 'استراحة العصر'],
  's2.r8': [
    'Tasmik percubaan dan muraja’ah untuk persediaan kemuncak',
    'Practice tasmik and muraja’ah in preparation for the finale',
    'تسميع تدريبي ومراجعة استعدادًا للختام'
  ],
  's2.r9': [
    'Solat Asar, taklimat Hari 3 (pakaian, bekalan, peraturan bas), doa dan bersurai',
    'Asar prayer, Day 3 briefing (clothing, supplies, bus rules), prayer and dismissal',
    'صلاة العصر، وإحاطة اليوم الثالث (اللباس، والمستلزمات، وقواعد الحافلة)، والدعاء، والانصراف'
  ],
  's3.r1': [
    'Berkumpul di masjid, kehadiran dan doa permusafiran',
    'Assemble at the mosque, attendance and travel prayer',
    'التجمع في المسجد، والحضور، ودعاء السفر'
  ],
  's3.r2': [
    'Bertolak ke Shah Alam (zikir dan muraja’ah dalam bas)',
    'Depart for Shah Alam (zikir and muraja’ah on the bus)',
    'الانطلاق إلى شاه علم (الذكر والمراجعة في الحافلة)'
  ],
  's3.r3': [
    'Tiba terus ke Yayasan Restu: lawatan galeri dan penerangan',
    'Arrive at Yayasan Restu: gallery tour and briefing',
    'الوصول إلى مؤسسة رستو: زيارة المعرض والشرح'
  ],
  's3.r4': [
    'Muzium Sultan Alam Shah (tiket RM2–RM5 seorang; sila sahkan)',
    'Sultan Alam Shah Museum (tickets RM2–RM5 per person; to be confirmed)',
    'متحف السلطان عالم شاه (التذكرة RM2–RM5 للشخص؛ يُرجى التأكيد)'
  ],
  's3.r5': [
    'Masjid Negeri Shah Alam: tiba, bersiap dan berwuduk',
    'Shah Alam State Mosque: arrival, preparation and ablution',
    'مسجد الولاية في شاه علم: الوصول والاستعداد والوضوء'
  ],
  's3.r6': ['Solat Zohor berjemaah', 'Congregational Zohor prayer', 'صلاة الظهر جماعة'],
  's3.r7': ['Makan tengah hari', 'Lunch', 'الغداء'],
  's3.r8Html': [
    '<b>KEMUNCAK:</b> tasmik hafazan / bacaan surah yang dihafaz sejak Hari 1 dan 2 di sekitar tasik dan Masjid Negeri',
    '<b>FINALE:</b> tasmik of the surahs memorised since Day 1 and 2, around the lake and the State Mosque',
    '<b>الختام:</b> تسميع السور المحفوظة منذ اليومين الأول والثاني حول البحيرة ومسجد الولاية'
  ],
  's3.r9': [
    'Refleksi, penyampaian sijil dan doa penutup',
    'Reflection, certificate presentation and closing prayer',
    'مراجعة، وتوزيع الشهادات، ودعاء الختام'
  ],
  's3.r10': [
    'Bertolak pulang ke Banting; dijangka tiba kira-kira 5:30 petang',
    'Depart for Banting; expected arrival around 5:30 pm',
    'العودة إلى بنتنغ؛ الوصول المتوقع نحو 5:30 مساءً'
  ],

  /* ---------- Destinations ---------- */
  'dest1.kicker': ['Destinasi 1', 'Destination 1', 'المحطة 1'],
  'dest1.name': ['Yayasan Restu', 'Yayasan Restu', 'مؤسسة رستو'],
  'dest1.addr': [
    'Kompleks Taman Seni Islam Antarabangsa, No. 2A Pesiaran Damai, Seksyen 10, 40100 Shah Alam. Bersebelahan Masjid Negeri dan Taman Tasik Shah Alam.',
    'Kompleks Taman Seni Islam Antarabangsa, No. 2A Pesiaran Damai, Section 10, 40100 Shah Alam. Next to the State Mosque and Shah Alam Lake Park.',
    'مجمع حديقة الفن الإسلامي الدولي، رقم 2A بيسياران داماي، القسم 10، 40100 شاه علم. بجوار مسجد الولاية وحديقة بحيرة شاه علم.'
  ],
  'dest1.desc': [
    'Pusat seni Islam yang dikaitkan dengan penyalinan, pencetakan dan penghiasan mashaf Al-Quran. Yuran kumpulan akan disahkan dengan pihak Yayasan.',
    'An Islamic arts centre associated with copying, printing and decorating Quran manuscripts. The group fee will be confirmed with the foundation.',
    'مركز للفنون الإسلامية مرتبط بنسخ المصاحف وطبعها وتزيينها. ستُؤكَّد رسوم المجموعة مع المؤسسة.'
  ],
  'dest2.kicker': ['Destinasi 2', 'Destination 2', 'المحطة 2'],
  'dest2.name': [
    'Muzium Sultan Alam Shah',
    'Sultan Alam Shah Museum',
    'متحف السلطان عالم شاه'
  ],
  'dest2.addr': [
    'Persiaran Bandaraya, Seksyen 14, 40000 Shah Alam · +60 3-5519 0050 · Selasa–Ahad, 9:30 pagi–5:30 petang (tutup Isnin).',
    'Persiaran Bandaraya, Section 14, 40000 Shah Alam · +60 3-5519 0050 · Tuesday–Sunday, 9:30 am–5:30 pm (closed Monday).',
    'بيسياران بندرايا، القسم 14، 40000 شاه علم · \u200E+60 3-5519 0050\u200E · الثلاثاء–الأحد، 9:30 صباحًا–5:30 مساءً (مغلق الاثنين).'
  ],
  'dest2.desc': [
    'Galeri Sejarah, Adat & Kebudayaan, dan Alam Semula Jadi. Kadar tiket kumpulan akan disahkan dengan muzium.',
    'History, Customs & Culture, and Natural History galleries. Group ticket rates will be confirmed with the museum.',
    'معارض التاريخ والعادات والثقافة والتاريخ الطبيعي. ستُؤكَّد أسعار تذاكر المجموعة مع المتحف.'
  ],
  'dest3.kicker': ['Destinasi 3', 'Destination 3', 'المحطة 3'],
  'dest3.name': [
    'Masjid Negeri Shah Alam',
    'Shah Alam State Mosque',
    'مسجد الولاية بشاه علم'
  ],
  'dest3.addr': [
    'Masjid Sultan Salahuddin Abdul Aziz Shah. Solat Zohor, makan tengah hari dan tasmik kemuncak di sekitar masjid dan tasik.',
    'Sultan Salahuddin Abdul Aziz Shah Mosque. Zohor prayer, lunch and the final tasmik around the mosque and lake.',
    'مسجد السلطان صلاح الدين عبد العزيز شاه. صلاة الظهر والغداء والتسميع الختامي حول المسجد والبحيرة.'
  ],
  'dest3.desc': [
    'Kebenaran penggunaan kawasan akan dimaklumkan kepada pejabat masjid lebih awal.',
    'Permission to use the grounds will be notified to the mosque office in advance.',
    'سيُبلَّغ مكتب المسجد مسبقًا بطلب إذن استخدام الساحة.'
  ],

  /* ---------- Poster ---------- */
  'poster.eyebrow': ['Poster rasmi', 'Official poster', 'الملصق الرسمي'],
  'poster.title': [
    'Kongsi poster KSQ 2026',
    'Share the KSQ 2026 poster',
    'شارك ملصق KSQ 2026'
  ],
  'poster.lead': [
    'Muat turun poster untuk dicetak atau kongsikan melalui WhatsApp. Maklumat program, yuran dan kod QR pendaftaran semuanya ada pada poster.',
    'Download the poster to print or share it on WhatsApp. The programme details, fees and registration QR code are all on the poster.',
    'نزّل الملصق لطباعته أو شاركه عبر واتساب. تفاصيل البرنامج والرسوم ورمز QR للتسجيل موجودة كلها في الملصق.'
  ],
  'poster.downloadPdf': [
    'Muat turun poster (PDF)',
    'Download poster (PDF)',
    'تنزيل الملصق (PDF)'
  ],
  'poster.downloadImage': [
    'Muat turun gambar (JPG)',
    'Download image (JPG)',
    'تنزيل الصورة (JPG)'
  ],
  'poster.pdfNote': [
    'PDF sesuai untuk cetak.',
    'The PDF is best for printing.',
    'ملف PDF مناسب للطباعة.'
  ],
  'poster.share': ['Kongsi poster', 'Share poster', 'شارك الملصق'],
  'poster.open': ['Lihat poster penuh', 'View the full poster', 'عرض الملصق كاملًا'],
  'poster.openAria': [
    'Buka poster penuh dalam tab baharu',
    'Open the full poster in a new tab',
    'افتح الملصق كاملًا في تبويب جديد'
  ],
  'poster.alt': [
    'Poster rasmi Kem Sahabat Quran 2026',
    'Official Kem Sahabat Quran 2026 poster',
    'الملصق الرسمي لمخيم صاحب القرآن 2026'
  ],
  'poster.shareTitle': [
    'Poster Kem Sahabat Quran 2026',
    'Kem Sahabat Quran 2026 poster',
    'ملصق مخيم صاحب القرآن 2026'
  ],
  'poster.shareText': [
    'Poster rasmi Kem Sahabat Quran 2026 — 14–16 Disember 2026, Masjid Kampung Sungai Lang Baru, Banting. 40 peserta sahaja, daftar online RM110.',
    'Official Kem Sahabat Quran 2026 poster — 14–16 December 2026, Kampung Sungai Lang Baru Mosque, Banting. Only 40 places, online registration RM110.',
    'الملصق الرسمي لمخيم صاحب القرآن 2026 — 14–16 ديسمبر 2026، مسجد كامبونغ سوغاي لانغ بارو، بنتنغ. 40 مشاركًا فقط، والتسجيل الإلكتروني RM110.'
  ],
  'poster.shareDone': [
    'Terima kasih kerana berkongsi poster.',
    'Thank you for sharing the poster.',
    'شكرًا لمشاركتك الملصق.'
  ],
  'poster.shareFailed': [
    'Kongsi tidak tersedia. Sila muat turun poster dan kongsikan secara manual.',
    'Sharing is not available. Please download the poster and share it manually.',
    'المشاركة غير متاحة. يرجى تنزيل الملصق ومشاركته يدويًا.'
  ],

  /* ---------- Registration form ---------- */
  'daftar.eyebrow': ['Pendaftaran online', 'Online registration', 'التسجيل الإلكتروني'],
  'daftar.title': [
    'Daftar peserta KSQ 2026',
    'Register for KSQ 2026',
    'سجّل مشاركًا في مخيم 2026'
  ],
  'daftar.lead': [
    'Isi maklumat di bawah. Selepas hantar, anda akan menerima nombor rujukan, jumlah yuran dan arahan bayaran. Slot terhad kepada 40 peserta.',
    'Fill in the details below. After submitting, you will receive a reference number, the fee amount and payment instructions. Places are limited to 40 participants.',
    'املأ البيانات أدناه. بعد الإرسال ستستلم رقمًا مرجعيًا ومقدار الرسوم وتعليمات الدفع. المقاعد محدودة بـ40 مشاركًا.'
  ],
  'form.name.label': ['Nama penuh peserta', 'Participant’s full name', 'الاسم الكامل للمشارك'],
  'form.name.ph': ['Contoh: Ahmad Danish', 'Example: Ahmad Danish', 'مثال: أحمد دانش'],
  'form.age.label': ['Umur', 'Age', 'العمر'],
  'form.age.ph': ['Contoh: 12', 'Example: 12', 'مثال: 12'],
  'form.age.hint': [
    'Untuk remaja 10 hingga 18 tahun.',
    'For teenagers aged 10 to 18.',
    'للناشئين من 10 إلى 18 سنة.'
  ],
  'form.gender.label': ['Jantina', 'Gender', 'الجنس'],
  'form.gender.ph': ['Pilih…', 'Select…', 'اختر…'],
  'form.gender.male': ['Lelaki', 'Male', 'ذكر'],
  'form.gender.female': ['Perempuan', 'Female', 'أنثى'],
  'form.phone.label': ['No. telefon penjaga', 'Guardian’s phone number', 'رقم هاتف ولي الأمر'],
  'form.phone.ph': ['Contoh: 012-3456789', 'Example: 012-3456789', 'مثال: 012-3456789'],
  'form.phone.hint': [
    'Gunakan nombor WhatsApp yang aktif. Format: 01x-xxxxxxx.',
    'Use an active WhatsApp number. Format: 01x-xxxxxxx.',
    'استخدم رقم واتساب فعّالًا. الصيغة: 01x-xxxxxxx.'
  ],
  'form.guardian.label': ['Nama penjaga', 'Guardian’s name', 'اسم ولي الأمر'],
  'form.guardian.ph': [
    'Nama ibu, bapa atau penjaga',
    'Mother, father or guardian’s name',
    'اسم الأم أو الأب أو ولي الأمر'
  ],
  'form.quran.label': [
    'Adakah peserta lancar membaca Al-Quran?',
    'Can the participant read the Quran fluently?',
    'هل يجيد المشارك قراءة القرآن؟'
  ],
  'form.quran.yes': ['Ya', 'Yes', 'نعم'],
  'form.quran.no': ['Tidak', 'No', 'لا'],
  'form.quran.hint': [
    'Syarat penyertaan: peserta mesti lancar membaca Al-Quran.',
    'Entry requirement: the participant must read the Quran fluently.',
    'شرط المشاركة: أن يجيد المشارك قراءة القرآن.'
  ],
  'form.allergy.label': [
    'Alahan atau keadaan kesihatan',
    'Allergies or medical conditions',
    'الحساسية أو الحالة الصحية'
  ],
  'form.allergy.ph': [
    'Contoh: alah kepada kacang, asma, atau tulis “Tiada”.',
    'Example: peanut allergy, asthma, or write “None”.',
    'مثال: حساسية من الفول السوداني، الربو، أو اكتب «لا يوجد».'
  ],
  'form.allergy.hint': [
    'Maklumat ini digunakan untuk keselamatan dan penyediaan makanan. Tulis “Tiada” jika tiada.',
    'This information is used for safety and meal preparation. Write “None” if there are none.',
    'تُستخدم هذه المعلومات للسلامة وتحضير الطعام. اكتب «لا يوجد» إن لم يكن هناك شيء.'
  ],
  'form.consent': [
    'Saya bersetuju data peribadi peserta digunakan untuk pengurusan KSQ 2026 sahaja, dan saya mengesahkan peserta lancar membaca Al-Quran.',
    'I agree that the participant’s personal data is used for KSQ 2026 management only, and I confirm that the participant reads the Quran fluently.',
    'أوافق على استخدام بيانات المشارك الشخصية لإدارة مخيم 2026 فقط، وأؤكد أن المشارك يجيد قراءة القرآن.'
  ],
  'form.privacyHtml': [
    '<b>Notis privasi:</b> Kami mengumpul nama, umur, jantina, nama dan nombor telefon penjaga, serta maklumat alahan untuk pengurusan program, keselamatan dan komunikasi. Data tidak digunakan untuk pengiklanan dan tidak dikongsi secara terbuka. Hubungi urus setia jika anda ingin membetulkan atau memadam maklumat.',
    '<b>Privacy notice:</b> We collect the participant’s name, age, gender, guardian’s name and phone number, and allergy information for programme management, safety and communication. The data is not used for advertising and is not shared publicly. Contact the secretariat to correct or delete the information.',
    '<b>إشعار الخصوصية:</b> نجمع اسم المشارك وعمره وجنسه واسم ولي الأمر ورقم هاتفه ومعلومات الحساسية لإدارة البرنامج والسلامة والتواصل. لا تُستخدم البيانات للإعلان ولا تُشارك علنًا. تواصل مع الأمانة لتعديل المعلومات أو حذفها.'
  ],
  'form.footHint': [
    'Dengan menghantar borang, anda akan menerima rujukan pendaftaran. Bayaran dibuat selepas itu mengikut arahan yang dipaparkan.',
    'By submitting the form you will receive a registration reference. Payment is made afterwards according to the instructions shown.',
    'بإرسال النموذج ستستلم رقمًا مرجعيًا للتسجيل. ويُدفع المبلغ بعد ذلك وفق التعليمات المعروضة.'
  ],
  'form.submit': ['Hantar pendaftaran', 'Submit registration', 'إرسال التسجيل'],

  /* ---------- Success screen ---------- */
  'success.title': ['Pendaftaran diterima', 'Registration received', 'تم استلام التسجيل'],
  'success.lead': [
    'Simpan nombor rujukan ini. Sila jelaskan bayaran dan hantar bukti melalui WhatsApp.',
    'Keep this reference number. Please pay the fee and send the proof via WhatsApp.',
    'احفظ هذا الرقم المرجعي. يرجى سداد الرسوم وإرسال الإثبات عبر واتساب.'
  ],
  'success.participant': ['Peserta', 'Participant', 'المشارك'],
  'success.methodOnline': ['Online', 'Online', 'إلكتروني'],
  'success.guardian': ['Penjaga', 'Guardian', 'ولي الأمر'],
  'success.fee': ['Yuran', 'Fee', 'الرسوم'],
  'success.time': ['Masa daftar', 'Registered at', 'وقت التسجيل'],
  'success.waitlist': [
    'Senarai tunggu: Kapasiti 40 peserta telah penuh. Pendaftaran anda direkodkan dalam senarai tunggu. Urus setia akan menghubungi jika ada slot terbuka.',
    'Waiting list: All 40 places are taken. Your registration has been recorded on the waiting list. The secretariat will contact you if a place opens up.',
    'قائمة الانتظار: اكتملت المقاعد الأربعون. سُجّل طلبك في قائمة الانتظار. ستتواصل معك الأمانة إذا توفّر مقعد.'
  ],
  'success.paymentTitle': ['Arahan bayaran', 'Payment instructions', 'تعليمات الدفع'],
  'success.paymentDefault': [
    'Sila hubungi urus setia untuk arahan bayaran.',
    'Please contact the secretariat for payment instructions.',
    'يرجى التواصل مع الأمانة للحصول على تعليمات الدفع.'
  ],
  'success.whatsapp': [
    'Hantar bukti bayaran melalui WhatsApp',
    'Send payment proof via WhatsApp',
    'إرسال إثبات الدفع عبر واتساب'
  ],
  'success.print': ['Cetak / simpan rekod', 'Print / save record', 'طباعة / حفظ السجل'],
  'success.another': [
    'Daftar peserta lain',
    'Register another participant',
    'تسجيل مشارك آخر'
  ],

  /* ---------- FAQ ---------- */
  'faq.eyebrow': [
    'Soalan lazim',
    'Frequently asked questions',
    'الأسئلة الشائعة'
  ],
  'faq.title': ['Sebelum anda mendaftar', 'Before you register', 'قبل أن تسجّل'],
  'faq.q1': [
    'Adakah program ini bermalam?',
    'Does this programme involve an overnight stay?',
    'هل يتضمن البرنامج مبيتًا؟'
  ],
  'faq.a1': [
    'Tidak. KSQ 2026 ialah program harian, 8:00 pagi hingga 5:00 petang. Peserta pulang ke rumah setiap hari kecuali perjalanan Hari 3 yang dijangka tiba kira-kira 5:30 petang.',
    'No. KSQ 2026 is a daily programme, 8:00 am to 5:00 pm. Participants go home each day, except on Day 3 when the bus is expected to arrive around 5:30 pm.',
    'لا. مخيم 2026 برنامج نهاري من 8:00 صباحًا إلى 5:00 مساءً. يعود المشاركون إلى بيوتهم كل يوم، باستثناء اليوم الثالث حيث يُتوقع الوصول نحو 5:30 مساءً.'
  ],
  'faq.q2': [
    'Siapa yang layak menyertai?',
    'Who is eligible to join?',
    'من يحق له المشاركة؟'
  ],
  'faq.a2': [
    'Remaja berumur 10 tahun ke atas dan lancar membaca Al-Quran. Kapasiti terhad kepada 40 peserta. Umur minimum/maksimum boleh disemak dengan urus setia.',
    'Teenagers aged 10 and above who read the Quran fluently. Capacity is limited to 40 participants. The minimum/maximum age can be checked with the secretariat.',
    'الناشئون من عمر 10 سنوات فما فوق ممن يجيدون قراءة القرآن. السعة محدودة بـ40 مشاركًا. يمكن التحقق من الحد الأدنى/الأقصى للعمر مع الأمانة.'
  ],
  'faq.q3': [
    'Apakah yang perlu dibawa peserta?',
    'What should participants bring?',
    'ماذا يحضر المشارك؟'
  ],
  'faq.a3': [
    'Al-Quran, alat tulis, botol air, pakaian sopan dan kasut yang selesa. Bawa kad kebenaran ibu bapa (Hari 3) dan ubat peribadi jika perlu.',
    'A Quran, stationery, a water bottle, modest clothing and comfortable shoes. Bring the parental consent card (Day 3) and personal medication if needed.',
    'مصحف، وأدوات كتابية، وقارورة ماء، ولباس محتشم، وحذاء مريح. أحضر بطاقة إذن الوالدين (اليوم 3) والأدوية الشخصية عند الحاجة.'
  ],
  'faq.q4': ['Bagaimana bayaran dibuat?', 'How is payment made?', 'كيف يتم الدفع؟'],
  'faq.a4': [
    'Selepas borang dihantar, skrin kejayaan akan memaparkan arahan bayaran terkini. Hantar bukti melalui WhatsApp urus setia. Slot disahkan selepas bayaran disemak.',
    'After the form is submitted, the success screen shows the latest payment instructions. Send the proof via the secretariat’s WhatsApp. The place is confirmed once the payment is verified.',
    'بعد إرسال النموذج، تعرض شاشة النجاح أحدث تعليمات الدفع. أرسل الإثبات عبر واتساب الأمانة. يُثبَّت المقعد بعد التحقق من الدفع.'
  ],
  'faq.q5': [
    'Bagaimana Hari 3 pada hari Rabu?',
    'What happens on Day 3, a Wednesday?',
    'كيف يكون اليوم الثالث، وهو يوم الأربعاء؟'
  ],
  'faq.a5': [
    'Semua peserta menunaikan solat Zohor berjemaah di Masjid Negeri Shah Alam. Jadual waktu ialah anggaran dan bergantung kepada keadaan trafik.',
    'All participants perform the Zohor prayer in congregation at the Shah Alam State Mosque. The timetable is an estimate and depends on traffic.',
    'يؤدي جميع المشاركين صلاة الظهر جماعة في مسجد الولاية بشاه علم. الجدول تقديري ويعتمد على حركة المرور.'
  ],
  'faq.q6': ['Siapa boleh saya hubungi?', 'Who can I contact?', 'بمن يمكنني التواصل؟'],
  'faq.a6': [
    'Sila hubungi Urusetia KEM SAHABAT QURAN:\n013 693 0292 Ustaz Naudi (WhatsApp)\n018 2150 108 Ustaz Aiman (WhatsApp)',
    'Please contact KEM SAHABAT QURAN Secretariat:\n013 693 0292 Ustaz Naudi (WhatsApp)\n018 2150 108 Ustaz Aiman (WhatsApp)',
    'يرجى التواصل مع أمانة مخيم صاحب القرآن:\n013 693 0292 الأستاذ نودي (واتساب)\n018 2150 108 الأستاذ أيمن (واتساب)'
  ],

  /* ---------- Footer ---------- */
  'footer.aboutTitle': [
    'Kem Sahabat Quran 2026',
    'Kem Sahabat Quran 2026',
    'مخيم صاحب القرآن 2026'
  ],
  'footer.slogan': [
    '“Membina Jiwa, Mengungguli Akhlak dengan Kalamullah.”',
    '“Building Souls, Excelling in Character through the Words of Allah.”',
    '«بناء الأرواح والتفوق في الأخلاق بكلام الله.»'
  ],
  'footer.organiser': [
    'Anjuran Masjid Kampung Sungai Lang Baru, Banting, Selangor.',
    'Organised by Kampung Sungai Lang Baru Mosque, Banting, Selangor.',
    'ينظّمه مسجد كامبونغ سوغاي لانغ بارو، بنتنغ، سيلانغور.'
  ],
  'footer.programTitle': ['Program', 'Programme', 'البرنامج'],
  'footer.programHtml': [
    '14–16 Disember 2026<br>Isnin–Rabu · 8:00 pagi–5:00 petang<br>Hari 1–2: Masjid Kg. Sungai Lang Baru<br>Hari 3: Shah Alam (bas)',
    '14–16 December 2026<br>Monday–Wednesday · 8:00 am–5:00 pm<br>Day 1–2: Kg. Sungai Lang Baru Mosque<br>Day 3: Shah Alam (bus)',
    '14–16 ديسمبر 2026<br>الاثنين–الأربعاء · 8:00 صباحًا–5:00 مساءً<br>اليوم 1–2: مسجد كامبونغ سوغاي لانغ بارو<br>اليوم 3: شاه علم (حافلة)'
  ],
  'footer.contactTitle': ['Hubungi', 'Contact', 'التواصل'],
  'footer.contactDefault': ['Urusetia KEM SAHABAT QURAN', 'KEM SAHABAT QURAN Secretariat', 'أمانة مخيم صاحب القرآن'],
  'footer.whatsapp': ['WhatsApp Urusetia KEM SAHABAT QURAN', 'KEM SAHABAT QURAN Secretariat WhatsApp', 'واتساب أمانة مخيم صاحب القرآن'],
  'footer.register': ['Daftar peserta', 'Register a participant', 'تسجيل مشارك'],
  'footer.copyright': [
    '© 2026 Masjid Kampung Sungai Lang Baru',
    '© 2026 Kampung Sungai Lang Baru Mosque',
    '© 2026 مسجد كامبونغ سوغاي لانغ بارو'
  ],

  /* ---------- Language switcher ---------- */
  'lang.ms': ['Bahasa Melayu', 'Malay', 'الملايوية'],
  'lang.en': ['Bahasa Inggeris', 'English', 'الإنجليزية'],
  'lang.ar': ['Bahasa Arab', 'Arabic', 'العربية'],

  /* ---------- Dynamic text (register.js) ---------- */
  'time.ended': ['Tamat', 'Ended', 'انتهى'],
  'js.programStarts': [
    'Program bermula dalam {time}.',
    'The programme starts in {time}.',
    'يبدأ البرنامج بعد {time}.'
  ],
  'js.programDay': [
    'Hari {day} daripada 3 sedang berlangsung. Program berakhir dalam {time}.',
    'Day {day} of 3 is in progress. The programme ends in {time}.',
    'اليوم {day} من 3 جارٍ. ينتهي البرنامج بعد {time}.'
  ],
  'js.programEnded': [
    'Program telah tamat pada {date}.',
    'The programme ended on {date}.',
    'انتهى البرنامج في {date}.'
  ],
  'js.programNoDate': [
    'Tarikh program belum ditetapkan.',
    'The programme date has not been set.',
    'لم يُحدَّد تاريخ البرنامج بعد.'
  ],
  'js.closeAt': [
    'Pendaftaran ditutup pada {date}.',
    'Registration closes on {date}.',
    'يُغلق التسجيل في {date}.'
  ],
  'js.closedByAdmin': [
    'Pendaftaran ditutup oleh urus setia.',
    'Registration was closed by the secretariat.',
    'أُغلق التسجيل من قبل الأمانة.'
  ],
  'js.closed': ['Pendaftaran telah ditutup.', 'Registration is closed.', 'التسجيل مغلق.'],
  'js.contactWhatsapp': [
    'WhatsApp urus setia: {phone}.',
    'Secretariat WhatsApp: {phone}.',
    'واتساب الأمانة: {phone}.'
  ],
  'js.contactDefault': [
    'Urusetia KEM SAHABAT QURAN:\n013 693 0292 Ustaz Naudi (WhatsApp)\n018 2150 108 Ustaz Aiman (WhatsApp)',
    'KEM SAHABAT QURAN Secretariat:\n013 693 0292 Ustaz Naudi (WhatsApp)\n018 2150 108 Ustaz Aiman (WhatsApp)',
    'أمانة مخيم صاحب القرآن:\n013 693 0292 الأستاذ نودي (واتساب)\n018 2150 108 الأستاذ أيمن (واتساب)'
  ],
  'js.footerContact': [
    'Urusetia KEM SAHABAT QURAN · {phone}',
    'KEM SAHABAT QURAN Secretariat · {phone}',
    'أمانة مخيم صاحب القرآن · {phone}'
  ],
  'js.footerContactDefault': [
    'Urusetia KEM SAHABAT QURAN:\n013 693 0292 Ustaz Naudi\n018 2150 108 Ustaz Aiman',
    'KEM SAHABAT QURAN Secretariat:\n013 693 0292 Ustaz Naudi\n018 2150 108 Ustaz Aiman',
    'أمانة مخيم صاحب القرآن:\n013 693 0292 الأستاذ نودي\n018 2150 108 الأستاذ أيمن'
  ],
  'js.noticeAttention': ['Perhatian: ', 'Attention: ', 'تنبيه: '],
  'js.notOpen': [
    'Pendaftaran online belum dibuka. Sila hubungi urus setia masjid untuk mendaftar.',
    'Online registration is not open yet. Please contact the mosque secretariat to register.',
    'التسجيل الإلكتروني غير مفتوح بعد. يرجى التواصل مع أمانة المسجد للتسجيل.'
  ],
  'js.sourceExternal': [
    'Pendaftaran untuk program ini dikendalikan melalui pautan rasmi urus setia. Sila hubungi urus setia untuk mendaftar.',
    'Registration for this programme is handled through the secretariat’s official link. Please contact the secretariat to register.',
    'تتم المشاركة في هذا البرنامج عبر الرابط الرسمي للأمانة. يرجى التواصل مع الأمانة للتسجيل.'
  ],
  'js.formExternal': [
    'Pendaftaran melalui urus setia',
    'Register via the secretariat',
    'التسجيل عبر الأمانة'
  ],
  'js.closedThanks': [
    'Pendaftaran telah ditutup. Terima kasih atas minat anda.',
    'Registration is closed. Thank you for your interest.',
    'التسجيل مغلق. شكرًا لاهتمامك.'
  ],
  'js.formClosed': ['Pendaftaran ditutup', 'Registration closed', 'التسجيل مغلق'],
  'js.fullWaitlist': [
    'Slot telah penuh. Anda masih boleh mendaftar untuk senarai tunggu; urus setia akan menghubungi jika ada slot terbuka.',
    'All places are taken. You can still register for the waiting list; the secretariat will contact you if a place opens up.',
    'اكتملت المقاعد. يمكنك التسجيل في قائمة الانتظار؛ وستتواصل معك الأمانة إذا توفّر مقعد.'
  ],
  'js.statusOpen': ['Pendaftaran dibuka', 'Registration open', 'التسجيل مفتوح'],
  'js.statusExternal': [
    'Pendaftaran melalui pautan rasmi',
    'Registration via the official link',
    'التسجيل عبر الرابط الرسمي'
  ],
  'js.statusClosed': ['Pendaftaran ditutup', 'Registration closed', 'التسجيل مغلق'],
  'js.statusFull': [
    'Slot penuh · senarai tunggu dibuka',
    'Places full · waiting list open',
    'المقاعد ممتلئة · قائمة الانتظار مفتوحة'
  ],
  'js.slotNote': [
    '{ok} disahkan · {wait} menunggu',
    '{ok} confirmed · {wait} pending',
    '{ok} مؤكَّد · {wait} قيد الانتظار'
  ],
  'js.slotNoteWaitlist': [
    ' · {n} senarai tunggu',
    ' · {n} on the waiting list',
    ' · {n} في قائمة الانتظار'
  ],
  'js.heroQuotaExternal': [
    'pendaftaran melalui pautan rasmi urus setia',
    'registration through the secretariat’s official link',
    'التسجيل عبر الرابط الرسمي للأمانة'
  ],
  'js.heroQuotaClosed': ['pendaftaran telah ditutup', 'registration is closed', 'التسجيل مغلق'],
  'js.heroQuotaFull': [
    'slot penuh · senarai tunggu dibuka',
    'places full · waiting list open',
    'المقاعد ممتلئة · قائمة الانتظار مفتوحة'
  ],
  'js.heroQuotaOpen': [
    'daripada {n} slot masih terbuka',
    'of {n} places still open',
    'من أصل {n} مقعدًا لا تزال متاحة'
  ],
  'js.onlineFee': [
    'Daftar online: {fee}',
    'Online registration: {fee}',
    'التسجيل الإلكتروني: {fee}'
  ],
  'js.ageHint': [
    'Untuk remaja {min} hingga {max} tahun.',
    'For teenagers aged {min} to {max}.',
    'للناشئين من {min} إلى {max} سنة.'
  ],
  'js.updated': ['Dikemas kini {time}', 'Updated {time}', 'حُدِّث {time}'],
  'js.updateFailed': ['Gagal mengemas kini', 'Update failed', 'فشل التحديث'],
  'js.statsUnavailable': [
    'Maklumat slot tidak dapat dikemas kini. Sila muat semula halaman atau cuba sebentar lagi.',
    'Place information could not be updated. Please reload the page or try again shortly.',
    'تعذّر تحديث معلومات المقاعد. يرجى إعادة تحميل الصفحة أو المحاولة بعد قليل.'
  ],
  'js.waitlistOpen': [
    'Senarai tunggu: kini terdapat {n} slot terbuka. Urus setia akan menghubungi anda untuk pengesahan.',
    'Waiting list: {n} places are now open. The secretariat will contact you for confirmation.',
    'قائمة الانتظار: توفّر {n} مقعدًا الآن. ستتواصل معك الأمانة للتأكيد.'
  ],
  'js.payDefault': [
    'Sila hubungi urus setia masjid untuk arahan bayaran. Jumlah yuran: {fee}.',
    'Please contact the mosque secretariat for payment instructions. Fee amount: {fee}.',
    'يرجى التواصل مع أمانة المسجد للحصول على تعليمات الدفع. مقدار الرسوم: {fee}.'
  ],
  'js.waNote': [
    'Butang di atas akan membuka WhatsApp urus setia dengan mesej siap. Sila lampirkan gambar bukti bayaran.',
    'The button above opens the secretariat’s WhatsApp with a ready-made message. Please attach a photo of the payment proof.',
    'يفتح الزر أعلاه واتساب الأمانة برسالة جاهزة. يرجى إرفاق صورة إثبات الدفع.'
  ],
  'js.waNoNumber': [
    'Nombor WhatsApp urus setia belum ditetapkan. Sila hubungi urus setia masjid untuk menghantar bukti bayaran.',
    'The secretariat’s WhatsApp number has not been set. Please contact the mosque secretariat to send the payment proof.',
    'لم يُحدَّد رقم واتساب الأمانة بعد. يرجى التواصل مع أمانة المسجد لإرسال إثبات الدفع.'
  ],
  'js.submitFailed': [
    'Pendaftaran tidak berjaya. Sila cuba lagi.',
    'Registration failed. Please try again.',
    'لم ينجح التسجيل. يرجى المحاولة مرة أخرى.'
  ],
  'js.offline': [
    'Sambungan internet terputus. Data mungkin tidak terkini.',
    'The internet connection was lost. Data may be out of date.',
    'انقطع الاتصال بالإنترنت. قد تكون البيانات غير محدّثة.'
  ],
  'js.waiting': [
    'Menunggu sambungan sistem',
    'Waiting for the system connection',
    'في انتظار اتصال النظام'
  ],
  'js.notOpenShort': [
    'Pendaftaran belum dibuka',
    'Registration not open yet',
    'التسجيل غير مفتوح بعد'
  ],
  'js.sending': [
    'Menghantar pendaftaran…',
    'Submitting registration…',
    'جارٍ إرسال التسجيل…'
  ],

  /* ---------- Status labels written by the server ---------- */
  'status.Disahkan': ['Disahkan', 'Confirmed', 'مؤكَّد'],
  'status.Menunggu': ['Menunggu', 'Pending', 'قيد الانتظار'],
  'status.SenaraiTunggu': ['Senarai Tunggu', 'Waiting list', 'قائمة الانتظار'],
  'status.Batal': ['Batal', 'Cancelled', 'ملغى'],
  'status.Belum': ['Belum', 'Not yet', 'لم يتم'],
  'status.Sudah': ['Sudah', 'Paid', 'مدفوع'],
  'status.Dikecualikan': ['Dikecualikan', 'Exempted', 'معفى'],
  'status.Lewat': ['Lewat', 'Overdue', 'متأخر'],
  'status.HariIni': ['Hari ini', 'Today', 'اليوم'],
  'status.AkanDatang': ['Akan datang', 'Upcoming', 'قادم'],
  'status.Selesai': ['Selesai', 'Completed', 'مكتمل'],
  'status.Sedang': ['Sedang', 'In progress', 'قيد التنفيذ'],

  /* ---------- Form validation ---------- */
  'val.name': [
    'Sila masukkan nama penuh peserta (2 hingga 80 aksara).',
    'Please enter the participant’s full name (2 to 80 characters).',
    'يرجى إدخال الاسم الكامل للمشارك (من 2 إلى 80 حرفًا).'
  ],
  'val.age': [
    'Sila masukkan umur antara {min} dan {max} tahun.',
    'Please enter an age between {min} and {max}.',
    'يرجى إدخال عمر بين {min} و{max} سنة.'
  ],
  'val.gender': [
    'Sila pilih jantina peserta.',
    'Please select the participant’s gender.',
    'يرجى اختيار جنس المشارك.'
  ],
  'val.phone': [
    'Sila masukkan no. telefon penjaga yang sah, contoh 012-3456789.',
    'Please enter a valid guardian phone number, e.g. 012-3456789.',
    'يرجى إدخال رقم هاتف صحيح لولي الأمر، مثال 012-3456789.'
  ],
  'val.guardian': [
    'Sila masukkan nama penjaga (2 hingga 80 aksara).',
    'Please enter the guardian’s name (2 to 80 characters).',
    'يرجى إدخال اسم ولي الأمر (من 2 إلى 80 حرفًا).'
  ],
  'val.quranNo': [
    'Program ini memerlukan peserta yang lancar membaca Al-Quran.',
    'This programme requires participants who read the Quran fluently.',
    'يتطلب هذا البرنامج مشاركين يجيدون قراءة القرآن.'
  ],
  'val.quranConfirm': [
    'Sila sahkan bahawa peserta lancar membaca Al-Quran.',
    'Please confirm that the participant reads the Quran fluently.',
    'يرجى تأكيد أن المشارك يجيد قراءة القرآن.'
  ],
  'val.allergy': [
    'Catatan alahan terlalu panjang (maksimum 300 aksara).',
    'The allergy note is too long (maximum 300 characters).',
    'ملاحظة الحساسية طويلة جدًا (الحد الأقصى 300 حرف).'
  ],
  'val.consent': [
    'Sila tandakan persetujuan penggunaan data untuk pengurusan program.',
    'Please tick the consent for data use for programme management.',
    'يرجى تحديد الموافقة على استخدام البيانات لإدارة البرنامج.'
  ],

  /* ---------- Printed registration record ---------- */
  'rc.title': [
    'Rekod Pendaftaran Peserta',
    'Participant Registration Record',
    'سجل تسجيل المشارك'
  ],
  'rc.ref': ['No. rujukan', 'Reference no.', 'الرقم المرجعي'],
  'rc.status': ['Status', 'Status', 'الحالة'],
  'rc.name': ['Nama peserta', 'Participant name', 'اسم المشارك'],
  'rc.age': ['Umur', 'Age', 'العمر'],
  'rc.gender': ['Jantina', 'Gender', 'الجنس'],
  'rc.guardian': ['Penjaga', 'Guardian', 'ولي الأمر'],
  'rc.phone': ['No. telefon penjaga', 'Guardian phone no.', 'هاتف ولي الأمر'],
  'rc.fee': ['Yuran', 'Fee', 'الرسوم'],
  'rc.time': ['Masa pendaftaran', 'Registration time', 'وقت التسجيل'],
  'rc.org': [
    'Masjid Kampung Sungai Lang Baru, Banting, Selangor',
    'Kampung Sungai Lang Baru Mosque, Banting, Selangor',
    'مسجد كامبونغ سوغاي لانغ بارو، بنتنغ، سيلانغور'
  ],
  'rc.period': [
    '14–16 Disember 2026 · Program harian',
    '14–16 December 2026 · Daily programme',
    '14–16 ديسمبر 2026 · برنامج نهاري'
  ],
  'rc.note': [
    'Simpan rekod ini. Dokumen ini ialah rekod pendaftaran yang dijana oleh sistem, bukan resit bayaran rasmi. Pengesahan slot dibuat selepas bayaran disemak oleh urus setia.',
    'Keep this record. This document is a registration record generated by the system, not an official payment receipt. The place is confirmed after the payment is verified by the secretariat.',
    'احفظ هذا السجل. هذا المستند سجل تسجيل أنشأه النظام، وليس إيصال دفع رسميًا. يُثبَّت المقعد بعد التحقق من الدفع من قبل الأمانة.'
  ]
};

/**
 * Time cells repeat across the three days, so they are mapped separately from
 * the Bahasa Melayu text that appears in the table.
 */
export const TIMES = {
  '8:00–8:30 pg': ['8:00–8:30 pg', '8:00–8:30 am', '8:00–8:30 ص'],
  '8:30–9:00 pg': ['8:30–9:00 pg', '8:30–9:00 am', '8:30–9:00 ص'],
  '8:30–10:00 pg': ['8:30–10:00 pg', '8:30–10:00 am', '8:30–10:00 ص'],
  '9:00–10:30 pg': ['9:00–10:30 pg', '9:00–10:30 am', '9:00–10:30 ص'],
  '10:00–10:30 pg': ['10:00–10:30 pg', '10:00–10:30 am', '10:00–10:30 ص'],
  '10:30–11:00 pg': ['10:30–11:00 pg', '10:30–11:00 am', '10:30–11:00 ص'],
  '11:00 pg–12:30 tgh': ['11:00 pg–12:30 tgh', '11:00 am–12:30 pm', '11:00 ص–12:30 م'],
  '10:30 pg–12:30 tgh': ['10:30 pg–12:30 tgh', '10:30 am–12:30 pm', '10:30 ص–12:30 م'],
  '11:15 pg–12:30 tgh': ['11:15 pg–12:30 tgh', '11:15 am–12:30 pm', '11:15 ص–12:30 م'],
  '12:30–1:00 tgh': ['12:30–1:00 tgh', '12:30–1:00 pm', '12:30–1:00 م'],
  '12:30–2:00 ptg': ['12:30–2:00 ptg', '12:30–2:00 pm', '12:30–2:00 م'],
  '1:00–2:00 ptg': ['1:00–2:00 ptg', '1:00–2:00 pm', '1:00–2:00 م'],
  '2:00–2:45 ptg': ['2:00–2:45 ptg', '2:00–2:45 pm', '2:00–2:45 م'],
  '2:00–3:30 ptg': ['2:00–3:30 ptg', '2:00–3:30 pm', '2:00–3:30 م'],
  '3:30–4:00 ptg': ['3:30–4:00 ptg', '3:30–4:00 pm', '3:30–4:00 م'],
  '4:00–4:30 ptg': ['4:00–4:30 ptg', '4:00–4:30 pm', '4:00–4:30 م'],
  '4:30–5:00 ptg': ['4:30–5:00 ptg', '4:30–5:00 pm', '4:30–5:00 م'],
  '7:30–8:00 pg': ['7:30–8:00 pg', '7:30–8:00 am', '7:30–8:00 ص'],
  '8:00 pg': ['8:00 pg', '8:00 am', '8:00 ص'],
  '9:30–11:00 pg': ['9:30–11:00 pg', '9:30–11:00 am', '9:30–11:00 ص'],
  '2:45–4:00 ptg': ['2:45–4:00 ptg', '2:45–4:00 pm', '2:45–4:00 م'],
  '4:00–4:15 ptg': ['4:00–4:15 ptg', '4:00–4:15 pm', '4:00–4:15 م'],
  '4:15 ptg': ['4:15 ptg', '4:15 pm', '4:15 م']
};

/**
 * Arabic counts five different ways. A countdown shows "28 يومًا", not
 * "28 أيام", so the unit word is chosen from the number.
 * Order: zero/one, two, few (3–10), many (11–99).
 */
export const ARABIC_UNITS = {
  days: ['يوم', 'يومان', 'أيام', 'يومًا'],
  hours: ['ساعة', 'ساعتان', 'ساعات', 'ساعةً'],
  minutes: ['دقيقة', 'دقيقتان', 'دقائق', 'دقيقةً'],
  seconds: ['ثانية', 'ثانيتان', 'ثوانٍ', 'ثانيةً']
};

const AR_PLURAL = new Intl.PluralRules('ar');

export function arabicUnit(unit, count) {
  const forms = ARABIC_UNITS[unit];
  if (!forms) return '';
  const number = Number(count) || 0;
  const rule = AR_PLURAL.select(number);
  if (rule === 'two') return forms[1];
  if (rule === 'few') return forms[2];
  if (rule === 'many') return forms[3];
  return forms[0];
}
