import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import Board from "./Board";
import { useStore } from "../../stores";

vi.mock("react-zoom-pan-pinch", () => ({
  TransformWrapper: ({ children }) => (
    <div data-testid="transform-wrapper">{children}</div>
  ),
  TransformComponent: ({ children }) => <>{children}</>,
}));

vi.mock("react-use-storage-state", () => ({
  default: vi.fn((key, initial) => {
    const [val, setVal] = useState(initial);
    return [val, setVal];
  }),
}));

vi.mock("./BoardNav", () => ({
  default: () => <div data-testid="board-nav" />,
}));

vi.mock("./GameMarkButtons", () => ({
  default: () => null,
}));

function makeSvg(label) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("data-label", label);
  return svg;
}

function makeProps(overrides = {}) {
  const svg0 = makeSvg("board-0");
  const svg1 = makeSvg("board-1");
  const boardImage = { current: null };
  return {
    metaGame: "chess",
    gameID: "game-1",
    rendered: [svg0, svg1],
    t: (key) => key,
    inCheck: [],
    stackExpanding: false,
    increment: 0,
    stackImage: { current: null },
    boardImage,
    gameEngine: undefined,
    gameNote: "",
    handleRotate: vi.fn(),
    handleUpdateRenderOptions: vi.fn(),
    handleCycleAltDisplay: vi.fn(),
    hasAltDisplays: false,
    screenWidth: 1024,
    showGameDetailsSetter: vi.fn(),
    showGameNoteSetter: vi.fn(),
    showGameDumpSetter: vi.fn(),
    showCustomCSSSetter: vi.fn(),
    showInjectSetter: vi.fn(),
    verticalLayout: false,
    verticalLayoutSetter: vi.fn(),
    locked: false,
    setLocked: vi.fn(),
    setRefresh: vi.fn(),
    copyHWDiagram: vi.fn(),
    colourContext: { background: "#112233" },
    hasNewChat: false,
    handleCustomize: vi.fn(),
    boardRenderIndex: 0,
    setBoardRenderIndex: vi.fn(),
    watchCount: 0,
    gameMarkProps: null,
    ...overrides,
  };
}

describe("Board", () => {
  beforeEach(() => {
    useStore.setState({ globalMe: null });
  });

  it("returns null when rendered is empty", () => {
    const { container } = render(<Board {...makeProps({ rendered: [] })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("returns null when boardRenderIndex is out of range", () => {
    const { container } = render(
      <Board {...makeProps({ boardRenderIndex: 2 })} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("mounts the active SVG into the board container", () => {
    render(<Board {...makeProps()} />);
    const board = document.getElementById("svg");
    expect(board).not.toBeNull();
    expect(board.children).toHaveLength(1);
    expect(board.children[0].getAttribute("data-label")).toBe("board-0");
  });

  it("syncs boardImage ref to the board container", () => {
    const props = makeProps();
    render(<Board {...props} />);
    expect(props.boardImage.current).toBe(document.getElementById("svg"));
  });

  it("shows the SVG at boardRenderIndex", () => {
    render(<Board {...makeProps({ boardRenderIndex: 1 })} />);
    const board = document.getElementById("svg");
    expect(board.children[0].getAttribute("data-label")).toBe("board-1");
  });

  it("applies colourContext background via board style", () => {
    render(<Board {...makeProps({ colourContext: { background: "#abcdef" } })} />);
    const board = document.getElementById("svg");
    expect(board.style.backgroundColor).not.toBe("");
    expect(board.style.backgroundColor).toMatch(/^rgb\(/);
  });

  it("keeps the mounted SVG when only colourContext changes", () => {
    const props = makeProps();
    const { rerender } = render(<Board {...props} />);
    const board = document.getElementById("svg");
    const mountedSvg = board.children[0];

    rerender(
      <Board {...props} colourContext={{ background: "#000000" }} />
    );

    expect(board.children).toHaveLength(1);
    expect(board.children[0]).toBe(mountedSvg);
    expect(board.style.backgroundColor).toBe("rgb(0, 0, 0)");
  });

  it("updates SVG height style when full size is toggled", () => {
    render(<Board {...makeProps()} />);
    const board = document.getElementById("svg");
    const svg = board.children[0];
    expect(svg.style.height).toBe("");

    fireEvent.click(
      document.querySelector('button[title="ToggleFullSize"]')
    );

    expect(svg.style.height).toBe("auto");
  });

  it("mounts SVG in stackboard container when stackExpanding is true", () => {
    render(<Board {...makeProps({ stackExpanding: true })} />);
    const stackboard = document.querySelector(".stackboard#svg");
    expect(stackboard).not.toBeNull();
    expect(stackboard.children[0].getAttribute("data-label")).toBe("board-0");
    expect(document.querySelector(".board .stack")).not.toBeNull();
  });
});
