import React, { useContext, useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { SummaryContext } from "../Stats";
import { MeContext, UsersContext } from "../../pages/Skeleton";
import TableSkeleton from "./TableSkeleton";

function TopPlayers(props) {
    const [summary, ] = useContext(SummaryContext);
    const [globalMe, ] = useContext(MeContext);
    const [userNames, ] = useContext(UsersContext);

    const data = useMemo( () => summary.topPlayers.map(({user: userid, game, rating}) => {
        let name = "UNKNOWN"
        const user = userNames.find(u => u.id === userid);
        if (user !== undefined) {
            name = user.name;
        }
        return {
            id: game,
            userid,
            name,
            game,
            rating,

        }
    }).sort((a, b) => a.game.localeCompare(b.game)), [summary, userNames]);

    const columnHelper = createColumnHelper();
    const columns = useMemo( () => [
        columnHelper.accessor("game", {
            header: "Game",
        }),
        columnHelper.accessor("name", {
            header: "Player",
            cell: props => ( (globalMe !== null) && (globalMe.id === props.row.original.userid) ) ? <span className="bolder highlight">{props.getValue()}</span> : props.getValue(),
        }),
        columnHelper.accessor("rating", {
            header: "Rating",
        }),
    ], [columnHelper, globalMe]);

    return (
        <TableSkeleton data={data} columns={columns} sort={[{id: "game", desc: false}]} />
    );
}

export default TopPlayers;
