// Static bilingual content for marketing pages. Keep claims general — no medical promises.
export const L = (lang, o) => (o && (o[lang] || o.en)) || "";

export const articles = [
  { slug: "daily-ayurveda-routine", art: "sun", tag: { en: "Ayurveda", hi: "आयुर्वेद" },
    title: { en: "A simple daily routine inspired by Ayurveda", hi: "आयुर्वेद से प्रेरित एक आसान दिनचर्या" },
    sum: { en: "Wake early, warm water, light movement and regular meals — small habits that many people follow.", hi: "जल्दी उठना, गुनगुना पानी, हल्की कसरत और समय पर भोजन — छोटी आदतें जो कई लोग अपनाते हैं।" },
    body: { en: ["Ayurveda places a lot of importance on routine (dinacharya). Many people start the day with a glass of warm water, some light stretching and a regular breakfast time.", "Regular sleep and meal timings, plenty of water and seasonal fresh food are common themes.", "This article is general information only and is not medical advice. Consult a qualified practitioner for personal guidance."],
            hi: ["आयुर्वेद में दिनचर्या का बहुत महत्व है। कई लोग दिन की शुरुआत गुनगुने पानी, हल्के स्ट्रेचिंग और तय समय के नाश्ते से करते हैं।", "नियमित नींद और भोजन का समय, भरपूर पानी और मौसमी ताज़ा भोजन आम सुझाव हैं।", "यह लेख केवल सामान्य जानकारी है, चिकित्सकीय सलाह नहीं। निजी सलाह के लिए योग्य चिकित्सक से मिलें।"] } },
  { slug: "tulsi-giloy-basics", art: "ayurvedic-care", tag: { en: "Herbs", hi: "जड़ी-बूटी" },
    title: { en: "Tulsi, giloy and amla: what are they traditionally used for?", hi: "तुलसी, गिलोय और आंवला: पारंपरिक उपयोग क्या हैं?" },
    sum: { en: "A quick, plain-language look at three well-known Indian herbs.", hi: "तीन जानी-मानी भारतीय जड़ी-बूटियों पर सरल भाषा में नज़र।" },
    body: { en: ["Tulsi (holy basil), giloy and amla are widely used in Indian households, often as teas, juices or powders.", "Amla is known as a natural source of vitamin C. Tulsi is commonly taken as a tea. Giloy is traditionally used in juice or tablet form.", "Always follow the label and speak to a practitioner if you are pregnant, on medication or have a health condition."],
            hi: ["तुलसी, गिलोय और आंवला भारतीय घरों में आम हैं — चाय, जूस या चूर्ण के रूप में।", "आंवला विटामिन C का प्राकृतिक स्रोत माना जाता है। तुलसी अक्सर चाय में ली जाती है। गिलोय पारंपरिक रूप से जूस या टैबलेट में।", "लेबल का पालन करें; गर्भावस्था, दवा या किसी बीमारी में चिकित्सक से सलाह लें।"] } },
  { slug: "homeopathy-basics", art: "homeopathy", tag: { en: "Homeopathy", hi: "होम्योपैथी" },
    title: { en: "Homeopathy basics: dilutions, mother tinctures and biochemics", hi: "होम्योपैथी की बुनियादी बातें: डाइल्यूशन, मदर टिंचर, बायोकेमिक" },
    sum: { en: "What the labels like 30C, Q and 6X mean.", hi: "30C, Q और 6X जैसे लेबल का मतलब।" },
    body: { en: ["Homeopathic medicines are sold as dilutions (like 30C or 200C), mother tinctures (marked Q) and biochemic tissue salts (like 6X).", "The number tells you the dilution strength. The right choice depends on the person, so consult a registered homeopath.", "This is general information, not a recommendation."],
            hi: ["होम्योपैथिक दवाएं डाइल्यूशन (जैसे 30C, 200C), मदर टिंचर (Q) और बायोकेमिक टिशू सॉल्ट (जैसे 6X) में मिलती हैं।", "संख्या डाइल्यूशन की ताकत बताती है। सही चुनाव व्यक्ति पर निर्भर है, इसलिए पंजीकृत होम्योपैथ से सलाह लें।", "यह सामान्य जानकारी है, सिफारिश नहीं।"] } },
  { slug: "home-health-devices", art: "devices", tag: { en: "Devices", hi: "डिवाइस" },
    title: { en: "Using a BP monitor and pulse oximeter at home", hi: "घर पर बीपी मॉनिटर और पल्स ऑक्सीमीटर का उपयोग" },
    sum: { en: "Tips for getting steady readings.", hi: "सही रीडिंग पाने के आसान तरीके।" },
    body: { en: ["Sit calmly for five minutes before measuring blood pressure, keep your arm at heart level and avoid talking.", "For a pulse oximeter, keep your hand warm and still, and remove nail polish.", "Home readings do not replace a doctor's advice."],
            hi: ["बीपी नापने से पहले पांच मिनट शांत बैठें, हाथ दिल के स्तर पर रखें और बात न करें।", "पल्स ऑक्सीमीटर के लिए हाथ गर्म और स्थिर रखें, नेल पॉलिश हटाएं।", "घर की रीडिंग डॉक्टर की सलाह का विकल्प नहीं है।"] } },
];

