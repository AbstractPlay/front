import { Link } from "react-router-dom";

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function scoreLookup(fetchedData, prefix, metaGame) {
  const found1w = fetchedData?.[prefix + "1w"]?.find((e) => e.metaGame === metaGame);
  const found1m = fetchedData?.[prefix + "1m"]?.find((e) => e.metaGame === metaGame);
  const found6m = fetchedData?.[prefix + "6m"]?.find((e) => e.metaGame === metaGame);
  const found1y = fetchedData?.[prefix + "1y"]?.find((e) => e.metaGame === metaGame);
  return {
    score1w: found1w === undefined ? 0 : found1w.score,
    score1m: found1m === undefined ? 0 : found1m.score,
    score6m: found6m === undefined ? 0 : found6m.score,
    score1y: found1y === undefined ? 0 : found1y.score,
  };
}

function dividedScoreColumns(columnHelper, divisors) {
  return [
    columnHelper.accessor("score1w", {
      header: "1 week",
      cell: (props) => (props.getValue() / divisors[0]).toFixed(2),
    }),
    columnHelper.accessor("score1m", {
      header: "1 month",
      cell: (props) => (props.getValue() / divisors[1]).toFixed(2),
    }),
    columnHelper.accessor("score6m", {
      header: "6 months",
      cell: (props) => (props.getValue() / divisors[2]).toFixed(2),
    }),
    columnHelper.accessor("score1y", {
      header: "1 year",
      cell: (props) => (props.getValue() / divisors[3]).toFixed(2),
    }),
  ];
}

