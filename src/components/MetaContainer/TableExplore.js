import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  Fragment,
  useCallback,
} from "react";
import { Link } from "react-router-dom";
import { gameinfo } from "@abstractplay/gameslib";
import { useTranslation } from "react-i18next";
import { addResource } from "@abstractplay/gameslib";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { GameFactory } from "@abstractplay/gameslib";
import { MeContext } from "../../pages/Skeleton";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import Modal from "../Modal";
import NewChallengeModal from "../NewChallengeModal";
import ExpandableDiv from "../ExpandableDiv";
import { useStorageState } from "react-use-storage-state";
import Thumbnail from "../Thumbnail";

const allSize = Number.MAX_SAFE_INTEGER;
// props:
//   - metaGame
//   - counts
//   - games
//   - summary
//   - toggleStar
//   - handleChallenge
function TableExplore({ toggleStar, handleChallenge, updateSetter, ...props }) {
  const [globalMe] = useContext(MeContext);
  const [activeImgModal, activeImgModalSetter] = useState("");
  const [activeChallengeModal, activeChallengeModalSetter] = useState("");
  const [expandedPara, expandedParaSetter] = useState([]);
  const { t, i18n } = useTranslation();
  const [sorting, setSorting] = useState([{ id: "gameName", desc: false }]);
  const [filterStars, filterStarsSetter] = useStorageState(
    "allgames-filter-stars",
    false
  );
  const [tagFilter, tagFilterSetter] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [showState, showStateSetter] = useStorageState("allgames-show", 10);
  const [ddSelected, ddSelectedSetter] = useState("");
  const [gridView, gridViewSetter] = useStorageState("grid-view", false);
  addResource(i18n.language);

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  const openImgModal = (name) => {
    activeImgModalSetter(name);
  };
  const closeImgModal = () => {
    activeImgModalSetter("");
  };
  const openChallengeModal = (name) => {
    activeChallengeModalSetter(name);
  };
  const closeChallengeModal = () => {
    activeChallengeModalSetter("");
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

  const multiTagSelect = (row, id, filterVals) => {
    if (filterVals.length === 0) {
      return true;
    }
    const val = row.getValue(id);
    return filterVals.reduce(
      (prev, curr) => prev && val.find((o) => o.raw === curr) !== undefined,
      true
    );
  };

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
      const filters = [...columnFilters].filter((cf) => cf.id !== "designers");
      if (txt !== "") {
        filters.push({ id: "designers", value: txt });
      }
      setColumnFilters([...filters]);
    },
    [columnFilters]
  );

  /**
   * Table columns
   *    Name
   *    Image
   *    Designers (maybe just the first and then an expansion)
   *    Description (perhaps an expansion)
   *    Personal star status and toggle
   *    Current games
   *    Completed games
   *    Challenges
   *    Rated players
   *    Date added
   */

  const data = useMemo(
    () =>
      props.games
        .map((metaGame) => {
          const info = gameinfo.get(metaGame);
          let gameEngine;
          if (info.playercounts.length > 1) {
            gameEngine = GameFactory(metaGame, 2);
          } else {
            gameEngine = GameFactory(metaGame);
          }
          //   let recent = 0;
          //   if (props.summary !== null) {
          //     const rec = props.summary.recent.find((r) => r.game === info.name);
          //     if (rec !== undefined) {
          //       recent = rec.value;
          //     }
          //   }
          const tags = info.categories
            .map((cat) => {
              return {
                raw: cat,
                tag: t(`categories.${cat}.tag`),
                desc: t(`categories.${cat}.description`),
                full: t(`categories.${cat}.full`),
              };
            })
            .sort((a, b) => {
              // goals > mechanics > board > board:shape > board:connect > components
              let valA, valB;
              if (a.raw.startsWith("goal")) {
                valA = 1;
              } else if (a.raw.startsWith("mech")) {
                valA = 2;
              } else if (a.raw.startsWith("board")) {
                if (a.raw.startsWith("board>shape")) {
                  valA = 3.1;
                } else if (a.raw.startsWith("board>connect")) {
                  valA = 3.2;
                } else {
                  valA = 3;
                }
              } else {
                valA = 4;
              }
              if (b.raw.startsWith("goal")) {
                valB = 1;
              } else if (b.raw.startsWith("mech")) {
                valB = 2;
              } else if (b.raw.startsWith("board")) {
                if (b.raw.startsWith("board>shape")) {
                  valB = 3.1;
                } else if (b.raw.startsWith("board>connect")) {
                  valB = 3.2;
                } else {
                  valB = 3;
                }
              } else {
                valB = 4;
              }
              if (valA === valB) {
                return a.tag.localeCompare(b.tag);
              } else {
                return valA - valB;
              }
            });
          return {
            id: metaGame,
            gameName: info.name,
            image: undefined,
            links: info.urls,
            dateAdded: info.dateAdded,
            designers:
              info.people !== undefined && info.people.length > 0
                ? info.people.filter((p) => p.type === "designer")
                : [],
            description: gameEngine.description(),
            starred:
              globalMe !== null &&
              "stars" in globalMe &&
              globalMe.stars !== undefined &&
              globalMe.stars !== null &&
              Array.isArray(globalMe.stars) &&
              globalMe.stars.includes(metaGame)
                ? true
                : false,
            tags,
            // stars:
            //   props.counts !== null && metaGame in props.counts
            //     ? props.counts[metaGame].stars
            //     : 0,
            completed:
              props.counts !== null && metaGame in props.counts
                ? props.counts[metaGame].completedgames
                : 0,
            current:
              props.counts !== null && metaGame in props.counts
                ? props.counts[metaGame].currentgames
                : 0,
            ratings:
              props.counts !== null && metaGame in props.counts
                ? props.counts[metaGame].ratings
                : 0,
            challenges:
              props.counts !== null && metaGame in props.counts
                ? props.counts[metaGame].standingchallenges
                : 0,
            // recent,
          };
        })
        .filter((obj) => !filterStars || obj.starred),
    [globalMe, props.games, props.counts, filterStars, t]
  );

  const allTags = useMemo(() => {
    const tagSet = new Set();
    props.games.forEach((metaGame) => {
      const info = gameinfo.get(metaGame);
      info.categories.forEach((cat) => tagSet.add(cat));
    });
    return [...tagSet.values()]
      .map((cat) => {
        return {
          raw: cat,
          tag: t(`categories.${cat}.tag`),
          desc: t(`categories.${cat}.description`),
          full: t(`categories.${cat}.full`),
        };
      })
      .sort((a, b) => {
        // goals > mechanics > board > board:shape > board:connect > components
        let valA, valB;
        if (a.raw.startsWith("goal")) {
          valA = 1;
        } else if (a.raw.startsWith("mech")) {
          valA = 2;
        } else if (a.raw.startsWith("board")) {
          if (a.raw.startsWith("board>shape")) {
            valA = 3.1;
          } else if (a.raw.startsWith("board>connect")) {
            valA = 3.2;
          } else {
            valA = 3;
          }
        } else {
          valA = 4;
        }
        if (b.raw.startsWith("goal")) {
          valB = 1;
        } else if (b.raw.startsWith("mech")) {
          valB = 2;
        } else if (b.raw.startsWith("board")) {
          if (b.raw.startsWith("board>shape")) {
            valB = 3.1;
          } else if (b.raw.startsWith("board>connect")) {
            valB = 3.2;
          } else {
            valB = 3;
          }
        } else {
          valB = 4;
        }
        if (valA === valB) {
          return a.tag.localeCompare(b.tag);
        } else {
          return valA - valB;
        }
      });
  }, [props.games, t]);

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "toggleStar",
        header: (
          <input
            type="checkbox"
            defaultChecked={filterStars}
            onClick={() => filterStarsSetter(!filterStars)}
          ></input>
        ),
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
          <Fragment>
            <div
              id={"svg" + props.row.original.id}
              onClick={() => openImgModal(props.row.original.id)}
            >
              <Thumbnail meta={props.row.original.id} />
            </div>
            <Modal
              buttons={[{ label: "Close", action: closeImgModal }]}
              show={
                activeImgModal !== "" &&
                activeImgModal === props.row.original.id
              }
              title={`Board image for ${props.row.original.gameName}`}
            >
              <div className="content">
                <Thumbnail meta={props.row.original.id} />
              </div>
            </Modal>
          </Fragment>
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
        header: "Tags",
        cell: (props) =>
          props
            .getValue()
            .map((tag, ind) =>
              tag === "" ? null : (
                <span
                  key={`tag_${ind}`}
                  className="tag"
                  title={tag.desc}
                  onClick={() => addTag(tag.raw)}
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
        filterFn: multiTagSelect,
      }),
      //   columnHelper.accessor("dateAdded", {
      //     header: "Added",
      //     sortingFn: "datetime",
      //     invertSorting: true,
      //   }),
      //   columnHelper.accessor("stars", {
      //     header: "Stars",
      //   }),
      //   columnHelper.accessor("recent", {
      //     header: () => (
      //       <abbr title="Number of games completed in the last four weeks">
      //         Recent
      //       </abbr>
      //     ),
      //   }),
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
            <NewChallengeModal
              show={
                activeChallengeModal !== "" &&
                activeChallengeModal === props.row.original.id
              }
              handleClose={closeChallengeModal}
              handleChallenge={handleChallenge}
              fixedMetaGame={props.row.original.id}
            />
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
    [
      columnHelper,
      activeImgModal,
      toggleStar,
      filterStars,
      filterStarsSetter,
      activeChallengeModal,
      handleChallenge,
      expandedPara,
      togglePara,
      addTag,
    ]
  );

  const table = useReactTable({
    data,
    columns,
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

  return (
    <>
      <div className="container" style={{ paddingBottom: "1em" }}>
        <h1 className="subtitle">{t("AvailableGames")}</h1>
      </div>
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
                                &nbsp;<i className="fa fa-angle-down"></i>
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
                        {header.id !== "gameName" ? null : (
                          <div className="control">
                            <input
                              className="input is-small"
                              type="search"
                              onChange={(e) => updateNameFilter(e.target.value)}
                            />
                          </div>
                        )}
                        {header.id !== "designers" ? null : (
                          <div className="control">
                            <input
                              className="input is-small"
                              type="search"
                              onChange={(e) =>
                                updateDesignerFilter(e.target.value)
                              }
                            />
                          </div>
                        )}
                        {header.id !== "tags" ? null : (
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
                                  {allTags.map((t, i) => (
                                    <option value={t.raw} key={`tagdd_${i}`}>
                                      {t.full}
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
                        )}
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {tableNavigation}
      </div>
    </>
  );
}

export default TableExplore;
