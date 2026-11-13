export const TYPE_META = {
  necesito: { label: "Necesita ayuda", short: "Necesito ayuda", tone: "need" },
  ofrezco: { label: "Ofrece ayuda", short: "Ofrezco ayuda", tone: "offer" },
};

export const URGENCY_META = {
  alta: { label: "Urgente", tone: "high" },
  media: { label: "Prioridad media", tone: "medium" },
  baja: { label: "Sin prisa", tone: "low" },
};

export const STATUS_META = {
  abierta: { label: "Abierta", tone: "open" },
  en_proceso: { label: "En proceso", tone: "progress" },
  resuelta: { label: "Resuelta", tone: "done" },
};

export const MODERATION_META = {
  pendiente: { label: "Pendiente de revisión", short: "Pendiente", tone: "pending" },
  publicada: { label: "Publicada", short: "Publicada", tone: "published" },
  rechazada: { label: "Rechazada", short: "Rechazada", tone: "rejected" },
};

const relativeTime = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

const UNITS = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

export function timeAgo(value) {
  const diff = (new Date(value).getTime() - Date.now()) / 1000;
  if (Number.isNaN(diff)) return "";
  if (Math.abs(diff) < 60) return "hace un momento";

  for (const [unit, seconds] of UNITS) {
    if (Math.abs(diff) >= seconds) {
      return relativeTime.format(Math.round(diff / seconds), unit);
    }
  }

  return "hace un momento";
}

export function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
