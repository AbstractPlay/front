import { v4 as uuid } from "uuid";

export class GameNode {
  constructor(parent, move, state, toMove) {
    this.parent = parent;
    this.children = [];
    this.move = move;
    this.state = state;
    this.id = uuid();
    this.comment = [];
    this.commented = false;
    this.version = undefined; // Only the base node has a version. This is really the version of the tree.
    this.toMove = null; // 0 for player1, 1 for player2
    if (toMove !== undefined) this.toMove = toMove;
    else if (this.parent !== null) this.toMove = 1 - this.parent.toMove;
    else throw new Error("Can't decide whose move it is!");
    this.outcome = -1; // 0 for player1 win, 1 for player2 win, -1 for undecided.
  }

  AddChild(move, gameEngine) {
    for (let i = 0; i < this.children.length; i++) {
      if (gameEngine.sameMove(move, this.children[i].move)) return i;
    }
    const toMove = gameEngine.gameover ? "" : gameEngine.currplayer - 1;
    const child = new GameNode(this, move, gameEngine.serialize(), toMove);
    if (toMove === "" && gameEngine.winner.length === 1) {
      child.outcome = gameEngine.winner[0] - 1;
    }
    this.children.push(child);
    this.UpdateOutcome();
    return this.children.length - 1;
  }

  AddComment(comment) {
    const ind = this.comment.findIndex((c) => c.userId === comment.userId);
    let updated = false;
    if (ind !== -1) {
      if (this.comment[ind].timeStamp < comment.timeStamp) {
        this.comment[ind] = comment;
        updated = true;
      }
    } else {
      this.comment.push(comment);
      updated = true;
    }
    if (updated) {
      this.UpdateCommented();
    }
  }

  UpdateCommented() {
    this.commented = true;
    if (this.parent !== null) this.parent.UpdateCommented();
  }

  UpdateOutcome() {
    const mover = 1 - this.toMove;
    // if player x moved, and the other player (1-x) has a winning reply (outcome = 1-x), then player x loses
    // if player x moved, and the other player (1-x) has only losing replies (outcome = x) (no winning moves, no unknown outcome moves) then player x wins
    let a_child_wins = false;
    let all_children_lose = true;
    this.children.forEach((child) => {
      if (child.outcome === 1 - mover) a_child_wins = true;
      if (child.outcome !== mover) all_children_lose = false;
    });
    if (a_child_wins) this.outcome = 1 - mover;
    else if (all_children_lose) this.outcome = mover;
    else this.outcome = -1;
    if (this.parent != null) this.parent.UpdateOutcome();
  }

  SetOutcome(outcome) {
    if (this.children.length === 0) {
      this.outcome = outcome;
      if (this.parent !== null) this.parent.UpdateOutcome();
    }
  }

  Deflate(gameOver = false) {
    const deflated = {
      move: this.move,
      children: [],
    };
    if (gameOver) {
      deflated.id = this.id;
      deflated.comment = this.comment;
    }
    this.children.forEach((child) => {
      deflated.children.push(child.Deflate(gameOver));
    });
    if (this.children.length === 0 && this.outcome !== -1)
      deflated.outcome = this.outcome;
    return deflated;
  }

  findNode(id) {
    if (this.id === id) return [];
    for (let i = 0; i < this.children.length; i++) {
      const path = this.children[i].findNode(id);
      if (path !== undefined) return [i, ...path];
    }
    return undefined;
  }
}
