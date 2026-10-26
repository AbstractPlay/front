import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { gameinfo } from "@abstractplay/gameslib";
import { useTranslation } from "react-i18next";
import PageHelmet from "../PageHelmet";
import PageLoading from "../shared/PageLoading";
import NotFound from "../NotFound";
import { useStore } from "../../stores";
import BotAwareName from "../Bots/BotAwareName";
import { formatVariantsJoined } from "../../lib/expandVariants";
import {
  RECORDS_DOWNLOAD_LINK_REL,
  RECORDS_DOWNLOAD_URLS,
} from "../../lib/summaryFetch";
import UserChats from "../GameMove/UserChats";
import { callAuthApi } from "../../lib/api";
import { parseAuthResponse } from "../../lib/parseAuthResponse";
import { fetchLadderDetail } from "../../lib/fetchLadder";
import { ladderDetailPathActive } from "../../lib/ladderRoutes";
import { canCommentLadderChat, ladderChatPlayers } from "../../lib/ladderChat";
import { fetchDashboard } from "../../lib/globalMeBootstrap";
import { formatLadderPoints } from "../../lib/formatLadderPoints";
import { RulesIntroExpandable } from "../shared/RulesIntroExpandable";

function LadderSection({ title, children }) {
  return (
    <section className="ladder-hub-section">
      <p className="subtitle lined">
        <span>{title}</span>
      </p>
      <div className="ladder-hub-section-body">{children}</div>
    </section>
  );
}

