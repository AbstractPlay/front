import { useCallback, useState, useMemo, Fragment, useEffect } from "react";
import { Link } from "react-router-dom";
import { callAuthApi } from "../../lib/api";
import { gameinfo } from "@abstractplay/gameslib";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import ReactTimeAgo from "react-time-ago";
import { useStorageState } from "react-use-storage-state";
import { useStore } from "../../stores";

const allSize = Number.MAX_SAFE_INTEGER;

function CompletedGamesTable(props) {
  const globalMe = useStore((state) => state.globalMe);
  const [sorting, setSorting] = useState([{ id: "completed", desc: true }]);
  const [showState, showStateSetter] = useStorageState(
    "dashboard-tables-completed-show",
    10
  );

  const handleClearClick = useCallback(
    async (gameId) => {
      try {
        const { setGlobalMe } = useStore.getState();
        const res = await callAuthApi("set_lastSeen", {
          gameId,
        });
        if (!res) return;
        if (res.status !== 200) {
          console.log(`An error occurred while setting lastSeen.`);
        } else {
          const newMe = JSON.parse(JSON.stringify(globalMe));
          const idx = newMe.games.findIndex((g) => g.id === gameId);
          if (idx === -1) {
            console.log(
              `Could not find game ID ${gameId} in the globalMe list of games: ${JSON.stringify(
                newMe.games
              )}`
            );
          } else {
            newMe.games.splice(idx, 1);
            setGlobalMe(newMe);
          }
        }
      } catch (error) {
        props.setError(error);
      }
    },
    [globalMe, props]
  );

  const data = useMemo(
    () =>
      props.games.map((g) => {
        const ret = {
          id: g.id,
          metaGame: g.metaGame,
          gameName: "Unknown",
          gameEnded: g.gameEnded || 0,
          opponents: g.players.filter((item) => item.id !== globalMe.id),
          numMoves: g.numMoves || 0,
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
        header: "Game",
        cell: (props) => {
          if (props.getValue() === "Unknown") {
            return <>Unknown</>;
          } else {
            return (
              <span
                className={
                  props.row.original.lastChat > props.row.original.lastSeen
                    ? "newChat"
                    : ""
                }
              >
                <Link
                  to={`/move/${props.row.original.metaGame}/1/${props.row.original.id}`}
                >
                  {props.getValue()}
                </Link>
              </span>
            );
          }
        },
      }),
      columnHelper.accessor("opponents", {
        header: "Opponents",
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
        sortingFn: (rowA, rowB, columnID) => {
          const nameA = rowA.getValue(columnID)[0].name;
          const nameB = rowB.getValue(columnID)[0].name;
          return nameA.localeCompare(nameB);
        },
      }),
      columnHelper.accessor("gameEnded", {
        header: "Completed",
        cell: (props) =>
          props.getValue() === 0 ? (
            ""
          ) : (
            <ReactTimeAgo date={props.getValue()} timeStyle="twitter-now" />
          ),
        id: "completed",
      }),
      columnHelper.accessor("lastSeen", {
        header: "Last seen",
        cell: (props) =>
          props.getValue() === 0 ? (
            ""
          ) : (
            <ReactTimeAgo date={props.getValue()} timeStyle="twitter-now" />
          ),
      }),
      columnHelper.accessor("numMoves", {
        header: "# moves",
        cell: (props) => (props.getValue() === 0 ? "" : props.getValue()),
      }),
      columnHelper.display({
        id: "clear",
        cell: (props) => (
          <div className="control">
            <button
              className="button is-small is-rounded apButtonNeutral"
              onClick={() => handleClearClick(props.row.original.id)}
            >
              Clear
            </button>
          </div>
        ),
      }),
    ],
    [columnHelper, handleClearClick]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
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
          {/* <div className="level-item">
                    <div className="field">
                        <span>|&nbsp;Go to page:</span>
                        <input
                            type="number"
                            defaultValue={table.getState().pagination.pageIndex + 1}
                            onChange={e => {
                                const page = e.target.value ? Number(e.target.value) - 1 : 0
                                table.setPageIndex(page)
                            }}
                            className="input is-small"
                        />
                    </div>
                </div> */}
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

export default CompletedGamesTable;
