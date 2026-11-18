import { useEffect, useState } from "react";
import { api } from "../api.js";
import { prepareImage } from "../image.js";

const VIEW_KEY = "happy-pets:adoptionView";
const EMPTY_FORM = {
  photo: "",
  code: "",
  name: "",
  breed: "",
  age: "",
  vet: "",
  description: "",
};
const DATE_FORMATTER = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
});

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : DATE_FORMATTER.format(date);
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function VetBadge({ visited }) {
  return (
    <span
      className={
        visited
          ? "admin-adopcion__badge admin-adopcion__badge--yes"
          : "admin-adopcion__badge admin-adopcion__badge--no"
      }
    >
      {visited ? "Sí" : "No"}
    </span>
  );
}

function AdoptionTable({ adoptions, deletingId, onDelete }) {
  return (
    <div className="admin-adopcion__table-wrap">
      <table className="admin-adopcion__table">
        <thead>
          <tr>
            <th scope="col">Foto</th>
            <th scope="col">Mascota</th>
            <th scope="col">Raza</th>
            <th scope="col">Edad</th>
            <th scope="col">Veterinaria</th>
            <th scope="col">Descripción</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {adoptions.map((adoption) => (
            <tr key={adoption.id}>
              <td className="admin-adopcion__cell admin-adopcion__cell--photo">
                <img
                  className="admin-adopcion__thumb"
                  src={adoption.photo}
                  alt={`Foto de ${adoption.name || "la mascota"}`}
                />
              </td>
              <td className="admin-adopcion__cell admin-adopcion__cell--name">
                <strong className="admin-adopcion__name">
                  {adoption.name || "Sin nombre"}
                </strong>
                <span className="admin-adopcion__code">
                  ID {adoption.code}
                </span>
                <time
                  className="admin-adopcion__date"
                  dateTime={adoption.createdAt}
                >
                  {formatDate(adoption.createdAt)}
                </time>
              </td>
              <td
                className="admin-adopcion__cell admin-adopcion__cell--breed"
                data-label="Raza"
              >
                {adoption.breed}
              </td>
              <td
                className="admin-adopcion__cell admin-adopcion__cell--age"
                data-label="Edad"
              >
                {adoption.age}
              </td>
              <td
                className="admin-adopcion__cell admin-adopcion__cell--vet"
                data-label="Veterinaria"
              >
                <VetBadge visited={adoption.vetVisited} />
              </td>
              <td
                className="admin-adopcion__cell admin-adopcion__cell--description"
                data-label="Descripción"
              >
                <p className="admin-adopcion__description">
                  {adoption.description}
                </p>
              </td>
              <td className="admin-adopcion__cell admin-adopcion__cell--actions">
                <button
                  className="admin-adopcion__delete"
                  type="button"
                  onClick={() => onDelete(adoption)}
                  disabled={deletingId === adoption.id}
                >
                  {deletingId === adoption.id ? "Borrando…" : "Borrar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdoptionGrid({ adoptions, deletingId, onDelete }) {
  return (
    <div className="admin-adopcion__grid">
      {adoptions.map((adoption) => (
        <article className="admin-adopcion__card" key={adoption.id}>
          <div className="admin-adopcion__card-media">
            <img
              src={adoption.photo}
              alt={`Foto de ${adoption.name || "la mascota"}`}
              loading="lazy"
            />
          </div>
          <div className="admin-adopcion__card-body">
            <div className="admin-adopcion__card-heading">
              <div className="admin-adopcion__card-title">
                <span className="admin-adopcion__code">
                  ID {adoption.code}
                </span>
                <h2>{adoption.name || "Sin nombre"}</h2>
              </div>
              <VetBadge visited={adoption.vetVisited} />
            </div>
            <p className="admin-adopcion__card-meta">
              {adoption.breed} · {adoption.age}
            </p>
            <p className="admin-adopcion__card-description">
              {adoption.description}
            </p>
            <div className="admin-adopcion__card-footer">
              <time
                className="admin-adopcion__date"
                dateTime={adoption.createdAt}
              >
                {formatDate(adoption.createdAt)}
              </time>
              <button
                className="admin-adopcion__delete"
                type="button"
                onClick={() => onDelete(adoption)}
                disabled={deletingId === adoption.id}
              >
                {deletingId === adoption.id ? "Borrando…" : "Borrar"}
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function AdoptionFormModal({
  form,
  error,
  saving,
  photoLoading,
  onChange,
  onPhoto,
  onClose,
  onSubmit,
}) {
  return (
    <div
      className="admin-adopcion__overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="admin-adopcion__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adoption-form-title"
      >
        <header className="admin-adopcion__modal-header">
          <div>
            <p className="admin-adopcion__form-eyebrow">Nueva mascota</p>
            <h2 id="adoption-form-title">Poner en adopción</h2>
          </div>
          <button
            className="admin-adopcion__close"
            type="button"
            onClick={onClose}
            aria-label="Cerrar formulario"
          >
            ×
          </button>
        </header>

        <form className="admin-adopcion__form" onSubmit={onSubmit} noValidate>
          <div className="admin-adopcion__photo">
            <div className="admin-adopcion__preview">
              {form.photo ? (
                <img src={form.photo} alt="Vista previa de la mascota" />
              ) : (
                <span>Foto de la mascota</span>
              )}
            </div>

            <label className="admin-adopcion__upload">
              {photoLoading
                ? "Procesando…"
                : form.photo
                  ? "Cambiar foto"
                  : "Subir foto"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onPhoto}
                disabled={photoLoading}
              />
            </label>
            <p className="admin-adopcion__hint">
              JPG, PNG o WebP. La imagen se optimiza al guardarla.
            </p>
          </div>

          <div className="admin-adopcion__fields">
            <label className="admin-adopcion__field">
              <span>Número de identificación</span>
              <input
                className="admin-adopcion__readonly"
                type="text"
                value={form.code}
                readOnly
              />
              <span className="admin-adopcion__hint">
                Se genera automáticamente al abrir el formulario.
              </span>
            </label>

            <label className="admin-adopcion__field">
              <span>
                Nombre <em>(opcional)</em>
              </span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => onChange("name", event.target.value)}
                maxLength={80}
              />
            </label>

            <div className="admin-adopcion__field-row">
              <label className="admin-adopcion__field">
                <span>Raza</span>
                <input
                  type="text"
                  value={form.breed}
                  onChange={(event) => onChange("breed", event.target.value)}
                  maxLength={80}
                  required
                />
              </label>

              <label className="admin-adopcion__field">
                <span>Edad</span>
                <input
                  type="text"
                  value={form.age}
                  onChange={(event) => onChange("age", event.target.value)}
                  maxLength={40}
                  placeholder="Ej. 2 años"
                  required
                />
              </label>
            </div>

            <fieldset className="admin-adopcion__fieldset">
              <legend>¿Pasó por veterinaria?</legend>
              <div className="admin-adopcion__choices">
                {[
                  { value: "si", label: "Sí" },
                  { value: "no", label: "No" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={
                      form.vet === option.value
                        ? "admin-adopcion__choice admin-adopcion__choice--active"
                        : "admin-adopcion__choice"
                    }
                  >
                    <input
                      type="radio"
                      name="vet"
                      value={option.value}
                      checked={form.vet === option.value}
                      onChange={() => onChange("vet", option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="admin-adopcion__field">
              <span>Descripción</span>
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) =>
                  onChange("description", event.target.value)
                }
                maxLength={2000}
                required
              />
            </label>

            {error && (
              <p className="admin-adopcion__error" role="alert">
                {error}
              </p>
            )}

            <div className="admin-adopcion__form-actions">
              <button
                className="admin-adopcion__cancel"
                type="button"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                className="admin-adopcion__save"
                type="submit"
                disabled={saving || photoLoading}
              >
                {saving ? "Guardando…" : "Guardar mascota"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminAdopcion() {
  const [adoptions, setAdoptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [view, setView] = useState(() => {
    try {
      return window.localStorage.getItem(VIEW_KEY) === "list"
        ? "list"
        : "widgets";
    } catch {
      return "widgets";
    }
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    loadAdoptions();
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(VIEW_KEY, view);
    } catch {
      // La preferencia es opcional.
    }
  }, [view]);

  useEffect(() => {
    if (!showForm) return undefined;

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event) {
      if (event.key === "Escape") closeForm();
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [showForm]);

  async function loadAdoptions() {
    setLoading(true);
    setLoadError("");

    try {
      const data = await api.admin.adoptions.list();
      setAdoptions(data.adoptions ?? []);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function openForm() {
    setForm({ ...EMPTY_FORM, code: generateCode() });
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handlePhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setFormError("");
    setPhotoLoading(true);

    try {
      const photo = await prepareImage(file);
      setForm((current) => ({ ...current, photo }));
    } catch (error) {
      setFormError(error.message);
    } finally {
      setPhotoLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!form.photo) {
      setFormError("Selecciona una foto.");
      return;
    }
    if (!form.breed.trim()) {
      setFormError("Escribe la raza.");
      return;
    }
    if (!form.age.trim()) {
      setFormError("Escribe la edad.");
      return;
    }
    if (!form.vet) {
      setFormError("Indica si la mascota pasó por veterinaria.");
      return;
    }
    if (!form.description.trim()) {
      setFormError("Escribe una descripción.");
      return;
    }

    setSaving(true);
    try {
      const data = await api.admin.adoptions.create({
        code: form.code,
        photo: form.photo,
        name: form.name.trim(),
        breed: form.breed.trim(),
        age: form.age.trim(),
        vetVisited: form.vet === "si",
        description: form.description.trim(),
      });

      setAdoptions((current) => [data.adoption, ...current]);
      closeForm();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(adoption) {
    const label = adoption.name || "esta mascota";
    if (
      !window.confirm(
        `¿Eliminar la publicación de ${label} (ID ${adoption.code})?`,
      )
    ) {
      return;
    }

    setDeletingId(adoption.id);
    setActionError("");

    try {
      await api.admin.adoptions.remove(adoption.id);
      setAdoptions((current) =>
        current.filter((item) => item.id !== adoption.id),
      );
    } catch (error) {
      setActionError(error.message);
    } finally {
      setDeletingId("");
    }
  }

  return (
    <section className="admin-adopcion">
      <header className="admin-adopcion__header">
        <div className="admin-adopcion__intro">
          <p className="admin-adopcion__eyebrow">Gestión</p>
          <h1 className="admin-adopcion__title">Panel de adopción</h1>
          <p className="admin-adopcion__subtitle">
            Publica y revisa las mascotas que buscan un nuevo hogar.
          </p>
        </div>

        <div className="admin-adopcion__actions">
          <div
            className="admin-adopcion__view-toggle"
            role="group"
            aria-label="Tipo de vista"
          >
            <button
              type="button"
              className={
                view === "list"
                  ? "admin-adopcion__view-button admin-adopcion__view-button--active"
                  : "admin-adopcion__view-button"
              }
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
            >
              Lista
            </button>
            <button
              type="button"
              className={
                view === "widgets"
                  ? "admin-adopcion__view-button admin-adopcion__view-button--active"
                  : "admin-adopcion__view-button"
              }
              onClick={() => setView("widgets")}
              aria-pressed={view === "widgets"}
            >
              Widgets
            </button>
          </div>

          <button
            className="admin-adopcion__add"
            type="button"
            onClick={openForm}
          >
            <span aria-hidden="true">+</span> Añadir
          </button>
        </div>
      </header>

      {actionError && (
        <p className="admin-adopcion__action-error" role="alert">
          {actionError}
        </p>
      )}

      {loading ? (
        <div className="admin-adopcion__state">Cargando mascotas…</div>
      ) : loadError ? (
        <div className="admin-adopcion__state">
          <p>{loadError}</p>
          <button
            className="admin-adopcion__retry"
            type="button"
            onClick={loadAdoptions}
          >
            Reintentar
          </button>
        </div>
      ) : adoptions.length === 0 ? (
        <div className="admin-adopcion__empty">
          <span className="admin-adopcion__empty-icon" aria-hidden="true">
            +
          </span>
          <h2>Aún no hay mascotas en adopción</h2>
          <p>Usa el botón Añadir para registrar la primera.</p>
        </div>
      ) : view === "list" ? (
        <AdoptionTable
          adoptions={adoptions}
          deletingId={deletingId}
          onDelete={handleDelete}
        />
      ) : (
        <AdoptionGrid
          adoptions={adoptions}
          deletingId={deletingId}
          onDelete={handleDelete}
        />
      )}

      {showForm && (
        <AdoptionFormModal
          form={form}
          error={formError}
          saving={saving}
          photoLoading={photoLoading}
          onChange={updateField}
          onPhoto={handlePhoto}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
      )}
    </section>
  );
}
