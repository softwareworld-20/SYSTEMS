export function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

/** Texto de una línea: recorta y colapsa espacios. */
export function text(value, field, { min = 1, max = 500 } = {}) {
  if (typeof value !== "string") {
    throw httpError(400, `El campo "${field}" es obligatorio.`);
  }
  const clean = value.trim().replace(/\s+/g, " ");
  if (clean.length < min) {
    throw httpError(400, `El campo "${field}" debe tener al menos ${min} caracteres.`);
  }
  if (clean.length > max) {
    throw httpError(400, `El campo "${field}" no puede superar ${max} caracteres.`);
  }
  return clean;
}

/** Texto libre: conserva saltos de línea. */
export function multiline(value, field, { min = 1, max = 2000 } = {}) {
  if (typeof value !== "string") {
    throw httpError(400, `El campo "${field}" es obligatorio.`);
  }
  const clean = value.trim();
  if (clean.length < min) {
    throw httpError(400, `El campo "${field}" debe tener al menos ${min} caracteres.`);
  }
  if (clean.length > max) {
    throw httpError(400, `El campo "${field}" no puede superar ${max} caracteres.`);
  }
  return clean;
}

export function oneOf(value, allowed, field) {
  if (!allowed.includes(value)) {
    throw httpError(
      400,
      `El campo "${field}" debe ser uno de: ${allowed.join(", ")}.`,
    );
  }
  return value;
}

export function optionalText(value, field, options) {
  if (value === undefined || value === null || value === "") return "";
  return text(value, field, options);
}
