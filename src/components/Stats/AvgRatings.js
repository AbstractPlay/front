import React, { useContext, useEffect, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { SummaryContext } from "../Stats";
import { MeContext, UsersContext } from "../../pages/Skeleton";
import TableSkeleton from "./TableSkeleton";

function AvgRatings(props) {
  const [summary] = useContext(SummaryContext);
  const [globalMe] = useContext(MeContext);
  const [userNames] = useContext(UsersContext);
  const [joined, joinedSetter] = useState([]);

  useEffect(() => {
    const lst = [];
    for (const obj of summary.ratings.avg) {
      const weighted = summary.ratings.weighted.find(
        (u) => u.user === obj.user
      );
      lst.push({ user: obj.user, avg: obj.rating, weighted: weighted.rating });
      joinedSetter(lst);
    }
  }, [summary]);

  const data = useMemo(
    () =>
      joined
        .map(({ user: userid, avg, weighted }) => {
          let name = "UNKNOWN";
          const user = userNames.find((u) => u.id === userid);
          if (user !== undefined) {
            name = user.name;
          }
          return {
            userid,
            name,
            avg,
            weighted,
          };
        })
        .sort((a, b) => b.avg - a.avg),
    [joined, userNames]
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
      columnHelper.accessor("avg", {
        header: "Average",
      }),
      columnHelper.accessor("weighted", {
        header: "Weighted average",
      }),
    ],
    [columnHelper, globalMe]
  );

  return (
    <TableSkeleton
      data={data}
      columns={columns}
      sort={[{ id: "avg", desc: true }]}
    />
  );
}

export default AvgRatings;
