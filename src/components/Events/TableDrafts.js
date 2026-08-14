import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable, { EVENTS_TABLE_PROPS } from "../shared/DataTable";
import { useTranslation } from "react-i18next";

function TableDrafts({ events }) {
  const { t } = useTranslation();
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
        header: t("tables.name"),
        cell: (props) => (
          <Link to={`/event/${props.row.original.id}`}>{props.getValue()}</Link>
        ),
      }),
      columnHelper.accessor("dateStart", {
        header: t("tables.startDate"),
        cell: (props) => new Date(props.getValue()).toLocaleString(),
      }),
    ],
    [columnHelper, t]
  );

  return (
    <DataTable
      {...EVENTS_TABLE_PROPS}
      data={data}
      columns={columns}
      sort={[{ id: "name", desc: false }]}
    />
  );
}

export default TableDrafts;
