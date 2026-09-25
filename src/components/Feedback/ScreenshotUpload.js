import PropTypes from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { presignFeedbackUpload } from "../../lib/feedback/feedbackApi";
import {
  feedbackAttachmentFilename,
  isFeedbackImageAttachmentKey,
} from "../../lib/feedback/feedbackAttachmentDisplay";

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "application/json",
];
const EXTENSION_TO_TYPE = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  txt: "text/plain",
  json: "application/json",
};
const FILE_INPUT_ACCEPT = [
  ...ALLOWED_TYPES,
  ".txt",
  ".json",
].join(",");
const MAX_BYTES = 5_242_880;
const DEFAULT_MAX_FILES = 3;

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
  if (type === "text/plain") {
    return "txt";
  }
  if (type === "application/json") {
    return "json";
  }
  return "png";
}

function resolveContentType(file) {
  if (ALLOWED_TYPES.includes(file.type)) {
    return file.type;
  }
  const name = file.name?.toLowerCase() ?? "";
  const dot = name.lastIndexOf(".");
  if (dot >= 0) {
    const mapped = EXTENSION_TO_TYPE[name.slice(dot + 1)];
    if (mapped) {
      return mapped;
    }
  }
  return file.type;
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

function ScreenshotUpload({
  attachmentKeys,
  onChange,
  maxFiles = DEFAULT_MAX_FILES,
  replaceOnUpload = false,
  addLabel,
  pasteLabel,
  pasteHint,
  countLabelKey = "feedback.upload.count",
}) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [previewUrlByKey, setPreviewUrlByKey] = useState({});
  const previewUrlByKeyRef = useRef(previewUrlByKey);
  previewUrlByKeyRef.current = previewUrlByKey;

  const revokePreviewUrl = useCallback((url) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }, []);

  const handleFiles = useCallback(async (fileList) => {
    let files = [...fileList];
    if (files.length === 0) {
      return;
    }
    if (replaceOnUpload) {
      files = files.slice(-1);
    }
    if (!replaceOnUpload && attachmentKeys.length + files.length > maxFiles) {
      setError(t("feedback.upload.tooMany", { max: maxFiles }));
      return;
    }
    setError("");
    setUploading(true);
    const nextKeys = replaceOnUpload ? [] : [...attachmentKeys];
    const newPreviewUrls = new Map();
    try {
      for (const file of files) {
        const contentType = resolveContentType(file);
        if (!ALLOWED_TYPES.includes(contentType)) {
          throw new Error(t("feedback.upload.invalidType"));
        }
        if (file.size > MAX_BYTES) {
          throw new Error(t("feedback.upload.tooLarge"));
        }
        const presign = await presignFeedbackUpload({
          filename: file.name,
          contentType,
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
        if (contentType.startsWith("image/")) {
          newPreviewUrls.set(presign.data.key, URL.createObjectURL(file));
        }
      }
      onChange(nextKeys);
      setPreviewUrlByKey((prev) => {
        const next = replaceOnUpload ? {} : { ...prev };
        if (replaceOnUpload) {
          Object.values(prev).forEach(revokePreviewUrl);
        }
        for (const [key, url] of newPreviewUrls) {
          next[key] = url;
        }
        return next;
      });
    } catch (err) {
      for (const url of newPreviewUrls.values()) {
        revokePreviewUrl(url);
      }
      setError(err.message || t("feedback.upload.failed"));
    } finally {
      setUploading(false);
    }
  }, [attachmentKeys, maxFiles, onChange, replaceOnUpload, revokePreviewUrl, t]);

  const removeAttachment = useCallback((key) => {
    onChange(attachmentKeys.filter((k) => k !== key));
    setPreviewUrlByKey((prev) => {
      if (!prev[key]) {
        return prev;
      }
      revokePreviewUrl(prev[key]);
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, [attachmentKeys, onChange, revokePreviewUrl]);

  const handlePaste = useCallback((e) => {
    if (uploading || (!replaceOnUpload && attachmentKeys.length >= maxFiles)) {
      return;
    }
    const files = filesFromClipboard(e.clipboardData);
    if (files.length === 0) {
      setError(t("feedback.upload.pasteEmpty"));
      return;
    }
    e.preventDefault();
    handleFiles(files);
  }, [attachmentKeys.length, handleFiles, maxFiles, replaceOnUpload, t, uploading]);

  useEffect(() => {
    function onWindowPaste(e) {
      if (uploading || (!replaceOnUpload && attachmentKeys.length >= maxFiles)) {
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
  }, [attachmentKeys.length, handleFiles, maxFiles, replaceOnUpload, uploading]);

  useEffect(() => {
    setPreviewUrlByKey((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const key of Object.keys(prev)) {
        if (!attachmentKeys.includes(key)) {
          revokePreviewUrl(prev[key]);
          delete next[key];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [attachmentKeys, revokePreviewUrl]);

  useEffect(() => () => {
    Object.values(previewUrlByKeyRef.current).forEach(revokePreviewUrl);
  }, [revokePreviewUrl]);

  const handleDropZoneDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading && (replaceOnUpload || attachmentKeys.length < maxFiles)) {
      setDragOver(true);
    }
  }, [attachmentKeys.length, maxFiles, replaceOnUpload, uploading]);

  const handleDropZoneDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDropZoneDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false);
    }
  }, []);

  const handleDropZoneDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (uploading || (!replaceOnUpload && attachmentKeys.length >= maxFiles)) {
      return;
    }
    const files = [...e.dataTransfer.files];
    if (files.length === 0) {
      return;
    }
    handleFiles(files);
  }, [attachmentKeys.length, handleFiles, maxFiles, replaceOnUpload, uploading]);

  const atMax = !replaceOnUpload && attachmentKeys.length >= maxFiles;
  const dropZoneClassName = [
    "feedback-screenshot-paste-zone",
    dragOver ? "feedback-screenshot-paste-zone--drag-over" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className="feedback-screenshot-upload">
      <div className="feedback-screenshot-upload-actions">
        <label className="button apButtonNeutral">
          {uploading ? t("feedback.upload.uploading") : (addLabel ?? t("feedback.upload.add"))}
          <input
            type="file"
            accept={FILE_INPUT_ACCEPT}
            multiple={maxFiles > 1 && !replaceOnUpload}
            hidden
            disabled={uploading || atMax}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <div
          className={dropZoneClassName}
          tabIndex={uploading || atMax ? -1 : 0}
          role="button"
          aria-disabled={uploading || atMax}
          aria-label={t("feedback.upload.dropZoneAria")}
          onPaste={handlePaste}
          onDragEnter={handleDropZoneDragEnter}
          onDragOver={handleDropZoneDragOver}
          onDragLeave={handleDropZoneDragLeave}
          onDrop={handleDropZoneDrop}
        >
          <span className="feedback-screenshot-paste-label">
            {pasteLabel ?? t("feedback.upload.paste")}
          </span>
          <span className="feedback-muted">{pasteHint ?? t("feedback.upload.pasteHint")}</span>
        </div>
      </div>
      {attachmentKeys.length > 0 && (
        <div className="feedback-screenshot-upload-previews">
          <p className="feedback-muted feedback-screenshot-upload-count">
            {t(countLabelKey, { count: attachmentKeys.length })}
          </p>
          <div className="feedback-screenshot-grid feedback-screenshot-upload-grid">
            {attachmentKeys.map((key) => {
              const previewUrl = previewUrlByKey[key];
              const isImage = isFeedbackImageAttachmentKey(key);
              return (
                <div key={key} className="feedback-screenshot-upload-item">
                  {isImage && previewUrl ? (
                    <img
                      src={previewUrl}
                      alt=""
                      className="feedback-screenshot-thumb"
                    />
                  ) : (
                    <span className="feedback-file-attachment">
                      {feedbackAttachmentFilename(key)}
                    </span>
                  )}
                  <button
                    type="button"
                    className="feedback-screenshot-remove apButtonNeutral"
                    disabled={uploading}
                    aria-label={t("feedback.upload.remove")}
                    onClick={() => removeAttachment(key)}
                  >
                    {t("feedback.upload.remove")}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {error && <p className="has-text-danger">{error}</p>}
    </div>
  );
}

ScreenshotUpload.propTypes = {
  attachmentKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  maxFiles: PropTypes.number,
  replaceOnUpload: PropTypes.bool,
  addLabel: PropTypes.string,
  pasteLabel: PropTypes.string,
  pasteHint: PropTypes.string,
  countLabelKey: PropTypes.string,
};

export default ScreenshotUpload;
