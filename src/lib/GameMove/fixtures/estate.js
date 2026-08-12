/** Fresh Estate game — multi-cell placement with complete: 0 + canrender. */
export const estateContracts = [
  {
    id: "estate-placement",
    metaGame: "estate",
    developmentOnly: true,
    state: null,
    move: "g3,h2",
    whileEditing: { partial: true, persistable: true },
    afterComplete: { partial: false, persistable: true },
    submitAfterComplete: true,
  },
];
