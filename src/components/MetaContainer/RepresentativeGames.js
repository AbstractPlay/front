import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { gameinfo } from "@abstractplay/gameslib";
import { API_ENDPOINT_OPEN } from "../../config";
import BotAwareName from "../Bots/BotAwareName";
import { useStore } from "../../stores";

function dedupeByGameId(entries) {
  const seen = new Map();
  const sorted = [...entries].sort(
    (a, b) => (a.addedAt || 0) - (b.addedAt || 0)
  );
  for (const entry of sorted) {
    const gameId = entry.gameId || entry.id;
    if (!gameId || seen.has(gameId)) continue;
    seen.set(gameId, entry);
  }
  return [...seen.values()];
}

function RepresentativeGames({ metaGame }) {
  const [entries, entriesSetter] = useState(null);
  const allUsers = useStore((state) => state.users);
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append("query", "representative_games");
        url.searchParams.append("metaGame", metaGame);
        const res = await fetch(url);
        const result = await res.json();
        if (!cancelled) {
          entriesSetter(dedupeByGameId(Array.isArray(result) ? result : []));
        }
      } catch (error) {
        console.log(error);
        if (!cancelled) entriesSetter([]);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [metaGame]);

  const rows = useMemo(() => {
    if (!entries) return [];
    return entries.map((entry) => {
      const gameId = entry.gameId || entry.id;
      const meta = entry.metaGame || metaGame;
      let gameName = gameinfo.get(meta)?.name ?? meta;
      const players = entry.players ?? [];
      return {
        gameId,
        meta,
        gameName,
        userId: entry.userId,
        userName: entry.userName,
        players,
      };
    });
  }, [entries, metaGame]);

  if (entries === null) {
    return <p className="help">{t("common.loading")}</p>;
  }

  if (rows.length === 0) return null;

  return (
    <div style={{ marginTop: "1em", marginBottom: "1em" }}>
      <p className="lined">
        <span>{t("meta.recommendedGames")}</span>
      </p>
      <ul style={{ listStyle: "none", marginLeft: 0 }}>
        {rows.map((row) => (
          <li key={row.gameId} style={{ marginBottom: "0.35em" }}>
            <Link to={`/move/${row.meta}/1/${row.gameId}`}>{row.gameName}</Link>
            {row.players.length > 0 ? (
              <span style={{ fontSize: "smaller", marginLeft: "0.35em" }}>
                (
                {row.players
                  .map((p) => (
                    <BotAwareName
                      key={p.id}
                      id={p.id}
                      name={p.name}
                      users={allUsers}
                      link
                    />
                  ))
                  .reduce(
                    (acc, x) =>
                      acc === null ? (
                        x
                      ) : (
                        <>
                          {acc} vs {x}
                        </>
                      ),
                    null
                  )}
                )
              </span>
            ) : null}
            {row.userName ? (
              <span style={{ fontSize: "smaller", display: "block" }}>
                {t("meta.recommendedBy", { name: row.userName })}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RepresentativeGames;