export const viewConfigs = {
  all: {
    title: "All games",
    description: null,
    defaultSort: [{ id: "gameName", desc: false }],
    fetchUrl: null,
    extraFields: (metaGame, info, fetchedData, counts) => ({
      current: counts?.[metaGame]?.currentgames || 0,
      completed: counts?.[metaGame]?.completedgames || 0,
      challenges: counts?.[metaGame]?.standingchallenges || 0,
      ratings: counts?.[metaGame]?.ratings || 0,
    }),
    extraColumns: (columnHelper, { openChallengeModal }) => [
      columnHelper.accessor("current", {
        header: "Current",
        cell: (props) => (
          <Link to={`/listgames/current/${props.row.original.id}`}>
            {props.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("completed", {
        header: "Completed",
        cell: (props) => (
          <Link to={`/listgames/completed/${props.row.original.id}`}>
            {props.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("challenges", {
        header: "Challenges",
        cell: (props) => (
          <Link to={`/challenges/${props.row.original.id}`}>
            {props.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("ratings", {
        header: "Ratings",
        cell: (props) => (
          <Link to={`/ratings/${props.row.original.id}`}>
            {props.getValue()}
          </Link>
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: (props) => (
          <>
            <button
              className="button is-small apButton"
              onClick={() => openChallengeModal(props.row.original.id)}
            >
              Issue Challenge
            </button>
            <Link to={"/tournaments/" + props.row.original.id}>
              Tournaments
            </Link>
          </>
        ),
      }),
    ],
    loadGames: null,
    renderExtra: null,
    showAllTags: true,
    enableTagFilter: true,
    enableNameSearch: true,
    enableDesignerSearch: true,
    enableStarFilter: true,
    tagColumnHeader: "Tags",
    pageSizeStorageKey: "allgames-show",
    starFilterStorageKey: "allgames-filter-stars",
  },

  newest: {
    title: "Newest",
    description: "When the game was added to the site.",
    defaultSort: [{ id: "dateAdded", desc: true }],
    fetchUrl: null,
    extraFields: (metaGame, info) => ({
      dateAdded: info.dateAdded,
    }),
    extraColumns: (columnHelper) => [
      columnHelper.accessor("dateAdded", {
        header: "Added",
        sortingFn: "datetime",
      }),
    ],
    loadGames: null,
    renderExtra: null,
  },

  hotRaw: {
    title: "Hottest (# moves/day)",
    description: "The average number of moves made per day over the time period.",
    defaultSort: [{ id: "score1w", desc: true }],
    fetchUrl: "https://records.abstractplay.com/mvtimes.json",
    extraFields: (metaGame, info, fetchedData) =>
      scoreLookup(fetchedData, "raw", metaGame),
    extraColumns: (columnHelper) =>
      dividedScoreColumns(columnHelper, [7, 30, 180, 365]),
    loadGames: null,
    renderExtra: null,
  },

  hotPlayers: {
    title: "Hottest (# players/day)",
    description: "The average number of unique players per day over the time period.",
    defaultSort: [{ id: "score1w", desc: true }],
    fetchUrl: "https://records.abstractplay.com/mvtimes.json",
    extraFields: (metaGame, info, fetchedData) =>
      scoreLookup(fetchedData, "players", metaGame),
    extraColumns: (columnHelper) =>
      dividedScoreColumns(columnHelper, [7, 30, 180, 365]),
    loadGames: null,
    renderExtra: null,
  },

  playerSum: {
    title: "Most players",
    description:
      "The total number of unique players who played that game over the time period.",
    defaultSort: [{ id: "score1w", desc: true }],
    fetchUrl: "https://records.abstractplay.com/mvtimes.json",
    extraFields: (metaGame, info, fetchedData) =>
      scoreLookup(fetchedData, "playersSum", metaGame),
    extraColumns: (columnHelper) => [
      columnHelper.accessor("score1w", {
        header: "1 week",
      }),
      columnHelper.accessor("score1m", {
        header: "1 month",
      }),
      columnHelper.accessor("score6m", {
        header: "6 months",
      }),
      columnHelper.accessor("score1y", {
        header: "1 year",
      }),
    ],
    loadGames: null,
    renderExtra: null,
  },

  hindex: {
    title: "Highest h-index",
    description:
      "A game's `h-index` is the number of different players who have played that game at least that many times. So an `h-index` of 5 means that 5 different players have played that game at least 5 times.",
    defaultSort: [{ id: "hindex", desc: true }],
    fetchUrl: "https://records.abstractplay.com/_summary.json",
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
    extraColumns: (columnHelper) => [
      columnHelper.accessor("hindex", {
        header: "h-index",
      }),
    ],
    loadGames: null,
    renderExtra: null,
  },

  stars: {
    title: "Most stars",
    description: "The number of players who have starred this game.",
    defaultSort: [{ id: "stars", desc: true }],
    fetchUrl: null,
    extraFields: (metaGame, info, fetchedData, counts) => ({
      stars: counts !== null ? counts[metaGame]?.stars || 0 : 0,
    }),
    extraColumns: (columnHelper) => [
      columnHelper.accessor("stars", {
        header: "Stars",
      }),
    ],
    loadGames: null,
    renderExtra: null,
  },

  completed: {
    title: "Most completed games per week (all time)",
    description:
      "The number of games completed divided by the total number of weeks (or parts thereof) that the game has been available.",
    defaultSort: [{ id: "games", desc: true }],
    fetchUrl: null,
    extraFields: (metaGame, info, fetchedData, counts) => {
      const now = Date.now();
      const added = new Date(info.dateAdded).getTime();
      const week = 7 * 24 * 60 * 60 * 1000;
      const weeksLive = Math.ceil(Math.abs(now - added) / week);
      let gamesper = 0;
      if (counts !== null) {
        gamesper =
          Math.round(
            ((counts[metaGame]?.completedgames || 0) / weeksLive) * 100
          ) / 100;
      }
      return { games: gamesper };
    },
    extraColumns: (columnHelper) => [
      columnHelper.accessor("games", {
        header: "Games/week",
        cell: (props) => props.getValue().toFixed(2),
      }),
    ],
    loadGames: null,
    renderExtra: null,
  },

  completedRecent: {
    title: "Most completed games per week (recent)",
    description:
      "The number of games completed per week over the past three months (roughly).",
    defaultSort: [{ id: "games", desc: true }],
    fetchUrl: "https://records.abstractplay.com/_summary.json",
    extraFields: (metaGame, info, fetchedData) => {
      let gamesper = 0;
      if (fetchedData !== null) {
        const found = fetchedData.histograms.meta.find(
          (x) => x.game === info.name
        );
        if (found !== undefined) {
          const subset = found.value.slice(-13);
          const sum = subset.reduce((acc, curr) => acc + curr, 0);
          gamesper = Math.round((sum / 13) * 100) / 100;
        }
      }
      return { games: gamesper };
    },
    extraColumns: (columnHelper) => [
      columnHelper.accessor("games", {
        header: "Games/week",
        cell: (props) => props.getValue().toFixed(2),
      }),
    ],
    loadGames: null,
    renderExtra: null,
  },

  random: {
    title: "Random Order",
    description: "Games in random order. Click the button to reshuffle.",
    defaultSort: [],
    fetchUrl: null,
    extraFields: (metaGame, info, fetchedData, counts) => ({
      current:
        counts !== null && counts[metaGame]
          ? counts[metaGame].currentgames
          : 0,
      completed:
        counts !== null && counts[metaGame]
          ? counts[metaGame].completedgames
          : 0,
      challenges:
        counts !== null && counts[metaGame]
          ? counts[metaGame].standingchallenges
          : 0,
      ratings:
        counts !== null && counts[metaGame]
          ? counts[metaGame].ratings
          : 0,
    }),
    extraColumns: (columnHelper) => [
      columnHelper.accessor("current", {
        header: "Current",
        cell: (props) => (
          <Link to={`/listgames/current/${props.row.original.id}`}>
            {props.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("completed", {
        header: "Completed",
        cell: (props) => (
          <Link to={`/listgames/completed/${props.row.original.id}`}>
            {props.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("challenges", {
        header: "Challenges",
        cell: (props) => (
          <Link to={`/challenges/${props.row.original.id}`}>
            {props.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("ratings", {
        header: "Ratings",
        cell: (props) => (
          <Link to={`/ratings/${props.row.original.id}`}>
            {props.getValue()}
          </Link>
        ),
      }),
    ],
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
    renderExtra: (reloadGames) => (
      <div className="container" style={{ paddingBottom: "0.5em" }}>
        <button className="button is-small apButton" onClick={reloadGames}>
          <span className="icon is-small">
            <i className="fa fa-random"></i>
          </span>
          <span>Reshuffle</span>
        </button>
      </div>
    ),
  },
};
