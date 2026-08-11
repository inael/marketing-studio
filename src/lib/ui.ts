// Rótulos e metadados de apresentação compartilhados pela UI.

export type StatusKey = "draft" | "approved" | "scheduled" | "published" | "failed";

export const STATUS: Record<StatusKey, { label: string; text: string; dot: string }> = {
  draft: { label: "Rascunho", text: "text-dim", dot: "#6a6a72" },
  approved: { label: "Aprovado", text: "text-ok", dot: "#34d399" },
  scheduled: { label: "Agendado", text: "text-warn", dot: "#fbbf24" },
  published: { label: "Publicado", text: "text-info", dot: "#60a5fa" },
  failed: { label: "Falhou", text: "text-bad", dot: "#fb7185" },
};

export const TIPO: Record<string, string> = {
  image: "Imagem",
  carousel: "Carrossel",
  reel: "Reel",
  story: "Story",
};

export const FORMATO: Record<string, string> = {
  com_personagem: "Com personagem",
  sem_personagem: "Sem personagem",
  demo_ui: "Demo de UI",
};

const DT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return DT.format(d);
}

export function initials(text: string): string {
  const parts = text.replace(/@.*/, "").split(/[.\s_-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").concat(parts[1]?.[0] ?? "").toUpperCase();
}

// contraste de texto sobre a cor da marca (preto ou branco) via luminância
export function readableOn(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "#ffffff";
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#0b0b0c" : "#ffffff";
}
