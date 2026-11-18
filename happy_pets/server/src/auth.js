import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const PASSWORD_MAX = 8;
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;
const SECRET =
  process.env.AUTH_SECRET || "happy-pets-dev-secret-change-me-please";
const DEFAULT_EMAIL = "admin@happypets.com";
const DEFAULT_PASSWORD = "Admin123";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const encode = (value) => Buffer.from(value).toString("base64url");
const sign = (value) =>
  createHmac("sha256", SECRET).update(value).digest("base64url");

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function validateEmail(email) {
  if (typeof email !== "string" || !email.trim()) {
    return "Escribe tu correo electrónico.";
  }
  if (!EMAIL_PATTERN.test(email.trim())) {
    return "Escribe un correo electrónico válido.";
  }
  return null;
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

export function checkCredentials(email, password) {
  const expectedEmail = (process.env.ADMIN_EMAIL || DEFAULT_EMAIL)
    .trim()
    .toLowerCase();
  const expectedPassword = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;

  const emailOk = safeEqual(email.trim().toLowerCase(), expectedEmail);
  const passwordOk = safeEqual(password ?? "", expectedPassword);
  return emailOk && passwordOk;
}

export function createToken(email) {
  const payload = encode(
    JSON.stringify({
      sub: email,
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

/** Middleware que protege futuras rutas privadas de administración. */
export function requireAdmin(req, res, next) {
  const header = req.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ error: "Necesitas iniciar sesión." });
    return;
  }

  const email = verifyToken(token);
  if (!email) {
    res.status(401).json({ error: "Sesión no válida o expirada." });
    return;
  }

  req.adminEmail = email;
  next();
}

export const AUTH_CONFIG = {
  passwordMax: PASSWORD_MAX,
  tokenTtlSeconds: TOKEN_TTL_MS / 1000,
};
