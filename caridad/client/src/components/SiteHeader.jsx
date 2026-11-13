import { NavLink } from "react-router-dom";
import Brand from "./Brand.jsx";

export default function SiteHeader({ onPublish }) {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Brand variant="dark" />

        <nav className="site-header__nav" aria-label="Principal">
          <NavLink
            className={({ isActive }) =>
              `site-nav-link${isActive ? " active" : ""}`
            }
            to="/"
            end
          >
            Inicio
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `site-nav-link${isActive ? " active" : ""}`
            }
            to="/Explorar_comunidad"
          >
            Explorar
          </NavLink>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={onPublish}
          >
            <span aria-hidden="true">＋</span> Publicar
          </button>
        </nav>
      </div>
    </header>
  );
}
