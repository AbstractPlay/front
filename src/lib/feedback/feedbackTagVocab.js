import { API_ENDPOINT_OPEN } from "../../config";

let cachedVocab = null;
let loadPromise = null;

export async function loadFeedbackTagVocab() {
  if (cachedVocab) {
    return { ok: true, data: cachedVocab };
  }
  if (loadPromise) {
    return loadPromise;
  }
  loadPromise = (async () => {
    try {
      const res = await fetch(API_ENDPOINT_OPEN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ query: "feedback_tag_vocab", pars: {} }),
      });
      if (!res.ok) {
        return { ok: false, error: `Request failed (${res.status})` };
      }
      const data = await res.json();
      cachedVocab = data;
      return { ok: true, data };
    } catch {
      return { ok: false, error: "Unable to load tags." };
    } finally {
      loadPromise = null;
    }
  })();
  return loadPromise;
}

export function invalidateFeedbackTagVocabCache() {
  cachedVocab = null;
}

export function tagOptionsForKind(vocab, kind) {
  if (!vocab?.tags || (kind !== "bug" && kind !== "feature")) {
    return [];
  }
  return vocab.tags.filter((entry) => entry.kinds.includes(kind));
}

export const FEEDBACK_TAG_MAX_COUNT = 3;
