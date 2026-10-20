// Normalises Indian mobile numbers to +91XXXXXXXXXX. Returns null if invalid.
export function normalizePhone(input) {
  if (typeof input !== "string") return null;
  let d = input.replace(/[\s\-().]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  if (d.startsWith("91") && d.length === 12) d = d.slice(2);
  else if (d.startsWith("0") && d.length === 11) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? "+91" + d : null;
}
