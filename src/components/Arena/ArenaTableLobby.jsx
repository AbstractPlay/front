import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { gameinfo } from "@abstractplay/gameslib";
import PageHelmet from "../PageHelmet";
import PageLoading from "../shared/PageLoading";
import NotFound from "../NotFound";
import UserChats from "../GameMove/UserChats";
import BotAwareName from "../Bots/BotAwareName";
import { useStore } from "../../stores";
import { callAuthApi } from "../../lib/api";
import { parseAuthResponse } from "../../lib/parseAuthResponse";
import { getGameDisplayName } from "../../lib/gameOptions";
import { formatVariantsJoined } from "../../lib/expandVariants";
import {
  arenaTableAction,
  fetchArenaTable,
} from "../../lib/arena/fetchArena";
import { arenaLandingPath, arenaPlayPath } from "../../lib/arena/arenaRoutes";
import { useArenaPoll } from "../../lib/arena/useArenaPoll";
import {
  arenaTableChatPlayers,
  canCommentArenaTableChat,
} from "../../lib/arena/arenaTableChat";
import "./arena.css";

export default function ArenaTableLobby() {
  const { t } = useTranslation();
  const { metaGame: metaParam, tableId } = useParams();
  const navigate = useNavigate();
  const globalMe = useStore((state) => state.globalMe);
  const allUsers = useStore((state) => state.users);
  const [busy, busySetter] = useState(false);
  const [actionError, actionErrorSetter] = useState("");

  const loadTable = useCallback(async () => {
    if (!tableId) {
      return null;
    }
    return fetchArenaTable(tableId);
  }, [tableId]);

  const { data: table, loading, reload } = useArenaPoll(loadTable, [loadTable], {
    activeMs: 5000,
    idleMs: 15000,
  });

  useEffect(() => {
    if (!table || !metaParam) {
      return;
    }
    if (table.metaGame !== metaParam) {
      return;
    }
    if (table.state === "playing") {
      navigate(arenaPlayPath(table.metaGame, table.tableId), { replace: true });
    }
  }, [table, metaParam, navigate]);

  const comments = table?.comments ?? [];
  const chatPlayers = useMemo(
    () => arenaTableChatPlayers(table, allUsers),
    [table, allUsers]
  );
  const canComment = useMemo(
    () => canCommentArenaTableChat(globalMe, table),
    [globalMe, table]
  );

  const runAction = async (fn) => {
    actionErrorSetter("");
    busySetter(true);
    try {
      await fn();
      await reload();
    } catch (e) {
      actionErrorSetter(String(e));
    } finally {
      busySetter(false);
    }
  };

  const handleJoin = () =>
    runAction(async () => {
      const result = await arenaTableAction("join_arena_table", { tableId });
      if (!result.ok) {
        throw new Error(result.error ?? t("Arena.actionFailed"));
      }
    });

  const handleLeave = () =>
    runAction(async () => {
      const result = await arenaTableAction("leave_arena_table", { tableId });
      if (!result.ok) {
        throw new Error(result.error ?? t("Arena.actionFailed"));
      }
      navigate(arenaLandingPath());
    });

  const handleCancel = () =>
    runAction(async () => {
      const result = await arenaTableAction("cancel_arena_table", { tableId });
      if (!result.ok) {
        throw new Error(result.error ?? t("Arena.actionFailed"));
      }
      navigate(arenaLandingPath());
    });

  const handleReady = (ready) =>
    runAction(async () => {
      const result = await arenaTableAction("set_arena_ready", {
        tableId,
        ready,
      });
      if (!result.ok) {
        throw new Error(result.error ?? t("Arena.actionFailed"));
      }
      if (result.data?.launched) {
        navigate(arenaPlayPath(metaParam, tableId));
      }
    });

  const handleProposeSwap = () =>
    runAction(async () => {
      const result = await arenaTableAction("propose_arena_seat_swap", {
        tableId,
      });
      if (!result.ok) {
        throw new Error(result.error ?? t("Arena.actionFailed"));
      }
    });

  const handleAcceptSwap = () =>
    runAction(async () => {
      const result = await arenaTableAction("accept_arena_seat_swap", {
        tableId,
      });
      if (!result.ok) {
        throw new Error(result.error ?? t("Arena.actionFailed"));
      }
    });

  const submitComment = async (comment) => {
    if (!comment || /^\s*$/.test(comment) || !table) {
      return;
    }
    const res = await callAuthApi("submit_comment", {
      id: tableId,
      metaGame: table.metaGame,
      comment,
      moveNumber: 0,
    });
    const parsed = await parseAuthResponse(res);
    if (!parsed.ok) {
      console.log("arena submit_comment failed", parsed.error);
      return;
    }
    await reload();
  };

  if (loading && !table) {
    return <PageLoading message={t("Arena.loadingTable")} />;
  }

  if (!table || table.metaGame !== metaParam) {
    return <NotFound />;
  }

  const gameName =
    getGameDisplayName(table.metaGame) ??
    gameinfo.get(table.metaGame)?.name ??
    table.metaGame;
  const variants = formatVariantsJoined(table.metaGame, table.variants);
  const mySeat = table.seats?.find((s) => s.userId === globalMe?.id);
  const bothSeated = table.seats?.filter((s) => s.userId).length === 2;
  const swapPending = table.swapProposalUserId;

  return (
    <>
      <PageHelmet title={t("Arena.tableTitle", { game: gameName })} />
      <article className="content">
        <p className="has-text-centered">
          <Link to={arenaLandingPath()}>{t("Arena.backToLobby")}</Link>
        </p>
        <h1 className="title has-text-centered lined">
          <span>
            {t("Arena.tableTitle", { game: gameName })}
            {variants ? ` (${variants})` : ""}
          </span>
        </h1>
        <p className="has-text-centered help">
          {t("Arena.tableTc", { tc: table.arenaTcId, label: table.arenaClock ? `${Math.round(table.arenaClock.startSec / 60)}+${table.arenaClock.incSec}` : table.arenaTcId })}
        </p>
        <p className="has-text-centered">
          <span className="tag">{t(`Arena.lobbyState.${table.state}`, table.state)}</span>
        </p>

        {actionError ? (
          <p className="help has-text-danger has-text-centered" role="alert">
            {actionError}
          </p>
        ) : null}

        <div className="arena-panel">
          <p className="subtitle lined">
            <span>{t("Arena.seats")}</span>
          </p>
          <div className="columns">
            {table.seats?.map((seat) => (
              <div className="column" key={seat.seatIndex}>
                <p className="heading">{t("Arena.seat", { n: seat.seatIndex + 1 })}</p>
                {seat.userId ? (
                  <>
                    <BotAwareName userid={seat.userId} link />
                    {seat.ready ? (
                      <span className="tag is-success ml-2">{t("Arena.ready")}</span>
                    ) : (
                      <span className="tag ml-2">{t("Arena.notReady")}</span>
                    )}
                  </>
                ) : (
                  <span className="help">{t("Arena.emptySeat")}</span>
                )}
              </div>
            ))}
          </div>

          <div className="buttons is-centered">
            {!table.viewer?.seated && table.state === "open" ? (
              <button
                type="button"
                className="button apButton"
                disabled={busy}
                onClick={handleJoin}
              >
                {t("Arena.joinTable")}
              </button>
            ) : null}
            {table.viewer?.seated ? (
              <>
                <button
                  type="button"
                  className="button apButtonNeutral"
                  disabled={busy}
                  onClick={handleLeave}
                >
                  {t("Arena.leaveTable")}
                </button>
                {mySeat && bothSeated ? (
                  <>
                    <button
                      type="button"
                      className="button apButton"
                      disabled={busy || mySeat.ready}
                      onClick={() => handleReady(true)}
                    >
                      {t("Arena.readyUp")}
                    </button>
                    {mySeat.ready ? (
                      <button
                        type="button"
                        className="button apButtonNeutral"
                        disabled={busy}
                        onClick={() => handleReady(false)}
                      >
                        {t("Arena.unready")}
                      </button>
                    ) : null}
                  </>
                ) : null}
              </>
            ) : null}
            {table.viewer?.isHost && table.state !== "playing" ? (
              <button
                type="button"
                className="button is-danger is-light"
                disabled={busy}
                onClick={handleCancel}
              >
                {t("Arena.cancelTable")}
              </button>
            ) : null}
            {bothSeated && table.viewer?.seated ? (
              <>
                <button
                  type="button"
                  className="button apButtonNeutral"
                  disabled={busy}
                  onClick={handleProposeSwap}
                >
                  {t("Arena.proposeSwap")}
                </button>
                {swapPending && swapPending !== globalMe?.id ? (
                  <button
                    type="button"
                    className="button apButton"
                    disabled={busy}
                    onClick={handleAcceptSwap}
                  >
                    {t("Arena.acceptSwap")}
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
          {swapPending ? (
            <p className="help has-text-centered">{t("Arena.swapPending")}</p>
          ) : null}
        </div>

        <div className="arena-panel">
          <p className="subtitle lined">
            <span>{t("Arena.tableChat")}</span>
          </p>
          <UserChats
            comments={comments}
            players={chatPlayers}
            gameid={tableId}
            canComment={canComment}
            handleSubmit={submitComment}
            tooMuch={false}
            commentingCompletedGame={table.state === "ended"}
          />
        </div>
      </article>
    </>
  );
}
