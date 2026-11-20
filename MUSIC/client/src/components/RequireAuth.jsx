// client/src/components/RequireAuth.jsx
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { checkSession, isAuthenticated, signOut } from "../auth.js";

export default function RequireAuth() {
  const [state, setState] = useState(() =>
    isAuthenticated() ? "checking" : "missing",
  );

  useEffect(() => {
    if (state !== "checking") return undefined;

    let alive = true;
    checkSession().then(valid => {
      if (!alive) return;
      if (!valid) signOut();
      setState(valid ? "ready" : "missing");
    });

    return () => {
      alive = false;
    };
  }, []);

  if (state === "checking") {
    return <p className="session-check">Comprobando sesión…</p>;
  }
  if (state === "missing") return <Navigate to="/login" replace />;
  return <Outlet />;
}
