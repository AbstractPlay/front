import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable, { STATS_TABLE_PROPS } from "../shared/DataTable";
import HistogramSparkline from "./shared/HistogramSparkline";
import { useStore } from "../../stores";
import { formatUserDisplayName } from "../Bots/botUtils";
import { useTranslation } from "react-i18next";
import { useEnsureSummaryTier } from "../../hooks/useEnsureSummaryTier";

function PlayerStats({ nav }) {
  useEnsureSummaryTier("site");
  useEnsureSummaryTier("players");
  const summary = useStore((state) => state.summary);
  const globalMe = useStore((state) => state.globalMe);
  const userNames = useStore((state) => state.users);
  const [activeChartModal, activeChartModalSetter] = useState("");
  const { t } = useTranslation();

  const data = useMemo(
    () =>
      !summary?.players?.allPlays
        ? []
        : summary.players.allPlays
        .map((obj) => {
          const eclectic = summary.players.eclectic?.find(
            (u) => u.user === obj.user
          );
          const social = summary.players.social?.find(
            (u) => u.user === obj.user
          );
          const histogram = summary.histograms?.players?.find(
            (x) => x.user === obj.user
          )?.value;
          if (histogram === undefined) {
            return null;
          }
          let histShort = histogram.slice(-10);
          while (histShort.length < 10) {
            histShort = [0, ...histShort];
          }
          const h =
            summary.players.h?.find((u) => u.user === obj.user)?.value ?? 0;
          const hOpp =
            summary.players.hOpp?.find((u) => u.user === obj.user)?.value ?? 0;
          const user = userNames.find((u) => u.id === obj.user);
          const name = user !== undefined ? user.name : "UNKNOWN";
          return {
            id: obj.user,
            name,
            plays: obj.value,
            eclectic: eclectic?.value ?? 0,
            social: social?.value ?? 0,
            histogram,
            histShort,
            h,
            hOpp,
          };
        })
        .filter((row) => row !== null)
        .sort((a, b) => b.plays - a.plays),
    [summary, userNames]
  );

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

  return (
    <DataTable
      {...STATS_TABLE_PROPS}
      nav={nav}
      data={data}
      columns={columns}
      sort={[{ id: "plays", desc: true }]}
    />
  );
}

export default PlayerStats;
