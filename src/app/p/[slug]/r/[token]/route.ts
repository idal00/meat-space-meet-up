import { NextResponse, type NextRequest } from "next/server";
import { getPoll, isToken } from "@/lib/db";
import { setEditToken } from "@/lib/session";

// Personal edit link: /p/<slug>/r/<token>. Remembers the token on this device
// and opens the edit page. Unknown tokens just land on the poll.
export async function GET(req: NextRequest, ctx: RouteContext<"/p/[slug]/r/[token]">) {
  const { slug, token } = await ctx.params;
  const poll = isToken(token) ? await getPoll(slug, token) : null;
  if (poll?.me_id) {
    await setEditToken(slug, token);
    return NextResponse.redirect(new URL(`/p/${slug}/edit`, req.url));
  }
  return NextResponse.redirect(new URL(poll ? `/p/${slug}` : "/", req.url));
}
