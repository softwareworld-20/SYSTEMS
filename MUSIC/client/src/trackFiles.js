// client/src/trackFiles.js
const DB_NAME = "listen-u";
const STORE = "track-files";
const VERSION = 1;

let dbPromise;

function getDb() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB no está disponible."));
  }

  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

function run(mode, action) {
  return getDb().then(
    db =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = action(tx.objectStore(STORE));

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.onabort = () => reject(tx.error);
      }),
  );
}

/** Saves the MP3 blob under the track id. */
export function saveTrackFile(id, file) {
  return run("readwrite", store => store.put(file, id));
}

/** Returns the stored MP3 blob, or undefined when it is not available. */
export function getTrackFile(id) {
  return run("readonly", store => store.get(id));
}

export function deleteTrackFile(id) {
  return run("readwrite", store => store.delete(id));
}
