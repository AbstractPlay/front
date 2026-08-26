import { buildPlaygroundSaveBody } from "./savePayload";
import { addSave, createSaveRecord } from "./storage";
import {
  createPlaygroundSave,
  updatePlaygroundSave,
} from "./playgroundSavesApi";

/**
 * @param {'update' | 'create' | 'saveAsNew'} action
 * @param {object} params
 */
export async function persistNamedPlaygroundSave({
  action,
  isLoggedIn,
  loadedSave,
  name,
  metaGame,
  game,
  nodes,
  focus,
  gameSettings,
}) {
  const body = buildPlaygroundSaveBody({
    game,
    nodes,
    focus,
    gameSettings,
  });

  const useCloud =
    isLoggedIn &&
    (action === "create" ||
      action === "saveAsNew" ||
      loadedSave?.source === "cloud");

  const useLocal =
    !useCloud &&
    (action === "create" ||
      action === "saveAsNew" ||
      (action === "update" && loadedSave?.source === "local") ||
      !isLoggedIn);

  if (useCloud) {
    if (action === "update" && loadedSave?.source === "cloud") {
      await updatePlaygroundSave({
        id: loadedSave.id,
        name,
        metaGame,
        body,
      });
      return { id: loadedSave.id, name, source: "cloud" };
    }
    const id = await createPlaygroundSave({ name, metaGame, body });
    return { id, name, source: "cloud" };
  }

  if (useLocal) {
    const id =
      action === "update" && loadedSave?.source === "local"
        ? loadedSave.id
        : undefined;
    const record = createSaveRecord({
      id,
      name,
      metaGame,
      game,
      nodes,
      focus,
      gameSettings,
    });
    addSave(record);
    return { id: record.id, name, source: "local" };
  }

  throw new Error("Could not determine save destination.");
}
