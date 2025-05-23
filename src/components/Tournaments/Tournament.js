import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { gameinfo } from "@abstractplay/gameslib";

import { useTranslation } from "react-i18next";
import { API_ENDPOINT_OPEN } from "../../config";
import { Helmet } from "react-helmet-async";

async function reportError(error) {
  let url = new URL(API_ENDPOINT_OPEN);
  url.searchParams.append("query", "report_problem");
  url.searchParams.append("error", error);
  const res = await fetch(url);
  const status = res.status;
  if (status !== 200) {
    const result = await res.json();
    console.log(JSON.parse(result.body));
  }
}

function processData(tournament, players, games) {
  const numdivisions = Object.keys(tournament.divisions).length;
  if (tournament.players) {
    players = tournament.players;
  }
  for (let i = 1; i <= numdivisions; i++) {
    tournament.divisions[i].players = [];
  }
  for (let player of players) {
    if (player.division !== undefined) {
      player.games = [];
      tournament.divisions[player.division].players.push(player);
    }
  }
  for (let game of games) {
    const division = game.sk.split("#")[1];
    const player1 = tournament.divisions[division].players.find(
      (p) => p.playerid === game.player1
    );
    const player2 = tournament.divisions[division].players.find(
      (p) => p.playerid === game.player2
    );
    player1.games.push(game);
    player2.games.push(game);
  }
  let divisions = [];
  for (let i = 1; i <= numdivisions; i++) {
    let division = tournament.divisions[i];
    if (!division.processed) {
      let completed = 0;
      let errors = 0;
      for (let player of division.players) {
        player.n =
          player.games.reduce(
            (acc, g) => (g.winner !== undefined ? ++acc : acc),
            0
          ) + 1;
        player.tiebreak = 0;
        let score = 0;
        for (const game of player.games) {
          if (game.winner !== undefined) {
            if (game.winner.length === 2) {
              const opponent =
                game.winner[0] === player.playerid
                  ? game.winner[1]
                  : game.winner[0];
              player.tiebreak +=
                division.players.find((p) => p.playerid === opponent).score / 2;
              score += 0.5;
            } else if (game.winner[0] === player.playerid) {
              const opponent =
                game.winner[0] === game.player1 ? game.player2 : game.player1;
              player.tiebreak += division.players.find(
                (p) => p.playerid === opponent
              ).score;
              score += 1;
            }
            completed++;
          }
        }
        if (score !== player.score && errors === 0) {
          console.log(
            `Score mismatch for player ${player.playerid} in division ${i} of tournament ${tournament.id}`
          );
          reportError(
            `Score mismatch for player ${player.playerid} in division ${i} of tournament ${tournament.id}`
          );
          errors++;
        }
        if (player.tiebreak < 0) player.tiebreak = 0;
      }
      if (2 * division.numCompleted !== completed && errors === 0) {
        console.log(
          `Number of games completed incorrect in division ${i} of tournament ${tournament.id}`
        );
        reportError(
          `Number of games completed incorrect in division ${i} of tournament ${tournament.id}`
        );
      }
    } else {
      console.log("Division " + i + " already processed");
    }
    division.players.sort((b, a) => {
      return a.score !== b.score
        ? a.score - b.score
        : a.tiebreak !== b.tiebreak
        ? a.tiebreak - b.tiebreak
        : a.rating - b.rating;
    });
    // Now also sort games and record outcomes for the table
    for (let p of division.players) {
      p.outcomes = [];
      for (let i = 0; i < division.players.length; i++) {
        let o = division.players[i];
        if (o.playerid === p.playerid) {
          p.outcomes.push(["-"]);
        } else {
          let game = p.games.find(
            (g) => g.player1 === o.playerid || g.player2 === o.playerid
          );
          let outcome = "";
          let outcome2 = "";
          if (game.winner === undefined) {
            outcome = "_";
            outcome2 = "_";
          } else if (game.winner.length === 2) {
            outcome = "Draw";
            outcome2 = "½";
          } else if (game.winner[0] === p.playerid) {
            outcome = "Win";
            outcome2 = "1";
          } else {
            outcome = "Loss";
            outcome2 = "0";
          }
          p.outcomes.push([outcome, outcome2, game.id]);
        }
      }
    }
    divisions.push(division);
  }
  return divisions;
}

