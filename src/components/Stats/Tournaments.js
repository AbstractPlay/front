import React, { useContext, useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import { MeContext, UsersContext } from "../../pages/Skeleton";
import TableSkeleton from "./TableSkeleton";

function Tournaments({ nav }) {
  const [summary, summarySetter] = useState(null);
  const [globalMe] = useContext(MeContext);
  const [userNames] = useContext(UsersContext);

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL("https://records.abstractplay.com/tournament-summary.json");
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
      summary === null ? [] :
      summary
        .map(({ player, count, won, t50, scoreSum, scoreAvg, scoreMed }) => {
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
        })
        .sort((a, b) => b.won - a.won),
    [summary, userNames]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Player",
        cell: (props) =>
          globalMe !== null && globalMe.id === props.row.original.userid ? (
            <Link to={`/player/${props.row.original.userid}`}>
              <span className="bolder highlight">{props.getValue()}</span>
            </Link>
          ) : (
            <Link to={`/player/${props.row.original.userid}`}>
              {props.getValue()}
            </Link>
          ),
      }),
      columnHelper.accessor("count", {
        header: "Total",
      }),
      columnHelper.accessor("won", {
        header: "Wins",
      }),
      columnHelper.accessor("winrate", {
        header: "Rate",
        cell: (props) => props.getValue().toLocaleString(undefined,{style: 'percent', minimumFractionDigits:2})
      }),
      columnHelper.accessor("t50", {
        header: "Top half",
      }),
      columnHelper.accessor("t50rate", {
        header: "Rate",
        cell: (props) => props.getValue().toLocaleString(undefined,{style: 'percent', minimumFractionDigits:2})
      }),
      columnHelper.accessor("scoreSum", {
        header: "Total score",
        cell: (props) => props.getValue().toFixed(2),
      }),
      columnHelper.accessor("scoreAvg", {
        header: "Avg score",
        cell: (props) => props.getValue().toFixed(2),
      }),
      columnHelper.accessor("scoreMed", {
        header: "Median score",
        cell: (props) => props.getValue().toFixed(2),
      }),
    ],
    [columnHelper, globalMe]
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