export const homeFaq = [
  { q: { en: "Where do you deliver?", hi: "आप कहाँ डिलीवरी करते हैं?" }, a: { en: "Right now we deliver across Delhi NCR (Delhi, Noida, Gurugram, Ghaziabad, Faridabad). Enter your pincode on any product page to check.", hi: "अभी हम पूरे दिल्ली NCR (दिल्ली, नोएडा, गुरुग्राम, गाज़ियाबाद, फरीदाबाद) में डिलीवरी करते हैं। किसी भी प्रोडक्ट पेज पर पिनकोड डालकर जांचें।" } },
  { q: { en: "Do you sell prescription medicines?", hi: "क्या आप प्रिस्क्रिप्शन दवाएं बेचते हैं?" }, a: { en: "Not yet. Veda currently offers Ayurvedic, Homeopathy and healthcare products that do not need a prescription.", hi: "अभी नहीं। वेद अभी आयुर्वेदिक, होम्योपैथी और हेल्थकेयर प्रोडक्ट देता है जिनके लिए प्रिस्क्रिप्शन ज़रूरी नहीं।" } },
  { q: { en: "How can I pay?", hi: "पेमेंट कैसे करें?" }, a: { en: "UPI, cards and netbanking through Razorpay — launching with checkout.", hi: "Razorpay के ज़रिए UPI, कार्ड और नेटबैंकिंग — चेकआउट के साथ शुरू होगा।" } },
  { q: { en: "How is delivery charged?", hi: "डिलीवरी चार्ज कैसे लगता है?" }, a: { en: "Shipping is calculated from our courier partners' rates for your pincode and shown at checkout.", hi: "शिपिंग आपके पिनकोड के लिए कूरियर पार्टनर के रेट से तय होती है और चेकआउट पर दिखती है।" } },
];

export const helpTopics = [
  { art: "box", t: { en: "Orders & delivery", hi: "ऑर्डर और डिलीवरी" }, d: { en: "Tracking, delivery areas, timelines.", hi: "ट्रैकिंग, डिलीवरी क्षेत्र, समय।" } },
  { art: "card", t: { en: "Payments & refunds", hi: "पेमेंट और रिफंड" }, d: { en: "UPI, cards, failed payments.", hi: "UPI, कार्ड, फेल पेमेंट।" } },
  { art: "return", t: { en: "Returns", hi: "रिटर्न" }, d: { en: "How to return or replace an item.", hi: "आइटम वापस या बदलने का तरीका।" }, href: "/return-policy" },
  { art: "user", t: { en: "Account & login", hi: "अकाउंट और लॉगिन" }, d: { en: "OTP login, profile.", hi: "OTP लॉगिन, प्रोफाइल।" }, href: "/account" },
  { art: "tag", t: { en: "Offers & coupons", hi: "ऑफर और कूपन" }, d: { en: "How to apply a coupon.", hi: "कूपन कैसे लगाएं।" }, href: "/offers" },
  { art: "lock", t: { en: "Privacy & terms", hi: "प्राइवेसी और नियम" }, d: { en: "How we handle your data.", hi: "हम आपका डेटा कैसे संभालते हैं।" }, href: "/privacy" },
];

// Coupons are managed in Phase 3 (admin). Leave empty until real offers exist.
export const coupons = [];
