import { callAuthApi } from "../api";
import {
  bodyFromLocalSaveRecord,
  playgroundSaveBodyFromJson,
  playgroundSaveBodyToJson,
  saveToLaunchPayload,
} from "./savePayload";

async function parseAuthResponse(res, query) {
  if (!res) {
    throw new Error("Not signed in.");
  }
  const result = await res.json();
  const statusCode = result.statusCode ?? res.status;
  if (statusCode !== 200) {
    let message = `${query} failed (${statusCode})`;
    try {
      const errBody =
        typeof result.body === "string"
          ? JSON.parse(result.body)
          : result.body;
      message = errBody?.message || message;
    } catch {
      if (result.message) message = result.message;
    }
    throw new Error(message);
  }
  let payload = result.body !== undefined ? result.body : result;
  if (typeof payload === "string") {
    payload = JSON.parse(payload);
  }
  return payload;
}

export async function listPlaygroundSaves() {
  const res = await callAuthApi("list_playground_saves", {});
  const result = await parseAuthResponse(res, "list_playground_saves");
  return Array.isArray(result) ? result : [];
}

export async function getPlaygroundSave(id) {
  const res = await callAuthApi("get_playground_save", { id });
  const result = await parseAuthResponse(res, "get_playground_save");
  const body = playgroundSaveBodyFromJson(result.body);
  return saveToLaunchPayload({
    id: result.id,
    name: result.name,
    metaGame: result.metaGame,
    source: "cloud",
    body,
  });
}

export async function createPlaygroundSave({ name, metaGame, body, date }) {
  const res = await callAuthApi("create_playground_save", {
    name,
    metaGame,
    date: date ?? Date.now(),
    body: playgroundSaveBodyToJson(body),
  });
  const result = await parseAuthResponse(res, "create_playground_save");
  return result.id;
}

export async function updatePlaygroundSave({ id, name, metaGame, body, date }) {
  const res = await callAuthApi("save_playground_save", {
    id,
    name,
    metaGame,
    date: date ?? Date.now(),
    body: playgroundSaveBodyToJson(body),
  });
  await parseAuthResponse(res, "save_playground_save");
}

export async function deletePlaygroundSave(id) {
  const res = await callAuthApi("delete_playground_save", { id });
  await parseAuthResponse(res, "delete_playground_save");
}

/**
 * @param {Array<Record<string, unknown>>} localSaves
 * @returns {Promise<{ imported: string[], failed: { id: string, name: string, error: string }[] }>}
 */
export async function importLocalSavesToCloud(localSaves) {
  const imported = [];
  const failed = [];
  for (const record of localSaves) {
    try {
      const body = bodyFromLocalSaveRecord(record);
      await createPlaygroundSave({
        name: record.name,
        metaGame: record.metaGame,
        body,
        date: record.savedAt,
      });
      imported.push(record.id);
    } catch (err) {
      failed.push({
        id: record.id,
        name: record.name,
        error: err.message || String(err),
      });
    }
  }
  return { imported, failed };
}
