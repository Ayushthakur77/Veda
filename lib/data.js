// SAMPLE DATA — replace with database (see schema.sql) in Phase 1.
export const categories = [
  { slug: "ayurvedic-care", emoji: "🌿", en: "Ayurvedic Care", hi: "आयुर्वेदिक केयर" },
  { slug: "homeopathy", emoji: "💧", en: "Homeopathy", hi: "होम्योपैथी" },
  { slug: "immunity", emoji: "🛡️", en: "Immunity & Wellness", hi: "इम्यूनिटी और वेलनेस" },
  { slug: "digestion", emoji: "🍃", en: "Digestive Care", hi: "पाचन देखभाल" },
  { slug: "skin-hair", emoji: "✨", en: "Skin & Hair", hi: "त्वचा और बाल" },
  { slug: "herbal-juices", emoji: "🥤", en: "Herbal Juices", hi: "हर्बल जूस" },
  { slug: "devices", emoji: "🩺", en: "Healthcare Devices", hi: "हेल्थकेयर डिवाइस" },
  { slug: "mother-baby", emoji: "🍼", en: "Mother & Baby", hi: "माँ और बच्चा" },
];

const p = (slug, cat, type, en, hi, size, mrp, price, descEn, descHi) => ({
  slug, category: cat, type, name_en: en, name_hi: hi, pack: size, mrp, price,
  desc_en: descEn, desc_hi: descHi,
});

