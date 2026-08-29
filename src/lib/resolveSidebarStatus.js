import {
  isStructuredRenderLabel,
  resolveRenderLabel,
} from "@abstractplay/gameslib";
import { formatPlayerDisplayName } from "../components/Bots/botUtils";
import { defaultRenderLabelT } from "./resolveRenderLabels";

function isGlyph(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    !isStructuredRenderLabel(value)
  );
}

function resolveStatusField(label, playerNames, t) {
  if (!isStructuredRenderLabel(label)) {
    return label;
  }
  return resolveRenderLabel(label, playerNames, t);
}

export function resolveSidebarStatuses(
  statuses,
  players,
  users,
  t = defaultRenderLabelT
) {
  if (!Array.isArray(statuses)) {
    return statuses;
  }
  const playerNames = players.map((p) => formatPlayerDisplayName(p, users));
  return statuses.map((row) => ({
    ...row,
    key: resolveStatusField(row.key, playerNames, t),
    value: row.value.map((entry) => {
      if (isGlyph(entry)) {
        return entry;
      }
      return resolveStatusField(entry, playerNames, t);
    }),
  }));
}

export function resolveSidebarScores(
  scores,
  players,
  users,
  t = defaultRenderLabelT
) {
  if (!Array.isArray(scores)) {
    return scores;
  }
  const playerNames = players.map((p) => formatPlayerDisplayName(p, users));
  return scores.map((block) => ({
    ...block,
    name: resolveStatusField(block.name, playerNames, t),
    scores: block.scores.map((entry) =>
      resolveStatusField(entry, playerNames, t)
    ),
  }));
}
