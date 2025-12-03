import React, {
  useState,
  Suspense,
  useEffect,
  createContext,
  lazy,
} from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import {
  API_ENDPOINT_OPEN,
  COGNITO_USER_POOL_ID,
  COGNITO_APPID,
  COGNITO_DOMAIN,
  COGNITO_COOKIE_DOMAIN,
  COGNITO_REDIRECT_LOGIN,
  COGNITO_REDIRECT_LOGOUT,
} from "../config";
import { Amplify, Auth } from "aws-amplify";
import Spinner from "../components/Spinner";
import Welcome from "./Welcome";
import GameMoveWrapper from "../components/GameMoveWrapper";
import About from "../components/About";
import StandingChallenges from "../components/StandingChallenges";
import ListGames from "../components/ListGames";
import Ratings from "../components/Ratings";
import Tournament from "../components/Tournaments/Tournament";
import Playground from "../components/Playground";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import News from "../components/News";
import FooterDev from "../components/FooterDev";
import Legal from "../components/Legal";
import Players from "../components/Players";
import Tournaments from "../components/Tournaments/Tournaments";
import TournamentsOld from "../components/Tournaments/TournamentsOld";
import NotFound from "../components/NotFound";
import Event from "../components/Event";
import Events from "../components/Events";
import Play from "../components/Play";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import en from "javascript-time-ago/locale/en.json";
import TimeAgo from "javascript-time-ago";
import { useStorageState } from "react-use-storage-state";
import newsData from "../assets/news.json";

const Stats = lazy(() => import("../components/Stats"));
// const MetaContainer = lazy(() => import("../components/MetaContainer"));
const Player = lazy(() => import("../components/Player"));
const Explore = lazy(() => import("../components/Explore"));

// TODO: Adjust locale to user selection, when supported
TimeAgo.addDefaultLocale(en);

export const MyTurnContext = createContext([[], () => []]);
export const MeContext = createContext([null, () => {}]);
export const UsersContext = createContext([null, () => {}]);
export const NewsContext = createContext([[], () => []]);
export const ColourContext = createContext([null, () => {}]);
export const SummaryContext = createContext([null, () => {}]);

