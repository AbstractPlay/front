import {
  isStructuredRenderLabel,
  resolveRenderLabel,
} from "@abstractplay/gameslib";
import { formatPlayerDisplayName } from "../components/Bots/botUtils";
import i18n from "../i18n";

export const defaultRenderLabelT = (key, params) => i18n.t(key, params);

function resolveLabelField(label, playerNames, t) {
  if (!isStructuredRenderLabel(label)) {
    return label;
  }
  return resolveRenderLabel(label, playerNames, t);
}

function walkMarkers(markers, playerNames, t) {
  if (!Array.isArray(markers)) {
    return;
  }
  for (const marker of markers) {
    if (marker?.type === "label" && marker.label !== undefined) {
      marker.label = resolveLabelField(marker.label, playerNames, t);
    }
  }
}

function walkAreas(areas, playerNames, t) {
  if (!Array.isArray(areas)) {
    return;
  }
  for (const area of areas) {
    if (area?.label !== undefined) {
      area.label = resolveLabelField(area.label, playerNames, t);
    }
    if (area?.type === "buttonBar" && Array.isArray(area.buttons)) {
      for (const button of area.buttons) {
        if (button?.label !== undefined) {
          button.label = resolveLabelField(button.label, playerNames, t);
        }
      }
    }
  }
}

function walkBoard(board, playerNames, t) {
  if (!board || typeof board !== "object") {
    return;
  }
  if (board.boardOne?.label !== undefined) {
    board.boardOne.label = resolveLabelField(
      board.boardOne.label,
      playerNames,
      t
    );
  }
  if (board.boardTwo?.label !== undefined) {
    board.boardTwo.label = resolveLabelField(
      board.boardTwo.label,
      playerNames,
      t
    );
  }
  walkMarkers(board.markers, playerNames, t);
}

function resolveOneRenderRep(rep, playerNames, t) {
  const out = structuredClone(rep);
  walkBoard(out.board, playerNames, t);
  walkAreas(out.areas, playerNames, t);
  return out;
}

/** Resolve structured render labels to display strings before drawing. */
export function resolveRenderLabels(rep, players, users, t = defaultRenderLabelT) {
  if (rep == null || typeof rep !== "object") {
    return rep;
  }
  const playerNames = players.map((p) => formatPlayerDisplayName(p, users));
  if (Array.isArray(rep)) {
    return rep.map((r) => resolveOneRenderRep(r, playerNames, t));
  }
  return resolveOneRenderRep(rep, playerNames, t);
}
