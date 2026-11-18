import { NavLink } from "react-router-dom";

function PawIcon() {
  return (
    <svg
      className="brand__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
    >
      <ellipse cx="7" cy="7" rx="2.1" ry="2.7" />
      <ellipse cx="12" cy="5.6" rx="2.1" ry="2.9" />
      <ellipse cx="17" cy="7" rx="2.1" ry="2.7" />
      <ellipse cx="20.2" cy="11.6" rx="1.8" ry="2.2" />
      <path d="M12 10.4c-2.9 0-5.4 2.1-5.4 4.6 0 2 1.6 3.4 3.6 3.4 1 0 1.3-.4 1.8-.4s.8.4 1.8.4c2 0 3.6-1.4 3.6-3.4 0-2.5-2.5-4.6-5.4-4.6Z" />
    </svg>
  );
}

export default function Navbar() {
  return (
    <header className="navbar">
      <nav className="navbar__inner" aria-label="Navegación principal">
        <NavLink to="/" className="brand">
          <span className="brand__badge">
            <PawIcon />
          </span>
          <span className="brand__text">
            Happy<span className="brand__accent">Pets</span>
          </span>
        </NavLink>

        <ul className="navbar__links">
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? "nav-link nav-link--active" : "nav-link"
              }
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/adopcion"
              className={({ isActive }) =>
                isActive ? "nav-link nav-link--active" : "nav-link"
              }
            >
              Adopción
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/veterinario"
              className={({ isActive }) =>
                isActive ? "nav-link nav-link--active" : "nav-link"
              }
            >
              Veterinario
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                isActive ? "nav-link nav-link--active" : "nav-link"
              }
            >
              About Us
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
}
