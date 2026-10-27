import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useParams, useNavigate, Navigate, useLocation } from "react-router-dom";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { useStorageState } from "react-use-storage-state";
import { useTranslation } from "react-i18next";
import { callAuthApi } from "../../lib/api";
import { parseAuthResponse } from "../../lib/parseAuthResponse";
import { getGameDisplayName } from "../../lib/gameOptions";
import GamePickerTrigger from "../GamePickerTrigger";
import { ladderPlaySupported } from "../../lib/ladderGame";
import { ladderDetailPathActive } from "../../lib/ladderRoutes";
import PageHelmet from "../PageHelmet";
import { useStore } from "../../stores";
import { formatVariantsJoined } from "../../lib/expandVariants";
import {
  DEFAULT_LADDER_TAB,
  resolveLadderRouteContext,
  ladderListPathForTab,
  isValidLadderMetaGame,
} from "../../lib/ladderSections";
import PageLoading from "../shared/PageLoading";
import { TableNavSearch } from "../shared/DataTable";
import { trimmedGlobalIncludesStringFilterFn } from "../../lib/tableGlobalFilter";
import {
  useResetTablePageIndex,
  useSyncTablePageSize,
} from "../../hooks/useTanstackTableEffects";
import { fetchLaddersList } from "../../lib/fetchLadder";
import NewLadderModal from "./NewLadderModal";
import { RulesIntroExpandable } from "../shared/RulesIntroExpandable";
import { variantSelectionSortingFn } from "../../lib/variantTableSort";
import { formatLadderMemberCount } from "../../lib/ladderMemberCount";

