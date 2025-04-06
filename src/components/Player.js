import React, { useEffect, useContext, useState, createContext } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { addResource } from "@abstractplay/gameslib";
import { MeContext, UsersContext } from "../pages/Skeleton";
import { useStorageState } from "react-use-storage-state";
import { Auth } from "aws-amplify";
import { API_ENDPOINT_AUTH } from "../config";
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

export const ProfileContext = createContext([null, () => {}]);
export const SummaryContext = createContext([null, () => {}]);
export const AllRecsContext = createContext([null, () => []]);
export const ResponsesContext = createContext([null, () => []]);

const code2ele = new Map([
  ["stars", { component: Stars, name: "Starred Games" }],
  ["coded", { component: Coded, name: "Games Coded" }],
  ["designed", { component: Designed, name: "Games Designed" }],
  ["ratings", { component: Ratings, name: "Ratings" }],
  ["counts", { component: Counts, name: "Play Counts" }],
  ["opps", { component: Opponents, name: "Opponents" }],
  ["activity", { component: Activity, name: "Activity" }],
  ["timeouts", { component: Timeouts, name: "Timeouts" }],
  ["response", { component: Response, name: "Response time" }],
  ["history", { component: History, name: "Game History" }],
]);

function Player() {
  const { userid } = useParams();
  const [globalMe] = useContext(MeContext);
  const [allUsers] = useContext(UsersContext);
  const [user, userSetter] = useState(null);
  const [summary, summarySetter] = useState(null);
  const [allRecs, allRecsSetter] = useState([]);
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
    "history",
  ]);

  // eslint-disable-next-line no-unused-vars
  const { t, i18n } = useTranslation();
  addResource(i18n.language);

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

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
        const coded = [...gameinfo.values()].filter(e => e.people !== undefined && e.people.filter(p => p.type === "coder" && p.apid === user.id).length > 0);
        setIsCoder(coded.length > 0);
        const designed = [...gameinfo.values()].filter(e => e.people !== undefined && e.people.filter(p => p.type === "designer" && p.apid === user.id).length > 0);
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
      const usr = await Auth.currentAuthenticatedUser();
      console.log("currentAuthenticatedUser", usr);
      await fetch(API_ENDPOINT_AUTH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
        },
        body: JSON.stringify({
          query: "new_challenge",
          pars: {
            ...challenge,
            challenger: { id: globalMe.id, name: globalMe.name },
          },
        }),
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
            {t("ProfileFor", { player: user.name })}
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
            <p>
              The player profile page is very much "under development." It
              currently excludes any real-time stats and relies instead on the
              statistics tabulated weekly.
            </p>
          </div>
          <ProfileContext.Provider value={[user, userSetter]}>
            <SummaryContext.Provider value={[summary, summarySetter]}>
              <AllRecsContext.Provider value={[allRecs, allRecsSetter]}>
                <ResponsesContext.Provider value={[responses, responsesSetter]}>
                  <div className="columns is-multiline">
                    {order.map((code) => {
                      if (code === "coded" && !isCoder) {
                        return null;
                      }
                      if (code === "designed" && !isDesigner) {
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
                                    {obj.name}
                                  </p>
                                  <button
                                    className="card-header-icon"
                                    aria-label="move left"
                                    title="move left"
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
                                    aria-label="move right"
                                    title="move right"
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
