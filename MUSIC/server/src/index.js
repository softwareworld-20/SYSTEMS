import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { checkDb } from "./db.js";
import authRoutes from "./routes/auth.js";
import tracksRoutes from "./routes/tracks.js";
import albumsRoutes from "./routes/albums.js";
import requireAuth from "./requireAuth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4200;

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", async (req, res) => {
  let db = "ok";
  try {
    await checkDb();
  } catch (error) {
    db = "error";
    console.warn("No se pudo conectar con PostgreSQL.", error.message);
  }

  res.json({
    ok: true,
    service: "listen-u",
    name: "ListenU",
    tagline: "OWN VIBES",
    uptime: process.uptime(),
    db,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/tracks", requireAuth, tracksRoutes);
app.use("/api/albums", requireAuth, albumsRoutes);

// Cualquier ruta /api no definida arriba responde 404 en JSON.
// Las rutas nuevas de la API deben registrarse ANTES de este bloque.
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Endpoint no encontrado." });
});

// En producción servimos el build de React desde el mismo servidor.
const clientDist = path.resolve(__dirname, "../../client/dist");
if (existsSync(clientDist)) {
  // Los archivos de /assets llevan hash en el nombre: cache largo.
  app.use(
    "/assets",
    express.static(path.join(clientDist, "assets"), {
      immutable: true,
      maxAge: "1y",
    }),
  );
  app.use(express.static(clientDist));

  // Fallback SPA: solo para rutas sin extensión (no para /assets/x.js, /favicon.ico...).
  app.use((req, res, next) => {
    if (req.method !== "GET" || path.extname(req.path)) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((err, req, res, next) => {
  const status = err.status ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: status >= 500 ? "Error interno del servidor." : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`ListenU API escuchando en http://localhost:${PORT}`);
});