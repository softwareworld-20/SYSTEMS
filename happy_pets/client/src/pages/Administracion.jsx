import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { clearToken, getToken, setToken } from "../auth.js";
import AdminLogin from "../components/AdminLogin.jsx";

const ADMIN_LINKS = [
  { to: "/administracion/adopcion", label: "Panel de adopción" },
  { to: "/administracion/veterinaria", label: "Registro veterinaria" },
  { to: "/administracion/inventario", label: "Inventario de material" },
];

export default function Administracion() {
  const navigate = useNavigate();
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

  function handleLoggedIn(data) {
    setToken(data.token);
    setSession(data.user);
    navigate("/administracion");
  }

  function handleLogout() {
    clearToken();
    setSession(null);
    navigate("/administracion");
  }

  if (checking) {
    return (
      <div className="admin-boot" role="status">
        <span className="admin-boot__spinner" aria-hidden="true" />
        <span>Comprobando sesión…</span>
      </div>
    );
  }

  if (!session) {
    return <AdminLogin onLoggedIn={handleLoggedIn} />;
  }

  return (
    <section className="admin-panel">
      <header className="admin-panel__nav">
        <div className="admin-panel__nav-inner">
          <Link className="admin-panel__brand" to="/administracion">
            Happy<span>Pets</span>
          </Link>

          <nav
            className="admin-panel__links"
            aria-label="Navegación de administración"
          >
            {ADMIN_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  isActive
                    ? "admin-panel__link admin-panel__link--active"
                    : "admin-panel__link"
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <button
            className="admin-panel__logout"
            type="button"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="admin-panel__body">
        <Outlet />
      </div>
    </section>
  );
}
