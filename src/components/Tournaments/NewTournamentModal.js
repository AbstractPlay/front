import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
  Fragment,
} from "react";
import Spinner from "../Spinner";
import { cloneDeep } from "lodash";
import { useTranslation } from "react-i18next";
import { MeContext } from "../../pages/Skeleton";
import { gameinfo, GameFactory, addResource } from "@abstractplay/gameslib";
import Modal from "../Modal";

function NewTournamentModal(props) {
  const handleClose = props.handleClose;
  const handleNewTournament = props.handleNewTournament;
  const show = props.show;
  const [metaGame, metaGameSetter] = useState(null);
  const [allvariants, allvariantsSetter] = useState(null);
  const [nonGroupVariants, nonGroupVariantsSetter] = useState({});
  const groupVariantsRef = useRef({});
  const [globalMe] = useContext(MeContext);
  const [error, errorSetter] = useState("");
  const { t, i18n } = useTranslation();

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  const handleChangeGame = useCallback(
    (game) => {
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
        let rootAllVariants = gameEngine.allvariants();
        if (process.env.REACT_APP_REAL_MODE === "production") {
          rootAllVariants = rootAllVariants?.filter(
            (v) => v.experimental === undefined || v.experimental === false
          );
        }
        allvariantsSetter(rootAllVariants);
        let ngVariants = {};
        if (rootAllVariants)
          rootAllVariants
            .filter((v) => v.group === undefined)
            .forEach((v) => (ngVariants[v.uid] = false));
        nonGroupVariantsSetter(ngVariants);
      }
      errorSetter("");
    },
    [metaGameSetter, allvariantsSetter, nonGroupVariantsSetter]
  );

  useEffect(() => {
    groupVariantsRef.current = {};
    nonGroupVariantsSetter({});
    metaGameSetter(null);
    errorSetter("");
  }, [show, props, handleChangeGame]);

  const handleGroupChange = (group, variant) => {
    // Ref gets updated, so no rerender. The radio buttons aren't "controlled"
    groupVariantsRef.current[group] = variant;
  };

  const handleNonGroupChange = (event) => {
    // State get updated, so rerender. The checkboxes are controlled.
    let ngVariants = cloneDeep(nonGroupVariants);
    ngVariants[event.target.id] = !ngVariants[event.target.id];
    nonGroupVariantsSetter(ngVariants);
  };

  const handleNew = async () => {
    if (metaGame === null) {
      errorSetter(t("SelectAGame"));
      return;
    }
    let variants = [];
    for (var group of Object.keys(groupVariantsRef.current)) {
      if (
        groupVariantsRef.current[group] !== null &&
        groupVariantsRef.current[group] !== ""
      ) {
        variants.push(groupVariantsRef.current[group]);
      }
    }
    for (var variant of Object.keys(nonGroupVariants)) {
      if (nonGroupVariants[variant]) {
        variants.push(variant);
      }
    }
    if (
      !(await handleNewTournament({
        metaGame: metaGame,
        variants: variants,
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

  let groupData = [];
  let nonGroupData = [];
  if (metaGame !== null) {
    if (allvariants && allvariants !== undefined) {
      const groups = [
        ...new Set(
          allvariants.filter((v) => v.group !== undefined).map((v) => v.group)
        ),
      ];
      groupData = groups.map((g) => {
        return {
          group: g,
          variants: allvariants
            .filter((v) => v.group === g)
            .sort((a, b) => (a.uid > b.uid ? 1 : -1)),
        };
      });
      nonGroupData = allvariants
        .filter((v) => v.group === undefined)
        .sort((a, b) => (a.uid > b.uid ? 1 : -1));
    }
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
        {groupData.length === 0 && nonGroupData.length === 0 ? (
          ""
        ) : (
          <Fragment>
            <div className="field">
              <label className="label">{t("PickVariant")}</label>
            </div>
            <div className="indentedContainer">
              {metaGame === null || groupData.length === 0
                ? ""
                : groupData.map((g) => (
                    <div
                      className="field"
                      key={"group:" + g.group}
                      onChange={(e) =>
                        handleGroupChange(g.group, e.target.value)
                      }
                    >
                      <label className="label">{t("PickOneVariant")}</label>
                      <div className="control">
                        <label className="radio">
                          <input
                            type="radio"
                            id="default"
                            value=""
                            name={g.group}
                            defaultChecked
                          />
                          {`Default ${g.group}`}
                        </label>
                      </div>
                      {g.variants.map((v) => (
                        <div className="control" key={v.uid}>
                          <label className="radio">
                            <input
                              type="radio"
                              id={v.uid}
                              value={v.uid}
                              name={g.group}
                            />
                            {v.name}
                          </label>
                          {v.description === undefined ||
                          v.description.length === 0 ? (
                            ""
                          ) : (
                            <p
                              className="help"
                              style={{
                                marginTop: "-0.5%",
                              }}
                            >
                              {v.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
              {metaGame === null || nonGroupData.length === 0 ? (
                ""
              ) : (
                <Fragment>
                  <div className="field">
                    <label className="label">{t("PickAnyVariant")}</label>
                  </div>
                  <div className="field">
                    {nonGroupData.map((v) => (
                      <div className="control" key={v.uid}>
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            id={v.uid}
                            checked={nonGroupVariants[v.uid]}
                            onChange={handleNonGroupChange}
                          />
                          {v.name}
                        </label>
                        {v.description === undefined ||
                        v.description.length === 0 ? (
                          ""
                        ) : (
                          <p
                            className="help"
                            style={{
                              marginTop: "-0.5%",
                            }}
                          >
                            {v.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Fragment>
              )}
            </div>
          </Fragment>
        )}
      </div>
      <div className="is-danger error">{error}</div>
    </Modal>
  );
}

export default NewTournamentModal;
