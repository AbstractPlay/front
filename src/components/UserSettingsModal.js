import React, { useContext, useState, useEffect, Fragment } from "react";
import { useTranslation } from "react-i18next";
import Spinner from "./Spinner";
import { cloneDeep } from 'lodash';
import { API_ENDPOINT_AUTH, API_ENDPOINT_OPEN } from "../config";
import { Auth } from "aws-amplify";
import { MeContext } from "../pages/Skeleton";
import Modal from "./Modal";

function UserSettingsModal(props) {
  const handleUserSettingsClose = props.handleClose;
  const show = props.show;
  // const handleLanguageChange = props.handleLanguageChange;
  // const handleEMailChange = props.handleEMailChange;
  // eslint-disable-next-line no-unused-vars
  const { t, i18n } = useTranslation();
  const [changingName, changingNameSetter] = useState(false);
  const [changingEMail, changingEMailSetter] = useState(false);
  const [changingCodeSent, changingCodeSentSetter] = useState(false);
  /*eslint-disable no-unused-vars*/
  //   const [changingLanguage, changingLanguageSetter] = useState(false);
  const [name, nameSetter] = useState("");
  const [badname, badnameSetter] = useState("");
  const [nameError, nameErrorSetter] = useState(false);
  const [email, emailSetter] = useState("");
  const [emailCode, emailCodeSetter] = useState("");
  const [language, languageSetter] = useState("");
  const [users, usersSetter] = useState([]);
  const [user, userSetter] = useState(null);
  const [updated, updatedSetter] = useState(0);
  const [notifications, notificationsSetter] = useState(null);
  const [exploration, explorationSetter] = useState(null);
  const [globalMe, globalMeSetter] = useContext(MeContext);

  useEffect(() => {
    if (show) {
      changingNameSetter(false);
      changingEMailSetter(false);
      //   changingLanguageSetter(false);
      nameSetter("");
      languageSetter("en");
      emailSetter("");
      emailCodeSetter("");
      if (globalMe?.settings?.all?.notifications) {
        notificationsSetter(globalMe.settings.all.notifications);
      } else {
        notificationsSetter({
          yourturn: true,
          challenges: true,
          gameStart: true,
          gameEnd: true,
        });
      }
      if (globalMe?.settings?.all?.exploration) {
        explorationSetter(globalMe.settings.all.exploration);
      } else {
        explorationSetter(0);
      }
    }
  }, [show, globalMe, notificationsSetter, explorationSetter]);

  useEffect(() => {
    async function fetchData() {
      var url = new URL(API_ENDPOINT_OPEN);
      url.searchParams.append("query", "user_names");
      const res = await fetch(url);
      const result = await res.json();
      console.log("user_names: ", result);
      usersSetter(result.map((u) => u.name));
    }
    if (show && users.length === 0) fetchData();
  }, [show, users]);

  const handleNameChangeClick = () => {
    nameSetter(globalMe.name);
    changingNameSetter(true);
  };

  const handleNameChangeSubmitClick = async () => {
    if (users.find((u) => u === name)) {
      badnameSetter(name);
      nameSetter("");
      nameErrorSetter(true);
    } else {
      changingNameSetter(false);
      await handleSettingChangeSubmit("name", name);
      updatedSetter((updated) => updated + 1);
    }
  };

  const handleNameChangeCancelClick = () => {
    nameSetter("");
    changingNameSetter(false);
  };

  const logout = async () => {
    await Auth.signOut();
    updatedSetter((updated) => updated + 1);
    handleUserSettingsClose(updated + 1);
  };

  //   const handleLanguageChangeSubmitClick = async () => {
  //     changingLanguageSetter(false);
  //     await handleSettingChangeSubmit("language", language);
  //     i18n.changeLanguage(language);
  //     languageSetter(language);
  //     updatedSetter((updated) => updated + 1);
  //   };

  const handleSettingChangeSubmit = async (attr, value) => {
    const usr = await Auth.currentAuthenticatedUser();
    fetch(API_ENDPOINT_AUTH, {
      method: "POST", // or 'PUT'
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
      },
      body: JSON.stringify({
        query: "new_setting",
        pars: {
          attribute: attr,
          value: value,
        },
      }),
    });
  };

  const handleEMailChangeClick = () => {
    emailSetter(user.signInUserSession.idToken.payload.email);
    changingEMailSetter(true);
  };

  //   const handleLanguageChangeClick = () => {
  //     changingLanguageSetter(true);
  //   };

  const handleEMailChangeSubmitClick = async () => {
    const usr = await Auth.currentAuthenticatedUser();
    // await Auth.updateUserAttributes(usr, { email });
    Auth.updateUserAttributes(usr, { email });
    changingCodeSentSetter(true);
  };

  const handleEMailChangeCancelClick = () => {
    emailSetter("");
    changingEMailSetter(false);
  };

  const handleEMailChangeCodeSubmitClick = async () => {
    await Auth.currentAuthenticatedUser();
    Auth.verifyCurrentUserAttributeSubmit("email", emailCode);
    changingEMailSetter(false);
    changingCodeSentSetter(false);
    emailCodeSetter("");
    updatedSetter((updated) => updated + 1);
  };

  const handleNotifyCheckChange = async (key) => {
    const newSettings = JSON.parse(JSON.stringify(globalMe.settings));
    if (newSettings.all === undefined)
      newSettings.all = {};
    newSettings.all.notifications = notifications;
    newSettings.all.notifications[key] = !newSettings.all.notifications[key];
    handleSettingsChange(newSettings);
  }

  const handleExplorationChange = async (value) => {
    const newSettings = cloneDeep(globalMe.settings);
    if (newSettings.all === undefined)
      newSettings.all = {};
    newSettings.all.exploration = value;
    explorationSetter(value); // this will update the UI
    handleSettingsChange(newSettings); // this will update the DB (and the UI after another round trip to the server. Do we really need that?)
  }

  const handleSettingsChange = async (newSettings) => {
    try {
      const usr = await Auth.currentAuthenticatedUser();
      console.log(
        `About to save the following settings:\n${JSON.stringify(newSettings)}`
      );
      const res = await fetch(API_ENDPOINT_AUTH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
        },
        body: JSON.stringify({
          query: "update_user_settings",
          pars: {
            settings: newSettings,
          },
        }),
      });
      if (res.status !== 200) {
        const result = await res.json();
        console.log(
          `An error occured while saving notification settings:\n${result}`
        );
      } else {
        updatedSetter((updated) => updated + 1);
      }
    } catch (error) {
      props.setError(error);
    }
  };

  useEffect(() => {
    async function fetchAuth() {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        userSetter(usr);
        const token = usr.signInUserSession.idToken.jwtToken;
        if (token !== null) {
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
              body: JSON.stringify({ query: "me", size: "small" }),
            });
            const result = await res.json();
            if (result.statusCode !== 200) console.log(JSON.parse(result.body));
            else {
              if (result === null) globalMeSetter({});
              else {
                globalMeSetter(JSON.parse(result.body));
                console.log(JSON.parse(result.body));
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
    if (show) {
      fetchAuth();
    }
  }, [globalMeSetter, updated, show]);

  console.log(language);

  return (
    <Modal
      show={show}
      title={t("UserSettings")}
      buttons={[
        {
          label: t("Close"),
          action: () => handleUserSettingsClose(updated),
        },
      ]}
    >
      <div className="container">
        {/********************* Display Name *********************/}
        <div className="field" key="DisplayName">
          <label className="label" htmlFor="user_settings_name">
            {t("DisplayName")}
          </label>
          <div className="control">
            {globalMe === null ? (
              <Spinner />
            ) : changingName ? (
              <input
                className="input is-small"
                name="user_settings_name"
                id="user_settings_name"
                type="text"
                value={name}
                onChange={(e) => {
                  nameErrorSetter(false);
                  nameSetter(e.target.value);
                }}
              />
            ) : (
              globalMe.name
            )}
          </div>
          <div className="control is-grouped">
            {globalMe === null ? (
              ""
            ) : changingName ? (
              <Fragment>
                <button
                  className="button is-small apButton"
                  onClick={handleNameChangeSubmitClick}
                >
                  {t("Submit")}
                </button>
                <button
                  className="button is-small is-danger"
                  onClick={handleNameChangeCancelClick}
                >
                  {t("Cancel")}
                </button>
              </Fragment>
            ) : (
              <button
                className="button is-small apButton"
                onClick={handleNameChangeClick}
              >
                {t("Change")}
              </button>
            )}
          </div>
          <p className="help">{t("DisplayNameHelp")}</p>
          {globalMe === null || !changingName ? (
            ""
          ) : (
            <Fragment>
              <p className={"help " + (nameError ? "is-danger" : "is-primary")}>
                {nameError
                  ? t("DisplayNameError", { name: badname })
                  : t("DisplayNameChange")}
              </p>
            </Fragment>
          )}
        </div>
        {/********************* e-mail *********************/}
        <div className="field" key="email">
          <label className="label" htmlFor="user_settings_email">
            {t("EMail")}
          </label>
          <div className="control">
            {globalMe === null ? (
              <Spinner />
            ) : changingEMail ? (
              <input
                className="input is-small"
                name="user_settings_email"
                id="user_settings_email"
                type="text"
                value={email}
                onChange={(e) => emailSetter(e.target.value)}
              />
            ) : (
              user?.signInUserSession.idToken.payload.email
            )}
          </div>
          <div className="control">
            {globalMe === null ? (
              ""
            ) : changingEMail ? (
              changingCodeSent ? (
                ""
              ) : (
                <Fragment>
                  <button
                    className="button is-small apButton"
                    onClick={handleEMailChangeSubmitClick}
                  >
                    {t("Submit")}
                  </button>
                  <button
                    className="button is-small is-danger"
                    onClick={handleEMailChangeCancelClick}
                  >
                    {t("Cancel")}
                  </button>
                </Fragment>
              )
            ) : (
              <button
                className="button is-small apButton"
                onClick={handleEMailChangeClick}
              >
                {t("Change")}
              </button>
            )}
          </div>
          {/********************* e-mail confirmation code *********************/}
          {changingCodeSent ? (
            <div className="field">
              <label className="label" htmlFor="user_settings_email_code">
                {t("EMailCode")}:
              </label>
              <div className="control">
                {globalMe === null ? (
                  <Spinner />
                ) : (
                  <input
                    className="input is-small"
                    name="email"
                    id="user_settings_email_code"
                    type="text"
                    value={emailCode}
                    onChange={(e) => emailCodeSetter(e.target.value)}
                  />
                )}
              </div>
              <div className="control">
                {globalMe === null ? (
                  ""
                ) : changingEMail ? (
                  <button
                    className="button is-small apButton"
                    onClick={handleEMailChangeCodeSubmitClick}
                  >
                    {t("Submit")}
                  </button>
                ) : (
                  <button
                    className="button is-small apButton"
                    onClick={handleEMailChangeClick}
                  >
                    {t("Change")}
                  </button>
                )}
              </div>
              <p className="help is-primary">{t("EMailCodeHelp")}</p>
            </div>
          ) : (
            ""
          )}
        </div>
        {/********************* notifications *********************/}
        <div className="field" key="notifications">
          <label className="label">{t("NotificationSettings")}</label>
          {!notifications
            ? ""
            : ["challenges", "gameStart", "gameEnd", "yourturn"].map((key) => (
                <div className="control" key={key}>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      name={key}
                      checked={notifications[key]}
                      onChange={() => handleNotifyCheckChange(key)}
                    />
                    {t(`NotifyLabel-${key}`)}
                  </label>
                </div>
              ))}
        </div>
        {/********************* exploration *********************/}
        {exploration === null
          ? "" :
          <div className="field" key="exploration">
            <label className="label">{t("ExplorationSetting")}</label>
            <div className="control" key="explore-never">
              <label className="radio">
                <input
                  type="radio"
                  id="explore-never"
                  value="-1"
                  name="explore-never"
                  checked={exploration === -1}
                  onChange={() =>
                    handleExplorationChange(-1)
                  }
                />
                {t(`ExploreNever`)}
              </label>
            </div>
            <div className="control" key="explore-ask">
              <label className="radio">
                <input
                  type="radio"
                  id="explore-ask"
                  value="-1"
                  name="explore-ask"
                  checked={exploration === 0}
                  onChange={() =>
                    handleExplorationChange(0)
                  }
                />
                {t(`ExploreAsk`)}
              </label>
            </div>
            <div className="control" key="explore-always">
              <label className="radio">
                <input
                  type="radio"
                  id="explore-always"
                  value="-1"
                  name="explore-always"
                  checked={exploration === 1}
                  onChange={() =>
                    handleExplorationChange(1)
                  }
                />
                {t(`ExploreAlways`)}
              </label>
            </div>
          </div>
        }

        {/* Uncomment this once we have a translation. Also remove the eslint-disable no-unused-vars above
        ******************** Language *********************
        <div className="userSettingsLabelDiv">
          <label className="userSettingsLabel" htmlFor="user_settings_language" >{t("Language")}:</label>
        </div>
        <div className="userSettingsInputDiv">
          { mySettings === null ? <Spinner/> :
            changingLanguage ?
              <select value={language} name="laguage" id="user_settings_language" onChange={(e) => languageSetter(e.target.value)}>
              <option value="">--{t('Select')}--</option>
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="it">Italian</option>
              </select>
              : mySettings.language === undefined ? i18n.language : mySettings.language
          }
        </div>
        <div className="userSettingsButtonDiv">
          { mySettings === null ? '' :
            changingLanguage ?
            <button className="apButton inlineButton" onClick={handleLanguageChangeSubmitClick}>{t("Submit")}</button>
            : <button className="apButton inlineButton" onClick={handleLanguageChangeClick}>{t("Change")}</button>
          }
        </div>
        */}

        {/********************* Log out *********************/}
        <div className="control" style={{ float: "right" }}>
          <button
            className="button is-small apButton"
            onClick={logout}
            id="logout-button"
          >
            {t("LogOut")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default UserSettingsModal;
