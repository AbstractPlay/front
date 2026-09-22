const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

function extensionFromKey(key) {
  if (!key || typeof key !== "string") {
    return "";
  }
  const slash = key.lastIndexOf("/");
  const base = slash >= 0 ? key.slice(slash + 1) : key;
  const dot = base.lastIndexOf(".");
  if (dot < 0 || dot === base.length - 1) {
    return "";
  }
  return base.slice(dot + 1).toLowerCase();
}

export function feedbackAttachmentFilename(key) {
  if (!key || typeof key !== "string") {
    return "";
  }
  const slash = key.lastIndexOf("/");
  const name = slash >= 0 ? key.slice(slash + 1) : key;
  return name || key;
}

export function isFeedbackImageAttachmentKey(key) {
  const ext = extensionFromKey(key);
  if (!ext) {
    return false;
  }
  return IMAGE_EXTENSIONS.has(ext);
}
