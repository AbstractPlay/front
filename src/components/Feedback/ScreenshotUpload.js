import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { presignFeedbackUpload } from "../../lib/feedback/feedbackApi";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 5_242_880;
const MAX_FILES = 3;

function isTextInput(target) {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }
  return target.isContentEditable;
}

function extensionForType(type) {
  if (type === "image/png") {
    return "png";
  }
  if (type === "image/jpeg") {
    return "jpg";
  }
  if (type === "image/webp") {
    return "webp";
  }
  return "png";
}

function filesFromClipboard(clipboardData) {
  if (!clipboardData?.items) {
    return [];
  }
  const files = [];
  for (const item of clipboardData.items) {
    if (!item.type.startsWith("image/")) {
      continue;
    }
    const blob = item.getAsFile();
    if (!blob) {
      continue;
    }
    if (blob.name) {
      files.push(blob);
      continue;
    }
    const ext = extensionForType(blob.type);
    files.push(new File([blob], `screenshot-${Date.now()}.${ext}`, { type: blob.type }));
  }
  return files;
}

function ScreenshotUpload({ attachmentKeys, onChange }) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = useCallback(async (fileList) => {
    const files = [...fileList];
    if (files.length === 0) {
      return;
    }
    if (attachmentKeys.length + files.length > MAX_FILES) {
      setError(t("feedback.upload.tooMany", { max: MAX_FILES }));
      return;
    }
    setError("");
    setUploading(true);
    const nextKeys = [...attachmentKeys];
    try {
      for (const file of files) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          throw new Error(t("feedback.upload.invalidType"));
        }
        if (file.size > MAX_BYTES) {
          throw new Error(t("feedback.upload.tooLarge"));
        }
        const presign = await presignFeedbackUpload({
          filename: file.name,
          contentType: file.type,
          contentLength: file.size,
        });
        if (!presign.ok) {
          throw new Error(presign.error);
        }
        const putRes = await fetch(presign.data.uploadUrl, {
          method: "PUT",
          headers: presign.data.headers,
          body: file,
        });
        if (!putRes.ok) {
          throw new Error(t("feedback.upload.failed"));
        }
        nextKeys.push(presign.data.key);
      }
      onChange(nextKeys);
    } catch (err) {
      setError(err.message || t("feedback.upload.failed"));
    } finally {
      setUploading(false);
    }
  }, [attachmentKeys, onChange, t]);

  const handlePaste = useCallback((e) => {
    if (uploading || attachmentKeys.length >= MAX_FILES) {
      return;
    }
    const files = filesFromClipboard(e.clipboardData);
    if (files.length === 0) {
      setError(t("feedback.upload.pasteEmpty"));
      return;
    }
    e.preventDefault();
    handleFiles(files);
  }, [attachmentKeys.length, handleFiles, t, uploading]);

  useEffect(() => {
    function onWindowPaste(e) {
      if (uploading || attachmentKeys.length >= MAX_FILES) {
        return;
      }
      if (isTextInput(e.target)) {
        return;
      }
      const files = filesFromClipboard(e.clipboardData);
      if (files.length === 0) {
        return;
      }
      e.preventDefault();
      handleFiles(files);
    }
    window.addEventListener("paste", onWindowPaste);
    return () => window.removeEventListener("paste", onWindowPaste);
  }, [attachmentKeys.length, handleFiles, uploading]);

  const atMax = attachmentKeys.length >= MAX_FILES;

  return (
    <div className="feedback-screenshot-upload">
      <div className="feedback-screenshot-upload-actions">
        <label className="button apButtonNeutral">
          {uploading ? t("feedback.upload.uploading") : t("feedback.upload.add")}
          <input
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            multiple
            hidden
            disabled={uploading || atMax}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <div
          className="feedback-screenshot-paste-zone"
          tabIndex={uploading || atMax ? -1 : 0}
          role="button"
          aria-disabled={uploading || atMax}
          onPaste={handlePaste}
        >
          <span className="feedback-screenshot-paste-label">
            {t("feedback.upload.paste")}
          </span>
          <span className="feedback-muted">{t("feedback.upload.pasteHint")}</span>
        </div>
      </div>
      {attachmentKeys.length > 0 && (
        <p className="feedback-muted">
          {t("feedback.upload.count", { count: attachmentKeys.length })}
        </p>
      )}
      {error && <p className="has-text-danger">{error}</p>}
    </div>
  );
}

ScreenshotUpload.propTypes = {
  attachmentKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default ScreenshotUpload;
