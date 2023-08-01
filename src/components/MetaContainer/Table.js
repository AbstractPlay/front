import React, { useState, useEffect, useContext, useMemo, Fragment, useCallback } from "react";
import { Link } from "react-router-dom";
import { gameinfo } from "@abstractplay/gameslib";
import { useTranslation } from "react-i18next";
import { addResource } from "@abstractplay/gameslib";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { GameFactory } from "@abstractplay/gameslib";
import { MeContext } from "../../pages/Skeleton";
import { getCoreRowModel, useReactTable, flexRender, createColumnHelper, getSortedRowModel, getPaginationRowModel, getFilteredRowModel } from '@tanstack/react-table';
import gameImages from "../../assets/GameImages";
import Modal from "../Modal";
import NewChallengeModal from "../NewChallengeModal";
import ExpandableDiv from "../ExpandableDiv";
import { useStorageState } from 'react-use-storage-state'

const allSize = Number.MAX_SAFE_INTEGER;
// props:
//   - metaGame
//   - counts
//   - games
//   - toggleStar
//   - handleChallenge
function Table(props) {
  const [globalMe,] = useContext(MeContext);
  const [activeImgModal, activeImgModalSetter] = useState("");
  const [activeChallengeModal, activeChallengeModalSetter] = useState("");
  const [expandedPara, expandedParaSetter] = useState([]);
  const { t, i18n } = useTranslation();
  const [sorting, setSorting] = useState([{id: "gameName", desc: false}]);
  const [filterStars, filterStarsSetter] = useState(false);
  const [globalFilter, globalFilterSetter] = useState(props.metaGame);
  const [showState, showStateSetter] = useStorageState("allgames-show", 10);
  const toggleStar = props.toggleStar;
  const handleChallenge = props.handleChallenge;
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
  const togglePara = useCallback((name) => {
    if (expandedPara.includes(name)) {
        const newval = [...expandedPara].filter(n => n !== name);
        expandedParaSetter(newval);
    } else {
        expandedParaSetter([...expandedPara, name]);
    }
  }, [expandedPara, expandedParaSetter]);

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

  const data = useMemo( () => props.games.map((metaGame) => {
    const info = gameinfo.get(metaGame);
    let gameEngine;
    if (info.playercounts.length > 1) {
      gameEngine = GameFactory(metaGame, 2);
    } else {
      gameEngine = GameFactory(metaGame);
    }
    return {
        id: metaGame,
        gameName: info.name,
        image: encodeURIComponent(gameImages[metaGame]),
        links: info.urls,
        designers: ( (info.people !== undefined) && (info.people.length > 0) ) ? info.people.filter(p => p.type === "designer") : undefined,
        description: gameEngine.description(),
        starred: ( (globalMe !== null) && ("stars" in globalMe) && (globalMe.stars !== undefined) && (globalMe.stars !== null) && (globalMe.stars.includes(metaGame)) ) ? true : false,
        stars: ( (props.counts !== null) && (metaGame in props.counts) ) ? props.counts[metaGame].stars : 0,
        completed: ( (props.counts !== null) && (metaGame in props.counts) ) ? props.counts[metaGame].completedgames : 0,
        current: ( (props.counts !== null) && (metaGame in props.counts) ) ? props.counts[metaGame].currentgames : 0,
        ratings: ( (props.counts !== null) && (metaGame in props.counts) ) ? props.counts[metaGame].ratings : 0,
        challenges: ( (props.counts !== null) && (metaGame in props.counts) ) ? props.counts[metaGame].standingchallenges : 0,
    }
  }).filter(obj => (! filterStars) || obj.starred), [globalMe, props.games, props.counts, filterStars]);

    const columnHelper = createColumnHelper();
    const columns = useMemo( () => [
        columnHelper.display({
            id: "toggleStar",
            header: <input type="checkbox" onClick={() => filterStarsSetter(! filterStars)}></input>,
            cell: props =>
                <div className="control">
                    <div
                        className="starContainer"
                        onClick={() => toggleStar(props.row.original.id)}
                    >
                        {props.row.original.starred ?
                        <span className="icon glowingStar">
                            <i className="fa fa-star"></i>
                        </span>
                        :
                        <span className="icon">
                            <i className="fa fa-star-o"></i>
                        </span>
                        }
                    </div>
                </div>,
        }),
        columnHelper.accessor("gameName", {
            header: "Game",
            cell: props => <a href={props.row.original.links[0]} target="_blank" rel="noreferrer">{props.getValue()}</a>,
        }),
        columnHelper.accessor(row => (row.designers !== undefined) ? row.designers.map(d => d.name).join(" ") : "", {
            header: "Designers",
            id: "designers",
            cell: props => (props.row.original.designers === undefined) ? ""
                : props.row.original.designers.map(({name, urls}) =>
                ( (urls !== undefined) && (urls.length > 0) ) ?
                    <a href={urls[0]} target="_blank" rel="noreferrer">{name}</a>
                :
                    <span>{name}</span>
            ).reduce((prev, curr) => [prev, ', ', curr]),
        }),
        columnHelper.accessor("image", {
            header: "Image",
            cell: props =>
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
                    show={(activeImgModal !== "") && (activeImgModal === props.row.original.id)}
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
            </Fragment>                                                                         ,
            enableSorting: false,
        }),
        columnHelper.accessor("description", {
            header: "Description",
            cell: props =>
            <ExpandableDiv
                expanded={expandedPara.includes(props.row.original.id)}
                handleClick={() => togglePara(props.row.original.id)}
            >
                <ReactMarkdown rehypePlugins={[rehypeRaw]} className="content">
                    {props.getValue()}
                </ReactMarkdown>
            </ExpandableDiv>,
            enableSorting: false,
        }),
        columnHelper.accessor("stars", {
            header: "Stars"
        }),
        columnHelper.accessor("current", {
            header: "Current",
            cell: props => <Link to={`/listgames/current/${props.row.original.id}`}>{props.getValue()}</Link>
        }),
        columnHelper.accessor("completed", {
            header: "Completed",
            cell: props => <Link to={`/listgames/completed/${props.row.original.id}`}>{props.getValue()}</Link>
        }),
        columnHelper.accessor("challenges", {
            header: "Challenges",
            cell: props => <Link to={`/challenges/${props.row.original.id}`}>{props.getValue()}</Link>
        }),
        columnHelper.accessor("ratings", {
            header: "Ratings",
            cell: props => <Link to={`/ratings/${props.row.original.id}`}>{props.getValue()}</Link>
        }),
        columnHelper.display({
            id: "actions",
            cell: props =>
            <>
              <NewChallengeModal
                show={(activeChallengeModal !== "") && (activeChallengeModal === props.row.original.id)}
                handleClose={closeChallengeModal}
                handleChallenge={handleChallenge}
                fixedMetaGame={props.row.original.id}
              />
              <button className="button is-small apButton" onClick={() => openChallengeModal(props.row.original.id)}>Issue Challenge</button>
            </>
        }),
    ], [columnHelper, activeImgModal, toggleStar, filterStars, activeChallengeModal, handleChallenge, expandedPara, togglePara]);

    const table = useReactTable({
        data,
        columns,
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

  const tableNavigation =
  <>
        <div className="level smallerText">
            <div className="level-left">
                <div className="level-item">
                    <div className="field">
                        <div className="control">
                            <input className="input is-small" type="search" placeholder={t("Search")} onChange={e => globalFilterSetter(e.target.value)} value={globalFilter ?? ""} />
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
                    <p>Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of <strong>{table.getPageCount()}</strong> ({table.getPrePaginationRowModel().rows.length} total games)</p>
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
                                onChange={e => {
                                    showStateSetter(Number(e.target.value));
                                }}
                                >
                                {[10, 20, 30, 40, 50, allSize].map(pageSize => (
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

  return (
    <article>
      <div className="container has-text-centered" style={{paddingBottom: "1em"}}>
        <h1 className="title">{t("AvailableGames")}</h1>
      </div>
      <div className="container">
        {tableNavigation}
        <table className="table apTable">
            <thead>
                {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                    <th key={header.id} style={{position: "sticky", top: 0, background: "#fff", zIndex: 10}}>
                    {header.isPlaceholder
                        ? null
                        : (
                            <div
                              {...{
                                className: header.column.getCanSort()
                                  ? 'sortable'
                                  : '',
                                onClick: header.column.getToggleSortingHandler(),
                              }}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {{
                                asc: <Fragment>&nbsp;<i className="fa fa-angle-up"></i></Fragment>,
                                desc: <Fragment>&nbsp;<i className="fa fa-angle-down"></i></Fragment>,
                              }[header.column.getIsSorted()] ?? null}
                              {header.id !== "description" ? null :
                              <>{" "}<span style={{fontSize: "smaller", fontWeight: "normal", paddingTop: 0}}>({t("ClickExpand")})</span></>
                              }
                            </div>
                        )
                    }
                    </th>
                ))}
                </tr>
                ))}
            </thead>
            <tbody>
            {table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
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
    </article>
  );
}

export default Table;
