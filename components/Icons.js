// Veda icon set (UI, stroke) and illustrations (flat, green palette). Pure SVG, no emoji.
const G = { d: "#145a32", m: "#1f7a45", l: "#3aa56a", s: "#7cc79a", p: "#bfe3cc", w: "#e9f6ee" };

const PATHS = {
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-5-5" /></>,
  cart: <><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" /><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>,
  pin: <><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  tag: <><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.3" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  doc: <><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
  news: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></>,
  rx: <><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M10 12v6M7.5 15h5" /></>,
  truck: <><path d="M2 6h12v10H2zM14 10h4l3 3v3h-7" /><circle cx="6" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>,
  shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M8.5 12l2.5 2.5L16 9.5" /></>,
  return: <path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  bell: <path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4" />,
  leaf: <path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15zM5 19l8-8" />,
  box: <path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10" />,
  card: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  ban: <><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></>,
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 17h.01" /></>,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  folder: <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  gauge: <><path d="M4 17a8 8 0 1 1 16 0" /><path d="M12 17l4-5" /></>,
  star: <path d="M12 3l2.8 6 6.2.7-4.7 4.3 1.3 6.5L12 17.2 6.4 20.5l1.3-6.5L3 9.7 9.2 9z" />,
  external: <path d="M7 17L17 7M8 7h9v9" />,
  check: <path d="M5 12l5 5 9-10" />,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
};

export function Icon({ name, size = 22, className, strokeWidth = 1.8, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className} {...rest}>
      {PATHS[name] || PATHS.leaf}
    </svg>
  );
}

const LeafBase = ({ x = 0, y = 0, s = 1, r = 0, c, vein = "#fff" }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    <path d="M0 0C-14-8-14-26 0-40 14-26 14-8 0 0z" fill={c} />
    <path d="M0 -4V-34" stroke={vein} strokeWidth="2" strokeLinecap="round" opacity=".7" />
  </g>
);

const Leaf = (p) => <LeafBase c={G.l} {...p} />;

