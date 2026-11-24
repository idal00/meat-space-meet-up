import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Check, Pencil } from "@/components/icons";
import { ResultsView } from "@/components/ResultsView";
import { getPoll } from "@/lib/db";
import { getOrigin, getTokens } from "@/lib/session";

async function Results({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const saved = (await searchParams).saved === "1";
  const { edit, admin } = await getTokens(slug);
  const poll = await getPoll(slug, edit, admin);
  if (!poll) notFound();
  const origin = await getOrigin();
  const me = poll.responses.find((r) => r.id === poll.me_id);
  const n = poll.responses.length;

  return (
    <>
      {me && edit ? (
        <section className="banner banner-ok" aria-live="polite">
          <div className="row" style={{ gap: 12, flex: "1 1 360px", minWidth: 0, flexWrap: "nowrap" }}>
            <Check size={22} />
            <div className="stack" style={{ gap: 2 }}>
              <span style={{ fontWeight: 600 }}>
                {saved ? `Thanks, ${me.name} — your response is saved.` : `You responded as ${me.name}.`}
              </span>
              <span className="small">
                You can edit it from this device any time. On another device, use your personal edit link.
              </span>
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <Link href={`/p/${slug}/edit`} className="btn btn-green btn-sm"><Pencil /> Edit my response</Link>
            <CopyButton
              text={`${origin}/p/${slug}/r/${edit}`}
              label="Copy my edit link"
              copiedLabel="Edit link copied"
              className="btn btn-secondary btn-sm"
            />
          </div>
        </section>
      ) : (
        <section className="banner banner-ok">
          <span style={{ fontWeight: 500 }}>Haven’t responded yet?</span>
          <Link href={`/p/${slug}`} className="btn btn-green btn-sm">Add my response</Link>
        </section>
      )}

      <div className="row between" style={{ alignItems: "flex-end", gap: 16 }}>
        <div className="stack">
          <span className="muted" style={{ fontSize: 14 }}>
            Organized by {poll.organizer_name} · {n} {n === 1 ? "response" : "responses"}
          </span>
          <h1 className="title">{poll.title}</h1>
        </div>
        <CopyButton text={`${origin}/p/${slug}`} label="Copy invite link" className="btn btn-secondary btn-sm" />
      </div>

      <ResultsView slug={slug} days={poll.days} responses={poll.responses} meId={poll.me_id} />
      <p className="small muted">
        Ranked by number of people available; ties go to the date with more firm “Yes” answers. Only you can edit your own row.
      </p>
    </>
  );
}

export default function Page({ params, searchParams }: PageProps<"/p/[slug]/results">) {
  return (
    <main className="page">
      <Suspense fallback={<p className="muted">Loading results…</p>}>
        <Results params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
