// D40: cofre por marca. Valores ficam em app_settings (write-only: a tela so mostra
// "configurado", nunca o valor). Cada alteracao entra num registro curto.

export const COFRE_ITENS = [
  "Senha da conta Instagram",
  "Token do LinkedIn",
  "Chave de e-mail",
] as const;

export type CofreItem = (typeof COFRE_ITENS)[number];

export const chaveCofre = (slug: string, item: string) => `cofre.${slug}.${item}`;

// D40: cada registro diz quem mexeu, quando e o que mudou, sem guardar o valor anterior
export type RegistroCofre = { quando: string; acao: "salvou" | "removeu"; marca: string; item: string; autor?: string | null };

export function lerRegistro(settings: Record<string, string>): RegistroCofre[] {
  try {
    const v = JSON.parse(settings["cofre.log"] || "[]");
    return Array.isArray(v) ? (v as RegistroCofre[]) : [];
  } catch {
    return [];
  }
}
