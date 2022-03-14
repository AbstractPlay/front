import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Spinner from './Spinner';
import { API_ENDPOINT_OPEN } from '../config';
import { gameinfo } from '@abstractplay/gameslib';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

function NewChallengeModal(props) {
  const handleNewChallengeClose = props.handleClose;
  const handleNewChallenge = props.handleChallenge;
  const myid = props.id;
  const show = props.show;
  const { t } = useTranslation();
  const [users, usersSetter] = useState(null);
  const [error, errorSetter] = useState(null);
  const [metaGame, metaGameSetter] = useState(null);
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

  const handleChallenge = () => {
    if (metaGame === null) {
      errorSetter(t("SelectAGame"));
    } else if (playerRef.current == null) {
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
      handleNewChallenge({"metaGame": metaGame, "variants": variants, "opponent": playerRef.current});
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
    <Modal show={show} onHide={handleNewChallengeClose}>
      <Modal.Header closeButton>
        <Modal.Title>{t('NewChallenge')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="challenge">
          <div className="form-group row">
            { error === "" ? '' : <div className="error">{error}</div>}
            <label for="game_for_challenge" className="col-sm-5 col-form-label text-right">{t("ChooseGame")}</label>
            <div className="col-sm-7">
            { games === null ? <Spinner/> :
                <select className="form-control" name="games" id="game_for_challenge" onChange={(e) => handleChangeGame(e.target.value)}>
                  <option value="">--{t('Select')}--</option>
                  { games.map(game => { return <option key={game.id} value={game.id}>{game.name}</option>}) }
                </select>
            }
            </div>
          </div>
          <div className="form-group row">
            <label for="user_for_challenge" className="col-sm-5 col-form-label  text-right">{t("ChooseOpponent")}</label>
            <div className="col-sm-7">
              { users === null ? <Spinner/> :
                  <select className="form-control" name="users" id="user_for_challenge" onChange={(e) =>
                    handleChangePlayer({id: e.target.value, name: e.target.options[e.target.selectedIndex].text})}>
                  <option value="">--{t('Select')}--</option>
                  { users
                    .filter(user => user.id !== myid)
                    .map(item => { return <option key={item.id} value={item.id}>{item.name}</option>})}
                </select>
              }
            </div>
          </div>
          { groupData.length === 0 && nonGroupData.length === 0 ? '' :
            <div className='pickVariant'><span className='pickVariantHeader'>{t("PickVariant")}</span>
              { metaGame === null || groupData.length === 0 ? '' :
                groupData.map(g =>
                  <fieldset className="form-group" key={"group:" + g.group}>
                    <div className='row' onChange={(e) => handleGroupChange(g.group, e.target.value)}>
                      <legend className="col-form-label col-sm-5 pt-0 text-right">{t("PickOneVariant")}</legend>
                      <div className="col-sm-7">
                          { g.variants.map(v =>
                              <div className="form-check" key={v.uid}>
                                <input className="form-check-input" type="radio" id={v.uid} value={v.uid} name={v.group}/>
                                <label className="form-check-label" for={v.uid}> {v.name} </label>
                              </div>
                            )
                          }
                      </div>
                    </div>
                  </fieldset>
                  )}
              { metaGame === null || nonGroupData.length === 0 ? '' :
                <fieldset class="form-group">
                  <div className='row'>
                    <legend className="col-form-label col-sm-5 pt-0 text-right">{t("PickAnyVariant")}</legend>
                    <div className="col-sm-7">
                      { nonGroupData.map(v =>
                        <div className="form-check" key={v.uid}>
                          <input className="form-check-input" type="checkbox" id={v.uid} value={v.uid} onChange={(e) => handleNonGroupChange(e.target.value, e.target.checked)} />
                          <label className='form-check-label' for={v.uid}>{v.name}</label>
                        </div>)
                      }
                    </div>
                  </div>
                </fieldset>
              }
            </div>
          }
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleChallenge}>
          {t('Challenge')}
        </Button>
        <Button variant="primary" onClick={handleNewChallengeClose}>
          {t('Close')}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default NewChallengeModal;
