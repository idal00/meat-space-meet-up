import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { reopenPoll } from "@/app/actions";
import { ClosePollForm } from "@/components/ClosePollForm";
import { CopyField } from "@/components/CopyButton";
import { Chevron } from "@/components/icons";
import { PollForm } from "@/components/PollForm";
import { getPoll } from "@/lib/db";
import { fmtLong } from "@/lib/dates";
import { getOrigin, getTokens } from "@/lib/session";

async function Manage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connection();
  const { edit, admin } = await getTokens(slug);
  const poll = await getPoll(slug, edit, admin);
  if (!poll) notFound();

  const back = (
    <Link href={`/p/${slug}/results`} className="btn-link" style={{ alignSelf: "flex-start" }}>
      <Chevron dir="left" size={16} /> Back to results
    </Link>
  );

  if (!poll.is_admin) {
    return (
      <>
        {back}
        <h1 className="title">Only the organizer can manage this poll</h1>
        <p className="lead">
          If you created it on another device, open your admin link here. It’s shown on the Manage page on the device you used.
        </p>
      </>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const answeredDays = poll.days.filter((d) => poll.responses.some((r) => r.answers[d]));
  const adminLink = `${await getOrigin()}/p/${slug}/a/${admin}`;

  return (
    <>
      {back}
      <div className="stack">
        <span className="muted" style={{ fontSize: 14 }}>Manage poll</span>
        <h1 className="title">{poll.title}</h1>
      </div>

      <section className="card">
        <h2 className="subtitle">Status</h2>
        {poll.closed ? (
          <div className="stack" style={{ gap: 14 }}>
            <p>
              <strong>Closed.</strong>{" "}
              {poll.final_day ? <>Final date: <strong>{fmtLong(poll.final_day)}</strong>.</> : "No final date announced."}{" "}
              Nobody can add or change responses.
            </p>
            <form action={reopenPoll.bind(null, slug)}>
              <button type="submit" className="btn btn-secondary">Reopen poll</button>
            </form>
          </div>
        ) : (
          <>
            <p>
              <strong>Open.</strong> {poll.responses.length} {poll.responses.length === 1 ? "response" : "responses"} so far.
            </p>
            <ClosePollForm slug={slug} days={poll.days} responses={poll.responses} />
          </>
        )}
      </section>

      <div className="stack" style={{ gap: 12 }}>
        <h2 className="subtitle">Edit poll</h2>
        <PollForm
          mode="edit"
          today={today}
          slug={slug}
          initial={{ title: poll.title, organizer: poll.organizer_name, note: poll.note ?? "", days: poll.days }}
          answeredDays={answeredDays}
        />
      </div>

      <section className="card">
        <CopyField
          id="admin-link"
          label="Your admin link"
          value={adminLink}
          hint="Keep this private. Open it on another device to manage the poll there — anyone with it can edit or close the poll."
        />
      </section>
    </>
  );
}

export default function Page({ params }: PageProps<"/p/[slug]/manage">) {
  return (
    <main className="page">
      <Suspense fallback={<p className="muted">Loading poll…</p>}>
        <Manage params={params} />
      </Suspense>
    </main>
  );
}
