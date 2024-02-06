import React, { useState, useEffect, useMemo, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import { Auth } from "aws-amplify";
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
import { API_ENDPOINT_AUTH, API_ENDPOINT_OPEN } from "../../config";
import NewTournamentModal from "./NewTournamentModal";
import { MeContext } from "../../pages/Skeleton";
import { gameinfo } from "@abstractplay/gameslib";
import { useTranslation } from "react-i18next";

function Tournaments(props) {
  const { t } = useTranslation();
  const [update, updateSetter] = useState(0);
  const [showNewTournamentModal, showNewTournamentModalSetter] = useState(false);
  const [tournaments, tournamentsSetter] = useState([]);
  const [tournamentsToArchive, tournamentsToArchiveSetter] = useState(false);
  const [globalMe] = useContext(MeContext);
  const [openTournamentSorting, openTournamentSortingSetter] = useState([{ id: "metaGame", desc: false }]);
  const [currentTournamentSorting, currentTournamentSortingSetter] = useState([{ id: "metaGame", desc: false }]);
  const [completedTournamentSorting, completedTournamentSortingSetter] = useState([{ id: "metaGameName", desc: false }]);
  const [openTournamentsShowState, openTournamentsShowStateSetter] = useStorageState("open-tournaments-show", 20);
  const [currentTournamentsShowState, currentTournamentsShowStateSetter] = useStorageState("current-tournaments-show", 20);
  const [completedTournamentsShowState, completedTournamentsShowStateSetter] = useStorageState("completed-tournaments-show", 20);
  const [registeredOnly, registeredOnlySetter] = useStorageState("tournaments-registered-only", false);

  const allSize = Number.MAX_SAFE_INTEGER;

  useEffect(() => {
    async function fetchData() {
      let url = new URL(API_ENDPOINT_OPEN);
      url.searchParams.append("query", "get_tournaments");
      const res = await fetch(url);
      const status = res.status;
      if (status !== 200) {
        const result = await res.json();
        console.log(JSON.parse(result.body));
      } else {
        const data = await res.json();
        let newtournaments = data.tournaments.map((t) => {return {...t, players: []}});
        for (let player of data.tournamentPlayers) {
          const ids = player.sk.split('#');
          const playerid = ids[2];
          const tournamentid = ids[0];
          const tournament = newtournaments.find((t) => t.id === tournamentid);
          if (tournament) {
            tournament.players.push(playerid);
          }
        }
        let toArchive = false;
        let latestCompleted = new Map();
        for (const tournament of newtournaments) {
          if (tournament.dateEnded !== undefined) {
            const key = tournament.metaGame + "#" + tournament.variants.sort().join("|");
            let latest = latestCompleted.get(key);
            if (latest === undefined || tournament.dateEnded > latest) {
              latestCompleted.set(key, tournament.dateEnded);
            }
          }
        }
        newtournaments = newtournaments.filter((tournament) => {
          if (tournament.dateEnded !== undefined) {
            const key = tournament.metaGame + "#" + tournament.variants.sort().join("|");
            if (tournament.dateEnded < latestCompleted.get(key)) {
              toArchive = true;
              return false;
            }
          }
          return true;
        });
        tournamentsSetter(newtournaments);
        if (toArchive)
          tournamentsToArchiveSetter(true);
      }
    }
    fetchData();
  }, [update]);

  useEffect(() => {
    async function archive() {
      try {
        let url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append("query", "archive_tournaments");
        const res = await fetch(url);
        const status = res.status;
        if (status !== 200) {
          const result = await res.json();
          console.log("Error");
          console.log(result);
        }
      } catch (error) {
        console.log("Error");
        console.log(error);
      }
    }
    if (tournamentsToArchive)
      archive();
  }, [tournamentsToArchive]);

  const handleNewTournamentClick = () => {
    showNewTournamentModalSetter(true);
  };

  const handleNewTournamentClose = () => {
    showNewTournamentModalSetter(false);
  };

  const handleNewTournament = async (tournament) => {
    const variantsKey = tournament.variants.sort().join("|");
    if (tournaments.find((t) => t.metaGame === tournament.metaGame && t.variants.sort().join("|") === variantsKey))
      return false;
    showNewTournamentModalSetter(false);
    try {
      const usr = await Auth.currentAuthenticatedUser();
      const res = await fetch(API_ENDPOINT_AUTH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
        },
        body: JSON.stringify({
          query: "new_tournament",
          pars: tournament
        })});
        let status = res.status;
        if (status !== 200) {
          const result = await res.json();
          console.log("Error: ", result);
        } else {
          updateSetter(update + 1);
        }
    } catch (error) {
      console.log(error);
    }
  };

  const handleWithdrawTournament = useCallback(
    async (tournamentid) => {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
          },
          body: JSON.stringify({
            query: "withdraw_tournament",
            pars: { tournamentid }
          })});
        let status = res.status;
        if (status !== 200) {
          const result = await res.json();
          console.log("Error: ", result);
        } else {
          updateSetter(update + 1);
        }
      } catch (error) {
        console.log(error);
      }
    }, [update, updateSetter]
  );

  const handleJoinTournament = useCallback(
    async (tournamentid) => {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
          },
          body: JSON.stringify({
            query: "join_tournament",
            pars: { tournamentid }
          })});
        let status = res.status;
        if (status !== 200) {
          const result = await res.json();
          console.log("Error: ", result);
        } else {
          updateSetter(update + 1);
        }
      } catch (error) {
        console.log(error);
      }
    }, [update, updateSetter]
  );

  const openTournamentsData = useMemo(
    () => {
      const oneWeek = 1000 * 60 * 60 * 24 * 7;
      const twoWeeks = oneWeek * 2;
      return tournaments.filter((t) => !t.started).map((t, idx) => {
        let date1 = t.dateCreated + twoWeeks;
        const date2 = t.datePreviousEnded + oneWeek;
        if (date2 && date2 > date1)
          date1 = date2;
        return {
          tournamentid: t.id,
          metaGame: gameinfo.get(t.metaGame).name,
          variants: t.variants.join(", "),
          number: t.number,
          startDate: date1,
          players: t.players,
        };
      }).filter(rec => !globalMe || !registeredOnly || (globalMe && rec.players.includes(globalMe.id)))},
    [tournaments, registeredOnly, globalMe]
  );

  const openTournamentsColumnHelper = createColumnHelper();
  const openTournamentsColumns = useMemo(
    () => [
      openTournamentsColumnHelper.accessor("metaGame", {
        header: t("Game"),
        cell: (props) => props.getValue()
      }),
      openTournamentsColumnHelper.accessor("variants", {
        header: t("Variants"),
        cell: (props) => props.getValue()
      }),
      openTournamentsColumnHelper.accessor("number", {
        header: t("Tournament.Number"),
        cell: (props) => props.getValue(),
      }),
      openTournamentsColumnHelper.accessor("startDate", {
        header: t("Tournament.Starts"),
        cell: (props) => props.getValue() > 3000000000000 ? "One week after current tournament ends" : (new Date(props.getValue())).toLocaleDateString(),
      }),
      openTournamentsColumnHelper.accessor("players", {
        header: t("Tournament.Participants"),
        cell: (props) => props.getValue().length,
        sortingFn: (
          rowA,
          rowB,
          columnId
        ) => {
          const numA = rowA.getValue(columnId).length;
          const numB = rowB.getValue(columnId).length;
          return numA < numB ? 1 : numA > numB ? -1 : 0;
        }
      }),
      openTournamentsColumnHelper.display({
        id: "actions",
        cell: (props) => ! globalMe ?
          null :
          props.row.original.players.includes(globalMe.id) ?
          <button
            className="button is-small apButton"
            onClick={() => handleWithdrawTournament(props.row.original.tournamentid)}
            >
            {t("Tournament.Withdraw")}
          </button>
          :
          <button
            className="button is-small apButton"
            onClick={() => handleJoinTournament(props.row.original.tournamentid)}
          >
            {t("Tournament.Join")}
          </button>
      }),
    ],
    [globalMe, openTournamentsColumnHelper, handleJoinTournament, handleWithdrawTournament, t]
  );

  const openTournamentsTable = useReactTable({
    data: openTournamentsData || [], // Ensure openTournamentsData is not undefined
    columns: openTournamentsColumns,
    state: {
      sorting: openTournamentSorting,
    },
    columnVisibility: {
      actions: globalMe !== null,
    },
    onSortingChange: openTournamentSortingSetter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  useEffect(() => {
    openTournamentsTable.setPageSize(openTournamentsShowState);
  }, [openTournamentsShowState, openTournamentsTable]);

  const openTournamentsTableNavigation = (
    <>
      <div className="columns">
        <div className="column is-half is-offset-one-quarter">
          <div className="level smallerText has-text-centered">
            <div className="level-item">
              <button
                className="button is-small"
                onClick={() => openTournamentsTable.setPageIndex(0)}
                disabled={!openTournamentsTable.getCanPreviousPage()}
              >
                <span className="icon is-small">
                  <i className="fa fa-angle-double-left"></i>
                </span>
              </button>
              <button
                className="button is-small"
                onClick={() => openTournamentsTable.previousPage()}
                disabled={!openTournamentsTable.getCanPreviousPage()}
              >
                <span className="icon is-small">
                  <i className="fa fa-angle-left"></i>
                </span>
              </button>
              <button
                className="button is-small"
                onClick={() => openTournamentsTable.nextPage()}
                disabled={!openTournamentsTable.getCanNextPage()}
              >
                <span className="icon is-small">
                  <i className="fa fa-angle-right"></i>
                </span>
              </button>
              <button
                className="button is-small"
                onClick={() => openTournamentsTable.setPageIndex(openTournamentsTable.getPageCount() - 1)}
                disabled={!openTournamentsTable.getCanNextPage()}
              >
                <span className="icon is-small">
                  <i className="fa fa-angle-double-right"></i>
                </span>
              </button>
            </div>
            <div className="level-item">
              <p>
                Page{" "}
                <strong>{openTournamentsTable.getState().pagination.pageIndex + 1}</strong> of{" "}
                <strong>{openTournamentsTable.getPageCount()}</strong> (
                {openTournamentsTable.getPrePaginationRowModel().rows.length} total tournaments)
              </p>
            </div>
            <div className="level-item">
              <div className="control">
                <div className="select is-small">
                  <select
                    value={openTournamentsTable.getState().pagination.pageSize}
                    onChange={(e) => {
                      openTournamentsShowStateSetter(Number(e.target.value));
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

  const currentTournamentsData = useMemo(
    () => {
      return tournaments.filter((t) => t.started && !t.dateEnded).map((t, idx) => {
        return {
          tournamentid: t.id,
          metaGame: gameinfo.get(t.metaGame).name,
          variants: t.variants.join(", "),
          number: t.number,
          dateStarted: t.dateStarted,
          players: t.players,
          completion: {
            numCompleted: Object.values(t.divisions).reduce((acc, d) => acc + d.numCompleted, 0),
            numGames: Object.values(t.divisions).reduce((acc, d) => acc + d.numGames, 0),
          }
        };
      }).filter(rec => !globalMe || !registeredOnly || (globalMe && rec.players.includes(globalMe.id)))},
    [tournaments, registeredOnly, globalMe]
  );

  const currentTournamentsColumnHelper = createColumnHelper();
  const currentTournamentsColumns = useMemo(
    () => [
      currentTournamentsColumnHelper.accessor("metaGame", {
        header: t("Game"),
        cell: (props) => props.getValue()
      }),
      currentTournamentsColumnHelper.accessor("variants", {
        header: t("Variants"),
        cell: (props) => props.getValue()
      }),
      currentTournamentsColumnHelper.accessor("number", {
        header: t("Tournament.Number"),
        cell: (props) => props.getValue(),
      }),
      currentTournamentsColumnHelper.accessor("dateStarted", {
        header: t("Tournament.Started"),
        cell: (props) => (new Date(props.getValue())).toLocaleDateString(),
      }),
      currentTournamentsColumnHelper.accessor("players", {
        header: t("Tournament.Participants"),
        cell: (props) => props.getValue().length,
        sortingFn: (
          rowA,
          rowB,
          columnId
        ) => {
          const numA = rowA.getValue(columnId).length;
          const numB = rowB.getValue(columnId).length;
          return numA < numB ? 1 : numA > numB ? -1 : 0;
        }
      }),
      currentTournamentsColumnHelper.accessor("completion", {
        header: t("Tournament.Completion"),
        cell: (props) => t("Tournament.CompletionRate", { "ratio": `${props.getValue().numCompleted}/${props.getValue().numGames}`, "percent": Math.round((props.getValue().numCompleted/props.getValue().numGames) * 100).toString()}),
        sortingFn: (
          rowA,
          rowB,
          columnId
        ) => {
          const numA = rowA.getValue(columnId).numCompleted/rowA.getValue(columnId).numGames;
          const numB = rowB.getValue(columnId).numCompleted/rowB.getValue(columnId).numGames;
          if (numA === numB) {
            return rowA.getValue(columnId).numCompleted - rowB.getValue(columnId).numCompleted;
          } else {
            return numA - numB;
          }
        }
      }),
      currentTournamentsColumnHelper.display({
        id: "actions",
        cell: (props) => (
          <Link
            to={`/tournament/${props.row.original.tournamentid}`}
          >
            {t("Tournament.Visit")}
          </Link>
        ),
      }),

    ],
    [currentTournamentsColumnHelper, t]
  );

  const currentTournamentsTable = useReactTable({
    data: currentTournamentsData || [], // Ensure currentTournamentsData is not undefined
    columns: currentTournamentsColumns,
    state: {
      sorting: currentTournamentSorting,
    },
    columnVisibility: {
      actions: globalMe !== null,
    },
    onSortingChange: currentTournamentSortingSetter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  useEffect(() => {
    currentTournamentsTable.setPageSize(currentTournamentsShowState);
  }, [currentTournamentsShowState, currentTournamentsTable]);

  const currentTournamentsTableNavigation = (
    <>
      <div className="columns">
        <div className="column is-half is-offset-one-quarter">
          <div className="level smallerText has-text-centered">
            <div className="level-item">
              <button
                className="button is-small"
                onClick={() => currentTournamentsTable.setPageIndex(0)}
                disabled={!currentTournamentsTable.getCanPreviousPage()}
              >
                <span className="icon is-small">
                  <i className="fa fa-angle-double-left"></i>
                </span>
              </button>
              <button
                className="button is-small"
                onClick={() => currentTournamentsTable.previousPage()}
                disabled={!currentTournamentsTable.getCanPreviousPage()}
              >
                <span className="icon is-small">
                  <i className="fa fa-angle-left"></i>
                </span>
              </button>
              <button
                className="button is-small"
                onClick={() => currentTournamentsTable.nextPage()}
                disabled={!currentTournamentsTable.getCanNextPage()}
              >
                <span className="icon is-small">
                  <i className="fa fa-angle-right"></i>
                </span>
              </button>
              <button
                className="button is-small"
                onClick={() => currentTournamentsTable.setPageIndex(currentTournamentsTable.getPageCount() - 1)}
                disabled={!currentTournamentsTable.getCanNextPage()}
              >
                <span className="icon is-small">
                  <i className="fa fa-angle-double-right"></i>
                </span>
              </button>
            </div>
            <div className="level-item">
              <p>
                Page{" "}
                <strong>{currentTournamentsTable.getState().pagination.pageIndex + 1}</strong> of{" "}
                <strong>{currentTournamentsTable.getPageCount()}</strong> (
                {currentTournamentsTable.getPrePaginationRowModel().rows.length} total tournaments)
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
                    value={currentTournamentsTable.getState().pagination.pageSize}
                    onChange={(e) => {
                      currentTournamentsShowStateSetter(Number(e.target.value));
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

  const completedTournamentsData = useMemo(
    () => {
      return tournaments.filter((t) => t.dateEnded).map((t) => {
        return {
          tournamentid: t.id,
          metaGameName: gameinfo.get(t.metaGame).name,
          metaGame: t.metaGame,
          variants: t.variants.join(", "),
          number: t.number,
          dateStarted: t.dateStarted,
          dateEnded: t.dateEnded,
          winner: t.divisions[1].winner,
          numPlayers: t.players.length,
          players: t.players,
        };
      }).filter(rec => !globalMe || !registeredOnly || (globalMe && rec.players.includes(globalMe.id)))},
    [tournaments, registeredOnly, globalMe]
  );

  const completedTournamentsColumnHelper = createColumnHelper();
  const completedTournamentsColumns = useMemo(
    () => [
      completedTournamentsColumnHelper.accessor("metaGameName", {
        header: t("Game"),
        cell: (props) => props.getValue()
      }),
      completedTournamentsColumnHelper.accessor("variants", {
        header: t("Variants"),
        cell: (props) => props.getValue()
      }),
      completedTournamentsColumnHelper.accessor("number", {
        header: t("Tournament.Number"),
        cell: (props) => props.getValue(),
      }),
      completedTournamentsColumnHelper.accessor("dateStarted", {
        header: t("Tournament.Started"),
        cell: (props) => (new Date(props.getValue())).toLocaleDateString(),
      }),
      completedTournamentsColumnHelper.accessor("dateEnded", {
        header: t("Tournament.Ended"),
        cell: (props) => (new Date(props.getValue())).toLocaleDateString(),
      }),
      completedTournamentsColumnHelper.accessor("numPlayers", {
        header: t("Tournament.Participants"),
        cell: (props) => props.getValue(),
      }),
      completedTournamentsColumnHelper.accessor("winner", {
        header: t("Tournament.Winner"),
        cell: (props) => props.getValue(),
      }),
      completedTournamentsColumnHelper.display({
        id: "actions",
        cell: (props) => (
          <Link
            to={`/tournament/${props.row.original.tournamentid}`}
          >
            {t("Tournament.Visit")}
          </Link>
        ),
      }),
      completedTournamentsColumnHelper.display({
        id: "actions2",
        cell: (props) => (
          props.row.original.number > 1 ?
          <Link
            to={`/tournamenthistory/${props.row.original.metaGame}`}
          >
            {t("Tournament.History")}
          </Link>
          : null
        ),
      }),
    ],
    [completedTournamentsColumnHelper, t]
  );

  const completedTournamentsTable = useReactTable({
    data: completedTournamentsData || [],
    columns: completedTournamentsColumns,
    state: {
      sorting: completedTournamentSorting,
    },
    columnVisibility: {
      actions: globalMe !== null,
    },
    onSortingChange: completedTournamentSortingSetter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  useEffect(() => {
    completedTournamentsTable.setPageSize(completedTournamentsShowState);
  }, [completedTournamentsShowState, completedTournamentsTable]);

  const completedTournamentsTableNavigation = (
    <>
      <div className="columns">
        <div className="column is-half is-offset-one-quarter">
          <div className="level smallerText has-text-centered">
            <div className="level-item">
              <button
                className="button is-small"
                onClick={() => completedTournamentsTable.setPageIndex(0)}
                disabled={!completedTournamentsTable.getCanPreviousPage()}
              >
                <span className="icon is-small">
                  <i className="fa fa-angle-double-left"></i>
                </span>
              </button>
              <button
                className="button is-small"
                onClick={() => completedTournamentsTable.previousPage()}
                disabled={!completedTournamentsTable.getCanPreviousPage()}
              >
                <span className="icon is-small">
                  <i className="fa fa-angle-left"></i>
                </span>
              </button>
              <button
                className="button is-small"
                onClick={() => completedTournamentsTable.nextPage()}
                disabled={!completedTournamentsTable.getCanNextPage()}
              >
                <span className="icon is-small">
                  <i className="fa fa-angle-right"></i>
                </span>
              </button>
              <button
                className="button is-small"
                onClick={() => completedTournamentsTable.setPageIndex(completedTournamentsTable.getPageCount() - 1)}
                disabled={!completedTournamentsTable.getCanNextPage()}
              >
                <span className="icon is-small">
                  <i className="fa fa-angle-double-right"></i>
                </span>
              </button>
            </div>
            <div className="level-item">
              <p>
                Page{" "}
                <strong>{completedTournamentsTable.getState().pagination.pageIndex + 1}</strong> of{" "}
                <strong>{completedTournamentsTable.getPageCount()}</strong> (
                {completedTournamentsTable.getPrePaginationRowModel().rows.length} total tournaments)
              </p>
            </div>
            <div className="level-item">
              <div className="control">
                <div className="select is-small">
                  <select
                    value={completedTournamentsTable.getState().pagination.pageSize}
                    onChange={(e) => {
                      completedTournamentsShowStateSetter(Number(e.target.value));
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
      <article className="content">
        <h1 className="title has-text-centered">{t("Tournament.Tournaments")}</h1>
        <p>{t("Tournament.Description")}</p>
        {globalMe === undefined || globalMe === null ? null :
            <div className="field">
                <div className="control">
                    <label class="checkbox">
                        <input
                            type="checkbox"
                            defaultChecked={registeredOnly}
                            onClick={() => registeredOnlySetter(!registeredOnly)}
                        />
                        Only show tournaments you're participating in
                    </label>
                </div>
            </div>
        }
        <div className="columns is-multiline">
          <div className="column content is-10 is-offset-1">
            <div className="card" key='completed_tournaments'>
              <header className="card-header">
                <p className="card-header-title">
                  {t("Tournament.RecentlyCompleted")}
                </p>
              </header>
              <div className="card-content">
                { completedTournamentsData.length === 0 ?
                  t("Tournament.NoneCompleted")
                  :
                  <>
                    <table
                      className="table apTable"
                      style={{ marginLeft: "auto", marginRight: "auto" }}
                    >
                      <thead>
                        {completedTournamentsTable.getHeaderGroups().map((headerGroup) => (
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
                        {completedTournamentsTable.getRowModel().rows.map((row) => (
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
                    { completedTournamentsData.length > 10 ? completedTournamentsTableNavigation : null }
                  </>
                }
              </div>
            </div>
          </div>
          <div className="column content is-10 is-offset-1">
            <div className="card" key='open_tournaments'>
              <header className="card-header">
                <p className="card-header-title">
                  {t("Tournament.Open")}
                </p>
              </header>
              <div className="card-content">
                { /* <RecentTournamentsTable tournaments={recentTournaments} /> */ }
                <table
                  className="table apTable"
                  style={{ marginLeft: "auto", marginRight: "auto" }}
                >
                  <thead>
                    {openTournamentsTable.getHeaderGroups().map((headerGroup) => (
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
                    {openTournamentsTable.getRowModel().rows.map((row) => (
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
                { openTournamentsData.length > 10 ? openTournamentsTableNavigation : null }
              </div>
            </div>
          </div>
          <div className="column content is-10 is-offset-1">
            <div className="card" key='current_tournaments'>
              <header className="card-header">
                <p className="card-header-title">
                  {t("Tournament.Current")}
                </p>
              </header>
              <div className="card-content">
                <table
                  className="table apTable"
                  style={{ marginLeft: "auto", marginRight: "auto" }}
                >
                  <thead>
                    {currentTournamentsTable.getHeaderGroups().map((headerGroup) => (
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
                    {currentTournamentsTable.getRowModel().rows.map((row) => (
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
                { currentTournamentsData.length > 10 ? currentTournamentsTableNavigation : null }
              </div>
            </div>
          </div>
          { ! globalMe ? null :
            <div className="column content is-10 is-offset-1">
              <div className="card" key='new_tournaments'>
                <header className="card-header">
                  <p className="card-header-title">
                    {t("Tournament.New2")}
                  </p>
                </header>
                <div className="card-content">
                <p>
                    <button
                      className="button is-small apButton"
                      onClick={() => handleNewTournamentClick()}
                    >
                      {t("Tournament.ProposeNew")}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          }
        </div>
      </article>
      <NewTournamentModal
        show={showNewTournamentModal}
        handleClose={handleNewTournamentClose}
        handleNewTournament={handleNewTournament}
      />
    </>
  );
}

export default Tournaments;
