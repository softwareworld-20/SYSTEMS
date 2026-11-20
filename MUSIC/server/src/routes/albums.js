// server/src/routes/albums.js
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

const MAX_COVER_CHARS = 2_000_000;

const validCover = value =>
  typeof value === "string" && value.startsWith("data:image/")
    ? value.slice(0, MAX_COVER_CHARS)
    : null;

router.get("/", async (req, res) => {
  const { rows } = await query(
    `SELECT album, cover, description
       FROM album_meta
      WHERE owner_id = $1
      ORDER BY lower(album)`,
    [req.user.id],
  );
  res.json(rows);
});

// Upsert: la carátula/descriptión de un álbum es propiedad del usuario.
router.patch("/", async (req, res) => {
  const { album, cover, description } = req.body ?? {};

  if (typeof album !== "string" || !album.trim() || album.length > 120) {
    return res.status(400).json({ error: "El nombre del álbum no es válido." });
  }
  if (description !== undefined && typeof description !== "string") {
    return res.status(400).json({ error: "La descripción debe ser texto." });
  }

  const { rows } = await query(
    `INSERT INTO album_meta (owner_id, album, cover, description)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (owner_id, album) DO UPDATE
       SET cover = EXCLUDED.cover,
           description = EXCLUDED.description,
           updated_at = now()
     RETURNING album, cover, description`,
    [
      req.user.id,
      album.trim(),
      cover === undefined ? null : validCover(cover),
      (description ?? "").slice(0, 5000),
    ],
  );

  res.json(rows[0]);
});

export default router;
