// client/src/hooks/useTracks.js
import { useCallback, useEffect, useState } from "react";
import { deleteTrackFile, saveTrackFile } from "../trackFiles.js";

const KEY = "listen-u:tracks";

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

export function useTracks() {
  const [tracks, setTracks] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(tracks));
    } catch (error) {
      console.warn("No se pudo guardar la lista de canciones.", error);
    }
  }, [tracks]);

  const addTrack = useCallback(async track => {
    const id = crypto.randomUUID();
    const { file, ...meta } = track;

    let stored = false;
    if (file) {
      try {
        await saveTrackFile(id, file);
        stored = true;
      } catch (error) {
        console.warn("No se pudo guardar el audio de la canción.", error);
      }
    }

    setTracks(prev => [{ ...meta, id, hasFile: stored }, ...prev]);
    return id;
  }, []);

  const updateTrack = useCallback((id, patch) => {
    // El blob sigue en IndexedDB con el mismo id: solo cambian los metadatos.
    setTracks(prev =>
      prev.map(track => (track.id === id ? { ...track, ...patch } : track))
    );
  }, []);

  const removeTrack = useCallback(id => {
    setTracks(prev => prev.filter(track => track.id !== id));
    deleteTrackFile(id).catch(() => {});
  }, []);

  return { tracks, addTrack, updateTrack, removeTrack };
}
