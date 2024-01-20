import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  Fragment,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import Spinner from "./Spinner";
import { cloneDeep } from "lodash";
import { gameinfo, GameFactory, addResource } from "@abstractplay/gameslib";
import { MeContext, UsersContext } from "../pages/Skeleton";
import { useStorageState } from "react-use-storage-state";
import Modal from "./Modal";

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
  const [allvariants, allvariantsSetter] = useState(null);
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
  const [standing, standingSetter] = useState(false); // Standing challenge or not.
  const [standingCount, standingCountSetter] = useState(0);
  const [opponents, opponentsSetter] = useState([]);
  const [nonGroupVariants, nonGroupVariantsSetter] = useState({});
  const [groupDefaultData, groupDefaultDataSetter] = useState({});
  const groupVariantsRef = useRef({});
  const [globalMe] = useContext(MeContext);
  const [allUsers] = useContext(UsersContext);
  const [users, usersSetter] = useState([]);

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    if ( (allUsers !== null) && (metaGame !== null) ) {
        const info = gameinfo.get(metaGame);
        if (! info.flags.includes("aiai")) {
            usersSetter([...allUsers].filter(u => u.id !== aiaiUserID));
        } else {
            usersSetter([...allUsers]);
        }
    }
  }, [allUsers, metaGame]);

  useEffect(() => {
    const now = (new Date()).getTime();
    let min = 0;
    if (onlySee === "week") {
        min = now - (7 * 24 * 60 * 60 * 1000);
    } else if (onlySee === "month") {
        min = now - (30 * 24 * 60 * 60 * 1000);
    }
    minSeenSetter(min);
  }, [onlySee]);

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
    [playerCountSetter, seatingSetter, ratedSetter, opponents.length, opponentsSetter]
  );

  const setClock = (start, inc, max) => {
    clockStartSetter(start);
    clockIncSetter(inc);
    clockMaxSetter(max);
  };

  const handleChangeGame = useCallback(
    (game) => {
      groupVariantsRef.current = {};
      if (game === "") {
        metaGameSetter(null);
      } else {
        metaGameSetter(game);
        const info = gameinfo.get(game);
        let gameEngine;
        if (info.playercounts.length > 1) {
          gameEngine = GameFactory(info.uid, 2);
        } else {
          gameEngine = GameFactory(info.uid);
        }
        allvariantsSetter(gameEngine.allvariants());
        let ngVariants = {};
        if (gameEngine.allvariants())
          gameEngine
            .allvariants()
            .filter((v) => v.group === undefined)
            .forEach((v) => (ngVariants[v.uid] = false));
        nonGroupVariantsSetter(ngVariants);
        if (gameEngine.allvariants()?.length > 0) {
            const defaults = {};
            [...new Set(gameEngine.allvariants().filter(v => v.group !== undefined).map(v => v.group))].forEach((g) => {
                const {name, description} = gameEngine.describeVariantGroupDefaults(g);
                defaults[g] = {
                    name: name || g,
                    description,
                };
            });
            groupDefaultDataSetter({...defaults});
        } else {
            groupDefaultDataSetter({});
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
    },
    [
      metaGameSetter,
      allvariantsSetter,
      nonGroupVariantsSetter,
      groupDefaultDataSetter,
      setPlayerCount,
      playerCountSetter,
      opponentsSetter,
      props,
    ]
  );

  useEffect(() => {
    groupVariantsRef.current = {};
    nonGroupVariantsSetter({});
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
  }, [show, props, handleChangeGame]);

  const handleChangePlayerCount = (cnt) => {
    setPlayerCount(parseInt(cnt));
    errorSetter("");
  };

  const handleChangeSeating = (seat) => {
    seatingSetter(seat);
    errorSetter("");
  };

  //   const handleStandingChallengeChange = (value) => {
  //     if (value === "open") {
  //       standingSetter(false);
  //     } else {
  //       standingSetter(true);
  //     }
  //   };

  const handleChangeOpponent = (data) => {
    let opps = [...opponents];
    opps[data.player] = { id: data.id, name: data.name };
    opponentsSetter(opps);
    errorSetter("");
  };

  const handleGroupChange = (group, variant) => {
    // Ref gets updated, so no rerender. The radio buttons aren't "controlled"
    groupVariantsRef.current[group] = variant;
  };

  const handleNonGroupChange = (event) => {
    // State get updated, so rerender. The checkboxes are controlled.
    let ngVariants = cloneDeep(nonGroupVariants);
    ngVariants[event.target.id] = !ngVariants[event.target.id];
    nonGroupVariantsSetter(ngVariants);
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
    let variants = [];
    for (var group of Object.keys(groupVariantsRef.current)) {
      if (
        groupVariantsRef.current[group] !== null &&
        groupVariantsRef.current[group] !== ""
      ) {
        variants.push(groupVariantsRef.current[group]);
      }
    }
    for (var variant of Object.keys(nonGroupVariants)) {
      if (nonGroupVariants[variant]) {
        variants.push(variant);
      }
    }
    handleNewChallenge({
      metaGame: metaGame,
      numPlayers: playerCount,
      standing: standing,
      duration: standingCount,
      seating: seating,
      variants: variants,
      challengees: opponents,
      clockStart: clockStart,
      clockInc: clockInc,
      clockMax: clockMax,
      clockHard: clockHard,
      rated: rated,
    });
    handleNewChallengeClose();
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

  let groupData = [];
  let nonGroupData = [];
  let playercounts = [];
  if (metaGame !== null) {
    const info = gameinfo.get(metaGame);
    if (allvariants && allvariants !== undefined) {
      const groups = [
        ...new Set(
          allvariants.filter((v) => v.group !== undefined).map((v) => v.group)
        ),
      ];
      groupData = groups.map((g) => {
        return {
          group: g,
          variants: allvariants
            .filter((v) => v.group === g)
            // .sort((a, b) => (a.uid > b.uid ? 1 : -1)),
        };
      });
      nonGroupData = allvariants
        .filter((v) => v.group === undefined)
        // .sort((a, b) => (a.uid > b.uid ? 1 : -1));
    }
    playercounts = info.playercounts;
  }
  //   if (!(metaGame === null || nonGroupData.length === 0)) {
  //     console.log("nonGroupData", nonGroupData);
  //     console.log(nonGroupVariants);
  //   }
  //   console.log(opponents);
  return (
    <Modal
      show={show}
      title={t("NewChallenge")}
      buttons={[
        { label: t("Challenge"), action: handleChallenge },
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
                  onClick={() => standingSetter(true)}
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
                  onClick={() => standingSetter(false)}
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
        {playerCount === -1 || standing
          ? ""
          : /* Opponents filtering */
          <div className="control">
            <p className="help">Use this to filter out inactive opponents</p>
            <label className="radio">
                <input
                    type="radio"
                    name="oppFilter"
                    checked={onlySee === "all"}
                    value="all"
                    onClick={() => onlySeeSetter("all")}
                />
                All opponents
            </label>
            <label className="radio">
                <input
                    type="radio"
                    name="oppFilter"
                    checked={onlySee === "week"}
                    value="week"
                    onClick={() => onlySeeSetter("week")}
                />
                Past 7 days
            </label>
            <label className="radio">
                <input
                    type="radio"
                    name="oppFilter"
                    checked={onlySee === "month"}
                    value="month"
                    onClick={() => onlySeeSetter("month")}
                />
                Past 30 days
            </label>
          </div>
        }
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
        {groupData.length === 0 && nonGroupData.length === 0 ? (
          ""
        ) : (
          <Fragment>
            <div className="field">
              <label className="label">{t("PickVariant")}</label>
            </div>
            <div className="indentedContainer">
              {metaGame === null || groupData.length === 0
                ? ""
                : groupData.map((g) => (
                    <div
                      className="field"
                      key={"group:" + g.group}
                      onChange={(e) =>
                        handleGroupChange(g.group, e.target.value)
                      }
                    >
                      <label className="label">{t("PickOneVariant")}</label>
                      <div className="control">
                        <label className="radio">
                          <input
                            type="radio"
                            id="default"
                            value=""
                            name={g.group}
                            defaultChecked
                          />
                          {`Default ${groupDefaultData[g.group].name}`}
                          </label>
                          {groupDefaultData[g.group]?.description === undefined ||
                          groupDefaultData[g.group]?.description.length === 0 ? (
                            ""
                          ) : (
                            <p
                              className="help"
                              style={{
                                marginTop: "-0.5%",
                              }}
                            >
                              {groupDefaultData[g.group].description}
                            </p>
                          )}
                      </div>
                      {g.variants.map((v) => (
                        <div className="control" key={v.uid}>
                          <label className="radio">
                            <input
                              type="radio"
                              id={v.uid}
                              value={v.uid}
                              name={g.group}
                            />
                            {v.name}
                          </label>
                          {v.description === undefined ||
                          v.description.length === 0 ? (
                            ""
                          ) : (
                            <p
                              className="help"
                              style={{
                                marginTop: "-0.5%",
                              }}
                            >
                              {v.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
              {metaGame === null || nonGroupData.length === 0 ? (
                ""
              ) : (
                <Fragment>
                  <div className="field">
                    <label className="label">{t("PickAnyVariant")}</label>
                  </div>
                  <div className="field">
                    {nonGroupData.map((v) => (
                      <div className="control" key={v.uid}>
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            id={v.uid}
                            checked={nonGroupVariants[v.uid]}
                            onChange={handleNonGroupChange}
                          />
                          {v.name}
                        </label>
                        {v.description === undefined ||
                        v.description.length === 0 ? (
                          ""
                        ) : (
                          <p
                            className="help"
                            style={{
                              marginTop: "-0.5%",
                            }}
                          >
                            {v.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Fragment>
              )}
            </div>
          </Fragment>
        )}
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
                    onClick={() => {
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
                    onClick={() => {
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
                    onClick={() => {
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
                    onClick={() => clockSpeedSetter("custom")}
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

export default NewChallengeModal;
