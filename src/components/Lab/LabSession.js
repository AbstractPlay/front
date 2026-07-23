import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import rehypeRaw from "rehype-raw";
import { render } from "@abstractplay/renderer";
import { cloneDeep, debounce } from "lodash";
import { gameinfo, GameFactory, addResource } from "@abstractplay/gameslib";
import { Helmet } from "react-helmet-async";
import { useStorageState } from "react-use-storage-state";
import { useStore } from "../../stores";
import GameMoves from "./GameMoves";
import GameStatus from "./GameStatus";
import MoveEntry from "./MoveEntry";
import MoveAnnotations from "./MoveAnnotations";
import Board from "./Board";
import Modal from "../Modal";
import ClipboardCopy from "../../lib/ClipboardCopy";
import { getDisplayedRenderRepJson } from "../../lib/displayRenderRepJson";
import LabRenderOptionsModal from "./LabRenderOptionsModal";
import {
  getFocusNode,
  fixMoveOutcomes,
  canExploreMove,
  sanitizeFocus,
  setLabSessionPersistCallback,
  saveLabExploration,
  serializeSessionExploration,
  serializeMainLineAnnotations,
  getMainLineTipState,
} from "../../lib/Lab/exploration";
import { setStatus, replaceNames } from "../../lib/Lab/misc";
import {
  getLabSetting,
  processNewSettings,
  setupColors,
  getAltDisplaysForMetaGame,
  nextDisplayOption,
} from "../../lib/Lab/settings";
import { setRendererColourOpts } from "../../lib/setRendererColourOpts";
import { setGlyphMapOpt } from "../../lib/setGlyphMapOpt";
import {
  setupLabGame,
  processNewMove,
  populateChecked,
} from "../../lib/Lab/gameStuff";
import {
  addSave,
  createSaveRecord,
  saveLastSession,
  clearLastSession,
  getLabBoardSettings,
  saveLabBoardSettings,
} from "../../lib/Lab/storage";
import { getEffectiveColourContext } from "../../lib/effectiveColourContext";
import { serializePlaygroundExport } from "../../lib/Lab/export";

const noop = () => {};

function getRotationIncrement(metaGame, rep, engine) {
  if (
    rep?.renderer &&
    (rep.renderer === "stacking-tiles" ||
      rep.renderer === "stacking-3D" ||
      rep.renderer === "entropy" ||
      rep.renderer === "freespace" ||
      rep.renderer.startsWith("conhex") ||
      rep.renderer === "polyomino")
  ) {
    return 0;
  }
  if (rep?.renderer === "isometric") return 90;
  const info = gameinfo.get(metaGame);
  if (!info) return 0;
  if (info.flags?.includes("custom-rotation")) {
    const increment = engine.getCustomRotation();
    if (increment !== undefined) return increment;
  }
  const style = rep?.board?.style;
  if (!style) return 0;
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
  if (style.startsWith("hex-of")) return 60;
  if (style === "sowing") return 180;
  return 0;
}

