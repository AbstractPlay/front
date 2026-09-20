import React, { useCallback, useContext, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { ProfileContext } from "../Player";
import { gameinfo } from "@abstractplay/gameslib";
import { getGameDisplayName } from "../../lib/gameOptions";
import { compareStrings } from "../../lib/compareStrings";
import DataTable, { PROFILE_TABLE_PROPS } from "../shared/DataTable";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ChallengeEntryModals from "../ChallengeEntryModals";
import { useStore } from "../../stores";

const columnHelper = createColumnHelper();

function Stars({ handleChallenge }) {
  const [user] = useContext(ProfileContext);
  const globalMe = useStore((state) => state.globalMe);
  const [activeChallengeModal, activeChallengeModalSetter] = useState("");
  const { t, i18n } = useTranslation();

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
            .sort((a, b) => compareStrings(a.name, b.name, i18n.language)),
    [user, i18n.language]
  );

  const activeOpponent = useMemo(() => {
    if (!activeChallengeModal) {
      return undefined;
    }
    return { id: user.id, name: user.name };
  }, [activeChallengeModal, user.id, user.name]);

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
            <button
              className="button is-small apButton"
              onClick={() => openChallengeModal(props.row.original.id)}
            >
              {t("IssueChallengeLabel")}
            </button>
          ),
      }),
    ],
    [globalMe, user, t]
  );

  if (data.length === 0) {
    return null;
  }

  return (
    <>
      <DataTable
        {...PROFILE_TABLE_PROPS}
        data={data}
        columns={columns}
        sort={[{ id: "name", desc: false }]}
        key="Player|Stars"
      />
      {globalMe !== null && globalMe.id !== user.id && (
        <ChallengeEntryModals
          show={activeChallengeModal !== ""}
          handleClose={closeChallengeModal}
          handleChallenge={handleChallenge}
          fixedMetaGame={activeChallengeModal || undefined}
          opponent={activeOpponent}
        />
      )}
    </>
  );
}

export default Stars;
