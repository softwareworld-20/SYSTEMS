import { Component, Suspense, lazy, useEffect, useRef, useState } from "react";

/**
 * Fondo 3D de ListenU.
 *
 * Usa una escena pública de Spline como capa decorativa a pantalla completa.
 * Para sustituirla por una escena propia (por ejemplo una exportación de
 * "Waves"), basta con cambiar SCENE_URL por la URL del archivo .splinecode
 * que genera Spline al publicar la escena.
 *
 * La estética (azul/negro, ondas luminosas) vive solo en esta capa: el
 * contenido de la welcome se mantiene plano y legible.
 */

const SCENE_URL = "https://prod.spline.design/joLpOOYbGL-10EJ4/scene.splinecode";

const Spline = lazy(() => import("@splinetool/react-spline"));

function supportsWebGl() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") || canvas.getContext("webgl"),
    );
  } catch {
    return false;
  }
}

class SceneBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function SplineBackground() {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const timeoutRef = useRef(0);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => {
      setEnabled(!motion.matches && supportsWebGl());
    };

    sync();
    motion.addEventListener("change", sync);
    return () => motion.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!enabled || ready || failed) return undefined;

    timeoutRef.current = window.setTimeout(() => setFailed(true), 20000);
    return () => window.clearTimeout(timeoutRef.current);
  }, [enabled, ready, failed]);

  const showScene = enabled && !failed;

  return (
    <div
      className={`scene${ready ? " scene--ready" : ""}`}
      aria-hidden="true"
    >
      {showScene && (
        <SceneBoundary>
          <Suspense fallback={null}>
            <Spline
              className="scene__canvas"
              scene={SCENE_URL}
              htmlContentMode="none"
              onLoad={() => setReady(true)}
            />
          </Suspense>
        </SceneBoundary>
      )}

      <div className="scene__tint" />
      <div className="scene__haze" />
      <div className="scene__vignette" />
    </div>
  );
}
