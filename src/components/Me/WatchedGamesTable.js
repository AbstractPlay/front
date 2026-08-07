import { useCallback, useState, useMemo, Fragment, useEffect } from "react";
import { Link } from "react-router-dom";
import { callAuthApi } from "../../lib/api";
import { unwatchGame } from "../../lib/playerGameMarks";
import { gameinfo } from "@abstractplay/gameslib";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import LocalizedTimeAgo from "../LocalizedTimeAgo";
import { useStorageState } from "react-use-storage-state";
import { useStore } from "../../stores";
import BotAwareName from "../Bots/BotAwareName";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

const allSize = Number.MAX_SAFE_INTEGER;

function isGameCompleted(game) {
  if (Array.isArray(game.toMove)) {
    return game.toMove.every((t) => !t);
  }
  return game.toMove === "" || game.toMove === null;
}

function WatchedGamesTable(props) {
  const globalMe = useStore((state) => state.globalMe);
  const allUsers = useStore((state) => state.users);
  const [sorting, setSorting] = useState([{ id: "lastActivity", desc: true }]);
  const [showState, showStateSetter] = useStorageState(
    "dashboard-tables-watched-show",
    10
  );
  const { t } = useTranslation();

  const handleUnwatchClick = useCallback(
    async (metaGame, gameId) => {
      const res = await unwatchGame({ metaGame, id: gameId });
      if (res.cancelled) return;
      if (!res.ok) {
        toast.error(res.error || t("Error"));
      }
    },
    [t]
  );

  const handleClearClick = useCallback(
    async (gameId) => {
      try {
        const res = await callAuthApi("set_lastSeen", { gameId });
        if (!res) return;
        if (res.status !== 200) {
          console.log(`An error occurred while setting lastSeen.`);
        } else {
          const { setGlobalMe, globalMe: me } = useStore.getState();
          if (!me?.watchedGames) return;
          const newMe = JSON.parse(JSON.stringify(me));
          const idx = newMe.watchedGames.findIndex((g) => g.id === gameId);
          if (idx !== -1) {
            newMe.watchedGames[idx].seen = Date.now();
            setGlobalMe(newMe);
          }
        }
      } catch (error) {
        props.setError(error);
      }
    },
    [props]
  );

  const data = useMemo(
    () =>
      props.games.map((g) => {
        const completed = isGameCompleted(g);
        const ret = {
          id: g.id,
          metaGame: g.metaGame,
          gameName: "Unknown",
          completed,
          opponents: g.players.filter((item) => item.id !== globalMe.id),
          lastActivity: Math.max(
            g.lastChat || 0,
            g.lastMoveTime || 0,
            g.gameEnded || 0
          ),
          lastSeen: g.seen || 0,
          lastChat: g.lastChat || 0,
        };
        if (gameinfo.get(g.metaGame) !== undefined)
          ret.gameName = gameinfo.get(g.metaGame).name;
        return ret;
      }),
    [globalMe.id, props.games]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("gameName", {
        header: t("tables.game"),
        cell: (props) => {
          const cbit = props.row.original.completed ? 1 : 0;
          if (props.getValue() === "Unknown") {
            return <>Unknown</>;
          }
          return (
            <span
              className={
                props.row.original.lastChat > props.row.original.lastSeen
                  ? "newChat"
                  : ""
              }
            >
              <Link
                to={`/move/${props.row.original.metaGame}/${cbit}/${props.row.original.id}`}
              >
                {props.getValue()}
              </Link>
            </span>
          );
        },
      }),
      columnHelper.accessor("opponents", {
        header: t("tables.opponents"),
        cell: (props) =>
          props
            .getValue()
            .map((u) => (
              <BotAwareName id={u.id} name={u.name} users={allUsers} link />
            ))
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
        sortingFn: (rowA, rowB, columnID) => {
          const valA = rowA.getValue(columnID);
          const valB = rowB.getValue(columnID);
          const nameA = valA[0]?.name ?? "";
          const nameB = valB[0]?.name ?? "";
          return nameA.localeCompare(nameB);
        },
      }),
      columnHelper.accessor("completed", {
        header: t("tables.status"),
        cell: (props) =>
          props.getValue() ? t("tables.completed") : t("tables.inProgress"),
      }),
      columnHelper.accessor("lastActivity", {
        header: t("tables.lastActivity"),
        cell: (props) =>
          props.getValue() === 0 ? (
            ""
          ) : (
            <LocalizedTimeAgo date={props.getValue()} timeStyle="twitter-now" />
          ),
        id: "lastActivity",
      }),
      columnHelper.display({
        id: "clear",
        cell: (props) => (
          <div className="control">
            <button
              className="button is-small is-rounded apButtonNeutral"
              onClick={() => handleClearClick(props.row.original.id)}
            >
              {t("tables.clear")}
            </button>
          </div>
        ),
      }),
      columnHelper.display({
        id: "unwatch",
        cell: (props) => (
          <div className="control">
            <button
              className="button is-small is-rounded apButtonNeutral"
              onClick={() =>
                handleUnwatchClick(
                  props.row.original.metaGame,
                  props.row.original.id
                )
              }
            >
              {t("tables.unwatch")}
            </button>
          </div>
        ),
      }),
    ],
    [columnHelper, handleClearClick, handleUnwatchClick, allUsers, t]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
  });

  useEffect(() => {
    table.setPageSize(showState);
  }, [showState, table]);

  return (
    <Fragment>
      <table className="table apTable">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder ? null : (
                    <div
                      {...{
                        className: header.column.getCanSort() ? "sortable" : "",
                        onClick: header.column.getToggleSortingHandler(),
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: (
                          <Fragment>
                            &nbsp;<i className="fa fa-angle-up"></i>
                          </Fragment>
                        ),
                        desc: (
                          <Fragment>
                            &nbsp;<i className="fa fa-angle-down"></i>
                          </Fragment>
                        ),
                      }[header.column.getIsSorted()] ?? null}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={
                row.original.lastChat > row.original.lastSeen ? "newChat" : ""
              }
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="level smallerText tableNav">
        <div className="level-left">
          <div className="level-item">
            <button
              className="button is-small"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="icon is-small">
                <i className="fa fa-angle-double-left"></i>
              </span>
            </button>
            <button
              className="button is-small"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="icon is-small">
                <i className="fa fa-angle-left"></i>
              </span>
            </button>
            <button
              className="button is-small"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="icon is-small">
                <i className="fa fa-angle-right"></i>
              </span>
            </button>
            <button
              className="button is-small"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="icon is-small">
                <i className="fa fa-angle-double-right"></i>
              </span>
            </button>
          </div>
          <div className="level-item">
            <p>
              Page <strong>{table.getState().pagination.pageIndex + 1}</strong>{" "}
              of <strong>{table.getPageCount()}</strong> (
              {table.getPrePaginationRowModel().rows.length} total rows)
            </p>
          </div>
          <div className="level-item">
            <div className="control">
              <div className="select is-small">
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => {
                    showStateSetter(Number(e.target.value));
                  }}
                >
                  {[10, 20, 30, 40, 50, allSize].map((pageSize) => (
                    <option key={pageSize} value={pageSize}>
                      Show {pageSize === allSize ? "All" : pageSize}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

export default WatchedGamesTable;
