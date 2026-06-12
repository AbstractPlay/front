export const BOT_EMOJI = "\u{1F916}";
export const BOT_DISPLAY_PREFIX = `${BOT_EMOJI} `;
export const AIAI_USER_ID = "SkQfHAjeDxs8eeEnScuYA";

/** clientId in API calls is the bot's DynamoDB sk. */
export function getBotClientId(bot) {
  return bot?.sk ?? "";
}

export function findBotByClientId(bots, clientId) {
  return bots?.find((bot) => getBotClientId(bot) === clientId);
}

export function containsBotEmoji(text) {
  return text?.includes(BOT_EMOJI) ?? false;
}

export function stripBotEmoji(name) {
  if (!name) return "";
  return name
    .replace(new RegExp(`^${BOT_EMOJI}\\s*`), "")
    .replaceAll(BOT_EMOJI, "")
    .trim();
}

/** Legacy in-house AI opponent, e.g. "(Bot) Ai Ai". */
export function isLegacyAiBotPlayer(player) {
  return player?.name?.includes("(Bot)") ?? false;
}

export function isRegisteredBotUser(users, userId) {
  if (!userId || !users?.length) return false;
  const user = users.find((u) => u.id === userId);
  return user?.bot === true;
}

export function isAnyBot(entity, users) {
  if (!entity) return false;
  if (entity.bot === true) return true;
  if (entity.id === AIAI_USER_ID) return true;
  if (isLegacyAiBotPlayer(entity)) return true;
  if (entity.id && isRegisteredBotUser(users, entity.id)) return true;
  return false;
}

/** @deprecated Use isAnyBot */
export function isClientBotPlayer(player, users) {
  return isAnyBot(player, users);
}

export function formatDisplayName(name, isBot) {
  const cleaned = stripBotEmoji(name);
  if (!cleaned) return cleaned;
  if (isBot) return `${BOT_DISPLAY_PREFIX}${cleaned}`;
  return cleaned;
}

export function formatUserDisplayName(user, users) {
  if (!user) return "";
  return formatDisplayName(user.name, isAnyBot(user, users));
}

export function formatPlayerDisplayName(player, users) {
  if (!player) return "";
  return formatDisplayName(player.name, isAnyBot(player, users));
}

export function validateDisplayName(name) {
  if (containsBotEmoji(name)) {
    return "Display names cannot contain the robot emoji.";
  }
  return null;
}

export function getPlayersToMove(game, toMove) {
  if (toMove === "" || toMove === null || toMove === undefined) return [];
  if (game.simultaneous && Array.isArray(toMove)) {
    return game.players.filter((_, i) => toMove[i]);
  }
  const player = game.players[toMove];
  return player ? [player] : [];
}

export function isClientBotTurn(game, toMove, users) {
  return getPlayersToMove(game, toMove).some((player) =>
    isAnyBot(player, users)
  );
}
