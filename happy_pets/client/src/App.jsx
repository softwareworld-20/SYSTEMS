import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import About from "./pages/About.jsx";
import Administracion from "./pages/Administracion.jsx";
import AdminAdopcion from "./pages/AdminAdopcion.jsx";
import AdminHome from "./pages/AdminHome.jsx";
import AdminNotFound from "./pages/AdminNotFound.jsx";
import Adopcion from "./pages/Adopcion.jsx";
import Home from "./pages/Home.jsx";
import NotFound from "./pages/NotFound.jsx";
import Veterinario from "./pages/Veterinario.jsx";

export default function App() {
  const { pathname } = useLocation();
  const isAdminRoute =
    pathname === "/administracion" || pathname.startsWith("/administracion/");

  return (
    <div className="app-shell">
      {!isAdminRoute && <Navbar />}
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/adopcion" element={<Adopcion />} />
          <Route path="/veterinario" element={<Veterinario />} />
          <Route path="/about" element={<About />} />
          <Route path="/administracion" element={<Administracion />}>
            <Route index element={<AdminHome />} />
            <Route path="adopcion" element={<AdminAdopcion />} />
            <Route path="veterinaria" element={<AdminNotFound />} />
            <Route path="inventario" element={<AdminNotFound />} />
            <Route path="*" element={<AdminNotFound />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
