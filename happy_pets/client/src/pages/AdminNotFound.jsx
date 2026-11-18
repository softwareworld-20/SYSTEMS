import { Link } from "react-router-dom";

export default function AdminNotFound() {
  return (
    <section className="admin-panel__content">
      <div className="admin-panel__empty">
        <p className="admin-panel__code">404</p>
        <h1 className="admin-panel__empty-title">Sección vacía</h1>
        <p className="admin-panel__empty-text">
          Esta sección todavía no tiene contenido.
        </p>
        <Link className="button" to="/administracion">
          Volver al panel
        </Link>
      </div>
    </section>
  );
}
