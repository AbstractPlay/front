import React, { useState, useEffect, useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { gameinfo } from "@abstractplay/gameslib";
import { API_ENDPOINT_OPEN, API_ENDPOINT_AUTH } from "../config";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { Auth } from "aws-amplify";
import { Helmet } from "react-helmet-async";
import { MeContext } from "../pages/Skeleton";
import Spinner from "./Spinner";
import { useStorageState } from "react-use-storage-state";

const allSize = Number.MAX_SAFE_INTEGER;

function StandingChallenges(props) {
  const { t } = useTranslation();
  const [loggedin, loggedinSetter] = useState(false);
  const [challenges, challengesSetter] = useState([]);
  const [accepted, acceptedSetter] = useState(null);
  const [revoke, revokeSetter] = useState(null);
  const [reject, rejectSetter] = useState(null);
  const [canonical, canonicalSetter] = useState(
    "https://play.abstractplay.com/challenges/"
  );
  const { metaGame } = useParams();
  const [update, updateSetter] = useState(0);
  const [globalMe] = useContext(MeContext);
  const [showState, showStateSetter] = useStorageState("challenges-show", 20);
  const [sorting, setSorting] = useState([]);
  const [showAccepted, showAcceptedSetter] = useState(false);

  useEffect(() => {
    async function fetchAuth() {
      const usr = await Auth.currentAuthenticatedUser();
      const token = usr.signInUserSession.idToken.jwtToken;
      console.log("idToken", usr.signInUserSession.idToken);
      if (token !== null) {
        loggedinSetter(true);
      }
    }
    fetchAuth();
  }, []);

  useEffect(() => {
    async function fetchData() {
      console.log(`Fetching ${metaGame} standing challenges`);
      try {
        var url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append("query", "standing_challenges");
        url.searchParams.append("metaGame", metaGame);
        const res = await fetch(url);
        const result = await res.json();
        console.log(result);
        challengesSetter(result);
        revokeSetter(null);
        acceptedSetter(null);
      } catch (error) {
        console.log(error);
      }
    }
    fetchData();
    canonicalSetter(`https://play.abstractplay.com/challenges/${metaGame}/`);
  }, [metaGame, update]);

  useEffect(() => {
    showAcceptedSetter(
      challenges !== null &&
        challenges.find((c) => c.players.length > 1) !== undefined
    );
  }, [challenges]);

  useEffect(() => {
    async function fetchData() {
      const usr = await Auth.currentAuthenticatedUser();
      const token = usr.signInUserSession.idToken.jwtToken;
      console.log(`Submitting acceptance of ${metaGame} challenge ${accepted}`);
      try {
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: "challenge_response",
            pars: {
              id: accepted,
              metaGame: metaGame,
              standing: true,
              response: true,
            },
          }),
        });
        const result = await res.json();
        if (result.statusCode !== 200) {
          console.log("handleAccept", result.statusCode);
          console.log(JSON.parse(result.body));
        } else {
          const challenge = challenges.find((c) => c.id === accepted);
          if (challenge.numPlayers > 2) updateSetter((update) => update + 1);
        }
      } catch (error) {
        console.log("handleChallengeResponse catch", error);
        console.log(error);
      }
    }
    if (accepted) fetchData();
  }, [accepted, challenges, metaGame, updateSetter]);

  useEffect(() => {
    async function fetchData() {
      const usr = await Auth.currentAuthenticatedUser();
      const token = usr.signInUserSession.idToken.jwtToken;
      try {
        console.log("calling challenge_revoke with token: " + token);
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: "challenge_revoke",
            pars: {
              id: revoke,
              metaGame: metaGame,
              standing: true,
            },
          }),
        });
        const result = await res.json();
        if (result.statusCode !== 200) console.log(JSON.parse(result.body));
        else {
          updateSetter((update) => update + 1);
        }
      } catch (error) {
        console.log(error);
      }
    }
    if (revoke) {
      fetchData();
    }
  }, [revoke, metaGame, updateSetter]);

  useEffect(() => {
    async function fetchData() {
      const usr = await Auth.currentAuthenticatedUser();
      const token = usr.signInUserSession.idToken.jwtToken;
      console.log(`Submitting reject of ${metaGame} challenge ${reject}`);
      try {
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: "challenge_response",
            pars: {
              id: reject,
              metaGame: metaGame,
              standing: true,
              response: false,
            },
          }),
        });
        const result = await res.json();
        if (result.statusCode !== 200) {
          console.log("Reject useEffect", result.statusCode);
          console.log(JSON.parse(result.body));
        } else {
          updateSetter((update) => update + 1);
        }
      } catch (error) {
        console.log("useEffect Reject catch", error);
      }
    }
    if (reject) {
      fetchData();
      rejectSetter(null);
    }
  }, [reject, metaGame]);

  const handleAccept = async (id) => {
    acceptedSetter(id);
  };

  const handleReject = async (id) => {
    rejectSetter(id);
  };

  const handleRevoke = async (id) => {
    revokeSetter(id);
  };

  const metaGameName = gameinfo.get(metaGame).name;
  console.log(metaGame);
  const showRespond = loggedin && challenges;

  const data = useMemo(
    () =>
      challenges.map((rec) => {
        return {
          id: rec.id,
          challenger: rec.challenger,
          clockHard: rec.clockHard,
          clockStart: rec.clockStart,
          clockInc: rec.clockInc,
          clockMax: rec.clockMax,
          numPlayers: rec.numPlayers,
          players: rec.players.filter((p) => p.id !== rec.challenger.id),
          rated: rec.rated,
          seating: rec.seating,
          variants: rec.variants,
        };
      }),
    [challenges]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("challenger", {
        header: "Challenger",
        cell: (props) => props.getValue().name,
      }),
      columnHelper.accessor("numPlayers", {
        header: "Players",
      }),
      columnHelper.accessor("players", {
        header: "Accepted",
        cell: (props) =>
          props
            .getValue()
            .map((p) => p.name)
            .join(","),
      }),
      columnHelper.accessor("seating", {
        header: "Seating",
        cell: (props) =>
          props.getValue() === "random"
            ? t("SeatingRandom")
            : props.getValue() === "s1"
            ? t("seatingMeSecond")
            : t("seatingMeFirst"),
      }),
      columnHelper.accessor("variants", {
        header: "Variants",
        cell: (props) => props.getValue().join(", "),
      }),
      columnHelper.accessor("clockHard", {
        header: "Hard clock?",
        cell: (props) => (props.getValue() ? t("Yes") : t("No")),
      }),
      columnHelper.accessor("clockStart", {
        header: "Clock start",
      }),
      columnHelper.accessor("clockInc", {
        header: "Clock increment",
      }),
      columnHelper.accessor("clockMax", {
        header: "Clock max",
      }),
      columnHelper.accessor("rated", {
        header: "Rated?",
        cell: (props) => (props.getValue() ? t("Yes") : t("No")),
      }),
      columnHelper.display({
        id: "actions",
        cell: (props) =>
          globalMe === null ? null : (
            <>
              {!showRespond ? null : (
                <>
                  {props.row.original.id === accepted ? (
                    t("Accepted")
                  ) : props.row.original.id === reject ||
                    props.row.original.id === revoke ? (
                    <Spinner></Spinner>
                  ) : props.row.original.challenger.id === globalMe?.id ? (
                    <button
                      className="button is-small apButton"
                      onClick={() => handleRevoke(props.row.original.id)}
                    >
                      {t("Revoke")}
                    </button>
                  ) : props.row.original.players.find(
                      (p) => p.id === globalMe?.id
                    ) ? (
                    <button
                      className="button is-small apButton"
                      onClick={() => handleReject(props.row.original.id)}
                    >
                      {t("Reject")}
                    </button>
                  ) : (
                    <button
                      className="button is-small apButton"
                      onClick={() => handleAccept(props.row.original.id)}
                    >
                      {t("Accept")}
                    </button>
                  )}
                </>
              )}
            </>
          ),
      }),
    ],
    [columnHelper, globalMe, t, accepted, revoke, reject, showRespond]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility: {
        actions: globalMe !== null,
        players: showAccepted,
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
      <div class="columns">
        <div class="column is-half is-offset-one-quarter">
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
                {table.getPrePaginationRowModel().rows.length} total challenges)
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
        <link rel="canonical" href={canonical} />
      </Helmet>
      <article>
        <h1 className="has-text-centered title">
          {t("StandingChallenges", { name: metaGameName })}
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

export default StandingChallenges;
