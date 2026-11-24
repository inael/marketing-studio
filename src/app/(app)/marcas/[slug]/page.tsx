import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrand } from "@/server/brands";
import { listTimeslots } from "@/server/timeslots";
import { listPosts } from "@/server/posts";
import { listSources } from "@/server/sources";
import { saveBrand, addSlot, removeSlot, addSourceAction, removeSourceAction, toggleSlot } from "../actions";
import { PageHeader, btnPrimary, btnGhost, inputCls, labelCls } from "@/components/ui";
import { BrandIdentity } from "@/components/brand-identity";
import { Connections } from "@/components/connections";
import { BrandLogo } from "@/components/brand-logo";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const hhmm = (h: number, m: number) =>
  `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

export default async function EditBrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const b = await getBrand(slug);
  if (!b) notFound();

  const slots = await listTimeslots(b.id);
  // D25: posts publicados da marca por faixa de horario (dado real, sem media inventada)
  const publicadosDaMarca = (await listPosts()).filter((p) => p.brand_id === b.id && p.status === "published" && !p.deleted_at);
  const faixas = Array.from({ length: 8 }, (_, i) => ({
    de: i * 3,
    n: publicadosDaMarca.filter((p) => {
      const d = new Date(p.scheduled_at ?? p.updated_at);
      return Math.floor(d.getHours() / 3) === i;
    }).length,
  }));
  const sources = await listSources(b.id);
  const rss = sources.filter((s) => s.kind === "rss");
  const competitors = sources.filter((s) => s.kind === "competitor");
  const igEnv = Boolean(process.env[`META_${b.slug.toUpperCase()}_IG_USER_ID`]);
  const igConnected = Boolean(b.ig_user_id) || igEnv;
  const linkedinConnected = Boolean(b.linkedin_org_id);
  const action = saveBrand.bind(null, b.id);

  return (
    <>
      <PageHeader
        title={b.nome}
        subtitle={`@${b.slug}`}
        action={
          <Link href="/marcas" className={btnGhost}>
            Voltar
          </Link>
        }
      />

      {/* M15: saude da marca em uma frase e atalhos para cada ajuste */}
      <div className="mb-6 w-full space-y-3">
        <p className="text-sm text-dim">
          {b.ig_user_id ? "Instagram conectado" : "Instagram pendente"} · {slots.length > 0 ? `${slots.length} horário(s) fixo(s)` : "sem horários fixos"}
        </p>
        <nav aria-label="Ajustes da marca" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <a href="#horarios" className="min-h-11 rounded-md border border-line px-3 py-2 text-center text-xs text-dim hover:text-ink">Horários · {slots.length}</a>
          <a href="#conta" className="min-h-11 rounded-md border border-line px-3 py-2 text-center text-xs text-dim hover:text-ink">Conta</a>
          <a href="#identidade" className="min-h-11 rounded-md border border-line px-3 py-2 text-center text-xs text-dim hover:text-ink">Identidade</a>
          <Link href={`/marcas/${b.slug}/referencias`} className="min-h-11 rounded-md border border-line px-3 py-2 text-center text-xs text-dim hover:text-ink">Referências visuais</Link>
        </nav>
      </div>

      {/* D42: primeiros passos da marca, com o que ja foi feito */}
      {(() => {
        const passos = [
          { ok: igConnected, texto: "Conectar o Instagram", href: `/marcas/${b.slug}/conectar` },
          { ok: linkedinConnected, texto: "Conectar o LinkedIn (quando liberado)", href: `/marcas/${b.slug}` },
          { ok: slots.length > 0, texto: "Definir horários fixos", href: `/marcas/${b.slug}` },
          { ok: sources.length > 0, texto: "Adicionar uma fonte de pauta (RSS ou concorrente)", href: `/marcas/${b.slug}` },
        ];
        const feitos = passos.filter((p) => p.ok).length;
        if (feitos === passos.length) return null;
        return (
          <div className="mb-6 w-full rounded-lg border border-line bg-panel p-4">
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="font-medium text-ink">Primeiros passos</span>
              <span className="text-faint">{feitos} de {passos.length} feitos</span>
            </div>
            <ul className="space-y-2 text-sm">
              {passos.map((p) => (
                <li key={p.texto} className="flex items-center gap-3">
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] ${p.ok ? "bg-ok/15 text-ok" : "bg-panel2 text-faint"}`}>
                    {p.ok ? "✓" : ""}
                  </span>
                  {p.ok ? (
                    <span className="text-faint line-through">{p.texto}</span>
                  ) : (
                    <Link href={p.href} className="text-dim hover:text-ink">{p.texto}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })()}

      <div className="mb-6 w-full">
        <label className={labelCls}>Logo da marca</label>
        <BrandLogo brandId={b.id} slug={b.slug} logo={b.logo_url} igPicture={b.ig_picture} cor={b.cor_principal} nome={b.nome} />
      </div>

      <form id="identidade" action={action} className="w-full space-y-6">
        {/* D23: identidade com previa ao vivo e checagem de contraste */}
        <BrandIdentity
          slug={b.slug}
          initial={{
            nome: b.nome,
            cor_principal: b.cor_principal,
            fonte: b.fonte ?? "",
            site_url: b.site_url ?? "",
            tom_voz: b.tom_voz ?? "",
          }}
        />

        <fieldset id="ig-fields" className="scroll-mt-8 space-y-5 rounded-lg border border-line bg-panel/50 p-5">
          <legend className="px-2 text-xs font-medium uppercase tracking-wide text-faint">
            Instagram
          </legend>
          {igEnv && (
            <p className="text-xs text-ok">
              Conta já resolvida por variável de ambiente (META_{b.slug.toUpperCase()}_*). Preencha
              abaixo só se quiser sobrescrever pelo banco.
            </p>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="ig_user_id">
                IG User ID
              </label>
              <input
                id="ig_user_id"
                name="ig_user_id"
                defaultValue={b.ig_user_id ?? ""}
                placeholder="1784145…"
                className={`${inputCls} font-mono`}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="ig_token">
                Token de acesso
              </label>
              <input
                id="ig_token"
                name="ig_token"
                type="password"
                placeholder={b.ig_token ? "•••• (mantém o atual)" : "colar token"}
                className={`${inputCls} font-mono`}
                autoComplete="off"
              />
            </div>
          </div>
        </fieldset>

        <fieldset id="linkedin-fields" className="scroll-mt-8 space-y-5 rounded-lg border border-line bg-panel/50 p-5">
          <legend className="px-2 text-xs font-medium uppercase tracking-wide text-faint">
            LinkedIn
          </legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="linkedin_org_id">
                Organization ID
              </label>
              <input
                id="linkedin_org_id"
                name="linkedin_org_id"
                defaultValue={b.linkedin_org_id ?? ""}
                placeholder="urn:li:organization:…"
                className={`${inputCls} font-mono`}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="linkedin_token">
                Token de acesso
              </label>
              <input
                id="linkedin_token"
                name="linkedin_token"
                type="password"
                placeholder={b.linkedin_token ? "•••• (mantém o atual)" : "colar token"}
                className={`${inputCls} font-mono`}
                autoComplete="off"
              />
            </div>
          </div>
        </fieldset>

        <label className="flex items-center gap-3 text-sm text-dim">
          <input
            type="checkbox"
            name="ativo"
            defaultChecked={b.ativo}
            className="h-4 w-4 rounded border-line bg-panel2 accent-ok"
          />
          Marca ativa (aparece ao criar posts)
        </label>

        <div className="flex gap-3 border-t border-line pt-5">
          <button type="submit" className={btnPrimary}>
            Salvar
          </button>
          <Link href="/marcas" className={btnGhost}>
            Cancelar
          </Link>
        </div>
      </form>

      <section id="horarios" className="mt-10 w-full border-t border-line pt-8">
        <h2 className="text-sm font-semibold text-ink">Horários fixos</h2>
        <p className="mt-1 text-xs text-dim">
          Horários padrão da marca. O &ldquo;Auto-agendar&rdquo; no Criar joga o post no próximo
          horário livre.
        </p>
        {/* D25: grade semanal das janelas cadastradas (horas x dias) */}
        <div className="mt-5 overflow-x-auto rounded-lg border border-line">
          {(() => {
            const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
            const ordem = [1, 2, 3, 4, 5, 6, 0];
            // D25: a grade cobre 06h a 23h para pintar qualquer horario
            const horas = Array.from({ length: 18 }, (_, i) => 6 + i);
            const marcado = (wd: number, h: number) => slots.some((s) => s.weekday === wd && s.hour === h);
            if (horas.length === 0) return <p className="p-4 text-xs text-faint">Nenhuma janela marcada.</p>;
            return (
              <table className="w-full min-w-[420px] text-center text-[11px]">
                <thead>
                  <tr className="border-b border-line text-faint">
                    <th className="px-2 py-1.5 text-left font-normal">Hora</th>
                    {ordem.map((wd) => (
                      <th key={wd} className="px-2 py-1.5 font-normal">{dias[ordem.indexOf(wd)]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {horas.map((h) => (
                    <tr key={h} className="border-b border-line last:border-b-0">
                      <td className="px-2 py-1.5 text-left text-dim">{String(h).padStart(2, "0")}h</td>
                      {ordem.map((wd) => (
                        <td key={wd} className="px-1 py-1">
                          <form action={toggleSlot.bind(null, b.id, b.slug, wd, h)}>
                            <button
                              type="submit"
                              aria-label={`${dias[ordem.indexOf(wd)]} ${String(h).padStart(2, "0")}h ${marcado(wd, h) ? "marcado" : "livre"}`}
                              className={`block h-5 w-full rounded transition-colors ${marcado(wd, h) ? "bg-info/70 hover:bg-info/40" : "bg-panel2 hover:bg-line2"}`}
                            />
                          </form>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </div>
        {/* D25: historico ao lado da grade: posts publicados por faixa de horario (engajamento ainda nao e guardado) */}
        <div className="mt-5 rounded-lg border border-line p-4">
          <div className="text-xs font-medium text-dim">Histórico: posts publicados por faixa de horário</div>
          <div className="mt-3 flex items-end gap-2">
            {faixas.map((f) => {
              const max = Math.max(1, ...faixas.map((x) => x.n));
              return (
                <div key={f.de} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] text-faint">{f.n}</span>
                  <div className="flex h-16 w-full items-end"><div className="w-full rounded-t bg-info/70" style={{ height: `${(f.n / max) * 100}%` }} /></div>
                  <span className="text-[10px] text-faint">{String(f.de).padStart(2, "0")}h</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {slots.length === 0 && <span className="text-sm text-faint">Nenhum horário ainda.</span>}
          {slots.map((s) => (
            <form key={s.id} action={removeSlot.bind(null, s.id, b.slug)}>
              <button className="group inline-flex items-center gap-2 rounded-full border border-line bg-panel2 px-3 py-1.5 text-xs text-dim transition-colors hover:border-bad/50 hover:text-bad">
                <span>{WEEKDAYS[s.weekday]}</span>
                <span className="font-mono text-ink group-hover:text-bad">{hhmm(s.hour, s.minute)}</span>
                <span aria-hidden>×</span>
              </button>
            </form>
          ))}
        </div>
        <form action={addSlot.bind(null, b.id, b.slug)} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className={labelCls} htmlFor="weekday">Dia</label>
            <select id="weekday" name="weekday" defaultValue="1" className={inputCls}>
              {WEEKDAYS.map((w, i) => (
                <option key={i} value={i}>{w}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="time">Hora</label>
            <input id="time" name="time" type="time" defaultValue="09:00" className={inputCls} required />
          </div>
          <button type="submit" className={btnGhost}>Adicionar</button>
        </form>
      </section>

      <section id="conta" className="mt-10 w-full border-t border-line pt-8">
        <h2 className="text-sm font-semibold text-ink">Conexões</h2>
        <p className="mt-1 text-xs text-dim">
          Conecte as redes desta marca. Instagram e LinkedIn já publicam pelo estúdio.
        </p>
        <div className="mt-5">
          <Connections
            brandId={b.id}
            brandSlug={b.slug}
            igConnected={igConnected}
            linkedinConnected={linkedinConnected}
          />
        </div>
      </section>

      <section className="mt-10 w-full border-t border-line pt-8">
        <h2 className="text-sm font-semibold text-ink">Fontes de conteúdo</h2>
        <p className="mt-1 text-xs text-dim">
          Feeds RSS de notícias e concorrentes no Instagram. A IA usa como inspiração (temas e
          ângulos que engajam) pra sugerir posts originais no tom da marca, nunca copiar.
        </p>

        <div className="mt-5">
          <div className="text-xs font-medium text-faint">Feeds RSS (notícias)</div>
          <div className="mt-2 space-y-1.5">
            {rss.length === 0 && <span className="text-sm text-faint">Nenhum feed ainda.</span>}
            {rss.map((s) => (
              <form
                key={s.id}
                action={removeSourceAction.bind(null, s.id, b.slug)}
                className="flex items-center gap-2"
              >
                <span className="min-w-0 flex-1 truncate rounded-md border border-line bg-panel2 px-3 py-1.5 text-xs text-dim">
                  {s.value}
                </span>
                <button className="rounded-md border border-line px-2.5 py-1.5 text-xs text-faint transition-colors hover:border-bad/50 hover:text-bad">
                  remover
                </button>
              </form>
            ))}
          </div>
          <form action={addSourceAction.bind(null, b.id, b.slug)} className="mt-2 flex gap-2">
            <input type="hidden" name="kind" value="rss" />
            <input name="value" placeholder="https://site.com/feed" className={inputCls} required />
            <button type="submit" className={btnGhost}>
              Adicionar
            </button>
          </form>
        </div>

        <div className="mt-6">
          <div className="text-xs font-medium text-faint">Concorrentes (Instagram)</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {competitors.length === 0 && (
              <span className="text-sm text-faint">Nenhum concorrente ainda.</span>
            )}
            {competitors.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-panel2 px-3 py-1.5 text-xs"
              >
                <a
                  href={`https://instagram.com/${s.value}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Abrir no Instagram"
                  className="font-mono text-dim transition-colors hover:text-info hover:underline"
                >
                  @{s.value}
                </a>
                <form action={removeSourceAction.bind(null, s.id, b.slug)} className="flex">
                  <button
                    type="submit"
                    title="Remover concorrente"
                    aria-label="Remover concorrente"
                    className="text-faint transition-colors hover:text-bad"
                  >
                    ×
                  </button>
                </form>
              </span>
            ))}
          </div>
          <form action={addSourceAction.bind(null, b.id, b.slug)} className="mt-2 flex gap-2">
            <input type="hidden" name="kind" value="competitor" />
            <input name="value" placeholder="@perfil_publico" className={inputCls} required />
            <button type="submit" className={btnGhost}>
              Adicionar
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
