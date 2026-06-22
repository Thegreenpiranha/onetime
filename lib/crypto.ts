// All cryptography runs in the browser. The server never holds keys or plaintext.
// AES-256-GCM is authenticated encryption — tampering with the ciphertext fails decryption.

const ALGO = "AES-GCM";
const KEY_LENGTH_BITS = 256;
const IV_LENGTH_BYTES = 12;

export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: ALGO, length: KEY_LENGTH_BITS },
    true, // extractable — must be, so we can put it in the URL fragment
    ["encrypt", "decrypt"],
  );
}

export async function exportKeyB64(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return base64urlEncode(new Uint8Array(raw));
}

export async function importKeyB64(b64: string): Promise<CryptoKey> {
  const raw = base64urlDecode(b64);
  return crypto.subtle.importKey(
    "raw",
    raw as BufferSource,
    { name: ALGO, length: KEY_LENGTH_BITS },
    false,
    ["decrypt"],
  );
}

export async function encrypt(
  plaintext: Uint8Array,
  key: CryptoKey,
): Promise<{ ciphertext: Uint8Array; iv: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const ct = await crypto.subtle.encrypt(
    { name: ALGO, iv: iv as BufferSource },
    key,
    plaintext as BufferSource,
  );
  return { ciphertext: new Uint8Array(ct), iv };
}

export async function decrypt(
  ciphertext: Uint8Array,
  iv: Uint8Array,
  key: CryptoKey,
): Promise<Uint8Array> {
  const pt = await crypto.subtle.decrypt(
    { name: ALGO, iv: iv as BufferSource },
    key,
    ciphertext as BufferSource,
  );
  return new Uint8Array(pt);
}

// base64url (no padding, URL-safe). Used to put bytes in URL fragments and JSON.
export function base64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64urlDecode(s: string): Uint8Array {
  const padded = s
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(s.length + ((4 - (s.length % 4)) % 4), "=");
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
