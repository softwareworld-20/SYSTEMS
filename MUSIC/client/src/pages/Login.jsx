// client/src/pages/Login.jsx
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
} from "@hugeicons/core-free-icons";
import DarkVeil from "../components/DarkVeil.jsx";
import { VEIL_PROPS } from "../components/veilProps.js";
import "../styles/login.css";
import { isAuthenticated, signIn } from "../auth.js";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated()) return <Navigate to="/" replace />;

  const handleSubmit = event => {
    event.preventDefault();
    if (signIn(username, password)) {
      navigate("/", { replace: true });
      return;
    }
    setError("Usuario o contraseña incorrectos.");
  };

  return (
    <div className="login">
      <div className="login__visual" aria-hidden="true">
        <DarkVeil {...VEIL_PROPS} />
      </div>

      <section className="login__panel">
        <div className="login__card">
          <p className="login__kicker">ListenU · OWN VIBES</p>
          <h1 className="login__title">Iniciar sesión</h1>
          <p className="login__subtitle">Entra a tu universo sonoro.</p>

          <form className="login__form" onSubmit={handleSubmit}>
            <label className="login__field">
              <span>Usuario</span>
              <span className="login__input">
                <HugeiconsIcon icon={UserIcon} size={18} strokeWidth={1.7} />
                <input
                  type="text"
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  placeholder="Tu usuario"
                  autoComplete="username"
                  autoFocus
                  required
                />
              </span>
            </label>

            <label className="login__field">
              <span>Contraseña</span>
              <span className="login__input">
                <HugeiconsIcon icon={LockIcon} size={18} strokeWidth={1.7} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login__toggle"
                  onClick={() => setShowPassword(value => !value)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  <HugeiconsIcon
                    icon={showPassword ? EyeOffIcon : EyeIcon}
                    size={18}
                    strokeWidth={1.7}
                  />
                </button>
              </span>
            </label>

            {error && (
              <p className="login__error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="login__submit">
              Entrar
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
