import React, { useState, useEffect, useRef, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import Spinner from './Spinner';
import { cloneDeep } from 'lodash';
import { API_ENDPOINT_OPEN } from '../config';
import { gameinfo, GameFactory, addResource } from '@abstractplay/gameslib';
import Modal from './Modal';

function NewChallengeModal(props) {
  const handleNewChallengeClose = props.handleClose;
  const handleNewChallenge = props.handleChallenge;
  const myid = props.id;
  const show = props.show;
  const { t, i18n } = useTranslation();
  const [users, usersSetter] = useState(null);
  const [error, errorSetter] = useState(null);
  const [metaGame, metaGameSetter] = useState(null);
  const [playerCount, playerCountSetter] = useState(-1);
  const [allvariants, allvariantsSetter] = useState(null);
  const [seating, seatingSetter] = useState('');
  const [clockStart, clockStartSetter] = useState(72);
  const [clockInc, clockIncSetter] = useState(24);
  const [clockMax, clockMaxSetter] = useState(240);
  const [clockHard, clockHardSetter] = useState(false);
  const [rated, ratedSetter] = useState(true); // Rated game or not.
  const [standing, standigSetter] = useState(false); // Standing challenge or not.
  const [opponents, opponentsSetter] = useState([]);
  const [nonGroupVariants, nonGroupVariantsSetter] = useState({});
  const groupVariantsRef = useRef({});

  useEffect(() => {
    addResource(i18n.language);
  },[i18n.language]);

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append('query', 'user_names');
        const res = await fetch(url);
        const result = await res.json();
        usersSetter(result);
      }
      catch (error) {
        errorSetter(error);
      }
    }
    fetchData();
  },[]);

  useEffect(() => {
    groupVariantsRef.current = {};
    nonGroupVariantsSetter({});
    metaGameSetter(null);
    playerCountSetter(-1);
    opponentsSetter([]);
    errorSetter("");
    clockStartSetter(72);
    clockIncSetter(24);
    clockMaxSetter(240);
    clockHardSetter(false);
  },[show]);

  const setPlayerCount = (cnt) => {
    playerCountSetter(cnt);
    if (cnt === 2) 
      seatingSetter('');
    else
      seatingSetter('random');
    if (cnt !== -1) {
      opponentsSetter(Array(cnt - 1).fill(''));
    }
  }

  const handleChangeGame = (game) => {
    groupVariantsRef.current = {};
    if (game === "") {
      metaGameSetter(null);
    } else {
      metaGameSetter(game);
      const info = gameinfo.get(game);
      let gameEngine;
      if (info.playercounts.length > 1) {
        gameEngine = GameFactory(info.uid, 2);
      } else {
        gameEngine = GameFactory(info.uid);
      }
      allvariantsSetter(gameEngine.allvariants());
      let ngVariants = {};
      gameEngine.allvariants().filter(v => v.group === undefined).forEach(v => ngVariants[v.uid] = false);
      nonGroupVariantsSetter(ngVariants);
      const playercounts = info.playercounts;
      if (playercounts.length === 1) {
        setPlayerCount(playercounts[0]);
      } else {
        playerCountSetter(-1);
        opponentsSetter([]);
      }
      seatingSetter('');
    }
    errorSetter("");
  }

  const handleChangePlayerCount = (cnt) => {
    setPlayerCount(parseInt(cnt));
    errorSetter("");
  }

  const handleChangeSeating = (seat) => {
    seatingSetter(seat);
    errorSetter("");
  }

  const handleStandingChallengeChange = (event) => {
    standigSetter(!standing);
  }

  const handleChangeOpponent = (data) => {
    let opps = [...opponents];
    opps[data.player] = {"id": data.id, "name": data.name};
    opponentsSetter(opps);
    errorSetter("");
  }

  const handleGroupChange = (group, variant) => {
    // Ref gets updated, so no rerender. The radio buttons aren't "controlled"
    groupVariantsRef.current[group] = variant;
  }

  const handleNonGroupChange = (event) => {
    // State get updated, so rerender. The checkboxes are controlled.
    let ngVariants = cloneDeep(nonGroupVariants);
    ngVariants[event.target.id] = !ngVariants[event.target.id];
    nonGroupVariantsSetter(ngVariants);
  }

  const isNonNegativeInteger = (str, field) => {
    if (str.trim() === '') {
      errorSetter(field + " must have a value");
    } else {
      const num = Number(str);
      if (isNaN(num)) {
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
    clockHardSetter(!clockHard);
  }

  const handleRatedChange = (event) => {
    // ratedSetter(event.target.checked);
    ratedSetter(!rated);
  }

  const handleChallenge = () => {
    if (metaGame === null) {
      errorSetter(t("SelectAGame"));
      return;
    }
    if (playerCount === null || playerCount === -1) {
      errorSetter(t("SelectPlayerCount"));
      return;
    }
    if (seating === null || seating === '') {
      errorSetter(t("SelectSeating"));
      return;
    }
    if (!standing) {
      let ok = true;
      opponents.forEach(o => {
        if (o === '') {
          if (opponents.length === 1)
            errorSetter(t("SelectAnOpponent"));
          else
            errorSetter(t("SelectOpponents", {"count": opponents.length}));
          ok = false;
          return;
        }
      });
      if (!ok)
        return;
    }
    let variants = [];
    for (var group of Object.keys(groupVariantsRef.current)) {
      if (groupVariantsRef.current[group] !== null && groupVariantsRef.current[group] !== '') {
        variants.push(groupVariantsRef.current[group]);
      }
    }
    for (var variant of Object.keys(nonGroupVariants)) {
      if (nonGroupVariants[variant]) {
        variants.push(variant)
      }
    }
    handleNewChallenge({
      "metaGame": metaGame,
      "numPlayers": playerCount,
      "standing": standing,
      "seating": seating,
      "variants": variants,
      "opponents": opponents,
      "clockStart": clockStart,
      "clockInc": clockInc,
      "clockMax": clockMax,
      "clockHard": clockHard,
      "rated": rated
    });
  }

  let games = [];
  gameinfo.forEach((game) => games.push({"id": game.uid, "name": game.name}));
  games.sort((a,b) => (a.name > b.name) ? 1 : -1);
  let groupData = [];
  let nonGroupData = [];
  let playercounts = [];
  if (metaGame !== null) {
    const info = gameinfo.get(metaGame);
    if (allvariants && allvariants !== undefined) {
      const groups = [...new Set(allvariants.filter(v => v.group !== undefined).map(v => v.group))];
      groupData = groups.map(g => {return {"group": g, "variants": allvariants.filter(v => v.group === g).sort((a,b) => (a.uid > b.uid) ? 1 : -1)}});
      nonGroupData = allvariants.filter(v => v.group === undefined).sort((a,b) => (a.uid > b.uid) ? 1 : -1);
    }
    playercounts = info.playercounts;
  }
  if (!(metaGame === null || nonGroupData.length === 0)) {
    console.log("nonGroupData", nonGroupData);
    console.log(nonGroupVariants);
  }
  return (
    <Modal show={show} title={t('NewChallenge')}
      buttons={[{label: t('Challenge'), action: handleChallenge}, {label: t('Close'), action: handleNewChallengeClose}]}>
      <div>
        <div>{t('NewChallenge')}</div>
      </div>
      <div className="challenge">
        <div className="newChallengeLabelDiv">
          <label className="newChallengeLabel" htmlFor="game_for_challenge" >{t("ChooseGame")}</label>
        </div>
        <div className="newChallengeInputDiv">
          { games === null ? <Spinner/> :
            /* Select meta game */
            <select value={metaGame ? metaGame : ''} name="games" id="game_for_challenge" onChange={(e) => handleChangeGame(e.target.value)}>
              <option value="">--{t('Select')}--</option>
              { games.map(game => { return <option key={game.id} value={game.id}>{game.name}</option>}) }
            </select>
          }
        </div>
        { metaGame === null ? '' :
          /* Number of players */          
          <Fragment>
            <div className="newChallengeLabelDiv">
              <label className="newChallengeLabel" htmlFor="num_players_for_challenge" >{t("NumPlayers")}</label>
            </div>
            <div className="newChallengeInputDiv">
                { playercounts.length === 1 ? playercounts[0] :
                  <select value={playerCount} name="playercount" id="num_players_for_challenge" onChange={(e) => handleChangePlayerCount(e.target.value)}>
                    <option value="">--{t('Select')}--</option>
                    { playercounts.map(cnt => { return <option key={cnt} value={cnt}>{cnt}</option>}) }
                  </select>
                }
            </div>
          </Fragment>
        }
        { metaGame === null || playerCount === -1 ? '' :
          <Fragment>
            {/* Seating */}
            <div className="newChallengeLabelDiv">
              <label className="newChallengeLabel" htmlFor="seating_for_challenge" >{t('Seating')}</label>
            </div>
            <div className="newChallengeInputDiv">
                { playerCount !== 2 ? t('SeatingRandom') :
                  <select value={seating} name="playercount" id="seating_for_challenge" onChange={(e) => handleChangeSeating(e.target.value)}>
                    <option key="s0" value="">--{t('Select')}--</option>
                    <option key="s1" value="random">{t('SeatingRandom')}</option>
                    <option key="s2" value="s1">{t('Seating1')}</option>
                    <option key="s3" value="s2">{t('Seating2')}</option>
                  </select>
                }
            </div>
            {/* Standing Challenge */}
            <div className="newChallengeLabelDiv">
              <label className="newChallengeLabel" htmlFor="standing_challenge" >{t('StandingChallengeLabel')}</label>
            </div>
            <div className="newChallengeInputDiv">
              <input type="checkbox" checked={standing} id="standing_challenge" onChange={handleStandingChallengeChange} />
              <label>{standing ? t('StandingChallenge') : t('StandardChallenge')}</label>
            </div>
          </Fragment>
        }
        { playerCount === -1 || standing ? ''
          /* Opponents */
          : opponents.map((o, i) => { return (
            <Fragment key={i}>
              <div className="newChallengeLabelDiv">
                <label className="newChallengeLabel" htmlFor={"user_for_challenge" + i}>{playerCount === 2 ? t("ChooseOpponent") : t("ChooseOpponent", i)}</label>
              </div>
              <div className="newChallengeInputDiv">
                { users === null ? <Spinner/> :
                  <select value={o.id || ''} className="newChallengeInput" name="users" id={"user_for_challenge" + i} onChange={(e) => handleChangeOpponent({'id': e.target.value, 'name': e.target.options[e.target.selectedIndex].text, 'player': i})}>
                    <option value="">--{t('Select')}--</option>
                    { users
                      .filter(user => user.id === opponents[i].id || (user.id !== myid && !opponents.some(o => user.id === o.id)))
                      .map(item => { return <option key={item.id} value={item.id}>{item.name}</option>})}
                  </select>
                }
              </div>
            </Fragment>)
            })
        }
        { groupData.length === 0 && nonGroupData.length === 0 ? '' :
          <div className="newChallengeVariantContainer">
            <span className='pickVariantHeader'>{t("PickVariant")}</span>
            { metaGame === null || groupData.length === 0 ? '' :
              groupData.map(g =>
                <div className="pickVariant" key={"group:" + g.group} onChange={(e) => handleGroupChange(g.group, e.target.value)}>
                  <legend>{t("PickOneVariant")}</legend>
                  <div className="pickVariantVariant">
                    <div className="pickVariantRadio" key="default">
                      <input type="radio" id="default" value="" name={g.group}/>
                    </div>
                    <div className="pickVariantLabel">
                      <label htmlFor="default">{`Default ${g.group}`} </label>
                    </div>
                    { g.variants.map(v =>
                      <Fragment key={v.uid}>
                        <div className="pickVariantRadio">
                          <input type="radio" id={v.uid} value={v.uid} name={g.group}/>
                        </div>
                        <div className="pickVariantLabel">
                          <label htmlFor={v.uid}> 
                            {v.name} 
                          </label>
                        </div>
                        { v.description === undefined || v.description.length == 0 ? '' :
                          <Fragment key={"desc" + v.uid}>
                            <div className="pickVariantRadio variantDescription">
                            </div>
                            <div className="pickVariantLabel variantDescription">
                              <span>{v.description}</span>
                            </div>
                          </Fragment>
                        }
                        </Fragment>
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
                    <Fragment key={v.uid}>
                      <div key={v.uid}>
                        <input type="checkbox" id={v.uid} checked={nonGroupVariants[v.uid]} onChange={handleNonGroupChange} />
                      </div>
                      <div>
                        <label htmlFor={v.uid}>
                          {v.name}
                        </label>
                      </div>
                      { v.description === undefined || v.description.length == 0 ? '' :
                        <Fragment key={"desc" + v.uid}>
                          <div className="pickVariantRadio variantDescription">
                          </div>
                          <div className="pickVariantLabel variantDescription">
                            <span>{v.description}</span>
                          </div>
                        </Fragment>
                      }
                    </Fragment>)
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
            <input type="checkbox" id="clock_hard" checked={clockHard} onChange={handleClockHardChange} />
            <span className="challengeHelp">{clockHard ? t("HelpClockHard") : t("HelpClockSoft")}</span>
          </div>
          <div className="newChallengeLabelDiv">
            <label className="newChallengeLabel" htmlFor="rated">{t("ChooseRated")}</label>
          </div>
          <div className="newChallengeInputDiv">
            <input type="checkbox" id="rated" checked={rated} onChange={handleRatedChange} />
            <span className="challengeHelp">{ rated ? t("HelpRated") : t("HelpUnRated")}</span>
          </div>
      </div>
      <div className="error">
        {error}
      </div>
    </Modal>
  )
}

export default NewChallengeModal;
