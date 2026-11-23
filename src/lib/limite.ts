// B45: limite de requisicoes por usuario e rota (janela deslizante simples, em memoria).
// Em varios servidores o ideal e um contador compartilhado; aqui protege cada instancia.
const janelas = new Map<string, number[]>();

export function checarLimite(chave: string, max: number, janelaMs: number): { ok: true } | { ok: false; esperarS: number } {
  const agora = Date.now();
  const hist = (janelas.get(chave) ?? []).filter((t) => agora - t < janelaMs);
  if (hist.length >= max) {
    const esperarS = Math.ceil((janelaMs - (agora - hist[0])) / 1000);
    janelas.set(chave, hist);
    return { ok: false, esperarS };
  }
  hist.push(agora);
  janelas.set(chave, hist);
  return { ok: true };
}
