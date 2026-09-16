import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { useStore } from "../../stores";

export const REACTION_PALETTE = ["👍", "❤️", "😂", "😊", "😮", "🙏", "🎉", "👀"];

function AnnouncementReactions({
  announcementId,
  reactionCounts,
  myReactions,
  onToggle,
  disabled,
}) {
  const { t } = useTranslation();
  const globalMe = useStore((state) => state.globalMe);
  const signedIn = Boolean(globalMe?.id);
  const counts = reactionCounts ?? {};
  const mine = new Set(myReactions ?? []);

  return (
    <div className="announcement-reactions" aria-label={t("announcements.reactions.label")}>
      {REACTION_PALETTE.map((emoji) => {
        const count = counts[emoji] ?? 0;
        const selected = mine.has(emoji);
        const showCount = count > 0;
        return (
          <button
            key={emoji}
            type="button"
            className={`announcement-reaction-chip${selected ? " is-selected" : ""}`}
            disabled={disabled || !signedIn}
            title={signedIn ? t("announcements.reactions.toggle") : t("announcements.reactions.signIn")}
            onClick={() => onToggle(announcementId, emoji)}
          >
            <span className="announcement-reaction-emoji" aria-hidden="true">{emoji}</span>
            {showCount ? (
              <span className="announcement-reaction-count">{count}</span>
            ) : null}
          </button>
        );
      })}
      {!signedIn && Object.keys(counts).length > 0 ? (
        <span className="announcement-reactions-guest-hint">{t("announcements.reactions.signInToReact")}</span>
      ) : null}
    </div>
  );
}

AnnouncementReactions.propTypes = {
  announcementId: PropTypes.string.isRequired,
  reactionCounts: PropTypes.object,
  myReactions: PropTypes.arrayOf(PropTypes.string),
  onToggle: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default AnnouncementReactions;
