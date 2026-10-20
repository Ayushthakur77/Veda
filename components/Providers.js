"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { dict } from "../lib/i18n";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const load = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

export default function Providers({ children }) {
  const [lang, setLang] = useState("en");
  const [cart, setCart] = useState({}); // { slug: qty }
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLang(load("veda_lang", "en"));
    setCart(load("veda_cart", {}));
    setReady(true);
  }, []);

  useEffect(() => { if (ready) { save("veda_lang", lang); document.documentElement.lang = lang; } }, [lang, ready]);
  useEffect(() => { if (ready) save("veda_cart", cart); }, [cart, ready]);

  const t = useCallback((k) => dict[lang][k] ?? dict.en[k] ?? k, [lang]);
  const add = (slug, n = 1) => setCart((c) => ({ ...c, [slug]: (c[slug] || 0) + n }));
  const setQty = (slug, q) => setCart((c) => {
    const next = { ...c };
    if (q <= 0) delete next[slug]; else next[slug] = Math.min(q, 20);
    return next;
  });
  const count = Object.values(cart).reduce((a, b) => a + b, 0);

  return <Ctx.Provider value={{ lang, setLang, t, cart, add, setQty, count, ready }}>{children}</Ctx.Provider>;
}
