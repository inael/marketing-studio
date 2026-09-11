import { describe, it, expect } from "vitest";
import { hfError } from "./higgsfield";

// O que a Higgsfield realmente devolve (verificado contra a API em 2026-09-11):
// o motivo vem em `detail`, nunca em `error`/`message`.
describe("hfError", () => {
  it("diz o que fazer quando a conta esta sem credito", () => {
    const msg = hfError(403, { detail: "not_enough_credits" });
    expect(msg).toMatch(/sem saldo/i);
    expect(msg).toMatch(/recarregue/i);
    expect(msg).not.toMatch(/retornou 403/);
  });

  it("manda recarregar no dashboard da API, nao no app web", () => {
    const msg = hfError(403, { detail: "not_enough_credits" });
    expect(msg).toContain("cloud.higgsfield.ai");
    expect(msg).not.toContain("platform.higgsfield.ai");
  });

  it("explica que os modelos ilimitados do app web nao tem endpoint REST", () => {
    expect(hfError(404, { detail: "model_not_found" })).toMatch(/não existe na API/i);
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
