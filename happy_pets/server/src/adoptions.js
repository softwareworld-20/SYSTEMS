import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "adoptions.json");

async function readFileStore() {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeFileStore(adoptions) {
  await mkdir(DATA_DIR, { recursive: true });

  const tempFile = `${DATA_FILE}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(
    tempFile,
    `${JSON.stringify(adoptions, null, 2)}\n`,
    "utf8",
  );
  await rename(tempFile, DATA_FILE);
}

let writeQueue = Promise.resolve();

function createCode(usedCodes) {
  let code;
  do {
    code = String(Math.floor(100000 + Math.random() * 900000));
  } while (usedCodes.has(code));
  return code;
}

export function readAdoptions() {
  const operation = writeQueue.then(async () => {
    const adoptions = await readFileStore();
    const usedCodes = new Set(
      adoptions.map((adoption) => adoption.code).filter(Boolean),
    );
    let changed = false;

    const normalized = adoptions.map((adoption) => {
      if (adoption.code) return adoption;

      const code = createCode(usedCodes);
      usedCodes.add(code);
      changed = true;
      return { ...adoption, code };
    });

    if (changed) await writeFileStore(normalized);
    return normalized;
  });

  writeQueue = operation.catch(() => {});
  return operation;
}

export function addAdoption(data) {
  const operation = writeQueue.then(async () => {
    const adoptions = await readFileStore();
    const usedCodes = new Set(
      adoptions.map((adoption) => adoption.code).filter(Boolean),
    );
    const code =
      data.code && !usedCodes.has(data.code)
        ? data.code
        : createCode(usedCodes);
    const adoption = {
      id: randomUUID(),
      ...data,
      code,
      createdAt: new Date().toISOString(),
    };

    adoptions.unshift(adoption);
    await writeFileStore(adoptions);
    return adoption;
  });

  writeQueue = operation.catch(() => {});
  return operation;
}

export function deleteAdoption(id) {
  const operation = writeQueue.then(async () => {
    const adoptions = await readFileStore();
    const remaining = adoptions.filter((adoption) => adoption.id !== id);

    if (remaining.length === adoptions.length) return false;

    await writeFileStore(remaining);
    return true;
  });

  writeQueue = operation.catch(() => {});
  return operation;
}
