import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Box, CircularProgress, ThemeProvider } from "@mui/material";
import { api } from "../api.js";
import { clearToken, getToken, setToken } from "../auth.js";
import AdminDashboard from "../components/AdminDashboard.jsx";
import AdminLogin from "../components/AdminLogin.jsx";
import AdminRequestModal from "../components/AdminRequestModal.jsx";
import AdminTable from "../components/AdminTable.jsx";
import Brand from "../components/Brand.jsx";
import RequestForm from "../components/RequestForm.jsx";
import Toast from "../components/Toast.jsx";
import { adminTheme } from "../theme.js";

const TABS = [
  { id: "pendiente", label: "Pendientes" },
  { id: "publicada", label: "Publicadas" },
  { id: "rechazada", label: "Rechazadas" },
  { id: "todas", label: "Todas" },
];

const EMPTY_COPY = {
  pendiente: {
    title: "No hay solicitudes pendientes",
    text: "Cuando alguien envíe una solicitud desde el sitio público, aparecerá aquí para que la leas y decidas si publicarla.",
  },
  publicada: {
    title: "Todavía no hay solicitudes publicadas",
    text: "Acepta una solicitud pendiente o crea una nueva para que aparezca en el muro público.",
  },
  rechazada: {
    title: "No hay solicitudes rechazadas",
    text: "Las solicitudes que descartes quedarán guardadas en esta pestaña.",
  },
  todas: {
    title: "No hay solicitudes",
    text: "Crea la primera solicitud o espera los envíos de la comunidad.",
  },
};

function AdminBoot() {
  return (
    <div className="admin-login admin-login--boot">
      <Box sx={{ display: "grid", placeItems: "center", gap: 2 }}>
        <CircularProgress sx={{ color: "#0e872c" }} />
        <span className="admin-login__loading">Comprobando sesión…</span>
      </Box>
    </div>
  );
}

