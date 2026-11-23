// B02: sessao expirada no meio da edicao. Ao receber 401, guarda a tela atual e leva ao login;
// depois do login a pessoa volta para a mesma tela (o rascunho continua no navegador).
export function sessaoExpirou(res: Response): boolean {
  if (res.status !== 401 || typeof window === "undefined") return false;
  const atual = window.location.pathname + window.location.search;
  try {
    sessionStorage.setItem("ms_retorno", atual);
  } catch {
    // sem sessionStorage: o login ainda leva de volta ao painel
  }
  window.location.href = `/entrar?expirou=1&voltar=${encodeURIComponent(atual)}`;
  return true;
}