function LabSession({
  initialGame,
  savedExploration,
  savedMoveAnnotations,
  initialFocus,
  initialGameSettings,
  sessionName,
  onExit,
}) {
  const metaGame = initialGame.metaGame;
  const navigate = useNavigate();
  const [renderrep, renderrepSetter] = useState(null);
  const [rendered, setRendered] = useState([]);
  const [boardRenderIndex, setBoardRenderIndex] = useState(0);
  const [focus, focusSetter] = useState(null);
  const [move, moveSetter] = useState({
    move: "",
    valid: true,
    message: "",
    complete: 0,
    rendered: "",
  });
  const [error, errorSetter] = useState(false);
  const [showDeleteSubtreeConfirm, showDeleteSubtreeConfirmSetter] =
    useState(false);
  const [showGameDetails, showGameDetailsSetter] = useState(false);
  const [showGameDump, showGameDumpSetter] = useState(false);
  const [showSettings, showSettingsSetter] = useState(false);
  const [labBoardSettings, labBoardSettingsSetter] =
    useState(getLabBoardSettings);
  const [gameSettings, gameSettingsSetter] = useState(
    initialGameSettings ?? {}
  );
  const [settings, settingsSetter] = useState(null);
  const [rotIncrement, rotIncrementSetter] = useState(0);
  const [gameEngine, gameEngineSetter] = useState(null);
  const [gameDeets, gameDeetsSetter] = useState(null);
  const [designerString, designerStringSetter] = useState("");
  const [coderString, coderStringSetter] = useState("");
  const [screenWidth, screenWidthSetter] = useState(window.innerWidth);
  const [verticalLayout, verticalLayoutSetter] = useStorageState(
    "play-vertical-layout",
    false
  );
  const [, bumpGameColorsRevision] = useState(0);
  const [explorationVersion, bumpExplorationVersion] = useState(0);
  const bumpExploration = () => bumpExplorationVersion((v) => v + 1);
  const [inCheck, inCheckSetter] = useState("");
  const globalMe = useStore((state) => state.globalMe);
  const colourContext = useStore((state) => state.colourContext);
  const [colorMode] = useStorageState("color-mode", "light");
  const errorMessageRef = useRef("");
  const movesRef = useRef(null);
  const statusRef = useRef({});
  const partialMoveRenderRef = useRef(false);
  const focusRef = useRef();
  focusRef.current = focus;
  const globalMeRef = useRef();
  const settingsRef = useRef();
  const tRef = useRef();
  const publishGameColorsRef = useRef();
  const boardClickHandlerRef = useRef();
  const moveEntryHandlersRef = useRef({});
  const moveRef = useRef();
  moveRef.current = move;
  const boardImage = useRef();
  const stackImage = useRef();
  const gameRef = useRef(null);
  const explorationRef = useRef(null);
  const engineRef = useRef(null);
  const sessionNameRef = useRef(sessionName);
  const pendingFocusRestore = useRef(initialFocus);

  const effectiveColourContext = useMemo(
    () => getEffectiveColourContext(colourContext, globalMe, metaGame),
    [colourContext, globalMe, metaGame]
  );

  const { t, i18n } = useTranslation();

  const altDisplays = useMemo(
    () => getAltDisplaysForMetaGame(metaGame),
    [metaGame]
  );

  const publishGameColors = useCallback(
    (node) => {
      const game = gameRef.current;
      if (!game?.customColours || !settings) return;
      setupColors(settings, game, globalMe, effectiveColourContext, node);
      gameRef.current = { ...game, colors: game.colors };
      bumpGameColorsRevision((v) => v + 1);
    },
    [settings, globalMe, effectiveColourContext]
  );

  const persistSession = useCallback(() => {
    if (!gameRef.current || !explorationRef.current?.nodes || !focus) return;
    const nodes = explorationRef.current.nodes;
    const safeFocus = sanitizeFocus(nodes, focus);
    const payload = {
      name: sessionNameRef.current,
      metaGame: gameRef.current.metaGame,
      state: getMainLineTipState(nodes, gameRef.current),
      variants: gameRef.current.selectedVariants ?? [],
      playerCount: gameRef.current.numPlayers,
      focus: {
        moveNumber: safeFocus.moveNumber,
        exPath: [...safeFocus.exPath],
      },
      exploration: serializeSessionExploration(nodes, gameRef.current.gameOver),
      explorationFormat: 2,
      moveAnnotations: serializeMainLineAnnotations(nodes),
      gameSettings: gameSettings ?? {},
      id: gameRef.current.id,
    };
    saveLastSession(payload);
  }, [gameSettings, focus]);

  const debouncedPersist = useMemo(
    () => debounce(persistSession, 500),
    [persistSession]
  );

  useEffect(() => {
    setLabSessionPersistCallback(() => debouncedPersist());
    return () => {
      setLabSessionPersistCallback(null);
      debouncedPersist.cancel();
      persistSession();
    };
  }, [debouncedPersist, persistSession]);

  useEffect(() => {
    if (focus && gameRef.current && explorationRef.current?.nodes) {
      debouncedPersist();
    }
  }, [focus, debouncedPersist]);

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    const onResize = () => screenWidthSetter(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const info = gameinfo.get(metaGame);
    gameDeetsSetter(info);
    if (!info) return;
    if (info.playercounts.length > 1) {
      gameEngineSetter(GameFactory(info.uid, 2));
    } else {
      gameEngineSetter(GameFactory(info.uid));
    }
    if (info.people) {
      const fmt = (p) => {
        if (p.urls?.length > 0) {
          let s = `[${p.name}](${p.urls[0]})`;
          if (p.apid) s += ` [(AP)](/player/${p.apid})`;
          return s;
        }
        if (p.apid) return `[${p.name}](/player/${p.apid})`;
        return p.name;
      };
      const designers = info.people
        .filter((p) => p.type === "designer")
        .map(fmt);
      const coders = info.people.filter((p) => p.type === "coder").map(fmt);
      designerStringSetter(
        (designers.length === 1 ? "Designer: " : "Designers: ") +
          designers.join(", ")
      );
      coderStringSetter(
        (coders.length === 1 ? "Coder: " : "Coders: ") + coders.join(", ")
      );
    }
  }, [metaGame]);

  useEffect(() => {
    try {
      const boardSettings = getLabBoardSettings();
      const sessionGameSettings = initialGameSettings ?? {};
      const initialDisplay = getLabSetting(
        "display",
        undefined,
        sessionGameSettings,
        boardSettings,
        metaGame
      );
      const game0 = cloneDeep(initialGame);
      setupLabGame(
        game0,
        gameRef,
        partialMoveRenderRef,
        renderrepSetter,
        engineRef,
        statusRef,
        movesRef,
        focusSetter,
        explorationRef,
        moveSetter,
        initialDisplay,
        savedExploration,
        savedMoveAnnotations,
        initialFocus
      );
      processNewSettings(
        sessionGameSettings,
        boardSettings,
        gameRef,
        settingsSetter,
        gameSettingsSetter,
        labBoardSettingsSetter,
        globalMe,
        effectiveColourContext
      );
      populateChecked(gameRef, engineRef, t, inCheckSetter);
    } catch (err) {
      if (initialFocus) {
        clearLastSession();
      }
      errorMessageRef.current = err.message;
      errorSetter(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (renderrep !== null && engineRef.current !== null) {
      rotIncrementSetter(
        getRotationIncrement(metaGame, renderrep, engineRef.current)
      );
    } else {
      rotIncrementSetter(0);
    }
  }, [renderrep, metaGame]);

  useEffect(() => {
    if (!gameRef.current?.customColours) return;
    gameRef.current = {
      ...gameRef.current,
      colors: gameRef.current.colors,
    };
    bumpGameColorsRevision((v) => v + 1);
  }, [effectiveColourContext]);

  useEffect(() => {
    if (!gameRef.current || settings === null) return;
    processNewSettings(
      gameSettings ?? {},
      labBoardSettings,
      gameRef,
      settingsSetter,
      gameSettingsSetter,
      labBoardSettingsSetter,
      globalMe,
      effectiveColourContext
    );
  }, [
    effectiveColourContext,
    gameSettings,
    labBoardSettings,
    globalMe?.settings,
  ]);

  const handleGameMoveClick = (foc) => {
    const game = gameRef.current;
    const node = getFocusNode(explorationRef.current.nodes, game, foc);
    const engine = GameFactory(game.metaGame, node.state);
    partialMoveRenderRef.current = false;
    foc.canExplore = canExploreMove(game, explorationRef.current.nodes, foc);
    if (!game.noMoves) {
      movesRef.current = engine.moves();
    }
    focusSetter(foc);
    engineRef.current = engine;
    renderrepSetter(
      engine.render({
        perspective: engine.currplayer,
        altDisplay: settings?.display,
      })
    );
    setStatusFromEngine(engine, game, false);
    moveSetter({ ...engine.validateMove(""), move: "", rendered: "" });
    const metaInfo = gameinfo.get(game.metaGame);
    if (metaInfo.flags.includes("custom-colours")) {
      publishGameColors(node);
    }
  };

  globalMeRef.current = globalMe;
  settingsRef.current = settings;
  tRef.current = t;
  publishGameColorsRef.current = publishGameColors;

  boardClickHandlerRef.current = (row, col, piece) => {
    const node = getFocusNode(
      explorationRef.current.nodes,
      gameRef.current,
      focusRef.current
    );
    const gameEngineTmp = GameFactory(gameRef.current.metaGame, node.state);
    const result = gameEngineTmp.handleClick(
      moveRef.current.move,
      row,
      col,
      piece
    );
    result.rendered = moveRef.current.rendered;
    processNewMove(
      result,
      focusRef.current,
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
      settingsRef.current
    );
    populateChecked(gameRef, engineRef, tRef.current, inCheckSetter);
    const metaInfo = gameinfo.get(gameRef.current.metaGame);
    if (metaInfo.flags.includes("custom-colours")) {
      publishGameColorsRef.current({ state: engineRef.current.state() });
    }
  };

  const moveEntryHandlers = useMemo(
    () => [
      (...args) => moveEntryHandlersRef.current.handleMove(...args),
      (...args) => moveEntryHandlersRef.current.handleMark(...args),
      (...args) => moveEntryHandlersRef.current.handleView(...args),
      (...args) => moveEntryHandlersRef.current.handleReset(...args),
      (...args) =>
        moveEntryHandlersRef.current.handleDeleteExploration(...args),
    ],
    []
  );

  useEffect(() => {
    if (!pendingFocusRestore.current || !focus || !gameRef.current) return;
    pendingFocusRestore.current = false;
    const nodes = explorationRef.current.nodes;
    const safeFocus = sanitizeFocus(nodes, focus);
    const node = getFocusNode(nodes, gameRef.current, safeFocus);
    if (!node) {
      clearLastSession();
      handleGameMoveClick({
        moveNumber: nodes.length - 1,
        exPath: [],
      });
      return;
    }
    if (
      safeFocus.moveNumber !== focus.moveNumber ||
      safeFocus.exPath.join(",") !== focus.exPath.join(",")
    ) {
      handleGameMoveClick(safeFocus);
      return;
    }
    handleGameMoveClick(safeFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  const setStatusFromEngine = (engine, game, partial, partialMove = "") => {
    setStatus(engine, game, partial, partialMove, statusRef.current);
  };

  const handleMove = (value) => {
    const node = getFocusNode(
      explorationRef.current.nodes,
      gameRef.current,
      focus
    );
    const gameEngineTmp = GameFactory(gameRef.current.metaGame, node.state);
    const result = gameEngineTmp.validateMove(value);
    result.move = value;
    result.rendered = move.rendered;
    processNewMove(
      result,
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
      settings
    );
    populateChecked(gameRef, engineRef, t, inCheckSetter);
    const metaInfo = gameinfo.get(gameRef.current.metaGame);
    if (metaInfo.flags.includes("custom-colours")) {
      publishGameColors({ state: engineRef.current.state() });
    }
  };

  const handleView = () => {
    const newmove = cloneDeep(move);
    newmove.complete = 1;
    processNewMove(
      newmove,
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
      settings
    );
    populateChecked(gameRef, engineRef, t, inCheckSetter);
  };

  const handleReset = () => {
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
  };

  const handleMark = (mark) => {
    const node = getFocusNode(
      explorationRef.current.nodes,
      gameRef.current,
      focus
    );
    node.SetOutcome(mark);
    if (gameRef.current.gameOver) {
      fixMoveOutcomes(explorationRef.current.nodes, focus.moveNumber);
    }
    saveLabExploration();
    bumpExploration();
  };

  const handleDeleteExploration = () => {
    const node = getFocusNode(
      explorationRef.current.nodes,
      gameRef.current,
      focus
    );
    if (node.children.length > 0) {
      showDeleteSubtreeConfirmSetter(true);
    } else {
      handleDeleteSubtreeConfirmed();
    }
  };

  const handleDeleteSubtreeConfirmed = () => {
    showDeleteSubtreeConfirmSetter(false);
    getFocusNode(
      explorationRef.current.nodes,
      gameRef.current,
      focus
    ).DeleteNode();
    const foc = cloneDeep(focus);
    foc.exPath.pop();
    if (gameRef.current.gameOver) {
      fixMoveOutcomes(explorationRef.current.nodes, focus.moveNumber);
    }
    saveLabExploration();
    handleGameMoveClick(foc);
  };

  const handleStashClick = (player, count, movePart, handler) => {
    if (handler) handleMove(handler(move.move, movePart));
    else handleMove(move.move + movePart);
  };

  const handleRotate = (dir) => {
    let newGameSettings = cloneDeep(gameSettings) ?? {};
    let rotate = newGameSettings.rotate ?? 0;
    if (dir === "CW") rotate += rotIncrement;
    else rotate -= rotIncrement;
    rotate = ((rotate % 360) + 360) % 360;
    newGameSettings.rotate = rotate;
    processNewSettings(
      newGameSettings,
      labBoardSettings,
      gameRef,
      settingsSetter,
      gameSettingsSetter,
      labBoardSettingsSetter,
      globalMe,
      effectiveColourContext
    );
  };

  const processUpdatedLabSettings = (newGameSettings, newLabBoardSettings) => {
    const newSettings = processNewSettings(
      newGameSettings,
      newLabBoardSettings,
      gameRef,
      settingsSetter,
      gameSettingsSetter,
      labBoardSettingsSetter,
      globalMe,
      effectiveColourContext
    );
    saveLabBoardSettings(newLabBoardSettings);
    if (engineRef.current && newSettings && focus) {
      const node = getFocusNode(
        explorationRef.current.nodes,
        gameRef.current,
        focus
      );
      const engine = GameFactory(gameRef.current.metaGame, node.state);
      engineRef.current = engine;
      const newRenderRep = replaceNames(
        engine.render({
          perspective: engine.currplayer,
          altDisplay: newSettings.display,
        }),
        gameRef.current.players,
        useStore.getState().users
      );
      renderrepSetter(newRenderRep);
      gameRef.current.stackExpanding =
        newRenderRep.renderer === "stacking-expanding";
      const metaInfo = gameinfo.get(gameRef.current.metaGame);
      if (metaInfo.flags.includes("custom-colours")) {
        publishGameColors(node);
      }
    }
    debouncedPersist();
  };

  const handleUpdateRenderOptions = () => {
    showSettingsSetter(true);
  };

  const handleSettingsClose = () => {
    showSettingsSetter(false);
  };

  const handleCycleAltDisplay = () => {
    const next = nextDisplayOption(settings?.display, altDisplays);
    const newLabBoardSettings = cloneDeep(labBoardSettings) ?? { all: {} };
    if (!newLabBoardSettings[metaGame]) {
      newLabBoardSettings[metaGame] = {};
    }
    newLabBoardSettings[metaGame].display = next;
    processUpdatedLabSettings(gameSettings, newLabBoardSettings);
  };

  const handleCustomize = () => {
    if (renderrep) {
      navigate(`/customize/${metaGame}`, {
        state: { inJSON: JSON.stringify(renderrep, null, 2) },
      });
    }
  };

  const handleSaveNamed = () => {
    const name = window.prompt(
      "Name for this saved position:",
      sessionNameRef.current
    );
    if (!name) return;
    debouncedPersist.flush();
    sessionNameRef.current = name;
    const nodes = explorationRef.current.nodes;
    const record = createSaveRecord({
      name,
      metaGame: gameRef.current.metaGame,
      state: getMainLineTipState(nodes, gameRef.current),
      variants: gameRef.current.selectedVariants ?? [],
      playerCount: gameRef.current.numPlayers,
      exploration: serializeSessionExploration(
        nodes,
        gameRef.current.gameOver
      ),
      moveAnnotations: serializeMainLineAnnotations(nodes),
      gameSettings: gameSettings ?? {},
    });
    addSave(record);
    gameRef.current = { ...gameRef.current, id: record.id };
    persistSession();
    window.alert("Saved to Playground.");
  };

  moveEntryHandlersRef.current = {
    handleMove,
    handleMark,
    handleView,
    handleReset,
    handleDeleteExploration,
  };

  const focusCanExplore = focus?.canExplore;
  const focusExPathKey = focus?.exPath?.join(",") ?? "";

  useEffect(() => {
    const currentFocus = focusRef.current;

    const boardClick = (row, col, piece) => {
      boardClickHandlerRef.current(row, col, piece);
    };

    function expand(row, col) {
      const svg = stackImage.current?.querySelector("svg");
      if (svg) svg.remove();
      const expandOpts = {
        divid: "stack",
        svgid: "theStackSVG",
        colourContext: effectiveColourContext,
      };
      render(engineRef.current.renderColumn(row, col), expandOpts);
    }

    if (renderrep !== null && settings !== null && currentFocus) {
      const tmpRendered = [];
      const renders = Array.isArray(renderrep) ? [...renderrep] : [renderrep];
      const canClick = currentFocus.canExplore || gameRef.current?.canSubmit;
      for (let i = 0; i < renders.length; i++) {
        const r = renders[i];
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.left = "-9999px";
        document.body.appendChild(container);
        const opts = {
          divelem: container,
          divid: "svg",
          svgid: "theBoardSVG",
          rotate: settings.rotate,
          showAnnotations: settings.annotate,
          boardClick:
            i === renders.length - 1 && canClick ? boardClick : undefined,
        };
        setRendererColourOpts({
          options: opts,
          metaGame,
          isParticipant: gameRef.current?.me,
          settings,
          context: effectiveColourContext,
          globalMe: globalMeRef.current,
        });
        setGlyphMapOpt({
          options: opts,
          metaGame,
          globalMe: globalMeRef.current,
        });
        if (gameRef.current?.stackExpanding) {
          opts.boardHover = (row, col, piece) => expand(col, row);
        }
        render(r, opts);
        tmpRendered.push(container.firstChild);
        document.body.removeChild(container);
      }
      setRendered(tmpRendered);
    }
  }, [
    renderrep,
    settings,
    effectiveColourContext,
    metaGame,
    focusCanExplore,
    colorMode,
  ]);

  useEffect(() => {
    if (rendered.length > 0) {
      setBoardRenderIndex(Math.max(0, rendered.length - 1));
    }
  }, [rendered]);

  useEffect(() => {
    populateChecked(gameRef, engineRef, t, inCheckSetter);
  }, [t, focus?.moveNumber, focusExPathKey]);

  const game = gameRef.current;

  const playgroundExportText = useMemo(() => {
    void explorationVersion;
    if (!game || !explorationRef.current?.nodes || !focus) return "";
    return serializePlaygroundExport(
      game,
      explorationRef.current.nodes,
      focus
    );
  }, [game, focus, explorationVersion]);

  const focusStateText =
    getFocusNode(explorationRef.current?.nodes, game, focus)?.state ?? "";

  const displayRenderRepJson = useMemo(
    () => getDisplayedRenderRepJson(renderrep, boardRenderIndex),
    [renderrep, boardRenderIndex]
  );

  if (error) {
    return (
      <>
        <p>{errorMessageRef.current}</p>
        <button className="button apButton" onClick={onExit}>
          Back to launcher
        </button>
      </>
    );
  }

  if (!game || !focus) {
    return null;
  }

  const toMove =
    explorationRef.current?.nodes != null
      ? getFocusNode(explorationRef.current.nodes, game, focus)?.toMove ?? ""
      : "";

  const focusNode = getFocusNode(
    explorationRef.current?.nodes,
    game,
    focus
  );
  const showMoveAnnotations =
    focusNode?.move &&
    (focus.moveNumber > 0 || (focus.exPath?.length ?? 0) > 0);

  const statusSection = (
    <>
      <h1 className="subtitle lined">
        <span>{t("Status")}</span>
      </h1>
      <GameStatus
        status={statusRef.current}
        settings={settings}
        game={game}
        canExplore={focus?.canExplore}
        handleStashClick={handleStashClick}
      />
      <MoveEntry
        move={move}
        toMove={toMove}
        game={game}
        engine={engineRef.current}
        moves={movesRef.current}
        exploration={explorationRef.current.nodes}
        focus={focus}
        submitting={false}
        screenWidth={screenWidth}
        handlers={moveEntryHandlers}
      />
    </>
  );

  const boardSection = (
    <>
      <h1 className="subtitle lined">
        <span>
          <Link to={`/games/${metaGame}`}>{gameDeets?.name}</Link>
          <span style={{ fontSize: "smaller" }}> (Playground)</span>
        </span>
      </h1>
      {inCheck ? (
        <div
          className="content inCheck"
          dangerouslySetInnerHTML={{ __html: inCheck }}
        />
      ) : null}
      <Board
        metaGame={metaGame}
        gameID={game.id}
        rendered={rendered}
        t={t}
        locked={false}
        setLocked={noop}
        setRefresh={noop}
        gameEngine={gameEngine}
        inCheck={inCheck}
        stackExpanding={game.stackExpanding || false}
        increment={rotIncrement}
        stackImage={stackImage}
        boardImage={boardImage}
        screenWidth={screenWidth}
        handleRotate={handleRotate}
        handleUpdateRenderOptions={handleUpdateRenderOptions}
        handleCycleAltDisplay={handleCycleAltDisplay}
        hasAltDisplays={altDisplays.length > 0}
        showGameDetailsSetter={showGameDetailsSetter}
        showGameDumpSetter={showGameDumpSetter}
        verticalLayout={verticalLayout}
        verticalLayoutSetter={verticalLayoutSetter}
        copyHWDiagram={noop}
        colourContext={effectiveColourContext}
        hasNewChat={false}
        handleCustomize={handleCustomize}
        boardRenderIndex={boardRenderIndex}
        setBoardRenderIndex={setBoardRenderIndex}
      />
    </>
  );

  const movesSection = (
    <>
      <h1 className="subtitle lined">
        <span>{t("Moves")}</span>
      </h1>
      <GameMoves
        focus={focus}
        game={game}
        exploration={explorationRef.current.nodes}
        noExplore={false}
        handleGameMoveClick={handleGameMoveClick}
        getFocusNode={getFocusNode}
        explorationVersion={explorationVersion}
      />
      {showMoveAnnotations ? (
        <MoveAnnotations focusNode={focusNode} onChange={bumpExploration} />
      ) : null}
    </>
  );

  return (
    <>
      <Helmet>
        <title>{sessionNameRef.current} — Playground</title>
      </Helmet>
      <article>
        {screenWidth < 770 || verticalLayout ? (
          <>
            <div style={{ paddingBottom: "1em" }}>{statusSection}</div>
            <div style={{ paddingBottom: "1em" }}>{boardSection}</div>
            <div>{movesSection}</div>
          </>
        ) : (
          <div className="columns">
            <div className="column is-one-fifth">{statusSection}</div>
            <div className="column">{boardSection}</div>
            <div className="column is-narrow" style={{ maxWidth: "15vw" }}>
              {movesSection}
            </div>
          </div>
        )}
        <div className="buttons">
          <button className="button apButton" onClick={handleSaveNamed}>
            Save to Playground
          </button>
          <button className="button apButtonNeutral" onClick={onExit}>
            Exit to launcher
          </button>
        </div>

        <Modal
          show={showDeleteSubtreeConfirm}
          title={t("ConfirmDeleteSubtree")}
          buttons={[
            { label: t("Delete"), action: handleDeleteSubtreeConfirmed },
            {
              label: t("Cancel"),
              action: () => showDeleteSubtreeConfirmSetter(false),
            },
          ]}
        >
          <div className="content">
            <p>{t("ConfirmDeleteSubtreeDesc")}</p>
          </div>
        </Modal>
        <Modal
          show={showGameDetails}
          title={t("GameInfoFor", { metaGame: gameDeets?.name })}
          buttons={[
            { label: t("Close"), action: () => showGameDetailsSetter(false) },
          ]}
        >
          {gameEngine ? (
            <div className="content">
              <ReactMarkdown rehypePlugins={[rehypeRaw]} className="content">
                {gameEngine.description() +
                  (designerString ? "\n\n" + designerString : "") +
                  (coderString ? "\n\n" + coderString : "")}
              </ReactMarkdown>
              <ul className="contained">
                {gameDeets?.urls?.map((l, i) => (
                  <li key={i}>
                    <a href={l} target="_blank" rel="noopener noreferrer">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
              {gameEngine.notes() ? (
                <>
                  <h2>{t("ImplementationNotes")}</h2>
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    className="content"
                  >
                    {gameEngine.notes()}
                  </ReactMarkdown>
                </>
              ) : null}
            </div>
          ) : null}
        </Modal>
        <Modal
          show={showGameDump}
          title={t("DebugModal")}
          buttons={[
            { label: t("Close"), action: () => showGameDumpSetter(false) },
          ]}
        >
          <div className="content">
            <h2>Copy position</h2>
            <p>Raw engine state at the current focus (for debugging).</p>
            <ClipboardCopy copyText={focusStateText} />
            <div className="field">
              <div className="control">
                <a
                  href={`data:text/json;charset=utf-8,${encodeURIComponent(
                    focusStateText
                  )}`}
                  download="AbstractPlay-Playground-position.json"
                >
                  <button className="button apButtonNeutral">
                    {t("Download")}
                  </button>
                </a>
              </div>
            </div>
            <h2>Copy game</h2>
            <p>
              Full Playground export including move tree, focus, and
              annotations — paste into Playground to share.
            </p>
            <ClipboardCopy copyText={playgroundExportText} />
            <div className="field">
              <div className="control">
                <a
                  href={`data:text/json;charset=utf-8,${encodeURIComponent(
                    playgroundExportText
                  )}`}
                  download="AbstractPlay-Playground.json"
                >
                  <button className="button apButtonNeutral">
                    {t("Download")}
                  </button>
                </a>
              </div>
            </div>
            {displayRenderRepJson ? (
              <>
                <h2>Copy renderer JSON</h2>
                <p>
                  Renderer input for the board view currently shown (for
                  Customize or debugging).
                </p>
                <ClipboardCopy copyText={displayRenderRepJson} />
                <div className="field">
                  <div className="control">
                    <a
                      href={`data:text/json;charset=utf-8,${encodeURIComponent(
                        displayRenderRepJson
                      )}`}
                      download="AbstractPlay-Playground-renderer.json"
                    >
                      <button className="button apButtonNeutral">
                        {t("Download")}
                      </button>
                    </a>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </Modal>
        <LabRenderOptionsModal
          show={showSettings}
          game={game}
          labBoardSettings={labBoardSettings}
          gameSettings={gameSettings}
          processNewSettings={processUpdatedLabSettings}
          showSettingsSetter={showSettingsSetter}
          handleClose={handleSettingsClose}
        />
      </article>
    </>
  );
}

export default LabSession;
