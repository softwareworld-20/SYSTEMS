// client/src/api/client.js
// Todas las llamadas a la API llevan el token Bearer de la sesión.
import { getToken, signOut } from "../auth.js";

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers ?? {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const hasBody = options.body !== undefined && options.body !== null;
  if (hasBody && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let response;
  try {
    response = await fetch(path, { ...options, headers });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor.");
  }

  if (response.status === 401) {
    signOut();
    if (window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
  }

  if (!response.ok) {
    let message = "No se pudo completar la operación.";
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch {}
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") ?? "";
  // Los binarios (audio) se devuelven como Response para que el lector elija.
  return contentType.includes("application/json") ? response.json() : response;
}
