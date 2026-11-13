import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import {
  STATUS_META,
  TYPE_META,
  URGENCY_META,
  formatDate,
  initials,
  timeAgo,
} from "../constants.js";
import Modal from "./Modal.jsx";

const STATUS_OPTIONS = ["abierta", "en_proceso", "resuelta"];

export default function RequestDetail({
  requestId,
  categories = [],
  defaultName,
  onClose,
  onChanged,
  onNameChange,
}) {
  const [request, setRequest] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [offer, setOffer] = useState({ name: defaultName ?? "", message: "" });
  const [offerError, setOfferError] = useState("");
  const [offerSending, setOfferSending] = useState(false);

  const load = useCallback(async () => {
    setLoadError("");
    try {
      setRequest(await api.request(requestId));
    } catch (error) {
      setLoadError(error.message);
    }
  }, [requestId]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(status) {
    if (!request || request.status === status || statusSaving) return;
    setStatusSaving(true);
    try {
      const updated = await api.updateStatus(request.id, status);
      setRequest(updated);
      onChanged(`Estado actualizado a «${STATUS_META[status].label}».`);
    } catch (error) {
      onChanged(error.message, "error");
    } finally {
      setStatusSaving(false);
    }
  }

  async function submitOffer(event) {
    event.preventDefault();
    setOfferError("");
    setOfferSending(true);

    try {
      const data = await api.offerHelp(request.id, {
        name: offer.name,
        message: offer.message,
      });
      setRequest(data.request);
      setOffer((current) => ({ ...current, message: "" }));
      const name = offer.name.trim();
      if (name) onNameChange(name);
      onChanged(
        request.type === "necesito"
          ? "¡Gracias! Tu mensaje de ayuda se ha enviado."
          : "¡Mensaje enviado! La persona podrá contactarte.",
      );
    } catch (error) {
      setOfferError(error.message);
    } finally {
      setOfferSending(false);
    }
  }

  const type = request ? TYPE_META[request.type] : null;
  const urgency = request ? URGENCY_META[request.urgency] : null;
  const status = request ? STATUS_META[request.status] : null;
  const resolved = request?.status === "resuelta";
  const category = request
    ? categories.find((item) => item.id === request.category)
    : null;

  return (
    <Modal
      title={request ? request.title : "Solicitud"}
      subtitle={
        request
          ? [category?.label, request.location].filter(Boolean).join(" · ")
          : "Cargando detalle…"
      }
      onClose={onClose}
      size="lg"
    >
      {loadError && (
        <div className="detail-state">
          <p className="alert" role="alert">
            {loadError}
          </p>
          <button type="button" className="btn btn--primary" onClick={load}>
            Reintentar
          </button>
        </div>
      )}

      {!loadError && !request && (
        <div className="detail-state">
          <p className="muted">Cargando solicitud…</p>
        </div>
      )}

      {request && (
        <div className="detail">
          <div className="detail__badges">
            <span className={`badge badge--${type.tone}`}>{type.label}</span>
            {request.type === "necesito" && (
              <span className={`urgency urgency--${urgency.tone}`}>
                <span className="urgency__dot" aria-hidden="true" />
                {urgency.label}
              </span>
            )}
            <span className={`status status--${status.tone}`}>
              {status.label}
            </span>
          </div>

          <p className="detail__description">{request.description}</p>

          <dl className="detail__meta">
            <div>
              <dt>Publicado por</dt>
              <dd>
                <span className="avatar avatar--sm" aria-hidden="true">
                  {initials(request.author?.name)}
                </span>
                {request.author?.name}
              </dd>
            </div>
            <div>
              <dt>Fecha</dt>
              <dd>{formatDate(request.createdAt)}</dd>
            </div>
            <div>
              <dt>Ubicación</dt>
              <dd>{request.location}</dd>
            </div>
            {request.author?.contact && (
              <div>
                <dt>Contacto</dt>
                <dd className="detail__contact">{request.author.contact}</dd>
              </div>
            )}
          </dl>

          <div className="status-box">
            <div>
              <p className="status-box__title">Estado de la solicitud</p>
              <p className="status-box__help">
                Actualízalo cuando ya estés en contacto o cuando se haya
                resuelto.
              </p>
            </div>
            <div className="segmented segmented--sm" role="group" aria-label="Cambiar estado">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`segmented__option ${
                    request.status === option ? "segmented__option--active" : ""
                  }`}
                  disabled={statusSaving || request.status === option}
                  onClick={() => changeStatus(option)}
                >
                  {STATUS_META[option].label}
                </button>
              ))}
            </div>
          </div>

          <section className="offers">
            <h3>
              Respuestas de la comunidad
              <span className="offers__count">{request.offers.length}</span>
            </h3>

            {request.offers.length === 0 ? (
              <p className="offers__empty">
                Todavía nadie ha respondido. Si puedes ayudar, deja el primer
                mensaje.
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

          {resolved ? (
            <p className="resolved-note">
              🎉 Esta solicitud ya está resuelta. Gracias a todas las personas
              que ayudaron.
            </p>
          ) : (
            <form className="help-form" onSubmit={submitOffer}>
              <h3>
                {request.type === "necesito"
                  ? "Quiero ayudar"
                  : "Me interesa esta ayuda"}
              </h3>
              <p className="help-form__help">
                Déjale un mensaje a {request.author?.name}. Si guardas tu
                nombre, se recordará para la próxima vez.
              </p>

              <div className="field-row">
                <label className="field">
                  <span className="field__label">Tu nombre</span>
                  <input
                    required
                    maxLength={80}
                    value={offer.name}
                    onChange={(event) =>
                      setOffer((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Cómo quieres aparecer"
                  />
                </label>
                <label className="field field--grow">
                  <span className="field__label">Mensaje</span>
                  <textarea
                    required
                    minLength={5}
                    maxLength={800}
                    rows={3}
                    value={offer.message}
                    onChange={(event) =>
                      setOffer((current) => ({
                        ...current,
                        message: event.target.value,
                      }))
                    }
                    placeholder="Cuéntale cómo puedes ayudar o cómo contactarte…"
                  />
                </label>
              </div>

              {offerError && (
                <p className="alert" role="alert">
                  {offerError}
                </p>
              )}

              <button
                type="submit"
                className="btn btn--primary"
                disabled={offerSending}
              >
                {offerSending ? "Enviando…" : "Enviar mensaje"}
              </button>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}
