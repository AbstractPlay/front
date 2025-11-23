import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINT_OPEN } from "../config";
import { callAuthApi } from "../lib/api";
import { MeContext } from "../pages/Skeleton";
// import { gameinfo } from "@abstractplay/gameslib";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import Modal from "./Modal";
import TableDrafts from "./Events/TableDrafts";
import TableRegistration from "./Events/TableRegistration";
import TableActive from "./Events/TableActive";
import TableComplete from "./Events/TableComplete";

function Events() {
  const { t } = useTranslation();
  const [globalMe] = useContext(MeContext);
  const [allData, allDataSetter] = useState(null);
  const [drafts, draftsSetter] = useState([]);
  const [open, openSetter] = useState([]);
  const [active, activeSetter] = useState([]);
  const [complete, completeSetter] = useState([]);
  const [showModal, showModalSetter] = useState(false);
  const [newEventName, newEventNameSetter] = useState("");
  const [newEventDate, newEventDateSetter] = useState("");
  const [newEventTime, newEventTimeSetter] = useState("");
  const [refetch, refetchSetter] = useState(0);
  const navigate = useNavigate();

  // On mount, load event data
  useEffect(() => {
    async function fetchData() {
      let url = new URL(API_ENDPOINT_OPEN);
      url.searchParams.append("query", "get_events");
      const res = await fetch(url);
      const status = res.status;
      if (status !== 200) {
        const result = await res.json();
        console.log(result);
        allDataSetter(null);
      } else {
        const data = await res.json();
        console.log(data);
        allDataSetter(data);
      }
    }
    fetchData();
  }, [refetch]);

  // When data changes, partition events correctly
  useEffect(() => {
    if (allData !== null) {
      // create containers for players and games
      for (const event of allData.events) {
        event.players = [];
        event.games = [];
      }
      // put players in containers
      allData.players.sort((a, b) => a.sk.localeCompare(b.sk));
      let event = undefined;
      for (const player of allData.players) {
        const [eventid] = player.sk.split("#");
        if (event === undefined || eventid !== event.sk) {
          event = allData.events.find((x) => x.sk === eventid);
          if (event === undefined) {
            throw new Error(`Could not find event id ${eventid}`);
          }
        }
        event.players.push(player);
      }
      // put games in containers
      allData.games.sort((a, b) => a.sk.localeCompare(b.sk));
      event = undefined;
      for (const game of allData.games) {
        const [eventid] = game.sk.split("#");
        if (event === undefined || eventid !== event.sk) {
          event = allData.events.find((x) => x.sk === eventid);
          if (event === undefined) {
            throw new Error(`Could not find event id ${eventid}`);
          }
        }
        event.games.push(game);
      }
      // categorize events
      let d = [];
      const o = [];
      const a = [];
      const c = [];
      for (const event of allData.events) {
        const realEvent = { ...event };
        if (!event.visible) {
          d.push(realEvent);
        } else {
          const now = Date.now();
          if (event.dateEnd !== undefined && now >= event.dateEnd) {
            c.push(realEvent);
          } else if (now >= event.dateStart) {
            a.push(realEvent);
          } else {
            o.push(realEvent);
          }
        }
      }
      openSetter(o);
      activeSetter(a);
      completeSetter(c);
      // for drafts, only keep those that match your userid
      // or, if you're an admin, keep them all
      if (globalMe !== null) {
        d = d.filter((e) => e.organizer === globalMe.id || globalMe.admin);
      } else {
        d = [];
      }
      draftsSetter(d);
      console.log(
        `Drafts: ${d.length}, Open: ${o.length}, Active: ${a.length}, Complete: ${c.length}`
      );
    }
  }, [allData, globalMe]);

  const handleCreateEvent = async () => {
    let valid = true;
    if (globalMe === null || (!globalMe.admin && !globalMe.organizer)) {
      valid = false;
    }
    const reBlank = /^\s*$/;
    if (
      reBlank.test(newEventName) ||
      reBlank.test(newEventDate) ||
      reBlank.test(newEventTime)
    ) {
      valid = false;
    }
    const combined = `${newEventDate}T${newEventTime}Z`;
    const startSecs = new Date(combined).getTime();
    if (startSecs < Date.now()) {
      valid = false;
    }
    if (valid) {
      try {
        const res = await callAuthApi("event_create", {
          name: newEventName,
          date: startSecs,
          description: "",
        });
        if (!res) return;
        if (res.status !== 200) {
          console.log(
            `An error occurred creating the event: ${JSON.stringify(res)}`
          );
        } else {
          const result = await res.json();
          let body = undefined;
          if (result !== null && result !== undefined) {
            body = JSON.parse(result.body);
          }
          if (
            body !== undefined &&
            typeof body === "object" &&
            // eslint-disable-next-line no-prototype-builtins
            body.hasOwnProperty("eventid")
          ) {
            navigate(`/event/${body.eventid}`);
          } else {
            newEventNameSetter("");
            newEventDateSetter("");
            newEventTimeSetter("");
            console.log(
              `Post result was not interpretable: ${JSON.stringify(result)}`
            );
          }
        }
      } catch (error) {
        console.log(
          `An error occurred creating the event: ${JSON.stringify(error)}`
        );
      }
    } else {
      console.log(
        `Did not attempt to create the event with the following parameters: ${JSON.stringify(
          { newEventName, newEventDate, newEventTime }
        )}`
      );
    }
    showModalSetter(false);
  };

  const handleCloseModal = () => {
    newEventNameSetter("");
    newEventDateSetter("");
    newEventTimeSetter("");
    showModalSetter(false);
  };

  const handleRegister = (eventid) => {
    async function register() {
      try {
        const res = await callAuthApi("event_register", {
          eventid,
        });
        if (!res) return false;
        if (res.status !== 200) {
          console.log(
            `An error occurred updating the event: ${JSON.stringify(res)}`
          );
          return false;
        } else {
          return true;
        }
      } catch (error) {
        console.log(
          `An error occurred updating the event: ${JSON.stringify(error)}`
        );
        return false;
      }
    }
    if (globalMe !== null) {
      register().then((success) => {
        if (success) {
          refetchSetter((val) => val + 1);
        }
      });
    }
  };

  return (
    <>
      <Helmet>
        <meta property="og:title" content={`Organized Events`} />
        <meta
          property="og:url"
          content={`https://play.abstractplay.com/events`}
        />
        <meta
          property="og:description"
          content={`List of available and completed organized events`}
        />
      </Helmet>
      <article className="content">
        <h1 className="title has-text-centered">{t("Events.Name")}</h1>
        <p>{t("Events.Description")}</p>
        <hr />
        {/* New event */}
        <div className="card">
          <header className="card-header">
            <p className="card-header-title">New event</p>
            <button className="card-header-icon" aria-label="hide/show">
              <span className="icon">
                <i className="fa fa-angle-down" aria-hidden="true"></i>
              </span>
            </button>
          </header>
          <div className="card-content">
            <div className="content">
              {globalMe !== null && (globalMe.admin || globalMe.organizer) ? (
                <button
                  className="button is-small apButton"
                  onClick={() => showModalSetter(true)}
                >
                  Create event
                </button>
              ) : (
                <p>
                  To create an event, please reach out to one of the developers
                  through <a href="https://discord.abstractplay.com">Discord</a>
                  .
                </p>
              )}
            </div>
          </div>
        </div>
        {/* Drafts owned by you */}
        {drafts.length === 0 ? null : (
          <div className="card">
            <header className="card-header">
              <p className="card-header-title">Draft events</p>
              <button className="card-header-icon" aria-label="hide/show">
                <span className="icon">
                  <i className="fa fa-angle-down" aria-hidden="true"></i>
                </span>
              </button>
            </header>
            <div className="card-content">
              <TableDrafts events={drafts} />
            </div>
          </div>
        )}
        {/* Open for registration */}
        <div className="card">
          <header className="card-header">
            <p className="card-header-title">Open for registration</p>
            <button className="card-header-icon" aria-label="hide/show">
              <span className="icon">
                <i className="fa fa-angle-down" aria-hidden="true"></i>
              </span>
            </button>
          </header>
          <div className="card-content">
            {open.length > 0 ? (
              <TableRegistration
                events={open}
                handleRegister={handleRegister}
              />
            ) : (
              <div className="content">
                <p>No events are currently open for registration.</p>
              </div>
            )}
          </div>
        </div>
        {/* Active */}
        {active.length === 0 ? null : (
          <div className="card">
            <header className="card-header">
              <p className="card-header-title">Active events</p>
              <button className="card-header-icon" aria-label="hide/show">
                <span className="icon">
                  <i className="fa fa-angle-down" aria-hidden="true"></i>
                </span>
              </button>
            </header>
            <div className="card-content">
              <TableActive events={active} />
            </div>
          </div>
        )}
        {/* Completed */}
        {complete.length === 0 ? null : (
          <div className="card">
            <header className="card-header">
              <p className="card-header-title">Completed events</p>
              <button className="card-header-icon" aria-label="hide/show">
                <span className="icon">
                  <i className="fa fa-angle-down" aria-hidden="true"></i>
                </span>
              </button>
            </header>
            <div className="card-content">
              <TableComplete events={complete} />
            </div>
          </div>
        )}
      </article>
      <Modal
        show={showModal}
        title={"Create new event"}
        buttons={[
          {
            label: t("Submit"),
            action: handleCreateEvent,
          },
          {
            label: t("Cancel"),
            action: handleCloseModal,
          },
        ]}
      >
        <div className="content">
          <p>
            These values can be changed later. Dates and times must be given in
            UTC.
          </p>
        </div>
        <div className="field">
          <label className="label" htmlFor="eventName">
            Event name
          </label>
          <div className="control">
            <input
              className="input"
              type="text"
              name="eventName"
              value={newEventName}
              onChange={(e) => newEventNameSetter(e.target.value)}
            />
          </div>
          {/^\s*$/.test(newEventName) ? (
            <p className="help is-danger">The event must have a name.</p>
          ) : null}
        </div>
        <div className="field is-grouped">
          <label className="label" htmlFor="eventDate">
            Event date
          </label>
          <div className="control">
            <input
              className="input"
              type="date"
              name="eventDate"
              value={newEventDate}
              onChange={(e) => newEventDateSetter(e.target.value)}
            />
          </div>
          <label className="label" htmlFor="eventTime">
            Event date
          </label>
          <div className="control">
            <input
              className="input"
              type="time"
              name="eventTime"
              value={newEventTime}
              onChange={(e) => newEventTimeSetter(e.target.value)}
            />
          </div>
        </div>
        {newEventDate === "" ||
        newEventTime === "" ||
        new Date(`${newEventDate}T${newEventTime}Z`).getTime() < Date.now() ? (
          <p className="help is-danger">
            Date and time is required and must be in the future.
          </p>
        ) : null}
      </Modal>
    </>
  );
}

export default Events;
