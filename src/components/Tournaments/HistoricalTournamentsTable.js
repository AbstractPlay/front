import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { useStorageState } from "react-use-storage-state";
import { API_ENDPOINT_OPEN } from "../../config";
import { getGameDisplayName } from "../../lib/gameOptions";
import { formatVariantsJoined } from "../../lib/expandVariants";
import { variantSelectionSortingFn } from "../../lib/variantTableSort";
import { useTranslation } from "react-i18next";
import PageLoading from "../shared/PageLoading";
import { useSyncTablePageSize } from "../../hooks/useTanstackTableEffects";
import { tournamentDetailPathArchived } from "../../lib/tournamentRoutes";
import TournamentFormatBadge from "./TournamentFormatBadge";

async function fetchOldTournamentsForGame(metaGame) {
  const url = new URL(API_ENDPOINT_OPEN);
  url.searchParams.append("query", "get_old_tournaments");
  url.searchParams.append("metaGame", metaGame);
  const res = await fetch(url);
  if (res.status !== 200) {
    const result = await res.json();
    console.log(JSON.parse(result.body));
    return [];
  }
  const data = await res.json();
  return data.tournaments ?? [];
}

/**
 * Archived and superseded completed tournaments (`get_old_tournaments`).
 * Requires `filterMeta` (single game).
 */
