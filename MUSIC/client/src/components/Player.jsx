import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  MusicNote01Icon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
  VolumeHighIcon,
  VolumeLowIcon,
} from "@hugeicons/core-free-icons";
import ElasticSlider from "./ElasticSlider.jsx";
import { getTrackFile } from "../trackFiles.js";
import { normalizeAudio } from "../audio.js";
import { formatDuration } from "../media.js";
import "./Player.css";

export default function Player({ track, queue = [], onSelectTrack, onClose }) {
  const [displayed, setDisplayed] = useState(track);
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  const audioRef = useRef(null);
  const urlRef = useRef(null);
  const open = Boolean(track);
  const queueIndex = displayed ? queue.findIndex(item => item.id === displayed.id) : -1;
  const previousTrack = queueIndex > 0 ? queue[queueIndex - 1] : null;
  const nextTrack = queueIndex >= 0 ? queue[queueIndex + 1] ?? null : null;
  const hasQueue = queue.length > 1;

  useEffect(() => {
    if (track) setDisplayed(track);
  }, [track]);

  useEffect(() => {
    if (!displayed) return undefined;

    let cancelled = false;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }

    setLoading(true);
    setError("");
    setSrc(null);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(Number.isFinite(displayed.duration) ? displayed.duration : 0);

    getTrackFile(displayed.id)
      .then(file => {
        if (cancelled) return;

        if (!file) {
          setError("El audio de esta canción no está disponible.");
          setLoading(false);
          return;
        }

        const url = URL.createObjectURL(normalizeAudio(file));
        urlRef.current = url;
        setSrc(url);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("No se pudo cargar el audio.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [displayed?.id]);

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (open && src) {
      audio.play().catch(() => {
        setError("El navegador bloqueó la reproducción automática. Pulsa reproducir para continuar.");
      });
    } else if (!open) {
      audio.pause();
    }
  }, [open, src]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    if (audio.paused) {
      try {
        setError("");
        await audio.play();
      } catch {
        setError("El navegador bloqueó la reproducción.");
      }
    } else {
      audio.pause();
    }
  };

  const seek = event => {
    const next = Number(event.target.value);
    setCurrentTime(next);
    if (audioRef.current) audioRef.current.currentTime = next;
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      setDuration(audio.duration);
    }
  };

  const handleEnded = () => {
    // Cola: al terminar, pasamos a la siguiente canción del orden de la lista.
    if (nextTrack) {
      onSelectTrack?.(nextTrack.id);
      return;
    }
    const audio = audioRef.current;
    if (audio) audio.currentTime = 0;
    setCurrentTime(0);
    setPlaying(false);
  };

  if (!displayed) return null;

  const total = duration || displayed.duration || 0;
  const disabled = !src || loading;

  return (
    <aside
      className={`player${open ? " player--open" : ""}`}
      aria-label="Reproductor"
      aria-hidden={!open}
      inert={!open}
    >
      <audio
        ref={audioRef}
        src={src ?? undefined}
        preload="metadata"
        hidden
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onPlay={() => {
          setPlaying(true);
          setError("");
        }}
        onPause={() => setPlaying(false)}
        onEnded={handleEnded}
        onError={() => {
          if (src) {
            setError("Este formato de audio no es compatible con este navegador.");
          }
        }}
      />

      <header className="player__header">
        <span className="player__kicker">Reproduciendo</span>
        {hasQueue && queueIndex >= 0 ? (
          <span className="player__queue-position">
            {queueIndex + 1} / {queue.length}
          </span>
        ) : null}
        <button
          type="button"
          className="player__close"
          onClick={onClose}
          aria-label="Cerrar reproductor"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.8} />
        </button>
      </header>

      <div className="player__cover">
        {displayed.cover ? (
          <img src={displayed.cover} alt={`Carátula de ${displayed.title}`} />
        ) : (
          <HugeiconsIcon icon={MusicNote01Icon} size={64} strokeWidth={1.2} />
        )}
      </div>

      <div className="player__info">
        <h2 className="player__title">{displayed.title}</h2>
        <p className="player__artist">{displayed.artist}</p>
        {displayed.album && displayed.album !== "—" ? (
          <p className="player__album">{displayed.album}</p>
        ) : null}
      </div>

      {error ? (
        <p className="player__error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="player__status" role="status">
          Cargando audio…
        </p>
      ) : null}

      <div className="player__progress">
        <input
          type="range"
          min="0"
          max={total || 0}
          step="0.1"
          value={Math.min(currentTime, total || 0)}
          onChange={seek}
          disabled={!total}
          aria-label="Progreso de la canción"
        />
        <div className="player__times">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(total)}</span>
        </div>
      </div>

      <div className="player__controls">
        {hasQueue ? (
          <button
            type="button"
            className="player__skip"
            onClick={() => previousTrack && onSelectTrack?.(previousTrack.id)}
            disabled={!previousTrack}
            aria-label="Canción anterior"
          >
            <HugeiconsIcon icon={PreviousIcon} size={22} strokeWidth={1.8} />
          </button>
        ) : null}
        <button
          type="button"
          className="player__toggle"
          onClick={toggle}
          disabled={disabled}
          aria-label={playing ? "Pausar" : "Reproducir"}
        >
          <HugeiconsIcon
            icon={playing ? PauseIcon : PlayIcon}
            size={28}
            strokeWidth={2}
          />
        </button>
        {hasQueue ? (
          <button
            type="button"
            className="player__skip"
            onClick={() => nextTrack && onSelectTrack?.(nextTrack.id)}
            disabled={!nextTrack}
            aria-label="Canción siguiente"
          >
            <HugeiconsIcon icon={NextIcon} size={22} strokeWidth={1.8} />
          </button>
        ) : null}
      </div>

      <div className="player__volume">
        <ElasticSlider
          value={Math.round(volume * 100)}
          startingValue={0}
          maxValue={100}
          leftIcon={<HugeiconsIcon icon={VolumeLowIcon} size={18} />}
          rightIcon={<HugeiconsIcon icon={VolumeHighIcon} size={18} />}
          onChange={value => setVolume(value / 100)}
          maxStretch={76}
          bounce={0.65}
          growOnHover
          wheel={false}
          orientation="horizontal"
          iconPlacement="outside"
          valuePosition="none"
          thickness={5}
          activeThickness={9}
          radius={40}
          restOpacity={0.7}
          fillFrom={0}
          isStepped={false}
          stepSize={1}
          ticks={false}
          thumb={false}
          jumpToClick
          ariaLabel="Volumen"
          rangeColor="var(--blue-bell)"
          iconColor="rgba(255, 255, 255, 0.7)"
          className="player__volume-slider"
        />
      </div>
    </aside>
  );
}