export const products = [
  p("ashwagandha-capsules", "immunity", "ayurvedic", "Ashwagandha Capsules", "अश्वगंधा कैप्सूल", "60 capsules", 499, 399,
    "Traditional Ayurvedic herb capsules for daily wellness support.", "दैनिक वेलनेस के लिए पारंपरिक आयुर्वेदिक जड़ी-बूटी कैप्सूल।"),
  p("triphala-churna", "digestion", "ayurvedic", "Triphala Churna", "त्रिफला चूर्ण", "200 g", 220, 175,
    "Classic Ayurvedic powder blend of three fruits, used traditionally for digestive wellness.", "तीन फलों का पारंपरिक आयुर्वेदिक चूर्ण, पाचन स्वास्थ्य के लिए।"),
  p("giloy-juice", "herbal-juices", "ayurvedic", "Giloy Juice", "गिलोय जूस", "1 L", 350, 279,
    "Herbal juice made from giloy stem, taken as part of daily wellness routines.", "गिलोय के तने से बना हर्बल जूस।"),
  p("amla-juice", "herbal-juices", "ayurvedic", "Amla Juice", "आंवला जूस", "1 L", 320, 255,
    "Natural amla juice, rich in vitamin C.", "विटामिन C से भरपूर प्राकृतिक आंवला जूस।"),
  p("chyawanprash", "immunity", "ayurvedic", "Chyawanprash", "च्यवनप्राश", "500 g", 420, 345,
    "Traditional Ayurvedic herbal jam made with amla and herbs.", "आंवला और जड़ी-बूटियों से बना पारंपरिक आयुर्वेदिक अवलेह।"),
  p("neem-tablets", "skin-hair", "ayurvedic", "Neem Tablets", "नीम टैबलेट", "60 tablets", 240, 190,
    "Neem leaf extract tablets for skin wellness support.", "त्वचा की देखभाल के लिए नीम पत्ता एक्सट्रैक्ट टैबलेट।"),
  p("tulsi-drops", "immunity", "ayurvedic", "Tulsi Drops", "तुलसी ड्रॉप्स", "30 ml", 180, 149,
    "Concentrated tulsi (holy basil) drops, add to tea or warm water.", "तुलसी के सांद्र ड्रॉप्स, चाय या गुनगुने पानी में डालें।"),
  p("isabgol-husk", "digestion", "ayurvedic", "Isabgol Husk", "इसबगोल भूसी", "200 g", 190, 155,
    "Psyllium husk, a natural source of dietary fibre.", "प्राकृतिक आहार फाइबर का स्रोत, इसबगोल की भूसी।"),
  p("arnica-30", "homeopathy", "homeopathy", "Arnica Montana 30C", "आर्निका मोंटाना 30C", "30 ml", 150, 130,
    "Homeopathic dilution, a commonly used remedy in homeopathy.", "होम्योपैथी में आमतौर पर प्रयुक्त डाइल्यूशन।"),
  p("mother-tincture-tulsi", "homeopathy", "homeopathy", "Ocimum Sanctum Mother Tincture", "ओसिमम सैंक्टम मदर टिंचर", "30 ml", 210, 180,
    "Homeopathic mother tincture of holy basil.", "तुलसी का होम्योपैथिक मदर टिंचर।"),
  p("biochemic-calcarea", "homeopathy", "homeopathy", "Biochemic Tablets Calcarea Phos 6X", "बायोकेमिक टैबलेट कैल्केरिया फॉस 6X", "25 g", 95, 80,
    "Biochemic tissue salt tablets used in homeopathic practice.", "होम्योपैथिक पद्धति में प्रयुक्त बायोकेमिक टिशू सॉल्ट टैबलेट।"),
  p("aloe-vera-gel", "skin-hair", "ayurvedic", "Aloe Vera Gel", "एलोवेरा जेल", "150 g", 249, 199,
    "Soothing aloe vera gel for skin and hair.", "त्वचा और बालों के लिए सुखदायक एलोवेरा जेल।"),
  p("bhringraj-hair-oil", "skin-hair", "ayurvedic", "Bhringraj Hair Oil", "भृंगराज हेयर ऑयल", "200 ml", 280, 225,
    "Traditional hair oil with bhringraj and coconut oil base.", "भृंगराज और नारियल तेल आधारित पारंपरिक हेयर ऑयल।"),
  p("digital-bp-monitor", "devices", "healthcare", "Digital BP Monitor", "डिजिटल बीपी मॉनिटर", "1 unit", 1799, 1399,
    "Automatic upper-arm blood pressure monitor with memory.", "मेमोरी के साथ ऑटोमैटिक अपर-आर्म ब्लड प्रेशर मॉनिटर।"),
  p("pulse-oximeter", "devices", "healthcare", "Pulse Oximeter", "पल्स ऑक्सीमीटर", "1 unit", 1299, 899,
    "Fingertip pulse oximeter with clear OLED display.", "साफ OLED डिस्प्ले वाला फिंगरटिप पल्स ऑक्सीमीटर।"),
  p("baby-massage-oil", "mother-baby", "ayurvedic", "Baby Massage Oil", "बेबी मसाज ऑयल", "200 ml", 260, 215,
    "Gentle herbal massage oil for babies.", "शिशुओं के लिए हल्का हर्बल मसाज ऑयल।"),
  p("shatavari-powder", "mother-baby", "ayurvedic", "Shatavari Powder", "शतावरी चूर्ण", "100 g", 330, 270,
    "Traditional Ayurvedic herb powder for women's wellness.", "महिलाओं के स्वास्थ्य के लिए पारंपरिक आयुर्वेदिक जड़ी-बूटी चूर्ण।"),
];

export const banners = [
  { id: 1, en: "Welcome to Veda", hi: "वेद में आपका स्वागत है", subEn: "Authentic Ayurvedic & Homeopathic care, delivered across Delhi NCR.", subHi: "प्रामाणिक आयुर्वेदिक और होम्योपैथिक देखभाल, पूरे दिल्ली NCR में डिलीवरी।", href: "/category/ayurvedic-care" },
  { id: 2, en: "Boost your daily wellness", hi: "रोज़ की सेहत बढ़ाएं", subEn: "Immunity essentials at honest prices.", subHi: "इम्यूनिटी के ज़रूरी उत्पाद, सही दामों पर।", href: "/category/immunity" },
  { id: 3, en: "Homeopathy, made easy", hi: "होम्योपैथी, अब आसान", subEn: "Dilutions, mother tinctures and biochemic salts.", subHi: "डाइल्यूशन, मदर टिंचर और बायोकेमिक सॉल्ट।", href: "/category/homeopathy" },
];

export const dealSlugs = ["chyawanprash", "giloy-juice", "triphala-churna", "arnica-30"];

export const getProduct = (slug) => products.find((x) => x.slug === slug);
export const getCategory = (slug) => categories.find((c) => c.slug === slug);
