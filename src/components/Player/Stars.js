import React, { useContext, useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { ProfileContext } from "../Player";
import { gameinfo } from "@abstractplay/gameslib";
import TableSkeleton from "./TableSkeleton";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Stars() {
  const [user] = useContext(ProfileContext);
  const { t } = useTranslation();

  const data = useMemo(
    () =>
      !("stars" in user) || user.stars === undefined || user.stars === null
        ? []
        : user.stars
            .map((meta) => {
              const ret = {
                id: meta,
                name: "Unknown",
              };
              if (gameinfo.get(meta) !== undefined)
                ret.name = gameinfo.get(meta).name;
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
      key="Player|Stars"
    />
  );
}

export default Stars;
