// client/src/albumMeta.js
const KEY = "listen-u:album-meta";

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
};

const save = data => {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
};

/** Devuelve metadatos del álbum (cover propio + description). */
export function getAlbumMeta(name) {
  const all = load();
  return all[name] || { cover: null, description: "" };
}

/** Actualiza metadatos de un álbum. */
export function setAlbumMeta(name, patch) {
  const all = load();
  all[name] = { ...getAlbumMeta(name), ...patch };
  save(all);
  return all[name];
}

/**
 * Agrupa tracks por álbum.
 * Cada entrada: { name, description, cover, tracks }
 * cover = meta.cover || primera carátula de canción del álbum
 */
export function buildAlbums(tracks) {
  const map = new Map();

  for (const track of tracks) {
    const name = (track.album || "—").trim() || "—";
    if (!map.has(name)) {
      const meta = getAlbumMeta(name);
      map.set(name, {
        name,
        description: meta.description || "",
        cover: meta.cover || null,
        tracks: [],
      });
    }
    map.get(name).tracks.push(track);
  }

  // Rellenar cover por defecto con la primera canción que tenga carátula
  for (const album of map.values()) {
    if (!album.cover) {
      const withCover = album.tracks.find(t => t.cover);
      album.cover = withCover?.cover || null;
    }
  }

  // Orden alfabético, "—" al final
  return [...map.values()].sort((a, b) => {
    if (a.name === "—") return 1;
    if (b.name === "—") return -1;
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });
}