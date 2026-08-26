import React, { useCallback, useContext, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { ProfileContext } from "../Player";
import { gameinfo } from "@abstractplay/gameslib";
import { getGameDisplayName } from "../../lib/gameOptions";
import DataTable, { PROFILE_TABLE_PROPS } from "../shared/DataTable";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import NewChallengeModal from "../NewChallengeModal";
import { useStore } from "../../stores";

function Stars({ handleChallenge }) {
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
      !("stars" in user) || user.stars === undefined || user.stars === null
        ? []
        : user.stars
            .map((meta) => {
              const ret = {
                id: meta,
                name: getGameDisplayName(meta, "Unknown"),
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
          globalMe === null ||
          globalMe.id === user.id ||
          !gameinfo.has(props.row.original.id) ? null : (
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
                {t("IssueChallengeLabel")}
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
    return null;
  }

  return (
    <DataTable
      {...PROFILE_TABLE_PROPS}
      data={data}
      columns={columns}
      sort={[{ id: "name", desc: false }]}
      key="Player|Stars"
    />
  );
}

export default Stars;
