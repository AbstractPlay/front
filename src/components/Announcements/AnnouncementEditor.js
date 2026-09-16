import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStore } from "../../stores";
import Spinner from "../Spinner";
import Modal from "../Modal";
import AnnouncementPageHelmet from "./AnnouncementPageHelmet";
import AnnouncementArticle from "./AnnouncementArticle";
import AnnouncementImageUpload from "./AnnouncementImageUpload";
import {
  attachmentUrlMapFromGet,
  getAnnouncementAuth,
  publishAnnouncement,
  retractAnnouncement,
  saveAnnouncement,
} from "../../lib/announcements/announcementAdminApi";
import { insertAtSelection } from "../../lib/announcements/markdownInsert";
import { resolveAnnouncementImages, apAttKeysInBody } from "../../lib/announcements/resolveAnnouncementImages";
import { isProductionMode } from "../../lib/realMode";
import "./announcement.css";

const QUICK_EMOJI = ["😊", "🙏", "😄", "🥳", "❤️", "💙", "👏", "✨", "🎉", "✅"];

function snapshotFromFields(fields) {
  return JSON.stringify(fields);
}

function AnnouncementEditor() {
  const { t } = useTranslation();
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const globalMe = useStore((state) => state.globalMe);
  const isNew = routeId === "new";

  const [draftId, setDraftId] = useState(() => (isNew ? crypto.randomUUID() : routeId));
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [status, setStatus] = useState("draft");
  const [attachmentKeys, setAttachmentKeys] = useState([]);
  const [urlByKey, setUrlByKey] = useState({});
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [editorTab, setEditorTab] = useState("write");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showRetractModal, setShowRetractModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [retracting, setRetracting] = useState(false);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState("");
  const bodyRef = useRef(null);

  const publishDisabled = !isProductionMode();

  const fields = useMemo(() => ({
    title,
    body,
    adminNote,
    attachmentKeys,
  }), [title, body, adminNote, attachmentKeys]);

  const isDirty = lastSavedSnapshot !== "" && snapshotFromFields(fields) !== lastSavedSnapshot;

  useEffect(() => {
    if (!isDirty) {
      return undefined;
    }
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!globalMe?.admin || isNew) {
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await getAnnouncementAuth(routeId);
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }
      const data = result.data;
      setDraftId(data.id);
      setTitle(data.title ?? "");
      setBody(data.body ?? "");
      setAdminNote(data.adminNote ?? "");
      setStatus(data.status ?? "draft");
      setAttachmentKeys(data.attachmentKeys ?? []);
      setUrlByKey(attachmentUrlMapFromGet(data));
      const snap = snapshotFromFields({
        title: data.title ?? "",
        body: data.body ?? "",
        adminNote: data.adminNote ?? "",
        attachmentKeys: data.attachmentKeys ?? [],
      });
      setLastSavedSnapshot(snap);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [globalMe?.admin, isNew, routeId]);

  useEffect(() => {
    if (isNew && lastSavedSnapshot === "") {
      setLastSavedSnapshot(snapshotFromFields({
        title: "",
        body: "",
        adminNote: "",
        attachmentKeys: [],
      }));
    }
  }, [isNew, lastSavedSnapshot]);

  const previewItem = useMemo(() => {
    const mergedUrls = { ...urlByKey };
    return {
      title: title.trim() || t("announcements.preview.noTitle"),
      body: resolveAnnouncementImages(body, mergedUrls),
      publishedAt: Date.now(),
      attachmentUrlByKey: mergedUrls,
    };
  }, [body, title, urlByKey, t]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError("");
    setSaveMessage("");
    const keysFromBody = apAttKeysInBody(body);
    const mergedKeys = [...new Set([...attachmentKeys, ...keysFromBody])];
    const result = await saveAnnouncement({
      id: draftId,
      title,
      body,
      adminNote: adminNote.trim() || undefined,
      attachmentKeys: mergedKeys.length > 0 ? mergedKeys : undefined,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAttachmentKeys(mergedKeys);
    setStatus(result.data.status);
    setLastSavedSnapshot(snapshotFromFields({
      title,
      body,
      adminNote,
      attachmentKeys: mergedKeys,
    }));
    setSaveMessage(t("announcements.admin.saved"));
    if (isNew) {
      navigate(`/announcements/admin/${result.data.id}`, { replace: true });
    }
    const refreshed = await getAnnouncementAuth(result.data.id);
    if (refreshed.ok) {
      setUrlByKey(attachmentUrlMapFromGet(refreshed.data));
    }
  }, [adminNote, attachmentKeys, body, draftId, isNew, navigate, t, title]);

  const handleImageInserted = useCallback((key, markdown) => {
    setAttachmentKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setBody((prev) => {
      const el = bodyRef.current;
      if (el) {
        const start = el.selectionStart ?? prev.length;
        const next = prev.slice(0, start) + markdown + prev.slice(start);
        el.value = next;
        const pos = start + markdown.length;
        el.setSelectionRange(pos, pos);
        return next;
      }
      return prev + markdown;
    });
  }, []);

  const wrapSelection = (before, after = "", placeholder = "") => {
    const el = bodyRef.current;
    const next = insertAtSelection(el, before, after, placeholder);
    if (next !== null) {
      setBody(next);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setError("");
    const result = await publishAnnouncement(draftId);
    setPublishing(false);
    if (!result.ok) {
      setError(result.error);
      setShowPublishModal(false);
      return;
    }
    setStatus("published");
    setShowPublishModal(false);
    navigate("/announcements/admin");
  };

  const handleRetract = async () => {
    setRetracting(true);
    setError("");
    const result = await retractAnnouncement(draftId);
    setRetracting(false);
    if (!result.ok) {
      setError(result.error);
      setShowRetractModal(false);
      return;
    }
    setShowRetractModal(false);
    navigate("/announcements/admin");
  };

  if (!globalMe?.admin) {
    return <Navigate to="/news" replace />;
  }

  if (loading) {
    return (
      <article>
        <Spinner />
      </article>
    );
  }

  return (
    <>
      <AnnouncementPageHelmet title={t("announcements.admin.editorTitle")} />
      <article className="content announcement-editor">
        <h1 className="title lined">
          <span>{isNew ? t("announcements.admin.newDraft") : t("announcements.admin.editDraft")}</span>
        </h1>
        <div className="buttons are-small announcement-editor-actions">
          <button
            type="button"
            className="button apButton"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? t("announcements.admin.saving") : t("announcements.admin.saveDraft")}
          </button>
          {status === "draft" ? (
            <button
              type="button"
              className="button apButtonNeutral"
              disabled={publishDisabled || saving}
              title={publishDisabled ? t("announcements.admin.publishDisabledDev") : undefined}
              onClick={() => setShowPublishModal(true)}
            >
              {t("announcements.admin.publish")}
            </button>
          ) : null}
          {status === "published" ? (
            <button
              type="button"
              className="button apButtonNeutral"
              disabled={publishDisabled || saving || retracting}
              title={publishDisabled ? t("announcements.admin.publishDisabledDev") : undefined}
              onClick={() => setShowRetractModal(true)}
            >
              {t("announcements.admin.retract")}
            </button>
          ) : null}
          <Link to="/announcements/admin" className="button apButtonNeutral">
            {t("announcements.admin.backToList")}
          </Link>
        </div>
        {publishDisabled && status === "draft" ? (
          <p className="help">{t("announcements.admin.publishDisabledDev")}</p>
        ) : null}
        {error ? <p className="has-text-danger">{error}</p> : null}
        {saveMessage ? <p className="help">{saveMessage}</p> : null}
        {status === "published" ? (
          <p className="announcement-muted">{t("announcements.admin.publishedHint")}</p>
        ) : null}

        <div className="announcement-editor-tabs">
          <button
            type="button"
            className={`button is-small ${editorTab === "write" ? "apButton" : "apButtonNeutral"}`}
            onClick={() => setEditorTab("write")}
          >
            {t("announcements.admin.tabWrite")}
          </button>
          <button
            type="button"
            className={`button is-small ${editorTab === "preview" ? "apButton" : "apButtonNeutral"}`}
            onClick={() => setEditorTab("preview")}
          >
            {t("announcements.admin.tabPreview")}
          </button>
        </div>

        <div className="announcement-editor-split">
          <div className={`announcement-editor-pane ${editorTab === "preview" ? "is-hidden-mobile" : ""}`}>
            <div className="field">
              <label className="label" htmlFor="announcement-title">{t("announcements.admin.fieldTitle")}</label>
              <input
                id="announcement-title"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="announcement-admin-note">{t("announcements.admin.fieldAdminNote")}</label>
              <textarea
                id="announcement-admin-note"
                className="textarea"
                rows={2}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
              <p className="help">{t("announcements.admin.adminNoteHint")}</p>
            </div>
            <div className="announcement-toolbar buttons are-small">
              <button type="button" className="button apButtonNeutral is-small" onClick={() => wrapSelection("**", "**", "text")}>B</button>
              <button type="button" className="button apButtonNeutral is-small" onClick={() => wrapSelection("_", "_", "text")}>i</button>
              <button type="button" className="button apButtonNeutral is-small" onClick={() => wrapSelection("[", "](https://)", "link")}>Link</button>
              <button type="button" className="button apButtonNeutral is-small" onClick={() => wrapSelection("\n- ", "")}>•</button>
              <button type="button" className="button apButtonNeutral is-small" onClick={() => wrapSelection("`", "`", "code")}>Code</button>
              <button type="button" className="button apButtonNeutral is-small" onClick={() => wrapSelection("\n## ", "\n", "Heading")}>H2</button>
            </div>
            <div className="announcement-emoji-row">
              {QUICK_EMOJI.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="button apButtonNeutral is-small announcement-emoji-btn"
                  onClick={() => wrapSelection(emoji, "")}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <p className="help">{t("announcements.admin.emojiHint")}</p>
            <div className="field">
              <label className="label" htmlFor="announcement-body">{t("announcements.admin.fieldBody")}</label>
              <textarea
                id="announcement-body"
                ref={bodyRef}
                className="textarea announcement-body-input"
                rows={20}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            <AnnouncementImageUpload
              announcementId={draftId}
              attachmentKeys={attachmentKeys}
              urlByKey={urlByKey}
              onInserted={handleImageInserted}
              disabled={saving}
            />
          </div>
          <div className={`announcement-editor-pane announcement-editor-preview ${editorTab === "write" ? "is-hidden-mobile" : ""}`}>
            <h2 className="subtitle">{t("announcements.admin.previewHeading")}</h2>
            <AnnouncementArticle item={previewItem} className="announcement-preview-article" />
          </div>
        </div>
      </article>

      <Modal
        show={showPublishModal}
        title={t("announcements.admin.publishConfirmTitle")}
        disableBackdropClose={publishing}
        buttons={[
          {
            label: publishing ? t("announcements.admin.publishing") : t("announcements.admin.publishConfirm"),
            action: handlePublish,
          },
          {
            label: t("Cancel"),
            action: () => setShowPublishModal(false),
          },
        ]}
      >
        <p>{t("announcements.admin.publishConfirmBody")}</p>
        <AnnouncementArticle item={previewItem} className="announcement-preview-article" />
      </Modal>

      <Modal
        show={showRetractModal}
        title={t("announcements.admin.retractConfirmTitle")}
        disableBackdropClose={retracting}
        buttons={[
          {
            label: retracting ? t("announcements.admin.retracting") : t("announcements.admin.retractConfirm"),
            action: handleRetract,
          },
          {
            label: t("Cancel"),
            action: () => setShowRetractModal(false),
          },
        ]}
      >
        <p>{t("announcements.admin.retractConfirmBody")}</p>
      </Modal>
    </>
  );
}

export default AnnouncementEditor;
