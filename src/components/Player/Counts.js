import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import { AllRecsContext, ProfileContext, SummaryContext } from "../Player";
import { MeContext } from "../../pages/Skeleton";
import { gameinfo } from "@abstractplay/gameslib";
import TableSkeleton from "./TableSkeleton";
import NewChallengeModal from "../NewChallengeModal";

function Counts({ handleChallenge }) {
  const [user] = useContext(ProfileContext);
  const [summary] = useContext(SummaryContext);
  const [allRecs] = useContext(AllRecsContext);
  const [counts, countsSetter] = useState([]);
  const [globalMe] = useContext(MeContext);
  const [activeChallengeModal, activeChallengeModalSetter] = useState("");
  const [hIndex, hIndexSetter] = useState(null);

  const openChallengeModal = (name) => {
    activeChallengeModalSetter(name);
  };
  const closeChallengeModal = () => {
    activeChallengeModalSetter("");
  };

  useEffect(() => {
    if (summary !== null && user !== null) {
      const rec = summary.players.h.find((r) => r.user === user.id);
      if (rec !== undefined) {
        hIndexSetter(rec.value);
      } else {
        hIndexSetter(null);
      }
    } else {
      hIndexSetter(null);
    }
  }, [summary, user]);

  useEffect(() => {
    if (allRecs !== null) {
      const countMap = new Map();
      for (const rec of allRecs) {
        const name = rec.header.game.name;
        if (countMap.has(name)) {
          const num = countMap.get(name);
          countMap.set(name, num + 1);
        } else {
          countMap.set(name, 1);
        }
      }
      const lst = [];
      for (const name of countMap.keys()) {
        const inforec = [...gameinfo.values()].find((r) =>
          name.startsWith(r.name)
        );
        const meta = inforec.uid;
        lst.push({ meta, name, count: countMap.get(name) });
      }
      countsSetter(lst);
    } else {
      countsSetter([]);
    }
  }, [allRecs]);

  const data = useMemo(
    () =>
      counts
        .map(({ meta, name, count }) => {
          return {
            id: meta,
            name,
            count,
          };
        })
        .sort((a, b) => b.count - a.count),
    [counts]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Game",
        cell: (props) => <Link to={`/games/${props.row.original.id}`}>{props.getValue()}</Link>,
      }),
      columnHelper.accessor("count", {
        header: "Play count",
      }),
      columnHelper.display({
        id: "challenge",
        cell: (props) =>
          globalMe === null ||
          globalMe.id === user.id ||
          props.row.original.id === undefined ? null : (
            <>
              <NewChallengeModal
                show={
                  activeChallengeModal !== "" &&
                  activeChallengeModal === props.row.original.id
                }
                handleClose={closeChallengeModal}
                handleChallenge={handleChallenge}
                fixedMetaGame={props.row.original.id}
                opponent={{
                  id: user.id,
                  name: user.name,
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
    [columnHelper, globalMe, user, activeChallengeModal, handleChallenge]
  );

  return (
    <>
      {hIndex === null ? null : (
        <div className="content">
          <p>This player's h-index is {hIndex}</p>
        </div>
      )}
      <TableSkeleton
        data={data}
        columns={columns}
        sort={[{ id: "count", desc: true }]}
      />
    </>
  );
}

export default Counts;
