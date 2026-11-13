import {
  MODERATION_META,
  STATUS_META,
  TYPE_META,
  formatDate,
} from "../constants.js";

export default function AdminTable({
  requests,
  categoriesById,
  onRead,
  onPublish,
  onReject,
  onUnpublish,
}) {
  return (
    <div className="admin-table">
      <div className="admin-table__head" aria-hidden="true">
        <span>Solicitud</span>
        <span>Estado</span>
        <span>Acciones</span>
      </div>

      {requests.map((request) => {
        const type = TYPE_META[request.type] ?? TYPE_META.necesito;
        const status = STATUS_META[request.status] ?? STATUS_META.abierta;
        const moderation =
          MODERATION_META[request.moderation] ?? MODERATION_META.publicada;
        const category = categoriesById.get(request.category);

        return (
          <article className="admin-row" key={request.id}>
            <div className="admin-row__main">
              <div className="admin-row__badges">
                <span className={`badge badge--${type.tone}`}>{type.label}</span>
                <span className={`moderation moderation--${moderation.tone}`}>
                  {moderation.short}
                </span>
                {category && (
                  <span className="admin-row__category">
                    {category.emoji} {category.label}
                  </span>
                )}
              </div>

              <button
                type="button"
                className="admin-row__title"
                onClick={() => onRead(request)}
              >
                {request.title}
              </button>

              <p className="admin-row__excerpt">{request.description}</p>

              <p className="admin-row__meta">
                {request.author?.name} · {request.location} ·{" "}
                {formatDate(request.createdAt)}
              </p>
            </div>

            <div className="admin-row__side">
              <span className={`status status--${status.tone}`}>
                {status.label}
              </span>
              <span className="admin-row__offers">
                <span aria-hidden="true">🤝</span>{" "}
                {request.offers?.length ?? 0} respuestas
              </span>
            </div>

            <div className="admin-row__actions">
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => onRead(request)}
              >
                Leer
              </button>

              {(request.moderation ?? "publicada") !== "publicada" ? (
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={() => onPublish(request)}
                >
                  Publicar
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => onUnpublish(request)}
                >
                  Ocultar
                </button>
              )}

              {request.moderation === "pendiente" && (
                <button
                  type="button"
                  className="btn btn--text btn--sm"
                  onClick={() => onReject(request)}
                >
                  Rechazar
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
