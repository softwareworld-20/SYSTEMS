import { Router } from "express";
import {
  AUTH_CONFIG,
  checkCredentials,
  createToken,
  requireAdmin,
  validatePassword,
} from "../auth.js";
import { httpError, text } from "../validation.js";

const router = Router();

router.post("/login", (req, res) => {
  const body = req.body ?? {};
  const username = text(body.username, "usuario", { max: 80 });
  const password = body.password;

  const policyError = validatePassword(password);
  if (policyError) throw httpError(400, policyError);

  if (!checkCredentials(username, password)) {
    throw httpError(401, "Usuario o contraseña incorrectos.");
  }

  const token = createToken(username);

  res.json({
    token,
    user: { name: username },
    expiresIn: AUTH_CONFIG.tokenTtlSeconds,
  });
});

router.get("/session", requireAdmin, (req, res) => {
  res.json({ user: { name: req.adminUser } });
});

router.get("/config", (req, res) => {
  res.json({ passwordMax: AUTH_CONFIG.passwordMax });
});

export default router;
