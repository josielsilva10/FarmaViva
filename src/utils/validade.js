// Espelha o método `Lote.calcularStatus(thresholds) : StatusValidade` do diagrama de classes.

export const STATUS = {
  VERDE: "VERDE",
  AMARELO: "AMARELO",
  VERMELHO: "VERMELHO",
  EXPIRADO: "EXPIRADO",
};

export const STATUS_LABEL = {
  VERDE: "Regular",
  AMARELO: "Atenção",
  VERMELHO: "Crítico",
  EXPIRADO: "Vencido",
};

const MS_DIA = 1000 * 60 * 60 * 24;

export function diasParaVencer(dataValidade, hoje = new Date()) {
  const validade = new Date(dataValidade + "T00:00:00");
  const base = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((validade - base) / MS_DIA);
}

export function calcularStatus(dataValidade, thresholds, hoje = new Date()) {
  const dias = diasParaVencer(dataValidade, hoje);
  if (dias < 0) return STATUS.EXPIRADO;
  if (dias <= thresholds.diasAlertaVermelho) return STATUS.VERMELHO;
  if (dias <= thresholds.diasAlertaAmarelo) return STATUS.AMARELO;
  return STATUS.VERDE;
}

export function formatarData(iso) {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function formatarDiasRestantes(dias) {
  if (dias < 0) return `Vencido há ${Math.abs(dias)} dia${Math.abs(dias) === 1 ? "" : "s"}`;
  if (dias === 0) return "Vence hoje";
  return `${dias} dia${dias === 1 ? "" : "s"}`;
}
