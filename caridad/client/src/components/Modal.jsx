import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Modal({
  title,
  subtitle,
  onClose,
  children,
  size = "md",
}) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`modal modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "Detalle"}
      >
        <header className="modal__header">
          <div className="modal__heading">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
