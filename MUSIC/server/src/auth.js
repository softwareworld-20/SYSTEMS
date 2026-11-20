// server/src/auth.js
// Tokens HMAC de demostración para la API. No son seguridad de producción.
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

const TTL_SECONDS = 8 * 60 * 60;

if (!process.env.AUTH_SECRET) {
  console.warn(
    "AUTH_SECRET no definido: se usa un secreto efímero; las sesiones se invalidan al reiniciar.",
  );
}
const SECRET = process.env.AUTH_SECRET || randomBytes(32).toString("hex");

const encode = value => Buffer.from(value).toString("base64url");
const decode = value => Buffer.from(value, "base64url").toString("utf8");
const sign = payload => createHmac("sha256", SECRET).update(payload).digest("base64url");

export const tokenTtlSeconds = TTL_SECONDS;

export function createToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const payload = encode(
    JSON.stringify({
      sub: user.id,
      username: user.username,
      iat: now,
      exp: now + TTL_SECONDS,
      jti: randomUUID(),
    }),
  );
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token) {
  if (typeof token !== "string") return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || token.split(".").length !== 2) return null;

  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;

  try {
    const claims = JSON.parse(decode(payload));
    if (!claims.sub || !claims.username || !Number.isFinite(claims.exp)) return null;
    if (claims.exp <= Math.floor(Date.now() / 1000)) return null;
    return { id: claims.sub, username: claims.username };
  } catch {
    return null;
  }
}
