const { merge } = require('lodash');

// This takes the (minimal) game object as it is saved in the DB on the server and fills in other
// fields that is useful or needed for displaying and manipulating (showing old states, exploring new states) the game
// in the front end.
// Note that the (required) currentMove, canSubmit, and exploreMove is set in the GameMove code and should not be set here.
// For Ithaka only the list of moves and the current pieces string is maintained in the DB.
exports.hydrate = function(game) {
  if (game.moves === undefined || game.moves.length === 0) {
    initializeGame(game);
  }
  hydrateBoard(game);
  render(game);
}

// This takes the full game object and keeps only the minimal object for persistence in the DB and transmission to the front end.
exports.minimize = function(game) {
  game.pieces = toBoardString(game.board)
  delete game.board;
  delete game.canSubmit;
  delete game.renderrep;
  delete game.lastMoved;
}

function initializeGame(game) {
  game.pieces = "YYRR\nY--R\nB--G\nBBGG";
  game.moves = [];
}

function hydrateBoard(game) {
  game.board = [];
  const rows = game.pieces.split('\n');
  for (let i = 0; i < 4; i++) {
    game.board.push(rows[i].split(''));
  }
}

exports.initializeGame = function(game) {
  if (game.moves === undefined || game.moves.length === 0) {
    game.moves = [];
    game.initializeGame();
  }
}

function toBoardString(board) {
  return board[0].join("") + "\n" + board[1].join("") + "\n" + board[2].join("") + "\n" + board[3].join("");
}

function render(game) {
  var annotations = [];
  if (game.moves.length > 0) {
    const lastmove = game.moves[game.moves.length - 1];
    const from = positionToCoord(lastmove.substr(0,2));
    const to = positionToCoord(lastmove.substr(3,2));
    const annotation = {
      "type": "move",
      "targets": [
        { "row": from[0], "col": from[1]},
        { "row": to[0], "col": to[1]}
      ]
    }
    annotations.push(annotation);
  }
  game.renderrep = {
    "board": {
      "style": "squares-checkered",
      "height": 4,
      "width": 4
    },
    "legend": {
      "B": {"name": "piece", "player": 2},
      "G": {"name": "piece", "player": 3},
      "R": {"name": "piece", "player": 1},
      "Y": {"name": "piece", "player": 4}},
    "pieces": toBoardString(game.board)
  };
  if (annotations.length > 0)
  game.renderrep.annotations = annotations;
}

// Take the alhpa numeric position return, [y, x]. 'a1' becomes [3, 0].
function positionToCoord(pos) {
  return [52 - pos.charCodeAt(1), pos.charCodeAt(0) - 97];
}

// Take [y, x] return alphanumeric position.
function coordToPosition(c) {
  return String.fromCharCode(97 + c[1]) + String.fromCharCode(52 - c[0]);
}

function legalCoord(c) {
  return c[0] >= 0 && c[0] < 4 && c[1] >= 0 && c[1] < 4;
}

// This acts on the hydrated game object.
exports.badMoveReason = function(game, move) {
  let board = game.board;
  move = move.replace(/ /g, '');
  if (move.length !== 5)
    return 'Invalid move format. A move must be 5 characters in length';
  let from = positionToCoord(move.substr(0,2));
  if (from[0] < 0 || from[0] > 3)
    return 'Invalid move format. The first character of the move must be a, b, c, or d';
  if (from[1] < 0 || from[1] > 3)
    return 'Invalid move format. The second character of the move must be 1 ,2, 3, or 4';
  if (move[2] !== '-')
    return "Invalid move format. The third character of the move must be '-'";
  let to = positionToCoord(move.substr(3,2));
  if (to[0] < 0 || to[0] > 3)
    return 'Invalid move format. The fourth character of the move must be a, b, c, or d';
  if (to[1] < 0 || to[1] > 3)
    return 'Invalid move format. The fifth character of the move must be 1, 2, 3, or 4';
  if (board[from[0]][from[1]] === '-')
    return 'Invalid move. There is no piece at ' + move.substr(0, 2);
  if (from[0] === to[0] && from[1] === to[1])
    return "You must move the piece to a new position";
  let dist = Math.max(Math.abs(from[0]-to[0]), Math.abs(from[1]-to[1]));
  let dx = Math.sign(to[0]-from[0]);
  let dy = Math.sign(to[1]-from[1]);
  if (to[0] !== from[0] + dist * dx || to[1] !== from[1] + dist * dy)
    return "This move is not in a orthogonal or diagonal line";
  for (let i = 1; i < dist; i++)
    if (board[from[0] + i * dx][from[1] + i * dy] !== '-')
      return "You can't move over " + coordToPosition([from[0] + i * dx, from[1] + i * dy]) + " because it isn't empty";
  if (board[from[0] + dist * dx][from[1] + dist * dy] !== '-')
      return "You can't move to " + coordToPosition([from[0] + dist * dx, from[1] + dist * dy]) + " because it isn't empty";
  let neighborOK = false;
  let newCoord = [from[0] - 1, from[1]];
  if (legalCoord(newCoord) && board[newCoord[0]][newCoord[1]] === board[from[0]][from[1]])
    neighborOK = true;
  newCoord = [from[0] + 1, from[1]];
  if (legalCoord(newCoord) && board[newCoord[0]][newCoord[1]] === board[from[0]][from[1]])
    neighborOK = true;
  newCoord = [from[0], from[1] - 1];
  if (legalCoord(newCoord) && board[newCoord[0]][newCoord[1]] === board[from[0]][from[1]])
    neighborOK = true;
  newCoord = [from[0], from[1] + 1];
  if (legalCoord(newCoord) && board[newCoord[0]][newCoord[1]] === board[from[0]][from[1]])
    neighborOK = true;
  if (!neighborOK)
    return "You can't move from " + move.substr(0,2) + " because that piece isn't orthogonally adjacent to another piece of the same color";
  if (game.lastMoved === move.substr(0, 2))
    return "You can't move the last moved piece";
  return "";
}

// BEWARE: this assumes it's a legal move! Check first!
// This acts on the hydrated game object.
exports.makeMove = function(game, move) {
  move = move.replace(/ /g, '');
  let from = positionToCoord(move.substr(0,2));
  let to = positionToCoord(move.substr(3,2));
  game.board[to[0]][to[1]] = game.board[from[0]][from[1]];
  game.board[from[0]][from[1]] = '-';
  game.moves.push(move);
  game.lastMoved = move.substr(3,2);
  game.toMove = 1 - game.toMove;
  render(game);
}

exports.undoLastMove = function(game, explore) {
  let lastmove = game.moves.pop();
  let to = positionToCoord(lastmove.substr(0,2));
  let from = positionToCoord(lastmove.substr(3,2));
  game.board[to[0]][to[1]] = game.board[from[0]][from[1]];
  game.board[from[0]][from[1]] = '-';
  game.lastMoved = game.moves.length > 0 ? game.moves[game.moves.length - 1].substr(3,2) : '';
  game.toMove = 1 - game.toMove;
  if (explore)
    game.exploreMove -= 1;
  render(game);
}

exports.replayToMove = function(game, index) {
  initializeGame(game);
  hydrateBoard(game);
  game.exploreMove = 0;
  game.toMove = 0;
  for (let i = 0; i <= index; i++) {
    this.makeMove(game, game.moves[i], false, true)
  }
  render(game);
}