import { createHmac, timingSafeEqual } from "crypto";

/**
 * Nattevakten-chat — signed session cookie (closes the IDOR in history/poll).
 *
 * Identity model: the visitor *claims* an e-mail when starting a chat
 * (handover or first send). The server then issues an HttpOnly cookie
 * `vk-chat` = base64url(email) + "." + HMAC-SHA256(email, secret).
 * The read endpoints (/api/chat/history, /api/chat/poll) accept the e-mail
 * ONLY from a valid cookie — never from query or body — so nobody can read
 * another visitor's conversation by guessing an address.
 *
 * Secret: CHAT_SESSION_SECRET from env. If it is not set we fall back to a
 * derivation of SUPABASE_SERVICE_ROLE_KEY (HMAC of a fixed label) so the
 * feature works without new env plumbing. NOTE the consequence: rotating
 * the service-role key then invalidates all chat cookies — visitors simply
 * get a fresh cookie on their next send, no data is lost.
 */

const COOKIE_NAME = "vk-chat";
const COOKIE_MAX_AGE_S = 60 * 60 * 24 * 180; // ~6 months

function getSecret(): string | null {
  const explicit = process.env.CHAT_SESSION_SECRET;
  if (explicit) return explicit;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  // Derived secret — see header comment for the rotation caveat.
  return createHmac("sha256", serviceKey)
    .update("vk-chat-session-v1")
    .digest("hex");
}

function sign(email: string, secret: string): string {
  return createHmac("sha256", secret).update(email).digest("hex");
}

/** Build the cookie VALUE for a verified-claimed e-mail (null = no secret env). */
export function signChatSession(email: string): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const payload = Buffer.from(email, "utf8").toString("base64url");
  return `${payload}.${sign(email, secret)}`;
}

/** Cookie attributes shared by every route that issues the session.
 *  secure only in production — an unconditional true means the cookie is
 *  never set on http://localhost and chat sessions silently fail in dev. */
export const chatCookieOptions = {
  name: COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: COOKIE_MAX_AGE_S,
};

/**
 * Extract and verify the chat session from a Request. Returns the e-mail
 * on success, null on missing/garbled/forged cookie. Constant-time MAC
 * comparison — no oracle for signature guessing.
 */
export function verifyChatSession(req: Request): string | null {
  const secret = getSecret();
  if (!secret) return null;

  const header = req.headers.get("cookie");
  if (!header) return null;
  let raw: string | null = null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === COOKIE_NAME) {
      raw = part.slice(eq + 1).trim();
      break;
    }
  }
  if (!raw) return null;

  const dot = raw.lastIndexOf(".");
  if (dot === -1) return null;
  const payload = raw.slice(0, dot);
  const mac = raw.slice(dot + 1);

  let email: string;
  try {
    email = Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (!email || email.length > 320) return null;

  const expected = sign(email, secret);
  const a = Buffer.from(mac, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;

  return email;
}
