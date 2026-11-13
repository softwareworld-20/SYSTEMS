import {
  STATUS_META,
  TYPE_META,
  URGENCY_META,
  initials,
  timeAgo,
} from "../constants.js";

export default function RequestCard({ request, category, onSelect }) {
  const type = TYPE_META[request.type] ?? TYPE_META.necesito;
  const urgency = URGENCY_META[request.urgency] ?? URGENCY_META.media;
  const status = STATUS_META[request.status] ?? STATUS_META.abierta;
  const isNecesito = request.type === "necesito";

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(request);
    }
  };

  return (
    <article
      className={`card card--${type.tone}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(request)}
      onKeyDown={handleKeyDown}
      aria-label={`Ver detalle: ${request.title}`}
    >
      <div className="card__badges">
        <span className={`badge badge--${type.tone}`}>{type.label}</span>
        {isNecesito && (
          <span className={`urgency urgency--${urgency.tone}`}>
            <span className="urgency__dot" aria-hidden="true" />
            {urgency.label}
          </span>
        )}
        {request.status !== "abierta" && (
          <span className={`status status--${status.tone}`}>{status.label}</span>
        )}
      </div>

      <h3 className="card__title">{request.title}</h3>
      <p className="card__description">{request.description}</p>

      <div className="card__meta">
        <span>
          <span aria-hidden="true">📍</span> {request.location}
        </span>
        {category && (
          <span>
            <span aria-hidden="true">{category.emoji}</span> {category.label}
          </span>
        )}
      </div>

      <div className="card__footer">
        <span className="avatar" aria-hidden="true">
          {initials(request.author?.name)}
        </span>
        <div className="card__author">
          <strong>{request.author?.name}</strong>
          <small>{timeAgo(request.createdAt)}</small>
        </div>
        <span
          className="card__offers"
          title={`${request.offers?.length ?? 0} respuestas`}
        >
          <span aria-hidden="true">🤝</span> {request.offers?.length ?? 0}
        </span>
      </div>
    </article>
  );
}
