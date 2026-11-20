// client/src/api/tracks.js
// Persistencia de música en PostgreSQL a través de la API (navegador -> Express).
import { apiFetch } from "./client.js";
import { normalizeAudio } from "../audio.js";

export const listTracks = () => apiFetch("/api/tracks");

/** items: [{ file, title, artist, album, cover, duration }] en el orden elegido. */
export function uploadTracks(items) {
  const form = new FormData();
  const metadata = items.map(item => ({
    title: item.title,
    artist: item.artist,
    album: item.album,
    cover: item.cover ?? null,
    duration: item.duration ?? null,
  }));

  for (const item of items) {
    form.append("files", normalizeAudio(item.file));
  }
  form.append("metadata", JSON.stringify(metadata));

  return apiFetch("/api/tracks", { method: "POST", body: form });
}

export function updateTrack(id, patch) {
  return apiFetch(`/api/tracks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function removeTrack(id) {
  return apiFetch(`/api/tracks/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** El audio se baja con el token y se convierte en blob para un object URL. */
export async function fetchTrackAudio(id) {
  const response = await apiFetch(`/api/tracks/${encodeURIComponent(id)}/audio`);
  if (!response || typeof response.blob !== "function") {
    throw new Error("El servidor no devolvió audio.");
  }
  return response.blob();
}

export const listAlbumMeta = () => apiFetch("/api/albums");

export function saveAlbumMeta(data) {
  return apiFetch("/api/albums", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
