const TOKEN_KEY = "ayudapp:adminToken";

export function getToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Si el navegador bloquea el almacenamiento, la sesión dura lo que la pestaña.
  }
}

export function clearToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Sin almacenamiento no hay nada que borrar.
  }
}
