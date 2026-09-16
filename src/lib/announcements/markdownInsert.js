/**
 * Insert text at the textarea selection (or append at end).
 * @param {HTMLTextAreaElement | null} textarea
 * @param {string} before
 * @param {string} [after=""]
 * @param {string} [placeholder=""]
 * @returns {string | null} updated value, or null if no textarea
 */
export function insertAtSelection(textarea, before, after = "", placeholder = "") {
  if (!textarea) {
    return null;
  }
  const value = textarea.value;
  const start = textarea.selectionStart ?? value.length;
  const end = textarea.selectionEnd ?? value.length;
  const selected = value.slice(start, end) || placeholder;
  const next = value.slice(0, start) + before + selected + after + value.slice(end);
  const cursorStart = start + before.length;
  const cursorEnd = cursorStart + selected.length;
  textarea.value = next;
  textarea.focus();
  textarea.setSelectionRange(cursorEnd, cursorEnd);
  return next;
}
