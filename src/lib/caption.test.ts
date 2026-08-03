import { describe, it, expect } from "vitest";
import { formatCaption } from "./caption";

describe("formatCaption", () => {
  it("sem hashtags retorna o texto", () => {
    expect(formatCaption("oi")).toBe("oi");
  });
  it("adiciona hashtags normalizando o #", () => {
    expect(formatCaption("oi", ["a", "#b"])).toBe("oi\n\n#a #b");
  });
  it("ignora hashtags vazias", () => {
    expect(formatCaption("oi", ["", " ", "x"])).toBe("oi\n\n#x");
  });
});
