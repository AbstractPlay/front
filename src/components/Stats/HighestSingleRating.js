import { useMemo } from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable, { STATS_TABLE_PROPS } from "../shared/DataTable";
import { useStore } from "../../stores";
import { formatUserDisplayName } from "../Bots/botUtils";
import { useTranslation } from "react-i18next";
import { useEnsureSummaryTier } from "../../hooks/useEnsureSummaryTier";
import {
  buildGlickoByGameMap,
  compareByGlickoLow,
  formatGlickoLowWithRd,
  glickoColumnSortingFn,
} from "../../lib/glickoDisplay";
import {
  formatSummaryGameKey,
  matchesSummaryGameKey,
} from "../../lib/summaryGameKeys";

function HighestSingleRating({ metaFilter, nav }) {
  useEnsureSummaryTier("site");
  useEnsureSummaryTier("ratings");
  const summary = useStore((state) => state.summary);
  const globalMe = useStore((state) => state.globalMe);
  const userNames = useStore((state) => state.users);
  const { t } = useTranslation();

  const glickoByGameMap = useMemo(
    () => buildGlickoByGameMap(summary?.ratings?.glickoByGame),
    [summary]
  );

  const data = useMemo(
    () =>
      !summary?.ratings?.highest
        ? []
        : summary.ratings.highest
            .map(({ user: userid, game, rating, wld, trueskill, glicko }) => {
              let name = "UNKNOWN";
              const user = userNames.find((u) => u.id === userid);
              if (user !== undefined) {
                name = user.name;
              }
              return {
                uuid: `${userid}|${game}`,
                userid,
                name,
                gameKey: game,
                game: formatSummaryGameKey(game, t),
                rating,
                wld,
                glicko:
                  glicko ?? glickoByGameMap.get(`${userid}|${game}`) ?? null,
                trueskill,
              };
            })
            .filter(
              (rec) =>
                metaFilter === undefined ||
                matchesSummaryGameKey(rec.gameKey, metaFilter)
            )
            .sort((a, b) => -compareByGlickoLow(a.glicko, b.glicko)),
    [summary, userNames, metaFilter, glickoByGameMap, t]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: t("tables.player"),
        cell: (props) => {
          const displayName = formatUserDisplayName(
            userNames.find((u) => u.id === props.row.original.userid) ?? {
              id: props.row.original.userid,
              name: props.getValue(),
            },
            userNames
          );
          return globalMe !== null &&
            globalMe.id === props.row.original.userid ? (
            <Link to={`/player/${props.row.original.userid}`}>
              <span className="bolder highlight">{displayName}</span>
            </Link>
          ) : (
            <Link to={`/player/${props.row.original.userid}`}>
              {displayName}
            </Link>
          );
        },
      }),
      columnHelper.accessor("game", {
        header: t("tables.game"),
      }),
      columnHelper.accessor("glicko", {
        header: t("tables.glicko"),
        cell: (props) => formatGlickoLowWithRd(props.getValue()),
        sortingFn: glickoColumnSortingFn,
      }),
      columnHelper.accessor("rating", {
        header: t("tables.elo"),
      }),
      columnHelper.accessor("trueskill", {
        header: t("tables.trueskill"),
        cell: (props) => Math.round(props.getValue().mu * 10) / 10,
        sortingFn: (rowA, rowB, columnID) => {
          return rowA.getValue(columnID).mu - rowB.getValue(columnID).mu;
        },
      }),
      columnHelper.accessor("wld", {
        header: t("tables.winLossDraw"),
        cell: (props) => {
          const sum = props.getValue().reduce((prev, curr) => prev + curr, 0);
          if (sum > 0) {
            const winrate =
              Math.trunc(
                ((props.getValue()[0] + props.getValue()[2] / 2) / sum) * 1000
              ) / 10;
            return `${winrate}% (${props.getValue()[0]}, ${
              props.getValue()[1]
            }, ${props.getValue()[2]})`;
          } else {
            return `---`;
          }
        },
        sortingFn: (rowA, rowB, columnID) => {
          const sumA = rowA
            .getValue(columnID)
            .reduce((prev, curr) => prev + curr, 0);
          const sumB = rowB
            .getValue(columnID)
            .reduce((prev, curr) => prev + curr, 0);
          const rateA =
            Math.trunc(
              ((rowA.getValue(columnID)[0] + rowA.getValue(columnID)[2] / 2) /
                sumA) *
                1000
            ) / 10;
          const rateB =
            Math.trunc(
              ((rowB.getValue(columnID)[0] + rowB.getValue(columnID)[2] / 2) /
                sumB) *
                1000
            ) / 10;
          // NaNs first
          if (isNaN(rateA) && isNaN(rateB)) {
            return 0;
          } else if (isNaN(rateA)) {
            return -1;
          } else if (isNaN(rateB)) {
            return 1;
          }
          return rateA < rateB ? -1 : rateA > rateB ? 1 : 0;
        },
      }),
    ],
    [columnHelper, globalMe, userNames, t]
  );

  return (
    <DataTable
      {...STATS_TABLE_PROPS}
      nav={nav}
      data={data}
      columns={columns}
      sort={[{ id: "glicko", desc: true }]}
    />
  );
}

export default HighestSingleRating;
