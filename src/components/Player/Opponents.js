import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import { AllRecsContext, ProfileContext } from "../Player";
import { MeContext, UsersContext } from "../../pages/Skeleton";
import TableSkeleton from "./TableSkeleton";
import NewChallengeModal from "../NewChallengeModal";
import ActivityMarker from "../ActivityMarker";

function Opponents({handleChallenge}) {
  const [user,] = useContext(ProfileContext);
  const [allRecs,] = useContext(AllRecsContext);
  const [allUsers,] = useContext(UsersContext);
  const [counts, countsSetter] = useState([]);
  const [globalMe,] = useContext(MeContext);
  const [activeChallengeModal, activeChallengeModalSetter] = useState("");
  const [hIndex, hIndexSetter] = useState(null);

  const openChallengeModal = (name) => {
    activeChallengeModalSetter(name);
  };
  const closeChallengeModal = () => {
    activeChallengeModalSetter("");
  };

  useEffect(() => {
    if ( (allRecs !== null) && (allRecs.length > 0) ) {
        const countMap = new Map();
        for (const rec of allRecs) {
            const myResult = rec.header.players.find(p => p.userid === user.id)?.result;
            if (myResult !== undefined) {
                for (const player of rec.header.players) {
                    if (player.userid === user.id) {
                        continue;
                    }
                    let rec = {id: player.userid, n: 1, wins: 0, draws: 0};
                    if (countMap.has(player.userid)) {
                        rec = countMap.get(player.userid);
                        rec.n++;
                    }
                    if (myResult > player.result) {
                        rec.wins++;
                    } else if (myResult === player.result) {
                        rec.draws++;
                    }
                    countMap.set(player.userid, {...rec});
                }
            }
        }
        // calc h-index
        const sorted = [...countMap.values()].map(v => v.n).sort((a, b) => b - a);
        for (let i = 0; i < sorted.length; i++) {
            if (sorted[i] < i + 1) {
                hIndexSetter(i);
                break;
            }
        }
        const lst = [];
        for (const [id, rec] of countMap.entries()) {
            const losses = rec.n - (rec.wins + rec.draws);
            const winrate = Math.round(((rec.wins + (rec.draws / 2)) / rec.n) * 1000) / 10;
            lst.push({id, count: rec.n, winrate, wld: [rec.wins, losses, rec.draws]});
        }
        countsSetter(lst);
    } else {
        countsSetter([]);
    }
  }, [allRecs, user]);

  const data = useMemo(
    () =>
        counts
        .map(({id, count, winrate, wld}) => {
          return {
            id,
            count,
            winrate,
            wld,
          };
        })
        .sort((a, b) => b.count - a.count),
    [counts]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => allUsers === null ? [] : [
      columnHelper.accessor("id", {
        header: "Player",
        cell: (props) => (
            <>
                <Link to={`/player/${props.getValue()}`}>{allUsers.find(u => u.id === props.getValue())?.name}</Link>
                &nbsp;
                <ActivityMarker lastSeen={allUsers.find(u => u.id === props.getValue())?.lastSeen} size="s" />
            </>
        ),
        sortingFn: (rowA, rowB, columnID) => {
            const nameA = allUsers.find(u => u.id === rowA.getValue(columnID)).name;
            const nameB = allUsers.find(u => u.id === rowB.getValue(columnID)).name;
            return nameA.localeCompare(nameB);
        },
      }),
      columnHelper.accessor("count", {
        header: "Play count",
      }),
      columnHelper.accessor("winrate", {
        header: "Win/Loss/Draw",
        cell: (props) => `${props.getValue()}% (${props.row.original.wld.join("/")})`,
      }),
      columnHelper.display({
        id: "challenge",
        cell: (props) =>
          (globalMe === null || props.row.original.id === undefined) ? null : (
            <>
            <NewChallengeModal
              show={
                activeChallengeModal !== "" &&
                activeChallengeModal === props.row.original.id
              }
              handleClose={closeChallengeModal}
              handleChallenge={handleChallenge}
              opponent={{
                id: props.row.original.id,
                name: allUsers.find(u => u.id === props.row.original.id).name,
              }}
            />
            <button
              className="button is-small apButton"
              onClick={() => openChallengeModal(props.row.original.id)}
            >
              Issue Challenge
            </button>
            </>
          ),
      }),
    ],
    [columnHelper, globalMe, activeChallengeModal, handleChallenge, allUsers]
  );

    return (
        <>
            {hIndex === null ? null :
                <div className="content">
                    <p>This player's "opponents" h-index is {hIndex}</p>
                </div>
            }
            <TableSkeleton
                data={data}
                columns={columns}
                sort={[{ id: "count", desc: true }]}
            />
        </>
    );
}

export default Opponents;