export default function AdminPage() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(() => Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) {
      setChecking(false);
      return undefined;
    }

    let active = true;

    api.auth
      .session()
      .then((data) => {
        if (active) setSession(data.user);
      })
      .catch(() => {
        if (active) {
          clearToken();
          setSession(null);
        }
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleLoggedIn = useCallback((data) => {
    setToken(data.token);
    setSession(data.user);
  }, []);

  const handleLogout = useCallback(() => {
    clearToken();
    setSession(null);
  }, []);

  return (
    <ThemeProvider theme={adminTheme}>
      {checking ? (
        <AdminBoot />
      ) : session ? (
        <AdminWorkspace session={session} onLogout={handleLogout} />
      ) : (
        <AdminLogin onLoggedIn={handleLoggedIn} />
      )}
    </ThemeProvider>
  );
}

function AdminWorkspace({ session, onLogout }) {
  const [categories, setCategories] = useState([]);
  const [requests, setRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState("pendiente");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);

  const handleAuthError = useCallback(
    (authError) => {
      if (authError?.status === 401) {
        onLogout();
        return true;
      }
      return false;
    },
    [onLogout],
  );

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
        if (active && !handleAuthError(categoriesError)) {
          setError(categoriesError.message);
        }
      });

    return () => {
      active = false;
    };
  }, [handleAuthError]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    api.admin
      .requests({
        moderation: tab === "todas" ? "" : tab,
        q: debouncedQuery,
      })
      .then((data) => {
        if (active) setRequests(data.requests);
      })
      .catch((requestsError) => {
        if (active && !handleAuthError(requestsError)) {
          setError(requestsError.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tab, debouncedQuery, refreshKey, handleAuthError]);

  useEffect(() => {
    let active = true;

    api.admin
      .stats()
      .then((data) => {
        if (active) setStats(data);
      })
      .catch((statsError) => {
        if (active) handleAuthError(statsError);
      });

    return () => {
      active = false;
    };
  }, [refreshKey, handleAuthError]);

  useEffect(() => {
    let active = true;

    api.admin
      .requests({})
      .then((data) => {
        if (active) setAllRequests(data.requests);
      })
      .catch((allError) => {
        if (active) handleAuthError(allError);
      });

    return () => {
      active = false;
    };
  }, [refreshKey, handleAuthError]);

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);
  const dismissToast = useCallback(() => setToast(null), []);

  const notify = useCallback((message, tone = "success") => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const updateRequest = useCallback(
    async (id, payload, message) => {
      const updated = await api.admin.update(id, payload);
      setSelected((current) => (current?.id === id ? updated : current));
      refresh();
      notify(message);
    },
    [notify, refresh],
  );

  const deleteRequest = useCallback(
    async (id) => {
      await api.admin.remove(id);
      setSelected(null);
      refresh();
      notify("Solicitud eliminada definitivamente.");
    },
    [notify, refresh],
  );

  const quickUpdate = useCallback(
    (request, payload, message) => {
      updateRequest(request.id, payload, message).catch((updateError) => {
        if (!handleAuthError(updateError)) {
          notify(updateError.message, "error");
        }
      });
    },
    [handleAuthError, notify, updateRequest],
  );

  const handleCreated = useCallback(
    (created) => {
      setShowForm(false);
      setTab(created.moderation === "publicada" ? "publicada" : "pendiente");
      refresh();
      notify(
        created.moderation === "publicada"
          ? "Solicitud creada y publicada en el muro."
          : "Solicitud guardada como pendiente de revisión.",
      );
    },
    [notify, refresh],
  );

  const countFor = (id) =>
    id === "todas" ? stats?.total : stats?.byModeration?.[id];

  const empty = EMPTY_COPY[tab];

  return (
    <div className="admin-page">
      <header className="admin-topbar">
        <div className="container admin-topbar__inner">
          <Brand variant="dark" />

          <div className="admin-topbar__actions">
            <span className="admin-user">
              Sesión: <strong>{session?.name}</strong>
            </span>
            <Link to="/" className="btn btn--outline">
              Ver sitio público
            </Link>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setShowForm(true)}
            >
              <span aria-hidden="true">＋</span> Nueva solicitud
            </button>
            <button type="button" className="btn btn--text" onClick={onLogout}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="container admin-main">
        <div className="admin-head">
          <div>
            <span className="eyebrow eyebrow--dark">Panel de administración</span>
            <h1>Dashboard y gestión</h1>
            <p>
              Consulta la actividad de la comunidad y administra cada solicitud:
              leer, aceptar, publicar o rechazar.
            </p>
          </div>
          <button
            type="button"
            className="btn btn--outline"
            onClick={refresh}
            disabled={loading}
          >
            <span aria-hidden="true">↻</span> Actualizar
          </button>
        </div>

        <AdminDashboard
          stats={stats}
          requests={allRequests}
          categories={categories}
        />

        <div className="admin-section-head">
          <h2>Bandeja de solicitudes</h2>
          <p>
            Nada se muestra en el muro público hasta que lo apruebes desde aquí.
          </p>
        </div>

        <div className="admin-toolbar">
          <div
            className="toolbar__tabs admin-toolbar__tabs"
            role="tablist"
            aria-label="Filtrar por moderación"
          >
            {TABS.map((item) => {
              const total = countFor(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  className={`tab ${tab === item.id ? "tab--active" : ""}`}
                  onClick={() => setTab(item.id)}
                >
                  {item.label}
                  {total !== undefined && (
                    <span className="tab__count">{total}</span>
                  )}
                </button>
              );
            })}
          </div>

          <label className="search admin-toolbar__search">
            <span aria-hidden="true">🔎</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por título, autor o barrio…"
              aria-label="Buscar solicitudes"
            />
          </label>
        </div>

        {error && (
          <div className="alert alert--banner" role="alert">
            <span>No pudimos conectar con el servidor: {error}</span>
            <button type="button" className="btn btn--text" onClick={refresh}>
              Reintentar
            </button>
          </div>
        )}

        {loading && requests.length === 0 && (
          <p className="admin-loading">Cargando solicitudes…</p>
        )}

        {!loading && requests.length === 0 && (
          <div className="admin-empty">
            <strong>{empty.title}</strong>
            <p>{empty.text}</p>
            <button
              type="button"
              className="btn btn--outline"
              onClick={() => setShowForm(true)}
            >
              Crear una solicitud
            </button>
          </div>
        )}

        {requests.length > 0 && (
          <AdminTable
            requests={requests}
            categoriesById={categoriesById}
            onRead={setSelected}
            onPublish={(request) =>
              quickUpdate(
                request,
                { moderation: "publicada" },
                "Solicitud aceptada y publicada en el muro.",
              )
            }
            onReject={(request) =>
              quickUpdate(
                request,
                { moderation: "rechazada" },
                "Solicitud rechazada. No se mostrará en el muro.",
              )
            }
            onUnpublish={(request) =>
              quickUpdate(
                request,
                { moderation: "pendiente" },
                "Solicitud ocultada; vuelve a pendientes.",
              )
            }
          />
        )}

        <p className="admin-footnote">
          Sesión protegida por token. La contraseña debe tener máximo 8
          caracteres y ninguno repetido; cambia las credenciales con las
          variables de entorno del servidor.
        </p>
      </main>

      {showForm && (
        <RequestForm
          mode="admin"
          categories={categories}
          defaultName="Equipo AyudApp"
          onClose={() => setShowForm(false)}
          onCreated={handleCreated}
          onNameChange={() => {}}
        />
      )}

      {selected && (
        <AdminRequestModal
          request={selected}
          category={categoriesById.get(selected.category)}
          onClose={() => setSelected(null)}
          onUpdate={updateRequest}
          onDelete={deleteRequest}
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
