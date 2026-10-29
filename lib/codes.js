import qrcode from "qrcode-generator";

// Code 128 (set B) barcode as SVG — printable, scannable by courier handhelds.
const P = "212222,222122,222221,121223,121322,131222,122213,122312,132212,221213,221312,231212,112232,122132,122231,113222,123122,123221,223211,221132,221231,213212,223112,312131,311222,321122,321221,312212,322112,322211,212123,212321,232121,111323,131123,131321,112313,132113,132311,211313,231113,231311,112133,112331,132131,113123,113321,133121,313121,211331,231131,213113,213311,213131,311123,311321,331121,312113,312311,332111,314111,221411,431111,111224,111422,121124,121421,141122,141221,112214,112412,122114,122411,142112,142211,241211,221114,413111,241112,134111,111242,121142,121241,114212,124112,124211,411212,421112,421211,212141,214121,412121,111143,111341,131141,114113,114311,411113,411311,113141,114131,311141,411131,211412,211214,211232,2331112".split(",");

export function code128Widths(text) {
  const s = String(text).replace(/[^\x20-\x7e]/g, "?");
  const vals = [104, ...[...s].map((c) => c.charCodeAt(0) - 32)];
  const check = vals.reduce((t, v, i) => t + v * (i === 0 ? 1 : i), 0) % 103;
  return [...vals, check, 106].map((v) => P[v]).join("");
}

export function barcodeSvg(text, { height = 46, unit = 1.6 } = {}) {
  const w = code128Widths(text); let x = 10 * unit, rects = "";
  [...w].forEach((d, i) => { const n = Number(d) * unit; if (i % 2 === 0) rects += `<rect x="${x.toFixed(2)}" y="0" width="${n.toFixed(2)}" height="${height}"/>`; x += n; });
  const total = x + 10 * unit;
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total.toFixed(2)} ${height}" width="${Math.round(total)}" height="${height}" fill="#000" shape-rendering="crispEdges">${rects}</svg>`, text: String(text) };
}

export function qrSvg(text, cell = 3) {
  const q = qrcode(0, "M"); q.addData(String(text)); q.make();
  const n = q.getModuleCount(), m = 2; let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m},${r + m}h1v1h-1z`;
  const size = (n + m * 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size * cell}" height="${size * cell}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
