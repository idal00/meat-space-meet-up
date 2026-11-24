import { cookies, headers } from "next/headers";

// Per-poll cookies. mm_r_<slug>: the visitor's edit token for their response.
// mm_a_<slug>: the organizer's admin token (set when the poll is created).
const editKey = (slug: string) => `mm_r_${slug}`;
const adminKey = (slug: string) => `mm_a_${slug}`;

const options = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export async function getTokens(slug: string) {
  const c = await cookies();
  return { edit: c.get(editKey(slug))?.value, admin: c.get(adminKey(slug))?.value };
}

export async function setEditToken(slug: string, token: string) {
  (await cookies()).set(editKey(slug), token, options);
}

export async function clearEditToken(slug: string) {
  (await cookies()).delete(editKey(slug));
}

export async function setAdminToken(slug: string, token: string) {
  (await cookies()).set(adminKey(slug), token, options);
}

export async function getOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
