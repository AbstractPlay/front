import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import InputModeOptionsPicker from "./InputModeOptionsPicker";

vi.mock("@abstractplay/gameslib", async (importOriginal) => {
  const flat = [
    { uid: "basic", name: "Basic" },
    { uid: "advanced", name: "Advanced" },
  ];
  const grouped = flat.map((mode) => ({ ...mode, group: "entry" }));
  const gameinfo = new Map(
    [
      ["flat", flat],
      ["grouped", grouped],
    ].map(([uid, inputModes]) => [uid, { uid, inputModes, playercounts: [2] }]),
  );
  return {
    ...(await importOriginal()),
    gameinfo,
    GameFactory: (uid) => ({
      inputModes: () => gameinfo.get(uid).inputModes,
    }),
  };
});

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal()),
  useTranslation: () => ({ t: (key) => key }),
}));

describe("InputModeOptionsPicker", () => {
  it.each([
    ["flat", 2],
    ["grouped", 3],
  ])("keeps the initial %s selection local until the user changes it", (metaGame, count) => {
    const onChange = vi.fn();
    const { rerender } = render(
      <InputModeOptionsPicker metaGame={metaGame} initialUid="basic" onChange={onChange} />,
    );

    expect(screen.getAllByRole("radio")).toHaveLength(count);
    expect(screen.getByRole("radio", { name: "Basic" })).toBeChecked();
    expect(onChange).not.toHaveBeenCalled();

    const advanced = screen.getByRole("radio", { name: "Advanced" });
    fireEvent.click(advanced);
    expect(advanced).toBeChecked();
    expect(onChange).toHaveBeenCalledExactlyOnceWith("advanced");

    rerender(
      <InputModeOptionsPicker metaGame={metaGame} initialUid="advanced" onChange={onChange} />,
    );
    expect(advanced).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(1);

    rerender(
      <InputModeOptionsPicker metaGame={metaGame} initialUid="basic" onChange={onChange} />,
    );
    expect(screen.getByRole("radio", { name: "Basic" })).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
