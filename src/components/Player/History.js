import React, { useCallback, useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { gameinfo } from "@abstractplay/gameslib";
import { createColumnHelper } from "@tanstack/react-table";
import { AllRecsContext, ProfileContext } from "../Player";
import DataTable, { PROFILE_FILTER_TABLE_PROPS } from "../shared/DataTable";
import NewChallengeModal from "../NewChallengeModal";
import ActivityMarker from "../ActivityMarker";
import { useStore } from "../../stores";
import BotAwareName from "../Bots/BotAwareName";
import { useTranslation } from "react-i18next";
import { isHighlighted, toggleHighlight } from "../../lib/playerGameMarks";
import { toast } from "react-toastify";

function History({ handleChallenge }) {
  const [user] = useContext(ProfileContext);
  const [allRecs] = useContext(AllRecsContext);
  const allUsers = useStore((state) => state.users);
  const globalMe = useStore((state) => state.globalMe);
  const [activeChallengeModal, activeChallengeModalSetter] = useState("");
  const { t, i18n } = useTranslation();

  const formatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { dateStyle: "long" }),
    [i18n.language]
  );

  const openChallengeModal = (name) => {
    activeChallengeModalSetter(name);
  };
  const closeChallengeModal = useCallback(() => {
    activeChallengeModalSetter("");
  }, []);

  const isOwnProfile = globalMe?.id === user?.id;

  const handleHighlightToggle = useCallback(
    async (meta, gameId, row) => {
      const highlighted = isHighlighted(globalMe, gameId);
      const gameSummary = highlighted
        ? null
        : {
            id: gameId,
            metaGame: meta,
            players: row.opponents.concat(
              globalMe ? [{ id: globalMe.id, name: globalMe.name }] : []
            ),
            toMove: "",
            gameEnded: row.dateEnd,
          };
      const res = await toggleHighlight({
        metaGame: meta,
        id: gameId,
        gameSummary,
        highlighted,
      });
      if (res.cancelled) return;
      if (!res.ok) {
        toast.error(res.error || t("Error"));
      }
    },
    [globalMe, t]
  );

  const data = useMemo(
    () =>
      allRecs
        .map((rec) => {
          const gameName = rec.header.game.name;
          let id = rec.header.site.gameid;
          let meta = undefined;
          if (id.includes("#")) {
            [meta, id] = id.split("#");
          }
          if (meta === undefined) {
            meta = [...gameinfo.entries()].find(
              ([, info]) => info.name === gameName
            )[0];
          }
          let winner = undefined;
          const sortedResults = rec.header.players.sort(
            (a, b) => b.result - a.result
          );
          if (sortedResults[0].result !== sortedResults[1].result) {
            let name = "UNKNOWN";
            const found = allUsers?.find(
              (u) => u.id === sortedResults[0].userid
            );
            if (found !== undefined) {
              name = found.name;
            }
            winner = {
              id: sortedResults[0].userid,
              name,
              lastSeen: found.lastSeen || 0,
            };
          }
          const opponents = rec.header.players
            .map((r) => {
              return {
                id: r.userid,
                name: allUsers?.find((u) => u.id === r.userid)?.name,
                lastSeen: allUsers?.find((u) => u.id === r.userid)?.lastSeen,
              };
            })
            .filter(
              (r) =>
                globalMe === undefined ||
                globalMe === null ||
                user === null ||
                (user.id === globalMe.id ? r.id !== globalMe.id : true)
            );
          let variants = [];
          if (
            rec.header.game.variants !== undefined &&
            rec.header.game.variants !== null &&
            rec.header.game.variants.length > 0
          ) {
            variants = [...rec.header.game.variants];
          }
          return {
            id,
            meta,
            gameName,
            variants: variants.sort((a, b) => a.localeCompare(b)),
            opponents,
            winner,
            dateEnd: new Date(rec.header["date-end"]).getTime(),
          };
        })
        .sort((a, b) => b.dateEnd - a.dateEnd),
    [allRecs, globalMe, allUsers, user]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () =>
      allUsers === null
        ? []
        : [
            columnHelper.accessor("id", {
              header: t("tables.game"),
              cell: (props) => (
                <>
                  <Link
                    to={`/move/${
                      props.row.original.meta
                    }/1/${props.getValue()}`}
                  >
                    {props.row.original.gameName}
                  </Link>
                </>
              ),
              sortingFn: (rowA, rowB, columnID) => {
                return rowA.original.gameName.localeCompare(
                  rowB.original.gameName
                );
              },
              filterFn: (row, colId, val) => {
                return row.original.gameName.includes(val);
              },
            }),
            columnHelper.accessor("variants", {
              header: t("tables.variants"),
              cell: (props) => props.getValue().join(", "),
              sortingFn: (rowA, rowB, columnID) => {
                return rowA
                  .getValue(columnID)
                  .join(", ")
                  .localeCompare(rowB.getValue(columnID).join(", "));
              },
              filterFn: (row, colId, val) => {
                return row.getValue(colId).join(",").includes(val);
              },
            }),
            columnHelper.accessor("dateEnd", {
              header: t("tables.endDate"),
              cell: (props) => formatter.format(props.getValue()),
              enableGlobalFilter: false,
            }),
            columnHelper.accessor("opponents", {
              header: t("tables.opponents"),
              cell: (props) =>
                props
                  .getValue()
                  .map((u) => (
                    <>
                      <BotAwareName
                        id={u.id}
                        name={u.name}
                        users={allUsers}
                        link
                      />
                      &nbsp;
                      <ActivityMarker lastSeen={u.lastSeen} size="s" />
                    </>
                  ))
                  .reduce(
                    (acc, x) =>
                      acc === null ? (
                        x
                      ) : (
                        <>
                          {acc}, {x}
                        </>
                      ),
                    null
                  ),
              sortingFn: (rowA, rowB, columnID) => {
                return rowA
                  .getValue(columnID)[0]
                  .name.localeCompare(rowB.getValue(columnID)[0].name);
              },
              filterFn: (row, colId, val) => {
                return row
                  .getValue(colId)
                  .map((u) => u.name)
                  .join(",")
                  .includes(val);
              },
            }),
            columnHelper.accessor("winner", {
              header: t("tables.winner"),
              cell: (props) =>
                props.getValue() === undefined ? (
                  <p>{t("Draw")}</p>
                ) : globalMe === null ||
                  globalMe === undefined ||
                  props.getValue().id !== globalMe.id ? (
                  <>
                    <BotAwareName
                      id={props.getValue().id}
                      name={props.getValue().name}
                      users={allUsers}
                      link
                    />
                    &nbsp;
                    <ActivityMarker
                      lastSeen={props.getValue().lastSeen}
                      size="s"
                    />
                  </>
                ) : (
                  <p>{t("You")}</p>
                ),
              sortingFn: (rowA, rowB, columnID) => {
                const valA = rowA.getValue(columnID);
                const valB = rowB.getValue(columnID);
                let nameA = "__";
                if (valA !== undefined) {
                  if (valA.id === globalMe.id) {
                    nameA = "_";
                  } else {
                    nameA = valA.name;
                  }
                }
                let nameB = "__";
                if (valB !== undefined) {
                  if (valB.id === globalMe.id) {
                    nameB = "_";
                  } else {
                    nameB = valB.name;
                  }
                }
                return nameA.localeCompare(nameB);
              },
              filterFn: (row, colId, val) => {
                return row.getValue(colId).name.includes(val);
              },
            }),
            columnHelper.display({
              id: "highlight",
              cell: (props) =>
                !isOwnProfile ||
                props.row.original.meta === undefined ? null : (
                  <button
                    className="button is-small apButtonNeutral"
                    onClick={() =>
                      handleHighlightToggle(
                        props.row.original.meta,
                        props.row.original.id,
                        props.row.original
                      )
                    }
                    title={
                      isHighlighted(globalMe, props.row.original.id)
                        ? t("gameMarks.unhighlight")
                        : t("gameMarks.highlight")
                    }
                  >
                    <span className="icon is-small">
                      {isHighlighted(globalMe, props.row.original.id) ? (
                        <span className="highlight">
                          <i className="fa fa-bookmark"></i>
                        </span>
                      ) : (
                        <i className="fa fa-bookmark-o"></i>
                      )}
                    </span>
                  </button>
                ),
            }),
            columnHelper.display({
              id: "challenge",
              cell: (props) =>
                globalMe === null ||
                props.row.original.meta === undefined ||
                globalMe.id !== user.id ||
                props.row.original.opponents.length !== 1 ? null : (
                  <>
                    <NewChallengeModal
                      show={
                        activeChallengeModal !== "" &&
                        activeChallengeModal === props.row.original.id
                      }
                      handleClose={closeChallengeModal}
                      handleChallenge={handleChallenge}
                      fixedMetaGame={props.row.original.meta}
                      opponent={{
                        id: props.row.original.opponents[0].id,
                        name: props.row.original.opponents[0].name,
                      }}
                    />
                    <button
                      className="button is-small apButton"
                      onClick={() => openChallengeModal(props.row.original.id)}
                    >
                      Rematch
                    </button>
                  </>
                ),
            }),
          ],
    [
      columnHelper,
      globalMe,
      activeChallengeModal,
      handleChallenge,
      allUsers,
      user,
      closeChallengeModal,
      t,
      formatter,
      isOwnProfile,
      handleHighlightToggle,
    ]
  );

  const globalFilterFn = (row, colId, val) => {
    const realVal = val.toLowerCase();
    let winner = row.original.winner;
    if (winner === undefined) {
      winner = "draw";
    } else {
      if (
        globalMe === null ||
        globalMe === undefined ||
        winner.id !== globalMe.id
      ) {
        winner = winner.name.toLowerCase();
      } else {
        winner = winner.name.toLowerCase() + ",you";
      }
    }
    // game name
    if (row.original.gameName.toLowerCase().includes(realVal)) {
      return true;
    }
    // variants
    else if (row.original.variants.join(",").toLowerCase().includes(realVal)) {
      return true;
    }
    // opponents
    else if (
      row.original.opponents
        .map((u) => u.name.toLowerCase())
        .join(",")
        .includes(realVal)
    ) {
      return true;
    }
    // winner
    else if (winner.includes(realVal)) {
      return true;
    }
    return false;
  };

  if (!Array.isArray(allRecs) || allRecs.length === 0) {
    return null;
  }

  return (
    <>
      <DataTable
        {...PROFILE_FILTER_TABLE_PROPS}
        filterFieldId="filterInput"
        data={data}
        columns={columns}
        globalFilterFn={globalFilterFn}
        sort={[{ id: "dateEnd", desc: true }]}
        key="Player|History"
      />
    </>
  );
}

export default History;
