import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable, { STATS_TABLE_PROPS } from "../shared/DataTable";
import HistogramSparkline from "./shared/HistogramSparkline";
import { useStore } from "../../stores";
import { formatUserDisplayName } from "../Bots/botUtils";
import { useTranslation } from "react-i18next";
import { callAuthApi } from "../../lib/api";

function PlayerStats({ nav }) {
  const summary = useStore((state) => state.summary);
  const globalMe = useStore((state) => state.globalMe);
  const userNames = useStore((state) => state.users);
  const [activeChartModal, activeChartModalSetter] = useState("");
  const [publicRivalriesSaving, publicRivalriesSavingSetter] = useState(false);
  const { t } = useTranslation();

  const data = useMemo(
    () =>
      summary.players.allPlays
        .map((obj) => {
          const eclectic = summary.players.eclectic.find(
            (u) => u.user === obj.user
          );
          const social = summary.players.social.find(
            (u) => u.user === obj.user
          );
          const histogram = summary.histograms.players.find(
            (x) => x.user === obj.user
          ).value;
          let histShort = histogram.slice(-10);
          while (histShort.length < 10) {
            histShort = [0, ...histShort];
          }
          const h = summary.players.h.find((u) => u.user === obj.user).value;
          const hOpp = summary.players.hOpp.find(
            (u) => u.user === obj.user
          ).value;
          const user = userNames.find((u) => u.id === obj.user);
          const name = user !== undefined ? user.name : "UNKNOWN";
          return {
            id: obj.user,
            name,
            plays: obj.value,
            eclectic: eclectic.value,
            social: social.value,
            histogram,
            histShort,
            h,
            hOpp,
          };
        })
        .sort((a, b) => b.plays - a.plays),
    [summary, userNames]
  );

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
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: t("tables.player"),
        cell: (props) => {
          const displayName = formatUserDisplayName(
            userNames.find((u) => u.id === props.row.original.id) ?? {
              id: props.row.original.id,
              name: props.getValue(),
            },
            userNames
          );
          return globalMe !== null && globalMe.id === props.row.original.id ? (
            <Link to={`/player/${props.row.original.id}`}>
              <span className="bolder highlight">{displayName}</span>
            </Link>
          ) : (
            <Link to={`/player/${props.row.original.id}`}>{displayName}</Link>
          );
        },
      }),
      columnHelper.accessor("plays", {
        header: t("tables.totalPlays"),
      }),
      columnHelper.accessor("h", {
        header: t("tables.hIndex"),
      }),
      columnHelper.accessor("eclectic", {
        header: t("tables.differentGames"),
      }),
      columnHelper.accessor("hOpp", {
        header: t("tables.hIndexOpponents"),
      }),
      columnHelper.accessor("social", {
        header: t("tables.differentOpponents"),
      }),
      columnHelper.accessor("histogram", {
        header: t("tables.histogram"),
        cell: (props) => {
          const displayName = formatUserDisplayName(
            userNames.find((u) => u.id === props.row.original.id) ?? {
              id: props.row.original.id,
              name: props.row.original.name,
            },
            userNames
          );
          return (
            <HistogramSparkline
              rowId={props.row.original.id}
              histShort={props.row.original.histShort}
              histogram={props.getValue()}
              modalTitle={t("stats.histogramFor", { name: displayName })}
              isOpen={
                activeChartModal !== "" &&
                activeChartModal === props.row.original.id
              }
              onOpen={() => {
                activeChartModalSetter(props.row.original.id);
                window.dispatchEvent(new Event("resize"));
              }}
              onClose={() => activeChartModalSetter("")}
            />
          );
        },
        enableSorting: false,
      }),
    ],
    [columnHelper, globalMe, activeChartModal, userNames, t]
  );

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

  return (
    <>
      <DataTable
        {...STATS_TABLE_PROPS}
        nav={nav}
        data={data}
        columns={columns}
        sort={[{ id: "plays", desc: true }]}
      />
      {globalMe !== null || rivalryData.length > 0 ? (
        <>
          <hr />
          <div className="content">
            <p>{t("stats.playerStats.rivalriesIntro")}</p>
            {globalMe !== null ? (
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
            ) : null}
          </div>
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
      ) : null}
    </>
  );
}

export default PlayerStats;
