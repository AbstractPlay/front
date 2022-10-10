import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Auth } from 'aws-amplify';
import { API_ENDPOINT_AUTH } from '../config';
import Modal from './Modal';

function NewProfile(props) {
  const [show, showSetter] = useState(props.show);
  const [name, nameSetter] = useState("");
  const [consent, consentSetter] = useState(false);
  const [anonymous, anonymousSetter] = useState(false);
  const [country, countrySetter] = useState("");
  const [tagline, taglineSetter] = useState("");
  const [error, errorSetter] = useState(false);
  const [errorMessage, errorMessageSetter] = useState("");

  const { t } = useTranslation();

  const setError = (message) => {
    errorSetter(true);
    errorMessageSetter(message);
  }

  const handleNewProfileClose = () => {
    console.log('Logging user out');
    showSetter(false);
  }

  const handleNewProfile = async () => {
    try {
      const usr = await Auth.currentAuthenticatedUser();
      console.log('currentAuthenticatedUser', usr);
      await fetch(API_ENDPOINT_AUTH, {
          method: 'POST', // or 'PUT'
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usr.signInUserSession.idToken.jwtToken}`
          },
          body: JSON.stringify({
            "query": "new_profile",
            "pars" : {
              "name": name,
              "consent": consent,
              "anonymous": anonymous,
              "country": country,
              "tagline": tagline
            }}),
        });
      showSetter(false);
      props.varsSetter({ dummy: usr.signInUserSession.idToken.jwtToken });
    }
    catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal show={show} title={t('NewProfile')} 
      buttons={[{label: t('Submit'), action: handleNewProfile}, {label: t('Close'), action: handleNewProfileClose}]}>
      {
        (!error)?
        <div className="profile">
          <div className="newProfileLabelDiv">
            <div className="newProfileLabel">
              <label htmlFor="profile_name">
                {t('ProfileName')}
              </label>
            </div>
          </div>
          <div className="newProfileInputDiv">
            <input name="name" id="profile_name" type="text" value={name} onChange={(e) => nameSetter(e.target.value)} />
          </div>
          <div className="newProfileLabelDiv">
            <div className="newProfileLabel">
              <label htmlFor="profile_country">
                {t('ProfileCountry')}
              </label>
            </div>
          </div>
          <div className="newProfileInputDiv">
            <input name="country" id="profile_country" type="text" value={country} onChange={(e) => countrySetter(e.target.value)} />
          </div>
          <div className="newProfileLabelDiv">
            <div className="newProfileLabel">
              <label htmlFor="profile_tagline">
                {t('ProfileTagline')}
              </label>
            </div>
          </div>
          <div className="newProfileInputDiv">
            <input name="tagline" id="profile_tagline" type="text" value={tagline} onChange={(e) => taglineSetter(e.target.value)} />
          </div>
          <div className="newProfileLabelDiv">
            <div className="newProfileLabel">
              <label htmlFor="profile_anon">
                {t('ProfileAnon')}
              </label>
            </div>
          </div>
          <div className="newProfileInputDiv">
            <input name="anonymous" id="profile_anon" type="checkbox" checked={anonymous} onChange={(e) => anonymousSetter(e.target.checked)} />
          </div>
          <div className="newProfileLabelDiv">
            <div className="newProfileLabel">
              <label htmlFor="profile_consent">
                {t('ProfileConsent')}
              </label>
            </div>
          </div>
          <div className="newProfileInputDiv">
            <input name="consent" id="profile_consent" type="checkbox" checked={consent} onChange={(e) => consentSetter(e.target.checked)} />
          </div>
        </div>
        :<h4>{errorMessage}</h4>}
    </Modal>
  );
}

export default NewProfile;
