// server/src/routes/auth.js
import { Router } from "express";
import { query } from "../db.js";
import { createToken, tokenTtlSeconds } from "../auth.js";
import requireAuth from "../requireAuth.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body ?? {};

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !username.trim() ||
    !password
  ) {
    return res.status(400).json({ error: "Usuario y contraseña son obligatorios." });
  }
  if (username.length > 80 || password.length > 200) {
    return res.status(400).json({ error: "Credenciales demasiado largas." });
  }

  // crypt($2, password_hash) = password_hash compara contra el hash bcrypt de pgcrypto.
  const { rows } = await query(
    `SELECT id, username, crypt($2, password_hash) = password_hash AS ok
       FROM app_users
      WHERE username = $1`,
    [username.trim(), password],
  );

  const user = rows[0];
  if (!user?.ok) {
    return res.status(401).json({ error: "Credenciales incorrectas." });
  }

  res.json({
    token: createToken(user),
    username: user.username,
    expiresIn: tokenTtlSeconds,
  });
});

router.get("/session", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
