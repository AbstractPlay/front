import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { createColumnHelper } from "@tanstack/react-table";
import TableSkeleton from "./TableSkeleton";
import { useTranslation } from "react-i18next";

function TableActive({ events }) {
  const { t } = useTranslation();
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
        header: t("tables.name"),
        cell: (props) => (
          <Link to={`/event/${props.row.original.id}`}>{props.getValue()}</Link>
        ),
      }),
      columnHelper.accessor("dateStart", {
        header: t("tables.startDate"),
        cell: (props) => new Date(props.getValue()).toLocaleString(),
      }),
      columnHelper.accessor("description", {
        header: t("tables.description"),
        cell: (props) => (
          <ReactMarkdown
            rehypePlugins={[rehypeRaw]}
            remarkPlugins={[remarkGfm]}
            className="content"
          >
            {props.getValue()}
          </ReactMarkdown>
        ),
      }),
    ],
    [columnHelper, t]
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
