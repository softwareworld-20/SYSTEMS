import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  LockRounded,
  VisibilityOffRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import { api } from "../api.js";
import Brand from "./Brand.jsx";

const PASSWORD_MAX = 8;

function ImagePlaceholder() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="72"
      height="72"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2e9b5f"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 8h.01" />
      <path d="M11 20h-4a3 3 0 0 1 -3 -3v-10a3 3 0 0 1 3 -3h10a3 3 0 0 1 3 3v4" />
      <path d="M4 15l4 -4c.928 -.893 2.072 -.893 3 0l3 3" />
      <path d="M14 14l1 -1c.31 -.298 .644 -.497 .987 -.596" />
      <path d="M18.42 15.61a2.1 2.1 0 0 1 2.97 2.97l-3.39 3.42h-3v-3l3.42 -3.39" />
    </svg>
  );
}

export default function AdminLogin({ onLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Escribe tu usuario.");
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
      const data = await api.auth.login(username.trim(), password);
      onLoggedIn(data);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-login">
      <aside className="admin-login__art" aria-hidden="true">
        <div className="admin-login__art-frame">
          <ImagePlaceholder />
          <span className="admin-login__art-title">Imagen de la comunidad</span>
          <span className="admin-login__art-note">
            Aquí irá una fotografía del muro de ayuda.
          </span>
        </div>
      </aside>

      <div className="admin-login__side">
        <div className="admin-login__panel">
          <Brand variant="dark" to="/" />

          <div className="admin-login__heading">
            <span className="admin-login__icon" aria-hidden="true">
              <LockRounded fontSize="small" />
            </span>
            <Typography
              component="h1"
              sx={{ fontFamily: '"DM Serif Display", serif', fontSize: 34 }}
            >
              Panel de administración
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
              Acceso restringido. Inicia sesión para revisar y publicar las
              solicitudes de la comunidad.
            </Typography>
          </div>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <TextField
              label="Usuario"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              autoFocus
              fullWidth
            />

            <TextField
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              fullWidth
              slotProps={{
                htmlInput: { maxLength: PASSWORD_MAX },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        edge="end"
                        aria-label={
                          showPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                      >
                        {showPassword ? (
                          <VisibilityOffRounded fontSize="small" />
                        ) : (
                          <VisibilityRounded fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              helperText="Máximo 8 caracteres y ninguno repetido."
            />

            {error && <Alert severity="error">{error}</Alert>}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={saving}
              startIcon={
                saving ? <CircularProgress size={18} color="inherit" /> : null
              }
              sx={{ py: 1.2 }}
            >
              {saving ? "Comprobando…" : "Entrar"}
            </Button>
          </Box>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mt: 1, fontSize: 12, color: "text.secondary" }}
          >
            <span>Acceso de demostración</span>
            <span>
              <strong>admin</strong> / <strong>Admin123</strong>
            </span>
          </Stack>
        </div>
      </div>
    </div>
  );
}