function Bones(props) {
  const [authed, authedSetter] = useState(false);
  const [token, tokenSetter] = useState(null);

  const [update] = useState(0);
  const [myMove, myMoveSetter] = useState([]);
  const [globalMe, globalMeSetter] = useState(null);
  const [users, usersSetter] = useState(null);
  const [news, newsSetter] = useState(newsData.sort((a, b) => b.time - a.time));
  const [summary, summarySetter] = useState(null);
  const [colorMode] = useStorageState("color-mode", "light");
  const [storedContextLight] = useStorageState("stored-context-light", {
    background: "#fff",
    strokes: "#000",
    borders: "#000",
    labels: "#000",
    annotations: "#000",
    fill: "#000",
  });
  const [storedContextDark] = useStorageState("stored-context-dark", {
    background: "#222",
    strokes: "#6d6d6d",
    borders: "#000",
    labels: "#009fbf",
    annotations: "#99cccc",
    fill: "#e6f2f2",
  });
  const [colourContext, colourContextSetter] = useState({
    background: "#fff",
    strokes: "#000",
    borders: "#000",
    labels: "#000",
    annotations: "#000",
    fill: "#000",
  });

  // Update colour context setting based on colour mode
  useEffect(() => {
    if (colorMode === "dark") {
      colourContextSetter(storedContextDark);
    } else {
      colourContextSetter(storedContextLight);
    }
  }, [colorMode, storedContextLight, storedContextDark]);

  useEffect(() => {
    const awsconfig = {
      Auth: {
        region: "us-east-1",
        userPoolId: COGNITO_USER_POOL_ID,
        userPoolWebClientId: COGNITO_APPID,
        mandatorySignIn: false,
        cookieStorage: {
          domain: COGNITO_COOKIE_DOMAIN,
          path: "/",
          expires: 7,
          secure: true,
        },
        redirectSignIn: COGNITO_REDIRECT_LOGIN,
        redirectSignOut: COGNITO_REDIRECT_LOGOUT,
      },
      API: {
        endpoints: [
          {
            name: "demo",
            endpoint: COGNITO_REDIRECT_LOGIN,
          },
        ],
      },
    };
    Amplify.configure(awsconfig);
    const awsauth = {
      domain: COGNITO_DOMAIN,
      scope: ["openid", "email", "aws.cognito.signin.user.admin"],
      redirectSignIn: COGNITO_REDIRECT_LOGIN,
      redirectSignOut: COGNITO_REDIRECT_LOGOUT,
      responseType: "code",
    };
    Auth.configure({ oauth: awsauth });
    async function getToken() {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        console.log("usr:", usr);
        // if (usr.signInUserSession !== undefined)
        tokenSetter(usr.signInUserSession.idToken.jwtToken);
        // Mark that user is logged in for session expiry detection
        localStorage.setItem("wasLoggedIn", "1");
      } catch (error) {
        tokenSetter(null);
        // Check if user was previously logged in (session expired)
        const wasLoggedIn = localStorage.getItem("wasLoggedIn") === "1";
        const intentionalLogout =
          sessionStorage.getItem("intentionalLogout") === "1";

        if (wasLoggedIn && !intentionalLogout) {
          // Session expired - auto-trigger login
          console.log("Session expired, auto-triggering login...");
          localStorage.removeItem("wasLoggedIn");
          Auth.federatedSignIn();
          return;
        }

        // Clear flags
        localStorage.removeItem("wasLoggedIn");
        sessionStorage.removeItem("intentionalLogout");
      }
      authedSetter(true);
      console.log("authed");
    }
    getToken();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append("query", "user_names");
        const res = await fetch(url);
        const result = await res.json();
        usersSetter(result);
      } catch (error) {
        usersSetter(null);
      }
    }
    fetchData();
  }, []);

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

  // apply stored color mode
  useEffect(() => {
    if (colorMode !== null && colorMode !== undefined) {
      // Sets the custom HTML attribute
      document.documentElement.setAttribute("color-mode", colorMode);
    }
  }, [colorMode]);

  console.log("Skeleton rerendering, update=", update);
  if (!authed) return <Spinner />;
  else
    return (
      <HelmetProvider>
        <Helmet>
          <title>
            {process.env.REACT_APP_REAL_MODE === "production"
              ? "Abstract Play"
              : "Abstract Play (Dev)"}
          </title>

          <meta
            property="og:title"
            content="Abstract Play: Make Time for Games"
          />
          <meta property="og:url" content="https://play.abstractplay.com" />
          <meta
            property="og:description"
            content="Abstract Play is a site that allows you to play abstract strategy board games against other players on the internet. These games are not real-time, meaning your opponent does not need to be online at the same time as you are. You can submit your move and come back later to see if your opponent has moved. We specialize in offbeat, perfect information games without any element of luck."
          />
        </Helmet>
        <ToastContainer />
        <MeContext.Provider value={[globalMe, globalMeSetter]}>
          <UsersContext.Provider value={[users, usersSetter]}>
            <NewsContext.Provider value={[news, newsSetter]}>
              <SummaryContext.Provider value={[summary, summarySetter]}>
                <ColourContext.Provider
                  value={[colourContext, colourContextSetter]}
                >
                  <Router>
                    <Navbar />
                    <section className="section" id="main">
                      <MyTurnContext.Provider value={[myMove, myMoveSetter]}>
                        <Routes>
                          <Route path="*" element={<NotFound />} />
                          <Route
                            path="/about"
                            element={<About token={token} />}
                          />
                          <Route
                            path="/games/:metaGame?"
                            element={<Explore token={token} />}
                          />
                          {/* <Route
                            path="/explore/:mode?"
                            element={<Explore token={token} />}
                          /> */}
                          <Route path="/players" element={<Players />} />
                          <Route path="/player/:userid" element={<Player />} />
                          <Route
                            path="/challenges/:metaGame"
                            element={<StandingChallenges />}
                          />
                          <Route
                            path="/listgames/:gameState/:metaGame"
                            element={<ListGames />}
                          />
                          <Route
                            path="/ratings/:metaGame"
                            element={<Ratings />}
                          />
                          <Route
                            path="/tournament/:metaGame/:tournamentid"
                            element={<Tournament />}
                          />
                          <Route
                            path="/tournament/:tournamentid"
                            element={<Tournament />}
                          />
                          <Route
                            path="/tournamenthistory/:metaGame"
                            element={<TournamentsOld />}
                          />
                          <Route path="/events" element={<Events />} />
                          <Route path="/event/:eventid" element={<Event />} />
                          <Route
                            path="/move/:metaGame/:cbits/:gameID"
                            element={<GameMoveWrapper update={update} />}
                          />
                          <Route
                            path="/legal"
                            element={<Legal token={token} update={update} />}
                          />
                          <Route path="/news" element={<News />} />
                          <Route path="/stats" element={<Stats />} />
                          <Route
                            path="/"
                            element={<Welcome token={token} update={update} />}
                          />
                          <Route path="/playground" element={<Playground />} />
                          <Route
                            path="/tournaments/:metaGame?"
                            element={<Tournaments />}
                          />
                          <Route path="/play" element={<Play />} />
                        </Routes>
                      </MyTurnContext.Provider>
                    </section>
                    {process.env.REACT_APP_REAL_MODE === "production" ? (
                      <Footer />
                    ) : (
                      <FooterDev />
                    )}
                  </Router>
                </ColourContext.Provider>
              </SummaryContext.Provider>
            </NewsContext.Provider>
          </UsersContext.Provider>
        </MeContext.Provider>
      </HelmetProvider>
    );
}

export default function Skeleton() {
  // The useTranslation hook will trigger a Suspense if not ready
  return (
    <Suspense fallback={<Spinner />}>
      <Bones />
    </Suspense>
  );
}
