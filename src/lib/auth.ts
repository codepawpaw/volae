import "server-only";
import { timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  verifySessionToken,
} from "./session";


function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Checks against ADMIN_USERNAME / ADMIN_PASSWORD. Login is refused while either is unset. */
export function checkCredentials(username: string, password: string): boolean {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedUsername || !expectedPassword) return false;
  const userOk = safeEqual(username, expectedUsername);
  const passOk = safeEqual(password, expectedPassword);
  return userOk && passOk;
}

/** True when the browser reached the site over HTTPS (Origin is sent with every server action). */
async function isHttps(): Promise<boolean> {
  const h = await headers();
  return (h.get("origin") ?? "").startsWith("https://") || h.get("x-forwarded-proto") === "https";
}

export async function startSession() {
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    // Safari drops Secure cookies on plain http (even localhost), so only mark it
    // Secure when the site is actually served over HTTPS.
    secure: await isHttps(),
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  // Token expiry is checked against the current time, so this must run per request.
  await connection();
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Call at the top of every admin page and server action. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
