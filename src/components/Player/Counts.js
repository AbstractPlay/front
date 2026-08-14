import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import { AllRecsContext, ProfileContext, SummaryContext } from "../Player";
import { gameinfo } from "@abstractplay/gameslib";
import DataTable, { PROFILE_TABLE_PROPS } from "../shared/DataTable";
import { useTranslation } from "react-i18next";
import { getPlayerHIndex } from "../../lib/playerProfileSections";

function Counts() {
  const [user] = useContext(ProfileContext);
  const [summary] = useContext(SummaryContext);
  const [allRecs] = useContext(AllRecsContext);
  const [counts, countsSetter] = useState([]);
  const [hIndex, hIndexSetter] = useState(null);
  const [ptile, ptileSetter] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const rec = getPlayerHIndex(summary, user?.id);
    if (rec !== null) {
      hIndexSetter(rec.value);
      const countBelow = summary.players.h.filter(
        ({ value }) => value < rec.value
      ).length;
      ptileSetter(Math.round((countBelow / summary.players.h.length) * 100));
    } else {
      hIndexSetter(null);
      ptileSetter(null);
    }
  }, [summary, user]);

  useEffect(() => {
    if (allRecs !== null) {
      const countMap = new Map();
      for (const rec of allRecs) {
        const name = rec.header.game.name;
        if (countMap.has(name)) {
          const num = countMap.get(name);
          countMap.set(name, num + 1);
        } else {
          countMap.set(name, 1);
        }
      }
      const lst = [];
      for (const name of countMap.keys()) {
        const inforec = [...gameinfo.values()].find((r) =>
          name.startsWith(r.name)
        );
        const meta = inforec.uid;
        lst.push({ meta, name, count: countMap.get(name) });
      }
      countsSetter(lst);
    } else {
      countsSetter([]);
    }
  }, [allRecs]);

  const data = useMemo(
    () =>
      counts
        .map(({ meta, name, count }) => {
          return {
            id: meta,
            name,
            count,
          };
        })
        .sort((a, b) => b.count - a.count),
    [counts]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: t("tables.game"),
        cell: (props) => (
          <Link to={`/games/${props.row.original.id}`}>{props.getValue()}</Link>
        ),
      }),
      columnHelper.accessor("count", {
        header: t("tables.playCount"),
      }),
    ],
    [columnHelper, t]
  );

  if (data.length === 0 && hIndex === null) {
    return null;
  }

  return (
    <>
      {hIndex === null || ptile === null ? null : (
        <div className="content">
          <p>
            This player's h-index is {hIndex} (p{ptile})
          </p>
        </div>
      )}
      {data.length === 0 ? null : (
        <DataTable
          {...PROFILE_TABLE_PROPS}
          data={data}
          columns={columns}
          sort={[{ id: "count", desc: true }]}
          key="Player|Count"
        />
      )}
    </>
  );
}

export default Counts;
