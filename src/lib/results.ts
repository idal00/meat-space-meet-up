import type { PollResponse } from "./db";

export type DayStat = { day: string; yes: number; maybe: number; score: number };

/** Per-day tallies and the index of the best day (null when nobody has responded). */
export function tally(days: string[], responses: PollResponse[], countMaybe: boolean) {
  const stats: DayStat[] = days.map((day) => {
    let yes = 0;
    let maybe = 0;
    for (const r of responses) {
      if (r.answers[day] === "y") yes++;
      else if (r.answers[day] === "m") maybe++;
    }
    return { day, yes, maybe, score: yes + (countMaybe ? maybe : 0) };
  });
  let best: number | null = null;
  stats.forEach((s, i) => {
    if (s.score === 0) return;
    const b = best === null ? null : stats[best];
    if (!b || s.score > b.score || (s.score === b.score && s.yes > b.yes)) best = i;
  });
  return { stats, best };
}
