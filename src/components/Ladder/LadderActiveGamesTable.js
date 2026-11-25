import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import LocalizedTimeAgo from "../LocalizedTimeAgo";
import BotAwareName from "../Bots/BotAwareName";
import { useStore } from "../../stores";

const columnHelper = createColumnHelper();

function LadderActiveGamesTable({ games, metaGame }) {
  const { t } = useTranslation();
  const allUsers = useStore((state) => state.users);

  const data = useMemo(
    () =>
      (games ?? []).map((g) => ({
        ...g,
        metaGame: g.metaGame ?? metaGame,
      })),
    [games, metaGame],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: t("Ladder.activity.game"),
        cell: (props) => (
          <Link
            to={`/move/${props.row.original.metaGame}/0/${props.getValue()}`}
          >
            {props.getValue().slice(0, 8)}
          </Link>
        ),
      }),
      columnHelper.display({
        id: "players",
        header: t("Tournament.Player"),
        cell: ({ row }) => (
          <span>
            {(row.original.players ?? []).map((p, idx) => (
              <React.Fragment key={p.id}>
                {idx > 0 ? " vs " : null}
                <BotAwareName id={p.id} name={p.name} users={allUsers} link />
              </React.Fragment>
            ))}
          </span>
        ),
      }),
      columnHelper.accessor("lastMoveTime", {
        header: t("Ladder.activity.lastMove"),
        cell: (props) =>
          props.getValue() ? (
            <LocalizedTimeAgo date={props.getValue()} timeStyle="twitter-now" />
          ) : (
            ""
          ),
      }),
      columnHelper.accessor("toMove", {
        header: t("Ladder.activity.toMove"),
        cell: (props) => {
          const value = props.getValue();
          const players = props.row.original.players ?? [];
          if (Array.isArray(value)) {
            const seat = value.findIndex(Boolean);
            if (seat >= 0 && players[seat]) {
              return <BotAwareName id={players[seat].id} users={allUsers} link />;
            }
            return "—";
          }
          const seat = Number.parseInt(String(value), 10);
          if (!Number.isNaN(seat) && players[seat]) {
            return <BotAwareName id={players[seat].id} users={allUsers} link />;
          }
          return "—";
        },
      }),
    ],
    [t, allUsers],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { sorting: [{ id: "lastMoveTime", desc: true }] },
  });

  if (!data.length) {
    return <p className="help">{t("Ladder.activity.noActiveGames")}</p>;
  }

  return (
    <div className="table-container ladder-hub-table-wrap">
      <table className="table apTable is-fullwidth">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LadderActiveGamesTable;