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
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    // In production this is a critical misconfiguration — tokens can be forged
    // using the known fallback value visible in the public repository.
    if (process.env.NODE_ENV === "production") {
      console.error("[auth] FATAL: ADMIN_SECRET env var is not set. Refusing to sign/verify tokens with the insecure fallback in production.");
      throw new Error("[auth] ADMIN_SECRET env var is not set. Refusing to sign/verify tokens with the insecure fallback in production.");
    }
    console.warn("[auth] WARNING: ADMIN_SECRET is not set. Using insecure fallback — set this env var before deploying.");
  } else {
    console.log("[auth] getKey: ADMIN_SECRET is set (length=" + secret.length + ")");
  }
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret ?? "rotary-rist-2026-fallback-secret"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createToken(username: string): Promise<string> {
  console.log("[auth] createToken: signing token for user:", username);
  const payloadBytes = new TextEncoder().encode(
    JSON.stringify({ sub: username, exp: Date.now() + 8 * 60 * 60 * 1000 })
  );
  const payloadB64 = base64url(payloadBytes);
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  console.log("[auth] createToken: token created successfully for user:", username);
  return `${payloadB64}.${base64url(new Uint8Array(sig))}`;
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) { console.warn("[auth] verifyToken: malformed token (no dot)"); return null; }
    const payloadB64 = token.slice(0, dot);
    const sigB64 = token.slice(dot + 1);
    const key = await getKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64url(sigB64),
      new TextEncoder().encode(payloadB64)
    );
    if (!valid) { console.warn("[auth] verifyToken: signature invalid"); return null; }
    const data = JSON.parse(new TextDecoder().decode(fromBase64url(payloadB64)));
    if (data.exp < Date.now()) {
      console.warn("[auth] verifyToken: token expired at", new Date(data.exp).toISOString());
      return null;
    }
    console.log("[auth] verifyToken: valid token for user:", data.sub, "expires:", new Date(data.exp).toISOString());
    return data.sub as string;
  } catch (err) {
    console.error("[auth] verifyToken: threw unexpectedly:", err);
    return null;
  }
}

// NOTE: verifyAdminCredentials (scrypt, fs) must be imported directly from
// admin-config in Node.js-only route handlers — NOT here, as this file is
// also bundled for the Edge proxy runtime which has no Node.js built-ins.
