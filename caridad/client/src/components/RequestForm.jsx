import { useState } from "react";
import { api } from "../api.js";
import Modal from "./Modal.jsx";

const EMPTY = {
  type: "necesito",
  title: "",
  description: "",
  category: "",
  urgency: "media",
  location: "",
  name: "",
  contact: "",
};

export default function RequestForm({
  categories,
  defaultName,
  onClose,
  onCreated,
  onNameChange,
  mode = "public",
}) {
  const isAdmin = mode === "admin";
  const [form, setForm] = useState({
    ...EMPTY,
    category: categories[0]?.id ?? "otros",
    name: defaultName ?? "",
  });
  const [publish, setPublish] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const payload = {
        type: form.type,
        title: form.title,
        description: form.description,
        category: form.category,
        urgency: form.urgency,
        location: form.location,
        authorName: form.name,
        contact: form.contact,
      };

      const created = isAdmin
        ? await api.admin.create({ ...payload, publish })
        : await api.createRequest(payload);

      const name = form.name.trim();
      if (name) onNameChange(name);
      onCreated(created);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={isAdmin ? "Nueva solicitud" : "Publicar una solicitud"}
      subtitle={
        isAdmin
          ? "Crea una solicitud y decide si quieres publicarla al instante."
          : "Cuéntanos qué necesitas o qué puedes ofrecer. El equipo la revisará antes de publicarla."
      }
      onClose={onClose}
      size="lg"
    >
      <form className="form" onSubmit={handleSubmit}>
        <div className="type-picker" role="group" aria-label="Tipo de publicación">
          <button
            type="button"
            className={`type-option ${form.type === "necesito" ? "type-option--active" : ""}`}
            aria-pressed={form.type === "necesito"}
            onClick={() => update("type", "necesito")}
          >
            <span className="type-option__icon" aria-hidden="true">
              🙋
            </span>
            <span>
              <strong>Necesito ayuda</strong>
              <small>Pide algo que tú o tu familia necesitáis.</small>
            </span>
          </button>
          <button
            type="button"
            className={`type-option ${form.type === "ofrezco" ? "type-option--active" : ""}`}
            aria-pressed={form.type === "ofrezco"}
            onClick={() => update("type", "ofrezco")}
          >
            <span className="type-option__icon" aria-hidden="true">
              🤲
            </span>
            <span>
              <strong>Ofrezco ayuda</strong>
              <small>Comparte un tiempo, un recurso o una habilidad.</small>
            </span>
          </button>
        </div>

        <label className="field">
          <span className="field__label">Título</span>
          <input
            required
            maxLength={120}
            value={form.title}
            onChange={(event) => update("title", event.target.value)}
            placeholder={
              form.type === "necesito"
                ? "Ej.: Silla de ruedas para mi abuela"
                : "Ej.: Clases de matemáticas gratuitas"
            }
          />
        </label>

        <label className="field">
          <span className="field__label">
            Descripción
            <span className="field__hint">{form.description.length}/2000</span>
          </span>
          <textarea
            required
            minLength={15}
            maxLength={2000}
            rows={5}
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            placeholder={
              form.type === "necesito"
                ? "Explica tu situación y qué necesitas exactamente…"
                : "Cuenta qué ofreces, cuándo y en qué condiciones…"
            }
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span className="field__label">Categoría</span>
            <select
              required
              value={form.category}
              onChange={(event) => update("category", event.target.value)}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.emoji} {category.label}
                </option>
              ))}
            </select>
          </label>

          {form.type === "necesito" ? (
            <label className="field">
              <span className="field__label">Urgencia</span>
              <select
                value={form.urgency}
                onChange={(event) => update("urgency", event.target.value)}
              >
                <option value="alta">Alta · lo antes posible</option>
                <option value="media">Media · esta semana</option>
                <option value="baja">Baja · sin prisa</option>
              </select>
            </label>
          ) : (
            <label className="field">
              <span className="field__label">Disponibilidad</span>
              <input
                required
                maxLength={100}
                value={form.location}
                onChange={(event) => update("location", event.target.value)}
                placeholder="Ej.: Online, martes por la tarde"
              />
            </label>
          )}
        </div>

        <div className="field-row">
          {form.type === "necesito" && (
            <label className="field">
              <span className="field__label">Ubicación</span>
              <input
                required
                maxLength={100}
                value={form.location}
                onChange={(event) => update("location", event.target.value)}
                placeholder="Barrio, ciudad o «Online»"
              />
            </label>
          )}

          <label className="field">
            <span className="field__label">Tu nombre</span>
            <input
              required
              maxLength={80}
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Cómo quieres aparecer"
            />
          </label>
        </div>

        <label className="field">
          <span className="field__label">
            Contacto <span className="field__optional">(opcional)</span>
          </span>
          <input
            maxLength={120}
            value={form.contact}
            onChange={(event) => update("contact", event.target.value)}
            placeholder="Email o teléfono para que puedan responderte"
          />
          <span className="field__help">
            Solo lo verán las personas que abran tu solicitud.
          </span>
        </label>

        {isAdmin && (
          <label className="toggle">
            <input
              type="checkbox"
              checked={publish}
              onChange={(event) => setPublish(event.target.checked)}
            />
            <span>
              <strong>Publicar al guardar</strong>
              <small>
                Si lo desactivas, quedará como pendiente de revisión.
              </small>
            </span>
          </label>
        )}

        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}

        <div className="form__actions">
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving
              ? "Guardando…"
              : isAdmin
                ? publish
                  ? "Guardar y publicar"
                  : "Guardar como pendiente"
                : "Enviar solicitud"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