function HistoricalTournamentsTable({
  filterMeta = null,
  registeredOnly = false,
  starredOnly = false,
  globalMe = null,
}) {
  const { t, i18n } = useTranslation();
  const [tournaments, tournamentsSetter] = useState(null);
  const [sorting, sortingSetter] = useState([{ id: "dateEnded", desc: true }]);
  const [historicalTournamentsShowState, historicalTournamentsShowStateSetter] =
    useStorageState("historical-tournaments-show", 20);
  const allSize = Number.MAX_SAFE_INTEGER;

  const gamesToLoad = useMemo(
    () => (filterMeta ? [filterMeta] : []),
    [filterMeta]
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      if (gamesToLoad.length === 0) {
        tournamentsSetter([]);
        return;
      }
      tournamentsSetter(null);
      try {
        const batches = await Promise.all(
          gamesToLoad.map((metaGame) => fetchOldTournamentsForGame(metaGame))
        );
        if (!cancelled) {
          tournamentsSetter(batches.flat());
        }
      } catch (error) {
        console.log(error);
        if (!cancelled) {
          tournamentsSetter([]);
        }
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [gamesToLoad]);

  const oldTournamentsData = useMemo(() => {
    return (tournaments ?? [])
      .map((tournament) => ({
        tournamentid: tournament.id,
        metaGameName: getGameDisplayName(tournament.metaGame, "Unknown"),
        metaGame: tournament.metaGame,
        variantUids: [...(tournament.variants ?? [])],
        variants: formatVariantsJoined(tournament.metaGame, tournament.variants),
        number: tournament.number,
        matchLegs: tournament.matchLegs,
        dateStarted: tournament.dateStarted,
        dateEnded: tournament.dateEnded,
        winner: tournament.divisions[1].winner,
        numPlayers: tournament.players?.length ?? 0,
        players: tournament.players ?? [],
      }))
      .filter(
        (rec) =>
          !globalMe || !starredOnly || globalMe.stars.includes(rec.metaGame)
      )
      .filter(
        (rec) =>
          !globalMe || !registeredOnly || rec.players.includes(globalMe.id)
      );
  }, [tournaments, registeredOnly, starredOnly, globalMe]);

  const oldTournamentsColumnHelper = createColumnHelper();
  const oldTournamentsColumns = useMemo(
    () => [
      oldTournamentsColumnHelper.accessor("variants", {
        header: t("tables.variants"),
        cell: (props) => props.getValue(),
        sortingFn: variantSelectionSortingFn({
          getMeta: (row) => row.original.metaGame,
          getUids: (row) => row.original.variantUids ?? [],
          locale: i18n.language,
        }),
      }),
      oldTournamentsColumnHelper.accessor("matchLegs", {
        header: t("Tournament.Format"),
        cell: (props) => (
          <TournamentFormatBadge matchLegs={props.getValue()} />
        ),
        enableSorting: false,
      }),
      oldTournamentsColumnHelper.accessor("number", {
        header: t("Tournament.Number"),
        cell: (props) => props.getValue(),
      }),
      oldTournamentsColumnHelper.accessor("dateStarted", {
        header: t("Tournament.Started"),
        cell: (props) => new Date(props.getValue()).toLocaleDateString(),
      }),
      oldTournamentsColumnHelper.accessor("dateEnded", {
        header: t("Tournament.Ended"),
        cell: (props) => new Date(props.getValue()).toLocaleDateString(),
      }),
      oldTournamentsColumnHelper.accessor("numPlayers", {
        header: t("Tournament.Participants"),
        cell: (props) => props.getValue(),
      }),
      oldTournamentsColumnHelper.accessor("winner", {
        header: t("Tournament.Winner"),
        cell: (props) => props.getValue(),
      }),
      oldTournamentsColumnHelper.display({
        id: "actions",
        cell: (props) => (
          <Link
            to={tournamentDetailPathArchived(
              props.row.original.tournamentid,
              props.row.original.metaGame
            )}
          >
            {t("Tournament.Visit")}
          </Link>
        ),
      }),
    ],
    [oldTournamentsColumnHelper, t, i18n.language]
  );

  const oldTournamentsTable = useReactTable({
    data: oldTournamentsData,
    columns: oldTournamentsColumns,
    state: {
      sorting,
    },
    autoResetPageIndex: false,
    onSortingChange: sortingSetter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  useSyncTablePageSize(oldTournamentsTable, historicalTournamentsShowState);

  const oldTournamentsTableNavigation = (
    <div className="columns tableNav">
      <div className="column is-half is-offset-one-quarter">
        <div className="level smallerText has-text-centered">
          <div className="level-item">
            <button
              type="button"
              className="button is-small"
              onClick={() => oldTournamentsTable.setPageIndex(0)}
              disabled={!oldTournamentsTable.getCanPreviousPage()}
            >
              <span className="icon is-small">
                <i className="fa fa-angle-double-left"></i>
              </span>
            </button>
            <button
              type="button"
              className="button is-small"
              onClick={() => oldTournamentsTable.previousPage()}
              disabled={!oldTournamentsTable.getCanPreviousPage()}
            >
              <span className="icon is-small">
                <i className="fa fa-angle-left"></i>
              </span>
            </button>
            <button
              type="button"
              className="button is-small"
              onClick={() => oldTournamentsTable.nextPage()}
              disabled={!oldTournamentsTable.getCanNextPage()}
            >
              <span className="icon is-small">
                <i className="fa fa-angle-right"></i>
              </span>
            </button>
            <button
              type="button"
              className="button is-small"
              onClick={() =>
                oldTournamentsTable.setPageIndex(
                  oldTournamentsTable.getPageCount() - 1
                )
              }
              disabled={!oldTournamentsTable.getCanNextPage()}
            >
              <span className="icon is-small">
                <i className="fa fa-angle-double-right"></i>
              </span>
            </button>
          </div>
          <div className="level-item">
            <p>
              Page{" "}
              <strong>
                {oldTournamentsTable.getState().pagination.pageIndex + 1}
              </strong>{" "}
              of <strong>{oldTournamentsTable.getPageCount()}</strong> (
              {oldTournamentsTable.getPrePaginationRowModel().rows.length}{" "}
              total tournaments)
            </p>
          </div>
          <div className="level-item">
            <div className="control">
              <div className="select is-small">
                <select
                  value={oldTournamentsTable.getState().pagination.pageSize}
                  onChange={(e) => {
                    historicalTournamentsShowStateSetter(Number(e.target.value));
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
  );

  if (tournaments === null) {
    return <PageLoading message={t("Tournament.loading")} />;
  }

  if (oldTournamentsData.length === 0) {
    return (
      <p className="has-text-centered">{t("Tournament.NoneOld")}</p>
    );
  }

  return (
    <>
      <table
        className="table apTable"
        style={{ marginLeft: "auto", marginRight: "auto" }}
      >
        <thead>
          {oldTournamentsTable.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder ? null : (
                    <div
                      className={
                        header.column.getCanSort() ? "sortable" : undefined
                      }
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: (
                          <>
                            &nbsp;
                            <i className="fa fa-angle-up"></i>
                          </>
                        ),
                        desc: (
                          <>
                            &nbsp;
                            <i className="fa fa-angle-down"></i>
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
          {oldTournamentsTable.getRowModel().rows.map((row) => (
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
      {oldTournamentsData.length > 10 ? oldTournamentsTableNavigation : null}
    </>
  );
}

export default HistoricalTournamentsTable;