const makeArt = (G) => {
  const Leaf = (p) => <LeafBase c={G.l} {...p} />;
  return {
  leaf: <><Leaf x={48} y={82} s={1.7} r={-15} /><path d="M48 82v-6" stroke={G.d} strokeWidth="3" strokeLinecap="round" /></>,
  "ayurvedic-care": <>
    <rect x="26" y="82" width="44" height="4" rx="2" fill={G.p} />
    <path d="M20 50h56c0 18-10 31-28 31S20 68 20 50z" fill={G.m} />
    <rect x="17" y="45" width="62" height="9" rx="4.5" fill={G.d} />
    <rect x="55" y="8" width="11" height="44" rx="5.5" transform="rotate(24 60 30)" fill={G.s} />
    <Leaf x={30} y={44} s={0.8} r={-25} /><Leaf x={42} y={44} s={0.65} r={15} c={G.s} />
  </>,
  homeopathy: <>
    <path d="M42 30V20c0-9 12-9 12 0v10z" fill={G.d} />
    <rect x="40" y="28" width="16" height="10" rx="2" fill={G.m} />
    <rect x="29" y="38" width="38" height="46" rx="9" fill={G.w} stroke={G.m} strokeWidth="3" />
    <path d="M32 58h32v17a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6z" fill={G.s} />
    <rect x="35" y="46" width="26" height="14" rx="3" fill="#fff" /><Leaf x={48} y={58} s={0.32} r={0} />
    <path d="M80 28c5 7 7 11 7 15a7 7 0 0 1-14 0c0-4 2-8 7-15z" fill={G.l} />
  </>,
  immunity: <>
    <path d="M48 8l31 12v26c0 19-14 31-31 42-17-11-31-23-31-42V20z" fill={G.m} />
    <path d="M48 18l22 9v19c0 13-9 22-22 30-13-8-22-17-22-30V27z" fill={G.w} />
    <Leaf x={48} y={64} s={1} r={0} /><path d="M48 62V36" stroke="#fff" strokeWidth="0" />
  </>,
  digestion: <>
    <path d="M36 32c-5-6 3-9-1-15M48 30c-5-6 3-10-1-18M60 32c-5-6 3-9-1-15" stroke={G.s} strokeWidth="3" strokeLinecap="round" fill="none" />
    <rect x="32" y="82" width="32" height="4" rx="2" fill={G.d} />
    <path d="M16 50h64c0 19-13 32-32 32S16 69 16 50z" fill={G.m} />
    <ellipse cx="48" cy="50" rx="32" ry="7" fill={G.s} />
    <Leaf x={40} y={50} s={0.7} r={-30} /><Leaf x={56} y={49} s={0.6} r={25} c={G.m} vein={G.w} />
  </>,
  "skin-hair": <>
    <path d="M30 66h36l-5 20H35z" fill={G.d} />
    <path d="M44 68C34 52 38 30 48 10c10 20 14 42 4 58z" fill={G.l} />
    <path d="M42 70C28 64 18 46 16 28c15 6 25 22 26 42z" fill={G.m} />
    <path d="M54 70c14-6 24-24 26-42-15 6-25 22-26 42z" fill={G.s} />
    <path d="M82 12l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill={G.l} />
  </>,
  "herbal-juices": <>
    <rect x="40" y="8" width="16" height="14" rx="3" fill={G.d} />
    <path d="M36 22h24c6 8 8 14 8 22v38c0 4-2 6-6 6H34c-4 0-6-2-6-6V44c0-8 2-14 8-22z" fill={G.w} stroke={G.m} strokeWidth="3" />
    <path d="M28 52h40v30c0 4-2 6-6 6H34c-4 0-6-2-6-6z" fill={G.s} />
    <rect x="34" y="58" width="28" height="20" rx="3" fill="#fff" /><Leaf x={48} y={74} s={0.42} r={0} />
  </>,
  devices: <>
    <circle cx="26" cy="12" r="5" fill={G.d} /><circle cx="62" cy="12" r="5" fill={G.d} />
    <path d="M26 16v22c0 14 10 20 22 20M62 16v22c0 14-10 20-22 20" stroke={G.m} strokeWidth="5" strokeLinecap="round" fill="none" />
    <path d="M48 58v12c0 10 12 14 20 8" stroke={G.m} strokeWidth="5" strokeLinecap="round" fill="none" />
    <circle cx="70" cy="76" r="11" fill={G.l} stroke={G.d} strokeWidth="3" /><circle cx="70" cy="76" r="4.5" fill={G.w} />
  </>,
  "mother-baby": <>
    <path d="M40 24c0-14 16-14 16 0z" fill={G.s} />
    <rect x="33" y="22" width="30" height="9" rx="3" fill={G.d} />
    <rect x="31" y="30" width="34" height="54" rx="10" fill={G.w} stroke={G.m} strokeWidth="3" />
    <path d="M34 50h28v26a7 7 0 0 1-7 7H41a7 7 0 0 1-7-7z" fill={G.p} />
    <path d="M52 42h8M52 52h8M52 62h8" stroke={G.m} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M45 62c-5-4-7-7-4-10 2-2 4 0 4 1 0-1 2-3 4-1 3 3 1 6-4 10z" fill={G.l} />
  </>,
  sun: <>
    <circle cx="48" cy="46" r="17" fill={G.s} />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <path key={a} d="M48 18v-8" stroke={G.l} strokeWidth="4" strokeLinecap="round" transform={`rotate(${a} 48 46)`} />)}
    <Leaf x={56} y={86} s={1} r={20} c={G.m} />
  </>,
  rx: <>
    <rect x="22" y="10" width="52" height="72" rx="8" fill={G.w} stroke={G.m} strokeWidth="3" />
    <rect x="34" y="6" width="28" height="12" rx="5" fill={G.m} />
    <path d="M44 38v22M33 49h22" stroke={G.l} strokeWidth="6" strokeLinecap="round" />
    <path d="M32 70h32" stroke={G.s} strokeWidth="3" strokeLinecap="round" />
  </>,
  cart: <>
    <path d="M10 18h12l8 42h40l8-30H26" fill={G.w} stroke={G.m} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
    <circle cx="36" cy="76" r="6" fill={G.d} /><circle cx="66" cy="76" r="6" fill={G.d} />
    <Leaf x={52} y={54} s={0.8} r={0} />
  </>,
  tag: <>
    <path d="M10 48V12h36l40 40-36 34z" fill={G.l} />
    <path d="M10 48V12h36l40 40-36 34z" fill="none" stroke={G.d} strokeWidth="3" strokeLinejoin="round" />
    <circle cx="28" cy="30" r="6" fill="#fff" />
    <path d="M44 58l16-16M46 44h.01M58 56h.01" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
  </>,
  check: <>
    <circle cx="48" cy="48" r="36" fill={G.l} />
    <path d="M30 49l13 13 24-27" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </>,
  truck: <>
    <path d="M8 24h46v40H8z" fill={G.l} /><path d="M54 36h18l14 14v14H54z" fill={G.m} />
    <path d="M62 42h8l8 8h-16z" fill={G.w} />
    <circle cx="26" cy="68" r="8" fill={G.d} stroke="#fff" strokeWidth="3" /><circle cx="70" cy="68" r="8" fill={G.d} stroke="#fff" strokeWidth="3" />
    <Leaf x={31} y={54} s={0.7} r={0} c="#fff" vein={G.l} />
  </>,
  sprout: <>
    <path d="M48 86V48" stroke={G.d} strokeWidth="4" strokeLinecap="round" />
    <path d="M48 52C34 54 24 44 24 30c14 0 24 8 24 22z" fill={G.l} /><path d="M48 44c0-16 10-26 26-26 0 16-10 26-26 26z" fill={G.m} />
    <path d="M30 86h36" stroke={G.s} strokeWidth="4" strokeLinecap="round" />
  </>,
  lock: <>
    <path d="M32 44V32a16 16 0 0 1 32 0v12" stroke={G.d} strokeWidth="7" fill="none" strokeLinecap="round" />
    <rect x="20" y="42" width="56" height="42" rx="9" fill={G.m} />
    <circle cx="48" cy="60" r="6" fill={G.w} /><path d="M48 62v10" stroke={G.w} strokeWidth="5" strokeLinecap="round" />
  </>,
  bell: <>
    <path d="M24 66V44a24 24 0 0 1 48 0v22l6 8H18z" fill={G.l} /><circle cx="48" cy="80" r="7" fill={G.d} />
    <path d="M48 12v8" stroke={G.d} strokeWidth="5" strokeLinecap="round" />
    <path d="M34 46a14 14 0 0 1 10-12" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".7" />
  </>,
  help: <>
    <rect x="12" y="16" width="72" height="46" rx="12" fill={G.l} /><path d="M30 62l-6 18 22-18z" fill={G.l} />
    <path d="M40 36c0-8 16-8 16 0 0 6-8 6-8 12M48 56h.01" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" />
  </>,
  box: <>
    <path d="M48 10l34 15v38L48 86 14 63V25z" fill={G.l} />
    <path d="M14 25l34 15 34-15M48 40v46" stroke={G.d} strokeWidth="3" strokeLinejoin="round" fill="none" />
    <path d="M31 17l34 15v13" stroke={G.d} strokeWidth="3" fill="none" />
  </>,
  mail: <>
    <rect x="10" y="22" width="76" height="54" rx="9" fill={G.l} /><path d="M10 30l38 26 38-26" stroke="#fff" strokeWidth="4" fill="none" strokeLinejoin="round" />
  </>,
  news: <>
    <rect x="14" y="12" width="68" height="72" rx="9" fill={G.w} stroke={G.m} strokeWidth="3" />
    <rect x="24" y="22" width="22" height="20" rx="3" fill={G.l} /><path d="M52 26h20M52 36h20M24 54h48M24 64h48M24 74h30" stroke={G.s} strokeWidth="4" strokeLinecap="round" />
  </>,
  return: <>
    <path d="M38 22L16 44l22 22" stroke={G.d} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M18 44h38a22 22 0 0 1 0 44H40" stroke={G.l} strokeWidth="7" strokeLinecap="round" fill="none" />
  </>,
  card: <>
    <rect x="8" y="20" width="80" height="56" rx="10" fill={G.l} /><rect x="8" y="32" width="80" height="12" fill={G.d} />
    <rect x="18" y="56" width="26" height="8" rx="3" fill="#fff" />
  </>,
  user: <><circle cx="48" cy="34" r="16" fill={G.l} /><path d="M16 84c0-18 14-30 32-30s32 12 32 30z" fill={G.m} /></>,
  pin: <>
    <path d="M48 88S18 60 18 38a30 30 0 0 1 60 0c0 22-30 50-30 50z" fill={G.l} /><circle cx="48" cy="38" r="11" fill="#fff" />
  </>,
  };
};


