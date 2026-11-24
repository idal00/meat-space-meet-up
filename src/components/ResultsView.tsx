"use client";

import Link from "next/link";
import { useState } from "react";
import type { PollResponse } from "@/lib/db";
import { dayParts, fmtLong } from "@/lib/dates";
import { tally } from "@/lib/results";
import { Check, Pencil, Star } from "./icons";

export function ResultsView({
  slug,
  days,
  responses,
  meId,
  closed = false,
  finalDay = null,
}: {
  slug: string;
  days: string[];
  responses: PollResponse[];
  meId: string | null;
  closed?: boolean;
  finalDay?: string | null;
}) {
  const [countMaybe, setCountMaybe] = useState(true);
  const { stats, best: computedBest } = tally(days, responses, countMaybe);
  // A final date chosen by the organizer takes the spotlight over the computed best.
  const finalIdx = finalDay ? days.indexOf(finalDay) : -1;
  const best = finalIdx >= 0 ? finalIdx : computedBest;
  const total = responses.length;
  const b = best === null ? null : stats[best];

  return (
    <>
      <section className="best" aria-label="Best date">
        {b ? (
          <div className="row" style={{ gap: 16, flexWrap: "nowrap" }}>
            <div className="best-badge">
              <Star size={22} />
              <span className="wd">{dayParts(b.day).wd}</span>
              <span className="num">{dayParts(b.day).day}</span>
            </div>
            <div className="stack" style={{ gap: 4 }}>
              <span className="eyebrow">{finalIdx >= 0 ? "Final date" : "Best date"}</span>
              <span className="best-date">{fmtLong(b.day)}</span>
              <span className="muted" style={{ fontSize: 14 }}>
                {b.yes} yes{b.maybe ? `, ${b.maybe} if needed` : ""} —{" "}
                {total === 0 ? "no responses" : b.score === total ? "everyone can make it" : `${b.score} of ${total} can make it`}
              </span>
            </div>
          </div>
        ) : (
          <div className="stack" style={{ gap: 4 }}>
            <span className="eyebrow">Best date</span>
            <span className="muted">{total === 0 ? "No responses yet." : "No date works for anyone yet."}</span>
          </div>
        )}
        <button type="button" role="switch" aria-checked={countMaybe} className="switch" onClick={() => setCountMaybe((v) => !v)}>
          <span className="track" aria-hidden="true"><span className="knob" /></span>
          Count “If needed” as available
        </button>
      </section>

      <div className="table-wrap">
        {total === 0 ? (
          <p className="empty">Nobody has responded yet. Share the invite link to get answers in.</p>
        ) : (
          <table className="results">
            <caption className="sr-only">Responses per date</caption>
            <thead>
              <tr>
                <th scope="col" className="name-col">Name</th>
                {days.map((d, i) => (
                  <th key={d} scope="col" className={i === best ? "is-best" : undefined}>
                    <span className="col-wd">{dayParts(d).wd}</span>
                    <span className="col-day">{dayParts(d).day} {dayParts(d).mon}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => {
                const me = r.id === meId;
                return (
                  <tr key={r.id} className={me ? "is-me" : undefined}>
                    <th scope="row">
                      <div className="who">
                        <div className="stack" style={{ gap: 2, minWidth: 0 }}>
                          <span className="who-name">{r.name}</span>
                          {r.is_organizer && <span className="small muted">Organizer</span>}
                          {me && <span><span className="tag-you">You</span></span>}
                        </div>
                        {me && !closed && (
                          <Link href={`/p/${slug}/edit`} className="edit-link" aria-label="Edit your response">
                            <Pencil />
                          </Link>
                        )}
                      </div>
                    </th>
                    {days.map((d, i) => {
                      const a = r.answers[d];
                      return (
                        <td key={d} className={i === best ? "is-best" : undefined}>
                          {a === "y" && <span className="pill pill-y"><Check size={14} />Yes</span>}
                          {a === "m" && <span className="pill pill-m">If needed</span>}
                          {a === "n" && <span className="pill-n">No</span>}
                          {!a && <span className="no-answer" title="No answer">–<span className="sr-only">No answer</span></span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" className="small muted">Available</th>
                {stats.map((s, i) => (
                  <td key={s.day} className={i === best ? "is-best" : undefined}>
                    <span className="score">{s.score}</span>
                    <span className="muted small"> / {total}</span>
                    <span className="meter" aria-hidden="true">
                      <span style={{ width: `${Math.round((s.score / total) * 100)}%` }} />
                    </span>
                    <span className="small muted">{s.yes} yes{s.maybe ? ` · ${s.maybe} if needed` : ""}</span>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </>
  );
}
