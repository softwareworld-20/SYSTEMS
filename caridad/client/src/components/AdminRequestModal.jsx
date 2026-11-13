import { useState } from "react";
import {
  MODERATION_META,
  STATUS_META,
  TYPE_META,
  URGENCY_META,
  formatDate,
  initials,
  timeAgo,
} from "../constants.js";
import Modal from "./Modal.jsx";

const STATUS_OPTIONS = ["abierta", "en_proceso", "resuelta"];

export default function AdminRequestModal({
  request,
  category,
  onClose,
  onUpdate,
  onDelete,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const type = TYPE_META[request.type] ?? TYPE_META.necesito;
  const urgency = URGENCY_META[request.urgency] ?? URGENCY_META.media;
  const status = STATUS_META[request.status] ?? STATUS_META.abierta;
  const moderation =
    MODERATION_META[request.moderation] ?? MODERATION_META.publicada;
  const isPublished = (request.moderation ?? "publicada") === "publicada";
  const isRejected = request.moderation === "rechazada";

  async function apply(payload, message) {
    setBusy(true);
    setError("");
    try {
      await onUpdate(request.id, payload, message);
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (
      !window.confirm(
        "¿Eliminar definitivamente esta solicitud? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");
    try {
      await onDelete(request.id);
    } catch (deleteError) {
      setError(deleteError.message);
      setBusy(false);
    }
  }

  return (
    <Modal
      title={request.title}
      subtitle={[category?.label, request.location].filter(Boolean).join(" · ")}
      onClose={onClose}
      size="lg"
    >
      <div className="detail">
        <div className="detail__badges">
          <span className={`badge badge--${type.tone}`}>{type.label}</span>
          {request.type === "necesito" && (
            <span className={`urgency urgency--${urgency.tone}`}>
              <span className="urgency__dot" aria-hidden="true" />
              {urgency.label}
            </span>
          )}
          <span className={`status status--${status.tone}`}>{status.label}</span>
          <span className={`moderation moderation--${moderation.tone}`}>
            {moderation.label}
          </span>
        </div>

        <p className="detail__description">{request.description}</p>

        <dl className="detail__meta">
          <div>
            <dt>Solicitante</dt>
            <dd>
              <span className="avatar avatar--sm" aria-hidden="true">
                {initials(request.author?.name)}
              </span>
              {request.author?.name}
            </dd>
          </div>
          <div>
            <dt>Contacto</dt>
            <dd className="detail__contact">
              {request.author?.contact || "No indicado"}
            </dd>
          </div>
          <div>
            <dt>Recibida</dt>
            <dd>{formatDate(request.createdAt)}</dd>
          </div>
          <div>
            <dt>Publicada</dt>
            <dd>
              {request.publishedAt
                ? formatDate(request.publishedAt)
                : "Todavía no"}
            </dd>
          </div>
        </dl>

        <div className="status-box">
          <div>
            <p className="status-box__title">Estado de la solicitud</p>
            <p className="status-box__help">
              Indica si sigue abierta, en proceso o ya resuelta.
            </p>
          </div>
          <div className="segmented segmented--sm" role="group" aria-label="Estado de la solicitud">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`segmented__option ${
                  request.status === option ? "segmented__option--active" : ""
                }`}
                disabled={busy || request.status === option}
                onClick={() =>
                  apply(
                    { status: option },
                    `Estado actualizado a «${STATUS_META[option].label}».`,
                  )
                }
              >
                {STATUS_META[option].label}
              </button>
            ))}
          </div>
        </div>

        <section className="offers">
          <h3>
            Respuestas de la comunidad
            <span className="offers__count">{request.offers?.length ?? 0}</span>
          </h3>

          {(request.offers?.length ?? 0) === 0 ? (
            <p className="offers__empty">
              Todavía no hay mensajes de personas interesadas.
            </p>
          ) : (
            <ul className="offers__list">
              {request.offers.map((entry) => (
                <li className="offer" key={entry.id}>
                  <span className="avatar avatar--sm" aria-hidden="true">
                    {initials(entry.name)}
                  </span>
                  <div>
                    <div className="offer__head">
                      <strong>{entry.name}</strong>
                      <span>{timeAgo(entry.createdAt)}</span>
                    </div>
                    <p>{entry.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}

        <div className="admin-detail__actions">
          <div className="admin-detail__moderation">
            {!isPublished && (
              <button
                type="button"
                className="btn btn--primary"
                disabled={busy}
                onClick={() =>
                  apply(
                    { moderation: "publicada" },
                    "Solicitud aceptada y publicada en el muro.",
                  )
                }
              >
                Aceptar y publicar
              </button>
            )}

            {isPublished && (
              <button
                type="button"
                className="btn btn--outline"
                disabled={busy}
                onClick={() =>
                  apply(
                    { moderation: "pendiente" },
                    "La solicitud se ha ocultado del muro.",
                  )
                }
              >
                Ocultar del muro
              </button>
            )}

            {!isRejected && (
              <button
                type="button"
                className="btn btn--outline"
                disabled={busy}
                onClick={() =>
                  apply(
                    { moderation: "rechazada" },
                    "Solicitud rechazada. No se mostrará en el muro.",
                  )
                }
              >
                Rechazar
              </button>
            )}

            <button
              type="button"
              className="btn btn--danger"
              disabled={busy}
              onClick={remove}
            >
              Eliminar
            </button>
          </div>
          <button
            type="button"
            className="btn btn--text"
            onClick={onClose}
            disabled={busy}
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
