import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import ReactTimeAgo from "react-time-ago";
import { Auth } from "aws-amplify";
import { API_ENDPOINT_AUTH, API_ENDPOINT_OPEN } from "../config";
import { cloneDeep } from "lodash";
import { MeContext, UsersContext } from "../pages/Skeleton";
// import { gameinfo } from "@abstractplay/gameslib";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import Modal from "./Modal";
import Spinner from "./Spinner";
import NotFound from "./NotFound";
import Pair from "./Event/Pair";
import GamesTable from "./Event/GamesTable";

function Event() {
  const { eventid } = useParams();
  const { t } = useTranslation();
  const [globalMe] = useContext(MeContext);
  const [allUsers] = useContext(UsersContext);
  const [eventData, eventDataSetter] = useState(null);
  const [status, statusSetter] = useState("loading");
  const [editor, editorSetter] = useState(false);
  const [eventStatus, eventStatusSetter] = useState("draft");
  const [winners, winnersSetter] = useState([]);
  const [registrants, registrantsSetter] = useState([]);
  const [startDate, startDateSetter] = useState("");
  const [startTime, startTimeSetter] = useState("");
  const [canPublish, canPublishSetter] = useState(false);
  const [description, descriptionSetter] = useState("");
  const [eventName, eventNameSetter] = useState("");
  const [showModalStart, showModalStartSetter] = useState(false);
  const [showModalDesc, showModalDescSetter] = useState(false);
  const [showModalName, showModalNameSetter] = useState(false);
  const [showModalPublish, showModalPublishSetter] = useState(false);
  const [showModalDelete, showModalDeleteSetter] = useState(false);
  const [showModalClose, showModalCloseSetter] = useState(false);
  const [eventWinner, eventWinnerSetter] = useState({});
  const [refresh, setRefresh] = useState(0);
  const navigate = useNavigate();

  // On mount, load event data
  useEffect(() => {
    async function fetchData() {
      try {
        let url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append("query", "get_event");
        url.searchParams.append("eventid", eventid);
        const res = await fetch(url);
        const localStatus = res.status;
        statusSetter(localStatus);
        if (localStatus !== 200) {
          const result = await res.json();
          console.log(result);
          eventDataSetter(null);
        } else {
          const data = await res.json();
          console.log(data);
          eventDataSetter(data);
        }
      } catch (error) {
        console.log(error);
        eventDataSetter(null);
      }
    }
    fetchData();
  }, [eventid, refresh]);

  // set various data-dependent state variables
  useEffect(() => {
    // can the viewer edit the event?
    let canEdit = false;
    if (eventData !== null) {
      if (globalMe !== null) {
        if (globalMe.admin || eventData.event.organizer === globalMe.id) {
          canEdit = true;
        }
      }
    }
    editorSetter(canEdit);

    // event status
    if (eventData !== null && allUsers !== null) {
      let status = "draft";
      if (!eventData.event.visible) {
        status = "draft";
      } else {
        const now = Date.now();
        if (
          eventData.event.dateEnd !== undefined &&
          now >= eventData.event.dateEnd
        ) {
          status = "complete";
        } else if (now >= eventData.event.dateStart) {
          status = "active";
        } else {
          status = "open";
        }
      }
      eventStatusSetter(status);

      // winners
      if (
        eventData.event.winner !== undefined &&
        eventData.event.winner.length > 0
      ) {
        const winners = allUsers.filter((u) =>
          eventData.event.winner.includes(u.id)
        );
        winnersSetter(winners);
      } else {
        winnersSetter([]);
      }

      // registrants
      const playerids = eventData.players.map((p) => p.playerid);
      const regs = allUsers.filter((u) => playerids.includes(u.id));
      regs.sort((a, b) => a.name.localeCompare(b.name));
      registrantsSetter(regs);

      // canPublish
      const minLeadtime = 24 * 60 * 60 * 1000;
      const leadtime = eventData.event.dateStart - Date.now();
      if (
        status === "draft" &&
        leadtime >= minLeadtime &&
        !/^\s*$/.test(eventData.event.description) &&
        !/^\s*$/.test(eventData.event.name)
      ) {
        canPublishSetter(true);
      } else {
        canPublishSetter(false);
      }

      // start date components
      const date = new Date(eventData.event.dateStart).toISOString();
      const [datePart, timePart] = date
        .substring(0, date.length - 1)
        .split("T");
      startDateSetter(datePart);
      startTimeSetter(timePart);

      // name, for modification
      eventNameSetter(eventData.event.name);
      // description, for modification
      descriptionSetter(eventData.event.description);
    }
  }, [eventData, globalMe, allUsers]);

  const handleChangeDate = () => {
    async function putNewDate(date) {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
          },
          body: JSON.stringify({
            query: "event_update_start",
            pars: {
              eventid,
              newDate: date,
            },
          }),
        });
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
    const combined = `${startDate}T${startTime}Z`;
    const secs = new Date(combined).getTime();
    if (secs > Date.now()) {
      putNewDate(secs).then((success) => {
        if (success) {
          const newRec = cloneDeep(eventData.event);
          newRec.dateStart = secs;
          const newData = cloneDeep(eventData);
          newData.event = newRec;
          eventDataSetter(newData);
        }
        showModalStartSetter(false);
      });
    }
  };

  const handleChangeName = () => {
    async function putNewName(name) {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
          },
          body: JSON.stringify({
            query: "event_update_name",
            pars: {
              eventid,
              name,
            },
          }),
        });
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
    if (!/^\s*$/.test(eventName)) {
      putNewName(eventName).then((success) => {
        if (success) {
          const newRec = cloneDeep(eventData.event);
          newRec.name = eventName;
          const newData = cloneDeep(eventData);
          newData.event = newRec;
          eventDataSetter(newData);
        }
        showModalNameSetter(false);
      });
    }
  };

  const handleChangeDesc = () => {
    async function putNewDesc(desc) {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
          },
          body: JSON.stringify({
            query: "event_update_desc",
            pars: {
              eventid,
              description: desc,
            },
          }),
        });
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
    if (!/^\s*$/.test(description)) {
      putNewDesc(description).then((success) => {
        if (success) {
          const newRec = cloneDeep(eventData.event);
          newRec.description = description;
          const newData = cloneDeep(eventData);
          newData.event = newRec;
          eventDataSetter(newData);
        }
        showModalDescSetter(false);
      });
    }
  };

  const handlePublish = () => {
    async function publish() {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
          },
          body: JSON.stringify({
            query: "event_publish",
            pars: {
              eventid,
            },
          }),
        });
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
    if (canPublish) {
      publish().then((success) => {
        if (success) {
          const newRec = cloneDeep(eventData.event);
          newRec.visible = true;
          const newData = cloneDeep(eventData);
          newData.event = newRec;
          eventDataSetter(newData);
        }
        showModalPublishSetter(false);
      });
    }
  };

  const handleDelete = () => {
    async function delEvent() {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
          },
          body: JSON.stringify({
            query: "event_delete",
            pars: {
              eventid,
            },
          }),
        });
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
    if (eventStatus !== "complete" && eventData.games.length === 0) {
      delEvent().then((success) => {
        if (success) {
          eventDataSetter(null);
          navigate("/events");
        }
        showModalDeleteSetter(false);
      });
    }
  };

  const handleRegister = () => {
    async function register() {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
          },
          body: JSON.stringify({
            query: "event_register",
            pars: {
              eventid,
            },
          }),
        });
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
    if (
      globalMe !== null &&
      eventData.players.find((p) => p.playerid === globalMe.id) === undefined
    ) {
      register().then((success) => {
        if (success) {
          const newData = cloneDeep(eventData);
          const newRec = {
            pk: "ORGEVENTPLAYER",
            sk: `${eventid}#${globalMe.id}`,
            playerid: globalMe.id,
          };
          newData.players.push(newRec);
          eventDataSetter(newData);
        }
      });
    }
  };

  const handleWithdraw = () => {
    async function withdraw() {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
          },
          body: JSON.stringify({
            query: "event_withdraw",
            pars: {
              eventid,
            },
          }),
        });
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
    if (
      globalMe !== null &&
      eventData.players.find((p) => p.playerid === globalMe.id) !== undefined
    ) {
      withdraw().then((success) => {
        if (success) {
          const newData = cloneDeep(eventData);
          const idx = newData.players.findIndex(
            (p) => p.playerid === globalMe.id
          );
          newData.players.splice(idx, 1);
          eventDataSetter(newData);
        }
      });
    }
  };

  const handleClose = () => {
    async function close(winner) {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
          },
          body: JSON.stringify({
            query: "event_close",
            pars: {
              eventid,
              winner,
            },
          }),
        });
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
    const winners = Object.keys(eventWinner).filter((x) => eventWinner[x]);
    close(winners).then(() => {
      const data = cloneDeep(eventData);
      data.event.dateEnd = Date.now();
      data.event.winner = winners;
      eventDataSetter(data);
      setRefresh((val) => val + 1);
    });
    eventWinnerSetter({});
    showModalCloseSetter(false);
  };

  const toggleWinner = (e) => {
    const id = e.target.id;
    const winners = cloneDeep(eventWinner);
    if (id in winners) {
      winners[id] = !winners[id];
    } else {
      winners[id] = true;
    }
    console.log(winners);
    eventWinnerSetter(winners);
  };

  if (status === "loading") {
    return <Spinner />;
  } else if (
    status === 404 ||
    (eventData !== null && eventStatus === "draft" && !editor)
  ) {
    return <NotFound path={`/event/${eventid}`} />;
  } else if (eventData !== null) {
    return (
      <>
        <Helmet>
          <meta
            property="og:title"
            content={`Organized Event: ${eventData.event.name}`}
          />
          <meta
            property="og:url"
            content={`https://play.abstractplay.com/event/${eventid}`}
          />
          <meta
            property="og:description"
            content={eventData.event.description}
          />
        </Helmet>
        <article className="content">
          <h1 className="title lined">
            <span>{eventData.event.name}</span>
          </h1>
          <div className="content">
            <p>
              <b>Status:</b>&nbsp;
              {eventStatus === "draft" ? (
                <>Draft. Only the organizer and admins can see this event.</>
              ) : eventStatus === "open" ? (
                <>Registration is open.</>
              ) : eventStatus === "active" ? (
                <>The event is currently active. Registration is closed.</>
              ) : (
                <>This event has concluded.</>
              )}
            </p>
            <p>
              <b>Organizer:</b>&nbsp;
              <Link to={`/player/${eventData.event.organizer}`}>
                {allUsers?.find((u) => u.id === eventData.event.organizer)
                  ?.name || "UNKNOWN"}
              </Link>
            </p>
            <p>
              <b>Start date:</b>&nbsp;
              {new Date(eventData.event.dateStart).toLocaleString()}
              {eventData.event.dateStart <= Date.now() ? null : (
                <span>
                  &nbsp;(
                  <ReactTimeAgo future date={eventData.event.dateStart} />)
                </span>
              )}
            </p>
            {eventData.event.dateEnd === undefined ? null : (
              <p>
                <b>End date:</b>&nbsp;
                {new Date(eventData.event.dateEnd).toLocaleString()}
              </p>
            )}
            {winners.length === 0 ? null : (
              <p>
                <b>Winner:</b>&nbsp;
                {winners
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
              </p>
            )}
            <p>
              <b>Description:</b>
            </p>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              className="content"
            >
              {eventData.event.description}
            </ReactMarkdown>
            {registrants.length === 0 ? null : (
              <p>
                <b>Registrants:</b>&nbsp;
                {registrants
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
              </p>
            )}
            {/* Show games list of games are present */}
            {eventData.games.length === 0 ? null : (
              <GamesTable
                games={eventData.games}
                setRefresh={setRefresh}
                editor={editor}
                eventid={eventid}
              />
            )}
          </div>
          <hr />
          {/* Explain how things work if seen by editor */}
          {!editor ? null : (
            <div className="content" style={{ fontSize: "smaller" }}>
              <ul>
                <li>
                  Draft events can be published as long as it's at least 24
                  hours from the start date and the description is not empty.
                </li>
                <li>
                  Events can be fully deleted if they are draft, open for
                  registration, or active before any games have been created.
                </li>
                <li>
                  The start date can be changed up until games have been
                  created.
                </li>
                <li>The name and description can be updated at any time.</li>
                <li>
                  An active event with games created can be marked as completed
                  at any point, and winners assigned.
                </li>
                <li>Winners can be updated after the event is closed.</li>
              </ul>
            </div>
          )}
          {/* Button bar */}
          <div className="columns is-multiline">
            {/* If draft, allow publishing */}
            {eventStatus === "draft" ? (
              <div className="column is-narrow">
                {canPublish ? (
                  <button
                    className="button is-small apButton"
                    onClick={() => showModalPublishSetter(true)}
                  >
                    Publish
                  </button>
                ) : (
                  <button className="button is-small apButton" disabled>
                    Publish
                  </button>
                )}
              </div>
            ) : null}
            {/* If draft, open, or active with no games, allow deletion */}
            {editor &&
            (eventStatus === "draft" ||
              eventStatus === "open" ||
              (eventStatus === "active" && eventData.games.length === 0)) ? (
              <div className="column is-narrow">
                <button
                  className="button is-small apButton"
                  onClick={() => showModalDeleteSetter(true)}
                >
                  Delete event
                </button>
              </div>
            ) : null}
            {/* Allow updating the name anytime */}
            {!editor ? null : (
              <div className="column is-narrow">
                <button
                  className="button is-small apButton"
                  onClick={() => showModalNameSetter(true)}
                >
                  Update name
                </button>
              </div>
            )}
            {/* Allow changing the start date up until games are launched */}
            {!editor || eventData.games.length > 0 ? null : (
              <div className="column is-narrow">
                <button
                  className="button is-small apButton"
                  onClick={() => showModalStartSetter(true)}
                >
                  Change start date
                </button>
              </div>
            )}
            {/* Allow updating the description anytime */}
            {!editor ? null : (
              <div className="column is-narrow">
                <button
                  className="button is-small apButton"
                  onClick={() => showModalDescSetter(true)}
                >
                  Update description
                </button>
              </div>
            )}
            {/* If open for registration, allow person to leave/join */}
            {eventStatus === "open" &&
            globalMe !== null &&
            globalMe !== undefined ? (
              <div className="column is-narrow">
                {registrants.find((r) => r.id === globalMe.id) === undefined ? (
                  <button
                    className="button is-small apButton"
                    onClick={handleRegister}
                  >
                    Register
                  </button>
                ) : (
                  <button
                    className="button is-small apButton"
                    onClick={handleWithdraw}
                  >
                    Withdraw
                  </button>
                )}
              </div>
            ) : null}
            {/* Allow closing an active event with games and declare a winner */}
            {!editor ||
            eventStatus !== "active" ||
            eventData.games.length === 0 ? null : (
              <div className="column is-narrow">
                <button
                  className="button is-small apButton"
                  onClick={() => showModalCloseSetter(true)}
                >
                  Close event
                </button>
              </div>
            )}
            {/* Allow updating the winner of a closed event */}
            {!editor || eventStatus !== "complete" ? null : (
              <div className="column is-narrow">
                <button
                  className="button is-small apButton"
                  onClick={() => showModalCloseSetter(true)}
                >
                  Update winner
                </button>
              </div>
            )}
          </div>
          {/* Show pairing screen if event is active */}
          {!editor || eventStatus !== "active" ? null : (
            <Pair event={eventData} setRefresh={setRefresh} />
          )}
        </article>
        {/* Modal: Update start date */}
        <Modal
          show={showModalStart}
          title={"Change start date"}
          buttons={[
            {
              label: "Change date",
              action: handleChangeDate,
            },
            {
              label: t("Cancel"),
              action: () => showModalStartSetter(false),
            },
          ]}
        >
          <p>The date must be in the future and in UTC.</p>
          <div className="field">
            <label className="label" htmlFor="dateStart">
              Date
            </label>
            <div className="control">
              <input
                className="input"
                type="date"
                name="dateStart"
                value={startDate}
                onChange={(e) => startDateSetter(e.target.value)}
              />
            </div>
            <label className="label" htmlFor="timeStart">
              Time
            </label>
            <div className="control">
              <input
                className="input"
                type="time"
                name="timeStart"
                value={startTime}
                onChange={(e) => startTimeSetter(e.target.value)}
              />
            </div>
            {new Date(`${startDate}T${startTime}Z`).getTime() < Date.now() ? (
              <p className="help is-danger">The date must be in the future.</p>
            ) : null}
          </div>
        </Modal>
        {/* Modal: Update name */}
        <Modal
          show={showModalName}
          title={"Change name"}
          buttons={[
            {
              label: "Update name",
              action: handleChangeName,
            },
            {
              label: t("Cancel"),
              action: () => showModalNameSetter(false),
            },
          ]}
        >
          <div className="field">
            <label className="label" htmlFor="eventName">
              Event name
            </label>
            <div className="control">
              <input
                className="input"
                type="text"
                name="eventName"
                value={eventName}
                onChange={(e) => eventNameSetter(e.target.value)}
              />
            </div>
            {/^\s*$/.test(eventName) ? (
              <p className="help is-danger">The name may not be empty.</p>
            ) : null}
          </div>
        </Modal>
        {/* Modal: Update description */}
        <Modal
          show={showModalDesc}
          title={"Change description"}
          buttons={[
            {
              label: "Update description",
              action: handleChangeDesc,
            },
            {
              label: t("Cancel"),
              action: () => showModalDescSetter(false),
            },
          ]}
        >
          <div className="field">
            <label className="label" htmlFor="description">
              Description (
              <a
                href="https://github.github.com/gfm/"
                target="_blank"
                rel="noreferrer"
              >
                Markdown enabled
              </a>
              )
            </label>
            <div className="control">
              <textarea
                className="textarea"
                name="description"
                value={description}
                onChange={(e) => descriptionSetter(e.target.value)}
              ></textarea>
            </div>
            {/^\s*$/.test(description) ? (
              <p className="help is-danger">
                The description may not be empty.
              </p>
            ) : null}
          </div>
          <h1 className="subtitle lined">
            <span>Preview</span>
          </h1>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            className="content"
          >
            {description}
          </ReactMarkdown>
        </Modal>
        {/* Modal: Confirm publication */}
        <Modal
          show={showModalPublish}
          title={"Publish event"}
          buttons={[
            {
              label: "Publish event",
              action: handlePublish,
            },
            {
              label: t("Cancel"),
              action: () => showModalPublishSetter(false),
            },
          ]}
        >
          <div className="content">
            <p>
              You are about to open this event up for registration. It will be
              immediately visible to all players. <b>This cannot be undone!</b>
            </p>
          </div>
        </Modal>
        {/* Modal: Confirm delete */}
        <Modal
          show={showModalDelete}
          title={"Delete event"}
          buttons={[
            {
              label: "Delete event",
              action: handleDelete,
            },
            {
              label: t("Cancel"),
              action: () => showModalDeleteSetter(false),
            },
          ]}
        >
          <div className="content">
            <p>
              You are about to delete this event entirely.{" "}
              <b>This cannot be undone!</b> This is only possible up until games
              have been created for this event.
            </p>
          </div>
        </Modal>
        {/* Modal: Close event */}
        <Modal
          show={showModalClose}
          title={"Close event"}
          buttons={[
            {
              label:
                eventStatus === "complete" ? "Update winners" : "Close event",
              action: handleClose,
            },
            {
              label: t("Cancel"),
              action: () => {
                eventWinnerSetter({});
                showModalCloseSetter(false);
              },
            },
          ]}
        >
          <div className="content">
            {eventStatus === "complete" ? (
              <p>Select the winner (or winners) and click "Update winners."</p>
            ) : (
              <p>
                You are about to mark this event as complete.{" "}
                <b>This cannot be undone!</b> Please select the winner (or
                winners) and click "Close Event." The winner can be updated at
                any time after the event is over.
              </p>
            )}
          </div>
          <div className="field">
            <label className="label">Select one or more event winners:</label>
            <div className="columns is-multiline">
              {registrants.map((u, i) => (
                <div className="column" key={`reg:${i}`}>
                  <div className="control">
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        id={u.id}
                        checked={u.id in eventWinner && eventWinner[u.id]}
                        onChange={toggleWinner}
                      />
                      {u.name}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      </>
    );
  } else {
    return (
      <div className="content">
        <p>Could not load event {eventid}.</p>
      </div>
    );
  }
}

export default Event;
