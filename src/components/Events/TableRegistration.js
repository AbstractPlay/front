import React, { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import { MeContext, UsersContext } from "../../pages/Skeleton";
import TableSkeleton from "./TableSkeleton";

function TableRegistration({ events, handleRegister }) {
  const [globalMe] = useContext(MeContext);
  const [allUsers] = useContext(UsersContext);

  console.log(events);

  const data = useMemo(
    () =>
      events
        .map(({ sk: id, name, dateStart, description, organizer, players }) => {
          console.log(players);
          const organizerName = allUsers.find((u) => u.id === organizer)?.name;
          const playerids = players.map((p) => p.playerid);
          const registrants = allUsers.filter((u) => playerids.includes(u.id));
          registrants.sort((a, b) => a.name.localeCompare(b.name));
          console.log(registrants);
          let canRegister = false;
          if (globalMe !== null && !playerids.includes(globalMe.id)) {
            canRegister = true;
          }
          return {
            id,
            name,
            dateStart,
            description,
            organizer,
            organizerName,
            registrants,
            canRegister,
          };
        })
        .sort((a, b) => a.dateStart - b.dateStart),
    [events, allUsers, globalMe]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (props) => (
          <Link to={`/event/${props.row.original.id}`}>{props.getValue()}</Link>
        ),
      }),
      columnHelper.accessor("dateStart", {
        header: "Start date",
        cell: (props) => new Date(props.getValue()).toLocaleString(),
      }),
      columnHelper.accessor("organizer", {
        header: "Organizer",
        cell: (props) => (
          <Link to={`/player/${props.getValue()}`}>
            {props.row.original.organizerName}
          </Link>
        ),
      }),
      columnHelper.accessor("registrants", {
        header: "Registrants",
        cell: (props) => (
          <>
            {!props.row.original.canRegister ? null : (
              <>
                <button
                  className="button is-small apButton"
                  onClick={() => handleRegister(props.row.original.id)}
                >
                  Register
                </button>
                <br />
              </>
            )}
            <span style={{ fontSize: "smaller" }}>
              {props
                .getValue()
                .map((u) => <Link to={`/player/${u.id}`}>{u.name}</Link>)
                .reduce(
                  (acc, x) =>
                    acc === null ? (
                      x
                    ) : (
                      <>
                        {acc}, {x}
                      </>
                    ),
                  null
                )}
            </span>
          </>
        ),
      }),
    ],
    [columnHelper, handleRegister]
  );

  return (
    <TableSkeleton
      data={data}
      columns={columns}
      sort={[{ id: "dateStart", desc: false }]}
    />
  );
}

export default TableRegistration;
