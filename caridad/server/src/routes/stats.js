import { Router } from "express";
import { readCollection } from "../db.js";
import { isPublished } from "../request-data.js";

const router = Router();

router.get("/", async (req, res) => {
  const requests = (await readCollection("requests")).filter(isPublished);

  const byType = { necesito: 0, ofrezco: 0 };
  const byStatus = { abierta: 0, en_proceso: 0, resuelta: 0 };
  const byCategory = {};
  const helpers = new Set();
  let offers = 0;

  for (const item of requests) {
    if (item.type in byType) byType[item.type] += 1;
    if (item.status in byStatus) byStatus[item.status] += 1;
    byCategory[item.category] = (byCategory[item.category] ?? 0) + 1;

    offers += item.offers?.length ?? 0;
    for (const offer of item.offers ?? []) {
      helpers.add(offer.name.trim().toLowerCase());
    }
  }

  res.json({
    total: requests.length,
    byType,
    byStatus,
    byCategory,
    offers,
    helpers: helpers.size,
  });
});

export default router;
