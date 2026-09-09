export const AVATAR_SEED_MAX_LENGTH = 64;

const SEED_PATTERN = /^[A-Za-z0-9_-]+$/;

export function validateAvatarSeed(seed) {
  if (typeof seed !== "string") {
    return { ok: false, message: "Seed must be a string." };
  }
  const trimmed = seed.trim();
  if (!trimmed) {
    return { ok: false, message: "Seed cannot be empty." };
  }
  if (trimmed.length > AVATAR_SEED_MAX_LENGTH) {
    return {
      ok: false,
      message: `Seed must be at most ${AVATAR_SEED_MAX_LENGTH} characters.`,
    };
  }
  if (!SEED_PATTERN.test(trimmed)) {
    return {
      ok: false,
      message: "Seed may only contain letters, numbers, hyphens, and underscores.",
    };
  }
  return { ok: true, seed: trimmed };
}
