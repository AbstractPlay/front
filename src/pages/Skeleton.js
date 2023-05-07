import React, { useState, Suspense, useEffect, createContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
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
import FooterDev from "../components/FooterDev";
import Legal from "../components/Legal";

export const MyTurnContext = createContext([[], () => []]);
export const MeContext = createContext([null, () => {}]);

function Bones(props) {
  const [authed, authedSetter] = useState(false);
  const [token, tokenSetter] = useState(null);
  const [update] = useState(0);
  const [myMove, myMoveSetter] = useState([]);
  const [globalMe, globalMeSetter] = useState(null);

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

  console.log("Skeleton rerendering, update=", update);
  if (!authed) return <Spinner />;
  else
    return (
      <MeContext.Provider value={[globalMe, globalMeSetter]}>
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
                  element={<ListGames update={update} />}
                />
                <Route
                  path="/ratings/:metaGame"
                  element={<Ratings update={update} />}
                />
                <Route
                  path="/move/:metaGame/:gameID"
                  element={<GameMove update={update} />}
                />
                <Route
                  path="/legal"
                  element={<Legal token={token} update={update} />}
                />
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
      </MeContext.Provider>
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
