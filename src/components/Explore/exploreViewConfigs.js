import { Link } from "react-router-dom";
import { tournamentListPath } from "../../lib/tournamentSections";
import { matchesSummaryGameKey } from "../../lib/summaryGameKeys";

function metaCount(counts, metaGame, key) {
  if (counts === null) return null;
  return counts[metaGame]?.[key] ?? 0;
}

function countLinkCell(toBuilder, loadingLabel) {
  return (props) => {
    const value = props.getValue();
    if (value === null) {
      return <span className="help">{loadingLabel}</span>;
    }
    return <Link to={toBuilder(props.row.original.id)}>{value}</Link>;
  };
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function scoreLookup(fetchedData, prefix, metaGame) {
  const found1w = fetchedData?.[prefix + "1w"]?.find(
    (e) => e.metaGame === metaGame
  );
  const found1m = fetchedData?.[prefix + "1m"]?.find(
    (e) => e.metaGame === metaGame
  );
  const found6m = fetchedData?.[prefix + "6m"]?.find(
    (e) => e.metaGame === metaGame
  );
  const found1y = fetchedData?.[prefix + "1y"]?.find(
    (e) => e.metaGame === metaGame
  );
  return {
    score1w: found1w === undefined ? 0 : found1w.score,
    score1m: found1m === undefined ? 0 : found1m.score,
    score6m: found6m === undefined ? 0 : found6m.score,
    score1y: found1y === undefined ? 0 : found1y.score,
  };
}

function dividedScoreColumns(columnHelper, divisors, t) {
  return [
    columnHelper.accessor("score1w", {
      header: t("tables.oneWeek"),
      cell: (props) => (props.getValue() / divisors[0]).toFixed(2),
    }),
    columnHelper.accessor("score1m", {
      header: t("tables.oneMonth"),
      cell: (props) => (props.getValue() / divisors[1]).toFixed(2),
    }),
    columnHelper.accessor("score6m", {
      header: t("tables.sixMonths"),
      cell: (props) => (props.getValue() / divisors[2]).toFixed(2),
    }),
    columnHelper.accessor("score1y", {
      header: t("tables.oneYear"),
      cell: (props) => (props.getValue() / divisors[3]).toFixed(2),
    }),
  ];
}

export const viewConfigs = {
  all: {
    titleKey: "explore.views.all.title",
    descriptionKey: null,
    defaultSort: [{ id: "gameName", desc: false }],
    fetchUrl: null,
    extraFields: (metaGame, info, fetchedData, counts) => ({
      current: metaCount(counts, metaGame, "currentgames"),
      completed: metaCount(counts, metaGame, "completedgames"),
      challenges: metaCount(counts, metaGame, "standingchallenges"),
      ratings: metaCount(counts, metaGame, "ratings"),
    }),
    extraColumns: (columnHelper, { openChallengeModal }, t) => {
      const loadingLabel = t("explore.loadingCounts");
      return [
      columnHelper.accessor("current", {
        header: t("tables.current"),
        cell: countLinkCell(
          (id) => `/listgames/current/${id}`,
          loadingLabel
        ),
      }),
      columnHelper.accessor("completed", {
        header: t("tables.completed"),
        cell: countLinkCell(
          (id) => `/listgames/completed/${id}`,
          loadingLabel
        ),
      }),
      columnHelper.accessor("challenges", {
        header: t("tables.challenges"),
        cell: countLinkCell((id) => `/challenges/${id}`, loadingLabel),
      }),
      columnHelper.accessor("ratings", {
        header: t("tables.ratings"),
        cell: countLinkCell((id) => `/ratings/${id}`, loadingLabel),
      }),
      columnHelper.display({
        id: "actions",
        cell: (props) => (
          <>
            <button
              className="button is-small apButton"
              onClick={() => openChallengeModal(props.row.original.id)}
            >
              {t("IssueChallengeLabel")}
            </button>
            <Link to={tournamentListPath("open", props.row.original.id)}>
              {t("TournamentsLink")}
            </Link>
          </>
        ),
      }),
    ];
    },
    loadGames: null,
    renderExtra: null,
    showAllTags: true,
    enableTagFilter: true,
    enableNameSearch: true,
    enableDesignerSearch: true,
    enableStarFilter: true,
    enableRecommendedFilter: true,
    starFilterStorageKey: "allgames-filter-stars",
    recommendedFilterStorageKey: "allgames-filter-recommended",
  },

  newest: {
    titleKey: "explore.views.newest.title",
    descriptionKey: "explore.views.newest.description",
    defaultSort: [{ id: "dateAdded", desc: true }],
    fetchUrl: null,
    extraFields: (metaGame, info) => ({
      dateAdded: info.dateAdded,
    }),
    extraColumns: (columnHelper, _context, t) => [
      columnHelper.accessor("dateAdded", {
        header: t("tables.added"),
        sortingFn: "datetime",
      }),
    ],
    loadGames: null,
    renderExtra: null,
  },

  hotRaw: {
    titleKey: "explore.views.hotRaw.title",
    descriptionKey: "explore.views.hotRaw.description",
    defaultSort: [{ id: "score1w", desc: true }],
    fetchUrl: "https://records.abstractplay.com/mvtimes.json",
    extraFields: (metaGame, info, fetchedData) =>
      scoreLookup(fetchedData, "raw", metaGame),
    extraColumns: (columnHelper, _context, t) =>
      dividedScoreColumns(columnHelper, [7, 30, 180, 365], t),
    loadGames: null,
    renderExtra: null,
  },

  hotPlayers: {
    titleKey: "explore.views.hotPlayers.title",
    descriptionKey: "explore.views.hotPlayers.description",
    defaultSort: [{ id: "score1w", desc: true }],
    fetchUrl: "https://records.abstractplay.com/mvtimes.json",
    extraFields: (metaGame, info, fetchedData) =>
      scoreLookup(fetchedData, "players", metaGame),
    extraColumns: (columnHelper, _context, t) =>
      dividedScoreColumns(columnHelper, [7, 30, 180, 365], t),
    loadGames: null,
    renderExtra: null,
  },

  playerSum: {
    titleKey: "explore.views.playerSum.title",
    descriptionKey: "explore.views.playerSum.description",
    defaultSort: [{ id: "score1w", desc: true }],
    fetchUrl: "https://records.abstractplay.com/mvtimes.json",
    extraFields: (metaGame, info, fetchedData) =>
      scoreLookup(fetchedData, "playersSum", metaGame),
    extraColumns: (columnHelper, _context, t) => [
      columnHelper.accessor("score1w", {
        header: t("tables.oneWeek"),
      }),
      columnHelper.accessor("score1m", {
        header: t("tables.oneMonth"),
      }),
      columnHelper.accessor("score6m", {
        header: t("tables.sixMonths"),
      }),
      columnHelper.accessor("score1y", {
        header: t("tables.oneYear"),
      }),
    ],
    loadGames: null,
    renderExtra: null,
  },

  hindex: {
    titleKey: "explore.views.hindex.title",
    descriptionKey: "explore.views.hindex.description",
    defaultSort: [{ id: "hindex", desc: true }],
    summaryTier: "site",
    extraFields: (metaGame, info, fetchedData) => {
      let hindex = 0;
      if (fetchedData !== null) {
        const hrec = fetchedData.hMeta.find((i) => i.user === metaGame);
        if (hrec !== undefined) {
          hindex = hrec.value;
        }
      }
      return { hindex };
    },
    extraColumns: (columnHelper, _context, t) => [
      columnHelper.accessor("hindex", {
        header: t("tables.hIndex"),
      }),
    ],
    loadGames: null,
    renderExtra: null,
  },

  stars: {
    titleKey: "explore.views.stars.title",
    descriptionKey: "explore.views.stars.description",
    defaultSort: [{ id: "stars", desc: true }],
    fetchUrl: null,
    extraFields: (metaGame, info, fetchedData, counts) => ({
      stars: counts === null ? null : counts[metaGame]?.stars ?? 0,
    }),
    extraColumns: (columnHelper, _context, t) => [
      columnHelper.accessor("stars", {
        header: t("tables.stars"),
        cell: (props) =>
          props.getValue() === null ? (
            <span className="help">{t("explore.loadingCounts")}</span>
          ) : (
            props.getValue()
          ),
      }),
    ],
    loadGames: null,
    renderExtra: null,
  },

  completed: {
    titleKey: "explore.views.completed.title",
    descriptionKey: "explore.views.completed.description",
    defaultSort: [{ id: "games", desc: true }],
    fetchUrl: null,
    extraFields: (metaGame, info, fetchedData, counts) => {
      if (counts === null) {
        return { games: null };
      }
      const now = Date.now();
      const added = new Date(info.dateAdded).getTime();
      const week = 7 * 24 * 60 * 60 * 1000;
      const weeksLive = Math.ceil(Math.abs(now - added) / week);
      const gamesper =
        Math.round(
          ((counts[metaGame]?.completedgames || 0) / weeksLive) * 100
        ) / 100;
      return { games: gamesper };
    },
    extraColumns: (columnHelper, _context, t) => [
      columnHelper.accessor("games", {
        header: t("tables.gamesPerWeek"),
        cell: (props) =>
          props.getValue() === null ? (
            <span className="help">{t("explore.loadingCounts")}</span>
          ) : (
            props.getValue().toFixed(2)
          ),
      }),
    ],
    loadGames: null,
    renderExtra: null,
  },

  completedRecent: {
    titleKey: "explore.views.completedRecent.title",
    descriptionKey: "explore.views.completedRecent.description",
    defaultSort: [{ id: "games", desc: true }],
    summaryTier: "site",
    extraFields: (metaGame, info, fetchedData) => {
      let gamesper = 0;
      if (fetchedData !== null) {
        const found = fetchedData.histograms.meta.find((x) =>
          matchesSummaryGameKey(x.game, metaGame)
        );
        if (found !== undefined) {
          const subset = found.value.slice(-13);
          const sum = subset.reduce((acc, curr) => acc + curr, 0);
          gamesper = Math.round((sum / 13) * 100) / 100;
        }
      }
      return { games: gamesper };
    },
    extraColumns: (columnHelper, _context, t) => [
      columnHelper.accessor("games", {
        header: t("tables.gamesPerWeek"),
        cell: (props) => props.getValue().toFixed(2),
      }),
    ],
    loadGames: null,
    renderExtra: null,
  },

  random: {
    titleKey: "explore.views.random.title",
    descriptionKey: "explore.views.random.description",
    defaultSort: [],
    fetchUrl: null,
    extraFields: (metaGame, info, fetchedData, counts) => ({
      current: metaCount(counts, metaGame, "currentgames"),
      completed: metaCount(counts, metaGame, "completedgames"),
      challenges: metaCount(counts, metaGame, "standingchallenges"),
      ratings: metaCount(counts, metaGame, "ratings"),
    }),
    extraColumns: (columnHelper, _context, t) => {
      const loadingLabel = t("explore.loadingCounts");
      return [
      columnHelper.accessor("current", {
        header: t("tables.current"),
        cell: countLinkCell(
          (id) => `/listgames/current/${id}`,
          loadingLabel
        ),
      }),
      columnHelper.accessor("completed", {
        header: t("tables.completed"),
        cell: countLinkCell(
          (id) => `/listgames/completed/${id}`,
          loadingLabel
        ),
      }),
      columnHelper.accessor("challenges", {
        header: t("tables.challenges"),
        cell: countLinkCell((id) => `/challenges/${id}`, loadingLabel),
      }),
      columnHelper.accessor("ratings", {
        header: t("tables.ratings"),
        cell: countLinkCell((id) => `/ratings/${id}`, loadingLabel),
      }),
    ];
    },
    loadGames: (metas, forceNew) => {
      if (!forceNew) {
        try {
          const stored = sessionStorage.getItem("explore-random-order");
          if (stored) {
            const arr = JSON.parse(stored);
            if (
              arr.length === metas.length &&
              arr.every((id) => metas.includes(id))
            ) {
              return arr;
            }
          }
        } catch (e) {
          // ignore
        }
      }
      const shuffled = shuffle(metas);
      sessionStorage.setItem("explore-random-order", JSON.stringify(shuffled));
      return shuffled;
    },
    renderExtra: (reloadGames, t) => (
      <div className="container" style={{ paddingBottom: "0.5em" }}>
        <button className="button is-small apButton" onClick={reloadGames}>
          <span className="icon is-small">
            <i className="fa fa-random"></i>
          </span>
          <span>{t("Reshuffle")}</span>
        </button>
      </div>
    ),
  },
};
