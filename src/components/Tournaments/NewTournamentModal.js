import React, { useState, useEffect, useContext, useCallback } from "react";
import Spinner from "../Spinner";
import { useTranslation } from "react-i18next";
import { MeContext } from "../../pages/Skeleton";
import { gameinfo, addResource } from "@abstractplay/gameslib";
import Modal from "../Modal";
import GameVariants from "../GameVariants";

function NewTournamentModal(props) {
  const handleClose = props.handleClose;
  const handleNewTournament = props.handleNewTournament;
  const show = props.show;
  const fixedMetaGame = props.fixedMetaGame;
  const [metaGame, metaGameSetter] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [globalMe] = useContext(MeContext);
  const [error, errorSetter] = useState("");
  const { t, i18n } = useTranslation();

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  const handleChangeGame = useCallback(
    (game) => {
      if (game === "") {
        metaGameSetter(null);
      } else {
        metaGameSetter(game);
      }
      errorSetter("");
    },
    [metaGameSetter]
  );

  useEffect(() => {
    if (props.fixedMetaGame !== undefined) {
        metaGameSetter(props.fixedMetaGame);
        handleChangeGame(props.fixedMetaGame);
    } else {
        metaGameSetter(null);
    }
    errorSetter("");
  }, [show, props, handleChangeGame]);

  const handleNew = async () => {
    if (metaGame === null) {
      errorSetter(t("SelectAGame"));
      return;
    }
    if (
      !(await handleNewTournament({
        metaGame: metaGame,
        variants: selectedVariants,
      }))
    ) {
      errorSetter(t("Tournament.Duplicate"));
      return;
    }
    handleClose();
  };

  let games = [];
  gameinfo.forEach((game) => games.push({ id: game.uid, name: game.name }));
  games.sort((a, b) => (a.name > b.name ? 1 : -1));
  if (process.env.REACT_APP_REAL_MODE === "production") {
    games = games.filter(
      (g) => !gameinfo.get(g.id).flags.includes("experimental")
    );
  }
  // sort by stars
  if (
    globalMe !== null &&
    "stars" in globalMe &&
    Array.isArray(globalMe.stars) &&
    globalMe.stars.length > 0
  ) {
    const starred = games.filter((g) => globalMe.stars.includes(g.id));
    const others = games.filter((g) => !globalMe.stars.includes(g.id));
    games = [...starred, { id: "", name: "-----" }, ...others];
  }

  return (
    <Modal
      show={show}
      title={t("Tournament.New1")}
      buttons={[
        { label: t("Submit"), action: handleNew },
        { label: t("Close"), action: handleClose },
      ]}
    >
      <div className="container">
      {fixedMetaGame ? (
          <p>
            <strong>{t("ChooseGame")}</strong>:{" "}
            {gameinfo.get(fixedMetaGame).name}
          </p>
        ) : (
        <div className="field">
          <label className="label" htmlFor="gameName">
            {t("ChooseGame")}
          </label>
          <div className="control">
            <div className="select is-small">
              {games === null ? (
                <Spinner />
              ) : (
                /* Select meta game */
                <select
                  value={metaGame ? metaGame : ""}
                  name="gameName"
                  id="gameName"
                  onChange={(e) => handleChangeGame(e.target.value)}
                >
                  <option value="">--{t("Select")}--</option>
                  {games.map((game) => {
                    return (
                      <option key={game.id} value={game.id}>
                        {game.name}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          </div>
        </div>
        )}
        <GameVariants
          metaGame={metaGame}
          variantsSetter={setSelectedVariants}
        />
      </div>
      <div className="is-danger error">{error}</div>
    </Modal>
  );
}

export default NewTournamentModal;
