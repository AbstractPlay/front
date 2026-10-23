import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { gameinfo } from "@abstractplay/gameslib";

import { useTranslation } from "react-i18next";
import { API_ENDPOINT_OPEN } from "../../config";
import PageHelmet from "../PageHelmet";
import PageLoading from "../shared/PageLoading";
import NotFound from "../NotFound";
import { useStore } from "../../stores";
import BotAwareName from "../Bots/BotAwareName";
import { formatVariantsJoined } from "../../lib/expandVariants";
import TournamentFormatBadge from "./TournamentFormatBadge";
import {
  shouldNormalizeTournamentDetailUrl,
  tournamentDetailPath,
} from "../../lib/seoCanonical";
import {
  RECORDS_DOWNLOAD_LINK_REL,
  RECORDS_DOWNLOAD_URLS,
} from "../../lib/summaryFetch";
import UserChats from "../GameMove/UserChats";
import { callAuthApi } from "../../lib/api";
import { parseAuthResponse } from "../../lib/parseAuthResponse";
import {
  canCommentTournamentChat,
  tournamentChatPlayers,
} from "../../lib/tournamentChat";
import { parseTournamentDetailResponse } from "../../lib/tournamentDetailData";

async function reportError(error) {
  try {
    const res = await fetch(API_ENDPOINT_OPEN, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "report_problem",
        pars: {
          error: error,
        },
      }),
    });

    const status = res.status;
    if (status !== 200) {
      const result = await res.json();
      console.log(JSON.parse(result.body));
    }
  } catch (e) {
    console.log(`Error reporting error: ${e}`);
  }
}

