import { callAuthApi } from "./api";
import { resolveAuthSession } from "./authSession";
import { useStore } from "../stores";

let profileInflight = null;
let dashboardInflight = null;

async function parseMeResponse(res) {
  if (!res || res.status !== 200) {
    return null;
  }
  const result = await res.json();
  if (result.statusCode !== 200) {
    return null;
  }
  return JSON.parse(result.body);
}

export async function fetchProfile() {
  const session = await resolveAuthSession();
  if (session.status !== "ready") {
    return null;
  }
  if (profileInflight) {
    return profileInflight;
  }

  profileInflight = (async () => {
    try {
      const res = await callAuthApi("me_profile", {}, false);
      const profile = await parseMeResponse(res);
      if (profile) {
        useStore.getState().setGlobalMe((prev) => ({ ...prev, ...profile }));
      }
      return profile;
    } finally {
      profileInflight = null;
    }
  })();

  return profileInflight;
}

export async function fetchDashboard(pars = {}) {
  const session = await resolveAuthSession();
  if (session.status !== "ready") {
    return null;
  }
  if (dashboardInflight) {
    return dashboardInflight;
  }

  dashboardInflight = (async () => {
    try {
      const res = await callAuthApi("me_dashboard", pars);
      const dashboard = await parseMeResponse(res);
      if (dashboard) {
        useStore.getState().setGlobalMe((prev) => ({ ...prev, ...dashboard }));
      }
      return dashboard;
    } finally {
      dashboardInflight = null;
    }
  })();

  return dashboardInflight;
}
