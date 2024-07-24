import { useMemo } from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import { gameinfo } from "@abstractplay/gameslib";
import TableSkeleton from "../Events/TableSkeleton";

function PairingTable({ pairs, delPairing, swapPairing }) {
  const data = useMemo(
    () =>
      pairs.map(
        (
          { p1, p2, metagame, variants, clockStart, clockInc, clockMax, round },
          idx
        ) => {
          return {
            id: idx,
            round,
            metagame: gameinfo.get(metagame)?.name,
            variants,
            clock: [clockStart, clockInc, clockMax].join("/"),
            p1,
            p2,
          };
        }
      ),
    [pairs]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: "Index",
      }),
      columnHelper.accessor("round", {
        header: "Round",
      }),
      columnHelper.accessor("p1", {
        header: "Player 1",
        cell: (props) => (
          <Link to={`/player/${props.getValue().id}`}>
            {props.getValue().name}
          </Link>
        ),
      }),
      columnHelper.display({
        id: "swap",
        cell: (props) => (
          <>
            <button onClick={() => swapPairing(props.row.original.id)}>
              <span className="icon">
                <i className="fa fa-arrows-h"></i>
              </span>
            </button>
          </>
        ),
      }),
      columnHelper.accessor("p2", {
        header: "Player 2",
        cell: (props) => (
          <Link to={`/player/${props.getValue().id}`}>
            {props.getValue().name}
          </Link>
        ),
      }),
      columnHelper.accessor("metagame", {
        header: "Game",
      }),
      columnHelper.accessor("variants", {
        header: "Variants",
        cell: (props) => props.getValue().join(", "),
      }),
      columnHelper.accessor("clock", {
        header: "Clock",
      }),
      columnHelper.display({
        id: "actions",
        cell: (props) => (
          <>
            <button
              className="button is-small apButton"
              onClick={() => delPairing(props.row.original.id)}
            >
              Delete pairing
            </button>
          </>
        ),
      }),
    ],
    [columnHelper, delPairing, swapPairing]
  );

  return (
    <TableSkeleton
      data={data}
      columns={columns}
      sort={[{ id: "id", desc: false }]}
    />
  );
}

export default PairingTable;
