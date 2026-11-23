// B24: cache por chave com validade. Evita refazer a mesma busca de fonte a cada abertura.
const guardados = new Map<string, { em: number; valor: unknown }>();

export async function comCache<T>(chave: string, validadeMs: number, buscar: () => Promise<T>): Promise<T> {
  const hit = guardados.get(chave);
  if (hit && Date.now() - hit.em < validadeMs) return hit.valor as T;
  const valor = await buscar();
  guardados.set(chave, { em: Date.now(), valor });
  return valor;
}

export function limparCache(prefixo?: string) {
  for (const k of [...guardados.keys()]) if (!prefixo || k.startsWith(prefixo)) guardados.delete(k);
}
