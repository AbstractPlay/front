import React, { useContext, useEffect, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { SummaryContext } from "../Stats";
import { MeContext, UsersContext } from "../../pages/Skeleton";
import TableSkeleton from "./TableSkeleton";

function PlayerStats(props) {
    const [summary, ] = useContext(SummaryContext);
    const [globalMe, ] = useContext(MeContext);
    const [userNames, ] = useContext(UsersContext);
    const [joined, joinedSetter] = useState([]);

    useEffect(() => {
        const lst = [];
        for (const obj of summary.players.allPlays) {
            const eclectic = summary.players.eclectic.find(u => u.user === obj.user);
            const social = summary.players.social.find(u => u.user === obj.user);
            lst.push({user: obj.user, plays: obj.value, eclectic: eclectic.value, social: social.value});
            joinedSetter(lst);
        }
    }, [summary]);

    const data = useMemo( () => joined.map(({user: userid, plays, eclectic, social}) => {
        let name = "UNKNOWN"
        const user = userNames.find(u => u.id === userid);
        if (user !== undefined) {
            name = user.name;
        }
        return {
            id: userid,
            name,
            plays,
            eclectic,
            social,

        }
    }).sort((a, b) => b.plays - a.plays), [joined, userNames]);

    const columnHelper = createColumnHelper();
    const columns = useMemo( () => [
        columnHelper.accessor("name", {
            header: "Player",
            cell: props => ( (globalMe !== null) && (globalMe.id === props.row.original.id) ) ? <span className="bolder highlight">{props.getValue()}</span> : props.getValue(),
        }),
        columnHelper.accessor("plays", {
            header: "Total plays",
        }),
        columnHelper.accessor("eclectic", {
            header: "Different games",
        }),
        columnHelper.accessor("social", {
            header: "Different opponents",
        }),
    ], [columnHelper, globalMe]);

    return (
        <TableSkeleton data={data} columns={columns} sort={[{id: "plays", desc: true}]} />
    );
}

export default PlayerStats;
