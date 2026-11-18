const MAX_FILE_BYTES = 12 * 1024 * 1024;
const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.82;

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo abrir la imagen."));
    image.src = source;
  });
}

/** Optimiza la foto antes de guardarla como data URL dentro del JSON. */
export async function prepareImage(file) {
  if (!file) throw new Error("Selecciona una foto.");
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecciona una imagen válida.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("La imagen no puede superar los 12 MB.");
  }

  const source = await readAsDataUrl(file);
  const image = await loadImage(source);
  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("No se pudo procesar la imagen.");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}
