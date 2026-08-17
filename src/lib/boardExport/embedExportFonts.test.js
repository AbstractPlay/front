import { describe, expect, it } from "vitest";
import { primaryFontFamily } from "./embedExportFonts";
import { inlineTextStylesFromLive } from "./inlineSvgTextStyles";

describe("embedExportFonts", () => {
  it("extracts the primary font from a CSS font stack", () => {
    expect(primaryFontFamily('"Cardo", serif')).toBe("Cardo");
    expect(primaryFontFamily("Josefin Sans, sans-serif")).toBe("Josefin Sans");
  });
});

describe("inlineSvgTextStyles", () => {
  it("copies computed typography onto export text nodes", () => {
    const liveSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const cloneSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const liveText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const cloneText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    liveText.textContent = "A";
    cloneText.textContent = "A";
    liveSvg.appendChild(liveText);
    cloneSvg.appendChild(cloneText);

    const mount = document.createElement("div");
    mount.className = "board";
    mount.appendChild(liveSvg);
    document.body.appendChild(mount);
    liveText.style.fontFamily = "Cardo, serif";
    liveText.style.fontSize = "24px";
    liveText.style.fontWeight = "700";

    inlineTextStylesFromLive(liveSvg, cloneSvg);

    expect(cloneText.getAttribute("font-family")).toBe("Cardo");
    expect(cloneText.getAttribute("font-size")).toBe("24px");
    expect(cloneText.getAttribute("font-weight")).toBe("700");

    document.body.removeChild(mount);
  });
});
