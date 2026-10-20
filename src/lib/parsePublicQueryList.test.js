import { describe, it, expect } from "vitest";
import { parsePublicQueryList } from "./parsePublicQueryList";

function mockResponse(status, bodyText) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => bodyText,
  };
}

describe("parsePublicQueryList", () => {
  it("parses a bare JSON array", async () => {
    const res = mockResponse(200, JSON.stringify([{ id: "a" }]));
    const result = await parsePublicQueryList(res);
    expect(result).toEqual({ ok: true, data: [{ id: "a" }] });
  });

  it("parses a Lambda proxy envelope", async () => {
    const res = mockResponse(
      200,
      JSON.stringify({
        statusCode: 200,
        body: JSON.stringify([{ id: "b" }]),
      })
    );
    const result = await parsePublicQueryList(res);
    expect(result).toEqual({ ok: true, data: [{ id: "b" }] });
  });

  it("returns error for non-array body", async () => {
    const res = mockResponse(200, JSON.stringify({ statusCode: 200, body: "{}" }));
    const result = await parsePublicQueryList(res);
    expect(result.ok).toBe(false);
  });
});
