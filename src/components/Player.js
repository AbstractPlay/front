import React, { useEffect, useState, createContext } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStorageState } from "react-use-storage-state";
import { callAuthApi } from "../lib/api";
import { gameinfo } from "@abstractplay/gameslib";
import { Helmet } from "react-helmet-async";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Spinner from "./Spinner";
import Flag from "./Flag";
import ActivityMarker from "./ActivityMarker";
import Stars from "./Player/Stars";
import Ratings from "./Player/Ratings";
import Counts from "./Player/Counts";
import Opponents from "./Player/Opponents";
import Timeouts from "./Player/Timeouts";
import Activity from "./Player/Activity";
import History from "./Player/History";
import Response from "./Player/Response";
import Coded from "./Player/Coded";
import Designed from "./Player/Designed";
import Tournaments from "./Player/Tournaments";
import { useStore } from "../stores";
import { formatUserDisplayName } from "./Bots/botUtils";

export const ProfileContext = createContext([null, () => {}]);
export const SummaryContext = createContext([null, () => {}]);
export const AllRecsContext = createContext([null, () => []]);
export const ResponsesContext = createContext([null, () => []]);
export const TournamentContext = createContext([null, () => []]);

const code2ele = new Map([
  ["stars", { component: Stars, nameKey: "player.modules.stars" }],
  ["coded", { component: Coded, nameKey: "player.modules.coded" }],
  ["designed", { component: Designed, nameKey: "player.modules.designed" }],
  ["ratings", { component: Ratings, nameKey: "player.modules.ratings" }],
  ["counts", { component: Counts, nameKey: "player.modules.counts" }],
  ["opps", { component: Opponents, nameKey: "player.modules.opponents" }],
  ["activity", { component: Activity, nameKey: "player.modules.activity" }],
  ["timeouts", { component: Timeouts, nameKey: "player.modules.timeouts" }],
  ["response", { component: Response, nameKey: "player.modules.response" }],
  ["tournaments", { component: Tournaments, nameKey: "player.modules.tournaments" }],
  ["history", { component: History, nameKey: "player.modules.history" }],
]);

