import React, {
  useState,
  useEffect,
  Fragment,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { gameinfo, GameFactory } from "@abstractplay/gameslib";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router-dom";
import { addResource } from "@abstractplay/gameslib";
import { MeContext } from "../pages/Skeleton";
import { useStorageState } from "react-use-storage-state";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import gameImages from "../assets/GameImages";
import Modal from "./Modal";
import TableExplore from "./MetaContainer/TableExplore";
import ExpandableDiv from "./ExpandableDiv";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Auth } from "aws-amplify";
import { API_ENDPOINT_AUTH, API_ENDPOINT_OPEN } from "../config";
import { Helmet } from "react-helmet-async";
import MetaItem from "./MetaContainer/MetaItem";

function Explore(props) {
  const allSize = Number.MAX_SAFE_INTEGER;
  const [globalMe, globalMeSetter] = useContext(MeContext);
  const [games, gamesSetter] = useState([]);
  const [counts, countsSetter] = useState(null);
  const [users, usersSetter] = useState(null);
  const [summary, summarySetter] = useState(null);
  const [selected, selectedSetter] = useStorageState("selected-module", "all");
  const [mvTimes, mvTimesSetter] = useState(null);
  const [selData, selDataSetter] = useState([]);
  const [selCol, selColSetter] = useState([]);
  const [updateCounter, updateCounterSetter] = useState(0);
  const [showState, showStateSetter] = useStorageState("1es-show", 10);
  const [activeImgModal, activeImgModalSetter] = useState("");
  const [expandedPara, expandedParaSetter] = useState([]);
  const [sorting, setSorting] = useState([{ id: "gameName", desc: false }]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [gridView, gridViewSetter] = useStorageState("grid-view", false);
  const { metaGame } = useParams();
  const { t, i18n } = useTranslation();
  addResource(i18n.language);

  const titles = new Map([
    ["all", "All games"],
    ["newest", "Newest"],
    ["hotRaw", "Hottest (# moves/day)"],
    ["hotPlayers", "Hottest (# players/day)"],
    ["playerSum", "Most players"],
    ["hindex", "Highest h-index"],
    ["stars", "Most stars"],
    ["completed", "Most completed games per week (all time)"],
    ["completedRecent", "Most completed games per week (recent)"],
  ]);
  const descriptions = new Map([
    ["all", "The full list of games, sortable and filterable."],
    ["newest", "When the game was added to the site."],
    [
      "hotRaw",
      "The average number of moves made per day over the time period.",
    ],
    [
      "hotPlayers",
      "The average number of unique players per day over the time period.",
    ],
    [
      "playerSum",
      "The total number of unique players who played that game over the time period.",
    ],
    [
      "hindex",
      "A game's `h-index` is the number of different players who have played that game at least that many times. So an `h-index` of 5 means that 5 different players have played that game at least 5 times.",
    ],
    ["stars", "The number of players who have starred this game."],
    [
      "completed",
      "The number of games completed divided by the total number of weeks (or parts thereof) that the game has been available.",
    ],
    [
      "completedRecent",
      "The number of games completed per week over the past three months (roughly).",
    ],
  ]);

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append("query", "meta_games");
        const res = await fetch(url);
        const result = await res.json();
        countsSetter(result);
      } catch (error) {
        countsSetter(null);
        console.log(error);
      }
    }
    fetchData();
  }, [updateCounter]);

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append("query", "user_names");
        const res = await fetch(url);
        const result = await res.json();
        usersSetter(result);
      } catch (error) {
        console.log(error);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL("https://records.abstractplay.com/_summary.json");
        const res = await fetch(url);
        const result = await res.json();
        summarySetter(result);
      } catch (error) {
        console.log(error);
        summarySetter(null);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL("https://records.abstractplay.com/mvtimes.json");
        const res = await fetch(url);
        const result = await res.json();
        mvTimesSetter(result);
      } catch (error) {
        console.log(error);
        mvTimesSetter(null);
      }
    }
    fetchData();
  }, []);

  const openImgModal = (name) => {
    activeImgModalSetter(name);
  };
  const closeImgModal = () => {
    activeImgModalSetter("");
  };
  const togglePara = useCallback(
    (name) => {
      if (expandedPara.includes(name)) {
        const newval = [...expandedPara].filter((n) => n !== name);
        expandedParaSetter(newval);
      } else {
        expandedParaSetter([...expandedPara, name]);
      }
    },
    [expandedPara, expandedParaSetter]
  );

  useEffect(() => {
    let metas = [...gameinfo.keys()].sort((a, b) => {
      const na = gameinfo.get(a).name;
      const nb = gameinfo.get(b).name;
      if (na < nb) return -1;
      else if (na > nb) return 1;
      return 0;
    });
    if (process.env.REACT_APP_REAL_MODE === "production") {
      metas = metas.filter(
        (id) => !gameinfo.get(id).flags.includes("experimental")
      );
    }
    gamesSetter([...metas]);
  }, []);

  const toggleStar = useCallback(
    async (game) => {
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
            query: "toggle_star",
            pars: {
              metaGame: game,
            },
          }),
        });
        if (res.status !== 200) {
          const result = await res.json();
          console.log(
            `An error occurred while saving toggling a star:\n${result}`
          );
        } else {
          const result = await res.json();
          const newMe = JSON.parse(JSON.stringify(globalMe));
          newMe.stars = JSON.parse(result.body);
          globalMeSetter(newMe);
          // update counts locally
          const newcounts = JSON.parse(JSON.stringify(counts));
          if (
            newMe !== null &&
            "stars" in newMe &&
            Array.isArray(newMe.stars)
          ) {
            if (newMe.stars.includes(game)) {
              newcounts[game].stars++;
            } else {
              newcounts[game].stars--;
            }
          }
          countsSetter(newcounts);
        }
      } catch (error) {
        console.log(error);
      }
    },
    [counts, globalMe, globalMeSetter]
  );

  const handleNewChallenge = async (challenge) => {
    try {
      const usr = await Auth.currentAuthenticatedUser();
      console.log("currentAuthenticatedUser", usr);
      await fetch(API_ENDPOINT_AUTH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
        },
        body: JSON.stringify({
          query: "new_challenge",
          pars: {
            ...challenge,
            challenger: { id: globalMe.id, name: globalMe.name },
          },
        }),
      });
    } catch (error) {
      console.log(error);
    }
  };

  const dataHotRaw = useMemo(
    () =>
      games.map((metaGame) => {
        const info = gameinfo.get(metaGame);
        let gameEngine;
        if (info.playercounts.length > 1) {
          gameEngine = GameFactory(metaGame, 2);
        } else {
          gameEngine = GameFactory(metaGame);
        }
        const tags = info.categories
          .map((cat) => {
            return {
              raw: cat,
              tag: t(`categories.${cat}.tag`),
              desc: t(`categories.${cat}.description`),
              full: t(`categories.${cat}.full`),
            };
          })
          .filter((cat) => cat.raw.startsWith("goal"));
        const found1w = mvTimes?.raw1w.find((e) => e.metaGame === metaGame);
        const found1m = mvTimes?.raw1m.find((e) => e.metaGame === metaGame);
        const found6m = mvTimes?.raw6m.find((e) => e.metaGame === metaGame);
        const found1y = mvTimes?.raw1y.find((e) => e.metaGame === metaGame);
        return {
          id: metaGame,
          gameName: info.name,
          image: encodeURIComponent(gameImages[metaGame]),
          links: info.urls,
          designers:
            info.people !== undefined && info.people.length > 0
              ? info.people.filter((p) => p.type === "designer")
              : [],
          description: gameEngine.description(),
          tags,
          starred:
            globalMe !== null &&
            "stars" in globalMe &&
            globalMe.stars !== undefined &&
            globalMe.stars !== null &&
            Array.isArray(globalMe.stars) &&
            globalMe.stars.includes(metaGame)
              ? true
              : false,
          score1w: found1w === undefined ? 0 : found1w.score,
          score1m: found1m === undefined ? 0 : found1m.score,
          score6m: found6m === undefined ? 0 : found6m.score,
          score1y: found1y === undefined ? 0 : found1y.score,
        };
      }),
    [t, mvTimes, games, globalMe]
  );

  const dataHotPlayers = useMemo(
    () =>
      games.map((metaGame) => {
        const info = gameinfo.get(metaGame);
        let gameEngine;
        if (info.playercounts.length > 1) {
          gameEngine = GameFactory(metaGame, 2);
        } else {
          gameEngine = GameFactory(metaGame);
        }
        const tags = info.categories
          .map((cat) => {
            return {
              raw: cat,
              tag: t(`categories.${cat}.tag`),
              desc: t(`categories.${cat}.description`),
              full: t(`categories.${cat}.full`),
            };
          })
          .filter((cat) => cat.raw.startsWith("goal"));
        const found1w = mvTimes?.players1w.find((e) => e.metaGame === metaGame);
        const found1m = mvTimes?.players1m.find((e) => e.metaGame === metaGame);
        const found6m = mvTimes?.players6m.find((e) => e.metaGame === metaGame);
        const found1y = mvTimes?.players1y.find((e) => e.metaGame === metaGame);
        return {
          id: metaGame,
          gameName: info.name,
          image: encodeURIComponent(gameImages[metaGame]),
          links: info.urls,
          designers:
            info.people !== undefined && info.people.length > 0
              ? info.people.filter((p) => p.type === "designer")
              : [],
          description: gameEngine.description(),
          tags,
          starred:
            globalMe !== null &&
            "stars" in globalMe &&
            globalMe.stars !== undefined &&
            globalMe.stars !== null &&
            Array.isArray(globalMe.stars) &&
            globalMe.stars.includes(metaGame)
              ? true
              : false,
          score1w: found1w === undefined ? 0 : found1w.score,
          score1m: found1m === undefined ? 0 : found1m.score,
          score6m: found6m === undefined ? 0 : found6m.score,
          score1y: found1y === undefined ? 0 : found1y.score,
        };
      }),
    [t, mvTimes, games, globalMe]
  );

  const dataPlayersSum = useMemo(
    () =>
      games.map((metaGame) => {
        const info = gameinfo.get(metaGame);
        let gameEngine;
        if (info.playercounts.length > 1) {
          gameEngine = GameFactory(metaGame, 2);
        } else {
          gameEngine = GameFactory(metaGame);
        }
        const tags = info.categories
          .map((cat) => {
            return {
              raw: cat,
              tag: t(`categories.${cat}.tag`),
              desc: t(`categories.${cat}.description`),
              full: t(`categories.${cat}.full`),
            };
          })
          .filter((cat) => cat.raw.startsWith("goal"));
        const found1w = mvTimes?.playersSum1w.find(
          (e) => e.metaGame === metaGame
        );
        const found1m = mvTimes?.playersSum1m.find(
          (e) => e.metaGame === metaGame
        );
        const found6m = mvTimes?.playersSum6m.find(
          (e) => e.metaGame === metaGame
        );
        const found1y = mvTimes?.playersSum1y.find(
          (e) => e.metaGame === metaGame
        );
        return {
          id: metaGame,
          gameName: info.name,
          image: encodeURIComponent(gameImages[metaGame]),
          links: info.urls,
          designers:
            info.people !== undefined && info.people.length > 0
              ? info.people.filter((p) => p.type === "designer")
              : [],
          description: gameEngine.description(),
          tags,
          starred:
            globalMe !== null &&
            "stars" in globalMe &&
            globalMe.stars !== undefined &&
            globalMe.stars !== null &&
            Array.isArray(globalMe.stars) &&
            globalMe.stars.includes(metaGame)
              ? true
              : false,
          score1w: found1w === undefined ? 0 : found1w.score,
          score1m: found1m === undefined ? 0 : found1m.score,
          score6m: found6m === undefined ? 0 : found6m.score,
          score1y: found1y === undefined ? 0 : found1y.score,
        };
      }),
    [t, mvTimes, games, globalMe]
  );

  const dataNewest = useMemo(
    () =>
      games.map((metaGame) => {
        const info = gameinfo.get(metaGame);
        let gameEngine;
        if (info.playercounts.length > 1) {
          gameEngine = GameFactory(metaGame, 2);
        } else {
          gameEngine = GameFactory(metaGame);
        }
        const tags = info.categories
          .map((cat) => {
            return {
              raw: cat,
              tag: t(`categories.${cat}.tag`),
              desc: t(`categories.${cat}.description`),
              full: t(`categories.${cat}.full`),
            };
          })
          .filter((cat) => cat.raw.startsWith("goal"));
        return {
          id: metaGame,
          gameName: info.name,
          image: encodeURIComponent(gameImages[metaGame]),
          links: info.urls,
          designers:
            info.people !== undefined && info.people.length > 0
              ? info.people.filter((p) => p.type === "designer")
              : [],
          description: gameEngine.description(),
          tags,
          starred:
            globalMe !== null &&
            "stars" in globalMe &&
            globalMe.stars !== undefined &&
            globalMe.stars !== null &&
            Array.isArray(globalMe.stars) &&
            globalMe.stars.includes(metaGame)
              ? true
              : false,
          dateAdded: info.dateAdded,
        };
      }),
    [t, games, globalMe]
  );

  const dataStars = useMemo(
    () =>
      games.map((metaGame) => {
        const info = gameinfo.get(metaGame);
        let gameEngine;
        if (info.playercounts.length > 1) {
          gameEngine = GameFactory(metaGame, 2);
        } else {
          gameEngine = GameFactory(metaGame);
        }
        const tags = info.categories
          .map((cat) => {
            return {
              raw: cat,
              tag: t(`categories.${cat}.tag`),
              desc: t(`categories.${cat}.description`),
              full: t(`categories.${cat}.full`),
            };
          })
          .filter((cat) => cat.raw.startsWith("goal"));
        return {
          id: metaGame,
          gameName: info.name,
          image: encodeURIComponent(gameImages[metaGame]),
          links: info.urls,
          designers:
            info.people !== undefined && info.people.length > 0
              ? info.people.filter((p) => p.type === "designer")
              : [],
          description: gameEngine.description(),
          tags,
          starred:
            globalMe !== null &&
            "stars" in globalMe &&
            globalMe.stars !== undefined &&
            globalMe.stars !== null &&
            Array.isArray(globalMe.stars) &&
            globalMe.stars.includes(metaGame)
              ? true
              : false,
          stars: counts !== null ? counts[metaGame]?.stars || 0 : 0,
        };
      }),
    [t, games, counts, globalMe]
  );

  const dataHindex = useMemo(
    () =>
      games.map((metaGame) => {
        const info = gameinfo.get(metaGame);
        let gameEngine;
        if (info.playercounts.length > 1) {
          gameEngine = GameFactory(metaGame, 2);
        } else {
          gameEngine = GameFactory(metaGame);
        }
        const tags = info.categories
          .map((cat) => {
            return {
              raw: cat,
              tag: t(`categories.${cat}.tag`),
              desc: t(`categories.${cat}.description`),
              full: t(`categories.${cat}.full`),
            };
          })
          .filter((cat) => cat.raw.startsWith("goal"));
        let hindex = 0;
        if (summary !== null) {
          const hrec = summary.hMeta.find((i) => i.user === metaGame);
          if (hrec !== undefined) {
            hindex = hrec.value;
          }
        }
        return {
          id: metaGame,
          gameName: info.name,
          image: encodeURIComponent(gameImages[metaGame]),
          links: info.urls,
          designers:
            info.people !== undefined && info.people.length > 0
              ? info.people.filter((p) => p.type === "designer")
              : [],
          description: gameEngine.description(),
          tags,
          starred:
            globalMe !== null &&
            "stars" in globalMe &&
            globalMe.stars !== undefined &&
            globalMe.stars !== null &&
            Array.isArray(globalMe.stars) &&
            globalMe.stars.includes(metaGame)
              ? true
              : false,
          hindex,
        };
      }),
    [t, games, summary, globalMe]
  );

  const dataCompleted = useMemo(
    () =>
      games.map((metaGame) => {
        const info = gameinfo.get(metaGame);
        let gameEngine;
        if (info.playercounts.length > 1) {
          gameEngine = GameFactory(metaGame, 2);
        } else {
          gameEngine = GameFactory(metaGame);
        }
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
        const tags = info.categories
          .map((cat) => {
            return {
              raw: cat,
              tag: t(`categories.${cat}.tag`),
              desc: t(`categories.${cat}.description`),
              full: t(`categories.${cat}.full`),
            };
          })
          .filter((cat) => cat.raw.startsWith("goal"));
        return {
          id: metaGame,
          gameName: info.name,
          image: encodeURIComponent(gameImages[metaGame]),
          links: info.urls,
          designers:
            info.people !== undefined && info.people.length > 0
              ? info.people.filter((p) => p.type === "designer")
              : [],
          description: gameEngine.description(),
          tags,
          starred:
            globalMe !== null &&
            "stars" in globalMe &&
            globalMe.stars !== undefined &&
            globalMe.stars !== null &&
            Array.isArray(globalMe.stars) &&
            globalMe.stars.includes(metaGame)
              ? true
              : false,
          games: gamesper,
        };
      }),
    [t, games, counts, globalMe]
  );

  const dataCompletedRecent = useMemo(
    () =>
      games.map((metaGame) => {
        const info = gameinfo.get(metaGame);
        let gameEngine;
        if (info.playercounts.length > 1) {
          gameEngine = GameFactory(metaGame, 2);
        } else {
          gameEngine = GameFactory(metaGame);
        }
        let gamesper = 0;
        if (summary !== null) {
          const found = summary.histograms.meta.find(
            (x) => x.game === info.name
          );
          if (found !== undefined) {
            const subset = found.value.slice(-13);
            const sum = subset.reduce((acc, curr) => acc + curr, 0);
            gamesper = Math.round((sum / 13) * 100) / 100;
          }
        }
        const tags = info.categories
          .map((cat) => {
            return {
              raw: cat,
              tag: t(`categories.${cat}.tag`),
              desc: t(`categories.${cat}.description`),
              full: t(`categories.${cat}.full`),
            };
          })
          .filter((cat) => cat.raw.startsWith("goal"));
        return {
          id: metaGame,
          gameName: info.name,
          image: encodeURIComponent(gameImages[metaGame]),
          links: info.urls,
          designers:
            info.people !== undefined && info.people.length > 0
              ? info.people.filter((p) => p.type === "designer")
              : [],
          description: gameEngine.description(),
          tags,
          starred:
            globalMe !== null &&
            "stars" in globalMe &&
            globalMe.stars !== undefined &&
            globalMe.stars !== null &&
            Array.isArray(globalMe.stars) &&
            globalMe.stars.includes(metaGame)
              ? true
              : false,
          games: gamesper,
        };
      }),
    [t, games, summary, globalMe]
  );

  const columnHelper = createColumnHelper();
  const columnsHot = useMemo(
    () => [
      columnHelper.display({
        id: "toggleStar",
        cell: (props) => (
          <div className="control">
            <div
              className="starContainer"
              onClick={() => toggleStar(props.row.original.id)}
            >
              {props.row.original.starred ? (
                <span className="icon glowingStar">
                  <i className="fa fa-star"></i>
                </span>
              ) : (
                <span className="icon">
                  <i className="fa fa-star-o"></i>
                </span>
              )}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("gameName", {
        header: "Game",
        cell: (props) => (
          <Link to={`/games/${props.row.original.id}`}>{props.getValue()}</Link>
        ),
        filterFn: "includesString",
      }),
      columnHelper.accessor(
        (row) =>
          row.designers.length > 0
            ? row.designers.map((d) => d.name).join(" ")
            : "",
        {
          header: "Designers",
          id: "designers",
          cell: (props) =>
            props.row.original.designers.length === 0
              ? ""
              : props.row.original.designers
                  .map(({ name, urls }, ind) =>
                    urls !== undefined && urls.length > 0 ? (
                      <a
                        key={`designr_${ind}`}
                        href={urls[0]}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {name}
                      </a>
                    ) : (
                      <span key={`designr_${ind}`}>{name}</span>
                    )
                  )
                  .reduce((prev, curr) => [prev, ", ", curr]),
        }
      ),
      columnHelper.accessor("image", {
        header: "Image",
        cell: (props) => (
          <>
            <div id={"svg" + props.row.original.id}>
              <img
                src={`data:image/svg+xml;utf8,${props.getValue()}`}
                alt={props.row.original.id}
                width="auto"
                height="auto"
                onClick={() => openImgModal(props.row.original.id)}
              />
            </div>
          </>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("description", {
        header: "Description",
        cell: (props) => (
          <ExpandableDiv
            expanded={expandedPara.includes(props.row.original.id)}
            handleClick={() => togglePara(props.row.original.id)}
          >
            <ReactMarkdown rehypePlugins={[rehypeRaw]} className="content">
              {props.getValue()}
            </ReactMarkdown>
          </ExpandableDiv>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("tags", {
        header: "Goal",
        cell: (props) =>
          props
            .getValue()
            .map((tag, ind) =>
              tag === "" ? null : (
                <span key={`tag_${ind}`} className="tag" title={tag.desc}>
                  {tag.tag}
                </span>
              )
            )
            .reduce(
              (acc, x) =>
                acc === null ? (
                  x
                ) : (
                  <>
                    {acc} {x}
                  </>
                ),
              null
            ),
        enableSorting: false,
      }),
      columnHelper.accessor("score1w", {
        header: "1 week",
        cell: (props) => (props.getValue() / 7).toFixed(2),
      }),
      columnHelper.accessor("score1m", {
        header: "1 month",
        cell: (props) => (props.getValue() / 30).toFixed(2),
      }),
      columnHelper.accessor("score6m", {
        header: "6 months",
        cell: (props) => (props.getValue() / 180).toFixed(2),
      }),
      columnHelper.accessor("score1y", {
        header: "1 year",
        cell: (props) => (props.getValue() / 365).toFixed(2),
      }),
    ],
    [columnHelper, expandedPara, togglePara, toggleStar]
  );

  const columnsSum = useMemo(
    () => [
      columnHelper.display({
        id: "toggleStar",
        cell: (props) => (
          <div className="control">
            <div
              className="starContainer"
              onClick={() => toggleStar(props.row.original.id)}
            >
              {props.row.original.starred ? (
                <span className="icon glowingStar">
                  <i className="fa fa-star"></i>
                </span>
              ) : (
                <span className="icon">
                  <i className="fa fa-star-o"></i>
                </span>
              )}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("gameName", {
        header: "Game",
        cell: (props) => (
          <Link to={`/games/${props.row.original.id}`}>{props.getValue()}</Link>
        ),
        filterFn: "includesString",
      }),
      columnHelper.accessor(
        (row) =>
          row.designers.length > 0
            ? row.designers.map((d) => d.name).join(" ")
            : "",
        {
          header: "Designers",
          id: "designers",
          cell: (props) =>
            props.row.original.designers.length === 0
              ? ""
              : props.row.original.designers
                  .map(({ name, urls }, ind) =>
                    urls !== undefined && urls.length > 0 ? (
                      <a
                        key={`designr_${ind}`}
                        href={urls[0]}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {name}
                      </a>
                    ) : (
                      <span key={`designr_${ind}`}>{name}</span>
                    )
                  )
                  .reduce((prev, curr) => [prev, ", ", curr]),
        }
      ),
      columnHelper.accessor("image", {
        header: "Image",
        cell: (props) => (
          <>
            <div id={"svg" + props.row.original.id}>
              <img
                src={`data:image/svg+xml;utf8,${props.getValue()}`}
                alt={props.row.original.id}
                width="auto"
                height="auto"
                onClick={() => openImgModal(props.row.original.id)}
              />
            </div>
          </>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("description", {
        header: "Description",
        cell: (props) => (
          <ExpandableDiv
            expanded={expandedPara.includes(props.row.original.id)}
            handleClick={() => togglePara(props.row.original.id)}
          >
            <ReactMarkdown rehypePlugins={[rehypeRaw]} className="content">
              {props.getValue()}
            </ReactMarkdown>
          </ExpandableDiv>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("tags", {
        header: "Goal",
        cell: (props) =>
          props
            .getValue()
            .map((tag, ind) =>
              tag === "" ? null : (
                <span key={`tag_${ind}`} className="tag" title={tag.desc}>
                  {tag.tag}
                </span>
              )
            )
            .reduce(
              (acc, x) =>
                acc === null ? (
                  x
                ) : (
                  <>
                    {acc} {x}
                  </>
                ),
              null
            ),
        enableSorting: false,
      }),
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
    [columnHelper, expandedPara, togglePara, toggleStar]
  );

  const columnsStars = useMemo(
    () => [
      columnHelper.display({
        id: "toggleStar",
        cell: (props) => (
          <div className="control">
            <div
              className="starContainer"
              onClick={() => toggleStar(props.row.original.id)}
            >
              {props.row.original.starred ? (
                <span className="icon glowingStar">
                  <i className="fa fa-star"></i>
                </span>
              ) : (
                <span className="icon">
                  <i className="fa fa-star-o"></i>
                </span>
              )}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("gameName", {
        header: "Game",
        cell: (props) => (
          <Link to={`/games/${props.row.original.id}`}>{props.getValue()}</Link>
        ),
        filterFn: "includesString",
      }),
      columnHelper.accessor(
        (row) =>
          row.designers.length > 0
            ? row.designers.map((d) => d.name).join(" ")
            : "",
        {
          header: "Designers",
          id: "designers",
          cell: (props) =>
            props.row.original.designers.length === 0
              ? ""
              : props.row.original.designers
                  .map(({ name, urls }, ind) =>
                    urls !== undefined && urls.length > 0 ? (
                      <a
                        key={`designr_${ind}`}
                        href={urls[0]}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {name}
                      </a>
                    ) : (
                      <span key={`designr_${ind}`}>{name}</span>
                    )
                  )
                  .reduce((prev, curr) => [prev, ", ", curr]),
        }
      ),
      columnHelper.accessor("image", {
        header: "Image",
        cell: (props) => (
          <>
            <div id={"svg" + props.row.original.id}>
              <img
                src={`data:image/svg+xml;utf8,${props.getValue()}`}
                alt={props.row.original.id}
                width="auto"
                height="auto"
                onClick={() => openImgModal(props.row.original.id)}
              />
            </div>
          </>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("description", {
        header: "Description",
        cell: (props) => (
          <ExpandableDiv
            expanded={expandedPara.includes(props.row.original.id)}
            handleClick={() => togglePara(props.row.original.id)}
          >
            <ReactMarkdown rehypePlugins={[rehypeRaw]} className="content">
              {props.getValue()}
            </ReactMarkdown>
          </ExpandableDiv>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("tags", {
        header: "Goal",
        cell: (props) =>
          props
            .getValue()
            .map((tag, ind) =>
              tag === "" ? null : (
                <span key={`tag_${ind}`} className="tag" title={tag.desc}>
                  {tag.tag}
                </span>
              )
            )
            .reduce(
              (acc, x) =>
                acc === null ? (
                  x
                ) : (
                  <>
                    {acc} {x}
                  </>
                ),
              null
            ),
        enableSorting: false,
      }),
      columnHelper.accessor("stars", {
        header: "Stars",
      }),
    ],
    [columnHelper, expandedPara, togglePara, toggleStar]
  );

  const columnsNewest = useMemo(
    () => [
      columnHelper.display({
        id: "toggleStar",
        cell: (props) => (
          <div className="control">
            <div
              className="starContainer"
              onClick={() => toggleStar(props.row.original.id)}
            >
              {props.row.original.starred ? (
                <span className="icon glowingStar">
                  <i className="fa fa-star"></i>
                </span>
              ) : (
                <span className="icon">
                  <i className="fa fa-star-o"></i>
                </span>
              )}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("gameName", {
        header: "Game",
        cell: (props) => (
          <Link to={`/games/${props.row.original.id}`}>{props.getValue()}</Link>
        ),
        filterFn: "includesString",
      }),
      columnHelper.accessor(
        (row) =>
          row.designers.length > 0
            ? row.designers.map((d) => d.name).join(" ")
            : "",
        {
          header: "Designers",
          id: "designers",
          cell: (props) =>
            props.row.original.designers.length === 0
              ? ""
              : props.row.original.designers
                  .map(({ name, urls }, ind) =>
                    urls !== undefined && urls.length > 0 ? (
                      <a
                        key={`designr_${ind}`}
                        href={urls[0]}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {name}
                      </a>
                    ) : (
                      <span key={`designr_${ind}`}>{name}</span>
                    )
                  )
                  .reduce((prev, curr) => [prev, ", ", curr]),
        }
      ),
      columnHelper.accessor("image", {
        header: "Image",
        cell: (props) => (
          <>
            <div id={"svg" + props.row.original.id}>
              <img
                src={`data:image/svg+xml;utf8,${props.getValue()}`}
                alt={props.row.original.id}
                width="auto"
                height="auto"
                onClick={() => openImgModal(props.row.original.id)}
              />
            </div>
          </>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("description", {
        header: "Description",
        cell: (props) => (
          <ExpandableDiv
            expanded={expandedPara.includes(props.row.original.id)}
            handleClick={() => togglePara(props.row.original.id)}
          >
            <ReactMarkdown rehypePlugins={[rehypeRaw]} className="content">
              {props.getValue()}
            </ReactMarkdown>
          </ExpandableDiv>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("tags", {
        header: "Goal",
        cell: (props) =>
          props
            .getValue()
            .map((tag, ind) =>
              tag === "" ? null : (
                <span key={`tag_${ind}`} className="tag" title={tag.desc}>
                  {tag.tag}
                </span>
              )
            )
            .reduce(
              (acc, x) =>
                acc === null ? (
                  x
                ) : (
                  <>
                    {acc} {x}
                  </>
                ),
              null
            ),
        enableSorting: false,
      }),
      columnHelper.accessor("dateAdded", {
        header: "Added",
        sortingFn: "datetime",
      }),
    ],
    [columnHelper, expandedPara, togglePara, toggleStar]
  );

  const columnsHindex = useMemo(
    () => [
      columnHelper.display({
        id: "toggleStar",
        cell: (props) => (
          <div className="control">
            <div
              className="starContainer"
              onClick={() => toggleStar(props.row.original.id)}
            >
              {props.row.original.starred ? (
                <span className="icon glowingStar">
                  <i className="fa fa-star"></i>
                </span>
              ) : (
                <span className="icon">
                  <i className="fa fa-star-o"></i>
                </span>
              )}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("gameName", {
        header: "Game",
        cell: (props) => (
          <Link to={`/games/${props.row.original.id}`}>{props.getValue()}</Link>
        ),
        filterFn: "includesString",
      }),
      columnHelper.accessor(
        (row) =>
          row.designers.length > 0
            ? row.designers.map((d) => d.name).join(" ")
            : "",
        {
          header: "Designers",
          id: "designers",
          cell: (props) =>
            props.row.original.designers.length === 0
              ? ""
              : props.row.original.designers
                  .map(({ name, urls }, ind) =>
                    urls !== undefined && urls.length > 0 ? (
                      <a
                        key={`designr_${ind}`}
                        href={urls[0]}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {name}
                      </a>
                    ) : (
                      <span key={`designr_${ind}`}>{name}</span>
                    )
                  )
                  .reduce((prev, curr) => [prev, ", ", curr]),
        }
      ),
      columnHelper.accessor("image", {
        header: "Image",
        cell: (props) => (
          <>
            <div id={"svg" + props.row.original.id}>
              <img
                src={`data:image/svg+xml;utf8,${props.getValue()}`}
                alt={props.row.original.id}
                width="auto"
                height="auto"
                onClick={() => openImgModal(props.row.original.id)}
              />
            </div>
          </>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("description", {
        header: "Description",
        cell: (props) => (
          <ExpandableDiv
            expanded={expandedPara.includes(props.row.original.id)}
            handleClick={() => togglePara(props.row.original.id)}
          >
            <ReactMarkdown rehypePlugins={[rehypeRaw]} className="content">
              {props.getValue()}
            </ReactMarkdown>
          </ExpandableDiv>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("tags", {
        header: "Goal",
        cell: (props) =>
          props
            .getValue()
            .map((tag, ind) =>
              tag === "" ? null : (
                <span key={`tag_${ind}`} className="tag" title={tag.desc}>
                  {tag.tag}
                </span>
              )
            )
            .reduce(
              (acc, x) =>
                acc === null ? (
                  x
                ) : (
                  <>
                    {acc} {x}
                  </>
                ),
              null
            ),
        enableSorting: false,
      }),
      columnHelper.accessor("hindex", {
        header: "h-index",
      }),
    ],
    [columnHelper, expandedPara, togglePara, toggleStar]
  );

  const columnsCompleted = useMemo(
    () => [
      columnHelper.display({
        id: "toggleStar",
        cell: (props) => (
          <div className="control">
            <div
              className="starContainer"
              onClick={() => toggleStar(props.row.original.id)}
            >
              {props.row.original.starred ? (
                <span className="icon glowingStar">
                  <i className="fa fa-star"></i>
                </span>
              ) : (
                <span className="icon">
                  <i className="fa fa-star-o"></i>
                </span>
              )}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("gameName", {
        header: "Game",
        cell: (props) => (
          <Link to={`/games/${props.row.original.id}`}>{props.getValue()}</Link>
        ),
        filterFn: "includesString",
      }),
      columnHelper.accessor(
        (row) =>
          row.designers.length > 0
            ? row.designers.map((d) => d.name).join(" ")
            : "",
        {
          header: "Designers",
          id: "designers",
          cell: (props) =>
            props.row.original.designers.length === 0
              ? ""
              : props.row.original.designers
                  .map(({ name, urls }, ind) =>
                    urls !== undefined && urls.length > 0 ? (
                      <a
                        key={`designr_${ind}`}
                        href={urls[0]}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {name}
                      </a>
                    ) : (
                      <span key={`designr_${ind}`}>{name}</span>
                    )
                  )
                  .reduce((prev, curr) => [prev, ", ", curr]),
        }
      ),
      columnHelper.accessor("image", {
        header: "Image",
        cell: (props) => (
          <>
            <div id={"svg" + props.row.original.id}>
              <img
                src={`data:image/svg+xml;utf8,${props.getValue()}`}
                alt={props.row.original.id}
                width="auto"
                height="auto"
                onClick={() => openImgModal(props.row.original.id)}
              />
            </div>
          </>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("description", {
        header: "Description",
        cell: (props) => (
          <ExpandableDiv
            expanded={expandedPara.includes(props.row.original.id)}
            handleClick={() => togglePara(props.row.original.id)}
          >
            <ReactMarkdown rehypePlugins={[rehypeRaw]} className="content">
              {props.getValue()}
            </ReactMarkdown>
          </ExpandableDiv>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("tags", {
        header: "Goal",
        cell: (props) =>
          props
            .getValue()
            .map((tag, ind) =>
              tag === "" ? null : (
                <span key={`tag_${ind}`} className="tag" title={tag.desc}>
                  {tag.tag}
                </span>
              )
            )
            .reduce(
              (acc, x) =>
                acc === null ? (
                  x
                ) : (
                  <>
                    {acc} {x}
                  </>
                ),
              null
            ),
        enableSorting: false,
      }),
      columnHelper.accessor("games", {
        header: "Games/week",
        cell: (props) => props.getValue().toFixed(2),
      }),
    ],
    [columnHelper, expandedPara, togglePara, toggleStar]
  );

  const handleSelChange = useCallback(
    (sel) => {
      closeImgModal();
      switch (sel) {
        case "all":
          break;
        case "hotRaw":
          selDataSetter(dataHotRaw);
          selColSetter(columnsHot);
          setSorting([{ id: "score1w", desc: true }]);
          break;
        case "hotPlayers":
          selDataSetter(dataHotPlayers);
          selColSetter(columnsHot);
          setSorting([{ id: "score1w", desc: true }]);
          break;
        case "playerSum":
          selDataSetter(dataPlayersSum);
          selColSetter(columnsSum);
          setSorting([{ id: "score1w", desc: true }]);
          break;
        case "newest":
          selDataSetter(dataNewest);
          selColSetter(columnsNewest);
          setSorting([{ id: "dateAdded", desc: true }]);
          break;
        case "hindex":
          selDataSetter(dataHindex);
          selColSetter(columnsHindex);
          setSorting([{ id: "hindex", desc: true }]);
          break;
        case "stars":
          selDataSetter(dataStars);
          selColSetter(columnsStars);
          setSorting([{ id: "stars", desc: true }]);
          break;
        case "completed":
          selDataSetter(dataCompleted);
          selColSetter(columnsCompleted);
          setSorting([{ id: "games", desc: true }]);
          break;
        case "completedRecent":
          selDataSetter(dataCompletedRecent);
          selColSetter(columnsCompleted);
          setSorting([{ id: "games", desc: true }]);
          break;
        default:
          selDataSetter(dataHotRaw);
          selColSetter(columnsHot);
          setSorting([{ id: "score30", desc: true }]);
      }
      selectedSetter(sel);
    },
    [
      dataHotRaw,
      dataHotPlayers,
      columnsHot,
      dataStars,
      columnsStars,
      dataCompleted,
      columnsCompleted,
      dataCompletedRecent,
      dataHindex,
      columnsHindex,
      dataPlayersSum,
      columnsSum,
      dataNewest,
      columnsNewest,
      selectedSetter,
    ]
  );

  useEffect(() => {
    handleSelChange(selected);
    // leaving handleSelChange out of the dep array because it causes an infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, expandedPara, counts]);

  const table = useReactTable({
    data: selData,
    columns: selCol,
    // filterFns: {
    //     customIncludesFilter: (row, columnId, filterValue) => {
    //       // return the filtered rows
    //       return row.getValue(columnId).includes(filterValue);
    //     },
    // },
    state: {
      sorting,
      columnVisibility: {
        toggleStar: globalMe !== null && !gridView,
        actions: globalMe !== null,
      },
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableSortingRemoval: false,
  });

  useEffect(() => {
    table.setPageSize(showState);
  }, [showState, table]);

  const tableNavigation = (
    <>
      <div className="level smallerText tableNav">
        <div className="level-left">
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
              Page <strong>{table.getState().pagination.pageIndex + 1}</strong>{" "}
              of <strong>{table.getPageCount()}</strong> (
              {table.getPrePaginationRowModel().rows.length} total games)
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
          <div className="level-item field has-addons is-centered">
            <div className="control">
              <button
                className={
                  gridView
                    ? "button is-small apButtonNeutral"
                    : "button is-small apButton"
                }
                onClick={() => gridViewSetter(false)}
              >
                <span className="icon is-small">
                  <i className="fa fa-th-list"></i>
                </span>
                <span>Table</span>
              </button>
            </div>
            <div className="control">
              <button
                className={
                  gridView
                    ? "button is-small apButton"
                    : "button is-small apButtonNeutral"
                }
                onClick={() => gridViewSetter(true)}
              >
                <span className="icon is-small">
                  <i className="fa fa-th-large"></i>
                </span>
                <span>Grid</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (metaGame === undefined || metaGame === null || !gameinfo.has(metaGame)) {
    return (
      <>
        <Helmet>
          <meta property="og:title" content="Explore available games" />
          <meta
            property="og:url"
            content="https://play.abstractplay.com/explore"
          />
          <meta
            property="og:description"
            content="Different ways of exploring what's popular on Abstract Play."
          />
        </Helmet>
        <article>
          <div
            className="container has-text-centered"
            style={{ paddingBottom: "1em" }}
          >
            <h1 className="title">{t("ExploreGames")}</h1>
          </div>
          <div className="content">
            <p>
              This page lets you explore different ways of sorting the list of
              games. Select your desired view below. Clicking on a game's name
              will take you to that game's landing page with additional
              information.
            </p>
          </div>
          <div className="container">
            <div className="control">
              <div className="select">
                <select onChange={(e) => handleSelChange(e.target.value)}>
                  {[...titles.entries()].map(([key, title]) => {
                    return (
                      <option value={key} selected={selected === key}>
                        {title}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>
          <hr />
          {selected === "all" ? (
            <TableExplore
              counts={counts}
              games={games}
              summary={summary}
              toggleStar={toggleStar.bind(this)}
              handleChallenge={handleNewChallenge.bind(this)}
              users={users}
              updateSetter={updateCounterSetter}
            />
          ) : (
            <>
              <div className="container" style={{ paddingBottom: "1em" }}>
                <h1 className="subtitle">
                  {selected !== null ? titles.get(selected) : "Unknown"}
                </h1>
              </div>
              <ReactMarkdown rehypePlugins={[rehypeRaw]} className="content">
                {selected !== null ? descriptions.get(selected) : ""}
              </ReactMarkdown>
              <div className="container">
                {tableNavigation}
                <table
                  className={
                    gridView ? "table apTable gameGrid" : "table apTable"
                  }
                >
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id} className="stickyHeader">
                        {headerGroup.headers.map((header) => (
                          <th key={header.id}>
                            {header.isPlaceholder ? null : (
                              <>
                                <div
                                  {...{
                                    className: header.column.getCanSort()
                                      ? "sortable"
                                      : "",
                                    onClick:
                                      header.column.getToggleSortingHandler(),
                                  }}
                                >
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                  {{
                                    asc: (
                                      <Fragment>
                                        &nbsp;<i className="fa fa-angle-up"></i>
                                      </Fragment>
                                    ),
                                    desc: (
                                      <Fragment>
                                        &nbsp;
                                        <i className="fa fa-angle-down"></i>
                                      </Fragment>
                                    ),
                                  }[header.column.getIsSorted()] ?? null}
                                  {header.id !== "description" ? null : (
                                    <>
                                      {" "}
                                      <span
                                        style={{
                                          fontSize: "smaller",
                                          fontWeight: "normal",
                                          paddingTop: 0,
                                        }}
                                      >
                                        ({t("ClickExpand")})
                                      </span>
                                    </>
                                  )}
                                </div>
                              </>
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
            </>
          )}
        </article>
        {selected === "all"
          ? null
          : games.map((metaGame) => {
              return (
                <Modal
                  key={metaGame}
                  buttons={[{ label: "Close", action: closeImgModal }]}
                  show={activeImgModal === metaGame}
                  title={`Board image for ${gameinfo.get(metaGame).name}`}
                >
                  <div className="content">
                    <img
                      src={`data:image/svg+xml;utf8,${encodeURIComponent(
                        gameImages[metaGame]
                      )}`}
                      alt={metaGame}
                      width="100%"
                      height="auto"
                    />
                  </div>
                </Modal>
              );
            })}
      </>
    );
  } else if (counts !== null) {
    return (
      <>
        <Helmet>
          <meta
            property="og:title"
            content={`${gameinfo.get(metaGame).name}: Game Information`}
          />
          <meta
            property="og:url"
            content="https://play.abstractplay.com/games"
          />
          <meta
            property="og:description"
            content={`Information on the game ${gameinfo.get(metaGame).name}`}
          />
        </Helmet>
        <MetaItem
          game={gameinfo.get(metaGame)}
          counts={counts[metaGame]}
          summary={summary}
          toggleStar={toggleStar.bind(this)}
          handleChallenge={handleNewChallenge.bind(this)}
        />
      </>
    );
  }
}

export default Explore;
