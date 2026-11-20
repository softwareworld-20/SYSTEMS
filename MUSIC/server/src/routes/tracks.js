// server/src/routes/tracks.js
import { randomUUID } from "node:crypto";
import { Router } from "express";
import multer from "multer";
import { pool, query } from "../db.js";
import { audioMime, isAudioFile } from "../audio.js";

const router = Router();

const MAX_FILES = 20;
const MAX_FILE_BYTES = 100 * 1024 * 1024;
const MAX_COVER_CHARS = 2_000_000;
const PUBLIC_COLUMNS =
  "id, title, artist, album, cover, duration, file_name, mime, size, added_at, updated_at";

const DEFAULTS = { artist: "Artista desconocido", album: "—" };
const EDITABLE = new Map([
  ["title", 200],
  ["artist", 120],
  ["album", 120],
]);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: MAX_FILES, fileSize: MAX_FILE_BYTES, fields: 4, fieldSize: MAX_COVER_CHARS },
  fileFilter: (req, file, cb) => {
    if (isAudioFile(file)) cb(null, true);
    else cb(new HttpError(400, `Formato de audio no admitido: ${file.originalname}`));
  },
});

// Los errores de multer llegan como middleware: los convertimos a JSON en español.
const handleUpload = (req, res, next) => {
  upload.array("files", MAX_FILES)(req, res, error => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: `Cada archivo puede tener hasta ${MAX_FILE_BYTES / 1024 / 1024} MB.` });
      }
      if (error.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({ error: `Puedes subir hasta ${MAX_FILES} archivos a la vez.` });
      }
      return res.status(400).json({ error: "No se pudo procesar la subida." });
    }
    next(error);
  });
};

const toPublic = row => ({
  id: row.id,
  title: row.title,
  artist: row.artist,
  album: row.album,
  cover: row.cover ?? null,
  duration: row.duration ?? null,
  fileName: row.file_name ?? row.fileName ?? null,
  mime: row.mime,
  size: Number(row.size),
  addedAt: row.added_at ?? row.addedAt ?? null,
  updatedAt: row.updated_at ?? row.updatedAt ?? null,
});

const text = value => (typeof value === "string" ? value.trim() : "");
const validCover = value =>
  typeof value === "string" && value.startsWith("data:image/")
    ? value.slice(0, MAX_COVER_CHARS)
    : null;
const finiteDuration = value => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

function parseMetadata(req, files) {
  let raw = [];
  const field = req.body?.metadata;

  if (typeof field === "string" && field.trim()) {
    try {
      const parsed = JSON.parse(field);
      if (!Array.isArray(parsed)) throw new Error("metadata no es un array");
      raw = parsed;
    } catch {
      throw new HttpError(400, "El campo metadata debe ser un JSON válido.");
    }
  }

  if (raw.length && raw.length !== files.length) {
    throw new HttpError(400, "La metadata debe tener el mismo número de archivos.");
  }

  return files.map((file, index) => {
    const meta = raw[index] ?? {};
    return {
      id: randomUUID(),
      title: text(meta.title).slice(0, 200) || file.originalname.replace(/\.[^.]+$/, ""),
      artist: text(meta.artist).slice(0, 120) || DEFAULTS.artist,
      album: text(meta.album).slice(0, 120) || DEFAULTS.album,
      cover: validCover(meta.cover),
      duration: finiteDuration(meta.duration),
      file_name: file.originalname,
      mime: audioMime(file),
      size: file.size,
      data: file.buffer,
    };
  });
}

router.get("/", async (req, res) => {
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS} FROM tracks
      WHERE owner_id = $1
      ORDER BY lower(title), lower(artist), id`,
    [req.user.id],
  );
  res.json(rows.map(toPublic));
});

router.post("/", handleUpload, async (req, res) => {
  const files = req.files ?? [];
  if (!files.length) throw new HttpError(400, "Selecciona al menos un archivo de audio.");

  const items = parseMetadata(req, files);
  const client = await pool.connect();
  const created = [];

  try {
    await client.query("BEGIN");
    for (const item of items) {
      const { rows } = await client.query(
        `INSERT INTO tracks
           (id, owner_id, title, artist, album, cover, duration, file_name, mime, size, data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING ${PUBLIC_COLUMNS}`,
        [
          item.id,
          req.user.id,
          item.title,
          item.artist,
          item.album,
          item.cover,
          item.duration,
          item.file_name,
          item.mime,
          item.size,
          item.data,
        ],
      );
      created.push(rows[0]);
    }
    await client.query("COMMIT");
    res.status(201).json(created.map(toPublic));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

router.get("/:id/audio", async (req, res) => {
  const { rows } = await query(
    "SELECT data, mime, size FROM tracks WHERE id = $1 AND owner_id = $2",
    [req.params.id, req.user.id],
  );
  const track = rows[0];
  if (!track) throw new HttpError(404, "Canción no encontrada.");

  const bytes = track.data;
  const size = bytes?.length ?? 0;
  res.setHeader("Content-Type", track.mime || "application/octet-stream");
  res.setHeader("Accept-Ranges", "bytes");

  const range = req.get("range");
  const match = range ? /^bytes=(\d*)-(\d*)$/.exec(range) : null;

  if (range && !match) {
    res.setHeader("Content-Range", `bytes */${size}`);
    return res.status(416).end();
  }

  if (match) {
    let start;
    let end;
    if (!match[1] && match[2]) {
      start = Math.max(0, size - Number(match[2]));
      end = size - 1;
    } else {
      start = Number(match[1] || 0);
      end = match[2] ? Number(match[2]) : size - 1;
    }
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) {
      res.setHeader("Content-Range", `bytes */${size}`);
      return res.status(416).end();
    }
    end = Math.min(end, size - 1);
    res.status(206);
    res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
    res.setHeader("Content-Length", end - start + 1);
    return res.end(bytes.subarray(start, end + 1));
  }

  res.setHeader("Content-Length", size);
  res.end(bytes ?? Buffer.alloc(0));
});

router.patch("/:id", async (req, res) => {
  const body = req.body ?? {};
  const sets = [];
  const values = [];

  for (const [column, maxLength] of EDITABLE) {
    if (body[column] === undefined) continue;
    if (typeof body[column] !== "string") {
      throw new HttpError(400, `${column} debe ser texto.`);
    }
    const value = body[column].trim();
    if (column === "title" && !value) throw new HttpError(400, "El título no puede estar vacío.");
    sets.push(`${column} = $${values.length + 1}`);
    values.push(value.slice(0, maxLength) || DEFAULTS[column]);
  }

  if ("cover" in body) {
    sets.push(`cover = $${values.length + 1}`);
    values.push(validCover(body.cover));
  }

  if (!sets.length) throw new HttpError(400, "No hay campos para actualizar.");

  values.push(req.params.id, req.user.id);
  const { rows } = await query(
    `UPDATE tracks SET ${sets.join(", ")}, updated_at = now()
      WHERE id = $${values.length - 1} AND owner_id = $${values.length}
      RETURNING ${PUBLIC_COLUMNS}`,
    values,
  );

  if (!rows.length) throw new HttpError(404, "Canción no encontrada.");
  res.json(toPublic(rows[0]));
});

router.delete("/:id", async (req, res) => {
  const { rowCount } = await query(
    "DELETE FROM tracks WHERE id = $1 AND owner_id = $2",
    [req.params.id, req.user.id],
  );
  if (!rowCount) throw new HttpError(404, "Canción no encontrada.");
  res.status(204).end();
});

export default router;
