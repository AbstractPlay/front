import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Auth } from 'aws-amplify';
import { API_ENDPOINT_AUTH } from '../config';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { cloneDeep } from 'lodash';

function getSettingAndLevel(setting, deflt, gameSettings, userSettings, metaGame) {
  if (gameSettings !== undefined && gameSettings[setting] !== undefined) {
    return [gameSettings[setting], "game"];
  } else if (userSettings !== undefined) {
    if (userSettings[metaGame] !== undefined && userSettings[metaGame][setting] !== undefined) {
      return [userSettings[metaGame][setting], "meta"];
    } else if (userSettings.all !== undefined && userSettings.all[setting] !== undefined) {
      return [userSettings.all[setting], "all"];
    } else {
      return [deflt, "game"];
    }
  }
  else {
    return [deflt, "game"];
  }
}

function updateSettings(setting, level, val, gameSettings, userSettings, metaGame) {
  if (level === "game") {
    if (gameSettings === undefined) gameSettings = {};
    gameSettings[setting] = val;
  } else if (level === "meta") {
    if (userSettings === undefined) userSettings = {};
    if (userSettings[metaGame] === undefined) userSettings[metaGame] = {};
    userSettings[metaGame][setting] = val;
    if (gameSettings !== undefined && gameSettings[setting] !== undefined) delete gameSettings[setting];
  } else {
    if (userSettings === undefined) userSettings = {};
    if (userSettings.all === undefined) userSettings.all = {};
    userSettings.all[setting] = val;
    if (userSettings[metaGame] !== undefined && userSettings[metaGame][setting] !== undefined) delete userSettings[metaGame][setting];
    if (gameSettings !== undefined && gameSettings[setting] !== undefined) delete gameSettings[setting];
  }
  return [userSettings, gameSettings];
}

