import { randomUUID } from "node:crypto";
import { Router } from "express";
import { readCollection, updateCollection } from "../db.js";
import {
  STATUSES,
  buildRequestPayload,
  isPublished,
} from "../request-data.js";
import { httpError, multiline, oneOf, text } from "../validation.js";

const router = Router();

const shortId = (prefix) => `${prefix}_${randomUUID().slice(0, 8)}`;

router.get("/", async (req, res) => {
  const { type, status, category, q, limit } = req.query;
  let items = (await readCollection("requests")).filter(isPublished);

  if (type && type !== "todos") items = items.filter((item) => item.type === type);
  if (status && status !== "todas") {
    items = items.filter((item) => item.status === status);
  }
  if (category && category !== "todas") {
    items = items.filter((item) => item.category === category);
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

  if (limit) {
    const parsed = Math.min(100, Math.max(1, Number(limit) || 50));
    items = items.slice(0, parsed);
  }

  res.json({ count: items.length, requests: items });
});

router.get("/:id", async (req, res) => {
  const requests = await readCollection("requests");
  const found = requests.find((item) => item.id === req.params.id);
  if (!found || !isPublished(found)) {
    throw httpError(404, "La solicitud no existe o no está publicada.");
  }
  res.json(found);
});

router.post("/", async (req, res) => {
  const payload = await buildRequestPayload(req.body);
  const now = new Date().toISOString();

  const item = {
    id: shortId("req"),
    ...payload,
    moderation: "pendiente",
    publishedAt: null,
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

router.patch("/:id", async (req, res) => {
  const status = oneOf(req.body?.status, STATUSES, "estado");

  const updated = await updateCollection("requests", (list) => {
    const item = list.find((entry) => entry.id === req.params.id);
    if (!item || !isPublished(item)) {
      throw httpError(404, "La solicitud no existe o no está publicada.");
    }
    item.status = status;
    item.updatedAt = new Date().toISOString();
    return item;
  });

  res.json(updated);
});

router.post("/:id/offers", async (req, res) => {
  const body = req.body ?? {};
  const name = text(body.name, "nombre", { max: 80 });
  const message = multiline(body.message, "mensaje", { min: 5, max: 800 });

  const offer = {
    id: shortId("off"),
    name,
    message,
    createdAt: new Date().toISOString(),
  };

  const updated = await updateCollection("requests", (list) => {
    const item = list.find((entry) => entry.id === req.params.id);
    if (!item || !isPublished(item)) {
      throw httpError(404, "La solicitud no existe o no está publicada.");
    }
    if (item.status === "resuelta") {
      throw httpError(409, "Esta solicitud ya está resuelta.");
    }
    item.offers.push(offer);
    if (item.status === "abierta") item.status = "en_proceso";
    item.updatedAt = new Date().toISOString();
    return item;
  });

  res.status(201).json({ request: updated, offer });
});

export default router;
