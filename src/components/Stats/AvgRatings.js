import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import TableSkeleton from "./TableSkeleton";
import { useStore } from "../../stores";

function AvgRatings({ nav }) {
  const summary = useStore((state) => state.summary);
  const globalMe = useStore((state) => state.globalMe);
  const userNames = useStore((state) => state.users);
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
            <Link to={`/player/${props.row.original.userid}`}>
              <span className="bolder highlight">{props.getValue()}</span>
            </Link>
          ) : (
            <Link to={`/player/${props.row.original.userid}`}>
              {props.getValue()}
            </Link>
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
      nav={nav}
      data={data}
      columns={columns}
      sort={[{ id: "avg", desc: true }]}
    />
  );
}

export default AvgRatings;
