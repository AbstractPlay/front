import React, {
  useEffect,
  useState,
  createContext,
  useCallback,
  useMemo,
} from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStorageState } from "react-use-storage-state";
import { callAuthApi } from "../lib/api";
import { maybeTrackRecommendationChallenge } from "../lib/recommendationAttribution";
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
import Highlights from "./Player/Highlights";
import Response from "./Player/Response";
import Coded from "./Player/Coded";
import Designed from "./Player/Designed";
import Tournaments from "./Player/Tournaments";
import Hero from "./Player/Hero";
import ProfileModule from "./Player/ProfileModule";
import SummaryGate from "./shared/SummaryGate";
import { useStore } from "../stores";
import { formatUserDisplayName } from "./Bots/botUtils";
import {
  PROFILE_TABS,
  MODULE_NAME_KEYS,
  isModuleVisible,
  sortModulesForTab,
} from "../lib/playerProfileSections";

export const ProfileContext = createContext([null, () => {}]);
export const SummaryContext = createContext([null, () => {}]);
export const AllRecsContext = createContext([null, () => []]);
export const ResponsesContext = createContext([null, () => []]);
export const TournamentContext = createContext([null, () => []]);

const code2component = {
  stars: Stars,
  coded: Coded,
  designed: Designed,
  ratings: Ratings,
  counts: Counts,
  opps: Opponents,
  activity: Activity,
  timeouts: Timeouts,
  response: Response,
  tournaments: Tournaments,
  history: History,
  highlights: Highlights,
};

function Player() {
  const { userid } = useParams();
  const globalMe = useStore((state) => state.globalMe);
  const allUsers = useStore((state) => state.users);
  const summary = useStore((state) => state.summary);
  const [user, userSetter] = useState(null);
  const [allRecs, allRecsSetter] = useState([]);
  const [tourneys, tourneysSetter] = useState([]);
  const [responses, responsesSetter] = useState([]);
  const [isCoder, setIsCoder] = useState(false);
  const [isDesigner, setIsDesigner] = useState(false);
  const [activeTab, activeTabSetter] = useStorageState(
    "player-profile-tab",
    "competition"
  );
  const [pinnedModule, pinnedModuleSetter] = useStorageState(
    "player-profile-pin",
    null
  );

  const { t } = useTranslation();

  const visibilityCtx = useMemo(
    () => ({
      user,
      summary,
      allRecs,
      tourneys,
      responses,
      isCoder,
      isDesigner,
    }),
    [user, summary, allRecs, tourneys, responses, isCoder, isDesigner]
  );

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
        userSetter(rec);
      } else {
        userSetter(null);
      }
    } else {
      userSetter(null);
    }
  }, [userid, allUsers]);

  const handleNewChallenge = async (challenge) => {
    try {
      await callAuthApi("new_challenge", {
        ...challenge,
        challenger: { id: globalMe.id, name: globalMe.name },
      });
      maybeTrackRecommendationChallenge(challenge.metaGame);
    } catch (error) {
      console.log(error);
    }
  };

  const handleTogglePin = useCallback(
    (code) => {
      pinnedModuleSetter((current) => (current === code ? null : code));
    },
    [pinnedModuleSetter]
  );

  const activeTabConfig = PROFILE_TABS.find((tab) => tab.id === activeTab);

  const modulesToRender = useMemo(() => {
    if (!activeTabConfig) return [];
    const sorted = sortModulesForTab(activeTabConfig.modules, pinnedModule);
    return sorted.filter((code) => {
      if (code === "highlights") return true;
      return isModuleVisible(code, visibilityCtx);
    });
  }, [activeTabConfig, pinnedModule, visibilityCtx]);

  const tabMayHaveContent = modulesToRender.length > 0;

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
          <ProfileContext.Provider value={[user, userSetter]}>
            <SummaryContext.Provider value={[summary, () => {}]}>
              <AllRecsContext.Provider value={[allRecs, allRecsSetter]}>
                <TournamentContext.Provider value={[tourneys, tourneysSetter]}>
                  <ResponsesContext.Provider
                    value={[responses, responsesSetter]}
                  >
                    <div className="columns is-centered">
                      <div className="column is-10">
                        <Hero handleChallenge={handleNewChallenge} />
                        <div
                          className="box is-size-7 has-text-centered player-dev-banner"
                          role="note"
                        >
                          {t("player.underDevelopment")}
                        </div>
                        <div className="tabs is-small is-toggle is-toggle-rounded player-profile-tabs">
                          <ul>
                            {PROFILE_TABS.map((tab) => (
                              <li
                                key={tab.id}
                                className={
                                  activeTab === tab.id ? "is-active" : ""
                                }
                              >
                                <a
                                  href={`#${tab.id}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    activeTabSetter(tab.id);
                                  }}
                                >
                                  {t(tab.nameKey)}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {tabMayHaveContent ? (
                          <SummaryGate>
                            <div className="columns is-multiline player-tab-modules">
                              {modulesToRender.map((code) => {
                                const Component = code2component[code];
                                if (Component === undefined) return null;
                                if (code === "highlights") {
                                  return (
                                    <Highlights
                                      key={`${code}|${userid}`}
                                      pinned={pinnedModule === code}
                                      onTogglePin={handleTogglePin}
                                    />
                                  );
                                }
                                return (
                                  <ProfileModule
                                    key={`${code}|${userid}`}
                                    code={code}
                                    nameKey={MODULE_NAME_KEYS[code]}
                                    pinned={pinnedModule === code}
                                    onTogglePin={handleTogglePin}
                                    Component={Component}
                                    componentProps={{
                                      handleChallenge: handleNewChallenge,
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </SummaryGate>
                        ) : (
                          <p className="has-text-centered player-tab-empty">
                            {t("player.tabs.empty")}
                          </p>
                        )}
                      </div>
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
