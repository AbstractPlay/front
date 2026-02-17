import React, {
  Fragment,
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import rehypeRaw from "rehype-raw";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { render } from "@abstractplay/renderer";
import { cloneDeep } from "lodash";
import { API_ENDPOINT_OPEN } from "../config";
import { callAuthApi } from "../lib/api";
import { gameinfo, GameFactory, addResource } from "@abstractplay/gameslib";
import { Buffer } from "buffer";
import GameMoves from "./GameMove/GameMoves";
import GameStatus from "./GameMove/GameStatus";
import MoveEntry from "./GameMove/MoveEntry";
import MoveResults from "./GameMove/MoveResults";
import MiscButtons from "./GameMove/MiscButtons";
import Board from "./GameMove/Board";
import RenderOptionsModal from "./RenderOptionsModal";
import Modal from "./Modal";
import ClipboardCopy from "./GameMove/ClipboardCopy";
import UserChats from "./GameMove/UserChats";
import Joyride, { STATUS } from "react-joyride";
import { useStorageState } from "react-use-storage-state";
import { toast } from "react-toastify";
import { nanoid } from "nanoid";
import { Helmet } from "react-helmet-async";
import { useStore } from "../stores";

// import helpers
import {
  isInterestingComment,
  replaceNames,
  setStatus,
} from "../lib/GameMove/misc";
import {
  setupGame,
  populateChecked,
  processNewMove,
} from "../lib/GameMove/gameStuff";
import {
  mergeExistingExploration,
  mergeExploration,
  mergePublicExploration,
  fixMoveOutcomes,
  analyzeExplorationForCommentedFlag,
  getFocusNode,
  isExplorer,
  canExploreMove,
  setURL,
  saveExploration,
  setCanPublish,
  mergePrivateExploration,
  getAllNodeComments,
} from "../lib/GameMove/exploration";
import { processNewSettings, setupColors } from "../lib/GameMove/settings";

// sets the default order of components in the vertical layouts
const defaultChunkOrder = ["status", "move", "board", "moves", "chat"];

function GameMove(props) {
  const [dbgame, dbgameSetter] = useState(null);
  const [renderrep, renderrepSetter] = useState(null);
  const [rendered, setRendered] = useState([]);
  // The place in the tree the display is currently showing. If history, just the move number. If exploration, the move from which we are exploring and then the path through the tree.
  const [focus, focusSetter] = useState(null);
  const [move, moveSetter] = useState({
    move: "",
    valid: true,
    message: "",
    complete: 0,
    rendered: "",
  });
  const [refresh, setRefresh] = useState(0);
  const [locked, setLocked] = useState(false);
  const [error, errorSetter] = useState(false);
  const [tourState, tourStateSetter] = useState([]);
  const [showTour, showTourSetter] = useStorageState("joyride-play-show", true);
  const [startTour, startTourSetter] = useState(false);
  const [showSettings, showSettingsSetter] = useState(false);
  const [showMoveConfirm, showMoveConfirmSetter] = useState(false);
  const [showResignConfirm, showResignConfirmSetter] = useState(false);
  const [showDeleteSubtreeConfirm, showDeleteSubtreeConfirmSetter] =
    useState(false);
  const [showPremoveConfirm, showPremoveConfirmSetter] = useState(false);
  const [pendingPremoveAction, pendingPremoveActionSetter] = useState(null); // { node, isChange }
  const [showTimeoutConfirm, showTimeoutConfirmSetter] = useState(false);
  const [showGameDetails, showGameDetailsSetter] = useState(false);
  const [showGameDump, showGameDumpSetter] = useState(false);
  const [showGameNote, showGameNoteSetter] = useState(false);
  const [showInject, showInjectSetter] = useState(false);
  const [injectedState, injectedStateSetter] = useState("");
  const [userSettings, userSettingsSetter] = useState();
  const [gameSettings, gameSettingsSetter] = useState();
  const [settings, settingsSetter] = useState(null);
  const [rotIncrement, rotIncrementSetter] = useState(0);
  const [comments, commentsSetter] = useState([]);
  const [commentsTooLong, commentsTooLongSetter] = useState(false);
  const [submitting, submittingSetter] = useState(false);
  const [explorationFetched, explorationFetchedSetter] = useState(false);
  const globalMe = useStore((state) => state.globalMe);
  const [gameRec, gameRecSetter] = useState(undefined);
  const [showCustomCSS, showCustomCSSSetter] = useState(false);
  const [customCSS, customCSSSetter] = useStorageState("custom-css", {});
  const [newCSS, newCSSSetter] = useState("");
  const [cssActive, cssActiveSetter] = useState(true);
  const [gameNote, gameNoteSetter] = useState(null);
  const [interimNote, interimNoteSetter] = useState("");
  const [screenWidth, screenWidthSetter] = useState(window.innerWidth);
  const [mobileOrder, mobileOrderSetter] = useStorageState(
    "play-mobile-order",
    [...defaultChunkOrder]
  );
  const [verticalLayout, verticalLayoutSetter] = useStorageState(
    "play-vertical-layout",
    false
  );
  const [explorer, explorerSetter] = useState(false); // just whether the user clicked on the explore button. Also see isExplorer.
  const [parenthetical, parentheticalSetter] = useState([]); // any description after the game name (e.g., "unrated", "exploration disabled")
  // pieInvoked is used to trigger the game reload after the function is called
  const [pieInvoked, pieInvokedSetter] = useState(false);
  // used to construct the localized string of players in check
  const [inCheck, inCheckSetter] = useState("");
  const [drawMessage, drawMessageSetter] = useState("");
  const [canPublish, canPublishSetter] = useState("no");
  const [boardKey, boardKeySetter] = useState(nanoid()); // used to trigger board redrawing
  const errorMessageRef = useRef("");
  const movesRef = useRef(null);
  const statusRef = useRef({});
  // whether user has entered a partial move that can be rendered
  const partialMoveRenderRef = useRef(false);
  const focusRef = useRef();
  focusRef.current = focus;
  // Revisit this moveRef variable. It works, but is it really needed? It was changed to deal with missing dependency warnings on the useEffect that updates the svg board. Is that really needed?
  // Does it have to be a Ref, or can it just be a regular variable? Or even just the state variable?
  const moveRef = useRef();
  moveRef.current = move;
  const boardImage = useRef();
  const stackImage = useRef();
  const gameRef = useRef(null);
  // gameID and nodes, an array of GameNodes at each move. For games that are not complete the node at the current move (last entry in the array) holds the tree of explored moves.
  // for completed games every node might hold a tree of explored moves.
  const explorationRef = useRef({ gameID: null, nodes: null });
  const explorationFetchingRef = useRef(false);
  // This is used for hover effects. Has the currently rendered engine state with partial moves, if any, applied.
  const engineRef = useRef(null);
  const myMove = useStore((state) => state.myMove);
  const setMyMove = useStore((state) => state.setMyMove);
  const params = new URLSearchParams(useLocation().search);
  const [moveNumberParam] = useState(params.get("move"));
  const [nodeidParam] = useState(params.get("nodeid"));
  const navigate = useNavigate();
  const allUsers = useStore((state) => state.users);
  const colourContext = useStore((state) => state.colourContext);
  const [colorsChanged, colorsChangedSetter] = useState(0);

  const { t, i18n } = useTranslation();
  // State is passed as a prop from GameMoveWrapper
  const state = props.routerState;

  const { metaGame, cbits, gameID } = useParams();
  const cbit = parseInt(cbits, 10);
  // these are the details that appear in the `i` icon modal
  const gameDeets = gameinfo.get(metaGame);
  let gameEngine;
  if (gameDeets.playercounts.length > 1) {
    gameEngine = GameFactory(gameDeets.uid, 2);
  } else {
    gameEngine = GameFactory(gameDeets.uid);
  }
  let designerString;
  // eslint-disable-next-line no-prototype-builtins
  if (gameDeets.hasOwnProperty("people")) {
    let designers = gameDeets.people
      .filter((p) => p.type === "designer")
      .map((p) => {
        if ("urls" in p && p.urls !== undefined && p.urls.length > 0) {
          let str = `[${p.name}](${p.urls[0]})`;
          if ("apid" in p && p.apid !== undefined && p.apid.length > 0) {
            str += ` [(AP)](/player/${p.apid})`;
          }
          return str;
        } else if ("apid" in p && p.apid !== undefined && p.apid.length > 0) {
          return `[${p.name}](/player/${p.apid})`;
        } else {
          return p.name;
        }
      });
    if (designers.length === 1) {
      designerString = "Designer: ";
    } else {
      designerString = "Designers: ";
    }
    designerString += designers.join(", ");
  }
  let coderString;
  // eslint-disable-next-line no-prototype-builtins
  if (gameDeets.hasOwnProperty("people")) {
    let coders = gameDeets.people
      .filter((p) => p.type === "coder")
      .map((p) => {
        if ("urls" in p && p.urls !== undefined && p.urls.length > 0) {
          let str = `[${p.name}](${p.urls[0]})`;
          if ("apid" in p && p.apid !== undefined && p.apid.length > 0) {
            str += ` [(AP)](/player/${p.apid})`;
          }
          return str;
        } else if ("apid" in p && p.apid !== undefined && p.apid.length > 0) {
          return `[${p.name}](/player/${p.apid})`;
        } else {
          return p.name;
        }
      });
    if (coders.length === 1) {
      coderString = "Coder: ";
    } else {
      coderString = "Coders: ";
    }
    coderString += coders.join(", ");
  }

  const effectiveColourContext = useMemo(() => {
    let ctx = { ...colourContext };
    if (globalMe?.customizations?.[metaGame]?.colourContext) {
      ctx = { ...ctx, ...globalMe.customizations[metaGame].colourContext };
    } else if (globalMe?.customizations?._default?.colourContext) {
      ctx = { ...ctx, ...globalMe.customizations._default.colourContext };
    }
    return ctx;
  }, [colourContext, globalMe, metaGame]);

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    tourStateSetter([
      {
        target: ".tourWelcome",
        content: t("tour.play.welcome"),
        disableBeacon: true,
      },
      {
        target: ".tourStatus",
        content: t("tour.play.status"),
        disableBeacon: true,
      },
      {
        target: ".tourMove",
        content: t("tour.play.move"),
        disableBeacon: true,
      },
      {
        target: ".tourMoveList",
        content: t("tour.play.movelist"),
        disableBeacon: true,
      },
      {
        target: ".tourChat",
        content: t("tour.play.chat"),
        disableBeacon: true,
      },
      {
        target: ".tourBoard",
        content: t("tour.play.board"),
        disableBeacon: true,
      },
      {
        target: ".tourBoardButtons",
        content: t("tour.play.boardbuttons"),
        disableBeacon: true,
      },
      {
        target: ".tourSettings",
        content: t("tour.play.settings"),
        disableBeacon: true,
      },
    ]);
  }, [t, tourStateSetter]);

  const handleJoyrideCallback = (data) => {
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status)) {
      showTourSetter(false);
    }
  };

  // initialize customcss modal
  useEffect(() => {
    if (
      customCSS !== undefined &&
      metaGame in customCSS &&
      customCSS[metaGame] !== undefined
    ) {
      newCSSSetter(customCSS[metaGame].css);
      cssActiveSetter(customCSS[metaGame].active);
    } else {
      newCSSSetter("");
      cssActiveSetter(true);
    }
  }, [customCSS, metaGame]);

  // apply (or not) any custom CSS
  useEffect(() => {
    if (
      customCSS !== undefined &&
      metaGame in customCSS &&
      customCSS[metaGame] !== undefined &&
      customCSS[metaGame].css !== "" &&
      customCSS[metaGame].active
    ) {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(customCSS[metaGame].css);
      document.adoptedStyleSheets = [sheet];
    } else {
      document.adoptedStyleSheets = [];
    }
  }, [customCSS, metaGame]);

  useEffect(() => {
    boardKeySetter(nanoid());
  }, [verticalLayout]);

  const copyHWDiagram = async () => {
    if (metaGame === "homeworlds" && gameRef !== null && renderrep !== null) {
      const diagram = {
        numPlayers: gameRef.current.numPlayers,
        universe: [],
      };
      for (let i = 0; i < renderrep.board.length; i++) {
        const node = { ...renderrep.board[i] };
        node.owner = node.seat;
        delete node.seat;
        node.ships = [...renderrep.pieces[i].map((s) => s.substring(1))];
        diagram.universe.push(node);
      }
      try {
        await navigator.clipboard.writeText(JSON.stringify(diagram));
        toast(
          "Current board copied to clipboard. Visit https://hwdiagrams.abstractplay.com to import the diagram."
        );
      } catch (err) {
        toast(`Failed to copy: ${err}`, { type: "error" });
      }
    }
  };

  const handleMoveUp = (key) => {
    const idx = mobileOrder.findIndex((s) => s === key);
    if (idx !== -1) {
      // if first item, move to end
      if (idx === 0) {
        mobileOrderSetter([...mobileOrder.slice(1), mobileOrder[0]]);
      }
      // otherwise, shift
      else {
        const left = mobileOrder.slice(0, idx - 1);
        const right = mobileOrder.slice(idx + 1);
        mobileOrderSetter([
          ...left,
          mobileOrder[idx],
          mobileOrder[idx - 1],
          ...right,
        ]);
      }
      boardKeySetter(nanoid());
    }
  };

  const handleMoveDown = (key) => {
    const idx = mobileOrder.findIndex((s) => s === key);
    if (idx !== -1) {
      // if last item, move to top
      if (idx === mobileOrder.length - 1) {
        mobileOrderSetter([mobileOrder[idx], ...mobileOrder.slice(0, idx)]);
      }
      // otherwise, shift
      else {
        const left = mobileOrder.slice(0, idx);
        const right = mobileOrder.slice(idx + 2);
        mobileOrderSetter([
          ...left,
          mobileOrder[idx + 1],
          mobileOrder[idx],
          ...right,
        ]);
      }
      boardKeySetter(nanoid());
    }
  };

  const saveCustomCSS = () => {
    if (metaGame !== null && metaGame !== undefined) {
      const newobj = JSON.parse(JSON.stringify(customCSS));
      if (newCSS === "") {
        delete newobj[metaGame];
      } else {
        newobj[metaGame] = {
          css: newCSS,
          active: cssActive,
        };
      }
      customCSSSetter(newobj);
    }
    showCustomCSSSetter(false);
  };

  useEffect(() => {
    var lng = "en";
    if (globalMe && globalMe.language !== undefined) lng = globalMe.language;
    if (i18n.language !== lng) {
      i18n.changeLanguage(lng);
      console.log(`changed language  to ${lng}`);
    }
  }, [i18n, globalMe]);

  useEffect(() => {
    console.log("Fetching game data");

    // We have some evidence that get_game sometimes fails to connect (but report_problem succeeds), implying that a retry might help. Submitting the attempt count
    // to the backend so that we can monitor this.
    async function fetchWithRetry(fetchFn, maxRetries = 3, baseDelay = 1000) {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await fetchFn(attempt);
        } catch (error) {
          const isNetworkError =
            error.name === "TypeError" && error.message.includes("fetch");
          const isTemporaryError =
            error.message.includes("Failed to fetch") ||
            error.message.includes("NetworkError") ||
            error.message.includes("ERR_NETWORK");

          if (
            attempt === maxRetries ||
            (!isNetworkError && !isTemporaryError)
          ) {
            throw error;
          }

          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
          console.log(
            `get_game attempt ${attempt + 1} failed, retrying in ${Math.round(
              delay
            )}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    async function fetchData() {
      try {
        const result = await fetchWithRetry(async (attempt) => {
          let data;
          let status;
          const res = await callAuthApi(
            "get_game",
            {
              id: gameID,
              metaGame: metaGame,
              cbit: cbit,
              ...(attempt > 0 && { retryAttempt: attempt }),
            },
            false
          );
          if (res) {
            status = res.status;
            if (status !== 200) {
              const result = await res.json();
              const error = new Error(
                `auth get_game failed, id = ${gameID}, metaGame = ${metaGame}, cbit = ${cbit}, status = ${status}, message: ${result.message}, body: ${result.body}`
              );
              error.status = status;
              throw error;
            } else {
              const result = await res.json();
              data = JSON.parse(result.body);
            }
          } else {
            // res == null means no auth token available, probably non-logged in user, try unauthenticated fetch
            var url = new URL(API_ENDPOINT_OPEN);
            url.searchParams.append("query", "get_game");
            url.searchParams.append("id", gameID);
            url.searchParams.append("metaGame", metaGame);
            url.searchParams.append("cbit", cbit);
            if (attempt > 0) {
              url.searchParams.append("retryAttempt", attempt.toString());
            }
            const res = await fetch(url);
            status = res.status;
            if (status !== 200) {
              const result = await res.json();
              const error = new Error(
                `no auth get_game failed, id = ${gameID}, metaGame = ${metaGame}, cbit = ${cbit}, status = ${status}, message: ${result.message}, body: ${result.body}`
              );
              error.status = status;
              throw error;
            } else {
              data = await res.json();
            }
          }
          return { data, status };
        });

        const { data, status } = result;

        if (
          status === 200 &&
          data !== null &&
          data !== undefined &&
          "game" in data
        ) {
          if (state) {
            data.game.commentedFromList = state.commented;
            data.game.completedGameKey = state.key;
          }
          //   console.log(`Status: ${status}, Data: ${JSON.stringify(data)}`);
          dbgameSetter(data.game);
          if (data.comments !== undefined) {
            commentsSetter(data.comments);
            if (
              data.comments.reduce(
                (s, a) => s + 110 + Buffer.byteLength(a.comment, "utf8"),
                0
              ) > 350000
            ) {
              commentsTooLongSetter(true);
            }
            const hasInterestingComments = data.comments.some((c) =>
              isInterestingComment(c.comment)
            );
            // Check if commented flag needs to be updated (only for in-progress games). This is mostly to "fix" old games that already had chats but no commented flag.
            if (
              data.game.toMove !== "" &&
              (data.game.commented ? 0 : data.game.commented) !==
                (hasInterestingComments ? 1 : 0)
            ) {
              // Send update to backend to update commented flag for in-progress game
              callAuthApi("update_commented", {
                id: gameID,
                metaGame: metaGame,
                cbit: 0,
                commented: hasInterestingComments ? 1 : 0,
              }).catch((err) => {
                console.log("Failed to update commented flag:", err);
              });
            }
            data.game.commented = hasInterestingComments ? 1 : 0;
          }
        } else {
          if ("message" in data) {
            errorMessageRef.current = `get_game failed, id = ${gameID}, metaGame = ${metaGame}, cbit = ${cbit}, status = ${status}, data.message: ${data.message}`;
            errorSetter(true);
          } else {
            errorMessageRef.current = `get_game, An unspecified error occurred while trying to fetch the game: ${JSON.stringify(
              data
            )}`;
            errorSetter(true);
          }
        }
      } catch (error) {
        console.log(error.message);
        errorMessageRef.current = `get_game, error.message: ${String(
          error
        )} for id = ${gameID}, metaGame = ${metaGame}, cbit = ${cbit}`;
        errorSetter(true);
      }
    }

    // Don't fetch data if user is refreshing a completed game. No point in fetching the game again, the only thing that could have changed is public exploration
    if (explorationRef.current.gameID === gameID && game && game.gameOver) {
      explorationFetchingRef.current = false;
      explorationFetchedSetter(false);
    } else {
      fetchData();
    }
  }, [
    gameID,
    metaGame,
    cbit,
    errorSetter,
    errorMessageRef,
    pieInvoked,
    commentsSetter,
    commentsTooLongSetter,
    refresh,
  ]);

  useEffect(() => {
    const handler = () => {
      setRefresh((val) => val + 1);
    };

    window.addEventListener("refresh-data", handler);
    return () => window.removeEventListener("refresh-data", handler);
  }, []);

  const checkTime = useCallback(async (query) => {
    try {
      const res = await callAuthApi(query, {
        id: gameRef.current.id,
        metaGame: gameRef.current.metaGame,
      });
      if (!res) return;
      let game0 = JSON.parse(res.body);
      if (game0 !== "not_a_timeloss" && game0 !== "not_abandoned") {
        dbgameSetter(game0);
      }
    } catch (err) {
      setError(
        `checkTime with query: ${query} for metaGame ${gameRef.current.metaGame} and game ${gameRef.current.id} and failed with error: ${err.message}`
      );
    }
  }, []);

  useEffect(() => {
    if (dbgame !== null) {
      // I don't think the gameID check is still needed, but better safe than sorry
      const exploration =
        explorationRef.current && explorationRef.current.gameID === dbgame.id
          ? explorationRef.current.nodes
          : null;
      const foc = cloneDeep(focus);
      const game = dbgame;
      // Preserve explorer state if we're still on the same game (e.g., color change)
      // Reset to false if it's a new game or settings changed to "always off"
      const preserveExplorer =
        explorationRef.current &&
        explorationRef.current.gameID === dbgame.id &&
        globalMe?.settings?.all?.exploration !== -1;
      setupGame(
        game,
        gameRef,
        globalMe,
        preserveExplorer ? explorer : false,
        partialMoveRenderRef,
        renderrepSetter,
        engineRef,
        statusRef,
        movesRef,
        focusSetter,
        explorationRef,
        moveSetter,
        gameRecSetter,
        canPublishSetter,
        globalMe?.settings?.[game.metaGame]?.display,
        navigate
      );
      if (exploration !== null) {
        if (explorationRef.current.nodes.length === exploration.length) {
          let ok = true;
          for (let i = 0; ok && i < explorationRef.current.nodes.length; i++) {
            if (exploration[i].move !== explorationRef.current.nodes[i].move) {
              ok = false;
            }
          }
          if (ok) {
            for (let i = 0; i < explorationRef.current.nodes.length; i++) {
              explorationRef.current.nodes[i].children =
                exploration[i].children;
              explorationRef.current.nodes[i].comment = exploration[i].comment;
              explorationRef.current.nodes[i].commented =
                exploration[i].commented;
            }
            handleGameMoveClick(foc);
          }
          // if we got here from the "trigger a refresh" button, we should probably also fetch exploration in case the user is exploring on more than one device
          explorationFetchingRef.current = false;
          explorationFetchedSetter(false);
        } else if (explorationRef.current.nodes.length > exploration.length) {
          // page refreshed and opponent moved
          mergeExistingExploration(
            exploration.length - 1,
            exploration[exploration.length - 1],
            explorationRef.current.nodes,
            gameRef.current,
            true
          );
        }
      }
      processNewSettings(
        gameRef.current.me > -1
          ? game.players.find((p) => p.id === globalMe.id).settings
          : {},
        globalMe?.settings,
        gameRef,
        settingsSetter,
        gameSettingsSetter,
        userSettingsSetter,
        globalMe,
        effectiveColourContext
      );

      // check for note
      // note should only be defined if the user is logged in and
      // is the owner of the note.
      if (
        "note" in game &&
        game.note !== undefined &&
        game.note !== null &&
        game.note.length > 0
      ) {
        gameNoteSetter(game.note);
        interimNoteSetter(game.note);
      } else {
        gameNoteSetter(null);
        interimNoteSetter("");
      }
      populateChecked(gameRef, engineRef, t, inCheckSetter);
      parentheticalSetter([]);
      if (
        "tournament" in game &&
        game.tournament !== undefined &&
        game.tournament !== null
      ) {
        // Check if tournament reference is already in the new format (metaGame#tournamentId)
        const tournamentLink = game.tournament.includes("#")
          ? `/tournament/${game.tournament.replace("#", "/")}`
          : `/tournament/${game.tournament}?gameId=${game.id}&metaGame=${game.metaGame}`;

        parentheticalSetter((val) => [
          ...val,
          <Link to={tournamentLink}>tournament</Link>,
        ]);
      }
      if ("event" in game && game.event !== undefined && game.event !== null) {
        parentheticalSetter((val) => [
          ...val,
          <Link to={`/event/${game.event}`}>event</Link>,
        ]);
      }
      if (game.rated === false) {
        parentheticalSetter((val) => [...val, "unrated"]);
      }
      if (game.noExplore !== undefined && game.noExplore === true) {
        parentheticalSetter((val) => [...val, "exploration disabled"]);
      }
      if (
        game.toMove !== "" &&
        !game.players.some((p) => p.id === globalMe?.id)
      ) {
        if (game.clockHard) {
          // If you are viewing someone else's game, and a player has timed out, let the server know.
          if (Array.isArray(game.toMove)) {
            const elapsed = Date.now() - game.lastMoveTime;
            if (
              game.toMove.some(
                (p, i) => p && game.players[i].time - elapsed < 0
              )
            ) {
              checkTime("timeloss");
            }
          } else {
            const toMove = parseInt(game.toMove);
            if (
              game.players[toMove].time - (Date.now() - game.lastMoveTime) <
              0
            ) {
              checkTime("timeloss");
            }
          }
        } else {
          // If you are viewing someone else's game, and both players are "red", let the server know to abandon the game.
          const now = new Date().getTime();
          if (
            allUsers !== null &&
            allUsers !== undefined &&
            game.players.every(
              (p) =>
                allUsers.find((u) => u.id === p.id)?.lastSeen <
                now - 1000 * 60 * 60 * 24 * 30
            )
          ) {
            checkTime("abandoned");
          }
        }
      }
      // Somehow react loses track of this, so explicitly remove this.
      //   if (boardImage.current !== null) {
      //     console.log("deleting board image");
      //     const svg = boardImage.current.querySelector("svg");
      //     if (svg !== null) {
      //       svg.remove();
      //     }
      //   }
    }
  }, [
    dbgame,
    globalMe,
    allUsers,
    pieInvoked,
    t,
    navigate,
    checkTime,
    colourContext,
  ]);

  async function reportError(error) {
    if (!error || error === "") return;

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

        // Retry with truncated error if first attempt fails
        await fetch(API_ENDPOINT_OPEN, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: "report_problem",
            pars: {
              error: `Error reporting another error, status: ${status}, message: ${
                result.message
              }, body: ${
                result.body
              }, original error (truncated): ${error.slice(0, 1000)}`,
            },
          }),
        });
      }
    } catch (e) {
      // Final fallback with truncated error
      await fetch(API_ENDPOINT_OPEN, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: "report_problem",
          pars: {
            error: `Error reporting another error: ${String(
              e
            )}, original error (truncated): ${error.slice(0, 1000)}`,
          },
        }),
      });
      console.log(
        `Error auto-reporting another error!\nOriginal error: ${JSON.stringify(
          error
        )}\nFetching error: ${JSON.stringify(e)}`
      );
    }
  }

  const handleNoteUpdate = useCallback(
    async (newNote) => {
      if (newNote.length > 0 && !/^\s*$/.test(newNote)) {
        gameNoteSetter(newNote);
      } else {
        gameNoteSetter(null);
      }
      if (globalMe !== undefined) {
        try {
          const res = await callAuthApi("update_note", {
            gameId: gameRef.current.id,
            note: newNote,
          });
          if (!res) return;
          const result = await res.json();
          if (result && result.statusCode && result.statusCode !== 200)
            setError(`update_note failed with: ${result.body}`);
        } catch (err) {
          console.log(err);
          //setError(err.message);
        }
      }
    },
    [globalMe, gameNoteSetter]
  );

  useEffect(() => {
    async function fetchPrivateExploration() {
      // Use ref to prevent concurrent fetches (state updates are async)
      if (explorationFetchingRef.current) return;
      explorationFetchingRef.current = true;
      explorationFetchedSetter(true);
      try {
        let data;
        let status;
        const res = await callAuthApi(
          "get_exploration",
          {
            game: gameID,
            move: explorationRef.current.nodes.length,
          },
          false
        );
        if (res) {
          status = res.status;
          if (status !== 200) {
            const result = await res.json();
            errorMessageRef.current = `auth get_exploration failed, game = ${gameID}, move = ${explorationRef.current.nodes.length}, status = ${status}, message: ${result.message}, body: ${result.body}`;
            errorSetter(true);
          } else {
            const result = await res.json();
            data = JSON.parse(result.body);
            data = data.map((d) => {
              if (d && typeof d.tree === "string") {
                d.tree = JSON.parse(d.tree);
              }
              return d;
            });
            mergeExploration(
              gameRef.current,
              explorationRef.current.nodes,
              data,
              globalMe,
              errorSetter,
              errorMessageRef
            );
            focusSetter(cloneDeep(focus)); // just to trigger a rerender...
          }
        }
      } catch (error) {
        console.log(error);
        errorMessageRef.current = `get_exploration, error.message: ${error.message}`;
        errorSetter(true);
      }
    }

    async function fetchPublicExploration() {
      // Use ref to prevent concurrent fetches (state updates are async)
      if (explorationFetchingRef.current) return;
      explorationFetchingRef.current = true;
      explorationFetchedSetter(true);
      console.log("fetching public exploration");
      var url = new URL(API_ENDPOINT_OPEN);
      url.searchParams.append("query", "get_public_exploration");
      url.searchParams.append("game", gameID);
      const res = await fetch(url);
      if (res.status !== 200) {
        const result = await res.json();
        errorMessageRef.current = `get_public_exploration failed, game = ${gameID}, status = ${res.status}, message: ${result.message}, body: ${result.body}`;
        errorSetter(true);
      } else {
        const result = await res.json();
        if (result !== undefined) {
          if (result.length > 0) {
            const data = result.map((d) => {
              if (d && typeof d.tree === "string") {
                d.tree = JSON.parse(d.tree);
              }
              return d;
            });
            mergePublicExploration(
              gameRef.current,
              explorationRef.current.nodes,
              data
            );
            fixMoveOutcomes(
              explorationRef.current.nodes,
              explorationRef.current.nodes.length - 1
            );
          }
          // Check and update commented flag for completed games
          if (gameRef.current.gameOver) {
            var correctFlag = analyzeExplorationForCommentedFlag(
              explorationRef.current.nodes
            );
            if (correctFlag === 0 && gameRef.current.commented === 1)
              correctFlag = 1;
            // Always store the computed correct flag on the game object for use in saveExploration
            gameRef.current.commented = correctFlag;

            // Only update backend if we came from ListGames (commentedFromList was stored)
            if (
              gameRef.current.commentedFromList !== undefined &&
              gameRef.current.numMoves !== undefined &&
              gameRef.current.numMoves > gameRef.current.numPlayers
            ) {
              const currentFlag = gameRef.current.commentedFromList;
              if (correctFlag !== currentFlag) {
                // Update the backend
                const res = callAuthApi(
                  "update_commented",
                  {
                    id: gameID,
                    metaGame: gameRef.current.metaGame,
                    cbit: 1, // Completed games have cbit=1
                    commented: correctFlag,
                    gameEnded: gameRef.current.completedGameKey.substring(
                      0,
                      13
                    ),
                  },
                  false
                );
                if (res) {
                  res
                    .then(() => {
                      console.log(
                        `Successfully updated commented flag to ${correctFlag}`
                      );
                    })
                    .catch((err) => {
                      console.log(
                        "Failed to update commented flag for completed game:",
                        err
                      );
                    });
                }
              }
            }
          }
          if (result.length > 0) {
            if (moveNumberParam) {
              const moveNum = parseInt(moveNumberParam, 10);
              let exPath = [];
              if (nodeidParam) {
                exPath =
                  explorationRef.current.nodes[moveNum].findNode(nodeidParam);
              }
              handleGameMoveClick({ moveNumber: moveNum, exPath });
            } else {
              focusSetter(cloneDeep(focus)); // just to trigger a rerender...
            }
          }
        } else {
          // even if no exploration, support moveNumberParam
          if (moveNumberParam) {
            const moveNum = parseInt(moveNumberParam, 10);
            handleGameMoveClick({ moveNumber: moveNum, exPath: [] });
          }
        }
      }
    }

    if (
      focus &&
      !explorationFetched &&
      (gameRef.current.canExplore || gameRef.current.gameOver)
    ) {
      if (gameRef.current.gameOver) {
        fetchPublicExploration();
      } else {
        fetchPrivateExploration();
      }
    }
  }, [
    focus,
    explorationFetched,
    gameID,
    explorer,
    globalMe,
    moveNumberParam,
    nodeidParam,
    state,
  ]);

  const handlePlaygroundExport = async (state, moveNumber) => {
    if (state === null) {
      let tmpEngine = GameFactory(game.metaGame, game.state);
      tmpEngine.stack = tmpEngine.stack.slice(0, moveNumber + 1);
      tmpEngine.load();
      state = tmpEngine.cheapSerialize();
    }
    const res = await callAuthApi("new_playground", {
      metaGame: game.metaGame,
      state,
    });
    if (!res) return;
    if (res.status !== 200) {
      const result = await res.json();
      errorMessageRef.current = `playground export failed, metaGame = ${game.metaGame}, state = ${state}, status = ${res.status}, message: ${result.message}, body: ${result.body}`;
      errorSetter(true);
    } else {
      navigate("/playground");
    }
  };

  const handleResize = () => {
    screenWidthSetter(window.innerWidth);
  };
  window.addEventListener("resize", handleResize);

  // when the user clicks on the list of moves (or move list navigation)
  const handleGameMoveClick = (foc) => {
    // console.log("foc = ", foc);
    let node = getFocusNode(explorationRef.current.nodes, game, foc);
    if (
      !(isExplorer(explorer, globalMe) && game.canExplore) &&
      foc.moveNumber === explorationRef.current.nodes.length - 1
    ) {
      node.children = []; // if the user doesn't want to explore, don't confuse them with even 1 move variation.
    }
    let engine = GameFactory(game.metaGame, node.state);
    partialMoveRenderRef.current = false;
    foc.canExplore = canExploreMove(game, explorationRef.current.nodes, foc);
    if (foc.canExplore && !game.noMoves) {
      movesRef.current = engine.moves();
      console.log(`Number of possible moves: ${movesRef.current.length}`);
    }
    focusSetter(foc);
    engineRef.current = engine;
    console.log(
      `(handleGameMoveClick) ABOUT TO RERENDER! Display setting: ${settings?.display}`
    );
    renderrepSetter(
      replaceNames(
        engine.render({
          perspective: gameRef.current.me ? gameRef.current.me + 1 : 1,
          altDisplay: settings?.display,
        }),
        gameRef.current.players
      )
    );
    setURL(explorationRef.current.nodes, foc, game, navigate);
    const isPartialSimMove =
      gameRef.current.simultaneous &&
      (foc.exPath.length === 1 ||
        (foc.exPath.length === 0 &&
          foc.moveNumber === explorationRef.current.nodes.length - 1 &&
          !gameRef.current.canSubmit));
    setStatus(engine, gameRef.current, isPartialSimMove, "", statusRef.current);
    if (game.simultaneous) {
      moveSetter({
        ...engine.validateMove("", gameRef.current.me + 1),
        rendered: "",
        move: "",
      });
    } else {
      moveSetter({ ...engine.validateMove(""), rendered: "", move: "" });
    }
    const metaInfo = gameinfo.get(game.metaGame);
    if (metaInfo.flags.includes("custom-colours")) {
      setupColors(
        settings,
        gameRef.current,
        globalMe,
        effectiveColourContext,
        node
      );
      colorsChangedSetter((val) => val + 1);
    }
  };

  function handleReset() {
    if (
      focus.moveNumber + focus.exPath.length !==
      explorationRef.current.nodes.length - 1
    ) {
      handleGameMoveClick({
        moveNumber: explorationRef.current.nodes.length - 1,
        exPath: [],
      });
    }
    populateChecked(gameRef, engineRef, t, inCheckSetter);
  }

  function handleToSubmit() {
    handleGameMoveClick({
      moveNumber: explorationRef.current.nodes.length - 1,
      exPath: [focus.exPath[0]],
    });
    populateChecked(gameRef, engineRef, t, inCheckSetter);
  }

  // The user has clicked the "Invoke pie rule" button
  const handlePie = async () => {
    console.log("Pie invoked!");
    try {
      const res = await callAuthApi("invoke_pie", {
        id: gameRef.current.id,
        metaGame: gameRef.current.metaGame,
        cbit: cbit,
      });
      if (!res) return;
      const result = await res.json();
      if (result.statusCode !== 200) {
        // setError(JSON.parse(result.body));
        throw JSON.parse(result.body);
      }
      pieInvokedSetter(true);
      gameRef.current.pieInvoked = true;
    } catch (err) {
      setError(`invoke_pie failed with ${err.message}`);
    }
  };

  // handler when user types a move, selects a move (from list of available moves) or clicks on his stash.
  const handleMove = (value) => {
    let node = getFocusNode(
      explorationRef.current.nodes,
      gameRef.current,
      focus
    );
    let gameEngineTmp = GameFactory(gameRef.current.metaGame, node.state);
    let result;
    if (gameRef.current.simultaneous)
      result = gameEngineTmp.validateMove(value, gameRef.current.me + 1);
    else result = gameEngineTmp.validateMove(value);
    result.move = value;
    result.rendered = move.rendered;
    // console.log(result);
    processNewMove(
      result,
      explorer,
      globalMe,
      focus,
      gameRef,
      movesRef,
      statusRef,
      explorationRef.current.nodes,
      errorMessageRef,
      partialMoveRenderRef,
      renderrepSetter,
      engineRef,
      errorSetter,
      focusSetter,
      moveSetter,
      settings,
      navigate
    );
    populateChecked(gameRef, engineRef, t, inCheckSetter);
    const metaInfo = gameinfo.get(gameRef.current.metaGame);
    if (metaInfo.flags.includes("custom-colours")) {
      setupColors(settings, gameRef.current, globalMe, effectiveColourContext, {
        state: engineRef.current.state(),
      });
      colorsChangedSetter((val) => val + 1);
    }
  };

  // handler when user clicks on "complete move" (for a partial move that could be complete)
  const handleView = () => {
    const newmove = cloneDeep(move);
    newmove.complete = 1;
    processNewMove(
      newmove,
      explorer,
      globalMe,
      focus,
      gameRef,
      movesRef,
      statusRef,
      explorationRef.current.nodes,
      errorMessageRef,
      partialMoveRenderRef,
      renderrepSetter,
      engineRef,
      errorSetter,
      focusSetter,
      moveSetter,
      settings,
      navigate
    );
    populateChecked(gameRef, engineRef, t, inCheckSetter);
  };

  const handleStashClick = (player, count, movePart, handler) => {
    if (handler) {
      handleMove(handler(move.move, movePart));
    } else {
      handleMove(move.move + movePart);
    }
  };

  useEffect(() => {
    let options = {};

    function boardClick(row, col, piece) {
      // console.log(`boardClick:(${row},${col},${piece})`);
      let node = getFocusNode(
        explorationRef.current.nodes,
        gameRef.current,
        focusRef.current
      );
      let gameEngineTmp = GameFactory(gameRef.current.metaGame, node.state);
      let result = gameRef.current.simultaneous
        ? gameEngineTmp.handleClickSimultaneous(
            moveRef.current.move,
            row,
            col,
            gameRef.current.me + 1,
            piece
          )
        : gameEngineTmp.handleClick(moveRef.current.move, row, col, piece);
      result.rendered = moveRef.current.rendered;
      processNewMove(
        result,
        explorer,
        globalMe,
        focus,
        gameRef,
        movesRef,
        statusRef,
        explorationRef.current.nodes,
        errorMessageRef,
        partialMoveRenderRef,
        renderrepSetter,
        engineRef,
        errorSetter,
        focusSetter,
        moveSetter,
        settings,
        navigate
      );
      populateChecked(gameRef, engineRef, t, inCheckSetter);
      const metaInfo = gameinfo.get(gameRef.current.metaGame);
      if (metaInfo.flags.includes("custom-colours")) {
        setupColors(
          settings,
          gameRef.current,
          globalMe,
          effectiveColourContext,
          {
            state: engineRef.current.state(),
          }
        );
        colorsChangedSetter((val) => val + 1);
      }
    }

    function expand(row, col) {
      const svg = stackImage.current.querySelector("svg");
      if (svg !== null) svg.remove();
      options.divid = "stack";
      options.svgid = "theStackSVG";
      options.colourContext = effectiveColourContext;
      render(engineRef.current.renderColumn(row, col), options);
    }

    if (boardImage.current !== null) {
      //   const svg =
      //     boardImage.current.parentElement.querySelector("#theBoardSVG");
      //   if (svg !== null) {
      //     console.log("deleting board image in preparation of rerendering");
      //     svg.remove();
      //   }
      if (renderrep !== null && settings !== null) {
        options = {};
        if (focus.canExplore) {
          options.boardClick = boardClick;
        }
        options.rotate = settings.rotate;
        if (settings.color === "blind") {
          options.colourBlind = true;
          // } else if (settings.color === "patterns") {
          //   options.patterns = true;
        }
        if (settings.color !== "standard" && settings.color !== "blind") {
          console.log(`Looking for a palette named ${settings.color}`);
          const palette = globalMe.palettes?.find(
            (p) => p.name === settings.color
          );
          if (palette !== undefined) {
            options.colours = [...palette.colours];
          }
        }
        if (gameRef.current.stackExpanding) {
          options.boardHover = (row, col, piece) => {
            expand(col, row);
          };
        }
        options.showAnnotations = settings.annotate;
        options.svgid = "theBoardSVG";
        options.colourContext = effectiveColourContext;
        if (globalMe?.customizations?.[metaGame]) {
          const custom = globalMe.customizations[metaGame];
          if (
            custom.palette &&
            Array.isArray(custom.palette) &&
            custom.palette.length > 0
          ) {
            options.colours = custom.palette;
          }
        } else if (globalMe?.customizations?._default) {
          const custom = globalMe.customizations._default;
          if (
            custom.palette &&
            Array.isArray(custom.palette) &&
            custom.palette.length > 0
          ) {
            options.colours = custom.palette;
          }
        }
        // extend all palettes to 12 colours
        if (
          options.colours !== undefined &&
          Array.isArray(options.colours) &&
          options.colours.length < 12
        ) {
          while (options.colours.length < 12) {
            options.colours.push("#fff");
          }
        }
        // handle "Always use my colour" preference
        if (
          options.colours !== undefined &&
          Array.isArray(options.colours) &&
          options.colours.length > 0 &&
          globalMe?.settings?.all?.myColor &&
          game.me > 0
        ) {
          const mycolor = options.colours.shift();
          options.colours.splice(game.me, 0, mycolor);
        }
        console.log("rendering", renderrep, options);
        const tmpRendered = [];
        const renders = [];
        if (!Array.isArray(renderrep)) {
          renders.push(renderrep);
        } else {
          renders.push(...renderrep);
        }
        for (let i = 0; i < renders.length; i++) {
          const r = renders[i];
          const container = document.createElement("div");
          container.style.position = "absolute";
          container.style.left = "-9999px"; // hide off-screen
          document.body.appendChild(container); // ✅ attach to DOM
          render(r, {
            ...options,
            divelem: container,
            boardClick:
              i === renders.length - 1
                ? focus.canExplore
                  ? boardClick
                  : undefined
                : undefined,
          });
          const svgNode = container.firstChild;
          tmpRendered.push(svgNode);
          document.body.removeChild(container); // ✅ clean up
        }
        setRendered([...tmpRendered]);
      }
    }
  }, [
    renderrep,
    globalMe,
    focus,
    settings,
    explorer,
    t,
    navigate,
    boardKey,
    effectiveColourContext,
  ]);

  useEffect(() => {
    colorsChangedSetter((val) => val + 1);
  }, [effectiveColourContext]);

  const setError = (error) => {
    if (error.Message !== undefined) errorMessageRef.current = error.Message;
    else errorMessageRef.current = JSON.stringify(error);
    errorSetter(true);
  };

  const handleUpdateRenderOptions = () => {
    showSettingsSetter(true);
  };

  useEffect(() => {
    /**
     * Takes the current renderrep and deduces the correct minimum rotation increment.
     * A value of 0 means the board may not be rotated.
     */
    const getRotationIncrement = (metaGame, rep, engine) => {
      if (
        "renderer" in rep &&
        rep.renderer !== undefined &&
        (rep.renderer === "stacking-tiles" ||
          rep.renderer === "stacking-3D" ||
          rep.renderer === "entropy" ||
          rep.renderer === "freespace" ||
          rep.renderer.startsWith("conhex") ||
          rep.renderer === "polyomino")
      ) {
        return 0;
      }
      if (
        "renderer" in rep &&
        rep.renderer !== undefined &&
        rep.renderer === "isometric"
      ) {
        return 90;
      }

      const info = gameinfo.get(metaGame);
      if (info === undefined) {
        return 0;
      }
      if (
        "flags" in info &&
        info.flags !== undefined &&
        Array.isArray(info.flags) &&
        info.flags.includes("custom-rotation")
      ) {
        const increment = engine.getCustomRotation();
        if (increment !== undefined) {
          return increment;
        }
      }
      if (
        "board" in rep &&
        rep.board !== undefined &&
        "style" in rep.board &&
        rep.board.style !== undefined
      ) {
        const style = rep.board.style;
        if (
          style.startsWith("squares") ||
          style.startsWith("vertex") ||
          style === "pegboard" ||
          style === "hex-slanted" ||
          style.startsWith("hex-odd") ||
          style.startsWith("hex-even") ||
          style === "snubsquare" ||
          style.startsWith("cairo") ||
          style === "triangles-stacked" ||
          style === "sowing-round"
        ) {
          return 90;
        }
        if (style.startsWith("hex-of")) {
          return 60;
        }
        if (style === "sowing") {
          return 180;
        }
      }
      return 0;
    };
    if (renderrep !== null && engineRef.current !== null) {
      rotIncrementSetter(
        getRotationIncrement(metaGame, renderrep, engineRef.current)
      );
    } else {
      rotIncrementSetter(0);
    }
  }, [renderrep, metaGame]);

  const handleRotate = async (dir) => {
    let newGameSettings = cloneDeep(gameSettings);
    if (newGameSettings === undefined) newGameSettings = {};
    let rotate = newGameSettings.rotate;
    if (rotate === undefined) rotate = 0;
    if (dir === "CW") {
      rotate += rotIncrement;
    } else {
      rotate -= rotIncrement;
    }
    rotate = rotate % 360;
    while (rotate < 0) {
      rotate += 360;
    }
    newGameSettings.rotate = rotate;
    processNewSettings(
      newGameSettings,
      userSettings,
      gameRef,
      settingsSetter,
      gameSettingsSetter,
      userSettingsSetter,
      globalMe,
      effectiveColourContext
    );
    if (game.me > -1) {
      try {
        await callAuthApi("update_game_settings", {
          game: game.id,
          metaGame: game.metaGame,
          cbit: cbit,
          settings: newGameSettings,
        });
      } catch (error) {
        setError(`handleRotate update_game_settings error: ${error}`);
      }
    }
  };

  const processUpdatedSettings = (newGameSettings, newUserSettings) => {
    // console.log("processUpdatedSettings", newGameSettings, newUserSettings);
    // Update dbgame's player settings so the main useEffect always has correct data
    if (dbgame !== null && gameRef.current?.me > -1) {
      const player = dbgame.players.find((p) => p.id === globalMe.id);
      if (player) {
        player.settings = cloneDeep(newGameSettings);
      }
    }
    const newSettings = processNewSettings(
      newGameSettings,
      newUserSettings,
      gameRef,
      settingsSetter,
      gameSettingsSetter,
      userSettingsSetter,
      globalMe,
      effectiveColourContext
    );
    if (newSettings?.display) {
      console.log(
        `(processUpdatedSettings) ABOUT TO RERENDER! Display setting: ${newSettings.display}`
      );
      //   console.log(`Current engine state:`);
      //   console.log(engineRef.current.graph);
      const newRenderRep = replaceNames(
        engineRef.current.render({
          perspective: gameRef.current.me + 1,
          altDisplay: newSettings.display,
        }),
        gameRef.current.players
      );
      renderrepSetter(newRenderRep);
      gameRef.current.stackExpanding =
        newRenderRep.renderer === "stacking-expanding";
    }
  };

  const handleSettingsClose = () => {
    showSettingsSetter(false);
  };

  const handleSettingsSave = () => {
    showSettingsSetter(false);
  };

  const handleMark = (mark) => {
    let node = getFocusNode(
      explorationRef.current.nodes,
      gameRef.current,
      focus
    );
    node.SetOutcome(mark);
    if (gameRef.current.gameOver)
      fixMoveOutcomes(explorationRef.current.nodes, focus.moveNumber);
    saveExploration(
      explorationRef.current.nodes,
      focus.moveNumber + 1,
      game,
      globalMe,
      explorer,
      errorSetter,
      errorMessageRef,
      focus,
      navigate
    );
    focusSetter(cloneDeep(focus)); // just to trigger a rerender...
  };

  const handleSubmit = async (draw) => {
    submittingSetter(true);
    if (globalMe?.settings?.all?.moveConfirmOff) {
      if (draw === "drawaccepted") {
        submitMove("", draw);
      } else {
        let m = getFocusNode(
          explorationRef.current.nodes,
          gameRef.current,
          focus
        ).move;
        submitMove(m, draw);
      }
    } else {
      drawMessageSetter(draw);
      showMoveConfirmSetter(true);
    }
  };

  const submitMove = async (m, draw) => {
    try {
      // Find opponent ID for premove checking (only for 2-player non-simultaneous games)
      const opponent = gameRef.current.players.find(
        (p) => p.id !== globalMe.id
      );
      const res = await callAuthApi("submit_move", {
        id: gameRef.current.id,
        metaGame: gameRef.current.metaGame,
        cbit: cbit,
        move: m,
        draw: draw,
        moveNumber: explorationRef.current.nodes.length,
        opponentId: opponent ? opponent.id : undefined,
        exploration:
          explorationRef.current.nodes[
            explorationRef.current.nodes.length - 1
          ].Deflate().children,
      });
      if (!res) return;
      const result = await res.json();
      submittingSetter(false);
      if (result.statusCode !== 200) {
        // setError(JSON.parse(result.body));
        throw JSON.parse(result.body);
      }
      setMyMove((myMove) => [...myMove.filter((x) => x.id !== gameID)]);
      let game0 = JSON.parse(result.body);
      const moveNum = explorationRef.current.nodes.length - 1;
      const cur_exploration = explorationRef.current.nodes[moveNum];
      setupGame(
        game0,
        gameRef,
        globalMe,
        explorer,
        partialMoveRenderRef,
        renderrepSetter,
        engineRef,
        statusRef,
        movesRef,
        focusSetter,
        explorationRef,
        moveSetter,
        gameRecSetter,
        canPublishSetter,
        globalMe?.settings?.[metaGame]?.display,
        navigate
      );
      if (gameRef.current.canExplore) {
        mergeExistingExploration(
          moveNum,
          cur_exploration,
          explorationRef.current.nodes
        );
      }
      if (gameRef.current.customColours) {
        setupColors(
          settings,
          gameRef.current,
          globalMe,
          effectiveColourContext,
          {
            state: engineRef.current.state(),
          }
        );
        colorsChangedSetter((val) => val + 1);
      }
    } catch (err) {
      setError(
        `submitMove (move: ${m}, draw: ${draw}) failed with: ${err.message}`
      );
    }
  };

  const submitComment = async (comment) => {
    // ignore blank comments
    if (comment.length > 0 && !/^\s*$/.test(comment)) {
      commentsSetter([
        ...comments,
        {
          comment: comment,
          userId: globalMe.id,
          timeStamp: Date.now(),
          moveNumber: explorationRef.current.nodes.length - 1,
        },
      ]);
      // console.log(comments);
      try {
        // This used to only pass players and meta if game was completed.
        // I don't see any reason for that, so always passing it so lastChat
        // is always calculated, even for in-progress games.
        let players;
        if (
          gameRef.current !== undefined &&
          gameRef.current.players !== undefined
        ) {
          players = [...gameRef.current.players];
        }

        const res = await callAuthApi("submit_comment", {
          id: gameRef.current.id,
          players,
          metaGame: metaGame,
          comment: comment,
          moveNumber: explorationRef.current.nodes.length - 1,
        });
        if (!res) return;
        const result = await res.json();
        if (result && result.statusCode && result.statusCode !== 200)
          setError(
            `submit_comment failed, status: ${result.statusCode}, body: ${result.body}`
          );
        else if (
          (!gameRef.current.commented || gameRef.current.commented < 1) &&
          isInterestingComment(comment)
        ) {
          // Update local game object if flag was updated
          gameRef.current.commented = 1;
        }
      } catch (err) {
        console.log(err);
        //setError(err.message);
      }
    }
  };

  const submitNodeComment = async (comment) => {
    // ignore blank comments
    if (comment.length > 0 && !/^\s*$/.test(comment)) {
      const node = getFocusNode(
        explorationRef.current.nodes,
        gameRef.current,
        focus
      );
      node.AddComment({ userId: globalMe.id, comment, timeStamp: Date.now() });
      saveExploration(
        explorationRef.current.nodes,
        focus.moveNumber + 1,
        game,
        globalMe,
        explorer,
        errorSetter,
        errorMessageRef,
        focus,
        navigate,
        true // commentJustAdded
      );
      focusSetter(cloneDeep(focus));
    }
  };

  const handleResign = () => {
    showResignConfirmSetter(true);
  };

  const handleCloseMoveConfirm = () => {
    submittingSetter(false);
    showMoveConfirmSetter(false);
  };

  const handleMoveConfirmed = async () => {
    showMoveConfirmSetter(false);
    submittingSetter(true);
    if (drawMessage === "drawaccepted") {
      submitMove("", drawMessage);
    } else {
      const m = getFocusNode(
        explorationRef.current.nodes,
        gameRef.current,
        focus
      ).move;
      submitMove(m, drawMessage);
    }
  };

  const handleCloseResignConfirm = () => {
    showResignConfirmSetter(false);
  };

  const handleResignConfirmed = async () => {
    showResignConfirmSetter(false);
    submittingSetter(true);
    submitMove("resign", false);
  };

  const handleDeleteExploration = () => {
    if (
      getFocusNode(explorationRef.current.nodes, gameRef.current, focus)
        .children.length > 0
    ) {
      // only confirm if non leaf node
      showDeleteSubtreeConfirmSetter(true);
    } else {
      handleDeleteSubtreeConfirmed();
    }
  };

  const handleCloseDeleteSubtreeConfirm = () => {
    showDeleteSubtreeConfirmSetter(false);
  };

  const handleDeleteSubtreeConfirmed = async () => {
    showDeleteSubtreeConfirmSetter(false);
    let node = getFocusNode(
      explorationRef.current.nodes,
      gameRef.current,
      focus
    );
    node.DeleteNode();
    let foc = cloneDeep(focus);
    foc.exPath.pop();
    if (gameRef.current.gameOver)
      fixMoveOutcomes(explorationRef.current.nodes, focus.moveNumber);
    saveExploration(
      explorationRef.current.nodes,
      focus.moveNumber + 1,
      game,
      globalMe,
      explorer,
      errorSetter,
      errorMessageRef,
      foc,
      navigate
    );
    handleGameMoveClick(foc);
  };

  const handleTimeout = () => {
    showTimeoutConfirmSetter(true);
  };

  const handleCloseTimeoutConfirm = () => {
    showTimeoutConfirmSetter(false);
  };

  const handleTimeoutConfirmed = async () => {
    showTimeoutConfirmSetter(false);
    submittingSetter(true);
    submitMove("timeout", false);
  };

  // Handler for marking/unmarking a premove
  const handlePremove = () => {
    const node = getFocusNode(
      explorationRef.current.nodes,
      gameRef.current,
      focus
    );

    // If already a premove, just toggle it off without confirmation
    if (node.premove) {
      node.SetPremove(false);
      saveExploration(
        explorationRef.current.nodes,
        focus.moveNumber + 1,
        game,
        globalMe,
        explorer,
        errorSetter,
        errorMessageRef,
        focus,
        navigate
      );
      focusSetter(cloneDeep(focus)); // trigger rerender
      return;
    }

    // Check if this is the first premove or if we're changing an existing one
    const siblingHasPremove = node.HasSiblingPremove();

    // Show confirmation dialog for first premove or when changing
    pendingPremoveActionSetter({ node, isChange: siblingHasPremove });
    showPremoveConfirmSetter(true);
  };

  const handleClosePremoveConfirm = () => {
    showPremoveConfirmSetter(false);
    pendingPremoveActionSetter(null);
  };

  const handlePremoveConfirmed = () => {
    showPremoveConfirmSetter(false);
    if (pendingPremoveAction && pendingPremoveAction.node) {
      pendingPremoveAction.node.SetPremove(true);
      saveExploration(
        explorationRef.current.nodes,
        focus.moveNumber + 1,
        game,
        globalMe,
        explorer,
        errorSetter,
        errorMessageRef,
        focus,
        navigate
      );
      focusSetter(cloneDeep(focus)); // trigger rerender
    }
    pendingPremoveActionSetter(null);
  };

  const handleInjection = async () => {
    if (
      injectedState !== undefined &&
      injectedState !== null &&
      injectedState.length > 0
    ) {
      // For those games that compress the state, we need to compress first, because we show the decomressed state to be copied.
      let tmpEngine = GameFactory(metaGame, injectedState);
      const injectedState2 = tmpEngine.serialize(); // NOT cheapSerialize!

      try {
        let status;
        const res = await callAuthApi("set_game_state", {
          id: gameID,
          metaGame: metaGame,
          newState: injectedState2,
        });
        if (res) {
          status = res.status;
          if (status !== 200) {
            const result = await res.json();
            errorMessageRef.current = `set_game_state failed, game = ${gameID}, metaGame = ${metaGame}, status = ${status}, message: ${result.message}, body: ${result.body}`;
            errorSetter(true);
          } else {
            const result = await res.json();
            let game0 = JSON.parse(result.body);
            setupGame(
              game0,
              gameRef,
              globalMe,
              explorer,
              partialMoveRenderRef,
              renderrepSetter,
              engineRef,
              statusRef,
              movesRef,
              focusSetter,
              explorationRef,
              moveSetter,
              gameRecSetter,
              canPublishSetter,
              globalMe?.settings?.[metaGame]?.display,
              navigate
            );
          }
        }
      } catch (error) {
        console.log(error);
        errorMessageRef.current = error.message;
        errorSetter(true);
      }

      gameRef.current.state = injectedState2;
      showInjectSetter(false);
    }
  };

  const handleCustomize = () => {
    if (renderrep) {
      navigate(`/customize/${metaGame}`, {
        state: { inJSON: JSON.stringify(renderrep, null, 2) },
      });
    }
  };

  const handleInjectChange = (e) => {
    injectedStateSetter(e.target.value);
  };

  const handleExplorer = () => {
    let game = gameRef.current;
    game.canExplore = !game.simultaneous && game.numPlayers === 2;
    let focus0 = cloneDeep(focus);
    focus0.canExplore = canExploreMove(
      gameRef.current,
      explorationRef.current.nodes,
      focus0
    );
    if (
      focus0.canExplore &&
      !focus.canExplore &&
      !game.noMoves &&
      (game.canSubmit || (!game.simultaneous && game.numPlayers === 2))
    ) {
      let node = getFocusNode(explorationRef.current.nodes, game, focus);
      const engine = GameFactory(game.metaGame, node.state);
      if (game.simultaneous) movesRef.current = engine.moves(game.me + 1);
      else movesRef.current = engine.moves();
    }
    focusSetter(focus0);
    setCanPublish(
      game,
      explorationRef.current.nodes,
      globalMe,
      canPublishSetter
    );
    explorerSetter(true);
  };

  const handlePublishExploration = async () => {
    console.log("Fetching private exploration data");
    canPublishSetter("publishing");
    try {
      // mark game as published (don't await)
      callAuthApi(
        "mark_published",
        {
          id: gameID,
          metagame: gameRef.current.metaGame,
        },
        false
      );
      // fetch private exploration data
      let status;
      const res = await callAuthApi(
        "get_private_exploration",
        {
          id: gameID,
        },
        false
      );
      if (res) {
        status = res.status;
        if (status !== 200) {
          const result = await res.json();
          errorMessageRef.current = `get_private_exploration failed, game = ${gameID}, status = ${status}, message: ${result.message}, body: ${result.body}`;
          errorSetter(true);
        } else {
          const result = await res.json();
          if (result && result.body) {
            let data = JSON.parse(result.body);
            data = data.map((d) => {
              if (d && typeof d.tree === "string") {
                d.tree = JSON.parse(d.tree);
              }
              return d;
            });
            mergePrivateExploration(
              gameRef.current,
              explorationRef.current.nodes,
              data,
              globalMe,
              errorSetter,
              errorMessageRef
            );
            canPublishSetter("no");
          }
        }
      }
    } catch (error) {
      console.log(error);
      errorMessageRef.current = `handlePublishExploration failed with: ${error.message}`;
      errorSetter(true);
    }
  };

  const refreshNextGame = () => {
    async function fetchData() {
      try {
        let status;
        const res = await callAuthApi("next_game", {}, false);
        if (res) {
          status = res.status;
          if (status !== 200) {
            const result = await res.json();
            errorMessageRef.current = `next_game failed, status = ${status}, message: ${result.message}, body: ${result.body}`;
            errorSetter(true);
            return [];
          } else {
            const result = await res.json();
            return JSON.parse(result.body);
          }
        } else {
          return [];
        }
      } catch (error) {
        console.log(error);
        errorMessageRef.current = `next_game failed with: ${error.message}`;
        errorSetter(true);
        return [];
      }
    }
    fetchData().then((result) => {
      setMyMove(result);
      if (Array.isArray(result) && result.length > 0) {
        const next = result[0];
        navigateToTop(`/move/${next.metaGame}/0/${next.id}`);
      } else {
        navigateToTop("/");
      }
    });
  };

  const handleNextGame = () => {
    // If the current game is in the list, move it to the end.
    const local = [...myMove];
    const idx = local.findIndex((x) => x.id === gameID);
    if (idx !== -1) {
      const thisgame = local[idx];
      local.splice(idx, 1);
      if (local.length > 0) {
        local.push(thisgame);
        setMyMove(local);
      }
    }
    // Then go to the next game in the list.
    if (local.length === 0) {
      // transfer control to the function that fetches refreshed nextgame data
      return refreshNextGame();
    } else {
      const next = local[0];
      navigateToTop(`/move/${next.metaGame}/0/${next.id}`);
    }
  };

  const navigateToTop = (to) => {
    navigate(to, { replace: true });
    window.scrollTo(0, 0);
  };

  const game = gameRef.current;
  // console.log("rendering at focus ", focus);
  // console.log("game.me", game ? game.me : "nope");
  let commentingCompletedGame = false;
  let allNodeComments = [];
  if (!error) {
    let toMove;
    if (focus && game) {
      if (game.simultaneous) {
        toMove = game.toMove; // will only be used at current position
      } else {
        const node = getFocusNode(
          explorationRef.current.nodes,
          gameRef.current,
          focus
        );
        toMove = node?.toMove;
      }
      if (game.gameOver) {
        commentingCompletedGame = true;
        allNodeComments = getAllNodeComments(explorationRef.current.nodes);
      }
    }
    return (
      <>
        <Helmet>
          <meta
            property="og:title"
            content={`${gameinfo.get(metaGame).name}: Game ${gameID}`}
          />
          <meta
            property="og:url"
            content={`https://play.abstractplay.com/move/${metaGame}/0/${gameID}`}
          />
          <meta
            property="og:description"
            content={`${gameinfo.get(metaGame).name} game ${gameID}`}
          />
        </Helmet>
        <article>
          <Joyride
            steps={tourState}
            run={startTour}
            callback={handleJoyrideCallback}
            continuous
            showProgress
            showSkipButton
            styles={{
              options: {
                primaryColor: "#008ca8",
              },
            }}
          />
          {!showTour ? null : (
            <div className="has-text-centered">
              <div className="field">
                <div className="control">
                  <button
                    className="button apButton"
                    onClick={() => startTourSetter(true)}
                  >
                    {t("tour.general.Take")}
                  </button>
                </div>
                <div className="control">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      onClick={() => {
                        showTourSetter(false);
                        startTourSetter(false);
                      }}
                    />
                    {t("tour.general.Ignore")}
                  </label>
                </div>
              </div>
            </div>
          )}
          {screenWidth < 770 || verticalLayout ? (
            /* Mobile, stacked layout */
            mobileOrder.map((key) => {
              let title;
              let tourClass;
              switch (key) {
                case "status":
                  title = t("Status");
                  tourClass = "tourStatus";
                  break;
                case "move":
                  title = t("MakeMove");
                  tourClass = "tourMove";
                  break;
                case "board":
                  title = gameinfo.get(metaGame).name;
                  tourClass = "tourBoard";
                  break;
                case "moves":
                  title = t("Moves");
                  tourClass = "tourMoveList";
                  break;
                case "chat":
                  title = t("GameSummary");
                  tourClass = "tourChat";
                  break;
                default:
                  throw new Error(`Unrecognized chunk name '${key}'`);
              }
              // Skip empty status displays
              if (key === "status") {
                const status = statusRef.current;
                if (
                  !game ||
                  game.colors === undefined ||
                  ((!game.variants || game.variants.length === 0) &&
                    status.statuses.length === 0 &&
                    ((!game.scores && !game.limitedPieces) ||
                      status.scores.length === 0) &&
                    !game.playerStashes &&
                    !game.sharedStash)
                ) {
                  return null;
                }
              }
              return (
                <div style={{ paddingBottom: "1em" }} key={`${key}|card`}>
                  <div className={"card " + tourClass}>
                    <header className="card-header">
                      <p className="card-header-title">
                        <Link to={`/games/${metaGame}`}>{title}</Link>
                        {key !== "board" ||
                        parenthetical.length === 0 ? null : (
                          <>
                            <span
                              style={{
                                fontSize: "smaller",
                                padding: 0,
                                margin: 0,
                              }}
                            >
                              &nbsp;(
                              {parenthetical.reduce((prev, curr) => [
                                prev,
                                ", ",
                                curr,
                              ])}
                              )
                            </span>
                          </>
                        )}
                      </p>
                      <button
                        className="card-header-icon"
                        aria-label="move up"
                        title="move up"
                        onClick={() => handleMoveUp(key)}
                      >
                        <span className="icon">
                          <i className="fa fa-angle-up" aria-hidden="true"></i>
                        </span>
                      </button>
                      <button
                        className="card-header-icon"
                        aria-label="move down"
                        title="move down"
                        onClick={() => handleMoveDown(key)}
                      >
                        <span className="icon">
                          <i
                            className="fa fa-angle-down"
                            aria-hidden="true"
                          ></i>
                        </span>
                      </button>
                    </header>
                    <div className="card-content">
                      {key === "status" ? (
                        <GameStatus
                          status={statusRef.current}
                          settings={settings}
                          game={game}
                          canExplore={focus?.canExplore}
                          handleStashClick={handleStashClick}
                          locked={locked}
                          setLocked={setLocked}
                          setRefresh={setRefresh}
                          key={`Status|colorSet${colorsChanged}`}
                        />
                      ) : key === "move" ? (
                        <>
                          <MoveEntry
                            move={move}
                            toMove={toMove}
                            game={gameRef.current}
                            moves={movesRef.current}
                            engine={engineRef.current}
                            exploration={explorationRef.current.nodes}
                            focus={focus}
                            submitting={submitting}
                            forceUndoRight={true}
                            screenWidth={screenWidth}
                            handlers={[
                              handleMove,
                              handleMark,
                              handleSubmit,
                              handleToSubmit,
                              handleView,
                              handleResign,
                              handleTimeout,
                              handleReset,
                              handlePie,
                              handleDeleteExploration,
                              handlePremove,
                            ]}
                            key={`Entry|colorSet${colorsChanged}`}
                          />
                          <MiscButtons
                            metaGame={metaGame}
                            gameID={gameID}
                            toMove={toMove}
                            gameRec={gameRec}
                            canPublish={canPublish}
                            handlePublishExploration={handlePublishExploration}
                            handleExplorer={handleExplorer}
                            handleNextGame={handleNextGame}
                            explorer={explorer}
                            game={game}
                            t={t}
                          />
                        </>
                      ) : key === "board" ? (
                        <Board
                          metaGame={metaGame}
                          gameID={gameID}
                          rendered={rendered}
                          t={t}
                          locked={locked}
                          setLocked={setLocked}
                          setRefresh={setRefresh}
                          gameEngine={gameEngine}
                          gameNote={gameNote}
                          inCheck={inCheck}
                          stackExpanding={
                            gameRef.current?.stackExpanding || false
                          }
                          increment={rotIncrement}
                          stackImage={stackImage}
                          boardImage={boardImage}
                          screenWidth={screenWidth}
                          handleRotate={handleRotate}
                          handleUpdateRenderOptions={handleUpdateRenderOptions}
                          showGameDetailsSetter={showGameDetailsSetter}
                          showGameNoteSetter={showGameNoteSetter}
                          showGameDumpSetter={showGameDumpSetter}
                          showCustomCSSSetter={showCustomCSSSetter}
                          showInjectSetter={showInjectSetter}
                          verticalLayout={verticalLayout}
                          verticalLayoutSetter={verticalLayoutSetter}
                          copyHWDiagram={copyHWDiagram}
                          colourContext={effectiveColourContext}
                          hasNewChat={gameRef.current?.hasNewChat || false}
                          handleCustomize={handleCustomize}
                        />
                      ) : key === "moves" ? (
                        <GameMoves
                          focus={focus}
                          game={game}
                          exploration={explorationRef.current.nodes}
                          noExplore={
                            globalMe?.settings?.all?.exploration === -1
                          }
                          handleGameMoveClick={handleGameMoveClick}
                          getFocusNode={getFocusNode}
                          handlePlaygroundExport={handlePlaygroundExport}
                          key={`Moves|colorSet${colorsChanged}`}
                        />
                      ) : key === "chat" ? (
                        <>
                          <UserChats
                            comments={
                              commentingCompletedGame
                                ? [
                                    ...(comments || []).map((c) => ({
                                      ...c,
                                      inGame: true,
                                      path:
                                        c.moveNumber !== undefined
                                          ? {
                                              moveNumber: c.moveNumber,
                                              exPath: [],
                                            }
                                          : undefined,
                                    })),
                                    ...(allNodeComments || []),
                                  ]
                                : comments
                            }
                            players={gameRef.current?.players}
                            handleSubmit={
                              commentingCompletedGame // && !(focus.moveNumber === explorationRef.current.nodes.length - 1 && focus.exPath.length === 0)
                                ? submitNodeComment
                                : submitComment
                            }
                            tooMuch={commentsTooLong}
                            gameid={gameRef.current?.id}
                            commentingCompletedGame={commentingCompletedGame}
                            userId={globalMe?.id}
                            handleGameMoveClick={handleGameMoveClick}
                            focusedPath={focus}
                          />
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            /* Normal, full-width layout */
            <div className="columns">
              {/***************** MoveEntry *****************/}
              <div className={`column is-one-fifth`}>
                <div style={{ marginBottom: "2rem" }} className="tourStatus">
                  <h1 className="subtitle lined">
                    <span>{t("Status")}</span>
                  </h1>
                  <GameStatus
                    status={statusRef.current}
                    settings={settings}
                    game={game}
                    canExplore={focus?.canExplore}
                    handleStashClick={handleStashClick}
                    locked={locked}
                    setLocked={setLocked}
                    setRefresh={setRefresh}
                    key={`Status|colorSet${colorsChanged}`}
                  />
                </div>
                <div className="tourMove">
                  <h1 className="subtitle lined">
                    <span>{t("MakeMove")}</span>
                  </h1>
                  <MoveEntry
                    move={move}
                    toMove={toMove}
                    game={gameRef.current}
                    engine={engineRef.current}
                    moves={movesRef.current}
                    exploration={explorationRef.current.nodes}
                    focus={focus}
                    submitting={submitting}
                    forceUndoRight={false}
                    screenWidth={screenWidth}
                    handlers={[
                      handleMove,
                      handleMark,
                      handleSubmit,
                      handleToSubmit,
                      handleView,
                      handleResign,
                      handleTimeout,
                      handleReset,
                      handlePie,
                      handleDeleteExploration,
                      handlePremove,
                    ]}
                    key={`Entry|colorSet${colorsChanged}`}
                  />
                </div>
                <MiscButtons
                  metaGame={metaGame}
                  gameID={gameID}
                  toMove={toMove}
                  gameRec={gameRec}
                  canPublish={canPublish}
                  handlePublishExploration={handlePublishExploration}
                  handleExplorer={handleExplorer}
                  handleNextGame={handleNextGame}
                  explorer={explorer}
                  game={game}
                  t={t}
                />
              </div>{" "}
              {/* column */}
              {/***************** Board *****************/}
              <div className="column">
                <h1 className="subtitle lined tourWelcome">
                  <span>
                    <Link to={`/games/${metaGame}`}>
                      {gameinfo.get(metaGame).name}
                    </Link>
                    {parenthetical.length === 0 ? null : (
                      <>
                        <span
                          style={{ fontSize: "smaller", padding: 0, margin: 0 }}
                        >
                          &nbsp;(
                          {parenthetical.reduce((prev, curr) => [
                            prev,
                            ", ",
                            curr,
                          ])}
                          )
                        </span>
                      </>
                    )}
                  </span>
                </h1>
                <Board
                  metaGame={metaGame}
                  gameID={gameID}
                  rendered={rendered}
                  t={t}
                  locked={locked}
                  setLocked={setLocked}
                  setRefresh={setRefresh}
                  gameEngine={gameEngine}
                  gameNote={gameNote}
                  inCheck={inCheck}
                  stackExpanding={gameRef.current?.stackExpanding || false}
                  increment={rotIncrement}
                  stackImage={stackImage}
                  boardImage={boardImage}
                  screenWidth={screenWidth}
                  handleRotate={handleRotate}
                  handleUpdateRenderOptions={handleUpdateRenderOptions}
                  showGameDetailsSetter={showGameDetailsSetter}
                  showGameNoteSetter={showGameNoteSetter}
                  showGameDumpSetter={showGameDumpSetter}
                  showCustomCSSSetter={showCustomCSSSetter}
                  showInjectSetter={showInjectSetter}
                  verticalLayout={verticalLayout}
                  verticalLayoutSetter={verticalLayoutSetter}
                  copyHWDiagram={copyHWDiagram}
                  colourContext={effectiveColourContext}
                  hasNewChat={gameRef.current?.hasNewChat || false}
                  handleCustomize={handleCustomize}
                />
              </div>
              {/***************** GameMoves *****************/}
              <div
                className={`column is-narrow`}
                style={
                  screenWidth < 770 || verticalLayout
                    ? {}
                    : { maxWidth: "15vw" }
                }
              >
                <div className="tourMoveList">
                  <h1 className="subtitle lined">
                    <span>{t("Moves")}</span>
                  </h1>
                  <GameMoves
                    focus={focus}
                    game={game}
                    exploration={explorationRef.current.nodes}
                    noExplore={globalMe?.settings?.all?.exploration === -1}
                    handleGameMoveClick={handleGameMoveClick}
                    getFocusNode={getFocusNode}
                    handlePlaygroundExport={handlePlaygroundExport}
                    key={`Moves|colorSet${colorsChanged}`}
                  />
                </div>
                <div style={{ paddingTop: "1em" }} className="tourChat">
                  <h1 className="subtitle lined">
                    <span>{t("GameSummary")}</span>
                  </h1>
                  <UserChats
                    comments={
                      commentingCompletedGame
                        ? [
                            ...(comments || []).map((c) => ({
                              ...c,
                              inGame: true,
                              path:
                                c.moveNumber !== undefined
                                  ? { moveNumber: c.moveNumber, exPath: [] }
                                  : undefined,
                            })),
                            ...(allNodeComments || []),
                          ]
                        : comments
                    }
                    players={gameRef.current?.players}
                    handleSubmit={
                      commentingCompletedGame // && !(focus.moveNumber === explorationRef.current.nodes.length - 1 && focus.exPath.length === 0)
                        ? submitNodeComment
                        : submitComment
                    }
                    tooMuch={commentsTooLong}
                    gameid={gameRef.current?.id}
                    commentingCompletedGame={commentingCompletedGame}
                    userId={globalMe?.id}
                    handleGameMoveClick={handleGameMoveClick}
                    focusedPath={focus}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="columns">
            {/* Comments */}
            <div
              className="column is-three-fifths is-offset-one-fifth"
              id="fullChatLog"
            >
              {focus ? (
                <div>
                  <h1 className="subtitle lined">
                    <span>{t("GameSummary")}</span>
                  </h1>
                  <MoveResults
                    className="moveResults"
                    results={game?.moveResults}
                    comments={comments}
                    players={gameRef.current?.players}
                    t={t}
                  />
                </div>
              ) : (
                ""
              )}
            </div>
          </div>
          {/* columns */}
          <RenderOptionsModal
            show={showSettings}
            game={game}
            settings={userSettings}
            gameSettings={gameSettings}
            processNewSettings={processUpdatedSettings}
            showSettingsSetter={showSettingsSetter}
            setError={setError}
            handleClose={handleSettingsClose}
            handleSave={handleSettingsSave}
          />
          <Modal
            show={showResignConfirm}
            title={t("ConfirmResign")}
            buttons={[
              { label: t("Resign"), action: handleResignConfirmed },
              {
                label: t("Cancel"),
                action: handleCloseResignConfirm,
              },
            ]}
          >
            <div className="content">
              <p>{t("ConfirmResignDesc")}</p>
            </div>
          </Modal>
          <Modal
            show={showDeleteSubtreeConfirm}
            title={t("ConfirmDeleteSubtree")}
            buttons={[
              { label: t("Delete"), action: handleDeleteSubtreeConfirmed },
              {
                label: t("Cancel"),
                action: handleCloseDeleteSubtreeConfirm,
              },
            ]}
          >
            <div className="content">
              <p>{t("ConfirmDeleteSubtreeDesc")}</p>
            </div>
          </Modal>
          <Modal
            show={showPremoveConfirm}
            title={t("ConfirmPremove")}
            buttons={[
              { label: t("Confirm"), action: handlePremoveConfirmed },
              {
                label: t("Cancel"),
                action: handleClosePremoveConfirm,
              },
            ]}
          >
            <div className="content">
              <p>
                {pendingPremoveAction?.isChange
                  ? t("ConfirmPremoveChangeDesc")
                  : t("ConfirmPremoveDesc")}
              </p>
            </div>
          </Modal>
          <Modal
            show={showMoveConfirm}
            title={t("ConfirmMove")}
            buttons={[
              { label: t("Submit"), action: handleMoveConfirmed },
              {
                label: t("Cancel"),
                action: handleCloseMoveConfirm,
              },
            ]}
          >
            <div className="content">
              <p>{t("ConfirmMoveDesc")}</p>
              <p className="help">{t("ConfirmMoveHelp")}</p>
            </div>
          </Modal>
          <Modal
            show={showTimeoutConfirm}
            title={t("ConfirmTimeout")}
            buttons={[
              { label: t("Claim"), action: handleTimeoutConfirmed },
              {
                label: t("Cancel"),
                action: handleCloseTimeoutConfirm,
              },
            ]}
          >
            <div className="content">
              <p>{t("ConfirmTimeoutDesc")}</p>
            </div>
          </Modal>
          <Modal
            show={showGameDetails}
            title={t("GameInfoFor", { metaGame: gameDeets.name })}
            buttons={[
              {
                label: t("Close"),
                action: () => {
                  showGameDetailsSetter(false);
                },
              },
            ]}
          >
            <div className="content">
              <ReactMarkdown rehypePlugins={[rehypeRaw]} className="content">
                {gameEngine.description() +
                  (designerString === undefined
                    ? ""
                    : "\n\n" + designerString) +
                  (coderString === undefined ? "" : "\n\n" + coderString)}
              </ReactMarkdown>
              <ul className="contained">
                {gameDeets.urls.map((l, i) => (
                  <li key={`gameDeets|url|` + i}>
                    <a href={l} target="_blank" rel="noopener noreferrer">
                      {l}
                    </a>
                  </li>
                ))}
                <li key="_wiki">
                  <a
                    href={`https://abstractplay.com/wiki/doku.php?id=games:${metaGame}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abstract Play Wiki
                  </a>
                </li>
              </ul>
              {gameEngine.notes() === undefined ? (
                ""
              ) : (
                <>
                  <h2>{t("ImplementationNotes")}</h2>
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    className="content"
                  >
                    {gameEngine.notes()}
                  </ReactMarkdown>
                </>
              )}
            </div>
          </Modal>
          <Modal
            show={showGameDump}
            title={t("DebugModal")}
            buttons={[
              {
                label: t("Close"),
                action: () => {
                  showGameDumpSetter(false);
                },
              },
            ]}
          >
            <div className="content">
              <p>
                If there's a problem with your game, a developer may ask you to
                come to this page and send them the current game state. You can
                either click the "Copy" link below to copy the text to your
                clipboard and then paste it somewhere, or you can click the
                "Download" button to save a text file to your computer, which
                you can then send to the developers. Thank you!
              </p>
              {gameRef === null ||
              gameRef.current === null ||
              gameRef.current.state === null ? (
                ""
              ) : (
                <Fragment>
                  <ClipboardCopy
                    copyText={
                      getFocusNode(
                        explorationRef.current.nodes,
                        gameRef.current,
                        focus
                      )?.state
                    }
                  />
                  <div className="field">
                    <div className="control">
                      <a
                        href={`data:text/json;charset=utf-8,${encodeURIComponent(
                          getFocusNode(
                            explorationRef.current.nodes,
                            gameRef.current,
                            focus
                          )?.state
                        )}`}
                        download="AbstractPlay-Debug.json"
                      >
                        <button className="button apButtonNeutral">
                          {t("Download")}
                        </button>
                      </a>
                    </div>
                  </div>
                </Fragment>
              )}
            </div>
          </Modal>
          <Modal
            show={showInject}
            title={"Inject state"}
            buttons={[
              {
                label: t("Close"),
                action: () => {
                  showInjectSetter(false);
                },
              },
            ]}
          >
            <div className="content">
              <p>
                If you are seeing this and are not a developer, please let an
                admin know immediately.
              </p>
              <p>
                This is a destructive function. Pasting code here will
                obliterate the existing game state and cannot be undone. You
                have been warned.
              </p>
              <div className="field">
                <label className="label" htmlFor="newState">
                  JSON to inject
                </label>
                <div className="control">
                  <textarea
                    className="textarea"
                    name="newState"
                    placeholder="Paste JSON here"
                    value={injectedState}
                    onChange={handleInjectChange}
                  />
                </div>
                <div className="control">
                  <button
                    className="button is-danger"
                    onClick={handleInjection}
                  >
                    Inject JSON!
                  </button>
                </div>
              </div>
            </div>
          </Modal>
          <Modal
            show={showGameNote}
            title={t("GameNoteModal")}
            buttons={[
              {
                label: t("Close"),
                action: () => {
                  showGameNoteSetter(false);
                  if (gameNote === undefined || gameNote === null) {
                    interimNoteSetter("");
                  } else {
                    interimNoteSetter(gameNote);
                  }
                },
              },
            ]}
          >
            <div className="content">
              <p>
                Nobody but you can see this note. The note is tied to this game
                and not any specific move. The note will be irretrievably lost
                when the game concludes and is first cleared from your list of
                concluded games.
              </p>
            </div>
            <div className="field">
              <div className="control">
                <textarea
                  type="textarea"
                  rows={5}
                  id="enterANote"
                  name="enterANote"
                  className="textarea"
                  value={interimNote}
                  placeholder={t("Comment")}
                  onChange={(e) => {
                    interimNoteSetter(e.target.value);
                    return false;
                  }}
                ></textarea>
              </div>
              {interimNote.length > 250 ? (
                <p className="help is-danger" style={{ textAlign: "right" }}>
                  {interimNote.length} / 250
                </p>
              ) : (
                <p className="help" style={{ textAlign: "right" }}>
                  {interimNote.length} / 250
                </p>
              )}
              <div className="control">
                {interimNote === gameNote ||
                (interimNote === "" && gameNote === null) ? (
                  <button className="button is-small" disabled>
                    {t("UpdateNote")}
                  </button>
                ) : (
                  <button
                    className="button is-small"
                    onClick={() => handleNoteUpdate(interimNote)}
                  >
                    {t("UpdateNote")}
                  </button>
                )}
              </div>
            </div>
          </Modal>
          <Modal
            show={showCustomCSS}
            title={t("CustomCSS")}
            buttons={[
              { label: t("Save"), action: saveCustomCSS },
              {
                label: t("Cancel"),
                action: () => showCustomCSSSetter(false),
              },
            ]}
          >
            <div className="content">
              <p>
                It is possible to customize the CSS of all instances of this
                particular game.{" "}
                <strong>This is not something to do lightly!</strong> Do not
                inject code you either do not understand or have not had vetted
                by someone you trust. Abstract Play and its developers are not
                responsible for any mishaps that may occur while using this
                feature.
              </p>
              <p>
                If you are certain you wish to continue, paste the CSS code
                below and click Save. If everything blows up, open the developer
                console and clear the local storage key <code>custom-css</code>,
                and that should reset everything. See the wiki for
                documentation, and join us on Discord to discuss.
              </p>
            </div>
            <div className="control">
              <textarea
                className="textarea is-small"
                id="myCustomCSS"
                placeholder="Paste CSS code here"
                rows="5"
                value={newCSS}
                onChange={(e) => newCSSSetter(e.target.value)}
              />
            </div>
            <div className="control">
              <label className="radio">
                <input
                  type="checkbox"
                  name="activeCSS"
                  checked={cssActive}
                  onChange={(e) => cssActiveSetter(e.target.checked)}
                />
                Activate custom CSS?
              </label>
            </div>
          </Modal>
        </article>
      </>
    );
  } else {
    if (
      !(
        (errorMessageRef.current.startsWith('"submitMove (') &&
          errorMessageRef.current.endsWith(
            ') failed with: Failed to fetch"'
          )) ||
        (errorMessageRef.current.startsWith('"submitMove (') &&
          errorMessageRef.current.endsWith(') failed with: Load failed"')) ||
        errorMessageRef.current.startsWith(
          "get_game, error.message: Error: no auth get_game failed"
        ) ||
        errorMessageRef.current === '"The user is not authenticated"' ||
        errorMessageRef.current.startsWith(
          "save_exploration failed, status = 401, message: The incoming token has expired"
        )
      )
    ) {
      reportError(
        `Message: ${errorMessageRef.current}, url: ${
          window.location.href
        }, game: ${JSON.stringify(game)}, state: ${
          explorationRef.current && focus
            ? getFocusNode(explorationRef.current.nodes, gameRef.current, focus)
                .state
            : ""
        }`
      );
    }
    return <h4>{errorMessageRef.current}</h4>;
  }
}

export default GameMove;
