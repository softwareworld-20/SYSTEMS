// client/src/pages/Playlist.jsx
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { MusicNote01Icon, PlayIcon, Delete02Icon } from "@hugeicons/core-free-icons";
import AnimatedList from "../components/AnimatedList.jsx";
import UploadModal from "../components/UploadModal.jsx";
import Player from "../components/Player.jsx";
import { useTracks } from "../hooks/useTracks.js";
import { formatDuration } from "../media.js";
import "../styles/upload.css";

export default function Playlist() {
  const { tracks, addTrack, removeTrack } = useTracks();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [selected, setSelected] = useState(() => new Set());

  const activeTrack = tracks.find(track => track.id === activeId) ?? null;

  const openPlayer = track => setActiveId(track.id);

  const toggleSelect = (id, event) => {
    event.stopPropagation();
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const handleDeleteSelected = () => {
    if (selected.size === 0) return;

    const ids = [...selected];
    ids.forEach(id => {
      removeTrack(id);
      if (id === activeId) setActiveId(null);
    });
    clearSelection();
  };

  const renderTrack = track => {
    const isChecked = selected.has(track.id);
  
    return (
      <span className="track">
        {/* Checkbox integrado a la izquierda */}
        <label
          className={`track__check${isChecked ? " track__check--on" : ""}`}
          onClick={e => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isChecked}
            onChange={e => toggleSelect(track.id, e)}
            aria-label={`Seleccionar ${track.title}`}
          />
          <span className="track__check-box" aria-hidden="true" />
        </label>
  
        <span className="track__cover">
          {track.cover ? (
            <img src={track.cover} alt="" />
          ) : (
            <HugeiconsIcon icon={MusicNote01Icon} size={18} strokeWidth={1.6} />
          )}
        </span>
  
        <span className="track__info">
          <span className="track__title">{track.title}</span>
          <span className="track__description">
            {track.artist}
            {track.album && track.album !== "—" ? ` · ${track.album}` : ""}
          </span>
        </span>
  
        <span className="track__duration">{formatDuration(track.duration)}</span>
  
        <button
          type="button"
          className="track__play"
          onClick={event => {
            event.stopPropagation();
            openPlayer(track);
          }}
          aria-label={`Reproducir ${track.title}`}
        >
          <HugeiconsIcon icon={PlayIcon} size={16} strokeWidth={2.2} />
        </button>
      </span>
    );
  };

  return (
    <div className="playlist">
      <header className="playlist__header">
        <h1 className="playlist__title">Tu lista</h1>
        <button
          type="button"
          className="playlist__add"
          onClick={() => setModalOpen(true)}
          aria-label="Añadir música"
        >
          +
        </button>
      </header>

      {/* Barra de acciones cuando hay selección */}
      {selected.size > 0 && (
        <div className="playlist__bulk" role="toolbar" aria-label="Acciones de selección">
          <span className="playlist__bulk-count">
            {selected.size} seleccionada{selected.size === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            className="playlist__bulk-delete"
            onClick={handleDeleteSelected}
          >
            <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={1.8} />
            Eliminar
          </button>
          <button
            type="button"
            className="playlist__bulk-cancel"
            onClick={clearSelection}
          >
            Cancelar
          </button>
        </div>
      )}

      {tracks.length === 0 ? (
        <p className="playlist__empty">
          Aún no has añadido música. Pulsa el <strong>+</strong> para empezar.
        </p>
      ) : (
        <AnimatedList
          items={tracks}
          renderItem={renderTrack}
          animation="pop"
          theme="dark"
          width={560}
          maxHeight={470}
          radius={14}
          gap={6}
          stagger={0.05}
          fadeSize={52}
          frame
          showGradients
          displayScrollbar
          selectOnHover
          enableArrowNavigation
          initialSelectedIndex={-1}
          onItemSelect={openPlayer}
        />
      )}

      <UploadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={addTrack}
      />

      <Player track={activeTrack} onClose={() => setActiveId(null)} />
    </div>
  );
}