function NewChallengeModal(props) {
  const handleClose = props.handleClose;
  const metaGame = props.metaGame.id;
  const metaName = props.metaGame.name;
  const gameId = props.gameId;
  const settings = props.settings;
  const gameSettings = props.gameSettings;
  const show = props.show;
  const [color, colorSetter] = useState(null);
  const [colorLevel, colorLevelSetter] = useState(null);
  const [annotate, annotateSetter] = useState(null);
  const [annotateLevel, annotateLevelSetter] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    // color
    const colorSetting = getSettingAndLevel("color", "standard", gameSettings, settings, metaGame);
    colorSetter(colorSetting[0]);
    colorLevelSetter(colorSetting[1]);
    const annotateSetting = getSettingAndLevel("annotate", true, gameSettings, settings, metaGame);
    annotateSetter(annotateSetting[0]);
    annotateLevelSetter(annotateSetting[1]);
  }, [show, gameSettings, metaGame, settings]);

  const handleColorChange = (color, checked) => {
    if (checked) {
      colorSetter(color);
    } else {
      colorSetter(null);
    }
  }

  const handleColorLevelChange = (level, checked) => {
    if (checked) {
      colorLevelSetter(level);
    } else {
      colorLevelSetter(null);
    }
  }

  const handleAnnotationChange = (checked) => {
    annotateSetter(checked);
  }

  const handleAnnotationLevelChange = (level, checked) => {
    if (checked) {
      annotateLevelSetter(level);
    } else {
      annotateLevelSetter(null);
    }
  }

  const handleSave = async () => {
    props.showSettingsSetter(false);
    let newSettings = cloneDeep(settings);
    let newGameSettings = cloneDeep(gameSettings);
    [newSettings, newGameSettings] = updateSettings("color", colorLevel, color, newGameSettings, newSettings, metaGame);
    [newSettings, newGameSettings] = updateSettings("annotate", annotateLevel, annotate, newGameSettings, newSettings, metaGame);
    props.settingsSetter(newSettings);
    props.gameSettingsSetter(newGameSettings);
    if (newGameSettings !== undefined) {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        console.log('currentAuthenticatedUser', usr);
        await fetch(API_ENDPOINT_AUTH, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usr.signInUserSession.idToken.jwtToken}`
          },
          body: JSON.stringify({
            "query": "update_game_settings",
            "pars" : {
              "game": gameId,
              "settings": newGameSettings
            }})
          });
      }
      catch (error) {
        props.setError(error);
      }
    }
    if (newSettings !== undefined) {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        console.log('currentAuthenticatedUser', usr);
        await fetch(API_ENDPOINT_AUTH, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usr.signInUserSession.idToken.jwtToken}`
          },
          body: JSON.stringify({
            "query": "update_user_settings",
            "pars" : {
              "settings": newSettings
            }})
          });
      }
      catch (error) {
        props.setError(error);
      }
    }
  }

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{t('ChangeRenderOptions')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className='chooseColors'>
          <span className='chooseColorsHeader'>{t("ChooseColors")}</span>
          <div className='pickOneOfColors'>
            <span className='pickOneOfColor'>{t("Color")}</span>
            <div className='radios'>
              <label>
                <input type="radio" name="playerfill" value="standard" checked={color === "standard"} onChange={(e) => handleColorChange(e.target.value, e.target.checked)}/>
                {t('StandardColors')}
              </label>
              <label>
                <input type="radio" name="playerfill" value="blind" checked={color === "blind"} onChange={(e) => handleColorChange(e.target.value, e.target.checked)}/>
                {t('ColorBlind')}
              </label>
              <label>
                <input type="radio" name="playerfill" value="patterns" checked={color === "patterns"} onChange={(e) => handleColorChange(e.target.value, e.target.checked)}/>
                {t('ColorPatterns')}
              </label>
            </div>
          </div>
          <div className='pickOneOfColorsLevel'>
            <span className='pickOneOfColorLevel'>{t("Level")}</span>
            <div className='radios'>
              <label>
                <input type="radio" name="playerfilllevel" value="all" checked={colorLevel === "all"} onChange={(e) => handleColorLevelChange(e.target.value, e.target.checked)}/>
                {t('LevelAll')}
              </label>
              <label>
                <input type="radio" name="playerfilllevel" value="meta" checked={colorLevel === "meta"} onChange={(e) => handleColorLevelChange(e.target.value, e.target.checked)}/>
                {t('LevelMetaGame', {game: metaName})}
              </label>
              <label>
                <input type="radio" name="playerfilllevel" value="game" checked={colorLevel === "game"} onChange={(e) => handleColorLevelChange(e.target.value, e.target.checked)}/>
                {t('LevelGame')}
              </label>
            </div>
          </div>
        </div>
        <div className='chooseAnnotation'>
          <span className='chooseAnnotationsHeader'>{t("ChooseAnnotations")}</span>
          <div className='pickAnnotation'>
            <label><input type="checkbox" onChange={(e) => handleAnnotationChange(e.target.checked)} checked={annotate}/>{t("Annotate")}</label>
          </div>
          <div className='chooseAnnotationLevel'>
            <span className='pickAnnotationLevel'>{t("AnnotationLevel")}</span>
            <div className='radios'>
              <label>
                <input type="radio" name="annotationlevel" value="all" checked={annotateLevel === "all"} onChange={(e) => handleAnnotationLevelChange(e.target.value, e.target.checked)}/>
                {t('LevelAll')}
              </label>
              <label>
                <input type="radio" name="annotationlevel" value="meta" checked={annotateLevel === "meta"} onChange={(e) => handleAnnotationLevelChange(e.target.value, e.target.checked)}/>
                {t('LevelMetaGame', {game: metaName})}
              </label>
              <label>
                <input type="radio" name="annotationlevel" value="game" checked={annotateLevel === "game"} onChange={(e) => handleAnnotationLevelChange(e.target.value, e.target.checked)}/>
                {t('LevelGame')}
              </label>
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleSave}>
          {t('Save')}
        </Button>
        <Button variant="primary" onClick={handleClose}>
          {t('Close')}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default NewChallengeModal;