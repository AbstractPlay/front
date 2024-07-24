import React, { useState, useEffect, useContext, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Auth } from "aws-amplify";
import { API_ENDPOINT_AUTH, API_ENDPOINT_OPEN } from "../config";
import { MeContext } from "../pages/Skeleton";
import Modal from "./Modal";

function NewProfile(props) {
  const [name, nameSetter] = useState("");
  const [nameError, nameErrorSetter] = useState("");
  const [users, usersSetter] = useState([]);
  const [consent, consentSetter] = useState(false);
  const [consentError, consentErrorSetter] = useState("");
  const [anonymous] = useState(false);
  const [country, countrySetter] = useState("");
  const [tagline, taglineSetter] = useState("");
  const [error, errorSetter] = useState(false);
  const [errorMessage, errorMessageSetter] = useState("");
  const [, globalMeSetter] = useContext(MeContext);
  const { t } = useTranslation();

  const show = props.show;

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append("query", "user_names");
        const res = await fetch(url);
        const result = await res.json();
        console.log("users from user_names request:", result);
        usersSetter(result.map((u) => u.name));
      } catch (error) {
        errorSetter(error);
      }
    }
    if (show) fetchData();
  }, [show]);

  const setError = (message) => {
    errorSetter(true);
    errorMessageSetter(message);
  };

  const nameChange = (newName) => {
    nameSetter(newName);
    if (newName === "") {
      nameErrorSetter(t("NameBlank"));
    } else {
      nameErrorSetter("");
    }
  };

  const consentChange = (checked) => {
    consentSetter(checked);
    if (checked) {
      consentErrorSetter("");
    }
  };

  const handleNewProfile = async () => {
    if (name === "") {
      nameErrorSetter(t("NameBlank"));
    } else if (users.find((u) => u === name)) {
      nameErrorSetter(t("NameNotAvailable", { name }));
    } else if (!consent) {
      consentErrorSetter(t("PleaseConsent"));
    } else {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        console.log("currentAuthenticatedUser", usr);
        await fetch(API_ENDPOINT_AUTH, {
          method: "POST", // or 'PUT'
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
          },
          body: JSON.stringify({
            query: "new_profile",
            pars: {
              name: name,
              consent: consent,
              anonymous: anonymous,
              country: country,
              tagline: tagline,
            },
          }),
        });
        props.handleClose(1);
        if (props.updateMe) {
          try {
            const token = usr.signInUserSession.idToken.jwtToken;
            if (token !== null) {
              try {
                console.log(
                  "calling authQuery 'me' (small), with token: " + token
                );
                const res = await fetch(API_ENDPOINT_AUTH, {
                  method: "POST",
                  headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  // Don't care about e.g. challenges, so size = small.
                  body: JSON.stringify({
                    query: "me",
                    pars: { size: "small" },
                  }),
                });
                const result = await res.json();
                if (result.statusCode !== 200)
                  console.log(JSON.parse(result.body));
                else {
                  if (result === null) globalMeSetter({});
                  else {
                    globalMeSetter((currentGlobalMe) => {
                      return {
                        ...JSON.parse(result.body),
                        ...(currentGlobalMe && {
                          challengesIssued:
                            currentGlobalMe.challengesIssued ?? [],
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
      } catch (err) {
        setError(err.message);
      }
    }
  };

  console.log("NewProfile show", show);
  return (
    <Modal
      show={show}
      title={t("NewProfile")}
      buttons={[
        { label: t("Submit"), action: handleNewProfile },
        { label: t("Close"), action: () => props.handleClose(0) },
      ]}
    >
      {!error ? (
        <Fragment>
          <div className="field">
            <label className="label" htmlFor="profile_name">
              {t("ProfileName")}
            </label>
            <div className="error">{nameError}</div>
            <div className="control">
              <input
                name="name"
                id="profile_name"
                type="text"
                value={name}
                onChange={(e) => nameChange(e.target.value)}
              />
            </div>
            <p className="help">{t("ProfileNameHelp")}</p>
          </div>
          <div className="field">
            <label className="label" htmlFor="profile_country">
              {t("ProfileCountry")}
            </label>
            <div className="control">
              <input
                name="country"
                id="profile_country"
                type="text"
                value={country}
                onChange={(e) => countrySetter(e.target.value)}
              />
            </div>
            <p className="help">
              {t("ProfileCountryHelp")} [
              <a
                href="https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes"
                target="_NEW"
              >
                Wikipedia
              </a>
              ]
            </p>
          </div>
          <div className="field">
            <label className="label" htmlFor="profile_tagline">
              {t("ProfileTagline")}
            </label>
            <div className="control">
              <input
                name="tagline"
                id="profile_tagline"
                type="text"
                value={tagline}
                onChange={(e) => taglineSetter(e.target.value)}
              />
            </div>
          </div>
          {/*
          <div className="field">
            <div className="control">
              <label className="checkbox">
                <input
                  name="anonymous"
                  id="profile_anon"
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => anonymousSetter(e.target.checked)}
                />
                {t("ProfileAnon")}
              </label>
            </div>
            <p className="help">{t("ProfileAnonHelp")}</p>
          </div>
            */}
          <div className="error">{consentError}</div>
          <div className="field">
            <div className="control">
              <label className="checkbox">
                <input
                  name="consent"
                  id="profile_consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => consentChange(e.target.checked)}
                />
                {t("ProfileConsent")}
              </label>
            </div>
            <p className="help">
              [
              <a href="https://play.abstractplay.com/legal" target="_NEW">
                {t("ToS")}
              </a>
              ]
            </p>
          </div>
        </Fragment>
      ) : (
        <h4>{errorMessage}</h4>
      )}
    </Modal>
  );
}

export default NewProfile;
