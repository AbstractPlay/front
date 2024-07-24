export function bergerTable(teams, useDummy = false, dummy = {}) {
  if (!Array.isArray(teams))
    teams = Array.from({ length: teams }).map((_, i) => i);
  else teams = [...teams]; // copy array to avoid side effects
  if (teams.length % 2 !== 0) teams.push(dummy);

  const n = teams.length;
  const numberOfRounds = n - 1;
  const gamesPerRound = n / 2;

  let columnA = teams.slice(0, gamesPerRound);
  let columnB = teams.slice(gamesPerRound).reverse();
  const fixed = teams[teams.length - 1];

  const pairs = Array.from({ length: numberOfRounds }).map((_, i) => {
    // let gameCount = 1;
    let round = Array.from({ length: gamesPerRound }).reduce((acc, _, k) => {
      if (useDummy || (columnA[k] !== dummy && columnB[k] !== dummy)) {
        acc.push({
          // round: i+1,
          // game: gameCount,
          teamA: columnA[k],
          teamB: columnB[k],
        });
        // gameCount++;
      }
      return acc;
    }, []);

    // rotate elements
    columnB = [fixed, columnA.shift(), ...columnB.slice(1)];
    columnA.push(columnB.pop());
    return round;
  });

  // interleave last half of rounds, swapping the first pairing in each case
  const interleaved = [];
  const div = Math.ceil(pairs.length / 2);
  for (let i = 0; i < div; i++) {
    interleaved.push(pairs[i]);
    const iNext = i + div;
    if (iNext < pairs.length) {
      const round = pairs[iNext];
      // swap first pairing
      const pair = round[0];
      const scratch = pair.teamA;
      pair.teamA = pair.teamB;
      pair.teamB = scratch;
      interleaved.push(round);
    }
  }
  return interleaved.flat();
}