function Tournament(props) {
  const { t } = useTranslation();
  const [tournament, tournamentSetter] = useState(null);
  const [divisions, divisionsSetter] = useState([]);
  const [screenWidth, screenWidthSetter] = useState(window.innerWidth);
  const { tournamentid } = useParams();
  const { metaGame } = useParams();

  useEffect(() => {
    async function fetchData() {
      let url = new URL(API_ENDPOINT_OPEN);
      url.searchParams.append("query", "get_tournament");
      url.searchParams.append("tournamentid", tournamentid);
      url.searchParams.append("metaGame", metaGame);
      const res = await fetch(url);
      const status = res.status;
      if (status !== 200) {
        const result = await res.json();
        console.log(JSON.parse(result.body));
      } else {
        const data = await res.json();
        let divisions = processData(
          data.tournament[0],
          data.tournamentPlayers,
          data.tournamentGames
        );
        divisionsSetter(divisions);
        tournamentSetter(data.tournament[0]);
      }
    }
    fetchData();
  }, [tournamentid, metaGame]);

  const handleResize = () => {
    screenWidthSetter(window.innerWidth);
  };
  window.addEventListener("resize", handleResize);

  const metaGameName = tournament
    ? gameinfo.get(tournament.metaGame)?.name
    : "";
  const variants = tournament ? tournament.variants.join(", ") : "";
  return (
    <>
      <Helmet>
        <meta
          property="og:title"
          content={`${metaGameName}: Tournament ${tournamentid}`}
        />
        <meta
          property="og:url"
          content={`https://play.abstractplay.com/tournament/${tournamentid}`}
        />
        <meta
          property="og:description"
          content={`Details of ${metaGameName} tournament ${tournamentid}`}
        />
      </Helmet>
      <article className="content">
        <h1 className="title has-text-centered">
          <a
            href={
              "/games/" +
              (tournament && tournament.metaGame ? tournament.metaGame : "")
            }
            style={{ textDecoration: "none" }}
          >
            {variants === ""
              ? t("Tournament.Name", { metaGame: metaGameName })
              : t("Tournament.VariantsName", {
                  metaGame: metaGameName,
                  variants: variants,
                })}
          </a>
        </h1>
        <div className="control has-text-centered">
          <a
            href={`https://records.abstractplay.com/event/${tournamentid}.json`}
          >
            <button className="button apButton is-small">
              Download all game records for this tournament
            </button>
          </a>
        </div>
        <div className="columns  is-multiline">
          {divisions.map((d, i) => (
            <div
              className="column content is-10 is-offset-1"
              key={"division" + i}
            >
              <div className="card">
                <header className="card-header">
                  <p className="card-header-title">
                    {t("Tournament.Division", { num: i + 1 })}
                  </p>
                </header>
                <div className="card-content">
                  <p className="subtitle">
                    {d.winner
                      ? t("Tournament.DivisionWinner", { winner: d.winner })
                      : t("Tournament.NumCompleted", {
                          numCompleted: d.numCompleted,
                          numGames: d.numGames,
                        })}
                  </p>
                  <div className="table-container">
                    <table className="table apTable">
                      <thead>
                        <tr key={"header" + i}>
                          <th style={{ whiteSpace: "nowrap" }}>
                            {" "}
                            {t("Tournament.Player")}{" "}
                          </th>
                          <th style={{ whiteSpace: "nowrap" }}>
                            {" "}
                            {t("Tournament.Position")}{" "}
                          </th>
                          {d.players.map((p, j) => (
                            <th
                              key={"header-" + i + "-" + j}
                              style={{ whiteSpace: "nowrap" }}
                            >
                              {j + 1}
                            </th>
                          ))}
                          <th style={{ whiteSpace: "nowrap" }}>
                            {" "}
                            {t("Tournament.Score")}{" "}
                          </th>
                          <th
                            style={{ whiteSpace: "nowrap" }}
                            title={t("Tournament.TieBreakHelp")}
                          >
                            {t("Tournament.TieBreak")}
                          </th>
                          <th
                            style={{ whiteSpace: "nowrap" }}
                            title={t("Tournament.RatingHelp")}
                          >
                            {t("Tournament.Rating")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.players.map((p, i) => (
                          <tr key={"player-" + i}>
                            <td>
                              <span className="playerName">
                                <Link to={`/player/${p.playerid}`}>
                                  {p.playername}
                                </Link>
                              </span>
                            </td>
                            <td>{i + 1}</td>
                            {p.outcomes.map((o, j) => (
                              <td key={"player-" + i + "-" + j}>
                                {o[0] === "-" ? (
                                  "-"
                                ) : (
                                  <Link
                                    to={`/move/${tournament.metaGame}/${
                                      o[0] === "_" ? "0" : "1"
                                    }/${o[2]}`}
                                  >
                                    {o[screenWidth >= 770 ? 0 : 1]}
                                  </Link>
                                )}
                              </td>
                            ))}
                            <td>{p.score}</td>
                            <td>{p.tiebreak}</td>
                            <td>{Math.trunc(p.rating)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </article>
    </>
  );
}

export default Tournament;
