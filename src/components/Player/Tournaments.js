import React, { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import { gameinfo } from "@abstractplay/gameslib";
import { createColumnHelper } from "@tanstack/react-table";
import { TournamentContext } from "../Player";
import TableSkeleton from "./TableSkeleton";
import { useTranslation } from "react-i18next";

const formatter = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

function Tournaments() {
  const [tourneys] = useContext(TournamentContext);
  const { t } = useTranslation();

  const data = useMemo(
    () =>
      tourneys
        .map(
          ({
            tid,
            metaGame,
            variants,
            archived,
            dateEnded,
            place,
            participants,
            score,
          }) => {
            const gameName = gameinfo.get(metaGame).name;
            return {
              id: tid,
              meta: metaGame,
              gameName,
              variants,
              tourneyName: `${gameName} (${
                variants.length === 0 ? "no variants" : variants.join("|")
              })`,
              dateEnded,
              archived,
              place,
              participants,
              score,
            };
          }
        )
        .sort((a, b) => b.dateEnded - a.dateEnded),
    [tourneys]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("tourneyName", {
        header: t("tables.tournament"),
        cell: (props) => (
          <>
            <Link
              to={`/tournament${
                props.row.original.archived ? `/${props.row.original.meta}` : ""
              }/${props.row.original.id}`}
            >
              {props.getValue()}
            </Link>
          </>
        ),
        sortingFn: (rowA, rowB, columnID) => {
          return rowA.original.gameName.localeCompare(rowB.original.gameName);
        },
      }),
      columnHelper.accessor("place", {
        header: t("tables.place"),
        invertSorting: true,
      }),
      columnHelper.accessor("participants", {
        header: t("tables.participants"),
      }),
      columnHelper.accessor("score", {
        header: t("tables.score"),
        cell: (props) => props.getValue().toFixed(2),
      }),
      columnHelper.accessor("dateEnded", {
        header: t("tables.ended"),
        cell: (props) => formatter.format(props.getValue()),
      }),
    ],
    [columnHelper, t]
  );

  return (
    <>
      <TableSkeleton
        data={data}
        columns={columns}
        sort={[{ id: "dateEnded", desc: true }]}
        key="Player|Tournaments"
      />
    </>
  );
}

export default Tournaments;
