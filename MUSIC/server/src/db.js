// server/src/db.js
// Único punto de conexión a PostgreSQL. El navegador nunca habla con la DB.
import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Falta DATABASE_URL. Copia .env.example a .env y rellénalo.");
}

export const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// Nunca loguees la cadena: contiene la contraseña.
pool.on("error", error => {
  console.error("Error inesperado del pool de PostgreSQL.", error.message);
});

export async function query(text, params) {
  return pool.query(text, params);
}

export async function checkDb() {
  await pool.query("SELECT 1");
}
