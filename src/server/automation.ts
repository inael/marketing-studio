import { listBrands } from "./brands";
import { getAiConfig, getSettings } from "./settings";
import { generateSuggestions, type Idea } from "./planner";
import { createPost, listTodayAutoDrafts, setPostStatus, type Post } from "./posts";
import { publishPost } from "./publish";

const TIPOS: Post["tipo"][] = ["image", "carousel", "reel", "story"];
const asTipo = (f?: string): Post["tipo"] => (TIPOS.includes(f as Post["tipo"]) ? (f as Post["tipo"]) : "image");

/**
 * Cron da manhã: para cada marca ativa, o time gera sugestões e as melhores
 * viram RASCUNHOS (origem=auto), prontos pra você aprovar. Opt-in via
 * app_settings.automacao_ativa = "on". Não publica nada — só cria rascunho.
 */
export async function planMorning(): Promise<{ ok: boolean; skipped?: string; brands?: unknown[] }> {
  const settings = await getSettings();
  if (settings.automacao_ativa !== "on") return { ok: true, skipped: "automacao_ativa desligada" };

  const cfg = await getAiConfig(settings);
  if (!cfg) return { ok: true, skipped: "sem IA de texto configurada" };

  const brands = await listBrands();
  const out: unknown[] = [];

  for (const brand of brands) {
    try {
      const { noticias, concorrentes } = await generateSuggestions(brand, cfg);
      // 2 de notícias + 1 de concorrentes = até 3 rascunhos/marca
      const picks: Idea[] = [...noticias.slice(0, 2), ...concorrentes.slice(0, 1)];
      let n = 0;
      for (const idea of picks) {
        if (!idea.legenda) continue;
        await createPost({
          brand_id: brand.id,
          tipo: asTipo(idea.formato),
          formato: "sem_personagem",
          legenda: idea.legenda,
          hashtags: [],
          media: [],
          status: "draft",
          origem: "auto",
        });
        n++;
      }
      out.push({ brand: brand.slug, drafts: n });
    } catch (e) {
      out.push({ brand: brand.slug, error: e instanceof Error ? e.message : "erro" });
    }
  }
  return { ok: true, brands: out };
}

/**
 * Cron do gestor: se você não aprovou manualmente até o horário, o gestor
 * aprova e publica o melhor rascunho automático DO DIA que já tiver mídia.
 * Opt-in via app_settings.automacao_gestor = "on". Rascunhos sem mídia ficam
 * intactos (auto-publicar exige imagem/vídeo).
 */
export async function managerAutopilot(): Promise<{ ok: boolean; skipped?: string; brands?: unknown[] }> {
  const settings = await getSettings();
  if (settings.automacao_gestor !== "on") return { ok: true, skipped: "automacao_gestor desligada" };

  const brands = await listBrands();
  const out: unknown[] = [];

  for (const brand of brands) {
    try {
      const drafts = await listTodayAutoDrafts(brand.id);
      const publishable = drafts.filter((d) => Array.isArray(d.media) && d.media.length > 0);
      if (!publishable.length) {
        out.push({ brand: brand.slug, acao: drafts.length ? "rascunhos sem mídia, pulado" : "nada pendente" });
        continue;
      }
      // gestor escolhe o primeiro (top da fila) e publica
      const chosen = publishable[0];
      await setPostStatus(chosen.id, "approved");
      const r = await publishPost(chosen.id);
      out.push({ brand: brand.slug, post: chosen.id, ...(r.ok ? { publicado: true } : { erro: r.error }) });
    } catch (e) {
      out.push({ brand: brand.slug, error: e instanceof Error ? e.message : "erro" });
    }
  }
  return { ok: true, brands: out };
}
