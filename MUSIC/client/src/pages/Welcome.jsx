const BARS = [0.38, 0.62, 1, 0.54, 0.82, 0.46, 0.68];

export default function Welcome() {
  return (
    <>
      <main className="welcome">
        <div className="welcome__content">
          <p className="welcome__kicker">
            <span className="welcome__pulse" aria-hidden="true" />
            Bienvenido a tu universo sonoro
          </p>

          <div className="welcome__brand">
            <div className="welcome__badge">
              <svg
                className="welcome__mark"
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                focusable="false"
                aria-hidden="true"
              >
                <path d="M4 10.5v3" />
                <path d="M8 7v10" />
                <path d="M12 8v8" />
                <path d="M16 4v16" />
                <path d="M20 10v4" />
              </svg>
            </div>

            <h1 className="welcome__title">
              <span className="welcome__name">ListenU</span>
              <span className="welcome__vibes">
                <span className="welcome__rule" aria-hidden="true" />
                OWN VIBES
                <span
                  className="welcome__rule welcome__rule--right"
                  aria-hidden="true"
                />
              </span>
            </h1>
          </div>

          <p className="welcome__tagline">
            Donde tu música suena como tú. Descubre, comparte y vive tus
            propias <strong>vibras</strong>.
          </p>

          <div className="welcome__wave" aria-hidden="true">
            {BARS.map((peak, index) => (
              <span
                key={index}
                className="welcome__bar"
                style={{ "--peak": peak, "--delay": `${index * 0.13}s` }}
              />
            ))}
          </div>

          <p className="welcome__soon">
            <span className="welcome__dot" aria-hidden="true" />
            Próximamente
          </p>
        </div>
      </main>

      <footer className="welcome__footer">
        <span>© 2026 ListenU</span>
        <span className="welcome__footer-sep" aria-hidden="true" />
        <span>OWN VIBES</span>
      </footer>
    </>
  );
}