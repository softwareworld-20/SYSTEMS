// client/src/audio.js
// Detección y normalización de formatos de audio para subida y reproducción.

const MIME_BY_EXT = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  m4b: "audio/mp4",
  alac: "audio/mp4",
  mp4: "audio/mp4",
  aac: "audio/aac",
  wav: "audio/wav",
  wave: "audio/wav",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  opus: "audio/ogg",
  flac: "audio/flac",
  webm: "audio/webm",
  wma: "audio/x-ms-wma",
  aif: "audio/aiff",
  aiff: "audio/aiff",
  mid: "audio/midi",
  midi: "audio/midi",
};

const extension = file =>
  file?.name?.includes(".") ? file.name.split(".").pop().toLowerCase() : "";

export const isAudioFile = file => {
  if (!file) return false;
  if ((file.type || "").startsWith("audio/")) return true;
  return Boolean(MIME_BY_EXT[extension(file)]);
};

export const audioMime = file => {
  const type = file?.type || "";
  if (type.startsWith("audio/")) return type;
  return MIME_BY_EXT[extension(file)] || "application/octet-stream";
};

/**
 * Los archivos sin MIME (o con MIME de vídeo) se envuelven con el tipo correcto
 * para que el object URL del reproductor sea reproducible por el navegador.
 */
export const normalizeAudio = file => {
  if (!file) return file;
  const mime = audioMime(file);
  if (file.type === mime) return file;

  return new File([file], file.name || "audio", {
    type: mime,
    lastModified: file.lastModified,
  });
};
