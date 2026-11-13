import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ExplorePage from "./pages/ExplorePage.jsx";
import LandingPage from "./pages/LandingPage.jsx";

// El panel carga MUI y las gráficas: se descarga solo al entrar en /admin.
const AdminPage = lazy(() => import("./pages/AdminPage.jsx"));

function AdminFallback() {
  return (
    <div className="route-loading" role="status">
      Cargando panel de administración…
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/Explorar_comunidad" element={<ExplorePage />} />
        <Route path="/explorar_comunidad" element={<ExplorePage />} />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<AdminFallback />}>
              <AdminPage />
            </Suspense>
          }
        />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}
