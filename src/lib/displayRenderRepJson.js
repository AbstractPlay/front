import { isCompositeRenderRep } from "./renderOutput.js";

export function getDisplayedRenderRepJson(renderrep, index) {
  if (renderrep == null) return "";
  if (isCompositeRenderRep(renderrep)) {
    return JSON.stringify(renderrep, null, 2);
  }
  const reps = Array.isArray(renderrep) ? renderrep : [renderrep];
  if (reps.length === 0) return "";
  let i = index;
  if (i == null || Number.isNaN(i) || i < 0 || i >= reps.length) {
    i = reps.length - 1;
  }
  return JSON.stringify(reps[i], null, 2);
}
