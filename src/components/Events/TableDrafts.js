import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import TableSkeleton from "./TableSkeleton";

function TableDrafts({ events }) {
  const data = useMemo(
    () =>
      events
        .map(({ sk: id, name, dateStart }) => {
          return {
            id,
            name,
            dateStart,
          };
        })
        .sort((a, b) => a.dateStart - b.dateStart),
    [events]
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
      columnHelper.accessor("dateStart", {
        header: "Start date",
        cell: (props) => new Date(props.getValue()).toLocaleString(),
      }),
    ],
    [columnHelper]
  );

  return (
    <TableSkeleton
      data={data}
      columns={columns}
      sort={[{ id: "name", desc: false }]}
    />
  );
}

export default TableDrafts;
