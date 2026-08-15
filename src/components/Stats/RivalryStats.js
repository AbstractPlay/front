import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable, { STATS_TABLE_PROPS } from "../shared/DataTable";
import { useStore } from "../../stores";
import { formatUserDisplayName } from "../Bots/botUtils";
import { useTranslation } from "react-i18next";
import { callAuthApi } from "../../lib/api";

function RivalryStats({ nav }) {
  const summary = useStore((state) => state.summary);
  const globalMe = useStore((state) => state.globalMe);
  const userNames = useStore((state) => state.users);
  const [publicRivalriesSaving, publicRivalriesSavingSetter] = useState(false);
  const { t } = useTranslation();

  const rivalryData = useMemo(
    () =>
      (summary.rivalries ?? []).map(({ rank, label, n, players }) => ({
        id: String(rank),
        rank,
        label,
        n,
        players,
      })),
    [summary]
  );

  const handlePublicRivalriesChange = async (e) => {
    if (globalMe === null || publicRivalriesSaving) {
      return;
    }
    const state = e.target.checked;
    publicRivalriesSavingSetter(true);
    try {
      const res = await callAuthApi("set_public_rivalries", { state });
      if (!res?.ok) {
        throw new Error(`set_public_rivalries failed with status ${res?.status}`);
      }
      const { setGlobalMe } = useStore.getState();
      setGlobalMe((prev) => ({ ...prev, publicRivalries: state }));
    } catch (err) {
      console.error("Failed to save public rivalries preference", err);
    } finally {
      publicRivalriesSavingSetter(false);
    }
  };

  const columnHelper = createColumnHelper();
  const rivalryColumns = useMemo(
    () => [
      columnHelper.accessor("rank", {
        header: t("tables.rank"),
      }),
      columnHelper.accessor("label", {
        header: t("tables.rivalryPair"),
        cell: (props) => {
          const players = props.row.original.players;
          if (players?.length === 2) {
            return players.map((player, index) => {
              const displayName = formatUserDisplayName(
                userNames.find((u) => u.id === player.id) ?? player,
                userNames
              );
              const link =
                globalMe !== null && globalMe.id === player.id ? (
                  <Link to={`/player/${player.id}`}>
                    <span className="bolder highlight">{displayName}</span>
                  </Link>
                ) : (
                  <Link to={`/player/${player.id}`}>{displayName}</Link>
                );
              return (
                <span key={player.id}>
                  {index > 0 ? " vs " : null}
                  {link}
                </span>
              );
            });
          }
          return props.getValue();
        },
      }),
      columnHelper.accessor("n", {
        header: t("tables.gamesTogether"),
      }),
    ],
    [columnHelper, globalMe, userNames, t]
  );

  if (globalMe === null && rivalryData.length === 0) {
    return null;
  }

  return (
    <>
      {globalMe !== null ? (
        <div className="content">
          <div className="field">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={globalMe.publicRivalries === true}
                disabled={publicRivalriesSaving}
                onChange={handlePublicRivalriesChange}
              />
              {t("stats.playerStats.publicRivalriesOptIn")}
            </label>
          </div>
        </div>
      ) : null}
      {rivalryData.length > 0 ? (
        <DataTable
          {...STATS_TABLE_PROPS}
          nav={nav}
          data={rivalryData}
          columns={rivalryColumns}
          sort={[{ id: "rank", desc: false }]}
        />
      ) : null}
    </>
  );
}

export default RivalryStats;
