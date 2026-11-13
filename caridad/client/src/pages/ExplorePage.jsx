import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import RequestDetail from "../components/RequestDetail.jsx";
import RequestForm from "../components/RequestForm.jsx";
import RequestGrid from "../components/RequestGrid.jsx";
import SiteHeader from "../components/SiteHeader.jsx";
import Toast from "../components/Toast.jsx";
import Toolbar from "../components/Toolbar.jsx";
import { useLocalStorage } from "../hooks/useLocalStorage.js";

const INITIAL_FILTERS = { type: "todos", category: "todas", status: "todas" };

export default function ExplorePage() {
  const [categories, setCategories] = useState([]);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [toast, setToast] = useState(null);
  const [userName, setUserName] = useLocalStorage("ayudapp:name", "");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let active = true;

    api
      .categories()
      .then((data) => {
        if (active) setCategories(data.categories);
      })
      .catch((categoriesError) => {
        if (active) setError(categoriesError.message);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    api
      .requests({ ...filters, q: debouncedQuery })
      .then((data) => {
        if (active) setRequests(data.requests);
      })
      .catch((requestsError) => {
        if (active) setError(requestsError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters, debouncedQuery, refreshKey]);

  useEffect(() => {
    let active = true;

    api
      .stats()
      .then((data) => {
        if (active) setStats(data);
      })
      .catch(() => {
        // Las estadísticas son informativas; un fallo no bloquea la app.
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);
  const dismissToast = useCallback(() => setToast(null), []);

  const notify = useCallback((message, tone = "success") => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const hasActiveFilters =
    filters.type !== "todos" ||
    filters.category !== "todas" ||
    filters.status !== "todas" ||
    query.trim() !== "";

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setQuery("");
  }, []);

  const openForm = useCallback(() => setShowForm(true), []);
  const closeForm = useCallback(() => setShowForm(false), []);
  const closeDetail = useCallback(() => setSelectedId(null), []);

  const handleCreated = useCallback(() => {
    setShowForm(false);
    clearFilters();
    refresh();
    notify(
      "Solicitud enviada. El equipo la revisará y la publicará en el muro.",
    );
  }, [clearFilters, notify, refresh]);

  const handleDetailChanged = useCallback(
    (message, tone = "success") => {
      refresh();
      notify(message, tone);
    },
    [notify, refresh],
  );

  return (
    <div className="explore-page">
      <div className="explore-aurora" aria-hidden="true">
        <span className="explore-aurora__blob explore-aurora__blob--one" />
        <span className="explore-aurora__blob explore-aurora__blob--two" />
        <span className="explore-aurora__blob explore-aurora__blob--three" />
      </div>

      <a className="skip-link" href="#solicitudes">
        Ir a las solicitudes
      </a>

      <SiteHeader onPublish={openForm} />

      <main className="container main" id="solicitudes">
        <div className="explore-head">
          <div>
            <span className="eyebrow eyebrow--dark">Muro de la comunidad</span>
            <h1>Explorar la comunidad</h1>
            <p>
              Aquí aparecen las solicitudes aprobadas por el equipo. Filtra por
              lo que necesitas, encuentra a quién ayudar o envía tu propia
              petición.
            </p>
          </div>
          <button type="button" className="btn btn--primary" onClick={openForm}>
            <span aria-hidden="true">＋</span> Publicar
          </button>
        </div>

        <Toolbar
          filters={filters}
          onChange={setFilters}
          query={query}
          onQueryChange={setQuery}
          categories={categories}
          stats={stats}
          count={requests.length}
          loading={loading}
          onClear={clearFilters}
        />

        {error && (
          <div className="alert alert--banner" role="alert">
            <span>No pudimos conectar con el servidor: {error}</span>
            <button type="button" className="btn btn--text" onClick={refresh}>
              Reintentar
            </button>
          </div>
        )}

        <RequestGrid
          requests={requests}
          categoriesById={categoriesById}
          loading={loading}
          hasFilters={hasActiveFilters}
          onSelect={(request) => setSelectedId(request.id)}
          onClear={clearFilters}
          onPublish={openForm}
        />
      </main>

      <footer className="footer">
        <div className="container footer__inner">
          <p>
            <strong>AyudApp</strong> · Proyecto de ayuda vecinal. Los datos se
            guardan en archivos JSON.
          </p>
          <p className="footer__note">
            Hecho para conectar personas, no para lucrar.
          </p>
        </div>
      </footer>

      {showForm && (
        <RequestForm
          categories={categories}
          defaultName={userName}
          onClose={closeForm}
          onCreated={handleCreated}
          onNameChange={setUserName}
        />
      )}

      {selectedId && (
        <RequestDetail
          requestId={selectedId}
          categories={categories}
          defaultName={userName}
          onClose={closeDetail}
          onChanged={handleDetailChanged}
          onNameChange={setUserName}
        />
      )}

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          tone={toast.tone}
          onDone={dismissToast}
        />
      )}
    </div>
  );
}
