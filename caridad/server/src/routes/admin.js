import { randomUUID } from "node:crypto";
import { Router } from "express";
import { readCollection, updateCollection } from "../db.js";
import {
  MODERATIONS,
  STATUSES,
  buildRequestPayload,
  moderationOf,
} from "../request-data.js";
import { httpError, oneOf } from "../validation.js";

const router = Router();

const shortId = (prefix) => `${prefix}_${randomUUID().slice(0, 8)}`;

router.get("/stats", async (req, res) => {
  const requests = await readCollection("requests");

  const byModeration = { pendiente: 0, publicada: 0, rechazada: 0 };
  const byStatus = { abierta: 0, en_proceso: 0, resuelta: 0 };
  const byType = { necesito: 0, ofrezco: 0 };
  let offers = 0;

  for (const item of requests) {
    byModeration[moderationOf(item)] += 1;
    if (item.status in byStatus) byStatus[item.status] += 1;
    if (item.type in byType) byType[item.type] += 1;
    offers += item.offers?.length ?? 0;
  }

  res.json({ total: requests.length, byModeration, byStatus, byType, offers });
});

router.get("/requests", async (req, res) => {
  const { moderation, type, status, q } = req.query;
  let items = await readCollection("requests");

  if (moderation && moderation !== "todas") {
    items = items.filter((item) => moderationOf(item) === moderation);
  }
  if (type && type !== "todos") items = items.filter((item) => item.type === type);
  if (status && status !== "todas") {
    items = items.filter((item) => item.status === status);
  }

  const term = typeof q === "string" ? q.trim().toLowerCase() : "";
  if (term) {
    items = items.filter((item) =>
      [item.title, item.description, item.location, item.author?.name]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }

  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ count: items.length, requests: items });
});

router.get("/requests/:id", async (req, res) => {
  const requests = await readCollection("requests");
  const found = requests.find((item) => item.id === req.params.id);
  if (!found) throw httpError(404, "La solicitud no existe.");
  res.json(found);
});

router.post("/requests", async (req, res) => {
  const body = req.body ?? {};
  const payload = await buildRequestPayload(body);
  const publish = body.publish === true;
  const now = new Date().toISOString();

  const item = {
    id: shortId("req"),
    ...payload,
    moderation: publish ? "publicada" : "pendiente",
    publishedAt: publish ? now : null,
    status: "abierta",
    offers: [],
    createdAt: now,
    updatedAt: now,
  };

  await updateCollection("requests", (list) => {
    list.push(item);
    return item;
  });

  res.status(201).json(item);
});

router.patch("/requests/:id", async (req, res) => {
  const body = req.body ?? {};
  const hasModeration = Object.hasOwn(body, "moderation");
  const hasStatus = Object.hasOwn(body, "status");

  if (!hasModeration && !hasStatus) {
    throw httpError(400, "Indica al menos un cambio de moderación o estado.");
  }

  const moderation = hasModeration
    ? oneOf(body.moderation, MODERATIONS, "moderación")
    : null;
  const status = hasStatus ? oneOf(body.status, STATUSES, "estado") : null;

  const updated = await updateCollection("requests", (list) => {
    const item = list.find((entry) => entry.id === req.params.id);
    if (!item) throw httpError(404, "La solicitud no existe.");

    const now = new Date().toISOString();
    if (moderation) {
      item.moderation = moderation;
      if (moderation === "publicada" && !item.publishedAt) {
        item.publishedAt = now;
      }
    }
    if (status) item.status = status;
    item.updatedAt = now;

    return item;
  });

  res.json(updated);
});

router.delete("/requests/:id", async (req, res) => {
  await updateCollection("requests", (list) => {
    const index = list.findIndex((entry) => entry.id === req.params.id);
    if (index === -1) throw httpError(404, "La solicitud no existe.");
    list.splice(index, 1);
  });

  res.status(204).end();
});

export default router;
