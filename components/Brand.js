import Link from "next/link";
// Veda logo lock-up built from the official artwork in /public (white on green bars, colour on white).
export default function Brand({ tone = "white", height = 34, href = "/", onClick }) {
  const sfx = tone === "white" ? "-white" : "";
  return (
    <Link href={href} className="brand" aria-label="Veda home" onClick={onClick}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/leaf${sfx}.png`} alt="" height={height} width={Math.round(height * 1.18)} style={{ height, width: "auto" }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/wordmark${sfx}.png`} alt="Veda" height={Math.round(height * 0.62)} width={Math.round(height * 0.62 * 4.2)} style={{ height: Math.round(height * 0.62), width: "auto" }} />
    </Link>
  );
}
