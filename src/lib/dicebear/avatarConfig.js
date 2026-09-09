import { DEFAULT_AVATAR_STYLE, isAllowedAvatarStyle } from "./allowlist";
import { validateAvatarSeed } from "./validateSeed";

export function defaultAvatarConfig(userId) {
  return {
    style: DEFAULT_AVATAR_STYLE,
    seed: userId,
  };
}

function configFromStored(style, seed, userId) {
  if (!isAllowedAvatarStyle(style)) {
    return defaultAvatarConfig(userId);
  }
  const seedResult = validateAvatarSeed(seed);
  if (!seedResult.ok) {
    return defaultAvatarConfig(userId);
  }
  return { style, seed: seedResult.seed };
}

export function resolveAvatarConfig(user) {
  const userId = user?.id ?? user?.userId;
  if (!userId) {
    return null;
  }

  const stored = user?.settings?.all?.profile?.avatar;
  if (stored?.style && stored?.seed) {
    return configFromStored(stored.style, stored.seed, userId);
  }

  if (user?.avatarStyle && user?.avatarSeed) {
    return configFromStored(user.avatarStyle, user.avatarSeed, userId);
  }

  return defaultAvatarConfig(userId);
}

export function isDefaultAvatarConfig(config, userId) {
  if (!config || !userId) {
    return true;
  }
  return config.style === DEFAULT_AVATAR_STYLE && config.seed === userId;
}

export function avatarConfigsEqual(a, b) {
  if (!a || !b) {
    return a === b;
  }
  return a.style === b.style && a.seed === b.seed;
}
