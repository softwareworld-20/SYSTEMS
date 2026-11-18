import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

const PASSWORD_MAX = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminLogin({ onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Escribe tu correo electrónico.");
      return;
    }
    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setError("Escribe un correo electrónico válido.");
      return;
    }
    if (!password) {
      setError("Escribe tu contraseña.");
      return;
    }
    if (password.length > PASSWORD_MAX) {
      setError(`La contraseña no puede superar los ${PASSWORD_MAX} caracteres.`);
      return;
    }
    if (new Set(password).size !== password.length) {
      setError("La contraseña no puede repetir caracteres.");
      return;
    }

    setSaving(true);
    try {
      const data = await api.auth.login(cleanEmail, password);
      onLoggedIn(data);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-login">
      <div className="admin-login__visual">
        <svg
          className="admin-login__art"
          viewBox="0 0 520 460"
          role="img"
          aria-labelledby="admin-art-title admin-art-desc"
        >
          <title id="admin-art-title">Happy Pets</title>
          <desc id="admin-art-desc">
            Imagen ilustrativa provisional con una huella de mascota.
          </desc>

          <defs>
            <linearGradient id="admin-art-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="55%" stopColor="#eaf6fb" />
              <stop offset="100%" stopColor="#c9e9f4" />
            </linearGradient>
            <linearGradient id="admin-art-paw" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#62b6d5" />
              <stop offset="100%" stopColor="#3f9fbf" />
            </linearGradient>
          </defs>

          <rect
            x="12"
            y="12"
            width="496"
            height="436"
            rx="36"
            fill="url(#admin-art-bg)"
          />
          <circle cx="420" cy="100" r="70" fill="#ffffff" opacity="0.35" />
          <circle cx="90" cy="360" r="105" fill="#ffffff" opacity="0.28" />

          <g transform="translate(260 190)">
            <ellipse
              cx="-62"
              cy="-40"
              rx="20"
              ry="27"
              transform="rotate(-25 -62 -40)"
              fill="url(#admin-art-paw)"
            />
            <ellipse
              cx="-22"
              cy="-62"
              rx="21"
              ry="29"
              transform="rotate(-8 -22 -62)"
              fill="url(#admin-art-paw)"
            />
            <ellipse
              cx="22"
              cy="-62"
              rx="21"
              ry="29"
              transform="rotate(8 22 -62)"
              fill="url(#admin-art-paw)"
            />
            <ellipse
              cx="62"
              cy="-40"
              rx="20"
              ry="27"
              transform="rotate(25 62 -40)"
              fill="url(#admin-art-paw)"
            />
            <path
              d="M0 6c-44 0-82 32-82 70 0 30 24 52 55 52 15 0 20-6 27-6s12 6 27 6c31 0 55-22 55-52 0-38-38-70-82-70Z"
              fill="url(#admin-art-paw)"
            />
          </g>

          <text
            x="260"
            y="368"
            textAnchor="middle"
            fontFamily="Segoe UI, system-ui, sans-serif"
            fontSize="30"
            fontWeight="800"
            fill="#16333c"
          >
            Happy Pets
          </text>
          <text
            x="260"
            y="398"
            textAnchor="middle"
            fontFamily="Segoe UI, system-ui, sans-serif"
            fontSize="15"
            fill="#5a7480"
          >
            Imagen provisional
          </text>
        </svg>
      </div>

      <div className="admin-login__panel">
        <div className="admin-login__card">
          <span className="admin-login__eyebrow">Acceso administrativo</span>
          <h1 className="admin-login__title">Iniciar sesión</h1>
          <p className="admin-login__subtitle">
            Ingresa con tu correo electrónico para administrar Happy Pets.
          </p>

          <form className="admin-login__form" onSubmit={handleSubmit} noValidate>
            <label className="admin-login__field">
              <span className="admin-login__label">Correo electrónico</span>
              <input
                className="admin-login__input"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="admin@happypets.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoFocus
                required
              />
            </label>

            <label className="admin-login__field">
              <span className="admin-login__label">Contraseña</span>
              <input
                className="admin-login__input"
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                maxLength={PASSWORD_MAX}
                required
              />
              <span className="admin-login__hint">
                Máximo 8 caracteres y ninguno repetido.
              </span>
            </label>

            <button
              className="admin-login__submit"
              type="submit"
              disabled={saving}
            >
              {saving ? "Comprobando…" : "Entrar"}
            </button>

            {error && (
              <p className="admin-login__error" role="alert">
                {error}
              </p>
            )}
          </form>

          <p className="admin-login__demo">
            Acceso de demostración: <strong>admin@happypets.com</strong> /{" "}
            <strong>Admin123</strong>
          </p>

          <Link className="admin-login__back" to="/">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </section>
  );
}
