import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AnswerForm } from "@/components/AnswerForm";
import { CopyField } from "@/components/CopyButton";
import { Chevron } from "@/components/icons";
import { getPoll } from "@/lib/db";
import { fmtShort } from "@/lib/dates";
import { getOrigin, getTokens } from "@/lib/session";

async function Edit({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { edit, admin } = await getTokens(slug);
  const poll = await getPoll(slug, edit, admin);
  if (!poll) notFound();
  const me = poll.responses.find((r) => r.id === poll.me_id);
  if (!me || !edit) redirect(`/p/${slug}`);
  const editLink = `${await getOrigin()}/p/${slug}/r/${edit}`;

  return (
    <>
      <Link href={`/p/${slug}/results`} className="btn-link" style={{ alignSelf: "flex-start" }}>
        <Chevron dir="left" size={16} /> Back to results
      </Link>
      <div className="stack">
        <span className="muted" style={{ fontSize: 14 }}>{poll.title} · organized by {poll.organizer_name}</span>
        <h1 className="title">Edit your response</h1>
        <p className="lead">Last saved {fmtShort(me.updated_at.slice(0, 10))}. Changes show up for everyone as soon as you save.</p>
      </div>
      <AnswerForm slug={slug} days={poll.days} mode="edit" initialName={me.name} initialAnswers={me.answers} />
      <section className="card">
        <CopyField
          id="edit-link"
          label="Your personal edit link"
          value={editLink}
          hint="This device remembers you. Keep this link to edit from another phone or computer — anyone who has it can change your answers."
        />
      </section>
    </>
  );
}

export default function Page({ params }: PageProps<"/p/[slug]/edit">) {
  return (
    <main className="page narrow">
      <Suspense fallback={<p className="muted">Loading your response…</p>}>
        <Edit params={params} />
      </Suspense>
    </main>
  );
}
