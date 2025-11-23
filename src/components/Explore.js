import { useState, useEffect, useContext, useCallback } from "react";
import { gameinfo } from "@abstractplay/gameslib";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { addResource } from "@abstractplay/gameslib";
import { MeContext } from "../pages/Skeleton";
import { useStorageState } from "react-use-storage-state";
import gameImages from "../assets/GameImages";
import Modal from "./Modal";
import TableExplore from "./MetaContainer/TableExplore";
import { callAuthApi } from "../lib/api";
import { API_ENDPOINT_OPEN } from "../config";
import { Helmet } from "react-helmet-async";
import MetaItem from "./MetaContainer/MetaItem";
import CompletedRecent from "./Explore/CompletedRecent";
import CompletedAll from "./Explore/CompletedAll";
import HotMoves from "./Explore/HotMoves";
import HotPlayers from "./Explore/HotPlayers";
import NumPlayers from "./Explore/NumPlayers";
import Newest from "./Explore/Newest";
import HIndex from "./Explore/HIndex";
import Stars from "./Explore/Stars";

function Explore(props) {
  const [globalMe, globalMeSetter] = useContext(MeContext);
  const [games, gamesSetter] = useState([]);
  const [counts, countsSetter] = useState(null);
  const [users, usersSetter] = useState(null);
  const [summary, summarySetter] = useState(null);
  const [selected, selectedSetter] = useStorageState("selected-module", "all");
  const [updateCounter, updateCounterSetter] = useState(0);
  const [activeImgModal, activeImgModalSetter] = useState("");
  const { metaGame } = useParams();
  const { t, i18n } = useTranslation();
  addResource(i18n.language);

  const components = [
    ["all", null],
    ["newest", Newest],
    ["hotRaw", HotMoves],
    ["hotPlayers", HotPlayers],
    ["playerSum", NumPlayers],
    ["hindex", HIndex],
    ["stars", Stars],
    ["completed", CompletedAll],
    ["completedRecent", CompletedRecent],
  ];

  const titles = new Map([
    ["all", "All games"],
    ["newest", "Newest"],
    ["hotRaw", "Hottest (# moves/day)"],
    ["hotPlayers", "Hottest (# players/day)"],
    ["playerSum", "Most players"],
    ["hindex", "Highest h-index"],
    ["stars", "Most stars"],
    ["completed", "Most completed games per week (all time)"],
    ["completedRecent", "Most completed games per week (recent)"],
  ]);

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append("query", "meta_games");
        const res = await fetch(url);
        const result = await res.json();
        countsSetter(result);
      } catch (error) {
        countsSetter(null);
        console.log(error);
      }
    }
    fetchData();
  }, [updateCounter]);

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append("query", "user_names");
        const res = await fetch(url);
        const result = await res.json();
        usersSetter(result);
      } catch (error) {
        console.log(error);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL("https://records.abstractplay.com/_summary.json");
        const res = await fetch(url);
        const result = await res.json();
        summarySetter(result);
      } catch (error) {
        console.log(error);
        summarySetter(null);
      }
    }
    fetchData();
  }, []);

  const openImgModal = (name) => {
    activeImgModalSetter(name);
  };
  const closeImgModal = () => {
    activeImgModalSetter("");
  };

  useEffect(() => {
    let metas = [...gameinfo.keys()].sort((a, b) => {
      const na = gameinfo.get(a).name;
      const nb = gameinfo.get(b).name;
      if (na < nb) return -1;
      else if (na > nb) return 1;
      return 0;
    });
    if (process.env.REACT_APP_REAL_MODE === "production") {
      metas = metas.filter(
        (id) => !gameinfo.get(id).flags.includes("experimental")
      );
    }
    gamesSetter([...metas]);
  }, []);

  const toggleStar = useCallback(
    async (game) => {
      try {
        const res = await callAuthApi("toggle_star", {
          metaGame: game,
        });
        if (!res) return;
        if (res.status !== 200) {
          const result = await res.json();
          console.log(
            `An error occurred while saving toggling a star:\n${result}`
          );
        } else {
          const result = await res.json();
          const newMe = JSON.parse(JSON.stringify(globalMe));
          newMe.stars = JSON.parse(result.body);
          globalMeSetter(newMe);
          // update counts locally
          const newcounts = JSON.parse(JSON.stringify(counts));
          if (
            newMe !== null &&
            "stars" in newMe &&
            Array.isArray(newMe.stars)
          ) {
            if (newMe.stars.includes(game)) {
              newcounts[game].stars++;
            } else {
              newcounts[game].stars--;
            }
          }
          countsSetter(newcounts);
        }
      } catch (error) {
        console.log(error);
      }
    },
    [counts, globalMe, globalMeSetter]
  );

  const handleNewChallenge = async (challenge) => {
    try {
      await callAuthApi("new_challenge", {
        ...challenge,
        challenger: { id: globalMe.id, name: globalMe.name },
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleSelChange = useCallback(
    (sel) => {
      closeImgModal();
      selectedSetter(sel);
    },
    [selectedSetter]
  );

  useEffect(() => {
    handleSelChange(selected);
    // leaving handleSelChange out of the dep array because it causes an infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  if (metaGame === undefined || metaGame === null || !gameinfo.has(metaGame)) {
    return (
      <>
        <Helmet>
          <meta property="og:title" content="Explore available games" />
          <meta
            property="og:url"
            content="https://play.abstractplay.com/explore"
          />
          <meta
            property="og:description"
            content="Different ways of exploring what's popular on Abstract Play."
          />
        </Helmet>
        <article>
          <div
            className="container has-text-centered"
            style={{ paddingBottom: "1em" }}
          >
            <h1 className="title">{t("ExploreGames")}</h1>
          </div>
          <div className="content">
            <p>
              This page lets you explore different ways of sorting the list of
              games. Select your desired view below. Clicking on a game's name
              will take you to that game's landing page with additional
              information.
            </p>
          </div>
          <div className="container">
            <div className="control">
              <div className="select">
                <select onChange={(e) => handleSelChange(e.target.value)}>
                  {[...titles.entries()].map(([key, title]) => {
                    return (
                      <option value={key} selected={selected === key}>
                        {title}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>
          <hr />
          {selected === "all" ? (
            <TableExplore
              counts={counts}
              games={games}
              summary={summary}
              toggleStar={toggleStar.bind(this)}
              handleChallenge={handleNewChallenge.bind(this)}
              users={users}
              updateSetter={updateCounterSetter}
            />
          ) : (
            components.map(([key, Component]) => {
              if (selected === key) {
                return (
                  <Component
                    toggleStar={toggleStar.bind(this)}
                    openImgModal={openImgModal.bind(this)}
                    counts={counts}
                  />
                );
              } else {
                return null;
              }
            })
          )}
        </article>
        {selected === "all"
          ? null
          : games.map((metaGame) => {
            return (
              <Modal
                key={metaGame}
                buttons={[{ label: "Close", action: closeImgModal }]}
                show={activeImgModal === metaGame}
                title={`Board image for ${gameinfo.get(metaGame).name}`}
              >
                <div className="content">
                  <img
                    src={`data:image/svg+xml;utf8,${encodeURIComponent(
                      gameImages[metaGame]
                    )}`}
                    alt={metaGame}
                    width="100%"
                    height="auto"
                  />
                </div>
              </Modal>
            );
          })}
      </>
    );
  } else if (counts !== null) {
    return (
      <>
        <Helmet>
          <meta
            property="og:title"
            content={`${gameinfo.get(metaGame).name}: Game Information`}
          />
          <meta
            property="og:url"
            content="https://play.abstractplay.com/games"
          />
          <meta
            property="og:description"
            content={`Information on the game ${gameinfo.get(metaGame).name}`}
          />
        </Helmet>
        <MetaItem
          game={gameinfo.get(metaGame)}
          counts={counts[metaGame]}
          summary={summary}
          toggleStar={toggleStar.bind(this)}
          handleChallenge={handleNewChallenge.bind(this)}
        />
      </>
    );
  }
}

export default Explore;
