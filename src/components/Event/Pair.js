import { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import { gameinfo, GameFactory } from "@abstractplay/gameslib";
import { Auth } from "aws-amplify";
import { API_ENDPOINT_AUTH } from "../../config";
import { cloneDeep } from "lodash";
import SortableList, { SortableItem } from "react-easy-sort";
import arrayMove from "array-move";
import { UsersContext } from "../../pages/Skeleton";
import { bergerTable } from "../../lib/berger";
import PairingTable from "./PairingTable";
import Modal from "../Modal";

const errorDesc = new Map([
  [
    "dupeExact",
    "This combination of p1, p2, and game is an exact duplicate of an earlier entry. This is almost never desirable.",
  ],
  [
    "dupeReversed",
    "This combination of p1, p2, and game is a mirror image of an earlier entry. This is usually not intended.",
  ],
  ["selfPlay", "p1 and p2 are the same!"],
]);

function Pair({ event, setRefresh }) {
  const { t } = useTranslation();
  const [allUsers] = useContext(UsersContext);
  const [round, setRound] = useState(0);
  const [validMeta, setValidMeta] = useState(null);
  const [metagame, setMetagame] = useState(null);
  const [allVariants, setAllVariants] = useState(null);
  const [varDefaults, setVarDefaults] = useState({});
  const [ngVars, setNgVars] = useState({});
  const [groupData, setGroupData] = useState([]);
  const [nonGroupData, setNonGroupData] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState({});
  const [clockStart, setClockStart] = useState(36);
  const [clockInc, setClockInc] = useState(24);
  const [clockMax, setClockMax] = useState(72);
  const [divisions, setDivisions] = useState([]);
  const [pairs, setPairs] = useState([]);
  const [manualP1, setManualP1] = useState(null);
  const [manualP2, setManualP2] = useState(null);
  const [errors, setErrors] = useState(null);
  const [showModalErrors, showModalErrorsSetter] = useState(false);
  const [showModalConfirm, showModalConfirmSetter] = useState(false);

  // set prop-dependent state
  useEffect(() => {
    if (event !== null && event !== undefined) {
      // extrapolate round from existing games
      const allrounds = event.games.map((g) => g.round);
      let roundCalc = Math.max(...[0, ...allrounds]) + 1;
      setRound(roundCalc);

      // get list of players, initially sorted by display name
      const divNums = new Set(event.players.map((p) => p.division));
      const divNumsSorted = [...divNums].sort((a, b) => a - b);
      const tmpDivisions = [];
      for (const div of divNumsSorted) {
        const playerids = event.players
          .filter((p) => p.division === div)
          .map((p) => p.playerid);
        const players = allUsers?.filter((u) => playerids.includes(u.id));
        tmpDivisions.push(players);
      }
      setDivisions(tmpDivisions);
    }
    let allMeta = [...gameinfo.values()];
    if (process.env.REACT_APP_REAL_MODE === "production") {
      allMeta = allMeta.filter((i) => !i.flags.includes("experimental"));
    }
    allMeta.sort((a, b) => a.name.localeCompare(b.name));
    setValidMeta(allMeta.map((i) => [i.uid, i.name]));
  }, [event, allUsers]);

  const handleMetaChange = (val) => {
    if (val === "") {
      setMetagame(null);
      setAllVariants(null);
      setVarDefaults({});
      setNgVars({});
      setGroupData([]);
      setNonGroupData([]);
      setSelectedGroups({});
    } else {
      setMetagame(val);
      setSelectedGroups({});
      // calculate applicable variants
      const info = gameinfo.get(val);
      let gameEngine;
      if (info.playercounts.length > 1) {
        gameEngine = GameFactory(info.uid, 2);
      } else {
        gameEngine = GameFactory(info.uid);
      }
      let rootAllVariants = gameEngine.allvariants();
      if (process.env.REACT_APP_REAL_MODE === "production") {
        rootAllVariants = rootAllVariants?.filter(
          (v) => v.experimental === undefined || v.experimental === false
        );
      }
      setAllVariants(rootAllVariants);

      let ngVariants = {};
      if (rootAllVariants) {
        rootAllVariants
          .filter((v) => v.group === undefined)
          .forEach((v) => (ngVariants[v.uid] = false));
      }
      setNgVars(ngVariants);

      let defaults = {};
      if (rootAllVariants?.length > 0) {
        [
          ...new Set(
            rootAllVariants
              .filter((v) => v.group !== undefined)
              .map((v) => v.group)
          ),
        ].forEach((g) => {
          const { name, description } =
            gameEngine.describeVariantGroupDefaults(g);
          defaults[g] = {
            name: name || g,
            description,
          };
        });
      }
      setVarDefaults(defaults);

      let groupData = [];
      let nonGroupData = [];
      if (rootAllVariants && rootAllVariants !== undefined) {
        const groups = [
          ...new Set(
            rootAllVariants
              .filter((v) => v.group !== undefined)
              .map((v) => v.group)
          ),
        ];
        groupData = groups.map((g) => {
          return {
            group: g,
            variants: rootAllVariants.filter((v) => v.group === g),
            // .sort((a, b) => (a.uid > b.uid ? 1 : -1)),
          };
        });
        nonGroupData = rootAllVariants.filter((v) => v.group === undefined);
        // .sort((a, b) => (a.uid > b.uid ? 1 : -1));
      }
      setGroupData(groupData);
      setNonGroupData(nonGroupData);
    }
  };

  const handleGroupChange = (group, variant) => {
    const sel = cloneDeep(selectedGroups);
    sel[group] = variant;
    setSelectedGroups(sel);
  };

  const handleNonGroupChange = (event) => {
    let ngVariants = cloneDeep(ngVars);
    ngVariants[event.target.id] = !ngVariants[event.target.id];
    setNgVars(ngVariants);
  };

  const pushPairings = (pairs) => {
    if (metagame !== null && clockStart > 1 && clockInc > 1 && clockMax > 1) {
      const variants = [];
      for (const key in selectedGroups) {
        variants.push(selectedGroups[key]);
      }
      for (const key in ngVars) {
        if (ngVars[key]) {
          variants.push(key);
        }
      }
      const metaObj = {
        round,
        metagame,
        variants,
        clockStart,
        clockInc,
        clockMax,
      };
      setPairs((lst) => [
        ...lst,
        ...pairs.map(([p1, p2]) => {
          return { ...metaObj, p1, p2 };
        }),
      ]);
    }
  };

  // signal any faults in the current pairs data
  useEffect(() => {
    const allErrors = [];
    // look for duplicates
    const setOrdered = new Set();
    pairs.forEach(({ metagame, p1, p2 }, idx) => {
      const idOrdered = [p1.id, p2.id, metagame].join("|");
      if (setOrdered.has(idOrdered)) {
        allErrors.push({ type: "dupeExact", idx, p1, p2, metagame });
      } else {
        setOrdered.add(idOrdered);
      }
    });
    if (allErrors.length === 0) {
      const setNormed = new Set();
      pairs.forEach(({ metagame, p1, p2 }, idx) => {
        const players = [p1.id, p2.id];
        players.sort((a, b) => a.localeCompare(b));
        const idNormed = [...players, metagame].join("|");
        if (setNormed.has(idNormed)) {
          allErrors.push({ type: "dupeReversed", idx, p1, p2, metagame });
        } else {
          setNormed.add(idNormed);
        }
      });
    }

    // self plays (this should never happen, but may as well check)
    pairs.forEach(({ p1, p2 }, idx) => {
      if (p1.id === p2.id) {
        allErrors.push({ type: "selfPlay", idx, player: p1 });
      }
    });

    if (allErrors.length > 0) {
      setErrors(allErrors);
    } else {
      setErrors(null);
    }
  }, [pairs]);

  const pairBerger = (players) => {
    const berger = bergerTable(players);
    pushPairings(berger.map(({ teamA, teamB }) => [teamA, teamB]));
  };

  const pairDutch = (players) => {
    const pairs = [];
    const mid = Math.floor(players.length / 2);
    for (let i = 0; i < mid; i++) {
      pairs.push([players[i], players[mid + i]]);
    }
    pushPairings(pairs);
  };

  const handleManualPairing = () => {
    if (
      manualP1 !== null &&
      manualP1 !== "" &&
      manualP2 !== null &&
      manualP2 !== "" &&
      manualP1 !== manualP2
    ) {
      const p1 = divisions.flat().find((u) => u.id === manualP1);
      const p2 = divisions.flat().find((u) => u.id === manualP2);
      if (p1 !== undefined && p2 !== undefined) {
        pushPairings([[p1, p2]]);
      }
    }
  };

  const delPairing = (idx) => {
    setPairs((lst) => [...lst.slice(0, idx), ...lst.slice(idx + 1)]);
  };

  const swapPairing = (idx) => {
    const pair = cloneDeep(pairs[idx]);
    const scratch = cloneDeep(pair.p1);
    pair.p1 = cloneDeep(pair.p2);
    pair.p2 = scratch;
    setPairs((lst) => [...lst.slice(0, idx), pair, ...lst.slice(idx + 1)]);
  };

  const handleCreateGames = () => {
    console.log("About to create the following pairings:", pairs);
    async function createGames(pairings) {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
          },
          body: JSON.stringify({
            query: "event_create_games",
            pars: {
              eventid: event.event.sk,
              pairs: pairings,
            },
          }),
        });
        if (res.status !== 200) {
          console.log(
            `An error occurred creating the games: ${JSON.stringify(res)}`
          );
          return false;
        } else {
          return true;
        }
      } catch (error) {
        console.log(
          `An error occurred creating the games: ${JSON.stringify(error)}`
        );
        return false;
      }
    }
    if (pairs.length > 0) {
      createGames(pairs).then((success) => {
        if (success) {
          setRefresh((val) => val + 1);
        }
      });
      setPairs([]);
      showModalConfirmSetter(false);
    }
  };

  return (
    <>
      <h2 className="subtitle lined">
        <span>Pairing</span>
      </h2>
      <div className="container">
        {/* Set the round number */}
        <div className="field">
          <label className="label" htmlFor="round">
            Round
          </label>
          <div className="control">
            <input
              className="input"
              type="number"
              name="round"
              min={1}
              value={round}
              onChange={(e) => setRound(e.target.value)}
            />
          </div>
        </div>
        {/* select the metagame */}
        {validMeta === null ? null : (
          <div className="field">
            <label className="label" htmlFor="metagame">
              Game
            </label>
            <div className="control">
              <div className="select">
                <select
                  name="metagame"
                  value={metagame || ""}
                  onChange={(e) => handleMetaChange(e.target.value)}
                >
                  <option value=""></option>
                  {validMeta.map(([k, v], i) => (
                    <option value={k} key={`meta${i}`}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        {/* select the variants */}
        {groupData.length === 0 && nonGroupData.length === 0 ? null : (
          <>
            <div className="field">
              <label className="label">{t("PickVariant")}</label>
            </div>
            <div className="indentedContainer">
              {metagame === null || groupData.length === 0
                ? null
                : groupData.map((g) => (
                    <div className="field" key={"group:" + g.group}>
                      <label className="label">{t("PickOneVariant")}</label>
                      <div className="control">
                        <label className="radio">
                          <input
                            type="radio"
                            id="default"
                            value=""
                            name={g.group}
                            checked={
                              // eslint-disable-next-line no-prototype-builtins
                              !selectedGroups.hasOwnProperty(g.group) ||
                              selectedGroups[g.group] === ""
                            }
                            onChange={(e) =>
                              handleGroupChange(g.group, e.target.value)
                            }
                          />
                          {`Default ${varDefaults[g.group].name}`}
                        </label>
                        {varDefaults[g.group]?.description === undefined ||
                        varDefaults[g.group]?.description.length === 0 ? (
                          ""
                        ) : (
                          <p
                            className="help"
                            style={{
                              marginTop: "-0.5%",
                            }}
                          >
                            {varDefaults[g.group].description}
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
                              checked={
                                // eslint-disable-next-line no-prototype-builtins
                                selectedGroups.hasOwnProperty(g.group) &&
                                selectedGroups[g.group] === v.uid
                              }
                              onChange={(e) =>
                                handleGroupChange(g.group, e.target.value)
                              }
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
              {metagame === null || nonGroupData.length === 0 ? (
                ""
              ) : (
                <>
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
                            checked={ngVars[v.uid]}
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
                </>
              )}
            </div>
          </>
        )}
        {/* set the clock */}
        {metagame === null ? null : (
          <div className="columns">
            <div className="column">
              <div className="field">
                <label className="label" htmlFor="clock_start">
                  {t("ChooseClockStart")}
                </label>
                <div className="control">
                  <input
                    className="input is-small"
                    type="number"
                    id="clock_start"
                    name="clock_start"
                    min={1}
                    step={1}
                    value={clockStart}
                    onChange={(e) => setClockStart(Math.round(e.target.value))}
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
                    type="number"
                    id="clock_inc"
                    name="clock_inc"
                    min={1}
                    step={1}
                    value={clockInc}
                    onChange={(e) => setClockInc(Math.round(e.target.value))}
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
                    type="number"
                    id="clock_start"
                    name="clock_max"
                    min={1}
                    step={1}
                    value={clockMax}
                    onChange={(e) => setClockMax(Math.round(e.target.value))}
                  />
                </div>
                <p className="help">{t("HelpClockMax")}</p>
              </div>
            </div>
          </div>
        )}
        {/* Pairing choices */}
        {metagame === null ? null : (
          <>
            <div className="content">
              <p>There are two pairing options:</p>
              <ol>
                <li>
                  Sort the players in whatever order you choose and then click
                  one of the automated buttons to quickly generate common
                  pairings.
                </li>
                <li>
                  Manually select players 1 and 2 and add each pair to the list.
                </li>
              </ol>
              <p>
                This framework gives the organizer maximum flexibility but also
                requires extra care and attention. The automated buttons are
                helpers only. Manual tweaking is often still necessary.
              </p>
            </div>
            <div className="columns is-multiline">
              {/* Automated first */}
              {divisions.map((div, idx) => {
                const onSortEnd = (oldIndex, newIndex) => {
                  div = arrayMove(div, oldIndex, newIndex);
                  const tmpDivisions = cloneDeep(divisions);
                  tmpDivisions[idx] = div;
                  setDivisions(tmpDivisions);
                };

                return (
                  <div className="column" key={`automated|${idx}`}>
                    <h3 className="subtitle lined">
                      <span>Automated (Division {idx + 1})</span>
                    </h3>
                    <SortableList
                      onSortEnd={onSortEnd}
                      className="sortableList"
                      draggedItemClassName="sortableItemDragged"
                    >
                      {div.map((item, i) => (
                        <SortableItem key={`sorted:${i}`}>
                          <div className="sortableItem">{item.name}</div>
                        </SortableItem>
                      ))}
                    </SortableList>
                    <div className="columns is-multiline">
                      <div className="column">
                        <div className="control">
                          <button
                            className="button is-small apButton"
                            onClick={() => pairBerger(div)}
                          >
                            Berger round robin
                          </button>
                        </div>
                      </div>
                      <div className="column">
                        <div className="control">
                          <button
                            className="button is-small apButton"
                            onClick={() => pairDutch(div)}
                          >
                            Dutch Swiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Now manual */}
              <div className="column">
                <h3 className="subtitle lined">
                  <span>Manual</span>
                </h3>
                <div className="field">
                  <label className="label" htmlFor="p1">
                    Player 1
                  </label>
                  <div className="control">
                    <div className="select">
                      <select
                        name="p1"
                        value={manualP1 || ""}
                        onChange={(e) => setManualP1(e.target.value)}
                      >
                        <option value=""></option>
                        {divisions
                          .flat()
                          .filter((u) => u.id !== manualP2)
                          .map((u, i) => (
                            <option value={u.id} key={`p1:${i}`}>
                              {u.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="field">
                  <label className="label" htmlFor="p2">
                    Player 1
                  </label>
                  <div className="control">
                    <div className="select">
                      <select
                        name="p2"
                        value={manualP2 || ""}
                        onChange={(e) => setManualP2(e.target.value)}
                      >
                        <option value=""></option>
                        {divisions
                          .flat()
                          .filter((u) => u.id !== manualP1)
                          .map((u, i) => (
                            <option value={u.id} key={`p2:${i}`}>
                              {u.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="control">
                  <button
                    className="button is-small apButton"
                    disabled={
                      manualP1 === null ||
                      manualP1 === "" ||
                      manualP2 === null ||
                      manualP2 === "" ||
                      manualP1 === manualP2
                    }
                    onClick={handleManualPairing}
                  >
                    Add pairing
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {pairs.length === 0 ? null : (
        <>
          <div className="content" style={{ marginTop: "1em" }}>
            <h3 className="subtitle lined">
              <span>Pairings</span>
            </h3>
            <p>
              Below are the pairings you requested. Please confirm that
              everything is correct and then click the Create Games button.
            </p>
          </div>
          <div className="container" style={{ marginTop: "1em" }}>
            <PairingTable
              pairs={pairs}
              delPairing={delPairing}
              swapPairing={swapPairing}
            />
          </div>
          {errors === null ? null : (
            <div className="content" style={{ marginTop: "1em", color: "red" }}>
              <p>The following errors were found:</p>
              <ul>
                {errors.map((e, i) => (
                  <li key={`err:${i}`}>
                    Index {e.idx}: {errorDesc.get(e.type)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="control" style={{ marginTop: "1em" }}>
            <button
              className="button is-small apButton"
              onClick={() =>
                errors === null
                  ? showModalConfirmSetter(true)
                  : showModalErrorsSetter(true)
              }
            >
              Create games
            </button>
          </div>
          {/* Modal: Errors exist */}
          <Modal
            show={showModalErrors}
            title={"Possible errors"}
            buttons={[
              {
                label: "Proceed anyway",
                action: () => {
                  showModalErrorsSetter(false);
                  showModalConfirmSetter(true);
                },
              },
              {
                label: t("Cancel"),
                action: () => showModalErrorsSetter(false),
              },
            ]}
          >
            <div className="content">
              <p>
                Your pairings contain potential errors. Please review the table
                and resolve any duplications. You should only proceed if you are
                certain your pairings are correct.
              </p>
            </div>
          </Modal>
          {/* Modal: Final confirmation */}
          <Modal
            show={showModalConfirm}
            title={"Confirm game creation"}
            buttons={[
              {
                label: "Create games",
                action: handleCreateGames,
              },
              {
                label: t("Cancel"),
                action: () => showModalConfirmSetter(false),
              },
            ]}
          >
            <div className="content">
              <p>
                You are about to create games, which will start immediately.{" "}
                <b>This cannot be undone!</b> Please review your pairings and be
                very certain they are correct before proceeding.
              </p>
            </div>
          </Modal>
        </>
      )}
    </>
  );
}

export default Pair;
