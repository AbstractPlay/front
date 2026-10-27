import { callAuthApi } from "./api";
import { parseAuthResponse } from "./parseAuthResponse";

export async function joinLadderPool(ladderId) {
  const res = await callAuthApi("join_ladder_pool", { ladderId });
  return parseAuthResponse(res);
}

export async function leaveLadderPool(ladderId) {
  const res = await callAuthApi("leave_ladder_pool", { ladderId });
  return parseAuthResponse(res);
}
