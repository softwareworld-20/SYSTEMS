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
    login: (username, password) =>
      request("/auth/login", {
        method: "POST",
        body: { username, password },
      }),
    session: () => request("/auth/session"),
  },
  categories: () => request("/categories"),
  stats: () => request("/stats"),
  requests: (filters = {}) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (!value || value === "todos" || value === "todas") continue;
      params.set(key, value);
    }
    const query = params.toString();
    return request(`/requests${query ? `?${query}` : ""}`);
  },
  request: (id) => request(`/requests/${id}`),
  createRequest: (payload) =>
    request("/requests", { method: "POST", body: payload }),
  updateStatus: (id, status) =>
    request(`/requests/${id}`, { method: "PATCH", body: { status } }),
  offerHelp: (id, payload) =>
    request(`/requests/${id}/offers`, { method: "POST", body: payload }),
  admin: {
    stats: () => request("/admin/stats"),
    requests: (filters = {}) => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (!value || value === "todas" || value === "todos") continue;
        params.set(key, value);
      }
      const query = params.toString();
      return request(`/admin/requests${query ? `?${query}` : ""}`);
    },
    request: (id) => request(`/admin/requests/${id}`),
    create: (payload) =>
      request("/admin/requests", { method: "POST", body: payload }),
    update: (id, payload) =>
      request(`/admin/requests/${id}`, { method: "PATCH", body: payload }),
    remove: (id) => request(`/admin/requests/${id}`, { method: "DELETE" }),
  },
};
