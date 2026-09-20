import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { presignAnnouncementUpload } from "../../lib/announcements/announcementAdminApi";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 5_242_880;
export const MAX_ANNOUNCEMENT_IMAGES = 10;

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

function AnnouncementImageUpload({
  announcementId,
  attachmentKeys,
  urlByKey,
  onInserted,
  disabled,
}) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = useCallback(async (fileList) => {
    const files = [...fileList];
    if (files.length === 0 || !announcementId) {
      return;
    }
    if (attachmentKeys.length + files.length > MAX_ANNOUNCEMENT_IMAGES) {
      setError(t("announcements.admin.upload.tooMany", { max: MAX_ANNOUNCEMENT_IMAGES }));
      return;
    }
    setError("");
    setUploading(true);
    try {
      for (const file of files) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          throw new Error(t("feedback.upload.invalidType"));
        }
        if (file.size > MAX_BYTES) {
          throw new Error(t("feedback.upload.tooLarge"));
        }
        const presign = await presignAnnouncementUpload({
          announcementId,
          filename: file.name,
          contentType: file.type,
          contentLength: file.size,
        });
        if (!presign.ok) {
          throw new Error(presign.error);
        }
        const { uploadUrl, key, headers } = presign.data;
        const putRes = await fetch(uploadUrl, {
          method: "PUT",
          headers,
          body: file,
        });
        if (!putRes.ok) {
          throw new Error(t("feedback.upload.failed"));
        }
        const alt = file.name.replace(/\.[^.]+$/, "") || "Screenshot";
        const markdown = `\n![${alt}](ap-att:${key})\n`;
        onInserted(key, markdown);
      }
    } catch (err) {
      setError(err.message || t("feedback.upload.failed"));
    } finally {
      setUploading(false);
    }
  }, [announcementId, attachmentKeys.length, onInserted, t]);

  useEffect(() => {
    const onPaste = (event) => {
      if (disabled || !announcementId || isTextInput(event.target)) {
        return;
      }
      const files = filesFromClipboard(event.clipboardData);
      if (files.length === 0) {
        return;
      }
      event.preventDefault();
      handleFiles(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [announcementId, disabled, handleFiles]);

  if (!announcementId) {
    return (
      <p className="help">{t("announcements.admin.upload.saveFirst")}</p>
    );
  }

  return (
    <div className="announcement-image-upload">
      <div className="buttons are-small">
        <label className="button apButtonNeutral is-small">
          {uploading ? t("feedback.upload.uploading") : t("announcements.admin.upload.addImage")}
          <input
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            className="is-hidden"
            disabled={disabled || uploading}
            multiple
            onChange={(e) => {
              handleFiles(e.target.files ?? []);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <p className="help">{t("announcements.admin.upload.pasteHint")}</p>
      {error ? <p className="help is-danger">{error}</p> : null}
      {attachmentKeys.length > 0 ? (
        <div className="announcement-image-thumbs">
          {attachmentKeys.map((key) => (
            <div key={key} className="announcement-image-thumb">
              {urlByKey[key] ? (
                <img src={urlByKey[key]} alt="" className="announcement-inline-image" />
              ) : (
                <span className="tag">{key.split("/").pop()}</span>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

AnnouncementImageUpload.propTypes = {
  announcementId: PropTypes.string,
  attachmentKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
  urlByKey: PropTypes.object.isRequired,
  onInserted: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default AnnouncementImageUpload;
