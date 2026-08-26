import { useEffect, useState, useMemo } from "react";
import { getGameDisplayName } from "../../lib/gameOptions";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { useStorageState } from "react-use-storage-state";
import Spinner from "../Spinner";
import { useTranslation, Trans } from "react-i18next";
import Modal from "../Modal";
import { useStore } from "../../stores";

const allSize = Number.MAX_SAFE_INTEGER;

function StandingChallengeTable({ fetching, handleSuspend, handleDelete }) {
  const globalMe = useStore((state) => state.globalMe);
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
          gameName: getGameDisplayName(entry.metaGame, "Unknown"),
          noExplore: entry.noExplore || false,
          variants: entry.variants || [],
          clockCombined: [
            entry.clockStart,
            entry.clockInc,
            entry.clockMax,
          ].join("/"),
        };
        return ret;
      }),
    [globalMe]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("gameName", {
        header: t("tables.game"),
      }),
      columnHelper.accessor("variants", {
        header: t("tables.variants"),
        cell: (props) =>
          props.getValue() !== undefined ? props.getValue().join(", ") : "none",
      }),
      columnHelper.accessor("limit", {
        header: t("tables.limit"),
      }),
      columnHelper.accessor("sensitivity", {
        header: t("tables.sensitivity"),
      }),
      columnHelper.accessor("numPlayers", {
        header: t("tables.numPlayersHeader"),
      }),
      columnHelper.accessor("clockCombined", {
        header: t("tables.clock"),
      }),
      columnHelper.accessor("clockHard", {
        header: t("tables.hard"),
        cell: (props) => (
          <div style={{ fontSize: "larger", textAlign: "center" }}>
            {props.getValue() === true ? "\u2611" : "\u2610"}
          </div>
        ),
      }),
      columnHelper.accessor("rated", {
        header: t("tables.rated"),
        cell: (props) => (
          <div style={{ fontSize: "larger", textAlign: "center" }}>
            {props.getValue() === true ? "\u2611" : "\u2610"}
          </div>
        ),
      }),
      columnHelper.accessor("noExplore", {
        header: t("tables.noExplore"),
        cell: (props) => (
          <div style={{ fontSize: "larger", textAlign: "center" }}>
            {props.getValue() === true ? "\u2611" : "\u2610"}
          </div>
        ),
      }),
      columnHelper.accessor("suspended", {
        header: t("tables.suspended"),
        cell: (props) => (
          <div style={{ fontSize: "larger", textAlign: "center" }}>
            {props.getValue() === true ? "\u2611" : "\u2610"}
          </div>
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
                    title={t("standingChallenge.resume")}
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
                    title={t("Delete")}
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
                    title={t("standingChallenge.suspend")}
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
                    title={t("Delete")}
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
    [columnHelper, handleSuspend, t]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    autoResetPageIndex: false,
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
          {/* <p style={{ fontSize: "smaller" }}>
            Next run: {new Date(nextDate).toLocaleString()} (
            <LocalizedTimeAgo future date={nextDate} />)
          </p> */}
          {fetching ? <Spinner size="20" /> : null}
          <p>{t("NoRealStanding")}</p>
        </div>
      </>
    );
  } else {
    return (
      <>
        {/* <div className="content">
          <p style={{ fontSize: "smaller" }}>
            Next run: {new Date(nextDate).toLocaleString()} (
            <LocalizedTimeAgo future date={nextDate} />)
          </p>
        </div> */}
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
          title={t("standingChallenge.deleteTitle")}
          buttons={[
            {
              label: t("standingChallenge.yesDelete"),
              action: () => {
                showDeleteModalSetter(false);
                handleDelete(standingEntry.id);
              },
            },
            {
              label: t("standingChallenge.noCancel"),
              action: resetModal,
            },
          ]}
        >
          {standingEntry === null ? (
            <div className="content">
              <p>{t("standingChallenge.missingEntry")}</p>
            </div>
          ) : (
            <>
              <div className="content">
                <p>
                  <Trans
                    i18nKey="standingChallenge.deleteConfirm"
                    values={{
                      description: `${standingEntry.gameName} (${
                        standingEntry.variants === undefined ||
                        standingEntry.variants.length === 0
                          ? t("standingChallenge.noVariants")
                          : standingEntry.variants.join(", ")
                      })`,
                    }}
                    components={[<tt key="tt" />]}
                  />
                </p>
              </div>
            </>
          )}
        </Modal>
      </>
    );
  }
}

export default StandingChallengeTable;
