// Delhi NCR serviceability (launch area): Delhi 110xxx, Faridabad 121xxx, Gurugram 122xxx, Ghaziabad 2010xx, Noida 201301-201310.
export function isServiceable(pin) {
  if (!/^\d{6}$/.test(String(pin))) return false;
  const n = Number(pin);
  return (n >= 110001 && n <= 110099) || (n >= 121001 && n <= 121010) || (n >= 122001 && n <= 122018) || (n >= 201001 && n <= 201017) || (n >= 201301 && n <= 201310);
}
