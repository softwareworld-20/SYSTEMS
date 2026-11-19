// client/src/components/NavLayout.jsx
import { Outlet, useLocation, Link } from "react-router-dom";
import PillNav from "./PillNav.jsx";
import DarkVeil from "./DarkVeil.jsx";

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

  return (
    <>
      {/* Fondo WebGL fijo */}
      <div className="veil-background" aria-hidden="true">
        <DarkVeil
          color="#009dff"
          speed={0.5}
          scale={1.1}
          flow={1}
          warp={0.2}
          sheen={0.2}
          glow={0.6}
          brightness={1}
          grain={0.03}
          quality={0.6}
          fade={0.15}
          mouseInteraction
          mouseStrength={1.2}
          intro
        />
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
        </header>

        <main className="layout__main">
          <Outlet />
        </main>
      </div>
    </>
  );
}