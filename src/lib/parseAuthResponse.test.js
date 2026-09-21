import { describe, expect, it } from "vitest";
import { parseAuthResponse } from "./parseAuthResponse";

function mockResponse({ status = 200, body = "" }) {
  return {
    status,
    text: async () => body,
  };
}

describe("parseAuthResponse", () => {
  it("returns not authenticated when res is null", async () => {
    const result = await parseAuthResponse(null);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Not authenticated");
  });

  it("parses successful Lambda envelope", async () => {
    const result = await parseAuthResponse(
      mockResponse({
        body: JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({ id: "game-1" }),
        }),
      })
    );
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ id: "game-1" });
  });

  it("returns message from envelope error body", async () => {
    const result = await parseAuthResponse(
      mockResponse({
        body: JSON.stringify({
          statusCode: 500,
          body: JSON.stringify({ message: "Move number mismatch" }),
        }),
      })
    );
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Move number mismatch");
  });

  it("handles missing envelope body without throwing", async () => {
    const result = await parseAuthResponse(
      mockResponse({
        body: JSON.stringify({ statusCode: 200 }),
      })
    );
    expect(result.ok).toBe(true);
    expect(result.data).toBe(null);
  });

  it("handles empty envelope body string without throwing", async () => {
    const result = await parseAuthResponse(
      mockResponse({
        body: JSON.stringify({ statusCode: 200, body: "" }),
      })
    );
    expect(result.ok).toBe(true);
    expect(result.data).toBe(null);
  });

  it("reports HTTP errors with status", async () => {
    const result = await parseAuthResponse(
      mockResponse({ status: 502, body: "Bad Gateway" })
    );
    expect(result.ok).toBe(false);
    expect(result.error).toContain("502");
    expect(result.error).toContain("Bad Gateway");
  });
});
