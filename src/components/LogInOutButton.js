import React, { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import { Auth } from "aws-amplify";
import { API_ENDPOINT_AUTH } from "../config";
import UserSettingsModal from "./UserSettingsModal";
import { MeContext } from "../pages/Skeleton";
import NewProfile from "./NewProfile";
import { subscribeUser } from "../subscription";

function LogInOutButton(props) {
  const { t } = useTranslation();
  const [user, userSetter] = useState(null);
  const [showUserSettingsModal, showUserSettingsModalSetter] = useState(false);
  const [showNewProfileModal, showNewProfileModalSetter] = useState(false);
  const [updated, updatedSetter] = useState(false);
  const [globalMe, globalMeSetter] = useContext(MeContext);

  useEffect(() => {
    async function fetchAuth() {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        console.log("usr: ", usr);
        const token = usr.signInUserSession.idToken.jwtToken;
        if (token !== null) {
          userSetter(usr.signInUserSession);
          try {
            console.log("calling authQuery 'me' (small), with token: " + token);
            const res = await fetch(API_ENDPOINT_AUTH, {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              // Don't care about e.g. challenges, so size = small.
              body: JSON.stringify({ query: "me", pars: {size: "small"}}),
            });
            const result = await res.json();
            if (result.statusCode !== 200) console.log(JSON.parse(result.body));
            else {
              if (result === null) globalMeSetter({});
              else {
                globalMeSetter((currentGlobalMe) => {
                  return {
                    ...JSON.parse(result.body),
                    ...(currentGlobalMe && { 
                      challengesIssued: currentGlobalMe.challengesIssued ?? [],
                      challengesReceived: currentGlobalMe.challengesReceived ?? [],
                      challengesAccepted: currentGlobalMe.challengesAccepted ?? [],
                      standingChallenges: currentGlobalMe.standingChallenges ?? []}),
                  };
                });
                console.log(JSON.parse(result.body));
                subscribeUser(token);
              }
            }
          } catch (error) {
            console.log(error);
          }
        }
      } catch (error) {
        // not logged in, ok.
      }
    }
    fetchAuth();
  }, [globalMeSetter, updated]);

  useEffect(() => {
    async function fetchAuth() {
      if (
        globalMe !== null &&
        "mayPush" in globalMe &&
        globalMe.mayPush === true
      ) {
        const usr = await Auth.currentAuthenticatedUser();
        console.log("usr: ", usr);
        const token = usr.signInUserSession.idToken.jwtToken;
        if (token !== null) {
          subscribeUser(token);
        }
      }
    }
    fetchAuth();
  }, [globalMe]);

  const handleSettingsClick = () => {
    console.log(user);
    if (!globalMe || globalMe.id === undefined) {
      console.log("showNewProfileModalSetter(true);");
      showNewProfileModalSetter(true);
    } else {
      showUserSettingsModalSetter(true);
    }
  };

  const handleUserSettingsClose = (cnt) => {
    showUserSettingsModalSetter(false);
    console.log("handleUserSettingsClose, cnt: ", cnt);
    if (cnt > 0) {
      // Refresh globalMe
      updatedSetter(!updated);
    }
  };

  const handleNewProfileClose = (cnt) => {
    showNewProfileModalSetter(false);
    if (cnt > 0) {
      updatedSetter(!updated);
    }
  };

  console.log("showUserSettingsModal", showUserSettingsModal);
  if (user === null) {
    return (
      <button
        className="apButton"
        onClick={() => Auth.federatedSignIn()}
        id="login-button"
      >
        {t("LogIn")}
      </button>
    );
  } else {
    return (
      <div>
        {user.idToken.payload["cognito:username"]}
        <button
          className="fabtn align-right userSettingsBtn"
          onClick={handleSettingsClick}
        >
          <i className="fa fa-cog"></i>
        </button>
        <UserSettingsModal
          show={showUserSettingsModal}
          handleClose={handleUserSettingsClose}
        />
        <NewProfile
          show={showNewProfileModal}
          handleClose={handleNewProfileClose}
          updateMe={true}
        />
      </div>
    );
  }
}

export default LogInOutButton;
