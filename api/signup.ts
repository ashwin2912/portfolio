/**
 * POST /api/signup: stores a reader sign-up from the post-page prompt
 * (src/SignupPrompt.tsx) in the Neon `signups` table. Needs DATABASE_URL,
 * which the Vercel–Neon integration sets.
 */
import { neon } from "@neondatabase/serverless";

const ROLES = ["explorer", "allocator", "other"] as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trimmed string capped at `max` chars, or null when empty or not a string. */
function text(value: unknown, max = 500): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim().slice(0, max);
  return t || null;
}

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot: real readers never see this field, so pretend success to bots.
  if (text(body.website)) return Response.json({ ok: true });

  const role = body.role as (typeof ROLES)[number];
  const email = text(body.email, 254);
  if (!ROLES.includes(role)) {
    return Response.json({ error: "Invalid role" }, { status: 400 });
  }
  if (!email || !EMAIL.test(email)) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    insert into signups (role, email, name, firm, note, newsletter, source_post)
    values (
      ${role},
      ${email.toLowerCase()},
      ${text(body.name, 200)},
      ${text(body.firm, 200)},
      ${text(body.note, 2000)},
      ${body.newsletter === true},
      ${text(body.sourcePost, 200)}
    )
  `;
  return Response.json({ ok: true });
}
