import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable, { STATS_TABLE_PROPS } from "../shared/DataTable";
import { useStore } from "../../stores";
import { formatUserDisplayName } from "../Bots/botUtils";
import { useTranslation } from "react-i18next";
import { useEnsureSummaryTier } from "../../hooks/useEnsureSummaryTier";
import {
  formatGlickoSiteLowWithRd,
  glickoSiteRatingLow,
} from "../../lib/glickoDisplay";
import GlickoHint from "../shared/GlickoHint";
import GlickoDisplayNote from "../shared/GlickoDisplayNote";

function AvgRatings({ nav }) {
  useEnsureSummaryTier("ratings");
  const summary = useStore((state) => state.summary);
  const globalMe = useStore((state) => state.globalMe);
  const userNames = useStore((state) => state.users);
  const { t } = useTranslation();
  const [joined, joinedSetter] = useState([]);

  const glickoSiteByUser = useMemo(() => {
    const map = new Map();
    for (const row of summary?.ratings?.glickoSite ?? []) {
      map.set(row.user, row);
    }
    return map;
  }, [summary]);

  useEffect(() => {
    if (!summary?.ratings?.avg) {
      joinedSetter([]);
      return;
    }
    const lst = [];
    for (const obj of summary.ratings.avg) {
      const weighted = summary.ratings.weighted?.find(
        (u) => u.user === obj.user
      );
      lst.push({
        user: obj.user,
        avg: obj.rating,
        weighted: weighted?.rating,
        siteGlicko: glickoSiteByUser.get(obj.user) ?? null,
      });
      joinedSetter(lst);
    }
  }, [summary, glickoSiteByUser]);

  const data = useMemo(
    () =>
      joined
        .map(({ user: userid, avg, weighted, siteGlicko }) => {
          let name = "UNKNOWN";
          const user = userNames.find((u) => u.id === userid);
          if (user !== undefined) {
            name = user.name;
          }
          return {
            userid,
            name,
            avg,
            weighted,
            siteGlicko,
          };
        })
        .sort((a, b) => b.avg - a.avg),
    [joined, userNames]
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
      columnHelper.accessor("siteGlicko", {
        header: () => <GlickoHint />,
        cell: (props) => formatGlickoSiteLowWithRd(props.getValue()),
        sortingFn: (rowA, rowB, columnID) => {
          const lowA = glickoSiteRatingLow(rowA.getValue(columnID)) ?? -Infinity;
          const lowB = glickoSiteRatingLow(rowB.getValue(columnID)) ?? -Infinity;
          if (lowA === lowB) {
            const rdA = rowA.getValue(columnID)?.rd ?? 0;
            const rdB = rowB.getValue(columnID)?.rd ?? 0;
            return rdA - rdB;
          }
          return lowA - lowB;
        },
      }),
      columnHelper.accessor("weighted", {
        header: t("tables.weightedAverage"),
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
      sort={[{ id: "siteGlicko", desc: true }]}
      tableNote={<GlickoDisplayNote />}
    />
  );
}

export default AvgRatings;
