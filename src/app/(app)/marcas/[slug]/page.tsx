import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrand } from "@/server/brands";
import { saveBrand } from "../actions";
import { PageHeader, btnPrimary, btnGhost, inputCls, labelCls } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EditBrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const b = await getBrand(slug);
  if (!b) notFound();

  const igEnv = Boolean(process.env[`META_${b.slug.toUpperCase()}_IG_USER_ID`]);
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

        <fieldset className="space-y-5 rounded-lg border border-line bg-panel/50 p-5">
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
    </>
  );
}
