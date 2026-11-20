// client/src/hooks/useTracks.js
// Estado de las canciones servido por la API; ya no hay localStorage ni IndexedDB.
import { useCallback, useEffect, useState } from "react";
import {
  listTracks,
  uploadTracks,
  updateTrack as apiUpdateTrack,
  removeTrack as apiRemoveTrack,
} from "../api/tracks.js";

export function useTracks() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listTracks();
      setTracks(Array.isArray(list) ? list : []);
      setError("");
    } catch (failure) {
      setError(failure?.message || "No se pudo cargar la lista de canciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listTracks()
      .then(list => {
        if (!alive) return;
        setTracks(Array.isArray(list) ? list : []);
      })
      .catch(failure => {
        if (!alive) return;
        setError(failure?.message || "No se pudo cargar la lista de canciones.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const addTrack = useCallback(async item => {
    const [created] = await uploadTracks([item]);
    setTracks(prev => [...prev, created]);
    return created.id;
  }, []);

  // Subida múltiple: una sola petición con todos los archivos en orden.
  const addTracks = useCallback(async items => {
    const created = await uploadTracks(items);
    setTracks(prev => [...prev, ...created]);
    return created.map(track => track.id);
  }, []);

  const updateTrack = useCallback(async (id, patch) => {
    const updated = await apiUpdateTrack(id, patch);
    setTracks(prev => prev.map(track => (track.id === id ? updated : track)));
    return updated;
  }, []);

  const removeTrack = useCallback(async id => {
    await apiRemoveTrack(id);
    setTracks(prev => prev.filter(track => track.id !== id));
  }, []);

  return { tracks, loading, error, reload, addTrack, addTracks, updateTrack, removeTrack };
}
