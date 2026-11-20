// client/src/components/NavLayout.jsx
import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  Logout01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";
import PillNav from "./PillNav.jsx";
import DarkVeil from "./DarkVeil.jsx";
import { VEIL_PROPS } from "./veilProps.js";
import { currentUser, signOut } from "../auth.js";

const ITEMS = [
  { label: "Inicio", href: "/" },
  { label: "Álbumes", href: "/albums" },
  { label: "Lista", href: "/playlist" },
  { label: "Ajustes", href: "/settings" },
];

// Wrapper para que PillNav use React Router
const RouterLink = ({ href, children, ...rest }) => (
  <Link to={href} {...rest}>{children}</Link>
);

export default function NavLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const username = currentUser()?.username || "SamuelS";

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!profileOpen) return undefined;

    const onPointerDown = event => {
      if (!profileRef.current?.contains(event.target)) setProfileOpen(false);
    };
    const onKeyDown = event => {
      if (event.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [profileOpen]);

  const handleLogout = () => {
    signOut();
    setProfileOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* Fondo WebGL fijo */}
      <div className="veil-background" aria-hidden="true">
        <DarkVeil {...VEIL_PROPS} />
      </div>

      <div className="layout">
        <header className="layout__header">
          <PillNav
            logo={<span className="layout__logo">LU</span>}
            logoAlt="ListenU"
            logoHref="/"
            items={ITEMS}
            activeHref={pathname}
            linkComponent={RouterLink}
            itemStyle="pill"
            hoverEffect="fill"
            indicator="dot"
            layout="split"
            surface="glass"
            size="md"
            collapse="auto"
            intro
          />

          <div className="layout__profile" ref={profileRef}>
            <button
              type="button"
              className="layout__profile-trigger"
              onClick={() => setProfileOpen(open => !open)}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              aria-label={`Opciones del perfil de ${username}`}
            >
              <span className="layout__profile-avatar" aria-hidden="true">
                <HugeiconsIcon icon={UserIcon} size={17} strokeWidth={1.8} />
              </span>
              <span className="layout__profile-name">{username}</span>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={14}
                strokeWidth={1.8}
                className="layout__profile-chevron"
              />
            </button>

            {profileOpen && (
              <div className="layout__profile-menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="layout__profile-logout"
                  onClick={handleLogout}
                >
                  <HugeiconsIcon icon={Logout01Icon} size={16} strokeWidth={1.8} />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="layout__main">
          <Outlet />
        </main>
      </div>
    </>
  );
}
