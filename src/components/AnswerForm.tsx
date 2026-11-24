"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { deleteResponse, submitResponse, updateResponse, type FormState } from "@/app/actions";
import type { Answer } from "@/lib/db";
import { dayParts, fmtLong } from "@/lib/dates";
import { Trash } from "./icons";

const OPTIONS: { v: Answer; label: string }[] = [
  { v: "y", label: "Yes" },
  { v: "m", label: "If needed" },
  { v: "n", label: "No" },
];

type Props = {
  slug: string;
  days: string[];
  mode: "new" | "edit";
  initialName?: string;
  initialAnswers?: Record<string, Answer>;
};

/** Name + Yes / If needed / No per date. Used both to respond and to edit a response. */
export function AnswerForm({ slug, days, mode, initialName = "", initialAnswers }: Props) {
  const serverAction = mode === "new" ? submitResponse : updateResponse;
  const [state, action, pending] = useActionState<FormState, FormData>(serverAction.bind(null, slug), {});
  const [name, setName] = useState(initialName);
  const [answers, setAnswers] = useState<Record<string, Answer>>(initialAnswers ?? {});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const answered = days.filter((d) => answers[d]).length;
  const changes =
    mode === "edit"
      ? days.filter((d) => answers[d] !== initialAnswers?.[d]).length + (name.trim() !== initialName ? 1 : 0)
      : 0;
  const complete = name.trim().length > 0 && answered === days.length;
  const canSubmit = complete && !pending && (mode === "new" || changes > 0);

  const hint = !name.trim()
    ? "Enter your name to submit."
    : answered < days.length
      ? "Answer every date to submit."
      : "";

  return (
    <>
      <form action={action} className="stack" style={{ gap: 24 }}>
        <section className="card">
          <div className="field">
            <label htmlFor="name" className="label">Your name <span className="req">*</span></label>
            <input
              id="name"
              name="name"
              className="input"
              maxLength={60}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sam Lee"
              autoComplete="name"
            />
            {mode === "new" && (
              <span className="small muted">Everyone who opens the link will see your name next to your answers.</span>
            )}
          </div>
        </section>

        <section className="card flush">
          <div className="card-head">
            <h2 className="subtitle">{mode === "new" ? "Which dates work for you?" : "Your availability"}</h2>
            <span className="small muted">
              {mode === "new"
                ? `${answered} of ${days.length} answered`
                : changes === 0
                  ? "No changes yet"
                  : `${changes} ${changes === 1 ? "change" : "changes"} not saved`}
            </span>
          </div>
          {days.map((d) => {
            const p = dayParts(d);
            const v = answers[d];
            const changed = mode === "edit" && v !== initialAnswers?.[d];
            return (
              <div key={d} role="group" aria-label={fmtLong(d)} className={"answer-row" + (changed ? " is-changed" : "")}>
                <div className="answer-date">
                  <span className="answer-wd">{p.wd}</span>
                  <span className="answer-day">{p.day} {p.mon}</span>
                  {changed && <span className="changed-tag">Changed</span>}
                </div>
                <div className="seg">
                  {OPTIONS.map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      data-v={o.v}
                      aria-pressed={v === o.v}
                      onClick={() => setAnswers((a) => ({ ...a, [d]: o.v }))}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <input type="hidden" name="answers" value={JSON.stringify(answers)} />
        <div className="row" style={{ gap: 16 }}>
          <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
            {pending ? "Saving…" : mode === "new" ? "Submit response" : "Save changes"}
          </button>
          {mode === "edit" && (
            <Link href={`/p/${slug}/results`} className="btn btn-secondary">Cancel</Link>
          )}
          {hint && <span className="muted" style={{ fontSize: 14 }}>{hint}</span>}
        </div>
        {state.error && <p className="error" role="alert">{state.error}</p>}
      </form>

      {mode === "edit" && (
        <section style={{ borderTop: "1px solid var(--border)", paddingTop: 20 }}>
          {!confirmDelete ? (
            <button type="button" className="btn-link" onClick={() => setConfirmDelete(true)}>
              <Trash /> Remove my response
            </button>
          ) : (
            <form action={deleteResponse.bind(null, slug)} className="banner banner-danger" role="alertdialog" aria-label="Confirm removal">
              <span style={{ fontWeight: 500 }}>Remove {initialName} and all answers from this poll?</span>
              <div className="row" style={{ gap: 8 }}>
                <button type="submit" className="btn btn-primary btn-sm">Remove</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmDelete(false)}>Keep</button>
              </div>
            </form>
          )}
        </section>
      )}
    </>
  );
}
