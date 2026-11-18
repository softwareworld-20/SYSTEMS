import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { requireAdmin } from "./auth.js";
import adoptionsRouter from "./routes/adoptions.js";
import authRouter from "./routes/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4100;

const app = express();

app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "6mb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "happy-pets", uptime: process.uptime() });
});

app.use("/api/auth", authRouter);
app.use("/api/admin/adoptions", requireAdmin, adoptionsRouter);

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
  console.log(`Happy Pets API escuchando en http://localhost:${PORT}`);
});
