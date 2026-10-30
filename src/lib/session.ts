// Signed admin session token. Uses Web Crypto only, so it runs in both proxy and server code.

export const SESSION_COOKIE = "volae_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds

// Set ADMIN_SECRET in production. The fallback only exists so the app runs out of the box.
const SECRET = process.env.ADMIN_SECRET || "dev-only-change-me-set-ADMIN_SECRET";

const encoder = new TextEncoder();

function getKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = "";
  for (const b of new Uint8Array(bytes)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  try {
    const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

export async function createSessionToken(): Promise<string> {
  const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = `admin.${expires}`;
  const signature = await crypto.subtle.sign("HMAC", await getKey(), encoder.encode(payload));
  return `${payload}.${toBase64Url(signature)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "admin" || !/^\d+$/.test(parts[1])) return false;
  if (Number(parts[1]) < Math.floor(Date.now() / 1000)) return false;
  const signature = fromBase64Url(parts[2]);
  if (!signature) return false;
  // crypto.subtle.verify compares in constant time.
  return crypto.subtle.verify(
    "HMAC",
    await getKey(),
    signature,
    encoder.encode(`${parts[0]}.${parts[1]}`),
  );
}
