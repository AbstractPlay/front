import React, { useContext, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { ProfileContext } from "../Player";
import { MeContext } from "../../pages/Skeleton";
import { gameinfo } from "@abstractplay/gameslib";
import TableSkeleton from "./TableSkeleton";
import NewChallengeModal from "../NewChallengeModal";
import { Link } from "react-router-dom";

function Coded({ handleChallenge }) {
  const [user] = useContext(ProfileContext);
  const [globalMe] = useContext(MeContext);
  const [activeChallengeModal, activeChallengeModalSetter] = useState("");

  const openChallengeModal = (name) => {
    activeChallengeModalSetter(name);
  };
  const closeChallengeModal = () => {
    activeChallengeModalSetter("");
  };

  const data = useMemo(
    () =>
      [...gameinfo.entries()]
        .filter(
          ([, entry]) =>
            entry.people !== undefined &&
            entry.people.filter((p) => p.type === "coder" && p.apid === user.id)
              .length > 0
        )
        .map(([meta, info]) => {
          const ret = {
            id: meta,
            name: info.name,
          };
          return ret;
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [user]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Game",
        cell: (props) => (
          <Link to={`/games/${props.row.original.id}`}>{props.getValue()}</Link>
        ),
      }),
      columnHelper.display({
        id: "challenge",
        cell: (props) =>
          globalMe === null || globalMe.id === user.id ? null : (
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

  if (data.length === 0) {
    return (
      <div className="content">
        <p>None</p>
      </div>
    );
  } else {
    return (
      <>
        <TableSkeleton
          data={data}
          columns={columns}
          sort={[{ id: "name", desc: false }]}
          key="Player|Coded"
        />
      </>
    );
  }
}

export default Coded;
