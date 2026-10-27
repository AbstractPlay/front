/** Member line for ladder list/hub; activation threshold only when not yet active. */
export function formatLadderMemberCount(t, { count, min, status }) {
  const showActivationHint =
    status === "forming" || status === "suspended";
  if (showActivationHint) {
    return t("Ladder.memberCountForming", { count, min });
  }
  return t("Ladder.memberCount", { count });
}
