import { Suspense } from "react";
import { connection } from "next/server";
import { PollForm } from "@/components/PollForm";

async function Form() {
  await connection(); // "today" must be computed per request, not at build time
  const today = new Date().toISOString().slice(0, 10);
  return <PollForm mode="create" today={today} />;
}

export default function Home() {
  return (
    <main className="page">
      <div className="stack">
        <h1 className="title">New meeting poll</h1>
        <p className="lead">Pick the dates you can offer. You’ll get a link to send to everyone.</p>
      </div>
      <Suspense fallback={<p className="muted">Loading calendar…</p>}>
        <Form />
      </Suspense>
    </main>
  );
}
