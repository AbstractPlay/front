import React, { useContext, useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { SummaryContext } from "../Stats";
import { MeContext, UsersContext } from "../../pages/Skeleton";
import TableSkeleton from "./TableSkeleton";

function HighestSingleRating(props) {
  const [summary] = useContext(SummaryContext);
  const [globalMe] = useContext(MeContext);
  const [userNames] = useContext(UsersContext);

  const data = useMemo(
    () =>
      summary.ratings.highest
        .map(({ user: userid, game, rating, wld }) => {
          let name = "UNKNOWN";
          const user = userNames.find((u) => u.id === userid);
          if (user !== undefined) {
            name = user.name;
          }
          return {
            uuid: `${userid}|${game}`,
            userid,
            name,
            game,
            rating,
            wld
          };
        })
        .sort((a, b) => b.rating - a.rating),
    [summary, userNames]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Player",
        cell: (props) =>
          globalMe !== null && globalMe.id === props.row.original.userid ? (
            <span className="bolder highlight">{props.getValue()}</span>
          ) : (
            props.getValue()
          ),
      }),
      columnHelper.accessor("game", {
        header: "Game",
      }),
      columnHelper.accessor("rating", {
        header: "Rating",
      }),
      columnHelper.accessor("wld", {
        header: "Win/Loss/Draw",
        cell: (props) => {
            const sum = props.getValue().reduce((prev, curr) => prev + curr, 0);
            if (sum > 0) {
                const winrate = Math.trunc((props.getValue()[0] / sum) * 1000) / 10;
                return `${winrate}% (${props.getValue()[0]}, ${props.getValue()[1]}, ${props.getValue()[2]})`
            } else {
                return `---`
            }
        },
        sortingFn: (rowA, rowB, columnID) => {
            const sumA = rowA.getValue(columnID).reduce((prev, curr) => prev + curr, 0);
            const sumB = rowB.getValue(columnID).reduce((prev, curr) => prev + curr, 0);
            const rateA = Math.trunc((rowA.getValue(columnID)[0] / sumA) * 1000) / 10;
            const rateB = Math.trunc((rowB.getValue(columnID)[0] / sumB) * 1000) / 10;
            // NaNs first
            if (isNaN(rateA) && isNaN(rateB)) {
                return 0;
            } else if (isNaN(rateA)) {
                return -1;
            } else if (isNaN(rateB)) {
                return 1;
            }
            return rateA < rateB ? -1 : rateA > rateB ? 1 : 0;
        },
      }),
    ],
    [columnHelper, globalMe]
  );

  return (
    <TableSkeleton
      data={data}
      columns={columns}
      sort={[{ id: "rating", desc: true }]}
    />
  );
}

export default HighestSingleRating;
