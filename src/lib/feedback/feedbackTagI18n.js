export function feedbackTagLabelKey(tagId) {
  return `feedback.tag.${tagId}`;
}

export function feedbackTagDescKey(tagId) {
  return `feedback.tagDesc.${tagId}`;
}

export function feedbackTagLabel(t, tagId) {
  return t(feedbackTagLabelKey(tagId), { defaultValue: tagId });
}

/** Returns undefined when no description key is defined (custom vocab slugs). */
export function feedbackTagDescription(t, tagId) {
  const key = feedbackTagDescKey(tagId);
  const translated = t(key);
  if (translated === key) {
    return undefined;
  }
  return translated;
}
