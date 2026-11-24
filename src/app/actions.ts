"use server";

import { redirect } from "next/navigation";
import {
  createPoll as dbCreatePoll,
  submitResponse as dbSubmit,
  updateResponse as dbUpdate,
  deleteResponse as dbDelete,
  DbError,
  isSlug,
  isToken,
  type Answer,
} from "@/lib/db";
import { clearEditToken, getTokens, setAdminToken, setEditToken } from "@/lib/session";

export type FormState = { error?: string };

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

function text(fd: FormData, key: string, max: number) {
  const v = String(fd.get(key) ?? "").trim();
  return v.length > max ? null : v;
}

function parseJson(raw: FormDataEntryValue | null): unknown {
  try {
    return JSON.parse(String(raw ?? ""));
  } catch {
    return null;
  }
}

function parseAnswers(raw: FormDataEntryValue | null): Record<string, Answer> | null {
  const v = parseJson(raw);
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const out: Record<string, Answer> = {};
  for (const [k, a] of Object.entries(v)) {
    if (!ISO_RE.test(k) || (a !== "y" && a !== "m" && a !== "n")) return null;
    out[k] = a;
  }
  return out;
}

function message(e: unknown) {
  if (e instanceof DbError) return "Could not save: " + e.message;
  throw e;
}

export async function createPoll(_: FormState, fd: FormData): Promise<FormState> {
  const title = text(fd, "title", 120);
  const organizer = text(fd, "organizer", 60);
  const note = text(fd, "note", 500);
  const days = parseJson(fd.get("days"));
  if (!title) return { error: "Give the poll a title (max 120 characters)." };
  if (!organizer) return { error: "Enter your name (max 60 characters)." };
  if (note === null) return { error: "The note can be at most 500 characters." };
  if (
    !Array.isArray(days) ||
    days.length < 1 ||
    days.length > 60 ||
    !days.every((d) => typeof d === "string" && ISO_RE.test(d))
  ) {
    return { error: "Pick between 1 and 60 dates." };
  }
  let slug: string;
  try {
    const res = await dbCreatePoll({ title, organizer, note, days });
    slug = res.slug;
    await setAdminToken(slug, res.admin_token);
  } catch (e) {
    return { error: message(e) };
  }
  redirect(`/p/${slug}/share`);
}

export async function submitResponse(slug: string, _: FormState, fd: FormData): Promise<FormState> {
  if (!isSlug(slug)) return { error: "Unknown poll." };
  const name = text(fd, "name", 60);
  const answers = parseAnswers(fd.get("answers"));
  if (!name) return { error: "Enter your name (max 60 characters)." };
  if (!answers) return { error: "Answer every date." };
  try {
    const { admin } = await getTokens(slug);
    const token = await dbSubmit(slug, name, answers, admin);
    await setEditToken(slug, token);
  } catch (e) {
    return { error: message(e) };
  }
  redirect(`/p/${slug}/results?saved=1`);
}

export async function updateResponse(slug: string, _: FormState, fd: FormData): Promise<FormState> {
  if (!isSlug(slug)) return { error: "Unknown poll." };
  const name = text(fd, "name", 60);
  const answers = parseAnswers(fd.get("answers"));
  if (!name) return { error: "Enter your name (max 60 characters)." };
  if (!answers) return { error: "Answer every date." };
  const { edit } = await getTokens(slug);
  if (!isToken(edit)) return { error: "This device has no response to edit. Use your personal edit link." };
  try {
    const ok = await dbUpdate(edit, name, answers);
    if (!ok) return { error: "Your response no longer exists." };
  } catch (e) {
    return { error: message(e) };
  }
  redirect(`/p/${slug}/results?saved=1`);
}

export async function deleteResponse(slug: string): Promise<void> {
  if (!isSlug(slug)) return;
  const { edit } = await getTokens(slug);
  if (isToken(edit)) await dbDelete(edit);
  await clearEditToken(slug);
  redirect(`/p/${slug}/results`);
}
