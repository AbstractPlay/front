import { useTranslation } from "react-i18next";

function ChallengeOpponentFilterControls({
  onlySee,
  onOnlySeeChange,
  matchFilter,
  onMatchFilterChange,
  matchFiltersDisabled = false,
  activityName = "player-picker-activity",
  matchName = "player-picker-match-filter",
}) {
  const { t } = useTranslation();

  return (
    <div className="player-picker-filters">
      <div className="control">
        <p className="help">{t("newChallenge.opponentActivityHelp")}</p>
        <label className="radio">
          <input
            type="radio"
            name={activityName}
            checked={onlySee === "all"}
            value="all"
            onChange={() => onOnlySeeChange("all")}
          />
          {t("newChallenge.opponentActivityAll")}
        </label>
        <label className="radio">
          <input
            type="radio"
            name={activityName}
            checked={onlySee === "week"}
            value="week"
            onChange={() => onOnlySeeChange("week")}
          />
          {t("newChallenge.opponentActivity7Days")}
        </label>
        <label className="radio">
          <input
            type="radio"
            name={activityName}
            checked={onlySee === "month"}
            value="month"
            onChange={() => onOnlySeeChange("month")}
          />
          {t("newChallenge.opponentActivity30Days")}
        </label>
      </div>
      <fieldset
        className="control"
        disabled={matchFiltersDisabled}
        style={{ border: "none", margin: 0, padding: 0, marginTop: "0.75em" }}
      >
        <p className="help">{t("newChallenge.matchFilterHelp")}</p>
        <span className="is-size-7" style={{ marginRight: "0.5em" }}>
          {t("challenges.filters.matchLabel")}
        </span>
        {(
          [
            ["all", "challenges.filters.matchAll"],
            ["good", "challenges.filters.matchGood"],
            ["ideal", "challenges.filters.matchIdeal"],
          ]
        ).map(([value, labelKey]) => (
          <label
            key={value}
            className="radio"
            style={{ marginRight: "0.75em" }}
          >
            <input
              type="radio"
              name={matchName}
              checked={matchFilter === value}
              onChange={() => onMatchFilterChange(value)}
            />
            {" "}
            {t(labelKey)}
          </label>
        ))}
      </fieldset>
    </div>
  );
}

export default ChallengeOpponentFilterControls;