// Colour families. Default (no tone) stays the original green so product placeholders do not change.
const PALS = {
  green: G,
  blue: { d: "#173f7a", m: "#2563c9", l: "#4a8bf0", s: "#93bbf7", p: "#c9defc", w: "#eaf2fe" },
  orange: { d: "#9a3d07", m: "#e0620f", l: "#f58a3a", s: "#fbb883", p: "#fddcc0", w: "#fff1e6" },
  amber: { d: "#8a5a00", m: "#d99a06", l: "#f2b91f", s: "#f8d56b", p: "#fbe9a8", w: "#fff8e1" },
  rose: { d: "#9d1f55", m: "#d93a7e", l: "#ee6ba2", s: "#f6a6c6", p: "#fbd2e2", w: "#fff0f6" },
  red: { d: "#8f1b22", m: "#cf2c36", l: "#ea5560", s: "#f4959b", p: "#f9ccce", w: "#fff0f0" },
  teal: { d: "#0b5a5f", m: "#0f8a8f", l: "#2cb5b5", s: "#82d3d1", p: "#c0ecea", w: "#e8f8f7" },
  purple: { d: "#4a2a8a", m: "#7048cc", l: "#9370e6", s: "#bda8f2", p: "#ddd2fa", w: "#f2eefe" },
};
const TONE_OF = {
  leaf: "green", "ayurvedic-care": "green", homeopathy: "blue", immunity: "orange", digestion: "amber", "skin-hair": "rose", "herbal-juices": "red", devices: "teal", "mother-baby": "purple",
  sun: "orange", rx: "blue", cart: "green", tag: "rose", check: "green", truck: "blue", sprout: "green", lock: "purple", bell: "amber", help: "teal", box: "orange", mail: "blue", news: "teal", return: "purple", card: "blue", user: "teal", pin: "red",
};
const ARTS = {};
const artSet = (tone) => (ARTS[tone] ||= makeArt(PALS[tone] || G));
const ART = artSet("green");
export const tintOf = (name) => (PALS[TONE_OF[name] || "green"] || G).w;

