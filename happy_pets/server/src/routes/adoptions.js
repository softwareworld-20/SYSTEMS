import { Router } from "express";
import { addAdoption, deleteAdoption, readAdoptions } from "../adoptions.js";

const router = Router();

const PHOTO_PATTERN = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const MAX_PHOTO_LENGTH = 4_500_000;

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseAdoption(body) {
  const photo = cleanText(body.photo);
  if (!photo) throw httpError(400, "Selecciona una foto.");
  if (!PHOTO_PATTERN.test(photo)) {
    throw httpError(400, "La foto debe ser una imagen JPEG, PNG o WebP.");
  }
  if (photo.length > MAX_PHOTO_LENGTH) {
    throw httpError(400, "La foto es demasiado grande.");
  }

  const name = cleanText(body.name);
  if (name.length > 80) {
    throw httpError(400, "El nombre no puede superar los 80 caracteres.");
  }

  const breed = cleanText(body.breed);
  if (!breed) throw httpError(400, "Escribe la raza.");
  if (breed.length > 80) {
    throw httpError(400, "La raza no puede superar los 80 caracteres.");
  }

  const age = cleanText(body.age);
  if (!age) throw httpError(400, "Escribe la edad.");
  if (age.length > 40) {
    throw httpError(400, "La edad no puede superar los 40 caracteres.");
  }

  if (typeof body.vetVisited !== "boolean") {
    throw httpError(400, "Indica si la mascota pasó por veterinaria.");
  }

  const description = cleanText(body.description);
  if (!description) throw httpError(400, "Escribe una descripción.");
  if (description.length > 2000) {
    throw httpError(
      400,
      "La descripción no puede superar los 2000 caracteres.",
    );
  }

  const code = cleanText(body.code);
  if (code && !/^\d{6}$/.test(code)) {
    throw httpError(400, "El número de identificación no es válido.");
  }

  return {
    code,
    photo,
    name,
    breed,
    age,
    vetVisited: body.vetVisited,
    description,
  };
}

router.get("/", async (req, res, next) => {
  try {
    res.json({ adoptions: await readAdoptions() });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const adoption = await addAdoption(parseAdoption(req.body ?? {}));
    res.status(201).json({ adoption });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const removed = await deleteAdoption(req.params.id);
    if (!removed) {
      res.status(404).json({ error: "Publicación no encontrada." });
      return;
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
