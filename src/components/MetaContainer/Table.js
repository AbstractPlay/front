import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  Fragment,
  useCallback,
  useRef,
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
import gameImages from "../../assets/GameImages";
import Modal from "../Modal";
import NewChallengeModal from "../NewChallengeModal";
import ExpandableDiv from "../ExpandableDiv";
import { useStorageState } from "react-use-storage-state";
import { Auth } from "aws-amplify";
import { API_ENDPOINT_AUTH } from "../../config";

const allSize = Number.MAX_SAFE_INTEGER;
// props:
//   - metaGame
//   - counts
//   - games
//   - summary
//   - toggleStar
//   - handleChallenge
function Table({toggleStar, handleChallenge, metaGame, updateSetter, ...props}) {
  const [globalMe, globalMeSetter] = useContext(MeContext);
  const [activeImgModal, activeImgModalSetter] = useState("");
  const [activeChallengeModal, activeChallengeModalSetter] = useState("");
  const [showTagModal, showTagModalSetter] = useState(false);
  const [expandedPara, expandedParaSetter] = useState([]);
  const [selectedGame, selectedGameSetter] = useState("");
  const [newTag, newTagSetter] = useState("");
  const [myTags, myTagsSetter] = useState([]);
  const { t, i18n } = useTranslation();
  const [sorting, setSorting] = useState([{ id: "gameName", desc: false }]);
  const [filterStars, filterStarsSetter] = useStorageState("allgames-filter-stars", false);
  const [globalFilter, globalFilterSetter] = useState(metaGame);
  const [showState, showStateSetter] = useStorageState("allgames-show", 10);
  const tagInput = useRef(null);
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

  useEffect(() => {
    if (globalMe !== undefined && globalMe !== null && globalMe.tags !== undefined) {
        myTagsSetter([...globalMe.tags]);
    } else {
        myTagsSetter([]);
    }
  }, [globalMe]);

  /**
   * Table columns
   *    Name
   *    Image
   *    Designers (maybe just the first and then an expansion)
   *    Description (perhaps an expansion)
   *    Stars
   *    Personal star status and toggle
   *    Current games
   *    Completed games
   *    Challenges
   *    Rated players
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
          let recent = 0;
          if (props.summary !== null) {
            const rec = props.summary.recent.find((r) => r.game === info.name);
            if (rec !== undefined) {
              recent = rec.value;
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
                : undefined,
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
            tags:
                props.counts !== null && metaGame in props.counts
                  ? props.counts[metaGame].tags.join("||")
                  : "",
            stars:
              props.counts !== null && metaGame in props.counts
                ? props.counts[metaGame].stars
                : 0,
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
            recent,
          };
        })
        .filter((obj) => !filterStars || obj.starred),
    [globalMe, props.games, props.summary, props.counts, filterStars]
  );

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
          <a
            href={props.row.original.links[0]}
            target="_blank"
            rel="noreferrer"
          >
            {props.getValue()}
          </a>
        ),
      }),
      columnHelper.accessor(
        (row) =>
          row.designers !== undefined
            ? row.designers.map((d) => d.name).join(" ")
            : "",
        {
          header: "Designers",
          id: "designers",
          cell: (props) =>
            props.row.original.designers === undefined
              ? ""
              : props.row.original.designers
                  .map(({ name, urls }) =>
                    urls !== undefined && urls.length > 0 ? (
                      <a href={urls[0]} target="_blank" rel="noreferrer">
                        {name}
                      </a>
                    ) : (
                      <span>{name}</span>
                    )
                  )
                  .reduce((prev, curr) => [prev, ", ", curr]),
        }
      ),
      columnHelper.accessor("image", {
        header: "Image",
        cell: (props) => (
          <Fragment>
            <div id={"svg" + props.row.original.id}>
              <img
                src={`data:image/svg+xml;utf8,${props.getValue()}`}
                alt={props.row.original.id}
                width="auto"
                height="auto"
                onClick={() => openImgModal(props.row.original.id)}
              />
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
                <img
                  src={`data:image/svg+xml;utf8,${props.getValue()}`}
                  alt={props.row.original.gameName}
                  width="100%"
                  height="auto"
                />
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
        cell: (props) => props.getValue().split("||").map(tag => tag === "" ? null : (
            <span className="tag">{tag}</span>
        )).reduce((acc, x) => acc === null ? x : <>{acc} {x}</>, null),
        enableSorting: false,
      }),
      columnHelper.accessor("stars", {
        header: "Stars",
      }),
      columnHelper.accessor("recent", {
        header: () => (
            <abbr title="Number of games completed in the last four weeks">Recent</abbr>
        ),
      }),
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
    ]
  );

  const addTag = () => {
    const idx = myTags.findIndex(t => t.meta === selectedGame);
    if (idx !== -1) {
        const unique = new Set();
        unique.add(newTag);
        for (const tag of myTags[idx].tags) {
            unique.add(tag);
        }
        myTags[idx] = {meta: selectedGame, tags: [...unique.values()].sort((a, b) => a.localeCompare(b))};
    } else {
        myTags.push({meta: selectedGame, tags: [newTag]})
    }
    newTagSetter("");
    tagInput.current.focus();
  }

  const deleteTag = (meta, tag) => {
    const copy = [...myTags];
    const idxMeta = copy.findIndex(e => e.meta === meta);
    if (idxMeta !== -1) {
        const tags = [...(copy[idxMeta].tags)];
        const idxTag = tags.findIndex(t => t === tag);
        if (idxTag !== -1) {
            tags.splice(idxTag, 1);
            if (tags.length > 0) {
                copy[idxMeta].tags = [...tags];
            } else {
                copy.splice(idxMeta, 1);
            }
            myTagsSetter([...copy]);
        }
    }
  }

  const saveTags = async () => {
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
                query: "save_tags",
                pars: {
                    payload: myTags,
                },
            }),
        });
        if (res.status !== 200) {
            const result = await res.json();
            console.log(
                `An error occured while saving tags:\n${result}`
            );
        } else {
            // update globalMe tags
            const newMe = JSON.parse(JSON.stringify(globalMe));
            newMe.tags = myTags;
            globalMeSetter(newMe);
            // triger meta game refresh
            updateSetter(v => v + 1);
        }
    } catch (error) {
        console.log(error);
    }
    showTagModalSetter(false);
  }

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
        toggleStar: globalMe !== null,
        actions: globalMe !== null,
      },
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: globalFilterSetter,
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  useEffect(() => {
    table.setPageSize(showState);
  }, [showState, table]);

  const tableNavigation = (
    <>
      <div className="level smallerText">
        <div className="level-left">
          <div className="level-item">
            <div className="field">
              <div className="control">
                <input
                  className="input is-small"
                  type="search"
                  placeholder={t("Search")}
                  onChange={(e) => globalFilterSetter(e.target.value)}
                  value={globalFilter ?? ""}
                />
              </div>
            </div>
          </div>
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
        </div>
      </div>
    </>
  );

  return (
    <article>
      <div
        className="container has-text-centered"
        style={{ paddingBottom: "1em" }}
      >
        <h1 className="title">{t("AvailableGames")}</h1>
      </div>
      <div className="container">
        {tableNavigation}
        <table className="table apTable">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="stickyHeader">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                  >
                    {header.isPlaceholder ? null : (
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
                        {(header.id === "tags" && globalMe !== null && globalMe !== undefined) ? (
                          <>
                            {" "}
                            <span
                              style={{
                                fontSize: "smaller",
                                fontWeight: "normal",
                                paddingTop: 0,
                                textDecoration: "underline",
                                cursor: "pointer",
                              }}
                              onClick={() => showTagModalSetter(true)}
                            >
                              (edit)
                            </span>
                          </>
                        ) : null}
                      </div>
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

      <Modal
          show={showTagModal}
          title={t("EditTags")}
          buttons={[
            { label: t("SaveChanges"), action: saveTags },
            {
              label: t("Close"),
              action: () => showTagModalSetter(false),
            },
          ]}
        >
          <div className="content">
            <p>Tags are publicly visible. Please familiarize yourself with our <Link to="/legal">terms of service</Link>. Don't forget to save your changes before closing this dialog.</p>
            <p>The best tags are short (preferably one word) and lowercase. Click on a tag to delete it.</p>
          </div>
          <div className="field is-grouped">
            <div className="control">
                <div className="select is-small">
                    <select id="gameSelect" value={selectedGame} onChange={(e) => selectedGameSetter(e.target.value)}>
                        <option value={""} key={`gameSelectBlank`}>--Choose a game--</option>
                    {props.games.map(meta => {
                        const info = gameinfo.get(meta);
                        return (<option value={meta} key={`gameSelect|${meta}`}>{info.name}</option>)
                    })}
                    </select>
                </div>
            </div>
            <div className="control">
                <input className="input is-small" type="text" placeholder="Type new tag here" value={newTag} onChange={(e) => newTagSetter(e.target.value)} ref={tagInput} />
            </div>
          </div>
          <div className="control">
            <button className="button is-small apButton" onClick={addTag} disabled={newTag === "" || selectedGame === ""}>Add tag</button>
          </div>
          {myTags.length === 0 ? null :
            <table className="table">
                <thead>
                    <tr>
                        <th>Game</th>
                        <th>Tags</th>
                    </tr>
                </thead>
                <tbody>
                    {myTags.sort((a,b) => a.meta.localeCompare(b.meta)).map(({meta, tags}) => {
                        const info = gameinfo.get(meta);
                        return (
                            <tr key={`MyTagRow|${meta}`}>
                                <td>{info.name}</td>
                                <td>
                                    {tags.map(tag => (
                                        <span className="tag" onClick={() => deleteTag(meta, tag)}>{tag}</span>
                                    )).reduce((acc, x) => acc === null ? x : <>{acc} {x}</>, null)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          }
      </Modal>

    </article>
  );
}

export default Table;
