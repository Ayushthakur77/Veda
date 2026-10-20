export const DEAL_DISCOUNT = 0.1; // sample-mode deal discount
export const pn = (lang, x) => (lang === "hi" ? x.name_hi : x.name_en);
export const pd = (lang, x) => (lang === "hi" ? x.desc_hi : x.desc_en);
export const cn = (lang, c) => (lang === "hi" ? c.hi : c.en);
export const inr = (n) => "\u20B9" + n.toLocaleString("en-IN");
export const dealPrice = (p) => (p.dealPrice != null ? p.dealPrice : Math.round(p.price * (1 - DEAL_DISCOUNT)));
