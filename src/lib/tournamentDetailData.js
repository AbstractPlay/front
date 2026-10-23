/**
 * Build division standings tables for the tournament detail page.
 * Returns [] when the tournament exists but divisions are not created yet.
 * Returns null when `tournament` is missing.
 */
/**
 * @param {{ onIntegrityIssue?: (message: string) => void }} [options]
 */
export function buildTournamentDivisions(
  tournament,
  tournamentPlayers,
  tournamentGames,
  options = {}
) {
  const onIntegrityIssue = options.onIntegrityIssue ?? (() => {});
  if (tournament === undefined || tournament === null) {
    return null;
  }
  const divisionsMap = tournament.divisions;
  if (divisionsMap === undefined || divisionsMap === null) {
    return [];
  }
  if (typeof divisionsMap !== "object") {
    return [];
  }

  const players = tournament.players?.length
    ? tournament.players
    : tournamentPlayers ?? [];
  const games = tournamentGames ?? [];

  const numdivisions = Object.keys(divisionsMap).length;
  if (numdivisions === 0) {
    return [];
  }

  for (let i = 1; i <= numdivisions; i++) {
    if (divisionsMap[i] !== undefined) {
      divisionsMap[i].players = [];
    }
  }
  for (const player of players) {
    if (player.division !== undefined && divisionsMap[player.division]) {
      player.games = [];
      divisionsMap[player.division].players.push(player);
    }
  }
  for (const game of games) {
    const division = game.sk?.split("#")[1];
    if (division === undefined || divisionsMap[division] === undefined) {
      continue;
    }
    const player1 = divisionsMap[division].players.find(
      (p) => p.playerid === game.player1
    );
    const player2 = divisionsMap[division].players.find(
      (p) => p.playerid === game.player2
    );
    if (player1 !== undefined) {
      player1.games.push(game);
    }
    if (player2 !== undefined) {
      player2.games.push(game);
    }
  }

  const divisions = [];
  for (let i = 1; i <= numdivisions; i++) {
    const division = divisionsMap[i];
    if (division === undefined) {
      continue;
    }
    if (!division.processed) {
      let completed = 0;
      let errors = 0;
      for (const player of division.players) {
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
              const opp = division.players.find((p) => p.playerid === opponent);
              if (opp !== undefined) {
                player.tiebreak += opp.score / 2;
              }
              score += 0.5;
            } else if (game.winner[0] === player.playerid) {
              const opponent =
                game.winner[0] === game.player1 ? game.player2 : game.player1;
              const opp = division.players.find((p) => p.playerid === opponent);
              if (opp !== undefined) {
                player.tiebreak += opp.score;
              }
              score += 1;
            }
            completed++;
          }
        }
        if (score !== player.score && errors === 0) {
          const message = `Score mismatch for player ${player.playerid} in division ${i} of tournament ${tournament.id}`;
          console.log(message);
          onIntegrityIssue(message);
          errors++;
        }
        if (player.tiebreak < 0) {
          player.tiebreak = 0;
        }
      }
      if (2 * division.numCompleted !== completed && errors === 0) {
        const message = `Number of games completed incorrect in division ${i} of tournament ${tournament.id}`;
        console.log(message);
        onIntegrityIssue(message);
      }
    }
    division.players.sort((b, a) => {
      return a.score !== b.score
        ? a.score - b.score
        : a.tiebreak !== b.tiebreak
          ? a.tiebreak - b.tiebreak
          : a.rating - b.rating;
    });
    for (const p of division.players) {
      p.outcomes = [];
      for (let j = 0; j < division.players.length; j++) {
        const o = division.players[j];
        if (o.playerid === p.playerid) {
          p.outcomes.push(["-"]);
        } else {
          const gamesVsO = p.games
            .filter(
              (g) => g.player1 === o.playerid || g.player2 === o.playerid
            )
            .sort((a, b) => (a.matchLeg ?? 1) - (b.matchLeg ?? 1));
          if (gamesVsO.length === 0) {
            p.outcomes.push(["_", "_", null]);
          } else if (gamesVsO.length === 1) {
            p.outcomes.push(outcomeForPlayerGame(p.playerid, gamesVsO[0]));
          } else {
            p.outcomes.push([
              "multi",
              gamesVsO.map((g) => outcomeForPlayerGame(p.playerid, g)),
            ]);
          }
        }
      }
    }
    divisions.push(division);
  }
  return divisions;
}

function outcomeForPlayerGame(playerid, game) {
  let outcome = "";
  let outcome2 = "";
  if (game.winner === undefined) {
    outcome = "_";
    outcome2 = "_";
  } else if (game.winner.length === 2) {
    outcome = "Draw";
    outcome2 = "½";
  } else if (game.winner[0] === playerid) {
    outcome = "Win";
    outcome2 = "1";
  } else {
    outcome = "Loss";
    outcome2 = "0";
  }
  return [outcome, outcome2, game.id];
}

/**
 * @param {unknown} data — JSON body from `get_tournament`
 * @returns {{ ok: true, tournament: object, playerRows: object[], divisions: object[], comments: object[] } | { ok: false, reason: 'notFound' | 'invalid' }}
 */
export function parseTournamentDetailResponse(data, options = {}) {
  const tour = data?.tournament?.[0];
  if (tour === undefined || tour === null) {
    return { ok: false, reason: "notFound" };
  }
  const playerRows =
    data.tournamentPlayers?.length > 0
      ? data.tournamentPlayers
      : tour.players ?? [];
  const divisions = buildTournamentDivisions(
    tour,
    data.tournamentPlayers,
    data.tournamentGames,
    options
  );
  if (divisions === null) {
    return { ok: false, reason: "invalid" };
  }
  return {
    ok: true,
    tournament: tour,
    playerRows,
    divisions,
    comments: data.comments ?? [],
  };
}
