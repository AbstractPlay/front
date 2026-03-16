import {
  useState,
  useEffect,
  useRef,
  Fragment,
  useMemo,
  useCallback,
} from "react";
import { gameinfo, GameFactory } from "@abstractplay/gameslib";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { addResource } from "@abstractplay/gameslib";
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
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import Thumbnail from "../Thumbnail";
import Modal from "../Modal";
import NewChallengeModal from "../NewChallengeModal";
import { useStore } from "../../stores";

function tagSortFn(a, b) {
  const priority = (raw) => {
    if (raw.startsWith("goal")) return 1;
    if (raw.startsWith("mech")) return 2;
    if (raw.startsWith("board>shape")) return 3.1;
    if (raw.startsWith("board>connect")) return 3.2;
    if (raw.startsWith("board")) return 3;
    return 4;
  };
  const va = priority(a.raw),
    vb = priority(b.raw);
  return va === vb ? a.tag.localeCompare(b.tag) : va - vb;
}

function ExploreView({ config, viewKey, toggleStar, counts, handleChallenge }) {
  const allSize = Number.MAX_SAFE_INTEGER;
  const globalMe = useStore((state) => state.globalMe);
  const [games, gamesSetter] = useState([]);
  const [fetchedData, fetchedDataSetter] = useState(null);
  const [showState, showStateSetter] = useStorageState(
    config.pageSizeStorageKey || "1es-show",
    10
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
  const [sorting, setSorting] = useState(config.defaultSort);
  const [columnFilters, setColumnFilters] = useState(() => {
    const filters = [];
    try {
      const stored = sessionStorage.getItem(`explore-filters-${viewKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.tagFilter?.length > 0) {
          filters.push({ id: "tags", value: parsed.tagFilter });
        }
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
    return filters;
  });
  const [gridView, gridViewSetter] = useStorageState("grid-view", false);
  const [activeImgModal, activeImgModalSetter] = useState("");
  const [activeChallengeModal, activeChallengeModalSetter] = useState("");
  const [filterStars, filterStarsSetter] = useStorageState(
    config.starFilterStorageKey || "explore-filter-stars",
    false
  );
  const [tagFilter, tagFilterSetter] = useState(() => {
    try {
      const stored = sessionStorage.getItem(`explore-filters-${viewKey}`);
      if (stored) return JSON.parse(stored).tagFilter || [];
    } catch {
      /* ignore */
    }
    return [];
  });
  const [ddSelected, ddSelectedSetter] = useState("");
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
  addResource(i18n.language);

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    sessionStorage.setItem(`explore-page-${viewKey}`, String(pageIndex));
  }, [pageIndex, viewKey]);

  useEffect(() => {
    const filterState = { tagFilter, nameSearch, designerSearch };
    sessionStorage.setItem(
      `explore-filters-${viewKey}`,
      JSON.stringify(filterState)
    );
  }, [tagFilter, nameSearch, designerSearch, viewKey]);

  useEffect(() => {
    if (!config.fetchUrl) return;
    async function fetchData() {
      try {
        var url = new URL(config.fetchUrl);
        const res = await fetch(url);
        const result = await res.json();
        fetchedDataSetter(result);
      } catch (error) {
        console.log(error);
        fetchedDataSetter(null);
      }
    }
    fetchData();
  }, [config.fetchUrl]);

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

  const multiTagSelect = useCallback((row, id, filterVals) => {
    if (filterVals.length === 0) return true;
    const val = row.getValue(id);
    return filterVals.reduce(
      (prev, curr) => prev && val.find((o) => o.raw === curr) !== undefined,
      true
    );
  }, []);

  const addTag = useCallback(
    (tag) => {
      if (tag !== "" && !tagFilter.includes(tag)) {
        const tags = [...tagFilter, tag];
        tagFilterSetter([...tags]);
        const lst = [...columnFilters].filter((cf) => cf.id !== "tags");
        setColumnFilters([...lst, { id: "tags", value: tags }]);
      }
    },
    [tagFilter, columnFilters]
  );

  const delTag = useCallback(
    (tag) => {
      if (tagFilter.includes(tag)) {
        const tags = [...tagFilter.filter((t) => t !== tag)];
        tagFilterSetter([...tags]);
        const lst = [...columnFilters].filter((cf) => cf.id !== "tags");
        setColumnFilters([...lst, { id: "tags", value: tags }]);
      }
    },
    [tagFilter, columnFilters]
  );

  const updateNameFilter = useCallback(
    (txt) => {
      nameSearchSetter(txt);
      const filters = [...columnFilters].filter((cf) => cf.id !== "gameName");
      if (txt !== "") {
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
      if (txt !== "") {
        filters.push({ id: "designers", value: txt });
      }
      setColumnFilters([...filters]);
    },
    [columnFilters]
  );

  const loadGames = useCallback(
    (forceNew) => {
      let metas = [...gameinfo.keys()];
      if (process.env.REACT_APP_REAL_MODE === "production") {
        metas = metas.filter(
          (id) => !gameinfo.get(id).flags.includes("experimental")
        );
      }
      if (config.loadGames) {
        gamesSetter(config.loadGames(metas, forceNew));
      } else {
        metas.sort((a, b) => {
          const na = gameinfo.get(a).name;
          const nb = gameinfo.get(b).name;
          if (na < nb) return -1;
          else if (na > nb) return 1;
          return 0;
        });
        gamesSetter([...metas]);
      }
    },
    [config]
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
        tag: t(`categories.${cat}.tag`),
        desc: t(`categories.${cat}.description`),
        full: t(`categories.${cat}.full`),
      }))
      .sort(tagSortFn);
  }, [config.enableTagFilter, games, t]);

  const data = useMemo(
    () =>
      games
        .map((metaGame) => {
          const info = gameinfo.get(metaGame);
          let gameEngine;
          if (info.playercounts.length > 1) {
            gameEngine = GameFactory(metaGame, 2);
          } else {
            gameEngine = GameFactory(metaGame);
          }
          const tagsRaw = info.categories.map((cat) => ({
            raw: cat,
            tag: t(`categories.${cat}.tag`),
            desc: t(`categories.${cat}.description`),
            full: t(`categories.${cat}.full`),
          }));
          const tags = config.showAllTags
            ? [...tagsRaw].sort(tagSortFn)
            : tagsRaw.filter((cat) => cat.raw.startsWith("goal"));
          return {
            id: metaGame,
            gameName: info.name,
            image: undefined,
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
            ...config.extraFields(metaGame, info, fetchedData, counts),
          };
        })
        .filter((obj) => !filterStars || obj.starred),
    [t, games, globalMe, fetchedData, counts, config, filterStars]
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
          <div onClick={() => openImgModal(props.row.original.id)}>
            <Thumbnail meta={props.row.original.id} />
          </div>
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
        header: config.tagColumnHeader || "Goal",
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
                    config.enableTagFilter ? () => addTag(tag.raw) : undefined
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
        ...(config.enableTagFilter ? { filterFn: multiTagSelect } : {}),
      }),
      ...config.extraColumns(columnHelper, { openChallengeModal }),
    ],
    [
      columnHelper,
      expandedPara,
      togglePara,
      toggleStar,
      openImgModal,
      openChallengeModal,
      config,
      filterStars,
      filterStarsSetter,
      addTag,
      multiTagSelect,
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

  return (
    <>
      <div className="container" style={{ paddingBottom: "1em" }}>
        <h1 className="subtitle">{config.title}</h1>
      </div>
      {config.description ? (
        <ReactMarkdown rehypePlugins={[rehypeRaw]} className="content">
          {config.description}
        </ReactMarkdown>
      ) : null}
      {config.renderExtra ? config.renderExtra(handleReload) : null}
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
                          <>
                            <div className="control">
                              <div className="select is-small">
                                <select
                                  value={ddSelected}
                                  onChange={(e) => {
                                    addTag(e.target.value);
                                    ddSelectedSetter("");
                                  }}
                                >
                                  <option value="" key="tagdd_blank"></option>
                                  {allTags.map((tg, i) => (
                                    <option value={tg.raw} key={`tagdd_${i}`}>
                                      {tg.full}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            {tagFilter
                              .map((tag, ind) =>
                                tag === "" ? null : (
                                  <span
                                    key={`tag_${ind}`}
                                    className="tag"
                                    title={t(`categories.${tag}.description`)}
                                    onClick={() => delTag(tag)}
                                  >
                                    {t(`categories.${tag}.tag`)}
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
                              )}
                          </>
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
        buttons={[{ label: "Close", action: closeImgModal }]}
        show={activeImgModal !== ""}
        title={
          activeImgModal
            ? `Board image for ${
                gameinfo.get(activeImgModal)?.name || activeImgModal
              }`
            : ""
        }
      >
        <div className="content">
          {activeImgModal && <Thumbnail meta={activeImgModal} />}
        </div>
      </Modal>
      {handleChallenge && (
        <NewChallengeModal
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
