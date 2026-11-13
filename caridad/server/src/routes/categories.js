import { Router } from "express";
import { readCollection } from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  const categories = await readCollection("categories");
  res.json({ categories });
});

export default router;
