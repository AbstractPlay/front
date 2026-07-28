import React, { useCallback, useContext, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { ProfileContext } from "../Player";
import { gameinfo } from "@abstractplay/gameslib";
import TableSkeleton from "./TableSkeleton";
import NewChallengeModal from "../NewChallengeModal";
import { Link } from "react-router-dom";
import { useStore } from "../../stores";
import { useTranslation } from "react-i18next";

function Designed({ handleChallenge }) {
  const [user] = useContext(ProfileContext);
  const globalMe = useStore((state) => state.globalMe);
  const [activeChallengeModal, activeChallengeModalSetter] = useState("");
  const { t } = useTranslation();

  const openChallengeModal = (name) => {
    activeChallengeModalSetter(name);
  };
  const closeChallengeModal = useCallback(() => {
    activeChallengeModalSetter("");
  }, []);

  const data = useMemo(
    () =>
      [...gameinfo.entries()]
        .filter(
          ([, entry]) =>
            entry.people !== undefined &&
            entry.people.filter(
              (p) => p.type === "designer" && p.apid === user.id
            ).length > 0 &&
            !entry.flags.includes("experimental")
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
        header: t("tables.game"),
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
    [
      columnHelper,
      globalMe,
      user,
      activeChallengeModal,
      handleChallenge,
      closeChallengeModal,
      t,
    ]
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
          key="Player|Designed"
        />
      </>
    );
  }
}

export default Designed;
