// client/src/components/UploadModal.jsx
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { readMp3Tags } from "../mp3.js";
import { formatDuration, readAudioDuration } from "../media.js";

const EMPTY = { title: "", artist: "", album: "", cover: null };

const ARTISTS_KEY = "listen-u:artists";
const ALBUMS_KEY = "listen-u:albums";

const loadList = key => {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(raw) ? raw.filter(Boolean) : [];
  } catch {
    return [];
  }
};

const saveList = (key, list) => {
  try {
    // Guardamos ordenados y sin duplicados
    const unique = [...new Set(list.map(s => s.trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );
    localStorage.setItem(key, JSON.stringify(unique));
    return unique;
  } catch {
    return list;
  }
};

const baseTitle = file => file.name.replace(/\.mp3$/i, "");

export default function UploadModal({ open, onClose, onSaved }) {
  const [file, setFile] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [duration, setDuration] = useState(null);
  const [artists, setArtists] = useState(() => loadList(ARTISTS_KEY));
  const [albums, setAlbums] = useState(() => loadList(ALBUMS_KEY));

  const inputRef = useRef(null);
  const readToken = useRef(0);

  useEffect(() => {
    if (!open) {
      readToken.current += 1;
      setFile(null);
      setForm(EMPTY);
      setDragging(false);
      setReading(false);
      setSaving(false);
      setDuration(null);
    } else {
      // Recargar sugerencias cada vez que se abre el modal
      setArtists(loadList(ARTISTS_KEY));
      setAlbums(loadList(ALBUMS_KEY));
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = e => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const handleFile = async f => {
    if (!f) return;
    const isMp3 =
      f.type === "audio/mpeg" || f.name.toLowerCase().endsWith(".mp3");
    if (!isMp3) return alert("Solo se permiten archivos MP3.");

    const token = ++readToken.current;
    setFile(f);
    setReading(true);
    setDuration(null);
    setForm({ ...EMPTY, title: baseTitle(f) });

    const [tags, seconds] = await Promise.all([
      readMp3Tags(f),
      readAudioDuration(f),
    ]);
    if (token !== readToken.current) return;

    setForm({
      title: tags.title || baseTitle(f),
      artist: tags.artist,
      album: tags.album,
      cover: tags.cover,
    });
    setDuration(seconds);
    setReading(false);
  };

  const onDrop = e => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const onCover = e => {
    const f = e.target.files?.[0];
    if (!f) return;

    const reader = new FileReader();
    reader.onload = () => setForm(prev => ({ ...prev, cover: reader.result }));
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  const submit = async e => {
    e.preventDefault();
    if (!file || reading || saving) return;

    setSaving(true);
    try {
      const artist = form.artist.trim() || "Artista desconocido";
      const album = form.album.trim() || "—";

      // Guardar en las listas de sugerencias
      if (artist && artist !== "Artista desconocido") {
        setArtists(prev => saveList(ARTISTS_KEY, [...prev, artist]));
      }
      if (album && album !== "—") {
        setAlbums(prev => saveList(ALBUMS_KEY, [...prev, album]));
      }

      await onSaved({
        title: form.title.trim() || baseTitle(file),
        artist,
        album,
        cover: form.cover,
        duration,
        fileName: file.name,
        size: file.size,
        addedAt: Date.now(),
        file,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="upload-backdrop" onClick={onClose}>
      <div
        className="upload-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Añadir música"
      >
        <header className="upload-modal__header">
          <h2>Añadir música</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </header>

        {!file && (
          <div
            className={`upload-drop${dragging ? " upload-drop--over" : ""}`}
            role="button"
            tabIndex={0}
            onDragOver={e => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
          >
            <p className="upload-drop__title">Arrastra un MP3 aquí</p>
            <p className="upload-drop__hint">o haz clic para elegir</p>
            <input
              ref={inputRef}
              type="file"
              accept="audio/mpeg,.mp3"
              hidden
              onChange={e => handleFile(e.target.files?.[0])}
            />
          </div>
        )}

        {file && reading && (
          <p className="upload-loading" role="status">
            Leyendo metadatos del archivo…
          </p>
        )}

        {file && !reading && (
          <form className="upload-form" onSubmit={submit}>
            <p className="upload-form__file">
              <strong>{file.name}</strong> ·{" "}
              {(file.size / 1024 / 1024).toFixed(2)} MB
              {duration ? ` · ${formatDuration(duration)}` : ""}
            </p>

            <label>
              <span>Nombre</span>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Nombre de la canción"
                autoFocus
              />
            </label>

            {/* Artista: tipeable + sugerencias */}
            <label>
              <span>Artista</span>
              <input
                list="listenu-artists"
                value={form.artist}
                onChange={e => setForm(f => ({ ...f, artist: e.target.value }))}
                placeholder="Artista"
                autoComplete="off"
              />
              <datalist id="listenu-artists">
                {artists.map(name => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </label>

            {/* Álbum: tipeable + sugerencias */}
            <label>
              <span>Álbum</span>
              <input
                list="listenu-albums"
                value={form.album}
                onChange={e => setForm(f => ({ ...f, album: e.target.value }))}
                placeholder="Álbum"
                autoComplete="off"
              />
              <datalist id="listenu-albums">
                {albums.map(name => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </label>

            <label className="upload-form__cover">
              <span>Cambiar carátula (opcional)</span>
              <span className="upload-cover">
                <span className="upload-cover__preview">
                  {form.cover ? (
                    <img src={form.cover} alt="Carátula actual" />
                  ) : (
                    "Sin carátula"
                  )}
                </span>
                <span className="upload-cover__action">
                  {form.cover ? "Cambiar imagen" : "Elegir imagen"}
                </span>
              </span>
              <input type="file" accept="image/*" hidden onChange={onCover} />
            </label>

            <footer className="upload-form__actions">
              <button
                type="button"
                className="danger"
                onClick={onClose}
                disabled={saving}
              >
                Cancelar
              </button>
              <button type="submit" className="primary" disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}