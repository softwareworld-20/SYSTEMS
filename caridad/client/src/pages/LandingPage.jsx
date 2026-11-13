import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import Brand from "../components/Brand.jsx";
import RequestForm from "../components/RequestForm.jsx";
import Toast from "../components/Toast.jsx";
import { useLocalStorage } from "../hooks/useLocalStorage.js";

export default function LandingPage() {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [userName, setUserName] = useLocalStorage("ayudapp:name", "");

  useEffect(() => {
    let active = true;

    api
      .categories()
      .then((data) => {
        if (active) setCategories(data.categories);
      })
      .catch(() => {
        // El formulario se abrirá igualmente con la categoría por defecto.
      });

    return () => {
      active = false;
    };
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const notify = useCallback((message, tone = "success") => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  const handleCreated = useCallback(() => {
    setShowForm(false);
    notify(
      "Solicitud enviada. El equipo la revisará y la publicará en el muro.",
    );
  }, [notify]);

  return (
    <div className="landing">
      <header className="landing__header">
        <Brand variant="light" />

        <nav className="landing__nav" aria-label="Principal">
          <Link className="landing__link" to="/Explorar_comunidad">
            Explorar la comunidad
          </Link>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => setShowForm(true)}
          >
            <span aria-hidden="true">＋</span> Publicar
          </button>
        </nav>
      </header>

      <main className="landing__stage">
        <div className="landing__center">
          <span className="eyebrow">Red de ayuda vecinal</span>

          <h1 className="landing__slogan">
            Un grano de arena al día
            <br />
            <em>hace la diferencia</em>
          </h1>

          <p className="landing__lead">
            Pide ayuda, ofrece la tuya y encuentra a personas dispuestas a
            sumar. Sin intermediarios, sin coste.
          </p>

          <div className="landing__actions">
            <Link
              className="btn btn--primary btn--lg"
              to="/Explorar_comunidad"
            >
              Explorar la comunidad
            </Link>
            <button
              type="button"
              className="btn btn--outline btn--lg"
              onClick={() => setShowForm(true)}
            >
              Publicar una solicitud
            </button>
          </div>
        </div>

        <aside className="landing__aside" aria-label="Cómo funciona">
          <h2>Publica, comenta y resuelve</h2>

          <p>
            <strong>Publica.</strong> Cuéntanos qué necesitas o qué puedes
            ofrecer. Cada petición encuentra su lugar en la comunidad.
          </p>

          <p>
            <strong>Comenta.</strong> Responde a otras solicitudes y deja un
            mensaje. Una conversación puede ser el primer paso para ayudar.
          </p>

          <p>
            <strong>Resuelve.</strong> Coordinad la ayuda y cierra la
            solicitud. Cuando una necesidad se resuelve, la comunidad crece.
          </p>
        </aside>
      </main>

      {showForm && (
        <RequestForm
          categories={categories}
          defaultName={userName}
          onClose={() => setShowForm(false)}
          onCreated={handleCreated}
          onNameChange={setUserName}
        />
      )}

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          tone={toast.tone}
          onDone={dismissToast}
        />
      )}
    </div>
  );
}
