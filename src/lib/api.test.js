import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("aws-amplify/auth", () => ({
  signInWithRedirect: vi.fn(),
}));

vi.mock("../config", () => ({
  API_ENDPOINT_AUTH: "https://api.example/auth",
}));

const mockGetAuthTokenFromSession = vi.fn();
const mockRefreshAuthSession = vi.fn();

vi.mock("./authSession", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getAuthTokenFromSession: (...args) => mockGetAuthTokenFromSession(...args),
    refreshAuthSession: (...args) => mockRefreshAuthSession(...args),
  };
});

import { signInWithRedirect } from "aws-amplify/auth";
import { callAuthApi } from "./api";

describe("callAuthApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("retries once after 401 when refresh succeeds", async () => {
    mockGetAuthTokenFromSession.mockResolvedValue("stale-token");
    mockRefreshAuthSession.mockResolvedValue({
      status: "ready",
      token: "fresh-token",
    });
    global.fetch
      .mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce({ status: 200 });

    const res = await callAuthApi("submit_move", { foo: 1 });

    expect(mockRefreshAuthSession).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[1][1].headers.Authorization).toBe(
      "Bearer fresh-token"
    );
    expect(signInWithRedirect).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it("redirects to login when 401 persists after refresh", async () => {
    mockGetAuthTokenFromSession.mockResolvedValue("stale-token");
    mockRefreshAuthSession.mockResolvedValue({
      status: "ready",
      token: "still-bad-token",
    });
    global.fetch.mockResolvedValue({ status: 401 });

    await callAuthApi("submit_move", {});

    expect(mockRefreshAuthSession).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(signInWithRedirect).toHaveBeenCalledTimes(1);
  });

  it("returns 401 response without redirect when requireAuth is false", async () => {
    mockGetAuthTokenFromSession.mockResolvedValue("stale-token");
    global.fetch.mockResolvedValue({ status: 401 });

    const res = await callAuthApi("me_profile", {}, false);

    expect(mockRefreshAuthSession).not.toHaveBeenCalled();
    expect(signInWithRedirect).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
  });
});
