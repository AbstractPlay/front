import React, { useCallback, useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { gameinfo } from "@abstractplay/gameslib";
import { createColumnHelper } from "@tanstack/react-table";
import { AllRecsContext, ProfileContext } from "../Player";
// import TableSkeleton from "./TableSkeleton";
import TableSkeletonFilter from "./TableSkeletonFilter";
import NewChallengeModal from "../NewChallengeModal";
import ActivityMarker from "../ActivityMarker";
import { useStore } from "../../stores";

const formatter = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

function History({ handleChallenge }) {
  const [user] = useContext(ProfileContext);
  const [allRecs] = useContext(AllRecsContext);
  const allUsers = useStore((state) => state.users);
  const globalMe = useStore((state) => state.globalMe);
  const [activeChallengeModal, activeChallengeModalSetter] = useState("");

  const openChallengeModal = (name) => {
    activeChallengeModalSetter(name);
  };
  const closeChallengeModal = useCallback(() => {
    activeChallengeModalSetter("");
  }, []);

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
            const found = allUsers.find(
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
                name: allUsers.find((u) => u.id === r.userid)?.name,
                lastSeen: allUsers.find((u) => u.id === r.userid)?.lastSeen,
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
              header: "Game",
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
              header: "Variants",
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
              header: "End date",
              cell: (props) => formatter.format(props.getValue()),
              enableGlobalFilter: false,
            }),
            columnHelper.accessor("opponents", {
              header: "Opponents",
              cell: (props) =>
                props
                  .getValue()
                  .map((u) => (
                    <>
                      <Link to={`/player/${u.id}`}>{u.name}</Link>
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
              header: "Winner",
              cell: (props) =>
                props.getValue() === undefined ? (
                  <p>Draw</p>
                ) : globalMe === null ||
                  globalMe === undefined ||
                  props.getValue().id !== globalMe.id ? (
                  <>
                    <Link to={`/player/${props.getValue().id}`}>
                      {props.getValue().name}
                    </Link>
                    &nbsp;
                    <ActivityMarker
                      lastSeen={props.getValue().lastSeen}
                      size="s"
                    />
                  </>
                ) : (
                  <p>You</p>
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

  return (
    <>
      <TableSkeletonFilter
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
