import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import LocalizedTimeAgo from "../LocalizedTimeAgo";
import { formatLadderPoints } from "../../lib/formatLadderPoints";

const columnHelper = createColumnHelper();

function formatPlayers(outcome, drawLabel) {
  if (!outcome.snapshotComplete) {
    return outcome.gameId?.slice(0, 8) ?? "—";
  }
  if (outcome.outcome === "draw") {
    const a = outcome.playerNames?.[0] ?? outcome.playerIds?.[0];
    const b = outcome.playerNames?.[1] ?? outcome.playerIds?.[1];
    return `${a} vs ${b} — ${drawLabel}`;
  }
  const winnerIndex =
    outcome.winnerSeat === 2 ? 1 : outcome.winnerSeat === 1 ? 0 : undefined;
  if (winnerIndex === undefined) {
    return outcome.gameId?.slice(0, 8) ?? "—";
  }
  const loserIndex = winnerIndex === 0 ? 1 : 0;
  const winner =
    outcome.playerNames?.[winnerIndex] ?? outcome.playerIds?.[winnerIndex];
  const loser =
    outcome.playerNames?.[loserIndex] ?? outcome.playerIds?.[loserIndex];
  return `${winner} def. ${loser}`;
}

function LadderOutcomeLog({ outcomes, metaGame, windowDays }) {
  const { t } = useTranslation();

  const data = useMemo(() => outcomes ?? [], [outcomes]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("settledAt", {
        header: t("Ladder.activity.settled"),
        cell: (props) => (
          <LocalizedTimeAgo date={props.getValue()} timeStyle="twitter-now" />
        ),
      }),
      columnHelper.display({
        id: "result",
        header: t("Ladder.activity.result"),
        cell: ({ row }) => {
          const o = row.original;
          if (!o.snapshotComplete) {
            return (
              <span className="help">
                {t("Ladder.activity.snapshotPending")}
              </span>
            );
          }
          const summary = formatPlayers(o, t("Draw"));
          const upset = o.upset ? ` (${t("Ladder.activity.upset")})` : "";
          return (
            <Link to={`/move/${metaGame}/0/${o.gameId}`}>
              {summary}
              {upset}
            </Link>
          );
        },
      }),
      columnHelper.display({
        id: "points",
        header: t("Ladder.points"),
        cell: ({ row }) => {
          const o = row.original;
          if (!o.snapshotComplete || o.outcome !== "win") {
            return "—";
          }
          const gain = o.winnerGain ?? 0;
          const loss = o.loserLoss ?? 0;
          return t("Ladder.activity.pointDelta", {
            gain: formatLadderPoints(gain),
            loss: formatLadderPoints(loss),
          });
        },
      }),
      columnHelper.display({
        id: "ranks",
        header: t("Ladder.rank"),
        cell: ({ row }) => {
          const o = row.original;
          if (!o.snapshotComplete || o.outcome !== "win") {
            return "—";
          }
          if (
            o.winnerRankBefore === undefined ||
            o.winnerRankAfter === undefined
          ) {
            return "—";
          }
          return t("Ladder.activity.rankShift", {
            before: o.winnerRankBefore,
            after: o.winnerRankAfter,
          });
        },
      }),
    ],
    [t, metaGame],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { sorting: [{ id: "settledAt", desc: true }] },
  });

  if (!data.length) {
    return (
      <p className="help">
        {t("Ladder.activity.noOutcomes", { days: windowDays ?? 30 })}
      </p>
    );
  }

  return (
    <div className="table-container ladder-hub-table-wrap">
      <table className="table apTable is-fullwidth">
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
          {table.getRowModel().rows.map((row) => (
            <tr key={row.original.gameId ?? row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LadderOutcomeLog;