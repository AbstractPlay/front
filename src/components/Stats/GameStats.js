import React, { useContext, useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { SummaryContext } from "../../pages/Skeleton";
import TableSkeleton from "./TableSkeleton";

function GameStats({ metaFilter }) {
  const [summary] = useContext(SummaryContext);

  const data = useMemo(
    () =>
      [...Object.keys(summary.metaStats)]
        .map((game) => {
          const rec = summary.metaStats[game];
          return {
            id: game,
            game,
            n: rec.n,
            lenAvg: Math.trunc(rec.lenAvg * 100) / 100,
            lenMedian: Math.trunc(rec.lenMedian * 100) / 100,
            winsFirst: Math.trunc(rec.winsFirst * 10000) / 100,
          };
        })
        .filter(
          (rec) =>
            metaFilter === undefined ||
            rec.game === metaFilter ||
            rec.game.startsWith(`${metaFilter} (`)
        )
        .sort((a, b) => a.game.localeCompare(b.game)),
    [summary, metaFilter]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("game", {
        header: "Game",
      }),
      columnHelper.accessor("n", {
        header: "Num records",
      }),
      columnHelper.accessor("lenAvg", {
        header: "Average length",
      }),
      columnHelper.accessor("lenMedian", {
        header: "Median length",
      }),
      columnHelper.accessor("winsFirst", {
        header: "First-player wins",
        cell: (props) => props.getValue() + "%",
      }),
    ],
    [columnHelper]
  );

  return (
    <>
      <TableSkeleton
        data={data}
        columns={columns}
        sort={[{ id: "game", desc: false }]}
      />
    </>
  );
}

export default GameStats;
