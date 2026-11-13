import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DATA_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../data",
);

/** Cola de escritura por colección para no perder cambios concurrentes. */
const queues = new Map();

export async function readCollection(name) {
  await mkdir(DATA_DIR, { recursive: true });
  const file = path.join(DATA_DIR, `${name}.json`);
  try {
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeCollection(name, data) {
  const file = path.join(DATA_DIR, `${name}.json`);
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(tmp, file);
}

/**
 * Lee, transforma y guarda una colección de forma atómica y serializada.
 * El updater muta el array recibido (o devuelve uno nuevo) y su retorno
 * se propaga como resultado de la operación.
 */
export function updateCollection(name, updater) {
  const previous = queues.get(name) ?? Promise.resolve();
  const next = previous.then(async () => {
    const items = await readCollection(name);
    const result = await updater(items);
    await writeCollection(name, items);
    return result;
  });
  queues.set(
    name,
    next.catch(() => {}),
  );
  return next;
}
