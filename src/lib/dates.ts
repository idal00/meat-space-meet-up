// Dates are ISO "YYYY-MM-DD" strings, treated as calendar days (no time zone).

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function dayParts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = WD[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return { wd, day: d, mon: MON[m - 1], year: y };
}

export function fmtShort(iso: string) {
  const p = dayParts(iso);
  return `${p.wd} ${p.day} ${p.mon}`;
}

export function fmtLong(iso: string) {
  const p = dayParts(iso);
  return `${p.wd} ${p.day} ${p.mon} ${p.year}`;
}

export function toIso(y: number, m0: number, d: number) {
  return `${y}-${String(m0 + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
