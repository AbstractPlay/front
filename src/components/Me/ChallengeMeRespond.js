import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
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
import Spinner from "../Spinner";
import ChallengeResponseModal from "./ChallengeResponseModal";
import { useTranslation } from "react-i18next";
import { useStore } from "../../stores";

const allSize = Number.MAX_SAFE_INTEGER;

function ChallengeMeRespond({ fetching, handleChallengeResponse }) {
  const globalMe = useStore((state) => state.globalMe);
  const [activeChallengeModal, activeChallengeModalSetter] = useState("");
  const [sorting, setSorting] = useState([{ id: "dateIssued", desc: true }]);
  const [showState, showStateSetter] = useStorageState(
    "dashboard-tables-challenges-show",
    10
  );
  const { t } = useTranslation();

  const data = useMemo(
    () =>
      globalMe?.challengesReceived.map((g) => {
        const ret = {
          id: g.id,
          metaGame: g.metaGame,
          variants: g.variants,
          numPlayers: g.numPlayers,
          gameName: "Unknown",
          dateIssued: g.dateIssued,
          comment: g.comment,
          challenger: g.challenger,
          accepted: g.players.filter((p) => p.id !== g.challenger.id),
          fullRec: g,
        };
        if (gameinfo.get(g.metaGame) !== undefined)
          ret.gameName = gameinfo.get(g.metaGame).name;
        return ret;
      }),
    [globalMe]
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
              <Link to={`/games/${props.row.original.metaGame}`}>
                {props.getValue()}
              </Link>
            );
          }
        },
      }),
      columnHelper.accessor("variants", {
        header: "Variants",
        cell: (props) => {
          props.getValue().join(", ");
        },
      }),
      columnHelper.accessor("numPlayers", {
        header: "# players",
      }),
      columnHelper.accessor("dateIssued", {
        header: "Issued",
        cell: (props) =>
          props.getValue() === 0 || props.getValue() === undefined ? (
            ""
          ) : (
            <ReactTimeAgo date={props.getValue()} timeStyle="twitter-now" />
          ),
      }),
      columnHelper.accessor("challenger", {
        header: "Challenger",
        cell: (props) => (
          <Link to={`/player/${props.getValue().id}`}>
            {props.getValue().name}
          </Link>
        ),
        invertSorting: true,
        sortingFn: (rowA, rowB, columnID) => {
          return rowA.original.challenger.name.localeCompare(
            rowB.original.challenger.name
          );
        },
      }),
      columnHelper.accessor("accepted", {
        header: "Accepted",
        cell: (props) =>
          props.getValue().length === 0
            ? ""
            : props
                .getValue()
                .map(({ name, id }, ind) => (
                  <Link to={`/player/${id}`}>{name}</Link>
                ))
                .reduce((prev, curr) => [prev, ", ", curr]),
      }),
      columnHelper.accessor("comment", {
        header: "Comment",
      }),
      columnHelper.display({
        id: "actions",
        cell: (props) => (
          <>
            <ChallengeResponseModal
              challenge={props.row.original.fullRec}
              show={
                activeChallengeModal !== "" &&
                activeChallengeModal === props.row.original.id
              }
              close={() => activeChallengeModalSetter("")}
              respond={handleChallengeResponse}
            />
            <button
              className="button is-small apButton"
              onClick={() => activeChallengeModalSetter(props.row.original.id)}
            >
              View
            </button>
          </>
        ),
      }),
    ],
    [columnHelper, activeChallengeModal, handleChallengeResponse]
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

  if (data === null || data === undefined || data.length === 0) {
    return (
      <>
        <div className="content">
          {fetching ? <Spinner size="20" /> : null}
          <p>{t("NoGames")}</p>
        </div>
      </>
    );
  } else {
    return (
      <>
        {fetching ? <Spinner size="20" /> : null}
        <table className="table apTable">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? "sortable"
                            : "",
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: (
                            <>
                              &nbsp;<i className="fa fa-angle-up"></i>
                            </>
                          ),
                          desc: (
                            <>
                              &nbsp;<i className="fa fa-angle-down"></i>
                            </>
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
                className={`${
                  row.original.tournament !== undefined ? "tourneyGame" : ""
                } ${
                  row.original.lastChat > row.original.lastSeen ? "newChat" : ""
                }`}
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
                Page{" "}
                <strong>{table.getState().pagination.pageIndex + 1}</strong> of{" "}
                <strong>{table.getPageCount()}</strong> (
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
                    {[10, allSize].map((pageSize) => (
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
      </>
    );
  }
}

export default ChallengeMeRespond;
