const TABS = [
  { id: "todos", label: "Todas" },
  { id: "necesito", label: "Necesitan ayuda" },
  { id: "ofrezco", label: "Ofrecen ayuda" },
];

export default function Toolbar({
  filters,
  onChange,
  query,
  onQueryChange,
  categories,
  stats,
  count,
  loading,
  onClear,
}) {
  const hasFilters =
    filters.type !== "todos" ||
    filters.category !== "todas" ||
    filters.status !== "todas" ||
    query.trim() !== "";

  const countFor = (id) => {
    if (!stats) return null;
    if (id === "todos") return stats.total;
    return stats.byType?.[id] ?? 0;
  };

  return (
    <section className="toolbar" aria-label="Filtros de solicitudes">
      <div className="toolbar__tabs" role="tablist" aria-label="Tipo de publicación">
        {TABS.map((tab) => {
          const active = filters.type === tab.id;
          const total = countFor(tab.id);
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`tab ${active ? "tab--active" : ""}`}
              onClick={() => onChange({ ...filters, type: tab.id })}
            >
              {tab.label}
              {total !== null && <span className="tab__count">{total}</span>}
            </button>
          );
        })}
      </div>

      <div className="toolbar__filters">
        <label className="search">
          <span aria-hidden="true">🔎</span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar por título, barrio o persona…"
            aria-label="Buscar solicitudes"
          />
        </label>

        <label className="select">
          <span className="sr-only">Categoría</span>
          <select
            value={filters.category}
            onChange={(event) =>
              onChange({ ...filters, category: event.target.value })
            }
          >
            <option value="todas">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.emoji} {category.label}
              </option>
            ))}
          </select>
        </label>

        <label className="select">
          <span className="sr-only">Estado</span>
          <select
            value={filters.status}
            onChange={(event) =>
              onChange({ ...filters, status: event.target.value })
            }
          >
            <option value="todas">Todos los estados</option>
            <option value="abierta">Abiertas</option>
            <option value="en_proceso">En proceso</option>
            <option value="resuelta">Resueltas</option>
          </select>
        </label>

        {hasFilters && (
          <button type="button" className="btn btn--text" onClick={onClear}>
            Limpiar
          </button>
        )}
      </div>

      <p className="toolbar__meta" aria-live="polite">
        {loading
          ? "Cargando solicitudes…"
          : `${count} ${count === 1 ? "solicitud" : "solicitudes"}`}
      </p>
    </section>
  );
}
