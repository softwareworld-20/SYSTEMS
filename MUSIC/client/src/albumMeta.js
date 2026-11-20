// client/src/albumMeta.js
// Las carátulas/descripciones de álbum viven en PostgreSQL (tabla album_meta).
// `metas` es el array que devuelve GET /api/albums.

/**
 * Agrupa tracks por álbum.
 * Cada entrada: { name, description, cover, tracks }
 * cover = meta.cover || primera carátula de canción del álbum
 */
export function buildAlbums(tracks, metas = []) {
  const metaByName = new Map(
    (Array.isArray(metas) ? metas : []).map(meta => [meta.album, meta]),
  );
  const map = new Map();

  for (const track of tracks) {
    const name = (track.album || "—").trim() || "—";
    if (!map.has(name)) {
      const meta = metaByName.get(name) ?? {};
      map.set(name, {
        name,
        description: meta.description || "",
        cover: meta.cover || null,
        tracks: [],
      });
    }
    map.get(name).tracks.push(track);
  }

  // Rellenar cover por defecto con la primera canción que tenga carátula.
  for (const album of map.values()) {
    if (!album.cover) {
      const withCover = album.tracks.find(track => track.cover);
      album.cover = withCover?.cover || null;
    }
  }

  // Orden alfabético, "—" al final.
  return [...map.values()].sort((a, b) => {
    if (a.name === "—") return 1;
    if (b.name === "—") return -1;
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });
}
