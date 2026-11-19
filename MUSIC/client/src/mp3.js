// client/src/mp3.js
const EMPTY_TAGS = { title: "", artist: "", album: "", cover: null };

const asText = value => (typeof value === "string" ? value.trim() : "");

let readerPromise;

/** Loads jsmediatags only when the first MP3 is selected. */
function getReader() {
  readerPromise ??= import("jsmediatags/dist/jsmediatags.min.js").then(
    module => module.default,
  );
  return readerPromise;
}

function pictureToDataUrl(picture) {
  const bytes = picture?.data;
  if (!bytes?.length) return null;

  const view = new Uint8Array(bytes);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < view.length; i += chunk) {
    binary += String.fromCharCode(...view.subarray(i, i + chunk));
  }

  const mime = picture.format || "image/jpeg";
  return `data:${mime};base64,${btoa(binary)}`;
}

/**
 * Reads ID3 tags from an MP3 File/Blob.
 * Resolves with empty values when the file has no tags or reading fails.
 */
export async function readMp3Tags(file) {
  try {
    const jsmediatags = await getReader();

    return await new Promise(resolve => {
      jsmediatags.read(file, {
        onSuccess: ({ tags }) => {
          resolve({
            title: asText(tags.title),
            artist: asText(tags.artist),
            album: asText(tags.album),
            cover: pictureToDataUrl(tags.picture),
          });
        },
        onError: () => resolve(EMPTY_TAGS),
      });
    });
  } catch {
    return EMPTY_TAGS;
  }
}
