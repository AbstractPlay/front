import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { nanoid } from "nanoid";
import { cloneDeep } from "lodash";
import { toast } from "react-toastify";
import { callAuthApi } from "../lib/api";
import { fetchProfile } from "../lib/globalMeBootstrap";
import { fetchUserNames } from "../lib/fetchUserNames";
import { useStore } from "../stores";
import {
  AVATAR_STYLES,
  DEFAULT_AVATAR_STYLE,
} from "../lib/dicebear/allowlist";
import {
  avatarConfigsEqual,
  defaultAvatarConfig,
  isDefaultAvatarConfig,
  resolveAvatarConfig,
} from "../lib/dicebear/avatarConfig";
import { createAvatarSvg } from "../lib/dicebear/createAvatarSvg";
import { preloadAvatarStyles } from "../lib/dicebear/loadStyle";
import { validateAvatarSeed } from "../lib/dicebear/validateSeed";

const PREVIEW_SIZE = 96;
const THUMB_SIZE = 48;

function AvatarPreview({ config, label, size = PREVIEW_SIZE }) {
  const [svg, setSvg] = useState("");

  useEffect(() => {
    if (!config) {
      setSvg("");
      return undefined;
    }
    let cancelled = false;
    createAvatarSvg({ ...config, size })
      .then((markup) => {
        if (!cancelled) {
          setSvg(markup);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSvg("");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [config, size]);

  const isThumb = size <= THUMB_SIZE;
  const sizeClass = isThumb
    ? "avatar-picker-preview--thumb"
    : "avatar-picker-preview--large";
  const boxSize = isThumb ? THUMB_SIZE : PREVIEW_SIZE;

  return (
    <div className="avatar-picker-preview-block">
      {label ? <p className="help avatar-picker-preview-label">{label}</p> : null}
      <div
        className={`avatar-picker-preview ${sizeClass}`}
        style={{ width: boxSize, height: boxSize }}
        aria-hidden="true"
        dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
      />
    </div>
  );
}

function AvatarPicker({ userId, globalMe, onSaved }) {
  const { t } = useTranslation();
  const savedConfig = useMemo(
    () => resolveAvatarConfig({ id: userId, settings: globalMe?.settings }),
    [userId, globalMe?.settings]
  );
  const [draftStyle, setDraftStyle] = useState(savedConfig?.style ?? DEFAULT_AVATAR_STYLE);
  const [draftSeed, setDraftSeed] = useState(savedConfig?.seed ?? userId);
  const [seedError, setSeedError] = useState("");
  const [saving, setSaving] = useState(false);
  const [stylesReady, setStylesReady] = useState(false);

  useEffect(() => {
    if (!userId) {
      return undefined;
    }
    let cancelled = false;
    preloadAvatarStyles(AVATAR_STYLES)
      .then(() => {
        if (!cancelled) {
          setStylesReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStylesReady(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    setDraftStyle(savedConfig?.style ?? DEFAULT_AVATAR_STYLE);
    setDraftSeed(savedConfig?.seed ?? userId);
    setSeedError("");
  }, [savedConfig, userId]);

  const draftConfig = useMemo(() => {
    const seedResult = validateAvatarSeed(draftSeed);
    if (!seedResult.ok) {
      return null;
    }
    return { style: draftStyle, seed: seedResult.seed };
  }, [draftStyle, draftSeed]);

  const canSave =
    draftConfig !== null &&
    !avatarConfigsEqual(draftConfig, savedConfig) &&
    !saving;

  const showDualPreview = !avatarConfigsEqual(draftConfig, savedConfig);

  const handleSeedChange = (value) => {
    setDraftSeed(value);
    const result = validateAvatarSeed(value);
    setSeedError(result.ok ? "" : result.message);
  };

  const handleRandomize = () => {
    const nextSeed = nanoid();
    setDraftSeed(nextSeed);
    setSeedError("");
  };

  const handleResetDefault = () => {
    const defaults = defaultAvatarConfig(userId);
    setDraftStyle(defaults.style);
    setDraftSeed(defaults.seed);
    setSeedError("");
  };

  const handleCancel = () => {
    setDraftStyle(savedConfig?.style ?? DEFAULT_AVATAR_STYLE);
    setDraftSeed(savedConfig?.seed ?? userId);
    setSeedError("");
  };

  const handleSave = useCallback(async () => {
    if (!globalMe || !draftConfig || !canSave) {
      return;
    }
    setSaving(true);
    try {
      const newSettings = cloneDeep(globalMe.settings ?? {});
      if (newSettings.all === undefined) {
        newSettings.all = {};
      }
      if (newSettings.all.profile === undefined) {
        newSettings.all.profile = {};
      }

      if (isDefaultAvatarConfig(draftConfig, userId)) {
        delete newSettings.all.profile.avatar;
        if (Object.keys(newSettings.all.profile).length === 0) {
          delete newSettings.all.profile;
        }
      } else {
        newSettings.all.profile.avatar = {
          style: draftConfig.style,
          seed: draftConfig.seed,
        };
      }

      const res = await callAuthApi("update_user_settings", {
        settings: newSettings,
      });
      if (!res || res.status !== 200) {
        let message = t("profile.avatar.saveFailed");
        try {
          const parsed = await res.json();
          if (parsed?.message) {
            message = parsed.message;
          } else if (parsed?.body) {
            const body = JSON.parse(parsed.body);
            if (body?.error) {
              message = body.error;
            }
          }
        } catch {
          // keep default message
        }
        toast.error(message);
        return;
      }

      const { setGlobalMe, setUsers } = useStore.getState();
      setGlobalMe((val) => ({
        ...val,
        settings: newSettings,
        ...(isDefaultAvatarConfig(draftConfig, userId)
          ? { avatarStyle: undefined, avatarSeed: undefined }
          : {
              avatarStyle: draftConfig.style,
              avatarSeed: draftConfig.seed,
            }),
      }));
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                ...(isDefaultAvatarConfig(draftConfig, userId)
                  ? { avatarStyle: undefined, avatarSeed: undefined }
                  : {
                      avatarStyle: draftConfig.style,
                      avatarSeed: draftConfig.seed,
                    }),
              }
            : u
        )
      );
      await fetchProfile();
      await fetchUserNames({ force: true });
      toast.success(t("profile.avatar.saveSuccess"));
      if (onSaved) {
        onSaved();
      }
    } catch (error) {
      console.log(error);
      toast.error(t("profile.avatar.saveFailed"));
    } finally {
      setSaving(false);
    }
  }, [canSave, draftConfig, globalMe, onSaved, t, userId]);

  if (!userId || !globalMe) {
    return null;
  }

  return (
    <div className="field avatar-picker" key="avatar">
      <label className="label">{t("profile.avatar.title")}</label>
      <p className="help">
        {t("profile.avatar.licenseNote")}{" "}
        <a
          href="https://www.dicebear.com/licenses/"
          target="_blank"
          rel="noreferrer"
        >
          DiceBear licenses
        </a>
      </p>

      <div className="avatar-picker-previews">
        {showDualPreview ? (
          <AvatarPreview
            config={savedConfig}
            label={t("profile.avatar.current")}
            size={PREVIEW_SIZE}
          />
        ) : null}
        <AvatarPreview
          config={draftConfig ?? savedConfig}
          label={
            showDualPreview ? t("profile.avatar.preview") : t("profile.avatar.current")
          }
          size={PREVIEW_SIZE}
        />
      </div>

      <p className="label is-small mt-3 mb-1">{t("profile.avatar.styleLabel")}</p>
      <div
        className="avatar-picker-style-grid"
        role="listbox"
        aria-label={t("profile.avatar.styleLabel")}
      >
        {AVATAR_STYLES.map((styleId) => (
          <button
            key={styleId}
            type="button"
            className={
              "avatar-picker-style-tile" +
              (draftStyle === styleId ? " is-selected" : "")
            }
            role="option"
            aria-selected={draftStyle === styleId}
            disabled={!stylesReady}
            title={t(`profile.avatar.style.${styleId}`)}
            onClick={() => setDraftStyle(styleId)}
          >
            <AvatarPreview
              config={
                draftConfig
                  ? { style: styleId, seed: draftConfig.seed }
                  : { style: styleId, seed: userId }
              }
              size={THUMB_SIZE}
            />
            <span className="avatar-picker-style-name">
              {t(`profile.avatar.style.${styleId}`)}
            </span>
          </button>
        ))}
      </div>

      <label className="label is-small mt-3 mb-1" htmlFor="avatar_seed">
        {t("profile.avatar.seedLabel")}
      </label>
      <div className="control">
        <input
          className="input is-small"
          id="avatar_seed"
          name="avatar_seed"
          type="text"
          value={draftSeed}
          onChange={(e) => handleSeedChange(e.target.value)}
        />
      </div>
      <p className="help">{t("profile.avatar.seedHelp")}</p>
      {seedError ? <p className="help is-danger">{seedError}</p> : null}

      <div className="control is-grouped avatar-picker-actions">
        <button
          type="button"
          className="button is-small apButtonNeutral"
          onClick={handleRandomize}
        >
          {t("profile.avatar.randomize")}
        </button>
        <button
          type="button"
          className="button is-small apButtonNeutral"
          onClick={handleResetDefault}
        >
          {t("profile.avatar.resetDefault")}
        </button>
        {showDualPreview ? (
          <button
            type="button"
            className="button is-small apButtonNeutral"
            onClick={handleCancel}
          >
            {t("Cancel")}
          </button>
        ) : null}
        {canSave ? (
          <button
            type="button"
            className="button is-small apButton"
            onClick={handleSave}
            disabled={saving}
          >
            {t("profile.avatar.save")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default AvatarPicker;
