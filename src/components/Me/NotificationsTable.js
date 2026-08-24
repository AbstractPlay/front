import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { gameinfo } from "@abstractplay/gameslib";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useStorageState } from "react-use-storage-state";
import { useTranslation } from "react-i18next";
import LocalizedTimeAgo from "../LocalizedTimeAgo";
import ChallengeResponseModal from "./ChallengeResponseModal";
import { callAuthApi } from "../../lib/api";
import { expandVariants } from "../../lib/expandVariants";
import { useStore } from "../../stores";

const allSize = Number.MAX_SAFE_INTEGER;

function metaGameLabel(metaGame) {
  return gameinfo.get(metaGame)?.name ?? metaGame;
}

function variantsLabel(metaGame, variants) {
  if (!variants?.length || gameinfo.get(metaGame) === undefined) {
    return "";
  }
  try {
    const names = expandVariants(metaGame, variants);
    return names.length > 0 ? names.join(", ") : "";
  } catch {
    return "";
  }
}

function withVariants(message, metaGame, variants) {
  const label = variantsLabel(metaGame, variants);
  return label ? `${message} (${label})` : message;
}

function notificationMessage(t, body) {
  const metaGame = metaGameLabel(body.metaGame);

  switch (body.type) {
    case "gameStart":
      return withVariants(
        t("me.notifications.message.gameStart", {
          opponentName: body.opponentName,
          metaGame,
        }),
        body.metaGame,
        body.variants
      );
    case "gameEnd":
      return withVariants(
        t("me.notifications.message.gameEnd", {
          context: body.result,
          metaGame,
        }),
        body.metaGame,
        body.variants
      );
    case "ratingChange":
      return withVariants(
        t("me.notifications.message.ratingChange", {
          metaGame,
          delta: body.delta > 0 ? `+${body.delta}` : `${body.delta}`,
          newRating: Math.round(body.newRating),
        }),
        body.metaGame,
        body.variants
      );
    case "challengeIssued":
      return t("me.notifications.message.challengeIssued", {
        challengerName: body.challengerName,
        metaGame,
      });
    case "challengeDeclined":
      return t("me.notifications.message.challengeDeclined", {
        declinerName: body.declinerName,
        metaGame,
      });
    case "challengeRevoked":
      return t("me.notifications.message.challengeRevoked", {
        revokerName: body.revokerName,
        metaGame,
      });
    case "eventInvitation":
      return t("me.notifications.message.eventInvitation", {
        organizerName: body.organizerName,
        eventName: body.eventName,
      });
    default:
      return "";
  }
}

function NotificationsTable({ handleChallengeResponse, setError }) {
  const globalMe = useStore((state) => state.globalMe);
  const { t } = useTranslation();
  const [activeChallengeModal, activeChallengeModalSetter] = useState("");
  const [sorting, setSorting] = useState([{ id: "createdAt", desc: true }]);
  const [showState, showStateSetter] = useStorageState(
    "dashboard-tables-notifications-show",
    10
  );

  const notifications = globalMe?.notifications;

  const data = useMemo(
    () =>
      (notifications ?? []).map((n) => ({
        sk: n.sk,
        createdAt: n.createdAt,
        body: n.body,
        message: notificationMessage(t, n.body),
        note:
          n.body.note && String(n.body.note).trim() !== "" ? n.body.note : "",
      })),
    [notifications, t]
  );

  const handleDismiss = useCallback(
    async (sk) => {
      try {
        const res = await callAuthApi("dismiss_notification", { sk });
        if (!res) {
          return;
        }
        if (res.status !== 200) {
          console.log("An error occurred while dismissing notification.");
          return;
        }
        const { setGlobalMe } = useStore.getState();
        setGlobalMe((prev) => ({
          ...prev,
          notifications: (prev.notifications ?? []).filter((n) => n.sk !== sk),
        }));
      } catch (error) {
        if (setError) {
          setError(error);
        }
      }
    },
    [setError]
  );

  const challengeById = useMemo(() => {
    const map = new Map();
    for (const c of globalMe?.challengesReceived ?? []) {
      map.set(c.id, c);
    }
    return map;
  }, [globalMe?.challengesReceived]);

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("message", {
        header: t("me.notifications.columns.message"),
        cell: (props) => props.getValue(),
      }),
      columnHelper.accessor("note", {
        header: t("me.notifications.columns.note"),
        cell: (props) => {
          const note = props.getValue();
          if (!note) {
            return "";
          }
          return <span className="notificationNote">{note}</span>;
        },
      }),
      columnHelper.accessor("createdAt", {
        header: t("me.notifications.columns.time"),
        id: "createdAt",
        cell: (props) =>
          props.getValue() ? (
            <LocalizedTimeAgo
              date={props.getValue()}
              timeStyle="twitter-now"
            />
          ) : (
            ""
          ),
      }),
      columnHelper.display({
        id: "actions",
        cell: (props) => {
          const { body, sk } = props.row.original;
          const dismissButton = (
            <button
              type="button"
              className="button is-small is-rounded apButtonNeutral"
              onClick={() => handleDismiss(sk)}
            >
              {t("me.notifications.dismiss")}
            </button>
          );

          if (body.type === "challengeIssued") {
            const challenge = challengeById.get(body.challengeId);
            return (
              <>
                {challenge ? (
                  <>
                    <ChallengeResponseModal
                      challenge={challenge}
                      show={
                        activeChallengeModal !== "" &&
                        activeChallengeModal === body.challengeId
                      }
                      close={() => activeChallengeModalSetter("")}
                      respond={handleChallengeResponse}
                    />
                    <button
                      type="button"
                      className="button is-small apButton"
                      onClick={() =>
                        activeChallengeModalSetter(body.challengeId)
                      }
                    >
                      {t("View")}
                    </button>
                    &nbsp;
                  </>
                ) : null}
                {dismissButton}
              </>
            );
          }

          if (body.type === "eventInvitation") {
            return (
              <>
                <Link
                  to={`/event/${body.eventId}`}
                  className="button is-small apButton"
                >
                  {t("View")}
                </Link>
                &nbsp;
                {dismissButton}
              </>
            );
          }

          if (
            body.type === "gameStart" ||
            body.type === "gameEnd" ||
            body.type === "ratingChange"
          ) {
            return (
              <>
                <Link
                  to={`/move/${body.metaGame}/0/${body.gameId}`}
                  className="button is-small apButton"
                >
                  {t("View")}
                </Link>
                &nbsp;
                {dismissButton}
              </>
            );
          }

          return dismissButton;
        },
      }),
    ],
    [
      activeChallengeModal,
      challengeById,
      columnHelper,
      handleChallengeResponse,
      handleDismiss,
      t,
    ]
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

  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <Fragment>
      <p className="subtitle lined">
        <span>{t("me.notifications.title")}</span>
      </p>
      <div className="indentedContainer">
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

        <div className="level smallerText tableNav">
          <div className="level-left">
            <div className="level-item">
              <button
                type="button"
                className="button is-small"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="icon is-small">
                  <i className="fa fa-angle-double-left"></i>
                </span>
              </button>
              <button
                type="button"
                className="button is-small"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="icon is-small">
                  <i className="fa fa-angle-left"></i>
                </span>
              </button>
              <button
                type="button"
                className="button is-small"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="icon is-small">
                  <i className="fa fa-angle-right"></i>
                </span>
              </button>
              <button
                type="button"
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
      </div>
    </Fragment>
  );
}

export default NotificationsTable;
