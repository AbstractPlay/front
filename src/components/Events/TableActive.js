import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import rehypeRaw from "rehype-raw";
import { createColumnHelper } from "@tanstack/react-table";
import TableSkeleton from "./TableSkeleton";

function TableActive({ events }) {
  const data = useMemo(
    () =>
      events
        .map(({ sk: id, name, description, dateStart }) => {
          return {
            id,
            name,
            description,
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
      columnHelper.accessor("description", {
        header: "Description",
        cell: (props) => (
          <ReactMarkdown rehypePlugins={[rehypeRaw]} className="content">
            {props.getValue()}
          </ReactMarkdown>
        ),
      }),
    ],
    [columnHelper]
  );

  return (
    <TableSkeleton
      data={data}
      columns={columns}
      sort={[{ id: "dateStart", desc: false }]}
    />
  );
}

export default TableActive;
