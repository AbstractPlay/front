/* eslint-disable no-prototype-builtins */
import React, {
  useContext,
  useState,
  useEffect,
  Fragment,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import Spinner from "./Spinner";
import { cloneDeep } from "lodash";
import { API_ENDPOINT_AUTH } from "../config";
import { Auth } from "aws-amplify";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import { debounce } from "lodash";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { MeContext, UsersContext } from "../pages/Skeleton";
import Modal from "./Modal";
import { useStorageState } from "react-use-storage-state";
import { countryCodeList } from "../lib/countryCodeList";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { render } from "@abstractplay/renderer";

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
  const [users, usersSetter] = useContext(UsersContext);
  const [user, userSetter] = useState(null);
  const [updated, updatedSetter] = useState(0);
  const [notifications, notificationsSetter] = useState(null);
  const [exploration, explorationSetter] = useState(null);
  const [confirmMove, confirmMoveSetter] = useState(true);
  const [globalMe, globalMeSetter] = useContext(MeContext);
  const [showPlayTour, showPlayTourSetter] = useStorageState(
    "joyride-play-show",
    true
  );
  const [hideTour, hideTourSetter] = useState(!showPlayTour);
  const [hideSpoilers, hideSpoilersSetter] = useState(false);
  const [myColor, myColorSetter] = useState(false);
  // palettes
  const [showPalette, showPaletteSetter] = useState(false);
  const [myPalettes, myPalettesSetter] = useState([]);
  const [currColours, currColoursSetter] = useState([]);
  const [selectedColour, selectedColourSetter] = useState("fff");
  const [paletteName, paletteNameSetter] = useState("");
  const [showContext, showContextSetter] = useState(false);
  const [storedContextLight, storedContextLightSetter] = useStorageState(
    "stored-context-light",
    {
      background: "#fff",
      strokes: "#000",
      borders: "#000",
      labels: "#000",
      annotations: "#000",
      fill: "#000",
    }
  );
  const [storedContextDark, storedContextDarkSetter] = useStorageState(
    "stored-context-dark",
    {
      background: "#222",
      strokes: "#6d6d6d",
      borders: "#000",
      labels: "#009fbf",
      annotations: "#99cccc",
      fill: "#e6f2f2",
    }
  );
  const [currContext, currContextSetter] = useState("dark");
  const [currBackground, currBackgroundSetter] = useState("");
  const [currFill, currFillSetter] = useState("");
  const [currStrokes, currStrokesSetter] = useState("");
  const [currBorders, currBordersSetter] = useState("");
  const [currLabels, currLabelsSetter] = useState("");
  const [currNotes, currNotesSetter] = useState("");

  useEffect(() => {
    if (
      globalMe !== undefined &&
      globalMe !== null &&
      globalMe.palettes !== undefined
    ) {
      myPalettesSetter([...globalMe.palettes]);
    } else {
      myPalettesSetter([]);
    }
  }, [globalMe]);

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
      changingNameSetter(false);
      await handleSettingChangeSubmit("name", name);
      updatedSetter((updated) => updated + 1);
    }
  };

  const handleCountryChange = async (newCountry) => {
    await handleSettingChangeSubmit("country", newCountry);
    countrySetter(newCountry);
    updatedSetter((updated) => updated + 1);
  };

  const debouncedCountryChange = useCallback(
    debounce(handleCountryChange, 300),
    []
  );

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

  const saveBGGid = () => {
    handleSettingChangeSubmit("bggid", bggid);
    globalMeSetter((val) => ({ ...val, bggid }));
    usersSetter((val) =>
      val.map((u) => (u.id === globalMe?.id ? { ...u, bggid } : u))
    );
  };
  const saveAbout = () => {
    handleSettingChangeSubmit("about", aboutMe);
    globalMeSetter((val) => ({ ...val, about: aboutMe }));
    usersSetter((val) =>
      val.map((u) => (u.id === globalMe?.id ? { ...u, about: aboutMe } : u))
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

  const handleContextChange = (mode) => {
    currContextSetter(mode);
    let context;
    if (mode === "dark") {
      context = storedContextDark;
    } else if (mode === "light") {
      context = storedContextLight;
    }
    if (context !== undefined && context !== null) {
      currBackgroundSetter(context.background);
      currBordersSetter(context.borders);
      currFillSetter(context.fill);
      currStrokesSetter(context.strokes);
      currLabelsSetter(context.labels);
      currNotesSetter(context.annotations);
    }
  };

  const resetContext = () => {
    if (currContext === "light") {
      storedContextLightSetter({
        background: "#fff",
        strokes: "#000",
        borders: "#000",
        labels: "#000",
        annotations: "#000",
        fill: "#000",
      });
    } else if (currContext === "dark") {
      storedContextDarkSetter({
        background: "#222",
        strokes: "#6d6d6d",
        borders: "#000",
        labels: "#009fbf",
        annotations: "#99cccc",
        fill: "#e6f2f2",
      });
    }
    handleContextChange(currContext);
  };

  const saveContext = () => {
    let setter;
    if (currContext === "light") {
      setter = storedContextLightSetter;
    } else if (currContext === "dark") {
      setter = storedContextDarkSetter;
    }
    if (setter !== null && setter !== undefined) {
      setter({
        background: currBackground,
        strokes: currStrokes,
        borders: currBorders,
        fill: currFill,
        labels: currLabels,
        annotations: currNotes,
      });
    }
    showContextSetter(false);
  };

  useEffect(() => {
    if (showContext) {
      const svg = document.getElementById("contextSample");
      if (svg !== null) svg.remove();
      const json = JSON.parse(
        `{"board":{"style":"squares-checkered","width":4,"height":4},"legend":{"A":{"name":"piece","colour":1},"B":{"name":"piece","colour":2},"C":{"name":"piece","colour":3},"D":{"name":"piece","colour":4}},"pieces":"AAB-\\nA-BB\\nC--D\\nCCDD","annotations":[{"type":"move","targets":[{"row":0,"col":3},{"row":1,"col":2}]}]}`
      );
      const options = {
        divid: "contextSampleRender",
        svgid: "contextSample",
        colourContext: {
          fill: currFill,
          strokes: currStrokes,
          borders: currBorders,
          background: currBackground,
          labels: currLabels,
          annotations: currNotes,
        },
      };
      try {
        render(json, options);
      } catch (e) {
        console.log(`An error occurred while trying to render a sample:`);
        console.log(e);
      }
    }
  }, [
    showContext,
    currFill,
    currStrokes,
    currBorders,
    currBackground,
    currLabels,
    currNotes,
  ]);

  const savePalettes = async () => {
    try {
      const usr = await Auth.currentAuthenticatedUser();
      const res = await fetch(API_ENDPOINT_AUTH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
        },
        body: JSON.stringify({
          query: "save_palettes",
          pars: {
            palettes: myPalettes,
          },
        }),
      });
      if (res.status !== 200) {
        const result = await res.json();
        console.log(`An error occurred while saving palettes:\n${result}`);
      } else {
        // update globalMe palettes
        const newMe = JSON.parse(JSON.stringify(globalMe));
        newMe.palettes = myPalettes;
        globalMeSetter(newMe);
      }
    } catch (error) {
      console.log(error);
    }
    showPaletteSetter(false);
  };

  const addColour = () => {
    if (!currColours.includes(selectedColour)) {
      currColoursSetter((lst) => [...lst, selectedColour]);
    }
  };

  const addPalette = () => {
    let paletteMap = new Map();
    if (myPalettes.length > 0) {
      for (const { name, colours } of myPalettes) {
        paletteMap.set(name, [...colours]);
      }
    }
    paletteMap.set(paletteName, [...currColours]);
    myPalettesSetter(
      [...paletteMap.entries()].map(([name, lst]) => {
        return { name, colours: [...lst] };
      })
    );
    paletteNameSetter("");
    currColoursSetter([]);
  };

  const delPalette = (name) => {
    const idx = myPalettes.findIndex((p) => p.name === name);
    if (idx !== -1) {
      const palettes = [...myPalettes];
      palettes.splice(idx, 1);
      myPalettesSetter([...palettes]);
    }
  };

  const delColour = (colour) => {
    const idx = currColours.findIndex((c) => c === colour);
    if (idx !== -1) {
      const newlst = [...currColours];
      newlst.splice(idx, 1);
      currColoursSetter([...newlst]);
    }
  };

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
              body: JSON.stringify({ query: "me", pars: { size: "small" } }),
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
                      challengesReceived:
                        currentGlobalMe.challengesReceived ?? [],
                      challengesAccepted:
                        currentGlobalMe.challengesAccepted ?? [],
                      standingChallenges:
                        currentGlobalMe.standingChallenges ?? [],
                    }),
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
  }, [globalMeSetter, updated, show]);

  const handlePushClick = async () => {
    try {
      let state = true;
      if (
        globalMe !== null &&
        "mayPush" in globalMe &&
        globalMe.mayPush === true
      ) {
        state = false;
      }
      const usr = await Auth.currentAuthenticatedUser();
      const res = await fetch(API_ENDPOINT_AUTH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
        },
        body: JSON.stringify({
          query: "set_push",
          pars: {
            state,
          },
        }),
      });
      if (res.status !== 200) {
        console.log(`An error occurred while saving push preferences`);
      } else {
        const result = await res.json();
        console.log(result.body);
        const newMe = JSON.parse(JSON.stringify(globalMe));
        newMe.mayPush = state;
        globalMeSetter(newMe);
      }
    } catch (error) {
      console.log(error);
    }
  };

  /* Default palette colors from the renderer. */
  const presetColors = [
    "#e31a1c",
    "#1f78b4",
    "#33a02c",
    "#ffff99",
    "#6a3d9a",
    "#ff7f00",
    "#b15928",
    "#fb9a99",
    "#a6cee3",
    "#b2df8a",
    "#fdbf6f",
    "#cab2d6",
  ];
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
                  checked={
                    globalMe !== null &&
                    "mayPush" in globalMe &&
                    globalMe.mayPush === true
                  }
                  onChange={handlePushClick}
                />
                {globalMe !== null &&
                "mayPush" in globalMe &&
                globalMe.mayPush === true
                  ? t("DisablePush")
                  : t("EnablePush")}
              </label>
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
            <p class="help">
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
            <p class="help">
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
                onClick={() => showPaletteSetter(true)}
              >
                Manage Palettes
              </button>
            </div>
            <div className="control is-small">
              <button
                className="button is-small apButton"
                onClick={() => {
                  handleContextChange("dark");
                  showContextSetter(true);
                }}
              >
                Manage Colour Contexts
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
      {/** Palette modal */}
      <Modal
        show={showPalette}
        title={t("ManagePalettes")}
        buttons={[
          { label: t("SaveChanges"), action: savePalettes },
          {
            label: t("Close"),
            action: () => showPaletteSetter(false),
          },
        ]}
      >
        <div className="content">
          <p>
            Palettes are lists of colours you want the front end to use when
            generating game boards. You must provide at least two colours, four
            is wise, but eight to twelve is ideal (you can create as many as you
            like, but very few games use a full palette). If you have checked
            the "Use my preferred player colour" option, then the first colour
            of a palette will be your personal player colour, otherwise colours
            are simply applied to each player in order.
          </p>
          <p>
            Once defined, you can apply a palette to some or all supported games
            by clicking the gear icon that appears below the game board. Your
            palettes will <em>not</em> be visible to your fellow players. They
            will only affect <em>your</em> experience.
          </p>
          <p>
            Palettes won't necessarily work for all games. Some games have
            hard-coded colours. If you run into any trouble, please{" "}
            <a href="https://discord.abstractplay.com">join us on Discord</a>{" "}
            and let us know.
          </p>
        </div>
        <div className="columns">
          <div className="column">
            <div className="field">
              <label className="label is-small" htmlFor="paletteName">
                Name the palette
              </label>
              <div className="control">
                <input
                  className="input is-small"
                  id="paletteName"
                  type="text"
                  value={paletteName}
                  onChange={(e) => paletteNameSetter(e.target.value)}
                />
              </div>
            </div>
            <div>
              <p className="help">Click to delete a colour</p>
              {currColours
                .map((c, i) => (
                  <span
                    className="shadowed"
                    style={{ backgroundColor: c }}
                    onClick={() => delColour(c)}
                  >
                    Player {i + 1} ({c})
                  </span>
                ))
                .reduce(
                  (acc, x) =>
                    acc === null ? (
                      x
                    ) : (
                      <>
                        {acc} {x}
                      </>
                    ),
                  null
                )}
            </div>
          </div>
          <div className="column">
            <div className="field">
              <label className="label is-small" htmlFor="colorSelect">
                Choose a colour
              </label>
              <div className="control" id="colorSelect">
                <div className="picker">
                  <HexColorPicker
                    color={selectedColour}
                    onChange={selectedColourSetter}
                  />
                  <div className="picker-swatches">
                    {presetColors.map((presetColor) => (
                      <button
                        key={presetColor}
                        className="picker-swatch"
                        style={{ background: presetColor }}
                        onClick={() => selectedColourSetter(presetColor)}
                      />
                    ))}
                  </div>
                </div>
                <HexColorInput
                  color={selectedColour}
                  onChange={selectedColourSetter}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="field is-grouped">
          <div className="control">
            <button
              className="button is-small apButton"
              onClick={addColour}
              disabled={selectedColour === ""}
            >
              Add colour
            </button>
          </div>
          <div className="control">
            <button
              className="button is-small apButton"
              onClick={addPalette}
              disabled={
                paletteName === "" ||
                paletteName === "standard" ||
                paletteName === "blind" ||
                currColours.length < 2
              }
            >
              Add Palette
            </button>
          </div>
        </div>
        {myPalettes.length === 0 ? null : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Colours</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {myPalettes.map(({ name, colours }) => (
                <tr key={`palette|${name}`}>
                  <td>{name}</td>
                  <td>
                    {colours
                      .map((c, i) => (
                        <span
                          className="shadowed"
                          style={{ backgroundColor: c }}
                          onClick={() => delColour(c)}
                        >
                          Player {i + 1} ({c})
                        </span>
                      ))
                      .reduce(
                        (acc, x) =>
                          acc === null ? (
                            x
                          ) : (
                            <>
                              {acc} {x}
                            </>
                          ),
                        null
                      )}
                  </td>
                  <td>
                    <span className="icon" onClick={() => delPalette(name)}>
                      <i className="fa fa-times-circle" aria-hidden="true"></i>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
      {/** Context modal */}
      <Modal
        show={showContext}
        title={t("ManageContexts")}
        buttons={[
          {
            label: t("Close"),
            action: () => showContextSetter(false),
          },
        ]}
      >
        <div className="content">
          <p>
            Colour contexts are sets of colours that the renderer uses when
            drawing boards in different settings, like dark mode. You can tweak
            how your boards appear globally by changing the six values here.
            Game-specific customizations are possible using the Custom CSS
            button below any game board.
          </p>
          <p>
            These customizations will <em>not</em> be visible to your fellow
            players. These will only affect <em>your</em> experience.
          </p>
          <p>
            If you run into any trouble, please{" "}
            <a href="https://discord.abstractplay.com">join us on Discord</a>{" "}
            and let us know.
          </p>
        </div>
        <div className="field">
          <label className="label is-small" htmlFor="selectMode">
            Select the mode to customize
          </label>
          <div className="control is-small">
            <div className="select is-small">
              <select
                value={currContext}
                name="selectMode"
                id="selectMode"
                onChange={(e) => handleContextChange(e.target.value)}
              >
                <option value="dark">Dark mode</option>
                <option value="light">Light mode</option>
              </select>
            </div>
          </div>
        </div>
        <div className="columns is-multiline">
          <div className="column is-narrow">
            <div className="field">
              <label className="label is-small" htmlFor="valBackground">
                Board background
              </label>
              <div className="control" id="valBackground">
                <HexColorPicker
                  color={currBackground}
                  onChange={currBackgroundSetter}
                />
                <HexColorInput
                  color={currBackground}
                  onChange={currBackgroundSetter}
                />
              </div>
            </div>
          </div>
          <div className="column is-narrow">
            <div className="field">
              <label className="label is-small" htmlFor="valStrokes">
                Gridlines and most other lines
              </label>
              <div className="control" id="valStrokes">
                <HexColorPicker
                  color={currStrokes}
                  onChange={currStrokesSetter}
                />
                <HexColorInput
                  color={currStrokes}
                  onChange={currStrokesSetter}
                />
              </div>
            </div>
          </div>
          <div className="column is-narrow">
            <div className="field">
              <label className="label is-small" htmlFor="valBorders">
                Borders around most pieces
              </label>
              <div className="control" id="valBorders">
                <HexColorPicker
                  color={currBorders}
                  onChange={currBordersSetter}
                />
                <HexColorInput
                  color={currBorders}
                  onChange={currBordersSetter}
                />
              </div>
            </div>
          </div>
          <div className="column is-narrow">
            <div className="field">
              <label className="label is-small" htmlFor="valFills">
                Fills, like blocked cells and some glyphs
              </label>
              <div className="control" id="valFills">
                <HexColorPicker color={currFill} onChange={currFillSetter} />
                <HexColorInput color={currFill} onChange={currFillSetter} />
              </div>
            </div>
          </div>
          <div className="column is-narrow">
            <div className="field">
              <label className="label is-small" htmlFor="valLabels">
                Board labels
              </label>
              <div className="control" id="valLabels">
                <HexColorPicker
                  color={currLabels}
                  onChange={currLabelsSetter}
                />
                <HexColorInput color={currLabels} onChange={currLabelsSetter} />
              </div>
            </div>
          </div>
          <div className="column is-narrow">
            <div className="field">
              <label className="label is-small" htmlFor="valNotes">
                Annotations, like movement arrows
              </label>
              <div className="control" id="valNotes">
                <HexColorPicker color={currNotes} onChange={currNotesSetter} />
                <HexColorInput color={currNotes} onChange={currNotesSetter} />
              </div>
            </div>
          </div>
        </div>
        <div
          id="contextSampleRender"
          width="100%"
          style={{ backgroundColor: currBackground }}
        ></div>
        <div>
          <div className="control">
            <button className="button is-small apButton" onClick={resetContext}>
              Reset to defaults
            </button>
          </div>
          <div className="control">
            <button className="button is-small apButton" onClick={saveContext}>
              Save changes
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default UserSettingsModal;
