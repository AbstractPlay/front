import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "./Modal";
import UserAvatar from "./UserAvatar";
import ChallengeOpponentFilterControls from "./ChallengeOpponentFilterControls";
import { useChallengeOpponentFilters } from "../hooks/useChallengeOpponentFilters";
import { useOpponentQuickPicks } from "../hooks/useOpponentQuickPicks";
import { useStore } from "../stores";
import { formatUserDisplayName } from "./Bots/botUtils";
import {
  filterChallengeOpponents,
  filterOpponentOptionsByQuery,
} from "../lib/challengeOpponentOptions";
import {
  formatMatchWinRatePercent,
  matchWinRateForChallenge,
} from "../lib/glickoMatchOdds";

function PlayerPickerModal({
  show,
  value,
  users,
  allUsers,
  slotIndex,
  selectedOpponentIds,
  metaGame,
  selectedVariants = [],
  playerCount = 2,
  highestMap,
  ratingsReady,
  onSelect,
  onClose,
}) {
  const { t, i18n } = useTranslation();
  const globalMe = useStore((state) => state.globalMe);
  const summaryRatingsLoadState = useStore(
    (state) => state.summaryRatingsLoadState
  );
  const [query, setQuery] = useState("");
  const {
    onlySee,
    setOnlySee,
    matchFilter,
    setMatchFilter,
    minSeen,
  } = useChallengeOpponentFilters();

  const matchFiltersDisabled = summaryRatingsLoadState === "pending";

  const eligibleUsers = useMemo(
    () =>
      filterChallengeOpponents(users, {
        globalMeId: globalMe?.id,
        slotIndex,
        selectedOpponentIds,
        onlySee,
        minSeen,
        matchFilter,
        metaGame,
        variantUids: selectedVariants,
        numPlayers: playerCount > 0 ? playerCount : 2,
        highestMap: highestMap ?? new Map(),
        ratingsReady,
        locale: i18n.language,
      }),
    [
      users,
      globalMe?.id,
      slotIndex,
      selectedOpponentIds,
      onlySee,
      minSeen,
      matchFilter,
      metaGame,
      selectedVariants,
      playerCount,
      highestMap,
      ratingsReady,
      i18n.language,
    ]
  );

  const browseEntries = useMemo(
    () =>
      eligibleUsers.map((user) => ({
        id: user.id,
        name: formatUserDisplayName(user, allUsers),
        user,
      })),
    [eligibleUsers, allUsers]
  );

  const filteredUsers = useMemo(
    () => filterOpponentOptionsByQuery(browseEntries, query),
    [browseEntries, query]
  );

  /** Search hides quick picks; activity/match only narrow eligible opponents. */
  const hasBrowseFilters = query.trim() !== "";

  const { sections, loading: quickPicksLoading, isLoggedIn } =
    useOpponentQuickPicks({
      enabled: show,
    });

  const eligibleIdSet = useMemo(
    () => new Set(eligibleUsers.map((u) => u.id)),
    [eligibleUsers]
  );

  const showQuickPicks = isLoggedIn && !hasBrowseFilters;

  const resetSearch = () => setQuery("");

  const handleSelect = (user) => {
    if (!user?.id) {
      return;
    }
    onSelect({
      id: user.id,
      name: formatUserDisplayName(user, allUsers),
    });
    resetSearch();
    onClose();
  };

  const handleClose = () => {
    resetSearch();
    onClose();
  };

  const winRateForUser = (userId) => {
    if (!ratingsReady || !metaGame || !globalMe?.id) {
      return null;
    }
    return matchWinRateForChallenge({
      highestMap: highestMap ?? new Map(),
      userId: globalMe.id,
      challengerId: userId,
      metaUid: metaGame,
      variantUids: selectedVariants,
      numPlayers: playerCount > 0 ? playerCount : 2,
      rated: true,
    });
  };

  return (
    <Modal
      show={show}
      title={t("playerPicker.choose")}
      buttons={[{ label: t("Close"), action: handleClose }]}
    >
      <div className="field">
        <label className="label" htmlFor="playerPickerSearch">
          {t("playerPicker.searchLabel")}
        </label>
        <div className="control">
          <input
            id="playerPickerSearch"
            className="input"
            type="search"
            autoFocus
            value={query}
            placeholder={t("playerPicker.searchPlaceholder")}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <ChallengeOpponentFilterControls
        onlySee={onlySee}
        onOnlySeeChange={setOnlySee}
        matchFilter={matchFilter}
        onMatchFilterChange={setMatchFilter}
        matchFiltersDisabled={matchFiltersDisabled}
      />

      <p className="help mb-3">
        {t("playerPicker.matchCount", {
          count: filteredUsers.length,
          total: eligibleUsers.length,
        })}
      </p>

      {showQuickPicks && (sections.length > 0 || quickPicksLoading) ? (
        <div className="player-picker-quick-picks" style={{ marginBottom: "1rem" }}>
          {sections.map((section) => {
            const quickUsers = section.opponents
              .filter((o) => eligibleIdSet.has(o.id))
              .map((o) => users.find((u) => u.id === o.id))
              .filter(Boolean);
            if (quickUsers.length === 0) {
              return null;
            }
            return (
              <div key={section.key} className="field">
                <p className="label is-size-7 mb-1">{t(section.labelKey)}</p>
                <div className="buttons are-small are-flex is-flex-wrap-wrap mb-2">
                  {quickUsers.map((user) => (
                    <button
                      key={`${section.key}-${user.id}`}
                      type="button"
                      className={
                        value === user.id
                          ? "button is-small apButton"
                          : "button is-small apButtonNeutral"
                      }
                      onClick={() => handleSelect(user)}
                    >
                      {formatUserDisplayName(user, allUsers)}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {quickPicksLoading && sections.length === 0 ? (
            <p className="help">{t("playerPicker.loadingQuickPicks")}</p>
          ) : null}
        </div>
      ) : null}

      <div
        className="player-picker-browse-list"
        style={{ maxHeight: "50vh", overflowY: "auto" }}
      >
        {eligibleUsers.length === 0 ? (
          <p className="has-text-grey">{t("playerPicker.noEligible")}</p>
        ) : filteredUsers.length === 0 ? (
          <p className="has-text-grey">{t("playerPicker.noResults")}</p>
        ) : (
          filteredUsers.map((entry) => {
            const winRate = winRateForUser(entry.id);
            return (
              <button
                key={entry.id}
                type="button"
                className={`player-picker-row button is-fullwidth is-justify-content-flex-start mb-2${
                  value === entry.id ? " apButton" : " apButtonNeutral"
                }`}
                style={{ height: "auto", whiteSpace: "normal" }}
                onClick={() => handleSelect(entry.user)}
              >
                <span className="player-picker-row-avatar mr-3">
                  <UserAvatar user={entry.user} size={40} />
                </span>
                <span className="has-text-left">
                  <span className="is-block has-text-weight-semibold">
                    {entry.name}
                  </span>
                  {ratingsReady && metaGame && winRate != null ? (
                    <span className="is-block is-size-7 has-text-grey">
                      {t("playerPicker.expectedWinRate", {
                        percent: formatMatchWinRatePercent(winRate),
                      })}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })
        )}
      </div>
    </Modal>
  );
}

export default PlayerPickerModal;
