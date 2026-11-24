import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CopyField } from "@/components/CopyButton";
import { Check } from "@/components/icons";
import { getPoll } from "@/lib/db";
import { fmtShort } from "@/lib/dates";
import { getOrigin, getTokens } from "@/lib/session";

async function Share({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { edit, admin } = await getTokens(slug);
  const poll = await getPoll(slug, edit, admin);
  if (!poll) notFound();
  const link = `${await getOrigin()}/p/${slug}`;

  return (
    <>
      <div className="stack" style={{ gap: 8 }}>
        {poll.is_admin && (
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--yes)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Check /> Poll created
          </span>
        )}
        <h1 className="title">{poll.title}</h1>
        <p className="lead">Send this link to the group. Anyone with it can respond and see the results.</p>
      </div>

      <section className="card">
        <CopyField id="invite" label="Invitation link" value={link} hint="Paste it into email, chat or a calendar invite." />
      </section>

      <section className="card">
        <h2 className="label" style={{ margin: 0 }}>
          {poll.days.length} candidate {poll.days.length === 1 ? "date" : "dates"}
        </h2>
        <div className="chips">
          {poll.days.map((d) => <span key={d} className="chip">{fmtShort(d)}</span>)}
        </div>
      </section>

      <div className="row">
        {poll.me_id ? (
          <Link href={`/p/${slug}/edit`} className="btn btn-primary">Edit your availability</Link>
        ) : (
          <Link href={`/p/${slug}`} className="btn btn-primary">Add your own availability</Link>
        )}
        <Link href={`/p/${slug}/results`} className="btn btn-secondary">View results</Link>
      </div>
      {poll.is_admin && (
        <p className="small muted">You count as a respondent too — your answers appear in the results marked “Organizer”.</p>
      )}
    </>
  );
}

export default function Page({ params }: PageProps<"/p/[slug]/share">) {
  return (
    <main className="page xnarrow">
      <Suspense fallback={<p className="muted">Loading poll…</p>}>
        <Share params={params} />
      </Suspense>
    </main>
  );
}
