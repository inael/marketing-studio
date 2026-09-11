import { describe, it, expect } from "vitest";
import { hfError } from "./higgsfield";

// O que a Higgsfield realmente devolve (verificado contra a API em 2026-09-11):
// o motivo vem em `detail`, nunca em `error`/`message`.
describe("hfError", () => {
  it("diz o que fazer quando a conta esta sem credito", () => {
    const msg = hfError(403, { detail: "not_enough_credits" });
    expect(msg).toMatch(/sem créditos/i);
    expect(msg).toMatch(/top-up/i);
    expect(msg).not.toMatch(/retornou 403/);
  });

  it("aponta pra Config quando a credencial e recusada", () => {
    expect(hfError(401, { detail: "Invalid credentials" })).toMatch(/Config/);
  });

  it("resume o array de validacao do 422 em vez de engolir", () => {
    const msg = hfError(422, {
      detail: [{ type: "missing", loc: ["body", "prompt"], msg: "Field required" }],
    });
    expect(msg).toContain("prompt");
    expect(msg).toContain("Field required");
  });

  it("cai no status quando o corpo nao explica nada", () => {
    expect(hfError(500, {})).toBe("Higgsfield retornou 500");
  });
});
