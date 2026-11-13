export default function EmptyState({ hasFilters, onClear, onPublish }) {
  return (
    <div className="empty">
      <span className="empty__icon" aria-hidden="true">
        {hasFilters ? "🔍" : "🌱"}
      </span>
      <h2>{hasFilters ? "No encontramos solicitudes" : "Todavía no hay solicitudes"}</h2>
      <p>
        {hasFilters
          ? "Prueba con otra búsqueda o quita los filtros para ver toda la comunidad."
          : "Sé la primera persona en pedir o tender una mano. Todo empieza con una publicación."}
      </p>
      <div className="empty__actions">
        {hasFilters ? (
          <button type="button" className="btn btn--primary" onClick={onClear}>
            Quitar filtros
          </button>
        ) : (
          <button type="button" className="btn btn--primary" onClick={onPublish}>
            Publicar la primera solicitud
          </button>
        )}
      </div>
    </div>
  );
}
