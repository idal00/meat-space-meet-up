import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AnswerForm } from "@/components/AnswerForm";
import { getPoll } from "@/lib/db";
import { getTokens } from "@/lib/session";

// The invitation link. First visit: respond. Returning on the same device
// (edit-token cookie present): go straight to the results, where "Edit" lives.
async function Respond({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { edit, admin } = await getTokens(slug);
  const poll = await getPoll(slug, edit, admin);
  if (!poll) notFound();
  if (poll.me_id) redirect(`/p/${slug}/results`);
  const n = poll.responses.length;

  return (
    <>
      <div className="stack">
        <span className="muted" style={{ fontSize: 14 }}>
          {poll.is_admin ? "Your poll — add your own availability" : `${poll.organizer_name} invited you to pick dates`}
        </span>
        <h1 className="title">{poll.title}</h1>
        {poll.note && <p className="lead" style={{ whiteSpace: "pre-line" }}>{poll.note}</p>}
      </div>
      <AnswerForm slug={slug} days={poll.days} mode="new" initialName={poll.is_admin ? poll.organizer_name : ""} />
      <p className="muted" style={{ fontSize: 14 }}>
        You can change your answers any time after submitting.{" "}
        {n > 0 && <>{n} {n === 1 ? "person has" : "people have"} responded so far — </>}
        <Link href={`/p/${slug}/results`}>see results</Link>.
      </p>
    </>
  );
}

export default function Page({ params }: PageProps<"/p/[slug]">) {
  return (
    <main className="page narrow">
      <Suspense fallback={<p className="muted">Loading poll…</p>}>
        <Respond params={params} />
      </Suspense>
    </main>
  );
}
