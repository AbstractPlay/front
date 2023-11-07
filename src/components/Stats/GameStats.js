import React, { useContext, useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { SummaryContext } from "../Stats";
import TableSkeleton from "./TableSkeleton";

function GameStats(props) {
    const [summary, ] = useContext(SummaryContext);

    const data = useMemo( () => [...Object.keys(summary.metaStats)].map((game) => {
        const rec = summary.metaStats[game];
        return {
            id: game,
            game,
            n: rec.n,
            lenAvg: Math.trunc(rec.lenAvg * 100) / 100,
            lenMedian: Math.trunc(rec.lenMedian * 100) / 100,
            winsFirst: Math.trunc(rec.winsFirst * 10000) / 100,
        }
    }).sort((a, b) => a.game.localeCompare(b.game)), [summary]);

    const columnHelper = createColumnHelper();
    const columns = useMemo( () => [
        columnHelper.accessor("game", {
            header: "Game",
        }),
        columnHelper.accessor("n", {
            header: "Num records",
        }),
        columnHelper.accessor("lenAvg", {
            header: "Average length",
        }),
        columnHelper.accessor("lenMedian", {
            header: "Median length",
        }),
        columnHelper.accessor("winsFirst", {
            header: "First-player wins",
            cell: props => props.getValue() + "%",
        }),
    ], [columnHelper]);

    return (
        <>
            <div className="content">
                <p>Care should be taken with these statistics. The sample size is small and biased.</p>
            </div>
            <TableSkeleton data={data} columns={columns} sort={[{id: "game", desc: false}]} />
        </>
    );
}

export default GameStats;
