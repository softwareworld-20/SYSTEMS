import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="page">
      <div className="page__content">
        <h1 className="page__title">404</h1>
        <p className="page__text">La página que buscas no existe.</p>
        <Link className="button" to="/">
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
