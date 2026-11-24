"use client";

import { useActionState, useState } from "react";
import { createPoll, type FormState } from "@/app/actions";
import { MONTHS_LONG, fmtShort, toIso, dayParts } from "@/lib/dates";
import { Chevron, Close } from "./icons";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CreatePollForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createPoll, {});
  const [ty, tm] = today.split("-").map(Number);
  const [view, setView] = useState({ y: ty, m: tm - 1 });
  const [picked, setPicked] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [organizer, setOrganizer] = useState("");

  const toggle = (iso: string) =>
    setPicked((p) => (p.includes(iso) ? p.filter((d) => d !== iso) : [...p, iso].sort()));

  const first = new Date(Date.UTC(view.y, view.m, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const atCurrentMonth = view.y === ty && view.m === tm - 1;
  const shift = (delta: number) =>
    setView((v) => {
      const d = new Date(Date.UTC(v.y, v.m + delta, 1));
      return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
    });

  const canSubmit = title.trim() && organizer.trim() && picked.length > 0 && picked.length <= 60 && !pending;

  return (
    <form action={action} className="stack" style={{ gap: 24 }}>
      <div className="split">
        <section className="card">
          <div className="field">
            <label htmlFor="title" className="label">What’s it for? <span className="req">*</span></label>
            <input id="title" name="title" className="input" maxLength={120} required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Team Christmas dinner" />
          </div>
          <div className="field">
            <label htmlFor="organizer" className="label">Your name <span className="req">*</span></label>
            <input id="organizer" name="organizer" className="input" maxLength={60} required value={organizer} onChange={(e) => setOrganizer(e.target.value)} autoComplete="given-name" />
            <span className="small muted">Shown to invitees as the organizer.</span>
          </div>
          <div className="field">
            <label htmlFor="note" className="label">Note <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
            <textarea id="note" name="note" className="textarea" rows={3} maxLength={500} placeholder="Time, place, anything people should know." />
          </div>
        </section>

        <section className="card" aria-label="Candidate dates">
          <div className="cal-head">
            <button type="button" className="icon-btn" aria-label="Previous month" disabled={atCurrentMonth} onClick={() => shift(-1)}>
              <Chevron dir="left" />
            </button>
            <h2 className="subtitle" aria-live="polite">{MONTHS_LONG[view.m]} {view.y}</h2>
            <button type="button" className="icon-btn" aria-label="Next month" onClick={() => shift(1)}>
              <Chevron dir="right" />
            </button>
          </div>
          <div className="cal-grid">
            {WEEKDAYS.map((w) => <div key={w} className="cal-wd" aria-hidden="true">{w}</div>)}
            {Array.from({ length: lead }, (_, i) => <div key={`b${i}`} aria-hidden="true" />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const iso = toIso(view.y, view.m, i + 1);
              const on = picked.includes(iso);
              const p = dayParts(iso);
              return (
                <button
                  key={iso}
                  type="button"
                  className="cal-day"
                  aria-pressed={on}
                  aria-label={`${p.wd} ${p.day} ${MONTHS_LONG[view.m]}`}
                  disabled={iso < today}
                  onClick={() => toggle(iso)}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <p className="small muted">Click a date to add or remove it.</p>
        </section>
      </div>

      <section className="card" style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div className="stack" style={{ gap: 10, flex: "1 1 400px", minWidth: 0 }}>
          <span className="label">
            {picked.length === 0 ? "No dates selected yet" : `${picked.length} ${picked.length === 1 ? "date" : "dates"} selected`}
          </span>
          {picked.length > 0 && (
            <div className="chips">
              {picked.map((d) => (
                <button key={d} type="button" className="chip" aria-label={`Remove ${fmtShort(d)}`} onClick={() => toggle(d)}>
                  {fmtShort(d)} <Close />
                </button>
              ))}
            </div>
          )}
          {state.error && <p className="error" role="alert">{state.error}</p>}
        </div>
        <input type="hidden" name="days" value={JSON.stringify(picked)} />
        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          {pending ? "Creating…" : "Create poll & get link"}
        </button>
      </section>
    </form>
  );
}
