// server/src/audio.js
// Espejo de client/src/audio.js: valida y normaliza el MIME de los audios subidos.

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

export const extension = name =>
  typeof name === "string" && name.includes(".") ? name.split(".").pop().toLowerCase() : "";

export const isAudioFile = file => {
  if (!file) return false;
  if ((file.mimetype || file.type || "").startsWith("audio/")) return true;
  return Boolean(MIME_BY_EXT[extension(file.originalname || file.name)]);
};

export const audioMime = file => {
  const type = file.mimetype || file.type || "";
  if (type.startsWith("audio/")) return type;
  return MIME_BY_EXT[extension(file.originalname || file.name)] || "application/octet-stream";
};
