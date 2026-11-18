/**
 * Fondo de ondas de ListenU.
 *
 * SVG + CSS puro: sin librerías, sin WebGL y sin red.
 * Tres capas de olas que se balancean en bucle. Los colores salen de la
 * paleta (#0d00fd azul, #009dff blue-bell). Con prefers-reduced-motion la
 * animación se detiene (ver styles.css).
 */
export default function WaveBackground() {
  return (
    <div className="waves" aria-hidden="true">
      <svg
        className="waves__svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        focusable="false"
      >
        <defs>
          <linearGradient id="wave-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d00fd" stopOpacity="0.4" />
            <stop offset="55%" stopColor="#0d00fd" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wave-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#009dff" stopOpacity="0.3" />
            <stop offset="45%" stopColor="#0d00fd" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wave-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#009dff" stopOpacity="0.4" />
            <stop offset="40%" stopColor="#0d00fd" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wave-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#009dff" stopOpacity="0" />
            <stop offset="24%" stopColor="#c9f1ff" stopOpacity="0.9" />
            <stop offset="52%" stopColor="#009dff" stopOpacity="0.7" />
            <stop offset="78%" stopColor="#8fdcff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0d00fd" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g className="waves__layer waves__layer--back">
          <path
            fill="url(#wave-back)"
            d="M0 692C220 636 430 754 720 696 1010 638 1230 716 1440 664V900H0Z"
          />
          <path
            fill="none"
            stroke="url(#wave-line)"
            strokeWidth="1.4"
            strokeOpacity="0.55"
            d="M0 692C220 636 430 754 720 696 1010 638 1230 716 1440 664"
          />
        </g>

        <g className="waves__layer waves__layer--mid">
          <path
            fill="url(#wave-mid)"
            d="M0 776C260 718 470 832 760 772 1050 712 1232 822 1440 762V900H0Z"
          />
          <path
            fill="none"
            stroke="url(#wave-line)"
            strokeWidth="1.6"
            strokeOpacity="0.7"
            d="M0 776C260 718 470 832 760 772 1050 712 1232 822 1440 762"
          />
        </g>

        <g className="waves__layer waves__layer--front">
          <path
            fill="url(#wave-front)"
            d="M0 838C300 782 520 876 820 820 1120 764 1280 854 1440 808V900H0Z"
          />
          <path
            fill="none"
            stroke="url(#wave-line)"
            strokeWidth="2"
            strokeOpacity="0.85"
            d="M0 838C300 782 520 876 820 820 1120 764 1280 854 1440 808"
          />
        </g>
      </svg>

      <div className="waves__vignette" />
    </div>
  );
}