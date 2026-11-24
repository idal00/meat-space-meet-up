type P = { size?: number };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const Star = ({ size = 22 }: P) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" style={{ fill: "var(--star)" }}>
    <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z" />
  </svg>
);

export const Check = ({ size = 16 }: P) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" {...stroke} strokeWidth={2.6}>
    <path d="M5 12l5 5 9-10" />
  </svg>
);

export const Copy = ({ size = 18 }: P) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
);

export const Pencil = ({ size = 16 }: P) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
    <path d="M4 20h4L19 9l-4-4L4 16z" />
  </svg>
);

export const Close = ({ size = 14 }: P) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" {...stroke} strokeWidth={2.2}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const Chevron = ({ size = 18, dir }: P & { dir: "left" | "right" }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
    <path d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
  </svg>
);

export const Trash = ({ size = 16 }: P) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
  </svg>
);
