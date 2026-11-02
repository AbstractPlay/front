import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "../Modal";
import {
  classifyCategoryTag,
  EMPTY_TAG_FILTER_SPEC,
  normalizeTagFilterSpec,
  TAG_DIMENSION_KEYS,
} from "../../lib/categoryTagFilter";

/**
 * @param {{ raw: string, full: string }[]} allTags
 * @param {import("../../lib/categoryTagFilter").TagDimensionKey} dimensionKey
 */
function tagsForDimension(allTags, dimensionKey) {
  return allTags.filter((tg) => classifyCategoryTag(tg.raw) === dimensionKey);
}

function DimensionRow({
  dimensionKey,
  label,
  dim,
  disabled,
  tagOptions,
  t,
  tCat,
  onModeChange,
  onAddTag,
  onRemoveTag,
}) {
  const mode = dim?.mode ?? "any";
  const tags = dim?.tags ?? [];
  const [pick, setPick] = useState("");

  return (
    <div className="explore-tag-filter-dimension field">
      <label className="label is-size-7">{label}</label>
      <div className="field is-grouped is-grouped-multiline explore-tag-filter-dimension__controls">
        <div className="control">
          <div className="select is-small">
            <select
              value={mode}
              disabled={disabled}
              onChange={(e) => onModeChange(dimensionKey, e.target.value)}
              aria-label={t("explore.tagFilter.modeLabel", { dimension: label })}
            >
              <option value="any">{t("explore.tagFilter.modeAny")}</option>
              <option value="all">{t("explore.tagFilter.modeAll")}</option>
              <option value="none">{t("explore.tagFilter.modeNone")}</option>
            </select>
          </div>
        </div>
        <div className="control">
          <div className="select is-small">
            <select
              value={pick}
              disabled={disabled}
              onChange={(e) => {
                const val = e.target.value;
                if (val !== "") {
                  onAddTag(dimensionKey, val);
                  setPick("");
                }
              }}
            >
              <option value="">{t("explore.tagFilter.addTag")}</option>
              {tagOptions.map((tg) => (
                <option key={tg.raw} value={tg.raw}>
                  {tg.full}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {tags.length > 0 ? (
        <div className="tags explore-tag-filter-dimension__chips">
          {tags.map((raw) => (
            <span
              key={raw}
              className="tag is-clickable"
              title={tCat(`categories.${raw}.description`)}
              onClick={() => !disabled && onRemoveTag(dimensionKey, raw)}
            >
              {tCat(`categories.${raw}.tag`)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ExploreTagFilterModal({
  show,
  initialSpec,
  allTags,
  onApply,
  onClose,
  buildShareUrl,
}) {
  const { t } = useTranslation();
  const { t: tCat } = useTranslation("apgames");
  const [draft, setDraft] = useState(() => normalizeTagFilterSpec(initialSpec));
  const [showGroups, setShowGroups] = useState(false);
  const [excludePick, setExcludePick] = useState("");

  useEffect(() => {
    if (show) {
      const normalized = normalizeTagFilterSpec(initialSpec);
      setDraft(normalized);
      setShowGroups(normalized.groups.length > 0);
    }
  }, [show, initialSpec]);

  const groupsActive = draft.groups.length > 0;

  const dimensionLabels = useMemo(
    () => ({
      goal: t("explore.tagFilter.dimensionGoal"),
      mech: t("explore.tagFilter.dimensionMech"),
      board: t("explore.tagFilter.dimensionBoard"),
      other: t("explore.tagFilter.dimensionOther"),
    }),
    [t]
  );

  const setDimensionMode = (key, mode) => {
    setDraft((prev) => {
      const dim = prev.dimensions[key] ?? { mode: "any", tags: [] };
      return normalizeTagFilterSpec({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [key]: { ...dim, mode },
        },
      });
    });
  };

  const addDimensionTag = (key, raw) => {
    if (!raw) return;
    setDraft((prev) => {
      const dim = prev.dimensions[key] ?? { mode: "any", tags: [] };
      const tags = dim.tags.includes(raw) ? dim.tags : [...dim.tags, raw];
      return normalizeTagFilterSpec({
        ...prev,
        dimensions: { ...prev.dimensions, [key]: { ...dim, tags } },
      });
    });
  };

  const removeDimensionTag = (key, raw) => {
    setDraft((prev) => {
      const dim = prev.dimensions[key];
      if (!dim) return prev;
      const tags = dim.tags.filter((t) => t !== raw);
      const dimensions = { ...prev.dimensions };
      if (tags.length === 0) {
        delete dimensions[key];
      } else {
        dimensions[key] = { ...dim, tags };
      }
      return normalizeTagFilterSpec({ ...prev, dimensions });
    });
  };

  const addGroup = () => {
    setDraft((prev) =>
      normalizeTagFilterSpec({
        ...prev,
        groups: [...prev.groups, { mode: "all", tags: [] }],
      })
    );
    setShowGroups(true);
  };

  const updateGroupMode = (index, mode) => {
    setDraft((prev) => {
      const groups = prev.groups.map((g, i) =>
        i === index ? { ...g, mode: mode === "all" ? "all" : "any" } : g
      );
      return normalizeTagFilterSpec({ ...prev, groups });
    });
  };

  const addGroupTag = (index, raw) => {
    if (!raw) return;
    setDraft((prev) => {
      const groups = prev.groups.map((g, i) => {
        if (i !== index) return g;
        const tags = g.tags.includes(raw) ? g.tags : [...g.tags, raw];
        return { ...g, tags };
      });
      return normalizeTagFilterSpec({ ...prev, groups });
    });
  };

  const removeGroupTag = (groupIndex, raw) => {
    setDraft((prev) => {
      const groups = prev.groups
        .map((g, i) => {
          if (i !== groupIndex) return g;
          return { ...g, tags: g.tags.filter((t) => t !== raw) };
        })
        .filter((g) => g.tags.length > 0);
      return normalizeTagFilterSpec({ ...prev, groups });
    });
  };

  const removeGroup = (index) => {
    setDraft((prev) =>
      normalizeTagFilterSpec({
        ...prev,
        groups: prev.groups.filter((_, i) => i !== index),
      })
    );
  };

  const addExclude = (raw) => {
    if (!raw) return;
    setDraft((prev) => {
      const exclude = prev.exclude.includes(raw)
        ? prev.exclude
        : [...prev.exclude, raw];
      return normalizeTagFilterSpec({ ...prev, exclude });
    });
  };

  const removeExclude = (raw) => {
    setDraft((prev) =>
      normalizeTagFilterSpec({
        ...prev,
        exclude: prev.exclude.filter((t) => t !== raw),
      })
    );
  };

  const clearAdvanced = () => {
    setDraft(normalizeTagFilterSpec(EMPTY_TAG_FILTER_SPEC));
    setShowGroups(false);
  };

  const handleCopyLink = async () => {
    const url = buildShareUrl(draft);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt(t("explore.tagFilter.copyLinkPrompt"), url);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <Modal
      show={show}
      title={t("explore.tagFilter.modalTitle")}
      disableBackdropClose
      buttons={[
        {
          label: t("explore.tagFilter.apply"),
          action: () => {
            onApply(normalizeTagFilterSpec(draft));
          },
        },
        {
          label: t("explore.tagFilter.clearAdvanced"),
          action: clearAdvanced,
        },
        {
          label: t("explore.tagFilter.copyLink"),
          action: handleCopyLink,
        },
        { label: t("Cancel"), action: onClose },
      ]}
    >
      <p className="help explore-tag-filter-modal__intro">
        {t("explore.tagFilter.modalIntro")}
      </p>

      <fieldset
        className="explore-tag-filter-modal__dimensions"
        disabled={groupsActive}
      >
        {groupsActive ? (
          <p className="help">{t("explore.tagFilter.dimensionsDisabled")}</p>
        ) : null}
        {TAG_DIMENSION_KEYS.map((key) => (
          <DimensionRow
            key={key}
            dimensionKey={key}
            label={dimensionLabels[key]}
            dim={draft.dimensions[key]}
            disabled={groupsActive}
            tagOptions={tagsForDimension(allTags, key)}
            t={t}
            tCat={tCat}
            onModeChange={setDimensionMode}
            onAddTag={addDimensionTag}
            onRemoveTag={removeDimensionTag}
          />
        ))}
      </fieldset>

      <div className="field explore-tag-filter-modal__exclude">
        <label className="label is-size-7">
          {t("explore.tagFilter.globalExclude")}
        </label>
        <div className="control">
          <div className="select is-small">
            <select
              value={excludePick}
              onChange={(e) => {
                const val = e.target.value;
                if (val !== "") {
                  addExclude(val);
                  setExcludePick("");
                }
              }}
            >
              <option value="">{t("explore.tagFilter.addTag")}</option>
              {allTags.map((tg) => (
                <option key={tg.raw} value={tg.raw}>
                  {tg.full}
                </option>
              ))}
            </select>
          </div>
        </div>
        {draft.exclude.length > 0 ? (
          <div className="tags">
            {draft.exclude.map((raw) => (
              <span
                key={raw}
                className="tag is-clickable"
                onClick={() => removeExclude(raw)}
              >
                {tCat(`categories.${raw}.tag`)}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="explore-tag-filter-modal__groups">
        <button
          type="button"
          className="button is-small apButtonNeutral explore-tag-filter-modal__groups-toggle"
          onClick={() => setShowGroups((v) => !v)}
        >
          {showGroups
            ? t("explore.tagFilter.hideGroups")
            : t("explore.tagFilter.showGroups")}
        </button>
        {showGroups ? (
          <>
            <p className="help">{t("explore.tagFilter.groupsHelp")}</p>
            {draft.groups.map((group, groupIndex) => (
              <GroupEditor
                key={`group_${groupIndex}`}
                group={group}
                groupIndex={groupIndex}
                allTags={allTags}
                t={t}
                tCat={tCat}
                onModeChange={updateGroupMode}
                onAddTag={addGroupTag}
                onRemoveTag={removeGroupTag}
                onRemoveGroup={() => removeGroup(groupIndex)}
              />
            ))}
            <button
              type="button"
              className="button is-small apButton"
              onClick={addGroup}
            >
              {t("explore.tagFilter.addGroup")}
            </button>
          </>
        ) : null}
      </div>
    </Modal>
  );
}

function GroupEditor({
  group,
  groupIndex,
  allTags,
  t,
  tCat,
  onModeChange,
  onAddTag,
  onRemoveTag,
  onRemoveGroup,
}) {
  const [pick, setPick] = useState("");
  return (
    <div className="explore-tag-filter-group box">
      <div className="field is-grouped">
        <div className="control">
          <div className="select is-small">
            <select
              value={group.mode}
              onChange={(e) => onModeChange(groupIndex, e.target.value)}
            >
              <option value="all">{t("explore.tagFilter.groupModeAll")}</option>
              <option value="any">{t("explore.tagFilter.groupModeAny")}</option>
            </select>
          </div>
        </div>
        <div className="control">
          <div className="select is-small">
            <select
              value={pick}
              onChange={(e) => {
                const val = e.target.value;
                if (val !== "") {
                  onAddTag(groupIndex, val);
                  setPick("");
                }
              }}
            >
              <option value="">{t("explore.tagFilter.addTag")}</option>
              {allTags.map((tg) => (
                <option key={tg.raw} value={tg.raw}>
                  {tg.full}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="control">
          <button
            type="button"
            className="button is-small apButtonNeutral"
            onClick={onRemoveGroup}
          >
            {t("explore.tagFilter.removeGroup")}
          </button>
        </div>
      </div>
      {group.tags.length > 0 ? (
        <div className="tags">
          {group.tags.map((raw) => (
            <span
              key={raw}
              className="tag is-clickable"
              onClick={() => onRemoveTag(groupIndex, raw)}
            >
              {tCat(`categories.${raw}.tag`)}
            </span>
          ))}
        </div>
      ) : (
        <p className="help">{t("explore.tagFilter.emptyGroup")}</p>
      )}
    </div>
  );
}

export default ExploreTagFilterModal;
