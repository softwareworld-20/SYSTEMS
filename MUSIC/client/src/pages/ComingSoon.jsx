import { Link } from "react-router-dom";
export default function ComingSoon({ title = "Próximamente", subtitle }) {
  return (
    <main className="coming-soon">
      <p className="coming-soon__code" aria-hidden="true">404</p>
      <h1 className="coming-soon__title">{title}</h1>
      {subtitle && <p className="coming-soon__text">{subtitle}</p>}
      <Link className="coming-soon__back" to="/">Volver al inicio</Link>
    </main>
  );
}