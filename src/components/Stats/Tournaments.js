import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import TableSkeleton from "./TableSkeleton";
import { useStore } from "../../stores";
import { formatUserDisplayName } from "../Bots/botUtils";
import { useTranslation } from "react-i18next";

function Tournaments({ nav }) {
  const [summary, summarySetter] = useState(null);
  const globalMe = useStore((state) => state.globalMe);
  const userNames = useStore((state) => state.users);
  const { t } = useTranslation();

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL(
          "https://records.abstractplay.com/tournament-summary.json"
        );
        const res = await fetch(url);
        const result = await res.json();
        summarySetter(result);
      } catch (error) {
        summarySetter(null);
      }
    }
    fetchData();
  }, []);

  const data = useMemo(
    () =>
      summary === null
        ? []
        : summary
            .map(
              ({ player, count, won, t50, scoreSum, scoreAvg, scoreMed }) => {
                let name = "UNKNOWN";
                const user = userNames.find((u) => u.id === player);
                if (user !== undefined) {
                  name = user.name;
                }
                return {
                  userid: player,
                  name,
                  count,
                  won,
                  winrate: won / count,
                  t50,
                  t50rate: t50 / count,
                  scoreSum,
                  scoreAvg,
                  scoreMed,
                };
              }
            )
            .sort((a, b) => b.won - a.won),
    [summary, userNames]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: t("tables.player"),
        cell: (props) => {
          const displayName = formatUserDisplayName(
            userNames.find((u) => u.id === props.row.original.userid) ?? {
              id: props.row.original.userid,
              name: props.getValue(),
            },
            userNames
          );
          return globalMe !== null &&
            globalMe.id === props.row.original.userid ? (
            <Link to={`/player/${props.row.original.userid}`}>
              <span className="bolder highlight">{displayName}</span>
            </Link>
          ) : (
            <Link to={`/player/${props.row.original.userid}`}>
              {displayName}
            </Link>
          );
        },
      }),
      columnHelper.accessor("count", {
        header: t("tables.total"),
      }),
      columnHelper.accessor("won", {
        header: t("tables.wins"),
      }),
      columnHelper.accessor("winrate", {
        header: t("tables.rate"),
        cell: (props) =>
          props.getValue().toLocaleString(undefined, {
            style: "percent",
            minimumFractionDigits: 2,
          }),
      }),
      columnHelper.accessor("t50", {
        header: t("tables.topHalf"),
      }),
      columnHelper.accessor("t50rate", {
        header: t("tables.topHalfRate"),
        cell: (props) =>
          props.getValue().toLocaleString(undefined, {
            style: "percent",
            minimumFractionDigits: 2,
          }),
      }),
      columnHelper.accessor("scoreSum", {
        header: t("tables.totalScore"),
        cell: (props) => props.getValue().toFixed(2),
      }),
      columnHelper.accessor("scoreAvg", {
        header: t("tables.avgScore"),
        cell: (props) => props.getValue().toFixed(2),
      }),
      columnHelper.accessor("scoreMed", {
        header: t("tables.medianScore"),
        cell: (props) => props.getValue().toFixed(2),
      }),
    ],
    [columnHelper, globalMe, userNames, t]
  );

  return (
    <TableSkeleton
      nav={nav}
      data={data}
      columns={columns}
      sort={[{ id: "won", desc: true }]}
    />
  );
}

export default Tournaments;
