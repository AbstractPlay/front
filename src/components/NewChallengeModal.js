import React, {
  useState,
  useEffect,
  useContext,
  Fragment,
  useCallback,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import Spinner from "./Spinner";
import { gameinfo, addResource } from "@abstractplay/gameslib";
import { MeContext, UsersContext } from "../pages/Skeleton";
import { useStorageState } from "react-use-storage-state";
import Modal from "./Modal";
import GameVariants from "./GameVariants";

const aiaiUserID = "SkQfHAjeDxs8eeEnScuYA";

function NewChallengeModal(props) {
  const handleNewChallengeClose = props.handleClose;
  const handleNewChallenge = props.handleChallenge;
  const opponent = props.opponent;
  const fixedMetaGame = props.fixedMetaGame;
  const show = props.show;
  const { t, i18n } = useTranslation();
  const [error, errorSetter] = useState(null);
  const [metaGame, metaGameSetter] = useState(null);
  const [playerCount, playerCountSetter] = useState(-1);
  const [seating, seatingSetter] = useState("random");
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
  const [onlySee, onlySeeSetter] = useStorageState(
    "new-challenge-onlySee",
    "all"
  );
  const [minSeen, minSeenSetter] = useState(0);
  const [rated, ratedSetter] = useStorageState("new-challenge-rated", true); // rated or not
  const [noExplore, noExploreSetter] = useStorageState(
    "new-challenge-noExplore",
    false
  );
  const [standing, standingSetter] = useState(false); // Standing challenge or not.
  const [standingCount, standingCountSetter] = useState(0);
  const [opponents, opponentsSetter] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [comment, commentSetter] = useState("");
  const [globalMe] = useContext(MeContext);
  const [allUsers] = useContext(UsersContext);
  const [users, usersSetter] = useState([]);
  const [forceUnrated, setForceUnrated] = useState(false);
  const errorRef = useRef(null);

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    let forced = false;
    if (metaGame !== null) {
        const info = gameinfo.get(metaGame);
        for (const vname of selectedVariants) {
            const variant = info.variants.find((v) => v.uid === vname);
            if (variant.unrated === true) {
                forced = true;
                break;
            }
        }
    }
    setForceUnrated(forced);
  }, [metaGame, selectedVariants]);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [error]);

  useEffect(() => {
    if (allUsers !== null && metaGame !== null) {
      const info = gameinfo.get(metaGame);
      if (!info.flags.includes("aiai")) {
        usersSetter([...allUsers].filter((u) => u.id !== aiaiUserID));
      } else {
        usersSetter([...allUsers]);
      }
    }
  }, [allUsers, metaGame]);

  useEffect(() => {
    const now = new Date().getTime();
    let min = 0;
    if (onlySee === "week") {
      min = now - 7 * 24 * 60 * 60 * 1000;
    } else if (onlySee === "month") {
      min = now - 30 * 24 * 60 * 60 * 1000;
    }
    minSeenSetter(min);
  }, [onlySee]);

  const resetToDefault = () => {
    clockSpeedSetter("medium");
    clockStartSetter(48);
    clockIncSetter(24);
    clockMaxSetter(96);
    clockHardSetter(false);
    onlySeeSetter("all");
    ratedSetter(true);
    noExploreSetter(false);
  };

  const setPlayerCount = useCallback(
    (cnt) => {
      playerCountSetter(cnt);
      if (cnt === 2) {
        seatingSetter("random");
        // ratedSetter(true);
      } else {
        seatingSetter("random");
        ratedSetter(false);
      }
      if (cnt !== -1 && cnt - 1 !== opponents.length) {
        opponentsSetter(Array(cnt - 1).fill(""));
      }
    },
    [ratedSetter, opponents.length]
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
          if (info === undefined) {
            throw new Error(`Could not find game metadata for "${game}"`);
          }
          const playercounts = info.playercounts;
          if (playercounts.length === 1) {
            setPlayerCount(playercounts[0]);
          } else if (props.opponent !== undefined) {
            setPlayerCount(2);
          } else {
            playerCountSetter(-1);
            opponentsSetter([]);
          }
          seatingSetter("random");
        }
        errorSetter("");
      }
    },
    [metaGame, setPlayerCount, props.opponent]
  );

  useEffect(() => {
    if (props.opponent !== undefined) {
      playerCountSetter(2);
      opponentsSetter([props.opponent]);
    }
    errorSetter("");
    // clockStartSetter(72);
    // clockIncSetter(24);
    // clockMaxSetter(240);
    // clockHardSetter(false);
    if (props.fixedMetaGame !== undefined) {
      metaGameSetter(props.fixedMetaGame);
      handleChangeGame(props.fixedMetaGame);
    }
    if (props.opponent !== undefined) {
      opponentsSetter([props.opponent]);
    }
  }, [show, props.opponent, props.fixedMetaGame, handleChangeGame]);

  const handleChangePlayerCount = (cnt) => {
    setPlayerCount(parseInt(cnt));
    errorSetter("");
  };

  const handleChangeSeating = (seat) => {
    seatingSetter(seat);
    errorSetter("");
  };

  const handleChangeOpponent = (data) => {
    let opps = [...opponents];
    opps[data.player] = { id: data.id, name: data.name };
    opponentsSetter(opps);
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

  const handleCommentChange = (event) => {
    errorSetter("");
    commentSetter(event.target.value);
  };

  const handleNoExploreChange = (event) => {
    // ratedSetter(event.target.checked);
    noExploreSetter(!noExplore);
  };

  const handleChallenge = () => {
    if (metaGame === null) {
      errorSetter(t("SelectAGame"));
      return;
    }
    if (playerCount === null || playerCount === -1) {
      errorSetter(t("SelectPlayerCount"));
      return;
    }
    if (seating === null || seating === "") {
      errorSetter(t("SelectSeating"));
      return;
    }
    if (!standing) {
      let ok = true;
      opponents.forEach((o) => {
        if (o === "") {
          errorSetter(t("SelectOpponents", { count: opponents.length }));
          ok = false;
          return;
        }
      });
      if (!ok) return;
    }
    handleNewChallenge({
      metaGame: metaGame,
      numPlayers: playerCount,
      standing: standing,
      duration: standingCount,
      seating: seating,
      variants: selectedVariants,
      challengees: opponents,
      clockStart: clockStart,
      clockInc: clockInc,
      clockMax: clockMax,
      clockHard: clockHard,
      rated: forceUnrated ? false : rated,
      noExplore: noExplore,
      comment: comment,
    });
    handleNewChallengeClose();
    // So that if you click on challenge again, it doesn't look like the challenge wasn't submitted:
    playerCountSetter(-1);
    opponentsSetter([]);
    metaGameSetter(null);
    commentSetter("");
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

  if (
    process.env.REACT_APP_REAL_MODE === "production" &&
    metaGame !== null &&
    (!gameinfo.has(metaGame) ||
      gameinfo.get(metaGame).flags.includes("experimental"))
  ) {
    return null;
  } else {
    return (
      <Modal
        show={show}
        title={t("NewChallenge")}
        buttons={[
          { label: t("Challenge"), action: handleChallenge },
          { label: t("ResetDefault"), action: resetToDefault },
          { label: t("Close"), action: handleNewChallengeClose },
        ]}
      >
        <div className="container">
          {fixedMetaGame ? (
            <p>
              <strong>{t("ChooseGame")}</strong>:{" "}
              {gameinfo.get(fixedMetaGame).name}
            </p>
          ) : (
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
          )}
          {metaGame === null ? (
            ""
          ) : /* Number of players */
          playercounts.length === 1 || opponent ? (
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
          {metaGame === null || playerCount === -1 ? (
            ""
          ) : playerCount !== 2 ? (
            <p>
              <strong>{t("Seating")}</strong>: {t("SeatingRandom")}
            </p>
          ) : (
            <div className="field">
              {/* Seating */}
              <label className="label" htmlFor="seating">
                {t("Seating")}
              </label>
              <div className="select is-small">
                <select
                  value={seating}
                  name="seating"
                  id="seating"
                  onChange={(e) => handleChangeSeating(e.target.value)}
                >
                  {/* <option key="s0" value="">--{t('Select')}--</option> */}
                  <option key="s1" value="random" defaultChecked>
                    {t("SeatingRandom")}
                  </option>
                  <option key="s2" value="s1">
                    {t("Seating1")}
                  </option>
                  <option key="s3" value="s2">
                    {t("Seating2")}
                  </option>
                </select>
              </div>
            </div>
          )}
          {metaGame === null || playerCount === -1 ? (
            ""
          ) : /* Standing Challenge */
          opponent ? (
            ""
          ) : (
            <div className="field">
              <label className="label">{t("ChallengeType")}</label>
              <div className="control">
                <label className="radio">
                  <input
                    type="radio"
                    name="challengeType"
                    value="open"
                    readOnly={true}
                    checked={standing}
                    onChange={() => standingSetter(true)}
                  />
                  {t("ChallengeTypeOpen")}
                </label>
                <label className="radio">
                  <input
                    type="radio"
                    name="challengeType"
                    value="targeted"
                    checked={!standing}
                    readOnly={true}
                    onChange={() => standingSetter(false)}
                  />
                  {t("ChallengeTypeTargeted")}
                </label>
              </div>
              <p className="help">
                {standing
                  ? t("ChallengeTypeOpenDescription")
                  : t("ChallengeTypeTargetedDescription")}
              </p>
            </div>
          )}
          {playerCount === -1 || standing || props.opponent !== undefined ? (
            ""
          ) : (
            /* Opponents filtering */
            <div className="control">
              <p className="help">Use this to filter out inactive opponents</p>
              <label className="radio">
                <input
                  type="radio"
                  name="oppFilter"
                  checked={onlySee === "all"}
                  value="all"
                  onChange={() => onlySeeSetter("all")}
                />
                All opponents
              </label>
              <label className="radio">
                <input
                  type="radio"
                  name="oppFilter"
                  checked={onlySee === "week"}
                  value="week"
                  onChange={() => onlySeeSetter("week")}
                />
                Past 7 days
              </label>
              <label className="radio">
                <input
                  type="radio"
                  name="oppFilter"
                  checked={onlySee === "month"}
                  value="month"
                  onChange={() => onlySeeSetter("month")}
                />
                Past 30 days
              </label>
            </div>
          )}
          {playerCount === -1 || standing
            ? ""
            : /* Opponents */
              opponents.map((o, i) => {
                return (
                  <div className="field" key={i}>
                    <label className="label" htmlFor={"user_for_challenge" + i}>
                      {playerCount === 2
                        ? t("ChooseOpponent")
                        : t("ChooseOpponent", i)}
                    </label>
                    <div className="control">
                      {users === null && !opponent ? (
                        <Spinner />
                      ) : opponent ? (
                        opponent.name
                      ) : (
                        <div className="select is-small">
                          <select
                            value={o.id || ""}
                            name="users"
                            id={"user_for_challenge" + i}
                            onChange={(e) =>
                              handleChangeOpponent({
                                id: e.target.value,
                                name: e.target.options[e.target.selectedIndex]
                                  .text,
                                player: i,
                              })
                            }
                          >
                            <option value="">--{t("Select")}--</option>
                            {users
                              .filter(
                                (user) =>
                                  user.id === opponents[i].id ||
                                  (user.id !== globalMe.id &&
                                    !opponents.some((o) => user.id === o.id) &&
                                    user.lastSeen >= minSeen)
                              )
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map((item) => {
                                return (
                                  <option key={item.id} value={item.id}>
                                    {item.name}
                                  </option>
                                );
                              })}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          {!standing ? (
            ""
          ) : playerCount === -1 || playerCount > 2 ? (
            ""
          ) : (
            <div className="field">
              <label className="label is-small" htmlFor="duration">
                {t("Duration")}
              </label>
              <div className="control">
                <input
                  className="input is-small"
                  type="number"
                  min={0}
                  name="duration"
                  placeholder="duration"
                  style={{ width: "50%" }}
                  value={standingCount}
                  onChange={(e) =>
                    standingCountSetter(parseInt(e.target.value, 10))
                  }
                />
              </div>
              <p className="help">
                {standingCount === 0
                  ? t("DurationHelpPersistent")
                  : t("DurationHelp", { count: standingCount })}
              </p>
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
                    disabled={forceUnrated}
                  />
                  {t("ChooseRated")}
                </label>
              </div>
              <p className="help">
                {rated ? t("HelpRated") : t("HelpUnRated")}
              </p>
            </div>
          )}
          {/* Comment to opponent */}
          {metaGame === null || playerCount !== 2 ? null : (
            <div className="field">
              <label className="label" htmlFor="comment">
                {t("Note")}
              </label>
              <div className="control">
                <textarea
                  className="textarea is-small"
                  id="comment"
                  name="comment"
                  rows="2"
                  maxLength="128"
                  value={comment}
                  onChange={handleCommentChange}
                ></textarea>
              </div>
              <p className="help">{t("NotesHelp")}</p>
            </div>
          )}
        </div>
        {error && (
          <div ref={errorRef} className="has-text-danger has-text-weight-bold">
            {error}
          </div>
        )}
      </Modal>
    );
  }
}

export default NewChallengeModal;
