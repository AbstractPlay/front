export function initialNonGroupVariants(nonGroupData) {
  const initial = {};
  for (const v of nonGroupData) {
    initial[v.uid] = v.default === true;
  }
  return initial;
}
