// client/src/hooks/useTracks.js
import { useCallback, useEffect, useState } from "react";
import { deleteTrackFile, saveTrackFile } from "../trackFiles.js";
import { audioMime, normalizeAudio } from "../audio.js";

const KEY = "listen-u:tracks";

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

const persistTrack = async track => {
  const id = crypto.randomUUID();
  const { file, ...meta } = track;

  let stored = false;
  if (file) {
    try {
      await saveTrackFile(id, normalizeAudio(file));
      stored = true;
    } catch (error) {
      console.warn("No se pudo guardar el audio de la canción.", error);
    }
  }

  return { ...meta, id, mime: file ? audioMime(file) : null, hasFile: stored };
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
    const stored = await persistTrack(track);
    setTracks(prev => [stored, ...prev]);
    return stored.id;
  }, []);

  // Subida múltiple: se guardan en el orden elegido y se insertan juntas.
  const addTracks = useCallback(async items => {
    const stored = [];
    for (const item of items) {
      stored.push(await persistTrack(item));
    }
    setTracks(prev => [...stored, ...prev]);
    return stored.map(track => track.id);
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

  return { tracks, addTrack, addTracks, updateTrack, removeTrack };
}
