import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { gameinfo } from "@abstractplay/gameslib";
import TableSkeleton from "../Events/TableSkeleton";
import { useStore } from "../../stores";
import BotAwareName from "../Bots/BotAwareName";
import { useTranslation } from "react-i18next";

function PairingTable({ pairs, delPairing, swapPairing }) {
  const allUsers = useStore((state) => state.users);
  const { t } = useTranslation();
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
        header: t("tables.index"),
      }),
      columnHelper.accessor("round", {
        header: t("tables.round"),
      }),
      columnHelper.accessor("p1", {
        header: t("tables.player1"),
        cell: (props) => (
          <BotAwareName
            id={props.getValue().id}
            name={props.getValue().name}
            users={allUsers}
            link
          />
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
        header: t("tables.player2"),
        cell: (props) => (
          <BotAwareName
            id={props.getValue().id}
            name={props.getValue().name}
            users={allUsers}
            link
          />
        ),
      }),
      columnHelper.accessor("metagame", {
        header: t("tables.game"),
      }),
      columnHelper.accessor("variants", {
        header: t("tables.variants"),
        cell: (props) => props.getValue().join(", "),
      }),
      columnHelper.accessor("clock", {
        header: t("tables.clock"),
      }),
      columnHelper.display({
        id: "actions",
        cell: (props) => (
          <>
            <button
              className="button is-small apButton"
              onClick={() => delPairing(props.row.original.id)}
            >
              {t("Events.pairing.deletePairing")}
            </button>
          </>
        ),
      }),
    ],
    [columnHelper, delPairing, swapPairing, allUsers, t]
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
