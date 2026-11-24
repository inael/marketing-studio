// D41: um provedor de IA por funcao, com um provedor de reserva quando houver outro configurado.
// Derivado da configuracao atual: o provedor principal vem de "ai_provider"; a reserva e o outro.
const NOME: Record<string, string> = { usetokia: "UseTokia", litellm: "LiteLLM" };

export function IaFuncoes({
  provider,
  usetokiaOk,
  litellmOk,
}: {
  provider: string;
  usetokiaOk: boolean;
  litellmOk: boolean;
}) {
  const principal = provider === "litellm" ? "litellm" : "usetokia";
  const reserva = principal === "litellm" ? "usetokia" : "litellm";
  const ok = (p: string) => (p === "litellm" ? litellmOk : usetokiaOk);
  const reservaOk = ok(reserva);

  const funcoes = [
    { funcao: "Sugestões", principal: true },
    { funcao: "Legendas", principal: true },
    { funcao: "Gestão (manager)", principal: true },
    { funcao: "Insights", principal: true },
  ];

  return (
    <section className="mb-8 w-full space-y-4 rounded-xl border border-line bg-panel/50 p-6">
      <h2 className="text-sm font-semibold text-ink">Provedor de IA por função</h2>
      <p className="text-xs text-dim">
        Cada função usa um provedor principal. Se ele falhar, a reserva assume, quando estiver configurada.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-line text-left text-faint">
              <th className="py-2 pr-3 font-medium">Função</th>
              <th className="py-2 px-3 font-medium">Principal</th>
              <th className="py-2 px-3 font-medium">Reserva</th>
            </tr>
          </thead>
          <tbody>
            {funcoes.map((f) => (
              <tr key={f.funcao} className="border-b border-line/60">
                <td className="py-2 pr-3 text-dim">{f.funcao}</td>
                <td className="px-3">
                  <span className={ok(principal) ? "text-ok" : "text-warn"}>{NOME[principal]}</span>
                  {!ok(principal) && <span className="ml-1 text-faint">(não configurado)</span>}
                </td>
                <td className="px-3">
                  {reservaOk ? (
                    <span className="text-dim">{NOME[reserva]}</span>
                  ) : (
                    <span className="text-faint">sem reserva configurada</span>
                  )}
                </td>
              </tr>
            ))}
            <tr className="border-b border-line/60">
              <td className="py-2 pr-3 text-dim">Imagens</td>
              <td className="px-3 text-dim">Higgsfield</td>
              <td className="px-3 text-faint">-</td>
            </tr>
          </tbody>
        </table>
      </div>
      <a href="#ia-texto" className="text-xs text-info hover:underline">trocar o provedor principal →</a>
    </section>
  );
}