function Tournament(props) {
  const { t } = useTranslation();
  const allUsers = useStore((state) => state.users);
  const globalMe = useStore((state) => state.globalMe);
  const wsSend = useStore((state) => state.wsSend);
  const [tournament, tournamentSetter] = useState(null);
  const [fetchStatus, fetchStatusSetter] = useState("loading");
  const [divisions, divisionsSetter] = useState([]);
  const [comments, commentsSetter] = useState([]);
  const [tournamentPlayerRows, tournamentPlayerRowsSetter] = useState([]);
  const [screenWidth, screenWidthSetter] = useState(window.innerWidth);
  const { tournamentid } = useParams();
  const { metaGame } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const canonicalPath = tournamentDetailPath(tournamentid);

  // Get query parameters for game fixing
  const searchParams = new URLSearchParams(location.search);
  const gameId = searchParams.get("gameId");
  const gameMetaGame = searchParams.get("metaGame");

  const effectiveMetaGame = metaGame || gameMetaGame || "undefined";
  const isArchived = !!metaGame;

  const clearTournamentState = useCallback(() => {
    tournamentSetter(null);
    divisionsSetter([]);
    commentsSetter([]);
    tournamentPlayerRowsSetter([]);
  }, []);

  const fetchTournamentData = useCallback(async () => {
    try {
      const url = new URL(API_ENDPOINT_OPEN);
      url.searchParams.append("query", "get_tournament");
      url.searchParams.append("tournamentid", tournamentid);
      url.searchParams.append("metaGame", effectiveMetaGame);
      url.searchParams.append("isArchived", isArchived.toString());
      if (gameId) {
        url.searchParams.append("gameId", gameId);
      }
      const res = await fetch(url);
      if (res.status !== 200) {
        try {
          const result = await res.json();
          console.log(JSON.parse(result.body));
        } catch (parseError) {
          console.log(`get_tournament failed: ${res.status}`, parseError);
        }
        clearTournamentState();
        return "error";
      }
      const data = await res.json();
      const parsed = parseTournamentDetailResponse(data, {
        onIntegrityIssue: reportError,
      });
      if (!parsed.ok) {
        clearTournamentState();
        return parsed.reason === "notFound" ? "not_found" : "error";
      }
      divisionsSetter(parsed.divisions);
      tournamentSetter(parsed.tournament);
      tournamentPlayerRowsSetter(parsed.playerRows);
      commentsSetter(parsed.comments);
      return "ok";
    } catch (error) {
      console.log(`Error loading tournament ${tournamentid}: ${error}`);
      clearTournamentState();
      return "error";
    }
  }, [
    tournamentid,
    effectiveMetaGame,
    isArchived,
    gameId,
    clearTournamentState,
  ]);

  useEffect(() => {
    let cancelled = false;
    fetchStatusSetter("loading");
    (async () => {
      const status = await fetchTournamentData();
      if (!cancelled) {
        fetchStatusSetter(status);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchTournamentData]);

  useEffect(() => {
    if (!tournamentid) {
      return;
    }
    wsSend?.("watchTournaments", { tournaments: [tournamentid] });
    return () => {
      wsSend?.("watchTournaments", { tournaments: [] });
    };
  }, [tournamentid, wsSend]);

  useEffect(() => {
    const onRefresh = async (event) => {
      const tid = event.detail?.tournamentId;
      if (tid === tournamentid) {
        const status = await fetchTournamentData();
        fetchStatusSetter(status);
      }
    };
    window.addEventListener("refresh-tournament", onRefresh);
    return () => window.removeEventListener("refresh-tournament", onRefresh);
  }, [tournamentid, fetchTournamentData]);

  const chatPlayers = useMemo(
    () => tournamentChatPlayers(tournamentPlayerRows),
    [tournamentPlayerRows]
  );
  const canComment = useMemo(
    () => canCommentTournamentChat(globalMe, tournamentPlayerRows),
    [globalMe, tournamentPlayerRows]
  );

  const submitTournamentComment = async (comment) => {
    if (!comment || /^\s*$/.test(comment)) {
      return;
    }
    const res = await callAuthApi("submit_tournament_comment", {
      tournamentid,
      comment,
      metaGame: tournament?.metaGame ?? effectiveMetaGame,
    });
    const parsed = await parseAuthResponse(res);
    if (!parsed.ok) {
      console.log(`submit_tournament_comment failed: ${parsed.error}`);
      return;
    }
    commentsSetter((prev) => [
      ...prev,
      {
        comment,
        userId: globalMe?.id,
        moveNumber: 0,
        timeStamp: Date.now(),
      },
    ]);
    const status = await fetchTournamentData();
    fetchStatusSetter(status);
  };

  useEffect(() => {
    if (fetchStatus !== "ok") {
      return;
    }
    if (
      !shouldNormalizeTournamentDetailUrl(
        location.pathname,
        location.search,
        tournamentid
      )
    ) {
      return;
    }
    navigate(canonicalPath, { replace: true });
  }, [
    fetchStatus,
    tournamentid,
    location.pathname,
    location.search,
    navigate,
    canonicalPath,
  ]);

  useEffect(() => {
    const handleResize = () => {
      screenWidthSetter(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const metaGameName = tournament
    ? gameinfo.get(tournament.metaGame)?.name
    : "";
  const variants = tournament
    ? formatVariantsJoined(tournament.metaGame, tournament.variants)
    : "";

  const pageTitle =
    fetchStatus === "loading"
      ? t("Tournament.loading")
      : fetchStatus === "not_found"
        ? t("404")
        : fetchStatus === "error"
          ? t("Tournament.loadErrorTitle")
          : tournament
            ? `${metaGameName}: Tournament ${tournamentid}`
            : t("Tournament.loading");

  const helmet = (
    <PageHelmet title={pageTitle} canonicalPath={canonicalPath} noIndex>
      {tournament ? (
        <meta
          property="og:description"
          content={`Details of ${metaGameName} tournament ${tournamentid}`}
        />
      ) : null}
    </PageHelmet>
  );

  if (fetchStatus === "loading") {
    return (
      <>
        {helmet}
        <PageLoading message={t("Tournament.loading")} />
      </>
    );
  }

  if (fetchStatus === "not_found") {
    return (
      <>
        {helmet}
        <NotFound path={canonicalPath} />
      </>
    );
  }

  if (fetchStatus === "error" || !tournament) {
    return (
      <>
        {helmet}
        <article className="content">
          <h1 className="title has-text-centered">{t("Tournament.loadErrorTitle")}</h1>
          <p className="has-text-centered">{t("Tournament.loadErrorBody")}</p>
          <p className="has-text-centered">
            <Link to="/tournaments" className="button apButton">
              {t("Tournament.Tournaments")}
            </Link>
          </p>
        </article>
      </>
    );
  }

  return (
    <>
      {helmet}
      <article className="content">
        <h1 className="title has-text-centered">
          <a
            href={
              "/games/" +
              (tournament && tournament.metaGame ? tournament.metaGame : "")
            }
            style={{ textDecoration: "none" }}
          >
            {variants === ""
              ? t("Tournament.Name", { metaGame: metaGameName })
              : t("Tournament.VariantsName", {
                  metaGame: metaGameName,
                  variants: variants,
                })}
          </a>
        </h1>
        <div className="has-text-centered mb-4">
          <TournamentFormatBadge tournament={tournament} />
        </div>
        <div className="control has-text-centered">
          <a
            href={RECORDS_DOWNLOAD_URLS.event(tournamentid)}
            rel={RECORDS_DOWNLOAD_LINK_REL}
          >
            <button className="button apButton is-small">
              Download all game records for this tournament
            </button>
          </a>
        </div>
        <div className="columns is-multiline is-centered">
          <div className="column is-12 is-8-desktop content">
            {divisions.length === 0 ? (
              <p className="has-text-centered">{t("Tournament.notStarted")}</p>
            ) : null}
            {divisions.map((d, i) => (
              <div className="card mb-5" key={"division" + i}>
                <header className="card-header">
                  <p className="card-header-title">
                    {t("Tournament.Division", { num: i + 1 })}
                  </p>
                </header>
                <div className="card-content">
                  <p className="subtitle">
                    {d.winner
                      ? t("Tournament.DivisionWinner", { winner: d.winner })
                      : t("Tournament.NumCompleted", {
                          numCompleted: d.numCompleted,
                          numGames: d.numGames,
                        })}
                  </p>
                  <div className="table-container">
                    <table className="table apTable">
                      <thead>
                        <tr key={"header" + i}>
                          <th style={{ whiteSpace: "nowrap" }}>
                            {" "}
                            {t("Tournament.Player")}{" "}
                          </th>
                          <th style={{ whiteSpace: "nowrap" }}>
                            {" "}
                            {t("Tournament.Position")}{" "}
                          </th>
                          {d.players.map((p, j) => (
                            <th
                              key={"header-" + i + "-" + j}
                              style={{ whiteSpace: "nowrap" }}
                            >
                              {j + 1}
                            </th>
                          ))}
                          <th style={{ whiteSpace: "nowrap" }}>
                            {" "}
                            {t("Tournament.Score")}{" "}
                          </th>
                          <th
                            style={{ whiteSpace: "nowrap" }}
                            title={t("Tournament.TieBreakHelp")}
                          >
                            {t("Tournament.TieBreak")}
                          </th>
                          <th
                            style={{ whiteSpace: "nowrap" }}
                            title={t("Tournament.RatingHelp")}
                          >
                            {t("Tournament.Rating")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.players.map((p, i) => (
                          <tr key={"player-" + i}>
                            <td>
                              <span className="playerName">
                                <BotAwareName
                                  id={p.playerid}
                                  name={p.playername}
                                  users={allUsers}
                                  link
                                />
                              </span>
                            </td>
                            <td>{i + 1}</td>
                            {p.outcomes.map((o, j) => (
                              <td key={"player-" + i + "-" + j}>
                                {o[0] === "-" ? (
                                  "-"
                                ) : o[0] === "multi" ? (
                                  <span>
                                    {o[1].map((leg, k) => (
                                      <React.Fragment key={k}>
                                        {k > 0 ? " · " : null}
                                        {leg[2] === null ? (
                                          leg[screenWidth >= 770 ? 0 : 1]
                                        ) : (
                                          <Link
                                            to={`/move/${tournament.metaGame}/${
                                              leg[0] === "_" ? "0" : "1"
                                            }/${leg[2]}`}
                                          >
                                            {leg[screenWidth >= 770 ? 0 : 1]}
                                          </Link>
                                        )}
                                      </React.Fragment>
                                    ))}
                                  </span>
                                ) : (
                                  <Link
                                    to={`/move/${tournament.metaGame}/${
                                      o[0] === "_" ? "0" : "1"
                                    }/${o[2]}`}
                                  >
                                    {o[screenWidth >= 770 ? 0 : 1]}
                                  </Link>
                                )}
                              </td>
                            ))}
                            <td>{p.score}</td>
                            <td>{p.tiebreak}</td>
                            <td>{Math.trunc(p.rating)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="column is-12 is-4-desktop content">
            <div className="card">
              <header className="card-header">
                <p className="card-header-title">{t("Tournament.Chat")}</p>
              </header>
              <div className="card-content">
                <UserChats
                  comments={comments}
                  players={chatPlayers}
                  gameid={tournamentid}
                  canComment={canComment}
                  handleSubmit={submitTournamentComment}
                  tooMuch={false}
                  commentingCompletedGame={false}
                />
              </div>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}

export default Tournament;
