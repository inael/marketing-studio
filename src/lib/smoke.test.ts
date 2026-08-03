import { describe, expect, it } from "vitest";

// Teste de fumaça: garante que o pipeline de testes (vitest) funciona
// desde a fundação do projeto, antes de existirem testes de domínio.
describe("smoke", () => {
  it("sobe o pipeline de testes", () => {
    expect(1 + 1).toBe(2);
  });
});
