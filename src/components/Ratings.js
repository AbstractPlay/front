import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { gameinfo } from "@abstractplay/gameslib";
import { API_ENDPOINT_OPEN } from "../config";
import { callAuthApi } from "../lib/api";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { MeContext, UsersContext } from "../pages/Skeleton";
import NewChallengeModal from "./NewChallengeModal";
import ActivityMarker from "./ActivityMarker";
import { useStorageState } from "react-use-storage-state";
import { Helmet } from "react-helmet-async";

const allSize = Number.MAX_SAFE_INTEGER;

function Ratings() {
  const { t } = useTranslation();
  const [ratings, ratingsSetter] = useState([]);
  const [activeChallengeModal, activeChallengeModalSetter] = useState("");
  const { metaGame } = useParams();
  const [globalMe] = useContext(MeContext);
  const [allUsers] = useContext(UsersContext);
  const [showState, showStateSetter] = useStorageState("ratings-show", 20);
  const [sorting, setSorting] = useState([{ id: "rank", desc: false }]);

  useEffect(() => {
    async function fetchData() {
      console.log(`Fetching ${metaGame} ratings`);
      try {
        var url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append("query", "ratings");
        url.searchParams.append("metaGame", metaGame);
        const res = await fetch(url);
        const result = await res.json();
        console.log(result);
        result.sort((a, b) => b.rating.rating - a.rating.rating);
        ratingsSetter(result);
      } catch (error) {
        console.log(error);
      }
    }
    fetchData();
  }, [metaGame]);

  const openChallengeModal = (name) => {
    activeChallengeModalSetter(name);
  };
  const closeChallengeModal = useCallback(() => {
    activeChallengeModalSetter("");
  }, []);

  const handleNewChallenge = useCallback(
    async (challenge) => {
      try {
        await callAuthApi("new_challenge", {
          ...challenge,
          challenger: { id: globalMe.id, name: globalMe.name },
        });
        closeChallengeModal();
      } catch (error) {
        console.log(error);
      }
    },
    [globalMe, closeChallengeModal]
  );

  const metaGameName = gameinfo.get(metaGame).name;

  const data = useMemo(
    () =>
      ratings.map((rec, idx) => {
        let lastSeen = undefined;
        if (allUsers !== null) {
          const userRec = allUsers.find((u) => u.id === rec.id);
          if (userRec !== undefined) {
            lastSeen = userRec.lastSeen;
          }
        }
        return {
          id: rec.id,
          rank: idx + 1,
          player: rec.name,
          lastSeen,
          rating: rec.rating.rating,
          n: rec.rating.N,
          wins: rec.rating.wins,
          draws: rec.rating.draws,
          winrate: rec.rating.wins / rec.rating.N,
        };
      }),
    [ratings, allUsers]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("rank", {
        header: "Rank",
      }),
      columnHelper.accessor("player", {
        header: "Player",
        cell: (props) => (
          <>
            <Link to={`/player/${props.row.original.id}`}>
              {props.getValue()}
            </Link>
            {props.row.original.lastSeen === undefined ? null : (
              <>
                &nbsp;
                <ActivityMarker
                  lastSeen={props.row.original.lastSeen}
                  size="s"
                />
              </>
            )}
          </>
        ),
      }),
      columnHelper.accessor("rating", {
        header: "Rating",
        cell: (props) => Math.trunc(props.getValue()),
      }),
      columnHelper.accessor("n", {
        header: "Games played",
      }),
      columnHelper.accessor("wins", {
        header: "Games won",
      }),
      columnHelper.accessor("winrate", {
        header: "Win rate",
        cell: (props) => Math.round(props.getValue() * 10000) / 100 + "%",
      }),
      columnHelper.accessor("draws", {
        header: "Games drawn",
      }),
      columnHelper.display({
        id: "actions",
        cell: (props) =>
          globalMe !== null && globalMe.id === props.row.original.id ? null : (
            <>
              <NewChallengeModal
                show={
                  activeChallengeModal !== "" &&
                  activeChallengeModal === props.row.original.id
                }
                handleClose={closeChallengeModal}
                handleChallenge={handleNewChallenge}
                fixedMetaGame={metaGame}
                opponent={{
                  id: props.row.original.id,
                  name: props.row.original.player,
                }}
              />
              <button
                className="button is-small apButton"
                onClick={() => openChallengeModal(props.row.original.id)}
              >
                Issue Challenge
              </button>
            </>
          ),
      }),
    ],
    [activeChallengeModal, columnHelper, globalMe, handleNewChallenge, metaGame]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility: {
        actions: globalMe !== null,
      },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  useEffect(() => {
    table.setPageSize(showState);
  }, [showState, table]);

  const tableNavigation = (
    <>
      <div className="columns tableNav">
        <div className="column is-half is-offset-one-quarter">
          <div className="level smallerText has-text-centered">
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
                {table.getPrePaginationRowModel().rows.length} total players)
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
      </div>
    </>
  );

  return (
    <>
      <Helmet>
        <meta property="og:title" content={`${metaGameName}: Ratings`} />
        <meta
          property="og:url"
          content={`https://play.abstractplay.com/ratings/${metaGame}`}
        />
        <meta
          property="og:description"
          content={`Ratings for ${metaGameName}`}
        />
      </Helmet>
      <article>
        <h1 className="has-text-centered title">
          {t("RatingsList", { name: metaGameName })}
        </h1>
        <div className="container">
          {tableNavigation}
          <table
            className="table apTable"
            style={{ marginLeft: "auto", marginRight: "auto" }}
          >
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {tableNavigation}
        </div>
      </article>
    </>
  );
}

export default Ratings;
