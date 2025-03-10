import React, {
  useState,
  useEffect,
  useContext,
  Fragment,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import Spinner from "./Spinner";
import { gameinfo, addResource } from "@abstractplay/gameslib";
import { MeContext } from "../pages/Skeleton";
import { useStorageState } from "react-use-storage-state";
import Modal from "./Modal";
import GameVariants from "./GameVariants";

const stringArraysEqual = (lst1, lst2) => {
  if (lst1.length !== lst2.length) {
    return false;
  }
  const s1 = lst1.sort((a, b) => a.localeCompare(b));
  const s2 = lst2.sort((a, b) => a.localeCompare(b));
  let matches = true;
  for (let i = 0; i < s1.length; i++) {
    if (s1[i] !== s2[i]) {
      matches = false;
      break;
    }
  }
  return matches;
};

function StandingChallengeModal({
  show,
  handleClose: handleModalClose,
  handleChallenge: handleNewChallenge,
}) {
  const { t, i18n } = useTranslation();
  const [error, errorSetter] = useState(null);
  const [metaGame, metaGameSetter] = useState(null);
  const [playerCount, playerCountSetter] = useState(-1);
  const [challengeLimit, challengeLimitSetter] = useState(2);
  const [sensitivity, sensitivitySetter] = useState("meta");
  const [clockSpeed, clockSpeedSetter] = useStorageState(
    "new-challenge-clock-speed",
    "medium"
  );
  const [clockStart, clockStartSetter] = useStorageState(
    "new-challenge-clock-start",
    48
  );
  const [clockInc, clockIncSetter] = useStorageState(
    "new-challenge-clock-inc",
    24
  );
  const [clockMax, clockMaxSetter] = useStorageState(
    "new-challenge-clock-max",
    96
  );
  const [clockHard, clockHardSetter] = useStorageState(
    "new-challenge-clock-hard",
    false
  );
  const [rated, ratedSetter] = useStorageState("new-challenge-rated", true); // rated or not
  const [noExplore, noExploreSetter] = useStorageState(
    "new-challenge-noExplore",
    false
  );
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [globalMe] = useContext(MeContext);

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  const setPlayerCount = useCallback(
    (cnt) => {
      playerCountSetter(cnt);
      if (cnt !== 2) {
        ratedSetter(false);
      }
    },
    [ratedSetter]
  );

  const setClock = (start, inc, max) => {
    clockStartSetter(start);
    clockIncSetter(inc);
    clockMaxSetter(max);
  };

  const handleChangeGame = useCallback(
    (game) => {
      if (game !== metaGame) {
        if (game === "") {
          metaGameSetter(null);
        } else {
          metaGameSetter(game);
          const info = gameinfo.get(game);
          const playercounts = info.playercounts;
          if (playercounts.length === 1) {
            setPlayerCount(playercounts[0]);
          } else {
            playerCountSetter(-1);
          }
        }
        errorSetter("");
      }
    },
    [metaGame, setPlayerCount]
  );

  useEffect(() => {
    errorSetter("");
    sensitivitySetter("meta");
    // clockStartSetter(72);
    // clockIncSetter(24);
    // clockMaxSetter(240);
    // clockHardSetter(false);
  }, [show, handleChangeGame]);

  const handleChangePlayerCount = (cnt) => {
    setPlayerCount(parseInt(cnt));
    errorSetter("");
  };

  const isNonNegativeInteger = (str, field) => {
    if (str.trim() === "") {
      errorSetter(field + " must have a value");
    } else {
      const num = Number(str);
      if (isNaN(num)) {
        errorSetter(field + " must be a number");
      } else {
        if (num < 0) {
          errorSetter(field + " can't be negative");
        } else {
          if (!Number.isInteger(num)) {
            errorSetter(field + " must be an integer");
          } else {
            errorSetter(null);
          }
        }
      }
    }
  };

  const handleClockStartChange = (event) => {
    isNonNegativeInteger(event.target.value, t("ChooseClockStart"));
    clockStartSetter(event.target.value);
    clockSpeedSetter("custom");
  };

  const handleClockIncChange = (event) => {
    isNonNegativeInteger(event.target.value, t("ChooseClockIncrement"));
    clockIncSetter(event.target.value);
    clockSpeedSetter("custom");
  };

  const handleClockMaxChange = (event) => {
    isNonNegativeInteger(event.target.value, t("ChooseClockMax"));
    clockMaxSetter(event.target.value);
    clockSpeedSetter("custom");
  };

  const handleClockHardChange = (event) => {
    clockHardSetter(!clockHard);
  };

  const handleRatedChange = (event) => {
    // ratedSetter(event.target.checked);
    ratedSetter(!rated);
  };

  const handleNoExploreChange = (event) => {
    // ratedSetter(event.target.checked);
    noExploreSetter(!noExplore);
  };

  const handleLimitChange = (event) => {
    isNonNegativeInteger(event.target.value, t("ChooseLimit"));
    challengeLimitSetter(event.target.value);
  };

  const handleChallenge = () => {
    // error handling goes here
    if (metaGame === null) {
      errorSetter(t("SelectAGame"));
      return;
    }
    if (playerCount === null || playerCount === -1) {
      errorSetter(t("SelectPlayerCount"));
      return;
    }
    if (sensitivity === "meta") {
      if (globalMe.realStanding !== undefined) {
        const found = globalMe.realStanding.find(
          (e) => e.metaGame === metaGame && e.sensitivity === "meta"
        );
        if (found !== undefined) {
          errorSetter(
            'An entry with "meta" sensitivity already exists for this game.'
          );
          return;
        }
      }
    } else {
      if (globalMe.realStanding !== undefined) {
        const found = globalMe.realStanding.find(
          (e) =>
            e.metaGame === metaGame &&
            stringArraysEqual(e.variants, selectedVariants) &&
            e.sensitivity === "variants"
        );
        if (found !== undefined) {
          errorSetter(
            'An entry with "variants" sensitivity already exists for this game + variants combination.'
          );
          return;
        }
      }
    }

    handleNewChallenge({
      metaGame: metaGame,
      numPlayers: playerCount,
      variants: selectedVariants,
      clockStart: clockStart,
      clockInc: clockInc,
      clockMax: clockMax,
      clockHard: clockHard,
      rated: rated,
      noExplore: noExplore,
      limit: challengeLimit,
      sensitivity,
    });
    // So that if you click on challenge again, it doesn't look like the challenge wasn't submitted:
    playerCountSetter(-1);
    sensitivitySetter("meta");
    metaGameSetter(null);
    handleModalClose();
  };

  let games = [];
  gameinfo.forEach((game) => games.push({ id: game.uid, name: game.name }));
  games.sort((a, b) => (a.name > b.name ? 1 : -1));
  if (process.env.REACT_APP_REAL_MODE === "production") {
    games = games.filter(
      (g) => !gameinfo.get(g.id).flags.includes("experimental")
    );
  }
  // sort by stars
  if (
    globalMe !== null &&
    "stars" in globalMe &&
    Array.isArray(globalMe.stars) &&
    globalMe.stars.length > 0
  ) {
    const starred = games.filter((g) => globalMe.stars.includes(g.id));
    const others = games.filter((g) => !globalMe.stars.includes(g.id));
    games = [...starred, { id: "", name: "-----" }, ...others];
  }

  let playercounts = [];
  if (metaGame !== null) {
    const info = gameinfo.get(metaGame);
    playercounts = info.playercounts;
  }

  return (
    <Modal
      show={show}
      title={t("NewRealStanding")}
      buttons={[
        { label: t("Challenge"), action: handleChallenge },
        { label: t("Close"), action: handleModalClose },
      ]}
    >
      <div className="container">
        <div className="content">
          <p style={{ fontSize: "smaller" }}>
            Standing challenges are requests to automatically create open
            challenges for particular games or game + variant combinations as
            long as your number of matching active games is below the limit you
            set. Twice a day, the system will look at these requests and issue
            open challenges if none already exist.
          </p>
        </div>
        <div className="field">
          <label className="label" htmlFor="gameName">
            {t("ChooseGame")}
          </label>
          <div className="control">
            <div className="select is-small">
              {games === null ? (
                <Spinner />
              ) : (
                /* Select meta game */
                <select
                  value={metaGame ? metaGame : ""}
                  name="gameName"
                  id="gameName"
                  onChange={(e) => handleChangeGame(e.target.value)}
                >
                  <option value="">--{t("Select")}--</option>
                  {games.map((game) => {
                    return (
                      <option key={game.id} value={game.id}>
                        {game.name}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          </div>
        </div>
        {metaGame === null ? (
          ""
        ) : /* Number of players */
        playercounts.length === 1 ? (
          <p>
            <strong>{t("NumPlayers")}:</strong> {playercounts[0]}
          </p>
        ) : (
          <div className="field">
            <label className="label" htmlFor="numPlayers">
              {t("NumPlayers")}
            </label>
            <div className="select is-small">
              <select
                value={playerCount}
                name="numPlayers"
                id="numPlayers"
                onChange={(e) => handleChangePlayerCount(e.target.value)}
              >
                <option value="">--{t("Select")}--</option>
                {playercounts.map((cnt) => {
                  return (
                    <option key={cnt} value={cnt}>
                      {cnt}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        )}
        <GameVariants
          metaGame={metaGame}
          variantsSetter={setSelectedVariants}
        />
        {metaGame === null ? (
          ""
        ) : (
          <Fragment>
            <div className="columns">
              <div className="column">
                <div className="field">
                  <label className="label" htmlFor="limit">
                    Maximum number of matching active games
                  </label>
                  <div className="control">
                    <input
                      type="number"
                      min={1}
                      value={challengeLimit}
                      name="limit"
                      onChange={handleLimitChange}
                    />
                  </div>
                </div>
              </div>
              <div className="column">
                <div className="field">
                  <label className="label" htmlFor="sensitivity">
                    Sensitivity
                  </label>
                  <div className="control">
                    <label className="radio">
                      <input
                        type="radio"
                        name="sensitivity"
                        value="meta"
                        checked={sensitivity === "meta"}
                        onChange={() => {
                          sensitivitySetter("meta");
                        }}
                      />
                      Meta
                    </label>
                    <label className="radio">
                      <input
                        type="radio"
                        name="sensitivity"
                        value="variants"
                        checked={sensitivity === "variants"}
                        onChange={() => {
                          sensitivitySetter("variants");
                        }}
                      />
                      Meta + Variants
                    </label>
                  </div>
                  <p className="help">
                    Determines what "matching" means when determining whether
                    you're below your limit. <tt>Meta</tt> counts <em>all</em>{" "}
                    games of that type. <tt>Meta + Variants</tt> only counts
                    games with the matching variant combination.
                  </p>
                </div>
              </div>
            </div>
            <div className="field">
              <label className="label">Choose clock speed</label>
              <div className="control">
                <label className="radio">
                  <input
                    type="radio"
                    name="clockSpeed"
                    value="fast"
                    checked={clockSpeed === "fast"}
                    onChange={() => {
                      clockSpeedSetter("fast");
                      setClock(24, 8, 48);
                    }}
                  />
                  Fast (daily)
                </label>
                <label className="radio">
                  <input
                    type="radio"
                    name="clockSpeed"
                    value="medium"
                    checked={clockSpeed === "medium"}
                    onChange={() => {
                      clockSpeedSetter("medium");
                      setClock(48, 24, 96);
                    }}
                  />
                  Medium (twice weekly)
                </label>
                <label className="radio">
                  <input
                    type="radio"
                    name="clockSpeed"
                    value="slow"
                    checked={clockSpeed === "slow"}
                    onChange={() => {
                      clockSpeedSetter("slow");
                      setClock(72, 48, 168);
                    }}
                  />
                  Slow (weekly)
                </label>
                <label className="radio">
                  <input
                    type="radio"
                    name="clockSpeed"
                    value="custom"
                    checked={clockSpeed === "custom"}
                    onChange={() => clockSpeedSetter("custom")}
                  />
                  Custom
                </label>
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <div className="field">
                  <label className="label" htmlFor="clock_start">
                    {t("ChooseClockStart")}
                  </label>
                  <div className="control">
                    <input
                      className="input is-small"
                      type="text"
                      id="clock_start"
                      name="clock_start"
                      size="3"
                      value={clockStart}
                      onChange={handleClockStartChange}
                    />
                  </div>
                  <p className="help">{t("HelpClockStart")}</p>
                </div>
              </div>
              <div className="column">
                <div className="field">
                  <label className="label" htmlFor="clock_inc">
                    {t("ChooseClockIncrement")}
                  </label>
                  <div className="control">
                    <input
                      className="input is-small"
                      type="text"
                      id="clock_inc"
                      name="clock_inc"
                      size="3"
                      value={clockInc}
                      onChange={handleClockIncChange}
                    />
                  </div>
                  <p className="help">{t("HelpClockIncrement")}</p>
                </div>
              </div>
              <div className="column">
                <div className="field">
                  <label className="label" htmlFor="clock_max">
                    {t("ChooseClockMax")}
                  </label>
                  <div className="control">
                    <input
                      className="input is-small"
                      type="text"
                      id="clock_start"
                      name="clock_max"
                      size="3"
                      value={clockMax}
                      onChange={handleClockMaxChange}
                    />
                  </div>
                  <p className="help">{t("HelpClockMax")}</p>
                </div>
              </div>
            </div>
            <div className="field">
              <div className="control">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    id="clock_hard"
                    checked={clockHard}
                    onChange={handleClockHardChange}
                  />
                  {t("ChooseClockHard")}
                </label>
              </div>
              <p className="help">
                {clockHard ? t("HelpClockHard") : t("HelpClockSoft")}
              </p>
            </div>
            <div className="field">
              <div className="control">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    id="noExplore"
                    checked={noExplore}
                    onChange={handleNoExploreChange}
                  />
                  {t("ChooseNoExplore")}
                </label>
              </div>
              <p className="help">
                {noExplore ? t("HelpNoExploreTrue") : t("HelpNoExploreFalse")}
              </p>
            </div>
          </Fragment>
        )}
        {metaGame === null || playerCount !== 2 ? null : (
          <div className="field">
            <div className="control">
              <label className="checkbox">
                <input
                  type="checkbox"
                  id="rated"
                  checked={rated}
                  onChange={handleRatedChange}
                />
                {t("ChooseRated")}
              </label>
            </div>
            <p className="help">{rated ? t("HelpRated") : t("HelpUnRated")}</p>
          </div>
        )}
      </div>
      <div className="is-danger">{error}</div>
    </Modal>
  );
}

export default StandingChallengeModal;
