import React, { useState, Suspense, useEffect, createContext } from "react";
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
import GameMove from "../components/GameMove";
import MetaContainer from "../components/MetaContainer";
import About from "../components/About";
import StandingChallenges from "../components/StandingChallenges";
import ListGames from "../components/ListGames";
import Ratings from "../components/Ratings";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import News from "../components/News";
import FooterDev from "../components/FooterDev";
import Legal from "../components/Legal";
import Stats from "../components/Stats";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import en from "javascript-time-ago/locale/en.json";
import TimeAgo from "javascript-time-ago";
// TODO: Adjust locale to user selection, when supported
TimeAgo.addDefaultLocale(en);

export const MyTurnContext = createContext([[], () => []]);
export const MeContext = createContext([null, () => {}]);
export const UsersContext = createContext([null, () => {}]);
export const NewsContext = createContext([[], () => []]);

function Bones(props) {
  const [authed, authedSetter] = useState(false);
  const [token, tokenSetter] = useState(null);
  const [update] = useState(0);
  const [myMove, myMoveSetter] = useState([]);
  const [globalMe, globalMeSetter] = useState(null);
  const [users, usersSetter] = useState(null);
  const [news, newsSetter] = useState([]);

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
      } catch (error) {
        tokenSetter(null);
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
      const result = await fetch("data/news.json");
      if (result.status !== 200) {
        console.log(`Unable to fetch news: ${JSON.stringify(result.status)}`);
      } else {
        const json = await result.json();
        json.sort((a, b) => b.time - a.time);
        newsSetter(json);
      }
    }
    fetchData();
  }, [newsSetter]);

  console.log("Skeleton rerendering, update=", update);
  if (!authed) return <Spinner />;
  else
    return (
      <HelmetProvider>
        <Helmet>
          <link rel="canonical" href="https://play.abstractplay.com/" />
          <title>
            {process.env.REACT_APP_REAL_MODE === "production"
              ? "Abstract Play"
              : "Abstract Play (Dev)"}
          </title>
        </Helmet>
        <ToastContainer />
        <MeContext.Provider value={[globalMe, globalMeSetter]}>
          <UsersContext.Provider value={[users, usersSetter]}>
            <NewsContext.Provider value={[news, newsSetter]}>
              <Router>
                <Navbar />
                <section className="section" id="main">
                  <MyTurnContext.Provider value={[myMove, myMoveSetter]}>
                    <Routes>
                      <Route path="/about" element={<About token={token} />} />
                      <Route
                        path="/games/:metaGame?"
                        element={<MetaContainer token={token} />}
                      />
                      <Route
                        path="/challenges/:metaGame"
                        element={<StandingChallenges />}
                      />
                      <Route
                        path="/listgames/:gameState/:metaGame"
                        element={<ListGames />}
                      />
                      <Route path="/ratings/:metaGame" element={<Ratings />} />
                      <Route
                        path="/move/:metaGame/:cbits/:gameID"
                        element={<GameMove update={update} />}
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
                    </Routes>
                  </MyTurnContext.Provider>
                </section>
                {process.env.REACT_APP_REAL_MODE === "production" ? (
                  <Footer />
                ) : (
                  <FooterDev />
                )}
              </Router>
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
