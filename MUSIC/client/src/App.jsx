import { Routes, Route } from "react-router-dom";
import NavLayout from "./components/NavLayout.jsx";
import Welcome from "./pages/Welcome.jsx";
import Albums from "./pages/Albums.jsx";
import Playlist from "./pages/Playlist.jsx";
import Settings from "./pages/Settings.jsx";
import ComingSoon from "./pages/ComingSoon.jsx"; // Para el 404 general

export default function App() {
  return (
    <Routes>
      {/* Ahora TODAS las rutas usan el NavLayout */}
      <Route element={<NavLayout />}>
        <Route path="/" element={<Welcome />} />
        <Route path="/albums" element={<Albums />} />
        <Route path="/playlist" element={<Playlist />} />
        <Route path="/settings" element={<Settings />} />
        
        {/* 404 general (opcional, redirige o muestra el ComingSoon) */}
        <Route path="*" element={<ComingSoon title="Página no encontrada" subtitle="La vista que buscas no existe (aún)." />} />
      </Route>
    </Routes>
  );
}