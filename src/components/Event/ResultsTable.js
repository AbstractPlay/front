import { useMemo } from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import TableSkeleton from "../Events/TableSkeleton";
import { useStore } from "../../stores";
import BotAwareName from "../Bots/BotAwareName";

function ResultsTable({ games, eventid }) {
  const allUsers = useStore((state) => state.users);

  const data = useMemo(() => {
    if (allUsers === null) {
      return [];
    }
    const results = new Map();
    games.forEach(({ winner }) => {
      if (winner !== null && winner !== undefined) {
        let toAdd = 1;
        if (winner.length === 2) {
          toAdd = 0.5;
        }
        for (const w of winner) {
          if (results.has(w)) {
            const curr = results.get(w);
            results.set(w, curr + toAdd);
          } else {
            results.set(w, toAdd);
          }
        }
      }
    });
    return [...results.keys()]
      .map((uid) => {
        const p = allUsers.find((x) => x.id === uid);
        return { player: p, total: results.get(uid) };
      })
      .sort((a, b) => b.total - a.total);
  }, [games, allUsers]);

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("player", {
        header: "Player",
        cell: (props) =>
          props.getValue() === undefined ? (
            "UNKNOWN"
          ) : (
            <BotAwareName
              id={props.getValue().id}
              name={props.getValue().name}
              bot={props.getValue().bot}
              users={allUsers}
              link
            />
          ),
      }),
      columnHelper.accessor("total", {
        header: "Total",
      }),
    ],
    [columnHelper, allUsers]
  );

  return (
    <>
      <TableSkeleton
        data={data}
        columns={columns}
        sort={[{ id: "total", desc: true }]}
      />
    </>
  );
}

export default ResultsTable;
