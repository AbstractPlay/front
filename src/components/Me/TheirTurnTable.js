import { useContext, useEffect, useState, useMemo, Fragment } from "react";
import { MeContext } from "../../pages/Skeleton";
import { Link } from "react-router-dom";
import { gameinfo } from "@abstractplay/gameslib";
import { getCoreRowModel, useReactTable, flexRender, createColumnHelper, getSortedRowModel, getPaginationRowModel } from '@tanstack/react-table'
import ReactTimeAgo from "react-time-ago";
import { useStorageState } from 'react-use-storage-state'

function showMilliseconds(ms) {
    let positive = true;
    if (ms < 0) {
      ms = -ms;
      positive = false;
    }
    let seconds = ms / 1000;
    const days = Math.floor(seconds / (24 * 3600));
    seconds = seconds % (24 * 3600);
    const hours = parseInt(seconds / 3600);
    seconds = seconds % 3600;
    const minutes = parseInt(seconds / 60);
    seconds = seconds % 60;
    let output = "";
    if (!positive) output = "-";
    if (days > 0) output += days + "d, ";
    if (days > 0 || hours > 0) output += hours + "h";
    if (days < 1) {
      if (days > 0 || hours > 0) output += ", ";
      if (minutes > 0) output += minutes + "m";
      if (hours < 1) {
        if (minutes > 0) output += ", ";
        output += Math.round(seconds) + "s";
      }
    }
    return output;
}
const allSize = 1000000;

function TheirTurnTable(props) {
    const [globalMe,] = useContext(MeContext);
    const [sorting, setSorting] = useState([{id: "timeRemaining", desc: false}]);
    const [showState, showStateSetter] = useStorageState("dashboard-tables-theirs-show", 10);

    const data = useMemo( () => props.games.map((g) => {
        const info = gameinfo.get(g.metaGame);
        let them = undefined;
        if ( (g.toMove !== null) && (g.toMove !== undefined) && (g.toMove !== "") && (! Array.isArray(g.toMove)) ) {
            const idx = parseInt(g.toMove);
            them = g.players[idx];
        }
        return{
            id: g.id,
            metaGame: g.metaGame,
            gameName: info.name,
            gameStarted: g.gameStarted || 0,
            lastMove: g.lastMoveTime,
            opponents: g.players
                .filter((item) => item.id !== globalMe.id)
                .map((item) => item.name)
                .join(", "),
            numMoves: g.numMoves || 0,
            myTime: them === undefined ? undefined : them.time,
            timeRemaining: them === undefined ? undefined : them.time - (Date.now() - g.lastMoveTime),
        }
    }), [props.games, globalMe.id]);

    const columnHelper = createColumnHelper();
    const columns = useMemo( () => [
        columnHelper.accessor("gameName", {
            header: "Game",
            cell: props => <Link to={`/move/${props.row.original.metaGame}/0/${props.row.original.id}`}>{props.getValue()}</Link>,
        }),
        columnHelper.accessor("opponents", {
          header: "Opponents",
        }),
        columnHelper.accessor('gameStarted', {
          header: "Started",
          cell: props => props.getValue() === 0 ? "" : <ReactTimeAgo date={props.getValue()} timeStyle="twitter-now" />,
        }),
        columnHelper.accessor('lastMove', {
          header: "Last move",
          cell: props => props.getValue() === 0 ? "" : <ReactTimeAgo date={props.getValue()} timeStyle="twitter-now" />,
        }),
        columnHelper.accessor('numMoves', {
          header: "# moves",
          cell: props => props.getValue() === 0 ? "" : props.getValue(),
        }),
        columnHelper.accessor("timeRemaining", {
            header: "Time remaining",
            cell: props => props.getValue() === undefined ? "" : showMilliseconds(props.getValue()),
        }),
    ], [columnHelper]);

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
                {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                    <th key={header.id}>
                    {header.isPlaceholder
                        ? null
                        : (
                            <div
                              {...{
                                className: header.column.getCanSort()
                                  ? 'sortable'
                                  : '',
                                onClick: header.column.getToggleSortingHandler(),
                              }}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {{
                                asc: <Fragment>&nbsp;<i className="fa fa-angle-up"></i></Fragment>,
                                desc: <Fragment>&nbsp;<i className="fa fa-angle-down"></i></Fragment>,
                              }[header.column.getIsSorted()] ?? null}
                            </div>
                        )
                    }
                    </th>
                ))}
                </tr>
                ))}
            </thead>
            <tbody>
            {table.getRowModel().rows.map(row => (
                <tr key={row.id} className={row.original.lastChat > row.original.lastSeen ? "newChat" : ""}>
                {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                ))}
                </tr>
            ))}
            </tbody>
        </table>

        <div className="level smallerText">
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
                    <p>Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of <strong>{table.getPageCount()}</strong> ({table.getPrePaginationRowModel().rows.length} total rows)</p>
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
                                onChange={e => {
                                    showStateSetter(Number(e.target.value));
                                }}
                                >
                                {[10, allSize].map(pageSize => (
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

export default TheirTurnTable;
