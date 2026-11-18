import { Router } from "express";
import {
  AUTH_CONFIG,
  checkCredentials,
  createToken,
  requireAdmin,
  validateEmail,
  validatePassword,
} from "../auth.js";

const router = Router();

router.post("/login", (req, res) => {
  const body = req.body ?? {};
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = body.password;

  const emailError = validateEmail(email);
  if (emailError) {
    res.status(400).json({ error: emailError });
    return;
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    res.status(400).json({ error: passwordError });
    return;
  }

  if (!checkCredentials(email, password)) {
    res.status(401).json({ error: "Correo o contraseña incorrectos." });
    return;
  }

  res.json({
    token: createToken(email),
    user: { email },
    expiresIn: AUTH_CONFIG.tokenTtlSeconds,
  });
});

router.get("/session", requireAdmin, (req, res) => {
  res.json({ user: { email: req.adminEmail } });
});

router.get("/config", (req, res) => {
  res.json({ passwordMax: AUTH_CONFIG.passwordMax });
});

export default router;
