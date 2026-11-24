"use client";

import { useActionState, useState } from "react";
import { closePoll, type FormState } from "@/app/actions";
import type { PollResponse } from "@/lib/db";
import { fmtLong } from "@/lib/dates";
import { tally } from "@/lib/results";

/** Organizer closes the poll, optionally announcing the final date. */
export function ClosePollForm({ slug, days, responses }: { slug: string; days: string[]; responses: PollResponse[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(closePoll.bind(null, slug), {});
  const { stats, best } = tally(days, responses, true);
  const [finalDay, setFinalDay] = useState(best === null ? "" : stats[best].day);

  return (
    <form action={action} className="stack" style={{ gap: 14 }}>
      <fieldset style={{ border: "none", margin: 0, padding: 0 }} className="stack">
        <legend className="label" style={{ marginBottom: 8 }}>Final date (shown to everyone)</legend>
        <div className="choice-list">
          {stats.map((s, i) => (
            <label key={s.day} className="choice">
              <input type="radio" name="final_day" value={s.day} checked={finalDay === s.day} onChange={() => setFinalDay(s.day)} />
              <span className="choice-main">{fmtLong(s.day)}</span>
              <span className="small muted">
                {s.score} of {responses.length} available{i === best ? " · best" : ""}
              </span>
            </label>
          ))}
          <label className="choice">
            <input type="radio" name="final_day" value="" checked={finalDay === ""} onChange={() => setFinalDay("")} />
            <span className="choice-main">No final date</span>
            <span className="small muted">Just stop collecting responses</span>
          </label>
        </div>
      </fieldset>
      <p className="small muted">Closing stops new responses and edits. You can reopen the poll later.</p>
      <div className="row">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Closing…" : "Close poll"}
        </button>
      </div>
      {state.error && <p className="error" role="alert">{state.error}</p>}
    </form>
  );
}
