import {
  useState,
  useEffect,
  useRef,
  Fragment,
  useMemo,
  useCallback,
} from "react";
import { gameinfo } from "@abstractplay/gameslib";
import {
  compareCategoryTagEntries,
  listPublicCatalogMetas,
  getGameDisplayName,
} from "../../lib/gameOptions";
import {
  compareStrings,
  stringColumnSortingFn,
} from "../../lib/compareStrings";
import { gameDescription } from "../../lib/gameDescription";
import { useTranslation } from "react-i18next";
import { getUiLocaleBundleKey } from "../../i18n";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
import ExpandableDiv from "../ExpandableDiv";
import { trimmedIncludesStringColumnFilterFn } from "../../lib/tableGlobalFilter";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import Thumbnail from "../Thumbnail";
import Modal from "../Modal";
import ChallengeEntryModals from "../ChallengeEntryModals";
import {
  fetchMvtimes,
  MVTIMES_URL,
  useGameRecommendations,
} from "../../hooks/useGameRecommendations";
import { useStore } from "../../stores";
import { useEnsureSummaryTier } from "../../hooks/useEnsureSummaryTier";
import ExploreTagFilterModal from "./ExploreTagFilterModal";
import {
  countAdvancedFilterRules,
  EMPTY_TAG_FILTER_SPEC,
  exploreTagFiltersActive,
  gameMatchesExploreTagFilters,
  mergeExploreTagFiltersIntoSearch,
  normalizeTagFilterSpec,
  parseExploreTagFiltersFromSearch,
  parseStoredExploreTagFilters,
  tagFilterSpecIsActive,
} from "../../lib/categoryTagFilter";

