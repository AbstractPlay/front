import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Spinner from './Spinner';
import { API_ENDPOINT_OPEN } from '../config';
import { gameinfo } from '@abstractplay/gameslib';
import Modal from './Modal';

function NewChallengeModal(props) {
  const handleNewChallengeClose = props.handleClose;
  const handleNewChallenge = props.handleChallenge;
  const myid = props.id;
  const show = props.show;
  const { t } = useTranslation();
  const [users, usersSetter] = useState(null);
  const [error, errorSetter] = useState(null);
  const [metaGame, metaGameSetter] = useState(null);
  const [clockStart, clockStartSetter] = useState(72);
  const [clockInc, clockIncSetter] = useState(24);
  const [clockMax, clockMaxSetter] = useState(240);
  const [clockHard, clockHardSetter] = useState(false);
  const playerRef = useRef(null);
  const groupVariantsRef = useRef({});
  const nonGroupVariantsRef = useRef({})

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append('query', 'user_names');
        const res = await fetch(url);
        const result = await res.json();
        console.log(result);
        usersSetter(result);
      }
      catch (error) {
        errorSetter(error);
      }
    }
    fetchData();
  },[]);

  useEffect(() => {
    playerRef.current = null;
    groupVariantsRef.current = {};
    nonGroupVariantsRef.current = {};
    metaGameSetter(null);
    errorSetter("");
    clockStartSetter(72);
    clockIncSetter(24);
    clockMaxSetter(240);
    clockHardSetter(false);
  },[show]);

  const handleChangeGame = (game) => {
    groupVariantsRef.current = {};
    nonGroupVariantsRef.current = {};
    if (game === "") {
      metaGameSetter(null);
    } else {
      metaGameSetter(game);
    }
    errorSetter("");
  }

  const handleChangePlayer = (player) => {
    if (player === "") {
      playerRef.current = null;
    } else {
      playerRef.current = player;
    }
    errorSetter("");
  }

  const handleGroupChange = (group, variant) => {
    groupVariantsRef.current[group] = variant;
  }

  const handleNonGroupChange = (variant, flag) => {
    nonGroupVariantsRef.current[variant] = flag;
  }

  const isNonNegativeInteger = (str, field) => {
    if (str.trim() === '') {
      errorSetter(field + " must have a value");
    } else {
      const num = Number(str);
      if (num === NaN) {
        errorSetter(field + " must be a number");
      } else {
        if (num < 0) {
          errorSetter(field + " can't be negative");
        } else {
          if (!Number.isInteger(num)) {
            errorSetter(field + " must be an integer");
          } else {
            errorSetter(null);
          }
        }
      }
    }
  }

  const handleClockStartChange = (event) => {
    isNonNegativeInteger(event.target.value, t("ChooseClockStart"));
    clockStartSetter(event.target.value);
  }

  const handleClockIncChange = (event) => {
    isNonNegativeInteger(event.target.value, t("ChooseClockIncrement"));
    clockIncSetter(event.target.value);
  }

  const handleClockMaxChange = (event) => {
    isNonNegativeInteger(event.target.value, t("ChooseClockMax"));
    clockMaxSetter(event.target.value);
  }

  const handleClockHardChange = (event) => {
    clockHardSetter(event.target.checked);
  }

  const handleChallenge = () => {
    if (metaGame === null) {
      errorSetter(t("SelectAGame"));
    } else if (playerRef.current === null) {
      errorSetter(t("SelectAnOpponent"));
    } else {
      let variants = [];
      for (var group of Object.keys(groupVariantsRef.current)) {
        if (groupVariantsRef.current[group] !== null) {
          variants.push(groupVariantsRef.current[group]);
        }
      }
      for (var variant of Object.keys(nonGroupVariantsRef.current)) {
        if (nonGroupVariantsRef.current[variant]) {
          variants.push(variant)
        }
      }
      handleNewChallenge({"metaGame": metaGame, "variants": variants, "opponent": playerRef.current, "clockStart": clockStart, "clockInc": clockInc, "clockMax": clockMax, "clockHard": clockHard});
    }
  }

  let games = [];
  gameinfo.forEach((game) => games.push({"id": game.uid, "name": game.name}));
  games.sort((a,b) => (a.name > b.name) ? 1 : -1);
  let groupData = [];
  let nonGroupData = [];
  if (metaGame !== null) {
    const info = gameinfo.get(metaGame);
    if (info.variants !== undefined) {
      const groups = [...new Set(info.variants.filter(v => v.group !== undefined).map(v => v.group))];
      groupData = groups.map(g => {return {"group": g, "variants": info.variants.filter(v => v.group === g).sort((a,b) => (a.uid > b.uid) ? 1 : -1)}});
      nonGroupData = info.variants.filter(v => v.group === undefined).sort((a,b) => (a.uid > b.uid) ? 1 : -1);
    }
  }

  return (
    <Modal show={show} title={t('NewChallenge')}
      buttons={[{label: t('Challenge'), action: handleChallenge}, {label: t('Close'), action: handleNewChallengeClose}]}>
      <div>
        <div>{t('NewChallenge')}</div>
      </div>
      <div className="challenge">
        <div className="newChallengeLabelDiv">
          <label className="newChallengeLabel" htmlFor="user_for_challenge">{t("ChooseOpponent")}</label>
        </div>
        <div className="newChallengeInputDiv">
          { users === null ? <Spinner/> :
            <select className="newChallengeInput" name="users" id="user_for_challenge" onChange={(e) => handleChangePlayer({id: e.target.value, name: e.target.options[e.target.selectedIndex].text})}>
              <option value="">--{t('Select')}--</option>
              { users
                .filter(user => user.id !== myid)
                .map(item => { return <option key={item.id} value={item.id}>{item.name}</option>})}
            </select>
          }
        </div>
        <div className="newChallengeLabelDiv">
          <label className="newChallengeLabel" htmlFor="game_for_challenge" >{t("ChooseGame")}</label>
        </div>
        <div className="newChallengeInputDiv">
          { games === null ? <Spinner/> :
            <select name="games" id="game_for_challenge" onChange={(e) => handleChangeGame(e.target.value)}>
              <option value="">--{t('Select')}--</option>
              { games.map(game => { return <option key={game.id} value={game.id}>{game.name}</option>}) }
            </select>
          }
        </div>
        { groupData.length === 0 && nonGroupData.length === 0 ? '' :
          <div className="newChallengeVariantContainer">
            <span className='pickVariantHeader'>{t("PickVariant")}</span>
            { metaGame === null || groupData.length === 0 ? '' :
              groupData.map(g =>
                <div className="pickVariant "key={"group:" + g.group} onChange={(e) => handleGroupChange(g.group, e.target.value)}>
                  <legend>{t("PickOneVariant")}</legend>
                  <div className="pickVariantVariant">
                    <div key="default">
                      <input type="radio" id="default" value="" name={g.group}/>
                      <label htmlFor="default"> Default {g.group} </label>
                    </div>
                    { g.variants.map(v =>
                          <div key={v.uid}>
                            <input type="radio" id={v.uid} value={v.uid} name={g.group}/>
                            <label htmlFor={v.uid}> {v.name} </label>
                          </div>
                        )
                      }
                  </div>
                </div>
              )
            }
            { metaGame === null || nonGroupData.length === 0 ? '' :
              <div className="pickVariant">
                <legend>{t("PickAnyVariant")}</legend>
                <div className="pickVariantVariant">
                  { nonGroupData.map(v =>
                    <div key={v.uid}>
                      <input type="checkbox" id={v.uid} value={v.uid} onChange={(e) => handleNonGroupChange(e.target.value, e.target.checked)} />
                      <label htmlFor={v.uid}>{v.name}</label>
                    </div>)
                  }
                </div>
              </div>
            }
          </div>
        }
          <span className="clockHeader">{t("ConfigureClock")}</span>
          <div className="newChallengeLabelDiv">
            <label className="newChallengeLabel" htmlFor="clock_start">{t("ChooseClockStart") + ":"}</label>
          </div>
          <div className="newChallengeInputDiv">
            <input type="text" id="clock_start" name="clock_start" size="3" value={clockStart} onChange={handleClockStartChange}/>
            <span className="challengeHelp">{t("HelpClockStart")}</span>
          </div>
          <div className="newChallengeLabelDiv">
            <label className="newChallengeLabel" htmlFor="clock_inc">{t("ChooseClockIncrement") + ":"}</label>
          </div>
          <div className="newChallengeInputDiv">
            <input type="text" id="clock_inc" name="clock_inc" size="3" value={clockInc} onChange={handleClockIncChange}/>
            <span className="challengeHelp">{t("HelpClockIncrement")}</span>
          </div>
          <div className="newChallengeLabelDiv">
            <label className="newChallengeLabel" htmlFor="clock_max">{t("ChooseClockMax") + ":"}</label>
          </div>
          <div className="newChallengeInputDiv">
            <input type="text" id="clock_start" name="clock_max" size="3" value={clockMax} onChange={handleClockMaxChange}/>
            <span className="challengeHelp">{t("HelpClockMax")}</span>
          </div>
          <div className="newChallengeLabelDiv">
            <label className="newChallengeLabel" htmlFor="clock_hard">{t("ChooseClockHard")}</label>
          </div>
          <div className="newChallengeInputDiv">
            <input type="checkbox" id="clock_hard" value={clockHard} onChange={handleClockHardChange} />
            <span className="challengeHelp">{t("HelpClockHard")}</span>
          </div>

      </div>
      <div className="error">
        {error}
      </div>
    </Modal>
  )
}

export default NewChallengeModal;
