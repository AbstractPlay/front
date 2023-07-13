import { useContext, useState, useMemo, Fragment } from "react";
import { Link } from "react-router-dom";
import { MeContext } from "../pages/Skeleton";
import { gameinfo } from "@abstractplay/gameslib";
import { getCoreRowModel, useReactTable, flexRender, createColumnHelper, getSortedRowModel, getPaginationRowModel } from '@tanstack/react-table'
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en.json";
import ReactTimeAgo from "react-time-ago";
// TODO: Adjust locale to user selection, when supported
TimeAgo.addDefaultLocale(en);

function CompletedGamesTable(props) {
    const [globalMe] = useContext(MeContext);
    const [sorting, setSorting] = useState([{id: "completed", desc: true}]);

    const data = useMemo( () => props.games.map((g) => {
        const info = gameinfo.get(g.metaGame);
        return{
            id: g.id,
            metaGame: g.metaGame,
            gameName: info.name,
            gameEnded: g.gameEnded || 0,
            opponents: g.players
                .filter((item) => item.id !== globalMe.id)
                .map((item) => item.name)
                .join(", "),
            numMoves: g.numMoves || 0,
            lastSeen: g.seen || 0,
            lastChat: g.lastChat || 0,
        }
    }), [globalMe.id, props.games]);

    const columnHelper = createColumnHelper();
    const columns = useMemo( () => [
        columnHelper.accessor("gameName", {
            header: "Game",
            cell: props => <Link to={`/move/${props.row.original.metaGame}/1/${props.row.original.id}`}>{props.getValue()}</Link>,
        }),
        columnHelper.accessor("opponents", {
          header: "Opponents",
        }),
        columnHelper.accessor('gameEnded', {
          header: "Completed",
          cell: props => props.getValue() === 0 ? "" : <ReactTimeAgo date={props.getValue()} timeStyle="twitter-now" />,
          id: "completed",
        }),
        columnHelper.accessor('lastSeen', {
          header: "Last seen",
          cell: props => props.getValue() === 0 ? "" : <ReactTimeAgo date={props.getValue()} timeStyle="twitter-now" />,
        }),
        columnHelper.accessor('numMoves', {
          header: "# moves",
          cell: props => props.getValue() === 0 ? "" : props.getValue(),
        }),
    ], [columnHelper]);

    const table = useReactTable({
        data,
        columns,
        state: {sorting},
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
    })

    return (
      <Fragment>
        <table className="table" id="completedGamesTable">
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

        <div className="level" id="completedGamesTableFooter">
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
                                    table.setPageSize(Number(e.target.value))
                                }}
                                >
                                {[10, 20, 30, 40, 50].map(pageSize => (
                                    <option key={pageSize} value={pageSize}>
                                    Show {pageSize}
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
