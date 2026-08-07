import { callAuthApi } from "./api";
import { useStore } from "../stores";

export function isParticipant(game, userId) {
  if (!game || userId == null) return false;
  return game.players?.some((p) => p.id === userId) ?? false;
}

export function isGameCompleted(game) {
  if (!game) return false;
  if (Array.isArray(game.toMove)) {
    return (game.players?.length ?? 0) > 0 && game.toMove.every((t) => !t);
  }
  return game.toMove === "" || game.toMove === null;
}

export function isWatched(globalMe, gameId) {
  return (
    globalMe?.watchedGames?.some((g) => g.id === gameId) ?? false
  );
}

export function isHighlighted(globalMe, gameId) {
  return globalMe?.highlights?.some((g) => g.id === gameId) ?? false;
}

export function isRecommended(globalMe, metaGame, gameId) {
  return (
    globalMe?.representatives?.some(
      (g) => g.id === gameId && g.metaGame === metaGame
    ) ?? false
  );
}

export function recommendCountForMeta(globalMe, metaGame) {
  return (
    globalMe?.representatives?.filter((g) => g.metaGame === metaGame).length ??
    0
  );
}

async function callMarkMutation(query, pars) {
  const res = await callAuthApi(query, pars);
  if (!res) return { ok: false, cancelled: true };
  if (res.status !== 200) {
    let message = `Request failed (${res.status})`;
    try {
      const result = await res.json();
      if (result.body) {
        const body =
          typeof result.body === "string"
            ? JSON.parse(result.body)
            : result.body;
        message = body.message || body.error || JSON.stringify(body);
      } else if (result.message) {
        message = result.message;
      }
    } catch {
      // keep default message
    }
    return { ok: false, error: message };
  }
  const result = await res.json();
  let payload = result.body;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      // use raw string
    }
  }
  return { ok: true, payload };
}

function patchGlobalMe(patchFn) {
  const { setGlobalMe, globalMe } = useStore.getState();
  if (!globalMe) return null;
  const newMe = JSON.parse(JSON.stringify(globalMe));
  patchFn(newMe);
  setGlobalMe(newMe);
  return newMe;
}

export async function toggleWatch({ metaGame, id, gameSummary, watching }) {
  const query = watching ? "unwatch_game" : "watch_game";
  const res = await callMarkMutation(query, { metaGame, id });
  if (res.cancelled) return res;
  if (!res.ok) return res;

  patchGlobalMe((me) => {
    if (!Array.isArray(me.watchedGames)) me.watchedGames = [];
    if (watching) {
      me.watchedGames = me.watchedGames.filter((g) => g.id !== id);
    } else if (gameSummary && !me.watchedGames.some((g) => g.id === id)) {
      me.watchedGames.push(gameSummary);
    } else if (res.payload?.watchedGames) {
      me.watchedGames = res.payload.watchedGames;
    }
  });
  return res;
}

export async function toggleHighlight({ metaGame, id, gameSummary, highlighted }) {
  const query = highlighted ? "unhighlight_game" : "highlight_game";
  const res = await callMarkMutation(query, { metaGame, id });
  if (res.cancelled) return res;
  if (!res.ok) return res;

  patchGlobalMe((me) => {
    if (!Array.isArray(me.highlights)) me.highlights = [];
    if (highlighted) {
      me.highlights = me.highlights.filter((g) => g.id !== id);
    } else if (gameSummary && !me.highlights.some((g) => g.id === id)) {
      me.highlights.push(gameSummary);
    } else if (res.payload?.highlights) {
      me.highlights = res.payload.highlights;
    }
  });
  return res;
}

export async function toggleRecommend({
  metaGame,
  id,
  gameSummary,
  recommended,
}) {
  const query = recommended ? "unrecommend_game" : "recommend_game";
  const res = await callMarkMutation(query, { metaGame, id });
  if (res.cancelled) return res;
  if (!res.ok) return res;

  patchGlobalMe((me) => {
    if (!Array.isArray(me.representatives)) me.representatives = [];
    if (recommended) {
      me.representatives = me.representatives.filter(
        (g) => !(g.id === id && g.metaGame === metaGame)
      );
    } else if (
      gameSummary &&
      !me.representatives.some(
        (g) => g.id === id && g.metaGame === metaGame
      )
    ) {
      me.representatives.push({ ...gameSummary, metaGame });
    } else if (res.payload?.representatives) {
      me.representatives = res.payload.representatives;
    }
  });
  return res;
}

export async function unwatchGame({ metaGame, id }) {
  return toggleWatch({ metaGame, id, watching: true });
}

export async function unhighlightGame({ metaGame, id }) {
  return toggleHighlight({ metaGame, id, highlighted: true });
}
