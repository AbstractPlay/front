import React, { useContext, useEffect, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { SummaryContext } from "../Stats";
import TableSkeleton from "./TableSkeleton";

function NumPlays(props) {
  const [summary] = useContext(SummaryContext);
  const [joined, joinedSetter] = useState([]);

  useEffect(() => {
    const lst = [];
    for (const obj of summary.plays.total) {
      const opps = summary.plays.width.find((g) => g.game === obj.game);
      lst.push({ game: obj.game, plays: obj.value, width: opps.value });
      joinedSetter(lst);
    }
  }, [summary]);

  const data = useMemo(
    () =>
      joined
        .map(({ game, plays, width }) => {
          return {
            id: game,
            game,
            plays,
            width,
          };
        })
        .sort((a, b) => b.plays - a.plays),
    [joined]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("game", {
        header: "Game",
      }),
      columnHelper.accessor("plays", {
        header: "Num plays",
      }),
      columnHelper.accessor("width", {
        header: "Num players",
      }),
    ],
    [columnHelper]
  );

  return (
    <TableSkeleton
      data={data}
      columns={columns}
      sort={[{ id: "plays", desc: true }]}
    />
  );
}

export default NumPlays;
