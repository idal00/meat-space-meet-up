import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page narrow">
      <h1 className="title">Poll not found</h1>
      <p className="lead">The link may be mistyped, or the poll no longer exists.</p>
      <div className="row">
        <Link href="/" className="btn btn-primary">Create a new poll</Link>
      </div>
    </main>
  );
}
