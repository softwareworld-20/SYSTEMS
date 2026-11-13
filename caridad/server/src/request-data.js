import { readCollection } from "./db.js";
import { httpError, multiline, oneOf, optionalText, text } from "./validation.js";

export const TYPES = ["necesito", "ofrezco"];
export const URGENCIES = ["baja", "media", "alta"];
export const STATUSES = ["abierta", "en_proceso", "resuelta"];
export const MODERATIONS = ["pendiente", "publicada", "rechazada"];

/** Las solicitudes anteriores al flujo de moderación se consideran publicadas. */
export function moderationOf(item) {
  return item.moderation ?? "publicada";
}

export function isPublished(item) {
  return moderationOf(item) === "publicada";
}

/** Valida y normaliza el cuerpo de una solicitud. */
export async function buildRequestPayload(body = {}) {
  const categories = await readCollection("categories");

  const type = oneOf(body.type, TYPES, "tipo");
  const title = text(body.title, "título", { max: 120 });
  const description = multiline(body.description, "descripción", {
    min: 15,
    max: 2000,
  });
  const category = text(body.category, "categoría", { max: 40 });
  if (!categories.some((item) => item.id === category)) {
    throw httpError(400, "La categoría indicada no existe.");
  }
  const urgency =
    type === "necesito"
      ? oneOf(body.urgency ?? "media", URGENCIES, "urgencia")
      : "baja";
  const location = text(body.location, "ubicación", { max: 100 });
  const authorName = text(body.authorName, "nombre", { max: 80 });
  const contact = optionalText(body.contact, "contacto", { max: 120 });

  return {
    type,
    title,
    description,
    category,
    urgency,
    location,
    author: { name: authorName, contact },
  };
}
