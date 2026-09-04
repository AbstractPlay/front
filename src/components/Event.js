import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import LocalizedTimeAgo from "./LocalizedTimeAgo";
import { callAuthApi } from "../lib/api";
import { API_ENDPOINT_OPEN } from "../config";
import { cloneDeep } from "lodash";
// import { gameinfo } from "@abstractplay/gameslib";
import { useTranslation, Trans } from "react-i18next";
import PageHelmet from "./PageHelmet";
import Modal from "./Modal";
import Spinner from "./Spinner";
import NotFound from "./NotFound";
import Pair from "./Event/Pair";
import GamesTable from "./Event/GamesTable";
import ResultsTable from "./Event/ResultsTable";
import Division from "./Event/Division";
import { useStore } from "../stores";
import BotAwareName from "./Bots/BotAwareName";
import { formatUserDisplayName } from "./Bots/botUtils";

function Event() {
  const { eventid } = useParams();
  const { t } = useTranslation();
  const globalMe = useStore((state) => state.globalMe);
  const allUsers = useStore((state) => state.users);
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
  const [showModalInvites, showModalInvitesSetter] = useState(false);
  const [invited, invitedSetter] = useState([]);
  const [blocked, blockedSetter] = useState([]);
  const [selectedInvite, selectedInviteSetter] = useState("");
  const [selectedBlock, selectedBlockSetter] = useState("");
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

      // invited/blocked
      invitedSetter(eventData.event.invited || []);
      blockedSetter(eventData.event.blocked || []);
    }
  }, [eventData, globalMe, allUsers]);

  const handleChangeDate = () => {
    async function putNewDate(date) {
      try {
        const res = await callAuthApi("event_update_start", {
          eventid,
          newDate: date,
        });
        if (!res) {
          console.log(
            `An error occurred updating the event: authentication required`
          );
          return false;
        }
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
        const res = await callAuthApi("event_update_name", {
          eventid,
          name,
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
        const res = await callAuthApi("event_update_desc", {
          eventid,
          description: desc,
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
        const res = await callAuthApi("event_publish", {
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
        const res = await callAuthApi("event_delete", {
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
        const res = await callAuthApi("event_withdraw", {
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
        const res = await callAuthApi("event_close", {
          eventid,
          winner,
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

  const openInvitesModal = () => {
    invitedSetter(eventData?.event?.invited || []);
    blockedSetter(eventData?.event?.blocked || []);
    selectedInviteSetter("");
    selectedBlockSetter("");
    showModalInvitesSetter(true);
  };

  const closeInvitesModal = () => {
    invitedSetter(eventData?.event?.invited || []);
    blockedSetter(eventData?.event?.blocked || []);
    selectedInviteSetter("");
    selectedBlockSetter("");
    showModalInvitesSetter(false);
  };

  const handleUpdateInvites = async () => {
    try {
      const res = await callAuthApi("event_update_invites", {
        eventid,
        invited,
        blocked,
      });
      if (!res) return;
      if (res.status !== 200) {
        console.log(
          `An error occurred updating the event: ${JSON.stringify(res)}`
        );
      } else {
        const newRec = cloneDeep(eventData.event);
        newRec.invited = invited;
        newRec.blocked = blocked;
        const newData = cloneDeep(eventData);
        newData.event = newRec;
        eventDataSetter(newData);
        showModalInvitesSetter(false);
      }
    } catch (error) {
      console.log(
        `An error occurred updating the event: ${JSON.stringify(error)}`
      );
    }
  };

  const addInvite = () => {
    if (selectedInvite && !invited.includes(selectedInvite)) {
      invitedSetter([...invited, selectedInvite]);
      selectedInviteSetter("");
    }
  };

  const removeInvite = (id) => {
    invitedSetter(invited.filter((u) => u !== id));
  };

  const addBlock = () => {
    if (selectedBlock && !blocked.includes(selectedBlock)) {
      blockedSetter([...blocked, selectedBlock]);
      selectedBlockSetter("");
    }
  };

  const removeBlock = (id) => {
    blockedSetter(blocked.filter((u) => u !== id));
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
    const savedInvited = eventData.event.invited || [];
    const savedBlocked = eventData.event.blocked || [];
    return (
      <>
        <PageHelmet title={`Organized Event: ${eventData.event.name}`}>
          <meta
            property="og:url"
            content={`https://play.abstractplay.com/event/${eventid}`}
          />
          <meta
            property="og:description"
            content={eventData.event.description}
          />
        </PageHelmet>
        <article className="content">
          <h1 className="title lined">
            <span>{eventData.event.name}</span>
          </h1>
          <div className="content">
            <p>
              <b>{t("Events.admin.statusLabel")}</b>&nbsp;
              {eventStatus === "draft" ? (
                <>{t("Events.admin.statusDraft")}</>
              ) : eventStatus === "open" ? (
                <>{t("Events.admin.statusOpen")}</>
              ) : eventStatus === "active" ? (
                <>{t("Events.admin.statusActive")}</>
              ) : (
                <>{t("Events.admin.statusComplete")}</>
              )}
            </p>
            <p>
              <b>{t("Events.admin.maxPlayersLabel")}</b>&nbsp;
              {eventData.event.maxPlayers === 0 ||
              eventData.event.maxPlayers === undefined
                ? t("Unlimited")
                : eventData.event.maxPlayers}
            </p>
            <p>
              <b>{t("Events.admin.organizerLabel")}</b>&nbsp;
              <BotAwareName
                id={eventData.event.organizer}
                name={
                  allUsers?.find((u) => u.id === eventData.event.organizer)
                    ?.name || t("Unknown")
                }
                bot={
                  allUsers?.find((u) => u.id === eventData.event.organizer)?.bot
                }
                users={allUsers}
                link
              />
            </p>
            <p>
              <b>{t("Events.admin.startDateLabel")}</b>&nbsp;
              {new Date(eventData.event.dateStart).toLocaleString()}
              {eventData.event.dateStart <= Date.now() ? null : (
                <span>
                  &nbsp;(
                  <LocalizedTimeAgo future date={eventData.event.dateStart} />)
                </span>
              )}
            </p>
            {eventData.event.dateEnd === undefined ? null : (
              <p>
                <b>{t("Events.admin.endDateLabel")}</b>&nbsp;
                {new Date(eventData.event.dateEnd).toLocaleString()}
              </p>
            )}
            {winners.length === 0 ? null : (
              <p>
                <b>{t("Events.admin.winnerLabel")}</b>&nbsp;
                {winners
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
              </p>
            )}
            <p>
              <b>{t("Events.admin.descriptionLabel")}</b>
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
                <b>{t("Events.admin.registrantsLabel")}</b>&nbsp;
                {registrants
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
              </p>
            )}
            {!editor || savedInvited.length === 0 ? null : (
              <p>
                <b>{t("Events.admin.invitedLabel")}</b>&nbsp;
                {savedInvited
                  .map((id) => {
                    const u = allUsers?.find((u) => u.id === id);
                    return { id, name: u ? u.name : id };
                  })
                  .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
                  .map((u) => (
                    <BotAwareName
                      key={u.id}
                      id={u.id}
                      name={u.name}
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
              </p>
            )}
            {!editor || savedBlocked.length === 0 ? null : (
              <p>
                <b>{t("Events.admin.blockedLabel")}</b>&nbsp;
                {savedBlocked
                  .map((id) => {
                    const u = allUsers?.find((u) => u.id === id);
                    return { id, name: u ? u.name : id };
                  })
                  .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
                  .map((u) => (
                    <BotAwareName
                      key={u.id}
                      id={u.id}
                      name={u.name}
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
              </p>
            )}
            {/* Show list of games and results if present */}
            {eventData.games.length === 0 ? null : (
              <>
                <div className="content" style={{ marginTop: "1em" }}>
                  <h2 className="subtitle">{t("Events.admin.gamesTitle")}</h2>
                  <p>{t("Events.admin.gamesAsteriskNote")}</p>
                </div>
                <GamesTable
                  games={eventData.games}
                  setRefresh={setRefresh}
                  editor={editor}
                  eventid={eventid}
                />
                <div className="content" style={{ marginTop: "1em" }}>
                  <h2 className="subtitle">{t("Events.admin.resultsTitle")}</h2>
                  <p>
                    <Trans
                      i18nKey="Events.admin.resultsDisclaimer"
                      components={[<em key="em" />]}
                    />
                  </p>
                </div>
                <ResultsTable games={eventData.games} eventid={eventid} />
              </>
            )}
          </div>
          <hr />
          {/* Explain how things work if seen by editor */}
          {!editor ? null : (
            <div className="content" style={{ fontSize: "smaller" }}>
              <ul>
                <li>{t("Events.admin.editorHelp1")}</li>
                <li>{t("Events.admin.editorHelp2")}</li>
                <li>{t("Events.admin.editorHelp3")}</li>
                <li>{t("Events.admin.editorHelp4")}</li>
                <li>{t("Events.admin.editorHelp5")}</li>
                <li>{t("Events.admin.editorHelp6")}</li>
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
                    {t("Events.admin.publish")}
                  </button>
                ) : (
                  <button className="button is-small apButton" disabled>
                    {t("Events.admin.publish")}
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
                  {t("Events.admin.deleteEvent")}
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
                  {t("Events.admin.updateName")}
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
                  {t("Events.admin.changeStartDate")}
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
                  {t("Events.admin.updateDescription")}
                </button>
              </div>
            )}
            {!editor ? null : (
              <div className="column is-narrow">
                <button
                  className="button is-small apButton"
                  onClick={openInvitesModal}
                >
                  {t("Events.admin.inviteBlockPlayers")}
                </button>
              </div>
            )}
            {/* If open for registration, allow person to leave/join */}
            {eventStatus === "open" &&
            globalMe !== null &&
            globalMe !== undefined ? (
              <div className="column is-narrow">
                {registrants.find((r) => r.id === globalMe.id) === undefined ? (
                  (eventData.event.maxPlayers > 0 &&
                    registrants.length >= eventData.event.maxPlayers) ||
                  (savedInvited.length > 0 &&
                    !savedInvited.includes(globalMe.id)) ||
                  savedBlocked.includes(globalMe.id) ? null : (
                    <button
                      className="button is-small apButton"
                      onClick={handleRegister}
                    >
                      {t("Events.admin.register")}
                    </button>
                  )
                ) : (
                  <button
                    className="button is-small apButton"
                    onClick={handleWithdraw}
                  >
                    {t("Events.admin.withdraw")}
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
                  {t("Events.admin.closeEvent")}
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
                  {t("Events.admin.updateWinner")}
                </button>
              </div>
            )}
          </div>
          {/* Show pairing screen if event is active */}
          {!editor || eventStatus !== "active" ? null : (
            <>
              {/* Once games have been created, you can't change the division assignments */}
              {eventData.games.length > 0 ||
              !eventData.players.map((p) => p.division).includes(undefined) ||
              registrants < 12 ? null : (
                <Division event={eventData} setRefresh={setRefresh} />
              )}
              <Pair event={eventData} setRefresh={setRefresh} />
            </>
          )}
        </article>
        {/* Modal: Update start date */}
        <Modal
          show={showModalStart}
          title={t("Events.admin.changeStartDateTitle")}
          buttons={[
            {
              label: t("Events.admin.changeDate"),
              action: handleChangeDate,
            },
            {
              label: t("Cancel"),
              action: () => showModalStartSetter(false),
            },
          ]}
        >
          <p>{t("Events.admin.dateFutureUtc")}</p>
          <div className="field">
            <label className="label" htmlFor="dateStart">
              {t("Date")}
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
              {t("Time")}
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
              <p className="help is-danger">
                {t("Events.admin.dateMustBeFuture")}
              </p>
            ) : null}
          </div>
        </Modal>
        {/* Modal: Update name */}
        <Modal
          show={showModalName}
          title={t("Events.admin.changeNameTitle")}
          buttons={[
            {
              label: t("Events.admin.updateName"),
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
              {t("Events.eventNameLabel")}
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
              <p className="help is-danger">{t("Events.admin.nameNotEmpty")}</p>
            ) : null}
          </div>
        </Modal>
        {/* Modal: Update description */}
        <Modal
          show={showModalDesc}
          title={t("Events.admin.changeDescriptionTitle")}
          buttons={[
            {
              label: t("Events.admin.updateDescription"),
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
              {t("Events.admin.descriptionLabel")} (
              <a
                href="https://github.github.com/gfm/"
                target="_blank"
                rel="noreferrer"
              >
                {t("Events.admin.descriptionMarkdown")}
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
                {t("Events.admin.descriptionNotEmpty")}
              </p>
            ) : null}
          </div>
          <h1 className="subtitle lined">
            <span>{t("Preview")}</span>
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
          title={t("Events.admin.publishEventTitle")}
          buttons={[
            {
              label: t("Events.admin.publishEventTitle"),
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
              <Trans
                i18nKey="Events.admin.publishEventBody"
                components={[<strong key="strong" />]}
              />
            </p>
          </div>
        </Modal>
        {/* Modal: Confirm delete */}
        <Modal
          show={showModalDelete}
          title={t("Events.admin.deleteEvent")}
          buttons={[
            {
              label: t("Events.admin.deleteEvent"),
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
              <Trans
                i18nKey="Events.admin.deleteEventBody"
                components={[<strong key="strong" />]}
              />
            </p>
          </div>
        </Modal>
        {/* Modal: Close event */}
        <Modal
          show={showModalClose}
          title={t("Events.admin.closeEventTitle")}
          buttons={[
            {
              label:
                eventStatus === "complete"
                  ? t("Events.admin.updateWinners")
                  : t("Events.admin.closeEvent"),
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
              <p>{t("Events.admin.closeEventSelectWinners")}</p>
            ) : (
              <p>
                <Trans
                  i18nKey="Events.admin.closeEventBody"
                  components={[<strong key="strong" />]}
                />
              </p>
            )}
          </div>
          <div className="field">
            <label className="label">
              {t("Events.admin.selectWinnersLabel")}
            </label>
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
                      {formatUserDisplayName(u, allUsers)}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
        <Modal
          show={showModalInvites}
          title={t("Events.admin.inviteBlockTitle")}
          buttons={[
            {
              label: t("Save"),
              action: handleUpdateInvites,
            },
            {
              label: t("Cancel"),
              action: closeInvitesModal,
            },
          ]}
        >
          <div className="content">
            <h3 className="subtitle">{t("Events.admin.inviteSection")}</h3>
            <div className="field has-addons">
              <div className="control">
                <div className="select">
                  <select
                    value={selectedInvite}
                    onChange={(e) => selectedInviteSetter(e.target.value)}
                  >
                    <option value="">{t("Events.admin.selectPlayer")}</option>
                    {(allUsers || [])
                      .filter((u) => !u.bot)
                      .sort((a, b) =>
                        (a.name ?? "").localeCompare(b.name ?? "")
                      )
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {formatUserDisplayName(u, allUsers)}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="control">
                <button className="button apButton" onClick={addInvite}>
                  {t("Add")}
                </button>
              </div>
            </div>
            <ul>
              {invited.map((id) => {
                const user = (allUsers || []).find((u) => u.id === id);
                return (
                  <li key={id}>
                    {user ? formatUserDisplayName(user, allUsers) : id}{" "}
                    <button
                      className="delete is-small"
                      onClick={() => removeInvite(id)}
                    ></button>
                  </li>
                );
              })}
            </ul>
            <h3 className="subtitle">{t("Events.admin.blockSection")}</h3>
            <div className="field has-addons">
              <div className="control">
                <div className="select">
                  <select
                    value={selectedBlock}
                    onChange={(e) => selectedBlockSetter(e.target.value)}
                  >
                    <option value="">{t("Events.admin.selectPlayer")}</option>
                    {(allUsers || [])
                      .sort((a, b) =>
                        (a.name ?? "").localeCompare(b.name ?? "")
                      )
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {formatUserDisplayName(u, allUsers)}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="control">
                <button className="button apButton" onClick={addBlock}>
                  {t("Add")}
                </button>
              </div>
            </div>
            <ul>
              {blocked.map((id) => {
                const user = (allUsers || []).find((u) => u.id === id);
                return (
                  <li key={id}>
                    {user ? formatUserDisplayName(user, allUsers) : id}{" "}
                    <button
                      className="delete is-small"
                      onClick={() => removeBlock(id)}
                    ></button>
                  </li>
                );
              })}
            </ul>
          </div>
        </Modal>
      </>
    );
  } else {
    return (
      <div className="content">
        <p>{t("Events.admin.loadFailed", { eventid })}</p>
      </div>
    );
  }
}

export default Event;
