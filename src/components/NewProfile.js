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
      <div>{
        (!error)?
        <div>
          <form>
            <label>
              {t('ProfileName')}
              <input name="name" type="text" value={name} onChange={(e) => nameSetter(e.target.value)} />
            </label>
            <label>
              {t('ProfileCountry')}
              <input name="country" type="text" value={country} onChange={(e) => countrySetter(e.target.value)} />
            </label>
            <label>
              {t('ProfileTagline')}
              <input name="tagline" type="text" value={tagline} onChange={(e) => taglineSetter(e.target.value)} />
            </label>
            <label>
              {t('ProfileAnon')}
              <input name="anonymous" type="checkbox" checked={anonymous} onChange={(e) => anonymousSetter(e.target.checked)} />
            </label>
            <label>
              {t('ProfileConsent')}
              <input name="consent" type="checkbox" checked={consent} onChange={(e) => consentSetter(e.target.checked)} />
            </label>
          </form>
        </div>:
        <h4>{errorMessage}</h4>}
      </div>
    </Modal>
  );
}

export default NewProfile;
