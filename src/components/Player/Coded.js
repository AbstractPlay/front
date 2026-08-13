import React, { useContext, useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { ProfileContext } from "../Player";
import { gameinfo } from "@abstractplay/gameslib";
import TableSkeleton from "./TableSkeleton";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Coded() {
  const [user] = useContext(ProfileContext);
  const { t } = useTranslation();

  const data = useMemo(
    () =>
      [...gameinfo.entries()]
        .filter(
          ([, entry]) =>
            entry.people !== undefined &&
            entry.people.filter((p) => p.type === "coder" && p.apid === user.id)
              .length > 0
        )
        .map(([meta, info]) => {
          const ret = {
            id: meta,
            name: info.name,
          };
          return ret;
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [user]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: t("tables.game"),
        cell: (props) => (
          <Link to={`/games/${props.row.original.id}`}>{props.getValue()}</Link>
        ),
      }),
    ],
    [columnHelper, t]
  );

  if (data.length === 0) {
    return null;
  }

  return (
    <TableSkeleton
      data={data}
      columns={columns}
      sort={[{ id: "name", desc: false }]}
      key="Player|Coded"
    />
  );
}

export default Coded;
