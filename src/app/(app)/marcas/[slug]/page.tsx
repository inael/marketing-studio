import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrand } from "@/server/brands";
import { listTimeslots } from "@/server/timeslots";
import { listSources } from "@/server/sources";
import { saveBrand, addSlot, removeSlot, addSourceAction, removeSourceAction } from "../actions";
import { PageHeader, btnPrimary, btnGhost, inputCls, labelCls } from "@/components/ui";
import { Connections } from "@/components/connections";

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

      <form action={action} className="max-w-2xl space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="nome">
              Nome
            </label>
            <input id="nome" name="nome" defaultValue={b.nome} className={inputCls} required />
          </div>

          <div>
            <label className={labelCls} htmlFor="cor_principal">
              Cor da marca
            </label>
            <div className="flex items-center gap-3">
              <input
                id="cor_principal"
                name="cor_principal"
                type="color"
                defaultValue={b.cor_principal}
                className="h-9 w-14 cursor-pointer rounded-md border border-line bg-panel2"
              />
              <span className="font-mono text-sm text-dim">{b.cor_principal}</span>
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="fonte">
              Fonte
            </label>
            <input id="fonte" name="fonte" defaultValue={b.fonte} className={inputCls} />
          </div>

          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="site_url">
              Site
            </label>
            <input id="site_url" name="site_url" defaultValue={b.site_url} className={inputCls} />
          </div>

          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="tom_voz">
              Tom de voz <span className="text-faint">(guia a IA ao escrever a legenda)</span>
            </label>
            <textarea
              id="tom_voz"
              name="tom_voz"
              defaultValue={b.tom_voz}
              rows={3}
              className={inputCls}
            />
          </div>
        </div>

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

      <section className="mt-10 max-w-2xl border-t border-line pt-8">
        <h2 className="text-sm font-semibold text-ink">Horários fixos</h2>
        <p className="mt-1 text-xs text-dim">
          Horários padrão da marca. O &ldquo;Auto-agendar&rdquo; no Criar joga o post no próximo
          horário livre.
        </p>
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

      <section className="mt-10 max-w-2xl border-t border-line pt-8">
        <h2 className="text-sm font-semibold text-ink">Conexões</h2>
        <p className="mt-1 text-xs text-dim">
          Conecte as redes desta marca. Instagram e LinkedIn já publicam pelo estúdio.
        </p>
        <div className="mt-5">
          <Connections
            brandId={b.id}
            igConnected={igConnected}
            linkedinConnected={linkedinConnected}
          />
        </div>
      </section>

      <section className="mt-10 max-w-2xl border-t border-line pt-8">
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
              <form key={s.id} action={removeSourceAction.bind(null, s.id, b.slug)}>
                <button className="group inline-flex items-center gap-2 rounded-full border border-line bg-panel2 px-3 py-1.5 text-xs text-dim transition-colors hover:border-bad/50 hover:text-bad">
                  <span className="font-mono">@{s.value}</span>
                  <span aria-hidden>×</span>
                </button>
              </form>
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
