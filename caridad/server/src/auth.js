import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const PASSWORD_MAX = 8;
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;
const SECRET =
  process.env.AUTH_SECRET || "ayudapp-dev-secret-change-me-please";

const encode = (value) => Buffer.from(value).toString("base64url");
const sign = (value) => createHmac("sha256", SECRET).update(value).digest("base64url");

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Política de contraseña: máximo 8 caracteres y ninguno repetido. */
export function validatePassword(password) {
  if (typeof password !== "string" || password.length === 0) {
    return "Escribe tu contraseña.";
  }
  if (password.length > PASSWORD_MAX) {
    return `La contraseña no puede superar los ${PASSWORD_MAX} caracteres.`;
  }
  if (new Set(password).size !== password.length) {
    return "La contraseña no puede repetir caracteres.";
  }
  return null;
}

export function checkCredentials(username, password) {
  const expectedUser = process.env.ADMIN_USER || "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD || "Admin123";

  const userOk = safeEqual(username ?? "", expectedUser);
  const passwordOk = safeEqual(password ?? "", expectedPassword);
  return userOk && passwordOk;
}

export function createToken(username) {
  const payload = encode(
    JSON.stringify({
      sub: username,
      exp: Date.now() + TOKEN_TTL_MS,
      jti: randomUUID(),
    }),
  );

  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token) {
  if (typeof token !== "string") return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (!safeEqual(signature, sign(payload))) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!data.exp || data.exp < Date.now()) return null;
    return data.sub ?? null;
  } catch {
    return null;
  }
}

/** Middleware que protege las rutas de administración. */
export function requireAdmin(req, res, next) {
  const header = req.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ error: "Necesitas iniciar sesión." });
    return;
  }

  const username = verifyToken(token);
  if (!username) {
    res.status(401).json({ error: "Sesión no válida o expirada." });
    return;
  }

  req.adminUser = username;
  next();
}

export const AUTH_CONFIG = {
  passwordMax: PASSWORD_MAX,
  tokenTtlSeconds: TOKEN_TTL_MS / 1000,
};
