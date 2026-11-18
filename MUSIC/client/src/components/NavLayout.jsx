import { Outlet, useLocation, Link } from "react-router-dom";
import PillNav from "./PillNav.jsx";
import WaveBackground from "./WaveBackground.jsx";

const ITEMS = [
  { label: "Inicio", href: "/" },
  { label: "Álbumes", href: "/albums" },
  { label: "Lista", href: "/playlist" },
  { label: "Ajustes", href: "/settings" },
];

// Envoltorio para que PillNav use React Router sin recargar la página
const RouterLink = ({ href, children, ...rest }) => (
  <Link to={href} {...rest}>{children}</Link>
);

export default function NavLayout() {
  const { pathname } = useLocation();

  return (
    <>
      {/* El fondo de ondas ahora vive en el Layout global */}
      <WaveBackground />

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
            bounce={0.3}
            stretch={0.5}
            collapse="auto"
            intro
            ariaLabel="Navegación principal"
          />
        </header>

        <main className="layout__main">
          <Outlet />
        </main>
      </div>
    </>
  );
}