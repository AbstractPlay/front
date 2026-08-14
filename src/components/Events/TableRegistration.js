import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable, { EVENTS_TABLE_PROPS } from "../shared/DataTable";
import { useStore } from "../../stores";
import BotAwareName from "../Bots/BotAwareName";
import { useTranslation } from "react-i18next";

function TableRegistration({ events, handleRegister }) {
  const globalMe = useStore((state) => state.globalMe);
  const allUsers = useStore((state) => state.users);
  const { t } = useTranslation();

  console.log(events);

  const data = useMemo(
    () =>
      allUsers === null
        ? []
        : events
            .map(
              ({
                sk: id,
                name,
                dateStart,
                description,
                organizer,
                players,
              }) => {
                console.log(players);
                const organizerName = allUsers.find(
                  (u) => u.id === organizer
                )?.name;
                const playerids = players.map((p) => p.playerid);
                const registrants = allUsers.filter((u) =>
                  playerids.includes(u.id)
                );
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
              }
            )
            .sort((a, b) => a.dateStart - b.dateStart),
    [events, allUsers, globalMe]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: t("tables.name"),
        cell: (props) => (
          <Link to={`/event/${props.row.original.id}`}>{props.getValue()}</Link>
        ),
      }),
      columnHelper.accessor("dateStart", {
        header: t("tables.startDate"),
        cell: (props) => new Date(props.getValue()).toLocaleString(),
      }),
      columnHelper.accessor("organizer", {
        header: t("tables.organizer"),
        cell: (props) => (
          <BotAwareName
            id={props.getValue()}
            name={props.row.original.organizerName}
            users={allUsers}
            link
          />
        ),
      }),
      columnHelper.accessor("registrants", {
        header: t("tables.registrants"),
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
                .map((u) => (
                  <BotAwareName
                    key={u.id}
                    id={u.id}
                    name={u.name}
                    bot={u.bot}
                    users={allUsers}
                    link
                  />
                ))
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
    [columnHelper, handleRegister, allUsers, t]
  );

  return (
    <DataTable
      {...EVENTS_TABLE_PROPS}
      data={data}
      columns={columns}
      sort={[{ id: "dateStart", desc: false }]}
    />
  );
}

export default TableRegistration;
