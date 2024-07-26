import React, { useMemo, useContext } from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import { UsersContext } from "../../pages/Skeleton";
import TableSkeleton from "./TableSkeleton";

function TableComplete({ events }) {
  const [allUsers] = useContext(UsersContext);

  const data = useMemo(
    () =>
      events
        .map(({ sk: id, name, dateEnd, winner }) => {
          const winners = allUsers.filter((u) => winner.includes(u.id));
          return {
            id,
            name,
            dateEnd,
            winners,
          };
        })
        .sort((a, b) => a.dateEnd - b.dateEnd),
    [events, allUsers]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (props) => (
          <Link to={`/event/${props.row.original.id}`}>{props.getValue()}</Link>
        ),
      }),
      columnHelper.accessor("dateEnd", {
        header: "End date",
        cell: (props) => new Date(props.getValue()).toLocaleString(),
      }),
      columnHelper.accessor("winners", {
        header: "Winner",
        cell: (props) =>
          props
            .getValue()
            .map((u) => <Link to={`/player/${u.id}`}>{u.name}</Link>)
            .reduce(
              (acc, x) =>
                acc === null ? (
                  x
                ) : (
                  <>
                    {acc}, {x}
                  </>
                ),
              null
            ),
      }),
      columnHelper.display({
        id: "actions",
        cell: (props) => (
          <>
            <a
                href={`https://records.abstractplay.com/event/${props.row.original.id}.json`}
            >
                <button className="button apButton is-small">
                    Download game records
                </button>
            </a>
          </>
        ),
      }),
    ],
    [columnHelper]
  );

  return (
    <TableSkeleton
      data={data}
      columns={columns}
      sort={[{ id: "dateEnd", desc: true }]}
    />
  );
}

export default TableComplete;
