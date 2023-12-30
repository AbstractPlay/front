import React, { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { gameinfo } from "@abstractplay/gameslib";
import { createColumnHelper } from "@tanstack/react-table";
import { AllRecsContext, ProfileContext } from "../Player";
import { MeContext, UsersContext } from "../../pages/Skeleton";
import TableSkeleton from "./TableSkeleton";
import NewChallengeModal from "../NewChallengeModal";
import ActivityMarker from "../ActivityMarker";

const formatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' });

function History({handleChallenge}) {
  const [user,] = useContext(ProfileContext);
  const [allRecs,] = useContext(AllRecsContext);
  const [allUsers,] = useContext(UsersContext);
  const [globalMe,] = useContext(MeContext);
  const [activeChallengeModal, activeChallengeModalSetter] = useState("");

  const openChallengeModal = (name) => {
    activeChallengeModalSetter(name);
  };
  const closeChallengeModal = () => {
    activeChallengeModalSetter("");
  };

  const data = useMemo(
    () =>
        allRecs
        .map((rec) => {
            const gameName = rec.header.game.name;
            const meta = [...gameinfo.entries()].find(([,info]) => info.name.startsWith(gameName))[0];
            let winner = undefined;
            const sortedResults = rec.header.players.sort((a, b) => b.result - a.result);
            if (sortedResults[0].result !== sortedResults[1].result) {
                let name = "UNKNOWN";
                const found = allUsers.find(u => u.id === sortedResults[0].userid);
                if (found !== undefined) {
                    name = found.name;
                }
                winner = {id: sortedResults[0].userid, name, lastSeen: found.lastSeen};
            }
            const opponents = rec.header.players.map(r => { return {id: r.userid, name: allUsers.find(u => u.id === r.userid)?.name, lastSeen: allUsers.find(u => u.id === r.userid)?.lastSeen}}).filter(r => ( (globalMe === undefined) || (globalMe === null) || (r.id !== globalMe.id)));
            let variants = [];
            if ( (rec.header.game.variants !== undefined) && (rec.header.game.variants !== null) && (rec.header.game.variants.length > 0) ) {
                variants = [...rec.header.game.variants];
            }
          return {
            id: rec.header.site.gameid,
            meta,
            gameName,
            variants: variants.sort((a, b) => a.localeCompare(b)),
            opponents,
            winner,
            dateEnd: (new Date(rec.header["date-end"])).getTime(),
          };
        })
        .sort((a, b) => b.dateEnd - a.dateEnd),
    [allRecs, globalMe, allUsers]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => allUsers === null ? [] : [
      columnHelper.accessor("id", {
        header: "Game",
        cell: (props) => (
            <>
                <Link to={`/move/${props.row.original.meta}/1/${props.getValue()}`}>{props.row.original.gameName}</Link>
            </>
        ),
        sortingFn: (rowA, rowB, columnID) => {
            return rowA.getValue("gameName").localeCompare(rowB.getValue("gameName"));
        },
      }),
      columnHelper.accessor("variants", {
        header: "Variants",
        cell: (props) => props.getValue().join(", "),
        sortingFn: (rowA, rowB, columnID) => {
            return rowA.getValue(columnID).join(", ").localeCompare(rowB.getValue(columnID).join(", "));
        },
      }),
      columnHelper.accessor("dateEnd", {
        header: "End date",
        cell: (props) => formatter.format(props.getValue()),
      }),
      columnHelper.accessor("opponents", {
        header: "Opponents",
        cell: (props) => props.getValue().map(u => (
                <>
                    <Link to={`/player/${u.id}`}>{u.name}</Link>
                    &nbsp;
                    <ActivityMarker lastSeen={u.lastSeen} size="s" />
                </>
            )).reduce((acc, x) => acc === null ? x : <>{acc}, {x}</>, null),
      }),
      columnHelper.accessor("winner", {
        header: "Winner",
        cell: (props) => props.getValue() === undefined ?
            (<p>Draw</p>) :
            (globalMe === null || globalMe === undefined || props.getValue().id !== globalMe.id) ? (
                <>
                    <Link to={`/player/${props.getValue().id}`}>{props.getValue().name}</Link>
                    &nbsp;
                    <ActivityMarker lastSeen={props.getValue().lastSeen} size="s" />
                </>
            ) : (
                <p>You</p>
            ),
        sortingFn: (rowA, rowB, columnID) => {
            const valA = rowA.getValue(columnID)
            const valB = rowB.getValue(columnID)
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
      }),
      columnHelper.display({
        id: "challenge",
        cell: (props) =>
          (globalMe === null || props.row.original.meta === undefined || globalMe.id !== user.id || props.row.original.opponents.length !== 1) ? null : (
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
    [columnHelper, globalMe, activeChallengeModal, handleChallenge, allUsers, user]
  );

    return (
        <>
            <TableSkeleton
                data={data}
                columns={columns}
                sort={[{ id: "dateEnd", desc: true }]}
            />
        </>
    );
}

export default History;
