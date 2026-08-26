import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Stats from "../Stats";
import { useStore } from "../../stores";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      if (opts && key === "stats.playersPlayedGames") {
        return `players:${opts.numPlayers};games:${opts.numGames}`;
      }
      if (opts && key === "stats.recordsBetween") {
        return `oldest:${opts.oldest};newest:${opts.newest}`;
      }
      if (opts && key === "stats.day") {
        return `${opts.count} days`;
      }
      if (opts && key === "stats.year") {
        return `${opts.count} years`;
      }
      return key;
    },
  }),
}));

vi.mock("../../hooks/useEnsureSummaryTier", () => ({
  useEnsureSummaryTier: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useParams: () => ({ tab: "ratings" }),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ hash: "" }),
  Navigate: () => null,
}));

vi.mock("react-use-storage-state", () => ({
  useStorageState: (_key, defaultValue) => [defaultValue, vi.fn()],
}));

vi.mock("react-helmet-async", () => ({
  Helmet: ({ children }) => children,
}));

describe("Stats header with partial summary", () => {
  beforeEach(() => {
    useStore.setState({
      summary: { ratings: { highest: [] } },
      summaryLoadState: "idle",
      summarySiteLoadState: "idle",
      summaryRatingsLoadState: "ready",
      globalMe: null,
      users: [],
    });
  });

  it("does not throw and shows placeholders for missing site fields", () => {
    expect(() => render(<Stats />)).not.toThrow();
    expect(screen.getByText(/players:\?\?;games:\?\?/)).toBeInTheDocument();
    expect(screen.getByText(/oldest:\?\?;newest:\?\?/)).toBeInTheDocument();
  });
});
