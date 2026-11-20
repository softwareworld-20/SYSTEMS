// client/src/media.js
import { normalizeAudio } from "./audio.js";

/** Reads the duration of a local audio file in seconds. */
export function readAudioDuration(file) {
  return new Promise(resolve => {
    const url = URL.createObjectURL(normalizeAudio(file));
    const audio = new Audio();
    let settled = false;

    const finish = value => {
      if (settled) return;
      settled = true;
      audio.removeAttribute("src");
      URL.revokeObjectURL(url);
      resolve(value);
    };

    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      finish(Number.isFinite(audio.duration) ? audio.duration : null);
    };
    audio.onerror = () => finish(null);
    audio.src = url;
  });
}

/** Formats seconds as m:ss (or h:mm:ss for long tracks). */
export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--";

  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`
    : `${minutes}:${String(rest).padStart(2, "0")}`;
}
