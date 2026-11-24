import { NextResponse, type NextRequest } from "next/server";
import { getPoll, isToken } from "@/lib/db";
import { setAdminToken } from "@/lib/session";

// Organizer's admin link: /p/<slug>/a/<token>. Remembers the admin token on
// this device and opens the manage page. Unknown tokens just land on the poll.
export async function GET(req: NextRequest, ctx: RouteContext<"/p/[slug]/a/[token]">) {
  const { slug, token } = await ctx.params;
  const poll = isToken(token) ? await getPoll(slug, undefined, token) : null;
  if (poll?.is_admin) {
    await setAdminToken(slug, token);
    return NextResponse.redirect(new URL(`/p/${slug}/manage`, req.url));
  }
  return NextResponse.redirect(new URL(poll ? `/p/${slug}` : "/", req.url));
}
