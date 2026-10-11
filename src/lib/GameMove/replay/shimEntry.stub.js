/** Production / vite build stub — replay must never ship. */

export function isReplayActive() {
  return false;
}

export function isReplayReadOnly() {
  return false;
}

export function getEffectiveSessionMe(globalMe) {
  return globalMe;
}

export async function activateReplayFromSearchParams(_search) {
  return false;
}

export function getReplayRoute() {
  return null;
}

export function maybeReplayAuthResponse(_query, _pars) {
  return null;
}

export async function maybeReplayOpenQuery(_query, _params) {
  return null;
}

export function shouldIgnoreGameRefreshForReplay(_detail) {
  return false;
}

export function applyReplayBundleExploration() {
  return false;
}
