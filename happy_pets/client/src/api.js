import { getToken } from "./auth.js";

const BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

async function request(path, { method = "GET", body } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.error || `Error ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
}

export const api = {
  auth: {
    login: (email, password) =>
      request("/auth/login", {
        method: "POST",
        body: { email, password },
      }),
    session: () => request("/auth/session"),
  },
  admin: {
    adoptions: {
      list: () => request("/admin/adoptions"),
      create: (payload) =>
        request("/admin/adoptions", { method: "POST", body: payload }),
      remove: (id) =>
        request(`/admin/adoptions/${id}`, { method: "DELETE" }),
    },
  },
};
