export class GameNode {
  constructor(parent, move, state, toMove) {
    this.parent = parent;
    this.children = [];
    this.move = move;
    this.state = state;
    this.toMove = null; // 0 for player1, 1 for player2
    if (toMove !== undefined)
      this.toMove = toMove;
    else if (this.parent !== null)
      this.toMove = 1 - this.parent.toMove;
    else
      throw new Error("Can't decide whose move it is!");
    this.outcome = 0; // -1 for player1 win, 1 for player2 win, 0 for undecided.
  }

  AddChild(move, state) {
    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i].move === move)
        return i;
    }
    const child = new GameNode(this, move, state);
    this.children.push(child);
    this.UpdateOutcome();
    return this.children.length - 1;
  }

  UpdateOutcome() {
    let win = true;
    let lose = false;
    this.children.forEach(child => {
      if ((this.toMove === 0 && child.outcome === 1) || (this.toMove === 1 && child.outCome === -1))
        lose = true;
      if ((this.toMove === 0 && child.outcome !== -1) || (this.toMove === 1 && child.outcome !== 1))
        win = false;
    });
    this.outcome = 0;
    if (this.toMove === 0 && lose)
      this.outcome = 1;
    if (this.toMove === 0 && win)
      this.outcome = -1;
    if (this.toMove === 1 && lose)
      this.outcome = -1;
    if (this.toMove === 1 && win)
      this.outcome = 1;
    if (this.parent != null)
        this.parent.UpdateOutcome();
  }

  SetOutcome(outcome) {
    if (this.children.length === 0) {
      this.outcome = outcome;
      if (this.parent !== null)
        this.parent.UpdateOutcome();
    }
  }
}