export function Illus({ name = "leaf", size = 64, className, title, color = false }) {
  const art = color ? artSet(TONE_OF[name] || "green") : ART;
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : "true"} focusable="false">
      {art[name] || art.leaf}
    </svg>
  );
}

// Big hero scene: soft white disc, a product illustration and floating leaves.
export function HeroArt({ variant = 0, className }) {
  const main = ["ayurvedic-care", "immunity", "homeopathy"][variant % 3];
  return (
    <svg viewBox="0 0 320 260" className={className} aria-hidden="true" focusable="false">
      <circle cx="170" cy="130" r="112" fill="#fff" opacity=".16" />
      <circle cx="170" cy="130" r="84" fill="#fff" opacity=".95" />
      <g transform="translate(110 70) scale(1.25)">{artSet(TONE_OF[main])[main]}</g>
      <g opacity=".95"><Leaf x={52} y={170} s={1.6} r={-35} c="#bfe3cc" vein="#1f7a45" /><Leaf x={288} y={86} s={1.3} r={40} c="#e9f6ee" vein="#3aa56a" /><Leaf x={282} y={232} s={1.9} r={25} c="#7cc79a" vein="#e9f6ee" /><Leaf x={40} y={60} s={0.9} r={-10} c="#e9f6ee" vein="#3aa56a" /></g>
    </svg>
  );
}

export const catArt = (slug) => (ART[slug] ? slug : "leaf");
