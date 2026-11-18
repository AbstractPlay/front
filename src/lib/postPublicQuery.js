import { API_ENDPOINT_OPEN } from "../config";

/**
 * POST an open (unauthenticated) query to the backend.
 *
 * @param {string} query
 * @param {Record<string, unknown>} [pars]
 * @returns {Promise<unknown|null>}
 */
export async function postPublicQuery(query, pars = {}) {
  const res = await fetch(API_ENDPOINT_OPEN, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, pars }),
  });
  if (!res.ok) {
    return null;
  }
  const envelope = await res.json();
  if (typeof envelope.body === "string") {
    try {
      return JSON.parse(envelope.body);
    } catch {
      return null;
    }
  }
  return envelope;
}