function Player() {
  const { userid } = useParams();
  const globalMe = useStore((state) => state.globalMe);
  const allUsers = useStore((state) => state.users);
  const [user, userSetter] = useState(null);
  const [summary, summarySetter] = useState(null);
  const [allRecs, allRecsSetter] = useState([]);
  const [tourneys, tourneysSetter] = useState([]);
  const [responses, responsesSetter] = useState([]);
  const [isCoder, setIsCoder] = useState(false);
  const [isDesigner, setIsDesigner] = useState(false);
  const [order, orderSetter] = useStorageState("player-profile-order", [
    "stars",
    "coded",
    "designed",
    "ratings",
    "counts",
    "opps",
    "activity",
    "timeouts",
    "response",
    "tournaments",
    "history",
  ]);

  // eslint-disable-next-line no-unused-vars
  const { t } = useTranslation();

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL("https://records.abstractplay.com/_summary.json");
        const res = await fetch(url);
        const result = await res.json();
        summarySetter(result);
      } catch (error) {
        summarySetter(null);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (user !== null) {
      const coded = [...gameinfo.values()].filter(
        (e) =>
          e.people !== undefined &&
          e.people.filter((p) => p.type === "coder" && p.apid === user.id)
            .length > 0
      );
      setIsCoder(coded.length > 0);
      const designed = [...gameinfo.values()].filter(
        (e) =>
          e.people !== undefined &&
          e.people.filter((p) => p.type === "designer" && p.apid === user.id)
            .length > 0
      );
      setIsDesigner(designed.length > 0);
    }
  }, [user]);

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL(
          `https://records.abstractplay.com/player/${user.id}.json`
        );
        const res = await fetch(url);
        const result = await res.json();
        allRecsSetter(result);
      } catch (error) {
        allRecsSetter([]);
      }
    }
    fetchData();
  }, [user]);

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL(
          `https://records.abstractplay.com/player/tournaments/${user.id}.json`
        );
        const res = await fetch(url);
        const result = await res.json();
        tourneysSetter(result);
      } catch (error) {
        tourneysSetter([]);
      }
    }
    fetchData();
  }, [user]);

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL(
          `https://records.abstractplay.com/ttm/${user.id}.json`
        );
        const res = await fetch(url);
        const result = await res.json();
        responsesSetter(result);
      } catch (error) {
        responsesSetter([]);
      }
    }
    fetchData();
  }, [user]);

  useEffect(() => {
    if (allUsers !== null) {
      const rec = allUsers.find((u) => u.id === userid);
      if (rec !== undefined && rec !== null) {
        console.log(rec);
        userSetter(rec);
      } else {
        userSetter(null);
      }
    } else {
      userSetter(null);
    }
  }, [userid, allUsers, userSetter]);

  const handleNewChallenge = async (challenge) => {
    try {
      await callAuthApi("new_challenge", {
        ...challenge,
        challenger: { id: globalMe.id, name: globalMe.name },
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleMoveLeft = (code) => {
    const idx = order.findIndex((c) => c === code);
    let newlst;
    if (idx !== -1) {
      // if first element, move to end
      if (idx === 0) {
        newlst = [...order.slice(1), order[0]];
      }
      // otherwise, swap with adjacent
      else {
        newlst = [
          ...order.slice(0, idx - 1),
          order[idx],
          order[idx - 1],
          ...order.slice(idx + 1),
        ];
      }
      if (newlst !== undefined) {
        orderSetter(newlst);
      }
    }
  };

  const handleMoveRight = (code) => {
    const idx = order.findIndex((c) => c === code);
    let newlst;
    if (idx !== -1) {
      // if last element, move to start
      if (idx === order.length - 1) {
        newlst = [order[order.length - 1], ...order.slice(0, -1)];
      }
      // otherwise, swap with adjacent
      else {
        newlst = [
          ...order.slice(0, idx),
          order[idx + 1],
          order[idx],
          ...order.slice(idx + 2),
        ];
      }
      if (newlst !== undefined) {
        orderSetter(newlst);
      }
    }
  };

  if (user !== null) {
    return (
      <>
        <Helmet>
          <meta property="og:title" content={`${user.name}: Player Profile`} />
          <meta
            property="og:url"
            content={`https://play.abstractplay.com/player/${user.id}`}
          />
          <meta
            property="og:description"
            content={`Player profile for ${user.name}`}
          />
        </Helmet>
        <article id="playerProfile">
          <h1 className="title has-text-centered">
            {t("ProfileFor", {
              player: formatUserDisplayName(user, allUsers),
            })}
          </h1>
          <div className="subtitle has-text-centered">
            {user.country === undefined ? null : (
              <>
                <Flag code={user.country} size="l" />
                &emsp;
              </>
            )}
            <ActivityMarker lastSeen={user.lastSeen} />
            {user.bggid === undefined || /^\s*$/.test(user.bggid) ? null : (
              <span style={{ fontSize: "smaller", marginLeft: "1em" }}>
                <a
                  href={`https://boardgamegeek.com/user/${user.bggid}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  BGG profile
                </a>
              </span>
            )}
          </div>
          {user.about === undefined || /^\s*$/.test(user.about) ? null : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              className="content has-text-centered"
            >
              {user.about}
            </ReactMarkdown>
          )}
          <div
            className="content has-text-centered"
            style={{ fontSize: "smaller" }}
          >
            <p>{t("player.underDevelopment")}</p>
          </div>
          <ProfileContext.Provider value={[user, userSetter]}>
            <SummaryContext.Provider value={[summary, summarySetter]}>
              <AllRecsContext.Provider value={[allRecs, allRecsSetter]}>
                <TournamentContext.Provider value={[tourneys, tourneysSetter]}>
                  <ResponsesContext.Provider
                    value={[responses, responsesSetter]}
                  >
                    <div className="columns is-multiline">
                      {order.map((code) => {
                        if (code === "coded" && !isCoder) {
                          return null;
                        }
                        if (code === "designed" && !isDesigner) {
                          return null;
                        }
                        if (code === "tournaments" && tourneys.length === 0) {
                          return null;
                        }
                        const obj = code2ele.get(code);
                        if (obj !== undefined) {
                          return (
                            <>
                              <div
                                className="column is-narrow"
                                key={`${code}|column|${userid}`}
                              >
                                <div
                                  className="card"
                                  key={`${code}|card|${userid}`}
                                >
                                  <header className="card-header">
                                    <p className="card-header-title">
                                      {t(obj.nameKey)}
                                    </p>
                                    <button
                                      className="card-header-icon"
                                      aria-label={t("a11y.moveLeft")}
                                      title={t("a11y.moveLeft")}
                                      onClick={() => handleMoveLeft(code)}
                                    >
                                      <span className="icon">
                                        <i
                                          className="fa fa-angle-left"
                                          aria-hidden="true"
                                        ></i>
                                      </span>
                                    </button>
                                    <button
                                      className="card-header-icon"
                                      aria-label={t("a11y.moveRight")}
                                      title={t("a11y.moveRight")}
                                      onClick={() => handleMoveRight(code)}
                                    >
                                      <span className="icon">
                                        <i
                                          className="fa fa-angle-right"
                                          aria-hidden="true"
                                        ></i>
                                      </span>
                                    </button>
                                  </header>
                                  <div className="card-content">
                                    <obj.component
                                      order={order}
                                      key={`${code}|component|${userid}`}
                                      handleChallenge={handleNewChallenge.bind(
                                        this
                                      )}
                                    />
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        } else {
                          return null;
                        }
                      })}
                    </div>
                  </ResponsesContext.Provider>
                </TournamentContext.Provider>
              </AllRecsContext.Provider>
            </SummaryContext.Provider>
          </ProfileContext.Provider>
        </article>
      </>
    );
  } else {
    return <Spinner />;
  }
}

export default Player;
