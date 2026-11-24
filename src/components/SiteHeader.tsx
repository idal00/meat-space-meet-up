import Link from "next/link";
import { Star } from "./icons";

export function SiteHeader() {
  return (
    <header className="site-header">
      <svg className="scene" aria-hidden="true" viewBox="0 0 1280 170" preserveAspectRatio="xMidYMax slice">
        <g style={{ fill: "var(--moon)" }}>
          {[[70, 28, 1.8], [190, 54, 1.4], [320, 22, 2], [450, 62, 1.3], [560, 30, 1.6], [700, 50, 1.4],
            [820, 20, 1.9], [940, 58, 1.4], [1010, 26, 1.6], [1220, 64, 1.5], [1250, 20, 1.8]].map(([cx, cy, r]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
          ))}
        </g>
        <circle cx="1140" cy="44" r="18" style={{ fill: "var(--moon)" }} />
        <circle cx="1149" cy="37" r="16" style={{ fill: "var(--night)" }} />
        <path d="M0 136 Q 180 104 400 128 T 840 118 T 1280 124 V170 H0 Z" style={{ fill: "var(--night-hill)" }} />
        <g style={{ fill: "var(--pine)" }}>
          <path d="M30 150 L56 78 L82 150 Z" />
          <path d="M90 152 L108 104 L126 152 Z" />
          <path d="M150 150 L174 92 L198 150 Z" />
          <path d="M1080 150 L1104 90 L1128 150 Z" />
          <path d="M1150 152 L1168 106 L1186 152 Z" />
          <path d="M1200 150 L1228 74 L1256 150 Z" />
        </g>
        <path d="M0 148 Q 320 128 640 146 T 1280 140 V170 H0 Z" style={{ fill: "var(--bg)" }} />
      </svg>
      <div className="bar">
        <Link href="/" className="brand">
          <Star size={24} />
          meat space meet up
        </Link>
      </div>
    </header>
  );
}
