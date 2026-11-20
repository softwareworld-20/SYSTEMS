// client/src/components/MobileNav.jsx
// Navegación lateral derecha que sustituye al PillNav en pantallas táctiles.
import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import "./MobileNav.css";

export default function MobileNav({ items, activeHref, linkComponent: LinkComponent = "a" }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const closeRef = useRef(null);

  // Cerrar al cambiar de ruta (incluso desde un enlace del propio drawer).
  useEffect(() => {
    setOpen(false);
  }, [activeHref]);

  // Si la ventana crece (girar el móvil), no dejar el scroll bloqueado.
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = event => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className="mobile-nav">
      <button
        ref={triggerRef}
        type="button"
        className="mobile-nav__trigger"
        aria-label="Abrir menú"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        onClick={() => setOpen(true)}
      >
        <HugeiconsIcon icon={Menu01Icon} size={22} strokeWidth={1.8} />
      </button>

      {open && (
        <>
          <div
            className="mobile-nav__backdrop"
            aria-hidden="true"
            onClick={close}
          />

          <aside
            id="mobile-nav-drawer"
            className="mobile-nav__drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navegación principal"
          >
            <div className="mobile-nav__header">
              <span className="mobile-nav__brand">ListenU</span>
              <button
                ref={closeRef}
                type="button"
                className="mobile-nav__close"
                aria-label="Cerrar menú"
                onClick={close}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.8} />
              </button>
            </div>

            <nav className="mobile-nav__nav" aria-label="Secciones">
              <ul className="mobile-nav__list">
                {items.map(item => (
                  <li key={item.href ?? item.label}>
                    <LinkComponent
                      href={item.href}
                      className="mobile-nav__link"
                      aria-current={item.href === activeHref ? "page" : undefined}
                      onClick={close}
                    >
                      <span>{item.label}</span>
                      <span className="mobile-nav__arrow" aria-hidden="true">
                        ›
                      </span>
                    </LinkComponent>
                  </li>
                ))}
              </ul>
            </nav>

            <p className="mobile-nav__footer">OWN VIBES</p>
          </aside>
        </>
      )}
    </div>
  );
}
