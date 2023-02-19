import React, { useState, useEffect, useRef, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import Spinner from './Spinner';
import { API_ENDPOINT_AUTH, API_ENDPOINT_OPEN } from '../config';
import { Auth } from 'aws-amplify';
import Modal from './Modal';

function UserSettingsModal(props) {
  const handleUserSettingsClose = props.handleClose;
  const show = props.show;
  // const handleLanguageChange = props.handleLanguageChange;
  // const handleEMailChange = props.handleEMailChange;
  const { t, i18n } = useTranslation();
  const [mySettings, mySettingsSetter] = useState(null);
  const [changingName, changingNameSetter] = useState(false);
  const [changingEMail, changingEMailSetter] = useState(false);
  const [changingCodeSent, changingCodeSentSetter] = useState(false);
  const [changingLanguage, changingLanguageSetter] = useState(false);
  const [name, nameSetter] = useState('');
  const [badname, badnameSetter] = useState('');
  const [nameError, nameErrorSetter] = useState(false);
  const [email, emailSetter] = useState('');
  const [emailCode, emailCodeSetter] = useState('');
  const [language, languageSetter] = useState('');
  const [users, usersSetter] = useState([]);
  const [updated, updatedSetter] = useState(0);

  useEffect(() => {
    async function fetchData() {
      var url = new URL(API_ENDPOINT_OPEN);
      url.searchParams.append('query', 'user_names');
      const res = await fetch(url);
      const result = await res.json();
      console.log("user_names: ", result);
      usersSetter(result.map(u => u.name));
    }
    console.log(`users.length ${users.length}`);
    if (show && users.length === 0)
      fetchData();
    if (show) {
      changingNameSetter(false);
      changingEMailSetter(false);
      changingLanguageSetter(false);
      nameSetter('');
      languageSetter('en');
      emailSetter('');
      emailCodeSetter('');
    }
  },[show]);

  const handleNameChangeClick = () => {
    changingNameSetter(true);
  } 

  const handleNameChangeSubmitClick = async () => {
    if (users.find(u => u === name)) {
      badnameSetter(name);
      nameSetter('');
      nameErrorSetter(true);
    } else {
      changingNameSetter(false);
      await handleSettingChangeSubmit("name", name);
      updatedSetter(updated + 1);
    }
  } 

  const logout = async () => {
    Auth.signOut();
    updatedSetter(updated + 1);
  }

  const handleLanguageChangeSubmitClick = async () => {
    changingLanguageSetter(false);
    await handleSettingChangeSubmit("language", language);
    i18n.changeLanguage(language);
    languageSetter(language);
    updatedSetter(updated + 1);
  } 

  const handleSettingChangeSubmit = async (attr, value) => {
    const usr = await Auth.currentAuthenticatedUser();
    fetch(API_ENDPOINT_AUTH, {
      method: 'POST', // or 'PUT'
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${usr.signInUserSession.idToken.jwtToken}`
      },
      body: JSON.stringify({
        "query": "new_setting",
        "pars" : {
          "attribute": attr,
          "value": value
        }}),
      });
  } 

  const handleEMailChangeClick = () => {
    changingEMailSetter(true);
  }

  const handleLanguageChangeClick = () => {
    changingLanguageSetter(true);
  }

  const handleEMailChangeSubmitClick = async () => {
    const usr = await Auth.currentAuthenticatedUser();
    console.log(usr);
    // await Auth.updateUserAttributes(usr, { email });
    Auth.updateUserAttributes(usr, { email });
    changingCodeSentSetter(true);
  } 

  const handleEMailChangeCodeSubmitClick = async () => {
    const usr = await Auth.currentAuthenticatedUser();
    console.log(usr);
    Auth.verifyCurrentUserAttributeSubmit("email", emailCode);
    changingEMailSetter(false);
    changingCodeSentSetter(false);
  } 

  useEffect(() => {
    async function fetchData() {
      // Auth.currentAuthenticatedUser() will automatically renew the token if its expired.
      const usr = await Auth.currentAuthenticatedUser();
      const token = usr.signInUserSession.idToken.jwtToken;
      try {
        console.log("calling my_settings with token: " + token);
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ "query": "my_settings"}),
        });
        const result = await res.json();
        if (result.statusCode !== 200)
          console.log(JSON.parse(result.body));
        else {
          console.log(result);
          if (result === null)
            mySettingsSetter({});
          else
            mySettingsSetter(JSON.parse(result.body));
        }
      }
      catch (error) {
        console.log(error);
      }
    }
    if (show) {
      mySettingsSetter(null);
      fetchData();
    }
  },[show, updated]);

  console.log(language);

  return (
    <Modal show={show} title={t('UserSettings')} buttons={[{label: t('Close'), action: () => handleUserSettingsClose(updated)}]}>
      <div>
        <div>{t('UserSettings')}</div>
      </div>
      <div className="userSettings">
        {/********************* Display Name *********************/}
        <div className="userSettingsLabelDiv">
          <label className="userSettingsLabel" htmlFor="user_settings_name" >{t("DisplayName")}:</label>
        </div>
        <div className="userSettingsInputDiv">
          { mySettings === null ? <Spinner/> :
            changingName ?
              <input name="name" id="user_settings_name" type="text" value={name} onChange={(e) => { nameErrorSetter(false); nameSetter(e.target.value)}} />
              : mySettings.name
          }
        </div>
        <div className="userSettingsButtonDiv">
          { mySettings === null ? '' :
            changingName ?
            <button className="apButton inlineButton" onClick={handleNameChangeSubmitClick}>{t("Submit")}</button>
            : <button className="apButton inlineButton" onClick={handleNameChangeClick}>{t("Change")}</button>
          }
        </div>
        { mySettings === null || !changingName ? '' :
        <Fragment>
          <div className="userSettingsLabelDiv"/>
          <div className={"userSettingsInputDiv " + (nameError ? "error" : "userSettingsInfo")}>
            {nameError ? t("DisplayNameError", {name: badname}) : t("DisplayNameChange")}
          </div>
          <div className="userSettingsButtonDiv"/>
        </Fragment>
        }
        {/********************* e-mail *********************/}
        <div className="userSettingsLabelDiv">
          <label className="userSettingsLabel" htmlFor="user_settings_email" >{t("EMail")}:</label>
        </div>
        <div className="userSettingsInputDiv">
          { mySettings === null ? <Spinner/> :
            changingEMail ?
              <input name="email" id="user_settings_email" type="text" value={email} onChange={(e) => emailSetter(e.target.value)} />
              : mySettings.email
          }
        </div>
        <div className="userSettingsButtonDiv">
          { mySettings === null ? '' :
            changingEMail ?
              changingCodeSent ? '' : <button className="apButton inlineButton" onClick={handleEMailChangeSubmitClick}>{t("Submit")}</button>
              : <button className="apButton inlineButton" onClick={handleEMailChangeClick}>{t("Change")}</button>
          }
        </div>
        {/********************* e-mail confirmation code *********************/}
        { changingCodeSent ?
          <Fragment>
            <div className="userSettingsLabelDiv">
              <label className="userSettingsLabel" htmlFor="user_settings_email_code" >{t("EMailCode")}:</label>
            </div>
            <div className="userSettingsInputDiv">
              { mySettings === null ? <Spinner/> :
                <input name="email" id="user_settings_email_code" type="text" value={emailCode} onChange={(e) => emailCodeSetter(e.target.value)} />
              }
            </div>
            <div className="userSettingsButtonDiv">
              { mySettings === null ? '' :
                changingEMail ?
                  <button className="apButton inlineButton" onClick={handleEMailChangeCodeSubmitClick}>{t("Submit")}</button>
                  : <button className="apButton inlineButton" onClick={handleEMailChangeClick}>{t("Change")}</button>
              }
            </div>
          </Fragment>
          : ''
        }
        {/********************* Language *********************
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
        <div className="userSettingsLabelDiv">
        </div>
        <div className="userSettingsInputDiv">
        </div>
        <div className="userSettingsButtonDiv">
          <button className="apButton inlineButton" onClick={logout} id="logout-button">{t('LogOut')}</button>
        </div>
      </div>
    </Modal>
  )
}

export default UserSettingsModal;
