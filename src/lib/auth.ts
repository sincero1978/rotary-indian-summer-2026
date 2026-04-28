// Edge-compatible auth using Web Crypto API (works in middleware + Node.js route handlers)

function base64url(data: Uint8Array): string {
  let str = "";
  for (const byte of data) str += String.fromCharCode(byte);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function fromBase64url(str: string): ArrayBuffer {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (padded.length % 4)) % 4;
  const b64 = padded + "=".repeat(pad);
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer as ArrayBuffer;
}

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.ADMIN_SECRET ?? "rotary-rist-2026-fallback-secret";
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createToken(username: string): Promise<string> {
  const payloadBytes = new TextEncoder().encode(
    JSON.stringify({ sub: username, exp: Date.now() + 8 * 60 * 60 * 1000 })
  );
  const payloadB64 = base64url(payloadBytes);
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${base64url(new Uint8Array(sig))}`;
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const payloadB64 = token.slice(0, dot);
    const sigB64 = token.slice(dot + 1);
    const key = await getKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64url(sigB64),
      new TextEncoder().encode(payloadB64)
    );
    if (!valid) return null;
    const data = JSON.parse(new TextDecoder().decode(fromBase64url(payloadB64)));
    if (data.exp < Date.now()) return null;
    return data.sub as string;
  } catch {
    return null;
  }
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const { verifyAdminCredentials } = await import("./admin-config");
  return verifyAdminCredentials(username, password);
}
