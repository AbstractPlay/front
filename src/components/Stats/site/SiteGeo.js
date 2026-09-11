import React, { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import Flag from "../../Flag";
import DataTable, { STATS_TABLE_PROPS } from "../../shared/DataTable";
import { useStore } from "../../../stores";
import { compareStrings } from "../../../lib/compareStrings";

function SiteGeo({ nav }) {
  const summary = useStore((state) => state.summary);
  const { t, i18n } = useTranslation();

  const data = useMemo(() => {
    const allUsersByCode = new Map(
      (summary?.geoStats ?? []).map(({ code, name, n }) => [code, { name, n }])
    );
    const activeByCode = new Map(
      (summary.activeGeoStats ?? []).map(({ code, name, n }) => [
        code,
        { name, n },
      ])
    );
    const codes = new Set([...allUsersByCode.keys(), ...activeByCode.keys()]);
    return [...codes]
      .map((code) => ({
        id: code,
        code,
        name:
          allUsersByCode.get(code)?.name ??
          activeByCode.get(code)?.name ??
          code,
        n: allUsersByCode.get(code)?.n ?? 0,
        activeN: activeByCode.get(code)?.n ?? 0,
      }))
      .sort((a, b) => {
        const byN = b.n - a.n;
        if (byN !== 0) return byN;
        return compareStrings(a.name, b.name, i18n.language);
      });
  }, [summary, i18n.language]);

  const columnHelper = createColumnHelper();
  const columns = useMemo(() => {
    const countThenNameSortingFn = (rowA, rowB, columnId) => {
      const diff = rowA.getValue(columnId) - rowB.getValue(columnId);
      if (diff !== 0) return diff;
      return compareStrings(
        rowA.original.name,
        rowB.original.name,
        i18n.language
      );
    };

    return [
      columnHelper.accessor("name", {
        header: t("tables.country"),
      }),
      columnHelper.display({
        id: "flag",
        cell: (props) => <Flag code={props.row.original.id} size="m" />,
      }),
      columnHelper.accessor("n", {
        header: t("tables.allUsers"),
        sortingFn: countThenNameSortingFn,
      }),
      columnHelper.accessor("activeN", {
        header: t("tables.past30Days"),
        sortingFn: countThenNameSortingFn,
      }),
    ];
  }, [columnHelper, t, i18n.language]);

  return (
    <>
      <div className="content">
        <p>{t("stats.siteStats.countryIntro")}</p>
      </div>
      <DataTable
        {...STATS_TABLE_PROPS}
        nav={nav}
        data={data}
        columns={columns}
        sort={[{ id: "n", desc: true }]}
      />
    </>
  );
}

export default SiteGeo;
