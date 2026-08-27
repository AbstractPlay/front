import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import DataTable, { STATS_TABLE_PROPS } from "../shared/DataTable";
import { useStore } from "../../stores";
import { formatUserDisplayName } from "../Bots/botUtils";
import {
  filterSoloSeedBoards,
  formatGradeLabel,
} from "../../lib/soloPlay";
import { formatVariantUids } from "../../lib/summaryGameKeys";

function SoloSeedLeaderboard({ metaFilter, nav }) {
  const summary = useStore((state) => state.summary);
  const globalMe = useStore((state) => state.globalMe);
  const userNames = useStore((state) => state.users);
  const { t } = useTranslation();
  const boards = useMemo(
    () => filterSoloSeedBoards(summary, metaFilter),
    [summary, metaFilter]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const board = boards[selectedIndex];

  const rows = useMemo(() => {
    if (!board) {
      return [];
    }
    return board.rows.map((row) => ({
      ...row,
      displayName: formatUserDisplayName(
        userNames.find((u) => u.id === row.userid) ?? {
          id: row.userid,
          name: row.name,
        },
        userNames
      ),
    }));
  }, [board, userNames]);

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("displayName", {
        header: t("tables.player"),
        cell: (props) => {
          const userid = props.row.original.userid;
          const name = props.getValue();
          return globalMe?.id === userid ? (
            <Link to={`/player/${userid}`}>
              <span className="bolder highlight">{name}</span>
            </Link>
          ) : (
            <Link to={`/player/${userid}`}>{name}</Link>
          );
        },
      }),
      columnHelper.accessor("score", { header: t("solo.leaderboard.score") }),
      columnHelper.accessor("grade", {
        header: t("solo.leaderboard.grade"),
        cell: (props) => formatGradeLabel(props.getValue(), t),
      }),
      columnHelper.accessor("attempts", {
        header: t("solo.leaderboard.attempts"),
      }),
      columnHelper.accessor("dateEnd", {
        header: t("solo.leaderboard.date"),
        cell: (props) => new Date(props.getValue()).toLocaleDateString(),
      }),
    ],
    [columnHelper, globalMe?.id, t]
  );

  if (boards.length === 0) {
    return <p>{t("solo.leaderboard.empty")}</p>;
  }

  const variantLabel = board
    ? formatVariantUids(board.metaUid, board.variants, t)
    : "";

  return (
    <div>
      <div className="field">
        <label className="label" htmlFor="solo-seed-select">
          {t("solo.leaderboard.seedSelect")}
        </label>
        <div className="control">
          <div className="select is-fullwidth">
            <select
              id="solo-seed-select"
              value={selectedIndex}
              onChange={(event) => setSelectedIndex(Number(event.target.value))}
            >
              {boards.map((entry, index) => (
                <option key={`${entry.challengeSeed}-${index}`} value={index}>
                  {entry.challengeSeed}
                  {entry.variants?.length ? ` (${entry.variants.join("|")})` : ""}
                  {" — "}
                  {t("solo.leaderboard.poolSummary", {
                    players: entry.uniquePlayers,
                    attempts: entry.attempts,
                  })}
                </option>
              ))}
            </select>
          </div>
        </div>
        {board ? (
          <p className="help">
            {t("solo.leaderboard.boardHelp", {
              variant: variantLabel,
              direction:
                board.scoreDirection === "lower"
                  ? t("solo.outcome.lowerIsBetter")
                  : t("solo.outcome.higherIsBetter"),
            })}
          </p>
        ) : null}
      </div>
      <DataTable
        {...STATS_TABLE_PROPS}
        nav={nav}
        data={rows}
        columns={columns}
        sort={[{ id: "score", desc: board?.scoreDirection !== "lower" }]}
      />
    </div>
  );
}

export default SoloSeedLeaderboard;
