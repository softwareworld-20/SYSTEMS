import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { requireAdmin, validatePassword } from "./auth.js";
import adminRouter from "./routes/admin.js";
import authRouter from "./routes/auth.js";
import categoriesRouter from "./routes/categories.js";
import requestsRouter from "./routes/requests.js";
import statsRouter from "./routes/stats.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4000;

const app = express();

app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.use("/api/categories", categoriesRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/stats", statsRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", requireAdmin, adminRouter);

app.use("/api", (req, res) => {
  res.status(404).json({ error: "Endpoint no encontrado." });
});

// En producción servimos el build de React desde el mismo servidor.
const clientDist = path.resolve(__dirname, "../../client/dist");
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== "GET") return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((err, req, res, next) => {
  const status = err.status ?? 500;
  if (status >= 500) console.error(err);
  res
    .status(status)
    .json({ error: err.message || "Error interno del servidor." });
});

app.listen(PORT, () => {
  console.log(`AyudApp API escuchando en http://localhost:${PORT}`);

  if (!process.env.ADMIN_PASSWORD) {
    console.warn(
      "Panel /admin con credenciales de demostración (admin / Admin123). " +
        "Define ADMIN_USER, ADMIN_PASSWORD y AUTH_SECRET antes de publicar.",
    );
  }

  const passwordIssue = validatePassword(
    process.env.ADMIN_PASSWORD || "Admin123",
  );
  if (passwordIssue) {
    console.warn(`ADMIN_PASSWORD no cumple la política: ${passwordIssue}`);
  }
});
