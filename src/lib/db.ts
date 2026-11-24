// Server-only data access. All reads/writes go through Postgres RPC functions
// (see supabase/migrations); the tables themselves are not exposed.

export type Answer = "y" | "m" | "n";

export type PollResponse = {
  id: string;
  name: string;
  is_organizer: boolean;
  updated_at: string;
  answers: Record<string, Answer>;
};

export type Poll = {
  slug: string;
  title: string;
  note: string | null;
  organizer_name: string;
  created_at: string;
  is_admin: boolean;
  days: string[];
  me_id: string | null;
  responses: PollResponse[];
};

export class DbError extends Error {}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set");
  }
  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new DbError(body?.message ?? `${fn} failed (${res.status})`);
  }
  return (await res.json()) as T;
}

const SLUG_RE = /^[0-9a-f]{10}$/;
const TOKEN_RE = /^[0-9a-f]{48}$/;

export const isSlug = (s: string) => SLUG_RE.test(s);
export const isToken = (s: string | undefined): s is string => !!s && TOKEN_RE.test(s);

export async function getPoll(
  slug: string,
  editToken?: string,
  adminToken?: string,
): Promise<Poll | null> {
  if (!isSlug(slug)) return null;
  return rpc<Poll | null>("get_poll", {
    p_slug: slug,
    p_edit_token: isToken(editToken) ? editToken : null,
    p_admin_token: isToken(adminToken) ? adminToken : null,
  });
}

export async function createPoll(input: {
  title: string;
  note: string;
  organizer: string;
  days: string[];
}): Promise<{ slug: string; admin_token: string }> {
  const rows = await rpc<{ slug: string; admin_token: string }[]>("create_poll", {
    p_title: input.title,
    p_note: input.note,
    p_organizer: input.organizer,
    p_days: input.days,
  });
  return rows[0];
}

export async function submitResponse(
  slug: string,
  name: string,
  answers: Record<string, Answer>,
  adminToken?: string,
): Promise<string> {
  return rpc<string>("submit_response", {
    p_slug: slug,
    p_name: name,
    p_answers: answers,
    p_admin_token: isToken(adminToken) ? adminToken : null,
  });
}

export async function updateResponse(
  editToken: string,
  name: string,
  answers: Record<string, Answer>,
): Promise<boolean> {
  return rpc<boolean>("update_response", {
    p_edit_token: editToken,
    p_name: name,
    p_answers: answers,
  });
}

export async function deleteResponse(editToken: string): Promise<boolean> {
  return rpc<boolean>("delete_response", { p_edit_token: editToken });
}
