import { useContext, useEffect, useState, useMemo } from "react";
import { MeContext } from "../../pages/Skeleton";
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
import { useTranslation } from "react-i18next";
import Modal from "../Modal";

const allSize = Number.MAX_SAFE_INTEGER;

function StandingChallengeTable({ fetching, handleSuspend, handleDelete }) {
  const [globalMe] = useContext(MeContext);
  const [sorting, setSorting] = useState([{ id: "gameName", desc: false }]);
  const [showState, showStateSetter] = useStorageState(
    "dashboard-tables-mine-show",
    10
  );
  const [nextDate, nextDateSetter] = useState(new Date());
  const [showDeleteModal, showDeleteModalSetter] = useState(false);
  const [standingEntry, standingEntrySetter] = useState(null);
  const { t } = useTranslation();

  const resetModal = () => {
    showDeleteModalSetter(false);
    standingEntrySetter(null);
  };

  useEffect(() => {
    const today = new Date();
    const todayMid = Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
      0
    );
    const todayNoon = Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      12,
      0,
      0,
      0
    );
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowMid = Date.UTC(
      tomorrow.getFullYear(),
      tomorrow.getMonth(),
      tomorrow.getDate(),
      0,
      0,
      0,
      0
    );
    const tomorrowNoon = Date.UTC(
      tomorrow.getFullYear(),
      tomorrow.getMonth(),
      tomorrow.getDate(),
      12,
      0,
      0,
      0
    );
    for (const date of [todayMid, todayNoon, tomorrowMid, tomorrowNoon]) {
      if (date > today.getTime()) {
        nextDateSetter(date);
        break;
      }
    }
  }, [nextDate]);

  const data = useMemo(
    () =>
      globalMe.realStanding?.map((entry) => {
        const ret = {
          ...entry,
          gameName: "Unknown",
          noExplore: entry.noExplore || false,
          variants: entry.variants || [],
          clockCombined: [
            entry.clockStart,
            entry.clockInc,
            entry.clockMax,
          ].join("/"),
        };
        if (gameinfo.get(entry.metaGame) !== undefined) {
          ret.gameName = gameinfo.get(entry.metaGame).name;
        }
        return ret;
      }),
    [globalMe]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("gameName", {
        header: "Game",
      }),
      columnHelper.accessor("variants", {
        header: "Variants",
        cell: (props) =>
          props.getValue() !== undefined ? props.getValue().join(", ") : "none",
      }),
      columnHelper.accessor("limit", {
        header: "Limit",
      }),
      columnHelper.accessor("sensitivity", {
        header: "Sensitivity",
      }),
      columnHelper.accessor("numPlayers", {
        header: "Num Players",
      }),
      columnHelper.accessor("clockCombined", {
        header: "Clock",
      }),
      columnHelper.accessor("clockHard", {
        header: "Hard?",
        cell: (props) => (
          <input type="checkbox" checked={props.getValue()} readOnly={true} />
        ),
      }),
      columnHelper.accessor("rated", {
        header: "Rated?",
        cell: (props) => (
          <input type="checkbox" checked={props.getValue()} readOnly={true} />
        ),
      }),
      columnHelper.accessor("noExplore", {
        header: "NoExplore?",
        cell: (props) => (
          <input type="checkbox" checked={props.getValue()} readOnly={true} />
        ),
      }),
      columnHelper.accessor("suspended", {
        header: "Suspended?",
        cell: (props) => (
          <input type="checkbox" checked={props.getValue()} readOnly={true} />
        ),
      }),
      columnHelper.display({
        id: "delete",
        cell: (props) => (
          <div className="field is-grouped">
            <div className="control">
              {props.row.original.suspended ? (
                <>
                  <button
                    className="button is-small apButtonNeutral"
                    onClick={() => handleSuspend(props.row.original.id)}
                    title="Resume"
                  >
                    <span className="icon">
                      <i className="fa fa-play"></i>
                    </span>
                  </button>
                  <button
                    className="button is-small apButtonNeutral"
                    onClick={() => {
                      standingEntrySetter(props.row.original);
                      showDeleteModalSetter(true);
                    }}
                    title="Delete"
                  >
                    <span className="icon">
                      <i className="fa fa-trash"></i>
                    </span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="button is-small apButtonNeutral"
                    onClick={() => handleSuspend(props.row.original.id)}
                    title="Suspend"
                  >
                    <span className="icon">
                      <i className="fa fa-pause"></i>
                    </span>
                  </button>
                  <button
                    className="button is-small apButtonNeutral"
                    onClick={() => {
                      standingEntrySetter(props.row.original);
                      showDeleteModalSetter(true);
                    }}
                    title="Delete"
                  >
                    <span className="icon">
                      <i className="fa fa-trash"></i>
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        ),
      }),
    ],
    [columnHelper, handleDelete, handleSuspend]
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
          <p style={{ fontSize: "smaller" }}>
            Next run: {new Date(nextDate).toLocaleString()} (
            <ReactTimeAgo future date={nextDate} />)
          </p>
          {fetching ? <Spinner size="20" /> : null}
          <p>{t("NoRealStanding")}</p>
        </div>
      </>
    );
  } else {
    return (
      <>
        <div className="content">
          <p style={{ fontSize: "smaller" }}>
            Next run: {new Date(nextDate).toLocaleString()} (
            <ReactTimeAgo future date={nextDate} />)
          </p>
        </div>
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
        <Modal
          show={showDeleteModal}
          title={"Delete standing challenge"}
          buttons={[
            {
              label: "Yes, delete it",
              action: () => {
                showDeleteModalSetter(false);
                handleDelete(standingEntry.id);
              },
            },
            {
              label: "No, cancel",
              action: resetModal,
            },
          ]}
        >
          {standingEntry === null ? (
            <div className="content">
              <p>
                No standing challenge entry was provided. This should never
                happen.
              </p>
            </div>
          ) : (
            <>
              <div className="content">
                <p>
                  You are about to delete the following standing challenge. Are
                  you sure?
                </p>
              </div>
              <pre>{JSON.stringify(standingEntry, null, 2)}</pre>
            </>
          )}
        </Modal>
      </>
    );
  }
}

export default StandingChallengeTable;
