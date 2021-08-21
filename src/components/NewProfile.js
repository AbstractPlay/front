import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import NewProfileMutation from './NewProfileMutation';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { Auth } from 'aws-amplify';
import { useAuth } from '../pages/Skeleton';

function NewProfile(props) {
  const [show, showSetter] = useState(props.show);
  const [name, nameSetter] = useState("");
  const [consent, consentSetter] = useState(false);
  const [anonymous, anonymousSetter] = useState(false);
  const [country, countrySetter] = useState("");
  const [tagline, taglineSetter] = useState("");
  const [error, errorSetter] = useState(false);
  const [errorMessage, errorMessageSetter] = useState("");

  var auth = useAuth();
  const { t } = useTranslation();

  const setError = (message) => {
    errorSetter(true);
    errorMessageSetter(message);
  }

  const handleNewProfileClose = () => {
    console.log('Logging user out');
    auth.setToken(null);
    localStorage.removeItem('token');
    showSetter(false);
  }

  const handleNewProfile = () => {
    Auth.currentAuthenticatedUser()
    .then(usr => {
      console.log('currentAuthenticatedUser', usr);
      auth.setToken(usr.signInUserSession.idToken.jwtToken);
      localStorage.setItem('token', usr.signInUserSession.idToken.jwtToken);
      NewProfileMutation(name, consent, anonymous, country, tagline,
        (response, errors) => {
          if (errors !== null && errors !== undefined && errors.length > 0) {
            setError(errors[0].message);
          }
          else {
            showSetter(false);
            props.varsSetter({ dummy: usr.signInUserSession.idToken.jwtToken });
          }
        },
        setError);
      })
    .catch(() => {
      console.log('Not signed in');
      auth.setToken(null);
      localStorage.removeItem('token');
    });
  }

  return (
    <Modal show={show} onHide={handleNewProfileClose}>
      <Modal.Header closeButton>
        <Modal.Title>New Profile</Modal.Title>
      </Modal.Header>
      <Modal.Body>{
        (!error)?
        <div>
          <h4>Please create your profile.</h4>
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
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleNewProfile}>
          Submit
        </Button>
        <Button variant="primary" onClick={handleNewProfileClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default NewProfile;
