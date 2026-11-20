// server/src/requireAuth.js
import { verifyToken } from "./auth.js";

export default function requireAuth(req, res, next) {
  const header = req.get("authorization") || "";
  const [scheme, token] = header.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return res.status(401).json({ error: "Se requiere una sesión válida." });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: "Sesión caducada o inválida." });
  }

  req.user = user;
  next();
}
