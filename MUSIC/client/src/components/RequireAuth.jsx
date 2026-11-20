// client/src/components/RequireAuth.jsx
import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "../auth.js";

export default function RequireAuth() {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
}
