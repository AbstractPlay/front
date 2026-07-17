/* eslint-disable no-prototype-builtins */
import React, {
  useState,
  useEffect,
  Fragment,
  useMemo,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import Spinner from "./Spinner";
import { cloneDeep } from "lodash";
import { Auth } from "aws-amplify";
import { callAuthApi } from "../lib/api";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import { debounce } from "lodash";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Modal from "./Modal";
import { useStorageState } from "react-use-storage-state";
import { countryCodeList } from "../lib/countryCodeList";
import { useStore } from "../stores";
import BotsModal from "./Bots/BotsModal";
import { validateDisplayName } from "./Bots/botUtils";
import {
  subscribeUser,
  deletePushSubscription,
  unregisterAllDevices,
  isPushEnabledOnDevice,
} from "../subscription";
import { toast } from "react-toastify";

function UserSettingsModal(props) {
  const handleUserSettingsClose = props.handleClose;
  const show = props.show;
  // const handleLanguageChange = props.handleLanguageChange;
  // const handleEMailChange = props.handleEMailChange;
  // eslint-disable-next-line no-unused-vars
  const { t } = useTranslation();
  const [changingName, changingNameSetter] = useState(false);
  const [changingEMail, changingEMailSetter] = useState(false);
  const [changingCodeSent, changingCodeSentSetter] = useState(false);
  /*eslint-disable no-unused-vars*/
  //   const [changingLanguage, changingLanguageSetter] = useState(false);
  const [name, nameSetter] = useState("");
  const [nameError, nameErrorSetter] = useState("");
  const [email, emailSetter] = useState("");
  const [emailCode, emailCodeSetter] = useState("");
  const [language, languageSetter] = useState("");
  const [country, countrySetter] = useState("");
  const [bggid, bggidSetter] = useState("");
  const [aboutMe, aboutMeSetter] = useState("");
  const users = useStore((state) => state.users);
  const [user, userSetter] = useState(null);
  const [updated, updatedSetter] = useState(0);
  const [notifications, notificationsSetter] = useState(null);
  const [exploration, explorationSetter] = useState(null);
  const [confirmMove, confirmMoveSetter] = useState(true);
  const globalMe = useStore((state) => state.globalMe);
  const [showPlayTour, showPlayTourSetter] = useStorageState(
    "joyride-play-show",
    true
  );
  const [hideTour, hideTourSetter] = useState(!showPlayTour);
  const [hideSpoilers, hideSpoilersSetter] = useState(false);
  const [myColor, myColorSetter] = useState(false);
  const [showBots, showBotsSetter] = useState(false);
  const [pushOnThisDevice, pushOnThisDeviceSetter] = useState(false);

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
        const settings = { ...globalMe.settings.all.notifications };
        if (!settings.hasOwnProperty("yourturn")) {
          settings.yourturn = true;
        }
        if (!settings.hasOwnProperty("challenges")) {
          settings.challenges = true;
        }
        if (!settings.hasOwnProperty("gameStart")) {
          settings.gameStart = true;
        }
        if (!settings.hasOwnProperty("gameEnd")) {
          settings.gameEnd = true;
        }
        if (!settings.hasOwnProperty("tournamentStart")) {
          settings.tournamentStart = true;
        }
        if (!settings.hasOwnProperty("tournamentEnd")) {
          settings.tournamentEnd = true;
        }
        notificationsSetter(settings);
      } else {
        notificationsSetter({
          yourturn: true,
          challenges: true,
          gameStart: true,
          gameEnd: true,
          tournamentStart: true,
          tournamentEnd: true,
        });
      }
      if (globalMe?.settings?.all?.exploration === undefined) {
        explorationSetter(0);
      } else {
        explorationSetter(globalMe.settings.all.exploration);
      }
      if (globalMe?.settings?.all?.moveConfirmOff) {
        confirmMoveSetter(!globalMe.settings.all.moveConfirmOff);
      } else {
        confirmMoveSetter(true);
      }
      if (globalMe?.settings?.all?.hideSpoilers) {
        hideSpoilersSetter(globalMe.settings.all.hideSpoilers);
      } else {
        hideSpoilersSetter(false);
      }
      if (globalMe?.settings?.all?.myColor) {
        myColorSetter(globalMe.settings.all.myColor);
      } else {
        myColorSetter(false);
      }
      if (globalMe?.country !== undefined) {
        countrySetter(globalMe.country);
      }
      if (globalMe?.bggid !== undefined && globalMe?.bggid !== null) {
        bggidSetter(globalMe.bggid);
      }
      if (globalMe?.about !== undefined && globalMe?.about !== null) {
        aboutMeSetter(globalMe.about);
      }
    }
  }, [show, globalMe, notificationsSetter, explorationSetter]);

  const handleNameChangeClick = () => {
    nameSetter(globalMe.name);
    changingNameSetter(true);
  };

  const handleNameChangeSubmitClick = async () => {
    if (users.find((u) => u === name)) {
      nameSetter("");
      nameErrorSetter(t("DisplayNameError", { name }));
    } else if (name === "") {
      nameErrorSetter(t("NameBlank"));
    } else {
      const nameValidationError = validateDisplayName(name);
      if (nameValidationError) {
        nameErrorSetter(nameValidationError);
        return;
      }
      changingNameSetter(false);
      await handleSettingChangeSubmit("name", name);
      updatedSetter((updated) => updated + 1);
    }
  };

  const handleSettingChangeSubmit = useCallback(async (attr, value) => {
    await callAuthApi("new_setting", {
      attribute: attr,
      value: value,
    });
  }, []);

  const debouncedCountryChange = useMemo(() => {
    return debounce(async (newCountry) => {
      await handleSettingChangeSubmit("country", newCountry);
      countrySetter(newCountry);
      updatedSetter((updated) => updated + 1);
    }, 300);
  }, [handleSettingChangeSubmit]); // âœ… Only depends on submit function

  // âœ… Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      debouncedCountryChange.cancel();
    };
  }, [debouncedCountryChange]);

  const handleNameChangeCancelClick = () => {
    nameSetter("");
    changingNameSetter(false);
  };

  const logout = async () => {
    // Set flag to indicate intentional logout, so we don't auto-login on redirect
    sessionStorage.setItem("intentionalLogout", "1");
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

  const saveBGGid = () => {
    const { setGlobalMe, setUsers } = useStore.getState();
    handleSettingChangeSubmit("bggid", bggid);
    setGlobalMe((val) => ({ ...val, bggid }));
    setUsers((prev) =>
      prev.map((u) => (u.id === globalMe?.id ? { ...u, bggid } : u))
    );
  };

  const saveAbout = () => {
    const { setGlobalMe, setUsers } = useStore.getState();
    handleSettingChangeSubmit("about", aboutMe);
    setGlobalMe((val) => ({ ...val, about: aboutMe }));
    setUsers((prev) =>
      prev.map((u) => (u.id === globalMe?.id ? { ...u, about: aboutMe } : u))
    );
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
    if (newSettings.all === undefined) newSettings.all = {};
    newSettings.all.notifications = notifications;
    newSettings.all.notifications[key] = !newSettings.all.notifications[key];
    handleSettingsChange(newSettings);
  };

  const handleTourCheckChange = () => {
    const newSetting = !hideTour;
    hideTourSetter(newSetting);
    if (newSetting) {
      showPlayTourSetter(false);
    } else {
      showPlayTourSetter(true);
    }
  };

  const handleExplorationChange = async (value) => {
    const newSettings = cloneDeep(globalMe.settings);
    if (newSettings.all === undefined) newSettings.all = {};
    newSettings.all.exploration = value;
    explorationSetter(value); // this will update the UI
    handleSettingsChange(newSettings); // this will update the DB (and the UI after another round trip to the server. Do we really need that?)
  };

  const handleMoveConfirmChange = async () => {
    const newSettings = cloneDeep(globalMe.settings);
    if (newSettings.all === undefined) newSettings.all = {};
    newSettings.all.moveConfirmOff = confirmMove;
    confirmMoveSetter(!confirmMove);
    handleSettingsChange(newSettings);
  };

  const handleHideSpoilersChange = async () => {
    const newSettings = cloneDeep(globalMe.settings);
    if (newSettings.all === undefined) newSettings.all = {};
    newSettings.all.hideSpoilers = !hideSpoilers;
    hideSpoilersSetter(!hideSpoilers);
    handleSettingsChange(newSettings);
  };

  const handleMyColorChange = async () => {
    const newSettings = cloneDeep(globalMe.settings);
    if (newSettings.all === undefined) newSettings.all = {};
    newSettings.all.myColor = !myColor;
    myColorSetter(!myColor);
    handleSettingsChange(newSettings);
  };

  const handleSettingsChange = async (newSettings) => {
    try {
      console.log(
        `About to save the following settings:\n${JSON.stringify(newSettings)}`
      );
      const res = await callAuthApi("update_user_settings", {
        settings: newSettings,
      });
      if (!res) return;
      if (res.status !== 200) {
        const result = await res.json();
        console.log(
          `An error occurred while saving notification settings:\n${result}`
        );
      } else {
        updatedSetter((updated) => updated + 1);
      }
    } catch (error) {
      props.setError(error);
    }
  };

  useEffect(() => {
    const { setGlobalMe } = useStore.getState();
    async function fetchAuth() {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        userSetter(usr);
        const token = usr.signInUserSession.idToken.jwtToken;
        if (token !== null) {
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
                    bots: backendData.bots ?? prev?.bots ?? [],
                  };
                });
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
  }, [updated, show]);

  useEffect(() => {
    if (show) {
      isPushEnabledOnDevice().then(pushOnThisDeviceSetter);
    }
  }, [show]);

  const handlePushClick = async () => {
    const enabling = !pushOnThisDevice;

    try {
      if (enabling) {
        const subscribeResult = await subscribeUser({ requestPermission: true });
        if (!subscribeResult.success) {
          const message =
            subscribeResult.errorCode === "pushServiceError"
              ? t(
                  subscribeResult.isBrave
                    ? "PushServiceErrorBrave"
                    : "PushServiceError"
                )
              : subscribeResult.error || t("PushEnableFailed");
          toast(message, {
            type: "error",
            autoClose: subscribeResult.errorCode === "pushServiceError" ? 12000 : 5000,
          });
          return;
        }
        pushOnThisDeviceSetter(true);
      } else {
        const result = await deletePushSubscription();
        if (!result.success) {
          toast(result.error || t("PushDisableFailed"), { type: "error" });
          return;
        }
        pushOnThisDeviceSetter(false);
      }
    } catch (error) {
      console.log(error);
      toast(t("PushUpdateFailed"), { type: "error" });
    }
  };

  const handleUnregisterAllDevices = async () => {
    if (!window.confirm(t("UnregisterAllDevicesConfirm"))) {
      return;
    }

    try {
      const result = await unregisterAllDevices();
      if (!result.success) {
        toast(result.error || t("PushUpdateFailed"), { type: "error" });
        return;
      }
      pushOnThisDeviceSetter(false);
      toast(t("UnregisterAllDevicesSuccess"));
    } catch (error) {
      console.log(error);
      toast(t("PushUpdateFailed"), { type: "error" });
    }
  };

  console.log(language);

  return (
    <>
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
                    nameErrorSetter("");
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
                <p
                  className={
                    "help " + (nameError !== "" ? "is-danger" : "is-primary")
                  }
                >
                  {nameError !== "" ? nameError : t("DisplayNameChange")}
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
          {/********************* country *********************/}
          <div className="field" key="country">
            <label className="label" htmlFor="countrySelect">
              Tell others what country you are playing from (optional)
            </label>
            <div className="control">
              <div className="select">
                <select
                  id="countrySelect"
                  value={country}
                  onChange={(e) => debouncedCountryChange(e.target.value)}
                >
                  <option value={""} key={"country|_blank"}>
                    --Prefer not to say--
                  </option>
                  {countryCodeList
                    .sort((a, b) => a.countryName.localeCompare(b.countryName))
                    .map((entry) => {
                      return (
                        <option
                          value={entry.alpha2}
                          key={`country|${entry.alpha2}`}
                        >
                          {entry.countryName}
                        </option>
                      );
                    })}
                </select>
              </div>
            </div>
          </div>
          {/********************* BGG ID *********************/}
          {globalMe === null ? null : (
            <div className="field" key="bggid">
              <label className="label" htmlFor="bggid">
                BGG user id (optional)
              </label>
              <div className="control">
                <input
                  className="input"
                  name="bggid"
                  type="text"
                  value={bggid}
                  onChange={(e) => bggidSetter(e.target.value)}
                />
                <p className="help">
                  <a
                    style={{ textDecoration: "underline" }}
                    href={`https://boardgamegeek.com/user/${bggid}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Test link
                  </a>
                </p>
              </div>
              {globalMe === undefined || globalMe.bggid === bggid ? null : (
                <div className="control">
                  <button
                    className="button is-small apButton"
                    onClick={saveBGGid}
                  >
                    Save BGG id
                  </button>
                </div>
              )}
            </div>
          )}
          {/********************* About Me *********************/}
          {globalMe === null ? null : (
            <div className="field" key="aboutme">
              <label className="label" htmlFor="aboutme">
                Tell others about yourself (optional;{" "}
                <a
                  href="https://github.github.com/gfm/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Markdown enabled
                </a>
                )
              </label>
              <div className="control">
                <textarea
                  className="textarea"
                  rows={5}
                  value={aboutMe}
                  onChange={(e) => aboutMeSetter(e.target.value)}
                ></textarea>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  className="content help"
                >
                  {aboutMe}
                </ReactMarkdown>
              </div>
              {globalMe === undefined || globalMe.about === aboutMe ? null : (
                <div className="control">
                  <button
                    className="button is-small apButton"
                    onClick={saveAbout}
                  >
                    Save about me
                  </button>
                </div>
              )}
            </div>
          )}

          {/********************* notifications *********************/}
          <div className="field" key="notifications">
            <label className="label">{t("NotificationSettings")}</label>
            {!notifications
              ? ""
              : [
                  "challenges",
                  "gameStart",
                  "gameEnd",
                  "yourturn",
                  "tournamentStart",
                  "tournamentEnd",
                ].map((key) => (
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
          {/********************* push notifications *********************/}
          <div className="field" key="pushNotifications">
            <div className="control">
              <label className="checkbox is-small">
                <input
                  type="checkbox"
                  checked={pushOnThisDevice}
                  onChange={handlePushClick}
                />
                {pushOnThisDevice
                  ? t("PushOnThisDeviceEnabled")
                  : t("PushOnThisDevice")}
              </label>
            </div>
            <div className="control">
              <button
                type="button"
                className="button is-small is-danger is-light"
                onClick={handleUnregisterAllDevices}
              >
                {t("UnregisterAllDevices")}
              </button>
            </div>
          </div>

          {/********************* exploration *********************/}
          {exploration === null ? (
            ""
          ) : (
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
                    onChange={() => handleExplorationChange(-1)}
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
                    onChange={() => handleExplorationChange(0)}
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
                    onChange={() => handleExplorationChange(1)}
                  />
                  {t(`ExploreAlways`)}
                </label>
              </div>

              <div className="field" key="tours" style={{ paddingTop: "1em" }}>
                <div className="control">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={hideTour}
                      onChange={handleTourCheckChange}
                    />
                    {t("HideTours")}
                  </label>
                </div>
              </div>
            </div>
          )}

          {/********************* move confirmation *********************/}
          <div className="field" key="moveConfirm">
            <div className="control">
              <label className="checkbox is-small">
                <input
                  type="checkbox"
                  checked={confirmMove}
                  onChange={handleMoveConfirmChange}
                />
                {t("DisableMoveConfirm")}
              </label>
            </div>
            <p className="help">
              May not work for all games. Let us know if we missed something.
            </p>
          </div>

          {/********************* hide spoilers *********************/}
          <div className="field" key="hideSpoilers">
            <div className="control">
              <label className="checkbox is-small">
                <input
                  type="checkbox"
                  checked={hideSpoilers}
                  onChange={handleHideSpoilersChange}
                />
                {t("HideSpoilers")}
              </label>
            </div>
          </div>

          {/********************* use my player color *********************/}
          <div className="field" key="myColor">
            <div className="control">
              <label className="checkbox is-small">
                <input
                  type="checkbox"
                  checked={myColor}
                  onChange={handleMyColorChange}
                />
                {t("MyColor")}
              </label>
            </div>
            <p className="help">
              Also requires setting up and applying a custom palette.
            </p>
          </div>

          {/* Uncomment this once we have a translation. Also remove the eslint-disable no-unused-vars above
        ******************** Language *********************
        <div className="userSettingsLabelDiv">
          <label className="userSettingsLabel" htmlFor="user_settings_language" >{t("Language")}:</label>
        </div>
        <div className="userSettingsInputDiv">
          { mySettings === null ? <Spinner/> :
            changingLanguage ?
              <select value={language} name="language" id="user_settings_language" onChange={(e) => languageSetter(e.target.value)}>
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

          <div className="field is-grouped">
            <div className="control is-small">
              <button
                className="button is-small apButton"
                onClick={() => showBotsSetter(true)}
              >
                Manage Bots
              </button>
            </div>
          </div>

          {/********************* Log out *********************/}
          <div className="control" style={{ float: "right" }}>
            <button
              className="button is-small apButtonAlert"
              onClick={logout}
              id="logout-button"
            >
              {t("LogOut")}
            </button>
          </div>
        </div>
      </Modal>
      <BotsModal show={showBots} onClose={() => showBotsSetter(false)} />
    </>
  );
}

export default UserSettingsModal;
