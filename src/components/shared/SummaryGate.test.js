import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SummaryGate from "./SummaryGate";
import { useStore } from "../../stores";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

vi.mock("../../hooks/useEnsureSummaryTier", () => ({
  useEnsureSummaryTier: vi.fn(),
}));

describe("SummaryGate", () => {
  beforeEach(() => {
    useStore.setState({
      summary: null,
      summaryLoadState: "idle",
      summarySiteLoadState: "idle",
    });
  });

  it("shows loading state and hides children while idle or pending", () => {
    useStore.setState({ summaryLoadState: "pending" });
    render(
      <SummaryGate>
        <div data-testid="summary-child">child</div>
      </SummaryGate>
    );
    expect(screen.getByText("stats.loadingSummary")).toBeInTheDocument();
    expect(screen.queryByTestId("summary-child")).not.toBeInTheDocument();
  });

  it("renders children when summary is ready", () => {
    useStore.setState({
      summary: { numPlayers: 1 },
      summaryLoadState: "ready",
    });
    render(
      <SummaryGate>
        <div data-testid="summary-child">child</div>
      </SummaryGate>
    );
    expect(screen.getByTestId("summary-child")).toBeInTheDocument();
    expect(screen.queryByText("stats.loadingSummary")).not.toBeInTheDocument();
  });

  it("shows error state when load fails", () => {
    useStore.setState({
      summary: null,
      summaryLoadState: "error",
    });
    render(
      <SummaryGate>
        <div data-testid="summary-child">child</div>
      </SummaryGate>
    );
    expect(screen.getByText("stats.summaryLoadError")).toBeInTheDocument();
    expect(screen.queryByTestId("summary-child")).not.toBeInTheDocument();
  });
});
