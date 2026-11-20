// client/src/components/UploadModal.jsx
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { readMp3Tags } from "../mp3.js";
import { formatDuration, readAudioDuration } from "../media.js";
import { isAudioFile } from "../audio.js";
import ThoughtLine from "./ThoughtLine.jsx";

const EMPTY = { title: "", artist: "", album: "", cover: null };
const MAX_FILES = 20;

const BATCH_STEPS = [
  "Leyendo etiquetas de los archivos",
  "Calculando duraciones",
  "Guardando la música",
];

const AUDIO_ACCEPT = [
  "audio/*",
  ".mp3",
  ".m4a",
  ".m4b",
  ".aac",
  ".wav",
  ".ogg",
  ".oga",
  ".opus",
  ".flac",
  ".webm",
  ".wma",
  ".aif",
  ".aiff",
  ".mp4",
].join(",");

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

const baseTitle = file => file.name.replace(/\.[^.]+$/, "");

export default function UploadModal({
  open,
  onClose,
  onSaved,
  onSavedMany,
  onUpdated,
  track = null,
}) {
  const editing = Boolean(track);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [duration, setDuration] = useState(null);
  const [artists, setArtists] = useState(() => loadList(ARTISTS_KEY));
  const [albums, setAlbums] = useState(() => loadList(ALBUMS_KEY));
  const [batch, setBatch] = useState(null);
  const [batchWorking, setBatchWorking] = useState(false);
  const [error, setError] = useState("");

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
      setBatch(null);
      setBatchWorking(false);
      setError("");
    } else {
      // Recargar sugerencias cada vez que se abre el modal
      setArtists(loadList(ARTISTS_KEY));
      setAlbums(loadList(ALBUMS_KEY));
      setDragging(false);
      setReading(false);
      setSaving(false);
      setError("");

      if (track) {
        // Modo edición: rellenamos el formulario con la canción guardada.
        setFile(null);
        setBatch(null);
        setBatchWorking(false);
        setForm({
          title: track.title || "",
          artist: track.artist === "Artista desconocido" ? "" : track.artist || "",
          album: track.album === "—" ? "" : track.album || "",
          cover: track.cover || null,
        });
        setDuration(track.duration ?? null);
      } else {
        setFile(null);
        setBatch(null);
        setBatchWorking(false);
        setForm(EMPTY);
        setDuration(null);
      }
    }
  }, [open, track]);

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

  const processBatch = async (files, token) => {
    const items = [];
    const newArtists = [];
    const newAlbums = [];

    try {
      for (const currentFile of files) {
        if (token !== readToken.current) return;

        const [tags, seconds] = await Promise.all([
          readMp3Tags(currentFile),
          readAudioDuration(currentFile),
        ]);
        if (token !== readToken.current) return;

        const artist = tags.artist || "Artista desconocido";
        const album = tags.album || "—";
        if (artist !== "Artista desconocido") newArtists.push(artist);
        if (album !== "—") newAlbums.push(album);

        items.push({
          // Se añade tal cual: sin formulario, usando etiquetas o el nombre del archivo.
          title: tags.title || baseTitle(currentFile),
          artist,
          album,
          cover: tags.cover,
          duration: seconds,
          fileName: currentFile.name,
          size: currentFile.size,
          addedAt: Date.now() + items.length,
          file: currentFile,
        });
      }

      if (newArtists.length) {
        setArtists(prev => saveList(ARTISTS_KEY, [...prev, ...newArtists]));
      }
      if (newAlbums.length) {
        setAlbums(prev => saveList(ALBUMS_KEY, [...prev, ...newAlbums]));
      }

      if (token !== readToken.current) return;
      await onSavedMany?.(items);
      if (token !== readToken.current) return;

      setBatchWorking(false);
      onClose();
    } catch (failure) {
      if (token !== readToken.current) return;
      console.warn("No se pudieron guardar los archivos.", failure);
      setBatchWorking(false);
      setError("No se pudieron guardar los archivos. Inténtalo de nuevo.");
    }
  };

  const handleFile = async (f, token = ++readToken.current) => {
    if (!f) return;
    if (!isAudioFile(f)) {
      setError("Solo se permiten archivos de audio.");
      return;
    }

    setError("");
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

  const handleFiles = fileList => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    if (files.length > MAX_FILES) {
      setError(`Puedes subir hasta ${MAX_FILES} archivos a la vez.`);
      return;
    }
    const invalid = files.find(currentFile => !isAudioFile(currentFile));
    if (invalid) {
      setError(`Solo se permiten archivos de audio: ${invalid.name}`);
      return;
    }

    const token = ++readToken.current;
    setError("");

    if (files.length === 1) {
      setBatch(null);
      setBatchWorking(false);
      handleFile(files[0], token);
      return;
    }

    setFile(null);
    setForm(EMPTY);
    setDuration(null);
    setBatch(files);
    setBatchWorking(true);
    processBatch(files, token);
  };

  const onDrop = e => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
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
    if ((!editing && !file) || reading || saving) return;

    setSaving(true);
    try {
      const title = form.title.trim() || (editing ? track.title : baseTitle(file));
      const artist = form.artist.trim() || "Artista desconocido";
      const album = form.album.trim() || "—";

      // Guardar en las listas de sugerencias
      if (artist && artist !== "Artista desconocido") {
        setArtists(prev => saveList(ARTISTS_KEY, [...prev, artist]));
      }
      if (album && album !== "—") {
        setAlbums(prev => saveList(ALBUMS_KEY, [...prev, album]));
      }

      if (editing) {
        // El audio, el id y la duración se conservan; solo se corrigen los datos.
        await onUpdated(track.id, { title, artist, album, cover: form.cover });
      } else {
        await onSaved({
          title,
          artist,
          album,
          cover: form.cover,
          duration,
          fileName: file.name,
          size: file.size,
          addedAt: Date.now(),
          file,
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="upload-backdrop">
      <div
        className={`upload-modal${batch ? " upload-modal--batch" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={editing ? "Editar canción" : "Añadir música"}
      >
        <header className="upload-modal__header">
          <h2>{editing ? "Editar canción" : "Añadir música"}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </header>

        {!file && !editing && !batch && (
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
            <p className="upload-drop__title">Arrastra archivos de audio aquí</p>
            <p className="upload-drop__hint">
              MP3, M4A, WAV, FLAC, OGG y más · hasta {MAX_FILES} archivos
            </p>
            <input
              ref={inputRef}
              type="file"
              accept={AUDIO_ACCEPT}
              multiple
              hidden
              onChange={e => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        )}

        {file && reading && (
          <p className="upload-loading" role="status">
            Leyendo metadatos del archivo…
          </p>
        )}

        {batch && (
          <div className="upload-batch">
            <div className="upload-batch__files">
              <p className="upload-batch__count">
                {batch.length} archivos
                {batchWorking ? " · subiendo…" : " · listos"}
              </p>
              <ul className="upload-batch__list">
                {batch.map((currentFile, index) => (
                  <li key={`${currentFile.name}-${index}`} title={currentFile.name}>
                    {currentFile.name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="upload-batch__status">
              <ThoughtLine
                working={batchWorking}
                steps={BATCH_STEPS}
                label="Procesando…"
                doneLabel="Listo en"
                glyph="sparkle"
                fontSize={16}
                breathPeriod={1.6}
                breathDepth={0.45}
                settleDuration={350}
                settleBlur={2}
                collapsible
                collapseOnSettle
                showTimer
              />
              {!batchWorking && error && (
                <>
                  <p className="upload-error" role="alert">
                    {error}
                  </p>
                  <button
                    type="button"
                    className="upload-batch__retry"
                    onClick={() => {
                      const token = ++readToken.current;
                      setError("");
                      setBatchWorking(true);
                      processBatch(batch, token);
                    }}
                  >
                    Reintentar
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {error && !batch && (
          <p className="upload-error" role="alert">
            {error}
          </p>
        )}

        {(file || editing) && !reading && !batch && (
          <form className="upload-form" onSubmit={submit}>
            <p className="upload-form__file">
              <strong>{editing ? track.fileName || track.title : file.name}</strong>
              {editing ? (
                <span className="upload-form__note"> · El audio no se modifica.</span>
              ) : (
                ` · ${(file.size / 1024 / 1024).toFixed(2)} MB`
              )}
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
                {saving ? "Guardando…" : editing ? "Guardar cambios" : "Guardar"}
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
