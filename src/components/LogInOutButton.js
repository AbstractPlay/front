import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Auth } from "aws-amplify";
import { callAuthApi } from "../lib/api";
import UserSettingsModal from "./UserSettingsModal";
import NewProfile from "./NewProfile";
import { subscribeUser } from "../subscription";
import { useStore } from "../stores";

function LogInOutButton({ closeBurger }) {
  const { t } = useTranslation();
  const [user, userSetter] = useState(null);
  const [showUserSettingsModal, showUserSettingsModalSetter] = useState(false);
  const [showNewProfileModal, showNewProfileModalSetter] = useState(false);
  const [updated, updatedSetter] = useState(false);
  const globalMe = useStore((state) => state.globalMe);

  useEffect(() => {
    const { setGlobalMe } = useStore.getState();
    async function fetchAuth() {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        console.log("usr: ", usr);
        const token = usr.signInUserSession.idToken.jwtToken;
        if (token !== null) {
          userSetter(usr.signInUserSession);
          try {
            console.log("calling authQuery 'me' (small), with token: " + token);
            const res = await callAuthApi("me", { size: "small" });
            if (!res) return;
            const result = await res.json();
            if (result.statusCode !== 200) console.log(JSON.parse(result.body));
            else {
              if (result === null) setGlobalMe({});
              else {
                setGlobalMe((prev) => {
                  const backendData = JSON.parse(result.body);
                  return {
                    ...prev,
                    ...backendData,
                    challengesIssued: prev?.challengesIssued ?? [],
                    challengesReceived: prev?.challengesReceived ?? [],
                    challengesAccepted: prev?.challengesAccepted ?? [],
                    standingChallenges: prev?.standingChallenges ?? [],
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
  }, [updated]);

  useEffect(() => {
    console.log("globalMe changed:", globalMe);
    // Trigger your logic here
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
      console.log(globalMe);
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
      console.log(`Refreshing globalMe (${updated})`);
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
        className="button is-small apButton"
        onClick={() => Auth.federatedSignIn()}
        id="login-button"
      >
        {t("LogIn")}
      </button>
    );
  } else {
    return (
      <div>
        <Link
          to={`/player/${user.idToken.payload["sub"]}`}
          onClick={() => closeBurger()}
        >
          {user.idToken.payload["cognito:username"]}
        </Link>
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