function readStoredValue(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      return JSON.parse(raw);
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

function initialPageSize(viewKey) {
  const fromNew = readStoredValue(`explore-show-${viewKey}`);
  if (fromNew !== undefined) {
    return fromNew;
  }
  const legacyKeys =
    viewKey === "all" ? ["allgames-show", "1es-show"] : ["1es-show"];
  for (const legacyKey of legacyKeys) {
    const fromLegacy = readStoredValue(legacyKey);
    if (fromLegacy !== undefined) {
      return fromLegacy;
    }
  }
  return 10;
}

function initialGridView(viewKey) {
  const fromNew = readStoredValue(`explore-grid-${viewKey}`);
  if (fromNew !== undefined) {
    return fromNew;
  }
  const fromLegacy = readStoredValue("grid-view");
  if (fromLegacy !== undefined) {
    return fromLegacy;
  }
  return false;
}

const COUNT_VIEWS = new Set(["all", "stars", "completed", "random"]);

function readExploreFilterStorage(viewKey) {
  try {
    const stored = sessionStorage.getItem(`explore-filters-${viewKey}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    /* ignore */
  }
  return null;
}

function getInitialExploreTagFilters(viewKey, enableTagFilter) {
  if (!enableTagFilter) {
    return {
      quickTag: "",
      tagFilterSpec: normalizeTagFilterSpec(EMPTY_TAG_FILTER_SPEC),
    };
  }
  if (viewKey === "all" && typeof window !== "undefined") {
    const search = window.location.search;
    if (search.includes("t=") || search.includes("tf=2")) {
      return parseExploreTagFiltersFromSearch(search);
    }
  }
  return parseStoredExploreTagFilters(readExploreFilterStorage(viewKey));
}

function ExploreView({ config, viewKey, toggleStar, counts, handleChallenge }) {
  const location = useLocation();
  const navigate = useNavigate();
  const allSize = Number.MAX_SAFE_INTEGER;
  const globalMe = useStore((state) => state.globalMe);
  const summarySite = useStore((state) => state.summary);
  const summarySiteLoadState = useStore((state) => state.summarySiteLoadState);
  const [games, gamesSetter] = useState([]);
  const [urlFetchedData, urlFetchedDataSetter] = useState(null);
  useEnsureSummaryTier(config.summaryTier ?? null);

  useEffect(() => {
    if (!config.fetchUrl) return;
    let cancelled = false;
    (async () => {
      try {
        const result =
          config.fetchUrl === MVTIMES_URL
            ? await fetchMvtimes()
            : await fetch(config.fetchUrl).then((res) =>
                res.ok ? res.json() : null
              );
        if (!cancelled) {
          urlFetchedDataSetter(result);
        }
      } catch (error) {
        console.log(error);
        if (!cancelled) {
          urlFetchedDataSetter(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config.fetchUrl]);

  const fetchedData = useMemo(() => {
    if (config.fetchUrl) {
      return urlFetchedData;
    }
    if (!config.summaryTier) {
      return null;
    }
    if (config.summaryTier === "site" && summarySiteLoadState === "ready") {
      return summarySite;
    }
    return null;
  }, [
    config.fetchUrl,
    config.summaryTier,
    urlFetchedData,
    summarySite,
    summarySiteLoadState,
  ]);
  const [showState, showStateSetter] = useStorageState(
    `explore-show-${viewKey}`,
    initialPageSize(viewKey)
  );
  const [pageIndex, pageIndexSetter] = useState(() => {
    try {
      const stored = sessionStorage.getItem(`explore-page-${viewKey}`);
      return stored !== null ? parseInt(stored, 10) : 0;
    } catch {
      /* ignore */
      return 0;
    }
  });
  const [expandedPara, expandedParaSetter] = useState([]);
  const [expandAllDescriptions, expandAllDescriptionsSetter] = useStorageState(
    "explore-expand-all-descriptions",
    false
  );
  const [sorting, setSorting] = useState(config.defaultSort);
  const initialTagFilters = getInitialExploreTagFilters(
    viewKey,
    config.enableTagFilter
  );
  const [columnFilters, setColumnFilters] = useState(() => {
    const filters = [];
    try {
      const stored = sessionStorage.getItem(`explore-filters-${viewKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.nameSearch) {
          filters.push({ id: "gameName", value: parsed.nameSearch });
        }
        if (parsed.designerSearch) {
          filters.push({ id: "designers", value: parsed.designerSearch });
        }
      }
    } catch {
      /* ignore */
    }
    if (
      config.enableTagFilter &&
      exploreTagFiltersActive({
        quickTag: initialTagFilters.quickTag,
        tagFilterSpec: initialTagFilters.tagFilterSpec,
      })
    ) {
      filters.push({
        id: "tags",
        value: {
          quickTag: initialTagFilters.quickTag,
          spec: initialTagFilters.tagFilterSpec,
        },
      });
    }
    return filters;
  });
  const [gridView, gridViewSetter] = useStorageState(
    `explore-grid-${viewKey}`,
    initialGridView(viewKey)
  );
  const [activeImgModal, activeImgModalSetter] = useState("");
  const [activeChallengeModal, activeChallengeModalSetter] = useState("");
  const [filterStars, filterStarsSetter] = useStorageState(
    config.starFilterStorageKey || "explore-filter-stars",
    false
  );
  const starFilterActive = filterStars && globalMe !== null;
  const [filterRecommended, filterRecommendedSetter] = useStorageState(
    config.recommendedFilterStorageKey || "explore-filter-recommended",
    false
  );
  const { recommendations, loading: recommendationsLoading } =
    useGameRecommendations({
      enabled: Boolean(config.enableRecommendedFilter),
    });
  const recommendedIds = useMemo(
    () => new Set(recommendations.map((game) => game.id)),
    [recommendations]
  );
  const [quickTag, setQuickTag] = useState(initialTagFilters.quickTag);
  const [tagFilterSpec, setTagFilterSpec] = useState(
    initialTagFilters.tagFilterSpec
  );
  const [showAdvancedTagModal, setShowAdvancedTagModal] = useState(false);
  const [nameSearch, nameSearchSetter] = useState(() => {
    try {
      const stored = sessionStorage.getItem(`explore-filters-${viewKey}`);
      if (stored) return JSON.parse(stored).nameSearch || "";
    } catch {
      /* ignore */
    }
    return "";
  });
  const [designerSearch, designerSearchSetter] = useState(() => {
    try {
      const stored = sessionStorage.getItem(`explore-filters-${viewKey}`);
      if (stored) return JSON.parse(stored).designerSearch || "";
    } catch {
      /* ignore */
    }
    return "";
  });
  const { t, i18n } = useTranslation();
  const { t: tCat } = useTranslation("apgames");
  const localeBundleKey = getUiLocaleBundleKey(i18n);

  useEffect(() => {
    sessionStorage.setItem(`explore-page-${viewKey}`, String(pageIndex));
  }, [pageIndex, viewKey]);

  useEffect(() => {
    const filterState = {
      quickTag,
      tagFilterSpec,
      nameSearch,
      designerSearch,
    };
    sessionStorage.setItem(
      `explore-filters-${viewKey}`,
      JSON.stringify(filterState)
    );
  }, [quickTag, tagFilterSpec, nameSearch, designerSearch, viewKey]);

  useEffect(() => {
    if (viewKey !== "all" || !config.enableTagFilter) {
      return undefined;
    }
    const timer = setTimeout(() => {
      const nextSearch = mergeExploreTagFiltersIntoSearch(location.search, {
        quickTag,
        tagFilterSpec,
      });
      const current = location.search || "";
      if (nextSearch !== current) {
        navigate(
          { pathname: location.pathname, search: nextSearch },
          { replace: true }
        );
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [
    quickTag,
    tagFilterSpec,
    viewKey,
    config.enableTagFilter,
    location.pathname,
    location.search,
    navigate,
  ]);

  const openImgModal = useCallback((name) => {
    activeImgModalSetter(name);
  }, []);
  const closeImgModal = useCallback(() => {
    activeImgModalSetter("");
  }, []);
  const openChallengeModal = useCallback((name) => {
    activeChallengeModalSetter(name);
  }, []);
  const closeChallengeModal = useCallback(() => {
    activeChallengeModalSetter("");
  }, []);

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

  const syncTagsColumnFilter = useCallback((q, spec) => {
    setColumnFilters((prev) => {
      const rest = prev.filter((cf) => cf.id !== "tags");
      if (exploreTagFiltersActive({ quickTag: q, tagFilterSpec: spec })) {
        rest.push({ id: "tags", value: { quickTag: q, spec } });
      }
      return rest;
    });
  }, []);

  const exploreTagColumnFilter = useCallback((row, id, filterVal) => {
    if (!filterVal) {
      return true;
    }
    const val = row.getValue(id);
    const categories = val.map((entry) => entry.raw);
    return gameMatchesExploreTagFilters(categories, {
      quickTag: filterVal.quickTag,
      spec: filterVal.spec,
    });
  }, []);

  const setQuickTagValue = useCallback(
    (tag) => {
      const q = tag == null ? "" : String(tag).trim();
      setQuickTag(q);
      syncTagsColumnFilter(q, tagFilterSpec);
      pageIndexSetter(0);
    },
    [tagFilterSpec, syncTagsColumnFilter]
  );

  const applyAdvancedTagSpec = useCallback(
    (spec) => {
      const normalized = normalizeTagFilterSpec(spec);
      setTagFilterSpec(normalized);
      syncTagsColumnFilter(quickTag, normalized);
      setShowAdvancedTagModal(false);
      pageIndexSetter(0);
    },
    [quickTag, syncTagsColumnFilter]
  );

  const buildTagFilterShareUrl = useCallback(
    (advancedSpec) => {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const search = mergeExploreTagFiltersIntoSearch(location.search, {
        quickTag,
        tagFilterSpec: advancedSpec,
      });
      return `${origin}${location.pathname}${search}`;
    },
    [location.pathname, location.search, quickTag]
  );

  const advancedRuleCount = useMemo(
    () => countAdvancedFilterRules(tagFilterSpec),
    [tagFilterSpec]
  );

  const updateNameFilter = useCallback(
    (txt) => {
      nameSearchSetter(txt);
      const filters = [...columnFilters].filter((cf) => cf.id !== "gameName");
      if (txt.trim() !== "") {
        filters.push({ id: "gameName", value: txt });
      }
      setColumnFilters([...filters]);
    },
    [columnFilters]
  );

  const updateDesignerFilter = useCallback(
    (txt) => {
      designerSearchSetter(txt);
      const filters = [...columnFilters].filter((cf) => cf.id !== "designers");
      if (txt.trim() !== "") {
        filters.push({ id: "designers", value: txt });
      }
      setColumnFilters([...filters]);
    },
    [columnFilters]
  );

  const loadGames = useCallback(
    (forceNew) => {
      let metas = listPublicCatalogMetas();
      if (config.loadGames) {
        gamesSetter(config.loadGames(metas, forceNew));
      } else {
        metas.sort((a, b) =>
          compareStrings(
            getGameDisplayName(a),
            getGameDisplayName(b),
            i18n.language
          )
        );
        gamesSetter([...metas]);
      }
    },
    [config, localeBundleKey]
  );

  useEffect(() => {
    loadGames(false);
  }, [loadGames]);

  const handleReload = useCallback(() => {
    loadGames(true);
    pageIndexSetter(0);
  }, [loadGames]);

  const allTags = useMemo(() => {
    if (!config.enableTagFilter) return [];
    const tagSet = new Set();
    games.forEach((metaGame) => {
      const info = gameinfo.get(metaGame);
      info.categories.forEach((cat) => tagSet.add(cat));
    });
    return [...tagSet.values()]
      .map((cat) => ({
        raw: cat,
        tag: tCat(`categories.${cat}.tag`),
        desc: tCat(`categories.${cat}.description`),
        full: tCat(`categories.${cat}.full`),
      }))
      .sort((a, b) => compareCategoryTagEntries(a, b, i18n.language));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- labels follow localeBundleKey
  }, [config.enableTagFilter, games, localeBundleKey]);

  const data = useMemo(
    () =>
      games
        .map((metaGame) => {
          const info = gameinfo.get(metaGame);
          const tagsRaw = info.categories.map((cat) => ({
            raw: cat,
            tag: tCat(`categories.${cat}.tag`),
            desc: tCat(`categories.${cat}.description`),
            full: tCat(`categories.${cat}.full`),
          }));
          const tags = config.showAllTags
            ? [...tagsRaw].sort((a, b) =>
                compareCategoryTagEntries(a, b, i18n.language)
              )
            : tagsRaw.filter((cat) => cat.raw.startsWith("goal"));
          return {
            id: metaGame,
            gameName: getGameDisplayName(metaGame),
            image: undefined,
            links: info.urls,
            designers:
              info.people !== undefined && info.people.length > 0
                ? info.people.filter((p) => p.type === "designer")
                : [],
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
            ...config.extraFields(metaGame, info, fetchedData, counts),
          };
        })
        .filter((obj) => !starFilterActive || obj.starred)
        .filter((obj) => !filterRecommended || recommendedIds.has(obj.id)),
    // getGameDisplayName reads gameslib i18n synced from host language
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh labels on locale change
    [
      localeBundleKey,
      games,
      globalMe,
      fetchedData,
      counts,
      config,
      starFilterActive,
      filterRecommended,
      recommendedIds,
    ]
  );

  const scrolledRef = useRef(false);
  useEffect(() => {
    if (scrolledRef.current) return;
    const clickedId = sessionStorage.getItem(`explore-clicked-${viewKey}`);
    if (clickedId && data.length > 0) {
      requestAnimationFrame(() => {
        const row = document.querySelector(`[data-game-id="${clickedId}"]`);
        if (row) {
          scrolledRef.current = true;
          sessionStorage.removeItem(`explore-clicked-${viewKey}`);
          row.scrollIntoView({ block: "center", behavior: "auto" });
        }
      });
    }
  }, [data, viewKey]);

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "toggleStar",
        ...(config.enableStarFilter
          ? {
              header: (
                <input
                  type="checkbox"
                  defaultChecked={filterStars}
                  onClick={() => filterStarsSetter(!filterStars)}
                />
              ),
            }
          : {}),
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
        header: t("tables.game"),
        cell: (props) => (
          <Link to={`/games/${props.row.original.id}`}>{props.getValue()}</Link>
        ),
        filterFn: trimmedIncludesStringColumnFilterFn,
        sortingFn: stringColumnSortingFn(i18n.language),
      }),
      columnHelper.accessor(
        (row) =>
          row.designers.length > 0
            ? row.designers.map((d) => d.name).join(" ")
            : "",
        {
          header: t("tables.designers"),
          id: "designers",
          filterFn: trimmedIncludesStringColumnFilterFn,
          sortingFn: stringColumnSortingFn(i18n.language),
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
        header: t("tables.image"),
        cell: (props) => (
          <div onClick={() => openImgModal(props.row.original.id)}>
            <Thumbnail meta={props.row.original.id} />
          </div>
        ),
        enableSorting: false,
      }),
      columnHelper.display({
        id: "description",
        header: t("tables.description"),
        cell: (props) => (
          <ExpandableDiv
            expanded={
              expandAllDescriptions ||
              expandedPara.includes(props.row.original.id)
            }
            handleClick={() => togglePara(props.row.original.id)}
          >
            <ReactMarkdown rehypePlugins={[rehypeRaw]} className="content">
              {gameDescription(props.row.original.id)}
            </ReactMarkdown>
          </ExpandableDiv>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("tags", {
        header: config.showAllTags ? t("tables.tags") : t("tables.goal"),
        cell: (props) =>
          props
            .getValue()
            .map((tag, ind) =>
              tag === "" ? null : (
                <span
                  key={`tag_${ind}`}
                  className="tag"
                  title={tag.desc}
                  onClick={
                    config.enableTagFilter
                      ? () => setQuickTagValue(tag.raw)
                      : undefined
                  }
                >
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
        ...(config.enableTagFilter ? { filterFn: exploreTagColumnFilter } : {}),
      }),
      ...config.extraColumns(columnHelper, { openChallengeModal }, t),
    ],
    [
      columnHelper,
      expandedPara,
      expandAllDescriptions,
      togglePara,
      toggleStar,
      openImgModal,
      openChallengeModal,
      config,
      filterStars,
      filterStarsSetter,
      setQuickTagValue,
      exploreTagColumnFilter,
      t,
      i18n.language,
    ]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination: { pageIndex, pageSize: showState },
      columnVisibility: {
        toggleStar: globalMe !== null && !gridView,
        actions: globalMe !== null,
      },
      columnFilters,
    },
    autoResetPageIndex: false,
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const old = { pageIndex, pageSize: showState };
      const next = typeof updater === "function" ? updater(old) : updater;
      pageIndexSetter(next.pageIndex);
      showStateSetter(next.pageSize);
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableSortingRemoval: false,
  });

  useEffect(() => {
    const pageCount = table.getPageCount();
    pageIndexSetter((current) =>
      pageCount > 0 && current >= pageCount ? pageCount - 1 : current
    );
    // Omit `table` — its identity changes when pagination updates (infinite loop).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, columnFilters, showState]);

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
              {t("Page")}{" "}
              <strong>{table.getState().pagination.pageIndex + 1}</strong>{" "}
              {t("of")} <strong>{table.getPageCount()}</strong> (
              {table.getPrePaginationRowModel().rows.length} {t("TotalGames")})
            </p>
          </div>
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
                      {t("Show")} {pageSize === allSize ? t("All") : pageSize}
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
                <span>{t("TableView")}</span>
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
                <span>{t("GridView")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="container" style={{ paddingBottom: "1em" }}>
        <h1 className="subtitle">{t(config.titleKey)}</h1>
      </div>
      {config.descriptionKey ? (
        <ReactMarkdown rehypePlugins={[rehypeRaw]} className="content">
          {t(config.descriptionKey)}
        </ReactMarkdown>
      ) : null}
      {config.renderExtra ? config.renderExtra(handleReload, t) : null}
      {counts === null && COUNT_VIEWS.has(viewKey) ? (
        <p className="help has-text-centered">{t("explore.loadingCounts")}</p>
      ) : null}
      {config.enableRecommendedFilter ? (
        <div className="container content" style={{ paddingBottom: "0.75em" }}>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={filterRecommended}
              onChange={() => filterRecommendedSetter(!filterRecommended)}
            />
            {t("explore.filterRecommended")}
          </label>
          {filterRecommended && recommendationsLoading ? (
            <p className="help">{t("gamePicker.loadingRecommendations")}</p>
          ) : null}
        </div>
      ) : null}
      <div className="container">
        {tableNavigation}
        <table
          className={gridView ? "table apTable gameGrid" : "table apTable"}
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
                            onClick: header.column.getToggleSortingHandler(),
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
                            <div
                              style={{
                                fontSize: "smaller",
                                fontWeight: "normal",
                                paddingTop: "0.25em",
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            >
                              <label className="checkbox">
                                <input
                                  type="checkbox"
                                  checked={Boolean(expandAllDescriptions)}
                                  onChange={() =>
                                    expandAllDescriptionsSetter(
                                      !expandAllDescriptions
                                    )
                                  }
                                />{" "}
                                {t("explore.expandAllDescriptions")}
                              </label>
                              {!expandAllDescriptions ? (
                                <span className="is-block help">
                                  ({t("ClickExpand")})
                                </span>
                              ) : null}
                            </div>
                          )}
                        </div>
                        {config.enableNameSearch && header.id === "gameName" ? (
                          <div className="control">
                            <input
                              className="input is-small"
                              type="search"
                              value={nameSearch}
                              onChange={(e) => updateNameFilter(e.target.value)}
                            />
                          </div>
                        ) : null}
                        {config.enableDesignerSearch &&
                        header.id === "designers" ? (
                          <div className="control">
                            <input
                              className="input is-small"
                              type="search"
                              value={designerSearch}
                              onChange={(e) =>
                                updateDesignerFilter(e.target.value)
                              }
                            />
                          </div>
                        ) : null}
                        {config.enableTagFilter && header.id === "tags" ? (
                          <div className="explore-tag-filter-header">
                            <div className="explore-tag-filter-header__row">
                              <div className="control">
                                <div className="select is-small">
                                  <select
                                    value={quickTag}
                                    aria-label={t("explore.tagFilter.quickLabel")}
                                    onChange={(e) =>
                                      setQuickTagValue(e.target.value)
                                    }
                                  >
                                    <option value="">
                                      {t("gamePicker.filterAny")}
                                    </option>
                                    {allTags.map((tg, i) => (
                                      <option
                                        value={tg.raw}
                                        key={`tagdd_${i}`}
                                      >
                                        {tg.full}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <button
                                type="button"
                                className="button is-small apButtonNeutral"
                                onClick={() => setShowAdvancedTagModal(true)}
                              >
                                {t("explore.tagFilter.advancedButton")}
                                {advancedRuleCount > 0
                                  ? ` (${advancedRuleCount})`
                                  : ""}
                              </button>
                            </div>
                            {tagFilterSpecIsActive(tagFilterSpec) ? (
                              <span className="explore-tag-filter-header__summary">
                                {t("explore.tagFilter.advancedActive", {
                                  count: advancedRuleCount,
                                })}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                data-game-id={row.original.id}
                onClick={() =>
                  sessionStorage.setItem(
                    `explore-clicked-${viewKey}`,
                    row.original.id
                  )
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {tableNavigation}
      </div>
      <Modal
        buttons={[{ label: t("Close"), action: closeImgModal }]}
        show={activeImgModal !== ""}
        title={
          activeImgModal
            ? `Board image for ${getGameDisplayName(activeImgModal)}`
            : ""
        }
      >
        <div className="content">
          {activeImgModal && (
            <Thumbnail meta={activeImgModal} linkToSource />
          )}
        </div>
      </Modal>
      {config.enableTagFilter ? (
        <ExploreTagFilterModal
          show={showAdvancedTagModal}
          initialSpec={tagFilterSpec}
          allTags={allTags}
          onApply={applyAdvancedTagSpec}
          onClose={() => setShowAdvancedTagModal(false)}
          buildShareUrl={buildTagFilterShareUrl}
        />
      ) : null}
      {handleChallenge && (
        <ChallengeEntryModals
          show={activeChallengeModal !== ""}
          handleClose={closeChallengeModal}
          handleChallenge={handleChallenge}
          fixedMetaGame={activeChallengeModal || undefined}
        />
      )}
    </>
  );
}

export default ExploreView;
