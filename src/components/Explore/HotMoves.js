import {
  useState,
  useEffect,
  Fragment,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { gameinfo, GameFactory } from "@abstractplay/gameslib";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { addResource } from "@abstractplay/gameslib";
import { MeContext } from "../../pages/Skeleton";
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

function HotMoves({ toggleStar, openImgModal }) {
  const allSize = Number.MAX_SAFE_INTEGER;
  const [globalMe] = useContext(MeContext);
  const [games, gamesSetter] = useState([]);
  const [mvTimes, mvTimesSetter] = useState(null);
  const [showState, showStateSetter] = useStorageState("1es-show", 10);
  const [expandedPara, expandedParaSetter] = useState([]);
  const [sorting, setSorting] = useState([{ id: "score1w", desc: true }]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [gridView, gridViewSetter] = useStorageState("grid-view", false);
  const { t, i18n } = useTranslation();
  addResource(i18n.language);

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

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

  const data = useMemo(
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
          score1w: found1w === undefined ? 0 : found1w.score,
          score1m: found1m === undefined ? 0 : found1m.score,
          score6m: found6m === undefined ? 0 : found6m.score,
          score1y: found1y === undefined ? 0 : found1y.score,
        };
      }),
    [t, mvTimes, games, globalMe]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
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
    [columnHelper, expandedPara, togglePara, toggleStar, openImgModal]
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
        <h1 className="subtitle">Hottest (# moves/day)</h1>
      </div>
      <ReactMarkdown rehypePlugins={[rehypeRaw]} className="content">
        The average number of moves made per day over the time period.
      </ReactMarkdown>
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

export default HotMoves;
