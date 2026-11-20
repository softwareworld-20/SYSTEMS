// client/src/auth.js
// Acceso de demostración: la app no tiene backend, la sesión vive en el navegador.
export const DEMO_USERNAME = "SamuelS";
export const DEMO_PASSWORD = "Samu3l!9"; // 8 caracteres, ninguno repetido.

const SESSION_KEY = "listen-u:session";
let memorySession = null;

const readSession = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY) ?? memorySession;
  } catch {
    return memorySession;
  }
};

export const isAuthenticated = () => readSession() === DEMO_USERNAME;

export const signIn = (username, password) => {
  const valid =
    username.trim() === DEMO_USERNAME && password === DEMO_PASSWORD;
  if (!valid) return false;

  memorySession = DEMO_USERNAME;
  try {
    sessionStorage.setItem(SESSION_KEY, DEMO_USERNAME);
  } catch {
    // Si sessionStorage no está disponible, basta con el valor en memoria.
  }
  return true;
};

export const signOut = () => {
  memorySession = null;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Nada que limpiar si sessionStorage no está disponible.
  }
};
