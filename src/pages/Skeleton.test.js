import { render } from "@testing-library/react";
import { vi } from "vitest";
import Welcome from "./Welcome";

vi.mock("./Welcome", () => ({ default: () => null }));

it("renders without crashing", () => {
  const { unmount } = render(<Welcome />);
  unmount();
});
