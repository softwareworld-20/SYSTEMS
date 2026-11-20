// client/src/auth.js
// Login real contra la API. La sesión se guarda como token Bearer en sessionStorage.
const TOKEN_KEY = "listen-u:token";
const USER_KEY = "listen-u:user";

let memoryToken = null;
let memoryUser = null;

const read = (key, fallback) => {
  try {
    return sessionStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    // Con sessionStorage bloqueado basta con el valor en memoria.
  }
};

export const getToken = () => read(TOKEN_KEY, memoryToken);

export const currentUser = () => {
  const raw = read(USER_KEY, memoryUser ? JSON.stringify(memoryUser) : null);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const isAuthenticated = () => Boolean(getToken());

const setSession = (token, user) => {
  memoryToken = token;
  memoryUser = user;
  write(TOKEN_KEY, token);
  write(USER_KEY, JSON.stringify(user));
};

/** Devuelve { ok, user } o { ok: false, error } con un mensaje en español. */
export async function signIn(username, password) {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { ok: false, error: data.error || "Credenciales incorrectas." };
    }

    const user = { id: data.user?.id, username: data.username };
    setSession(data.token, user);
    return { ok: true, user };
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor." };
  }
}

/** Comprueba el token al entrar: lo renueva como válido o limpia la sesión. */
export async function checkSession() {
  const token = getToken();
  if (!token) return false;

  try {
    const response = await fetch("/api/auth/session", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      signOut();
      return false;
    }
    const data = await response.json();
    setSession(token, data.user ?? currentUser());
    return true;
  } catch {
    // Si es un fallo de red, conservamos la sesión local.
    return false;
  }
}

export const signOut = () => {
  memoryToken = null;
  memoryUser = null;
  write(TOKEN_KEY, null);
  write(USER_KEY, null);
};