function Ladders() {
  const { t, i18n } = useTranslation();
  const { tab: tabParam, metaGame: metaGameParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const globalMe = useStore((state) => state.globalMe);
  const [storedTab] = useStorageState("ladders-tab", DEFAULT_LADDER_TAB);
  const [ladders, laddersSetter] = useState(null);
  const [showNewLadderModal, showNewLadderModalSetter] = useState(false);
  const [registeredOnly, registeredOnlySetter] = useStorageState(
    "ladders-registered-only",
    false
  );
  const [starredOnly, starredOnlySetter] = useStorageState(
    "ladders-starred-only",
    false
  );
  const [globalFilter, setGlobalFilter] = useState("");
  const [showState] = useStorageState("ladders-show", 20);
  const [sorting, setSorting] = useState([{ id: "metaGame", desc: false }]);

  const route = resolveLadderRouteContext({
    pathname: location.pathname,
    tabParam,
    metaGameParam,
    storedTab,
  });
  const filterMeta = route.metaGame;
  const isEmbedded = route.embedded;

  useEffect(() => {
    if (route.redirectTo && !isEmbedded) {
      navigate(route.redirectTo, { replace: true });
    }
  }, [route.redirectTo, isEmbedded, navigate]);

  const showCreateButton =
    globalMe?.id &&
    (filterMeta === null || ladderPlaySupported(filterMeta));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await fetchLaddersList(
        filterMeta ? { metaGame: filterMeta } : {}
      );
      if (!cancelled) {
        laddersSetter(list);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filterMeta]);

  const ladderData = useMemo(() => {
    if (!ladders) {
      return [];
    }
    const stars = globalMe?.stars ?? [];
    const myId = globalMe?.id;
    return ladders
      .filter((l) => {
        if (starredOnly && !stars.includes(l.metaGame)) {
          return false;
        }
        if (registeredOnly && myId) {
          const members = l.activeMemberIds ?? [];
          return members.includes(myId);
        }
        return true;
      })
      .map((l) => ({
        ladderId: l.ladderId,
        realMeta: l.metaGame,
        metaGame: getGameDisplayName(l.metaGame, "Unknown"),
        variantUids: [...(l.variants ?? [])],
        variants: formatVariantsJoined(l.metaGame, l.variants),
        displayName: l.displayName,
        status: l.status,
        activeMemberCount: l.activeMemberCount ?? 0,
        minActiveMembers: l.minActiveMembers ?? 4,
      }));
  }, [ladders, starredOnly, registeredOnly, globalMe?.stars, globalMe?.id]);

  const variantSortingFn = useMemo(
    () =>
      variantSelectionSortingFn({
        getMeta: (row) => row.original.realMeta,
        getUids: (row) => row.original.variantUids ?? [],
        locale: i18n.language,
        compareMetaFirst: true,
      }),
    [i18n.language]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("metaGame", {
        header: t("tables.game"),
        cell: (props) => (
          <Link to={`/games/${props.row.original.realMeta}`}>
            {props.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("variants", {
        header: t("tables.variants"),
        sortingFn: variantSortingFn,
      }),
      columnHelper.accessor("displayName", {
        header: t("Ladder.name"),
        cell: (props) => (
          <Link to={ladderDetailPathActive(props.row.original.ladderId)}>
            {props.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("status", {
        header: t("tables.status"),
        cell: (props) => t(`Ladder.status.${props.getValue()}`, props.getValue()),
      }),
      columnHelper.accessor("activeMemberCount", {
        header: t("Ladder.members"),
        cell: (props) => {
          const row = props.row.original;
          return formatLadderMemberCount(t, {
            count: props.getValue() ?? 0,
            min: row.minActiveMembers,
            status: row.status,
          });
        },
      }),
    ],
    [columnHelper, t, variantSortingFn]
  );

  const table = useReactTable({
    data: ladderData,
    columns,
    state: { sorting, globalFilter },
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: trimmedGlobalIncludesStringFilterFn,
    onSortingChange: setSorting,
  });

  useResetTablePageIndex(table, globalFilter);
  useSyncTablePageSize(table, showState);

  const handleNewLadder = useCallback(
    async (pars) => {
      const res = await callAuthApi("new_ladder", pars);
      const parsed = await parseAuthResponse(res);
      if (!parsed.ok) {
        return false;
      }
      const ladderId = parsed.data?.ladderId;
      if (ladderId) {
        navigate(ladderDetailPathActive(ladderId));
      }
      const list = await fetchLaddersList(
        filterMeta ? { metaGame: filterMeta } : {}
      );
      laddersSetter(list);
      return true;
    },
    [navigate, filterMeta]
  );

  const goToList = (metaGame = filterMeta) => {
    if (isEmbedded) {
      return;
    }
    navigate(ladderListPathForTab(DEFAULT_LADDER_TAB, metaGame));
  };

  if (route.redirectTo && !isEmbedded) {
    return <Navigate to={route.redirectTo} replace />;
  }

  if (ladders === null) {
    return <PageLoading message={t("Ladder.loadingList")} />;
  }

  const pageTitle = t("Ladder.listTitle");

  return (
    <>
      <PageHelmet title={pageTitle} canonicalPath={ladderListPathForTab("all", filterMeta)} />
      <article id="laddersPage" className="content">
        {!isEmbedded ? (
          <h1 className="title has-text-centered">{pageTitle}</h1>
        ) : null}
        <RulesIntroExpandable
          summaryKey="Ladder.introSummary"
          fullKey="Ladder.introFull"
        />
        <div className="ladders-page-toolbar">
          <div className="ladders-page-toolbar-filters">
            {filterMeta === null ? (
              <div className="control">
                <GamePickerTrigger
                  value=""
                  onChange={(g) =>
                    goToList(isValidLadderMetaGame(g) ? g : null)
                  }
                  includeAllGamesOption
                />
              </div>
            ) : null}
            {globalMe?.id ? (
              <>
                <div className="control">
                  <label className="checkbox ladders-page-filter-checkbox">
                    <input
                      type="checkbox"
                      checked={starredOnly}
                      onChange={(e) => starredOnlySetter(e.target.checked)}
                    />
                    {t("Tournament.starredOnly")}
                  </label>
                </div>
                <div className="control">
                  <label className="checkbox ladders-page-filter-checkbox">
                    <input
                      type="checkbox"
                      checked={registeredOnly}
                      onChange={(e) => registeredOnlySetter(e.target.checked)}
                    />
                    {t("Ladder.participatingOnly")}
                  </label>
                </div>
              </>
            ) : null}
          </div>
          {showCreateButton ? (
            <div className="control">
              <button
                type="button"
                className="button is-small apButton"
                onClick={() => showNewLadderModalSetter(true)}
              >
                {t("Ladder.proposeNew")}
              </button>
            </div>
          ) : null}
        </div>
        <TableNavSearch value={globalFilter} onChange={setGlobalFilter} />
        <table className="table apTable">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>{t("Ladder.noneListed")}</td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </article>
      <NewLadderModal
        show={showNewLadderModal}
        handleClose={() => showNewLadderModalSetter(false)}
        handleNewLadder={handleNewLadder}
        fixedMetaGame={filterMeta ?? undefined}
      />
    </>
  );
}

export default Ladders;
