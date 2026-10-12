// @ts-nocheck
/**
 * Pengganti pustaka "web-push" memakai WebCrypto, agar bisa berjalan di server Lovable.
 * Mendukung: generateVAPIDKeys, setVapidDetails, sendNotification (aes128gcm, RFC 8291 + VAPID).
 */
const te = new TextEncoder();

const b64u = (buf) => {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const dariB64u = (str) => {
  const s = String(str).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "===".slice((s.length + 3) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};
const gabung = (...bagian) => {
  const n = bagian.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(n);
  let o = 0;
  for (const b of bagian) {
    out.set(b, o);
    o += b.length;
  }
  return out;
};

let vapid = null;

async function generateVAPIDKeys() {
  const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const pub = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
  const jwk = await crypto.subtle.exportKey("jwk", kp.privateKey);
  return { publicKey: b64u(pub), privateKey: jwk.d };
}

function setVapidDetails(subject, publicKey, privateKey) {
  vapid = { subject, publicKey, privateKey };
}

async function kunciPrivatVapid() {
  const pub = dariB64u(vapid.publicKey);
  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: b64u(pub.slice(1, 33)),
    y: b64u(pub.slice(33, 65)),
    d: vapid.privateKey,
    ext: true,
  };
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
}

async function tokenVapid(endpoint) {
  const aud = new URL(endpoint).origin;
  const kepala = b64u(te.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const isi = b64u(
    te.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: vapid.subject })),
  );
  const masukan = `${kepala}.${isi}`;
  const tanda = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, await kunciPrivatVapid(), te.encode(masukan));
  return `${masukan}.${b64u(tanda)}`;
}

async function hkdf(salt, ikm, info, panjang) {
  const k = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, k, panjang * 8));
}

async function enkripsi(langganan, teks) {
  const uaPub = dariB64u(langganan.keys.p256dh);
  const authSecret = dariB64u(langganan.keys.auth);
  const lokal = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", lokal.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const rahasia = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, lokal.privateKey, 256));
  const ikm = await hkdf(authSecret, rahasia, gabung(te.encode("WebPush: info\0"), uaPub, asPub), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, te.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, te.encode("Content-Encoding: nonce\0"), 12);
  const kunci = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const polos = gabung(te.encode(teks), new Uint8Array([2]));
  const sandi = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, kunci, polos));
  const rs = new Uint8Array([0, 0, 16, 0]); // 4096
  return gabung(salt, rs, new Uint8Array([asPub.length]), asPub, sandi);
}

async function sendNotification(langganan, teks, opsi = {}) {
  if (!vapid) throw new Error("Kunci VAPID belum disiapkan.");
  const badan = await enkripsi(langganan, typeof teks === "string" ? teks : JSON.stringify(teks));
  const jwt = await tokenVapid(langganan.endpoint);
  const jawab = await fetch(langganan.endpoint, {
    method: "POST",
    headers: {
      TTL: String(opsi.TTL ?? 2419200),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      Urgency: "high",
      Authorization: `vapid t=${jwt}, k=${vapid.publicKey}`,
    },
    body: badan,
  });
  if (!jawab.ok) {
    const e = new Error(`Push ditolak (${jawab.status}): ${await jawab.text().catch(() => "")}`);
    e.statusCode = jawab.status;
    throw e;
  }
  return { statusCode: jawab.status };
}

export default { generateVAPIDKeys, setVapidDetails, sendNotification };
