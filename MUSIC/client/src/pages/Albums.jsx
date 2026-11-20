// client/src/pages/Albums.jsx
import { useEffect, useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  MusicNote01Icon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import InfiniteMenu from "../components/InfiniteMenu.jsx";
import AnimatedList from "../components/AnimatedList.jsx";
import Player from "../components/Player.jsx";
import { useTracks } from "../hooks/useTracks.js";
import { buildAlbums } from "../albumMeta.js";
import { listAlbumMeta } from "../api/tracks.js";
import { formatDuration } from "../media.js";
import "../styles/upload.css";

export default function Albums() {
  const { tracks } = useTracks();
  const [albumMeta, setAlbumMeta] = useState([]);
  const albums = useMemo(() => buildAlbums(tracks, albumMeta), [tracks, albumMeta]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    let alive = true;
    listAlbumMeta()
      .then(metas => {
        if (alive) setAlbumMeta(Array.isArray(metas) ? metas : []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const activeTrack = tracks.find(t => t.id === activeId) ?? null;

  // Items para InfiniteMenu
  const menuItems = useMemo(
    () =>
      albums.map(album => ({
        image: album.cover || "", // vacío = placeholder del shader
        title: album.name === "—" ? "Sin álbum" : album.name,
        description: album.description || "",
        album, // referencia completa
      })),
    [albums],
  );

  const openAlbum = item => {
    setSelectedAlbum(item.album);
    setActiveId(null);
  };

  const closeAlbum = () => {
    setSelectedAlbum(null);
    setActiveId(null);
  };

  const openPlayer = track => setActiveId(track.id);

  // Vista detalle de un álbum
  if (selectedAlbum) {
    const albumTracks = selectedAlbum.tracks;

    const renderTrack = track => (
      <span className="track">
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
          onClick={e => {
            e.stopPropagation();
            openPlayer(track);
          }}
          aria-label={`Reproducir ${track.title}`}
        >
          <HugeiconsIcon icon={PlayIcon} size={16} strokeWidth={2.2} />
        </button>
      </span>
    );

    return (
      <div className="album-detail">
        <header className="album-detail__header">
          <button
            type="button"
            className="album-detail__back"
            onClick={closeAlbum}
            aria-label="Volver a álbumes"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} strokeWidth={1.8} />
          </button>
          <div className="album-detail__info">
            <h1 className="album-detail__title">
              {selectedAlbum.name === "—" ? "Sin álbum" : selectedAlbum.name}
            </h1>
            {selectedAlbum.description ? (
              <p className="album-detail__desc">{selectedAlbum.description}</p>
            ) : null}
            <p className="album-detail__meta">
              {albumTracks.length} canción{albumTracks.length === 1 ? "" : "es"}
            </p>
          </div>
        </header>

        <div className="album-detail__body">
          {albumTracks.length === 0 ? (
            <p className="playlist__empty">Este álbum no tiene canciones.</p>
          ) : (
            <AnimatedList
              items={albumTracks}
              renderItem={renderTrack}
              animation="pop"
              theme="dark"
              width={560}
              maxHeight="min(520px, 56svh)"
              radius={14}
              gap={6}
              stagger={0.04}
              fadeSize={48}
              frame
              showGradients
              displayScrollbar
              selectOnHover
              enableArrowNavigation
              initialSelectedIndex={-1}
              onItemSelect={openPlayer}
            />
          )}
        </div>

        <Player
          track={activeTrack}
          queue={albumTracks}
          onSelectTrack={setActiveId}
          onClose={() => setActiveId(null)}
        />
      </div>
    );
  }

  // Vista principal con InfiniteMenu
  return (
    <div className="albums">
      {menuItems.length === 0 ? (
        <div className="albums__empty">
          <h1 className="albums__title">Álbumes</h1>
          <p>
            Aún no hay álbumes. Al subir canciones y asignarles un álbum
            aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="albums__menu">
          <InfiniteMenu
            items={menuItems}
            count={Math.max(40, menuItems.length * 12)}
            tileSize={0.63}
            roundness={0.2}
            zoom={1.55}
            pullBack={1}
            stretch={0.55}
            inertia={0.6}
            autoplay={4}
            grayscale
            dim={0.45}
            intro
            showInfo
            theme="dark"
            accentColor="#009dff"
            onItemClick={openAlbum}
          />
        </div>
      )}
    </div>
  );
}