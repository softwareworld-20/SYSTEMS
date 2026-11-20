// client/src/pages/Playlist.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Delete02Icon,
  MusicNote01Icon,
  PencilEdit02Icon,
  PlayIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import AnimatedList from "../components/AnimatedList.jsx";
import UploadModal from "../components/UploadModal.jsx";
import Player from "../components/Player.jsx";
import { useTracks } from "../hooks/useTracks.js";
import { formatDuration } from "../media.js";
import "../styles/upload.css";

const ALPHABET = ["#", ..."ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("")];

const normalize = value =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const groupLetter = title => {
  const first = String(title ?? "").trim()[0]?.toUpperCase() ?? "";
  if (!first) return "#";
  if (first === "Ñ") return "Ñ";
  const plain = normalize(first);
  return /^[a-z]$/.test(plain) ? plain.toUpperCase() : "#";
};

export default function Playlist() {
  const { tracks, addTrack, addTracks, updateTrack, removeTrack } = useTracks();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [query, setQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState(null);
  const listRef = useRef(null);

  const activeTrack = tracks.find(track => track.id === activeId) ?? null;
  const editingTrack = tracks.find(track => track.id === editingId) ?? null;

  // Orden alfabético por defecto (y estable cuando hay títulos repetidos).
  const sortedTracks = useMemo(
    () =>
      [...tracks].sort((a, b) => {
        const byTitle = normalize(a.title).localeCompare(normalize(b.title), "es", {
          sensitivity: "base",
          numeric: true,
        });
        if (byTitle) return byTitle;
        const byArtist = normalize(a.artist).localeCompare(normalize(b.artist), "es", {
          sensitivity: "base",
        });
        return byArtist || String(a.id).localeCompare(String(b.id));
      }),
    [tracks]
  );

  // Busca en todos los campos del formulario de la canción.
  const visibleTracks = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return sortedTracks;
    return sortedTracks.filter(track =>
      [track.title, track.artist, track.album, track.fileName].some(field =>
        normalize(field).includes(term)
      )
    );
  }, [sortedTracks, query]);

  const letterIndexes = useMemo(() => {
    const indexes = {};
    visibleTracks.forEach((track, index) => {
      const letter = groupLetter(track.title);
      if (indexes[letter] === undefined) indexes[letter] = index;
    });
    return indexes;
  }, [visibleTracks]);

  useEffect(() => {
    setActiveLetter(visibleTracks.length ? groupLetter(visibleTracks[0].title) : null);
    // Solo al cambiar la búsqueda: al añadir canciones se conserva la zona actual.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleVisibleIndex = useCallback(
    index => {
      const track = visibleTracks[index];
      if (track) setActiveLetter(groupLetter(track.title));
    },
    [visibleTracks]
  );

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

  const updateQuery = value => {
    setQuery(value);
    clearSelection();
  };

  const goToLetter = letter => {
    const index = letterIndexes[letter];
    if (index === undefined) return;
    listRef.current?.scrollToIndex(index);
    setActiveLetter(letter);
  };

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingId(null);
  }, []);

  const handleEditSelected = () => {
    if (selected.size !== 1) return;
    setEditingId([...selected][0]);
    setModalOpen(true);
    clearSelection();
  };

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
        <div className="playlist__search">
          <HugeiconsIcon icon={Search01Icon} size={17} strokeWidth={1.8} />
          <input
            type="search"
            value={query}
            onChange={e => updateQuery(e.target.value)}
            placeholder="Buscar canción, artista o álbum"
            aria-label="Buscar en la lista"
          />
          {query ? (
            <button
              type="button"
              className="playlist__search-clear"
              onClick={() => updateQuery("")}
              aria-label="Limpiar búsqueda"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={15} strokeWidth={1.8} />
            </button>
          ) : null}
        </div>
        <button
          type="button"
          className="playlist__add"
          onClick={() => {
            setEditingId(null);
            setModalOpen(true);
          }}
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
            className="playlist__bulk-edit"
            onClick={handleEditSelected}
            disabled={selected.size !== 1}
            title={
              selected.size === 1
                ? "Editar la canción seleccionada"
                : "Selecciona una sola canción para editar"
            }
          >
            <HugeiconsIcon icon={PencilEdit02Icon} size={16} strokeWidth={1.8} />
            Editar
          </button>
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
      ) : visibleTracks.length === 0 ? (
        <p className="playlist__empty">
          No se encontraron canciones para «{query}».
          <button type="button" className="playlist__clear-search" onClick={() => updateQuery("")}>
            Limpiar búsqueda
          </button>
        </p>
      ) : (
        <div className="playlist__content">
          <div className="playlist__list">
            <AnimatedList
              ref={listRef}
              items={visibleTracks}
              renderItem={renderTrack}
              onVisibleIndexChange={handleVisibleIndex}
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
          </div>

          <nav className="playlist__alphabet" aria-label="Índice alfabético">
            {ALPHABET.map(letter => {
              const index = letterIndexes[letter];
              const available = index !== undefined;
              return (
                <button
                  key={letter}
                  type="button"
                  className={`playlist__letter${
                    activeLetter === letter ? " playlist__letter--active" : ""
                  }`}
                  disabled={!available}
                  onClick={() => goToLetter(letter)}
                  aria-label={`Ir a canciones que empiezan por ${letter}`}
                  aria-pressed={activeLetter === letter}
                  title={available ? `Ir a ${letter}` : `Sin canciones en ${letter}`}
                >
                  {letter}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      <UploadModal
        open={modalOpen}
        onClose={closeModal}
        onSaved={addTrack}
        onSavedMany={addTracks}
        onUpdated={updateTrack}
        track={editingTrack}
      />

      <Player
        track={activeTrack}
        queue={sortedTracks}
        onSelectTrack={setActiveId}
        onClose={() => setActiveId(null)}
      />
    </div>
  );
}
