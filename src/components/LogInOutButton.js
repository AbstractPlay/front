import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Auth } from 'aws-amplify';
import UserSettingsModal from './UserSettingsModal';

function LogInOutButton(props) {
  const { t } = useTranslation();
  const [user, userSetter] = useState(null);
  const [showUserSettingsModal, showUserSettingsModalSetter] = useState(false);

  useEffect(() => {
    async function fetchAuth() {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        console.log("usr: ", usr);
        const token = usr.signInUserSession.idToken.jwtToken;
        if (token !== null)
          userSetter(usr.signInUserSession);
      }
      catch (error) {
        // not logged in, ok.
      }
    }
    fetchAuth();
  }, []);

  const handleSettingsClick = () => {
    console.log(user);
    showUserSettingsModalSetter(true);
  }

  const handleUserSettingsClose = (cnt) => {
    showUserSettingsModalSetter(false);
    console.log("handleUserSettingsClose, cnt: ", cnt);
    if (cnt > 0)
      props.updater(cnt);
  }

  console.log("showUserSettingsModal", showUserSettingsModal);
  if (user === null) {
    return (<button className="apButton" onClick={() => Auth.federatedSignIn()} id="login-button" >{t('LogIn')}</button>);
  } else {
    return (
      <div>
        { user.idToken.payload["cognito:username"] }
        <button className="fabtn align-right userSettingsBtn" onClick={handleSettingsClick}>
          <i className="fa fa-cog"></i>
        </button>
        <UserSettingsModal show={showUserSettingsModal} handleClose={handleUserSettingsClose} />
      </div>);
  }
}

export default LogInOutButton;
