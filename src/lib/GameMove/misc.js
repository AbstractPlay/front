export const replaceNames = (rep, players) => {
  let stringRep = JSON.stringify(rep);
  for (let i = 0; i < players.length; i++) {
    const re = new RegExp(`player ${i + 1}`, "gi");
    stringRep = stringRep.replace(re, players[i].name);
  }
  return JSON.parse(stringRep);
};

export function setStatus(engine, game, isPartial, partialMove, status) {
  status.statuses = engine.statuses(isPartial, partialMove);
  if (game.scores || game.limitedPieces) {
    status.scores = engine.getPlayersScores();
  }
  if (game.playerStashes) {
    status.stashes = [];
    for (let i = 1; i <= game.numPlayers; i++) {
      const stash = engine.getPlayerStash(i);
      status.stashes.push(stash);
    }
  }
  if (game.sharedStash) {
    status.sharedstash = engine.getSharedStash(isPartial, partialMove);
  }
  // console.log("setStatus, status:", status);
}

export function isInterestingComment(comment) {
  if (!comment) return false;
  // Normalize the comment
  const normalized = comment.toLowerCase().trim();

  // Remove punctuation for comparison
  const withoutPunctuation = normalized.replace(/[^\w\s]/g, "");

  // Common boring phrases (exact matches)
  const boringPhrases = new Set([
    "gg",
    "glhf",
    "gl",
    "hf",
    "tagg",
    "hi",
    "hello",
    "hey",
    "thanks",
    "thx",
    "ty",
    "yw",
    "np",
    "wp",
    "well played",
    "good game",
    "good luck",
    "have fun",
    "thanks for the game",
    "pie invoked",
    "move",
    "gg sir",
    "gg!",
    "tagg!",
    "glhf!",
    "to a good game",
    "have a good game",
    "good luck!",
    "have fun!",
    "thanks for playing",
    "thanks for the game!",
    "gg thanks",
    "yoyo",
    "yoyo gl",
    "yoyo gl hf",
  ]);

  // Check for exact matches (with or without punctuation)
  if (boringPhrases.has(normalized) || boringPhrases.has(withoutPunctuation)) {
    return false;
  }

  // Split into words for further analysis
  const words = withoutPunctuation.split(/\s+/).filter((w) => w.length > 0);

  // Very short comments with only common game words are boring
  const commonWords = new Set([
    "gg",
    "gl",
    "hf",
    "tagg",
    "hi",
    "hello",
    "yoyo",
    "thanks",
    "thx",
    "ty",
    "wp",
    "move",
    "pie",
    "invoked",
    "good",
    "game",
    "luck",
    "fun",
    "for",
    "the",
    "a",
    "to",
    "have",
    "sir",
    "well",
    "played",
    "you",
    "too",
  ]);

  if (words.length <= 3 && words.every((w) => commonWords.has(w))) {
    return false;
  }

  // If we got here, the comment is interesting
  return true;
}