function LadderHub() {
  const { t } = useTranslation();
  const { ladderid } = useParams();
  const navigate = useNavigate();
  const allUsers = useStore((state) => state.users);
  const globalMe = useStore((state) => state.globalMe);
  const wsSend = useStore((state) => state.wsSend);
  const [payload, payloadSetter] = useState(null);
  const [fetchStatus, fetchStatusSetter] = useState("loading");
  const [poolQueued, poolQueuedSetter] = useState(false);
  const [actionError, actionErrorSetter] = useState("");
  const [busy, busySetter] = useState(false);

  const canonicalPath = ladderDetailPathActive(ladderid);

  const reload = useCallback(async () => {
    const data = await fetchLadderDetail(ladderid);
    if (!data?.ladder) {
      return "not_found";
    }
    payloadSetter(data);
    if (data.matchmaking?.viewerInPool === true) {
      poolQueuedSetter(true);
    } else if (data.matchmaking?.viewerInPool === false) {
      poolQueuedSetter(false);
    }
    return "ok";
  }, [ladderid]);

  useEffect(() => {
    let cancelled = false;
    fetchStatusSetter("loading");
    (async () => {
      const status = await reload();
      if (!cancelled) {
        fetchStatusSetter(status === "ok" ? "ok" : "not_found");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  useEffect(() => {
    if (!ladderid) {
      return;
    }
    wsSend?.("watchLadders", { ladders: [ladderid] });
    return () => {
      wsSend?.("watchLadders", { ladders: [] });
    };
  }, [ladderid, wsSend]);

  useEffect(() => {
    const onRefresh = async (event) => {
      const id = event.detail?.ladderId;
      if (id === ladderid) {
        const status = await reload();
        fetchStatusSetter(status === "ok" ? "ok" : "not_found");
        await fetchDashboard();
      }
    };
    window.addEventListener("refresh-ladder", onRefresh);
    return () => window.removeEventListener("refresh-ladder", onRefresh);
  }, [ladderid, reload]);

  const ladder = payload?.ladder;
  const board = payload?.board ?? [];
  const viewer = payload?.viewer;
  const comments = payload?.comments ?? [];
  const matchmaking = payload?.matchmaking ?? {};

  const metaGameName = ladder
    ? gameinfo.get(ladder.metaGame)?.name ?? ladder.metaGame
    : "";
  const variants = ladder
    ? formatVariantsJoined(ladder.metaGame, ladder.variants)
    : "";

  const onVacation = globalMe?.onVacation === true;

  const ladderChallengesReceived = useMemo(() => {
    if (!globalMe?.challengesReceived || !ladderid) {
      return [];
    }
    return globalMe.challengesReceived.filter(
      (c) => c.ladderId === ladderid && c.status === "pending"
    );
  }, [globalMe?.challengesReceived, ladderid]);

  const ladderChallengesIssued = useMemo(() => {
    const issued = [
      ...(globalMe?.challengesIssued ?? []),
      ...(globalMe?.challengesAccepted ?? []),
    ];
    return issued.filter(
      (c) => c?.ladderId === ladderid && c.status === "pending"
    );
  }, [globalMe?.challengesIssued, globalMe?.challengesAccepted, ladderid]);

  const chatPlayers = useMemo(
    () => ladderChatPlayers(board, allUsers),
    [board, allUsers]
  );
  const canComment = useMemo(
    () => canCommentLadderChat(globalMe, viewer),
    [globalMe, viewer]
  );

  const runAction = async (fn) => {
    actionErrorSetter("");
    busySetter(true);
    try {
      await fn();
      const status = await reload();
      fetchStatusSetter(status === "ok" ? "ok" : "not_found");
      await fetchDashboard();
    } catch (e) {
      actionErrorSetter(String(e));
    } finally {
      busySetter(false);
    }
  };

  const handleJoin = () =>
    runAction(async () => {
      const res = await callAuthApi("join_ladder", { ladderId: ladderid });
      const parsed = await parseAuthResponse(res);
      if (!parsed.ok) {
        actionErrorSetter(parsed.error ?? t("Ladder.actionFailed"));
      }
    });

  const handleLeave = () =>
    runAction(async () => {
      const res = await callAuthApi("leave_ladder", { ladderId: ladderid });
      const parsed = await parseAuthResponse(res);
      if (!parsed.ok) {
        actionErrorSetter(parsed.error ?? t("Ladder.actionFailed"));
      }
      poolQueuedSetter(false);
    });

  const handlePoolJoin = () =>
    runAction(async () => {
      const res = await callAuthApi("join_ladder_pool", { ladderId: ladderid });
      const parsed = await parseAuthResponse(res);
      if (!parsed.ok) {
        actionErrorSetter(parsed.error ?? t("Ladder.actionFailed"));
        return;
      }
      if (parsed.data?.queued) {
        poolQueuedSetter(true);
      } else if (parsed.data?.gameId && ladder?.metaGame) {
        poolQueuedSetter(false);
        navigate(`/move/${ladder.metaGame}/0/${parsed.data.gameId}`);
      }
    });

  const handlePoolLeave = () =>
    runAction(async () => {
      const res = await callAuthApi("leave_ladder_pool", { ladderId: ladderid });
      const parsed = await parseAuthResponse(res);
      if (!parsed.ok) {
        actionErrorSetter(parsed.error ?? t("Ladder.actionFailed"));
      }
      poolQueuedSetter(false);
    });

  const handleChallenge = (opponentId, nearestAnyway = false) =>
    runAction(async () => {
      const res = await callAuthApi("new_ladder_challenge", {
        ladderId: ladderid,
        opponentId,
        nearestAnyway,
      });
      const parsed = await parseAuthResponse(res);
      if (!parsed.ok) {
        actionErrorSetter(parsed.error ?? t("Ladder.actionFailed"));
      }
      poolQueuedSetter(false);
    });

  const submitLadderComment = async (comment) => {
    if (!comment || /^\s*$/.test(comment)) {
      return;
    }
    const res = await callAuthApi("submit_ladder_comment", {
      ladderId: ladderid,
      comment,
    });
    const parsed = await parseAuthResponse(res);
    if (!parsed.ok) {
      console.log("submit_ladder_comment failed", parsed.error);
      return;
    }
    await reload();
  };

  const respondLadderChallenge = async (challenge, accept) => {
    await runAction(async () => {
      const res = await callAuthApi("respond_ladder_challenge", {
        id: challenge.id,
        metaGame: challenge.metaGame,
        response: accept,
      });
      const parsed = await parseAuthResponse(res);
      if (!parsed.ok) {
        actionErrorSetter(parsed.error ?? t("Ladder.actionFailed"));
      }
    });
  };

  const pageTitle =
    fetchStatus === "loading"
      ? t("Ladder.loading")
      : fetchStatus === "not_found"
        ? t("404")
        : ladder
          ? ladder.displayName ?? metaGameName
          : t("Ladder.loading");

  const helmet = (
    <PageHelmet title={pageTitle} canonicalPath={canonicalPath} noIndex>
      {ladder ? (
        <meta property="og:description" content={ladder.displayName} />
      ) : null}
    </PageHelmet>
  );

  if (fetchStatus === "loading") {
    return (
      <>
        {helmet}
        <PageLoading message={t("Ladder.loading")} />
      </>
    );
  }

  if (fetchStatus === "not_found" || !ladder) {
    return (
      <>
        {helmet}
        <NotFound path={canonicalPath} />
      </>
    );
  }

  const membership = viewer?.membershipStatus;
  const isActive = membership === "active";
  const isLeft = membership === "left";
  const reach = matchmaking.challengeReach;
  const reachLabel =
    reach?.low !== undefined && reach?.high !== undefined
      ? t("Ladder.reachBand", {
          low: formatLadderPoints(reach.low),
          high: formatLadderPoints(reach.high),
        })
      : null;
  const nearest = matchmaking.nearestAnywayCandidate;
  const matchmakingDisabled = onVacation || !isActive || ladder.status !== "active";

  return (
    <>
      {helmet}
      <article id="ladderHub" className="content ladder-hub">
        <div className="columns is-centered">
          <div className="column is-10-desktop">
        <h1 className="title has-text-centered">
          <Link to={`/games/${ladder.metaGame}`} style={{ textDecoration: "none" }}>
            {variants === ""
              ? t("Ladder.title", { metaGame: metaGameName })
              : t("Ladder.titleVariants", { metaGame: metaGameName, variants })}
          </Link>
        </h1>
        <p className="has-text-centered">
          <span className="tag">{t(`Ladder.status.${ladder.status}`, ladder.status)}</span>
          &nbsp;
          {t("Ladder.memberCount", {
            count: ladder.activeMemberCount ?? 0,
            min: ladder.minActiveMembers,
          })}
        </p>
        <RulesIntroExpandable
          summaryKey="Ladder.introSummary"
          fullKey="Ladder.introFull"
        />
        <p className="help has-text-centered">{t("Ladder.clockCopy")}</p>
        <div className="control has-text-centered mb-4">
          <a
            href={RECORDS_DOWNLOAD_URLS.event(ladderid)}
            rel={RECORDS_DOWNLOAD_LINK_REL}
          >
            <button type="button" className="button apButton is-small">
              {t("Ladder.downloadRecords")}
            </button>
          </a>
        </div>

        {actionError ? <p className="apTextAlert has-text-centered">{actionError}</p> : null}

        {globalMe?.id && !isActive && !isLeft ? (
          <p className="has-text-centered">
            <button
              type="button"
              className="button apButton"
              disabled={busy}
              onClick={handleJoin}
            >
              {t("Ladder.join")}
            </button>
          </p>
        ) : null}

        {isLeft ? (
          <p className="has-text-centered help">
            {t("Ladder.leftPreview", {
              points: formatLadderPoints(viewer?.points ?? 0),
            })}
            &nbsp;
            <button
              type="button"
              className="button is-small apButton"
              disabled={busy}
              onClick={handleJoin}
            >
              {t("Ladder.rejoin")}
            </button>
          </p>
        ) : null}

        {isActive ? (
          <LadderSection title={t("Ladder.yourStanding")}>
            <p>
              {t("Ladder.rankPoints", {
                rank: viewer?.rank ?? "—",
                points: formatLadderPoints(viewer?.points ?? 0),
              })}
            </p>
            <button
              type="button"
              className="button is-small apButtonNeutral"
              disabled={busy}
              onClick={handleLeave}
            >
              {t("Ladder.leave")}
            </button>
          </LadderSection>
        ) : null}

        {isActive && ladder.status === "active" ? (
          <LadderSection title={t("Ladder.matchmaking")}>
            {onVacation ? (
              <p className="help">{t("Ladder.vacationBlocked")}</p>
            ) : null}
            {reachLabel ? <p className="help">{reachLabel}</p> : null}
            <p className="help">
              {t("Ladder.poolWaiterCount", {
                count: matchmaking.poolWaiterCount ?? 0,
              })}
            </p>
            <div className="buttons">
              <button
                type="button"
                className="button apButton"
                disabled={busy || matchmakingDisabled}
                onClick={handlePoolJoin}
              >
                {poolQueued ? t("Ladder.poolWaiting") : t("Ladder.findMatch")}
              </button>
              {poolQueued ? (
                <button
                  type="button"
                  className="button apButtonNeutral"
                  disabled={busy}
                  onClick={handlePoolLeave}
                >
                  {t("Ladder.leavePool")}
                </button>
              ) : null}
            </div>
            {matchmaking.inReachOpponentCount === 0 && nearest?.userid ? (
              <p>
                <button
                  type="button"
                  className="button is-small apButton"
                  disabled={busy || matchmakingDisabled}
                  onClick={() => handleChallenge(nearest.userid, true)}
                >
                  {t("Ladder.challengeNearest", {
                    name: allUsers?.[nearest.userid]?.name ?? nearest.userid,
                    points: formatLadderPoints(nearest.points ?? 0),
                  })}
                </button>
              </p>
            ) : null}
          </LadderSection>
        ) : null}

        {(ladderChallengesReceived.length > 0 ||
          ladderChallengesIssued.length > 0) && (
          <LadderSection title={t("Ladder.pendingChallenges")}>
            {ladderChallengesReceived.map((c) => (
              <div key={c.id} className="mb-2">
                <span className="tag is-info is-light">{t("Ladder.badge")}</span>
                &nbsp;
                {t("Ladder.incomingChallenge", {
                  name: c.challenger?.name ?? c.challenger?.id,
                })}
                &nbsp;
                <button
                  type="button"
                  className="button is-small apButton"
                  disabled={busy}
                  onClick={() => respondLadderChallenge(c, true)}
                >
                  {t("Accept")}
                </button>
                &nbsp;
                <button
                  type="button"
                  className="button is-small apButtonNeutral"
                  disabled={busy}
                  onClick={() => respondLadderChallenge(c, false)}
                >
                  {t("Reject")}
                </button>
              </div>
            ))}
            {ladderChallengesIssued.map((c) => (
              <p key={c.id}>
                <span className="tag is-info is-light">{t("Ladder.badge")}</span>
                &nbsp;{t("Ladder.outgoingChallengePending")}
              </p>
            ))}
          </LadderSection>
        )}

        <section className="ladder-hub-section">
          <p className="subtitle lined">
            <span>{t("Ladder.leaderboard")}</span>
          </p>
          <div className="table-container ladder-hub-table-wrap">
          <table className="table apTable is-fullwidth">
            <thead>
              <tr>
                <th>{t("Ladder.rank")}</th>
                <th>{t("Tournament.Player")}</th>
                <th>{t("Ladder.points")}</th>
                <th>{t("Ladder.activeGames")}</th>
                {isActive ? <th>{t("Ladder.challenge")}</th> : null}
              </tr>
            </thead>
            <tbody>
              {board.map((row) => (
                <tr
                  key={row.userid}
                  className={row.withinReach ? "ladder-within-reach" : ""}
                >
                  <td>{row.rank}</td>
                  <td>
                    <BotAwareName
                      id={row.userid}
                      name={allUsers?.[row.userid]?.name}
                      users={allUsers}
                      link
                    />
                  </td>
                  <td>{formatLadderPoints(row.points)}</td>
                  <td>{row.activeLadderGameCount ?? 0}</td>
                  {isActive && row.userid !== globalMe?.id ? (
                    <td>
                      <button
                        type="button"
                        className="button is-small apButton"
                        disabled={
                          busy ||
                          matchmakingDisabled ||
                          !row.withinReach ||
                          ladderChallengesIssued.length > 0
                        }
                        onClick={() => handleChallenge(row.userid, false)}
                      >
                        {t("Ladder.challenge")}
                      </button>
                    </td>
                  ) : isActive ? (
                    <td />
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>

        <section className="ladder-hub-section ladder-hub-chat">
          <div className="card ladder-hub-card">
            <header className="card-header">
              <p className="card-header-title">{t("Ladder.chat")}</p>
            </header>
            <div className="card-content">
              <UserChats
                comments={comments}
                players={chatPlayers}
                gameid={ladderid}
                canComment={canComment}
                handleSubmit={submitLadderComment}
                tooMuch={false}
                commentingCompletedGame={false}
              />
            </div>
          </div>
        </section>
          </div>
        </div>
      </article>
    </>
  );
}

export default LadderHub;
