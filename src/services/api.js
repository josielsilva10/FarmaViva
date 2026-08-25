// ---------------------------------------------------------------------------
// Camada de API mockada (Sprint 1 — Front-end com dados simulados).
//
// Quando o back-end real (US10 · RF10) estiver pronto, troque apenas as
// implementações abaixo por chamadas `fetch("/api/...")`. As páginas usam
// somente as funções exportadas aqui, então nenhum componente precisa mudar.
//
// Exemplo de migração futura:
//   export async function getMedicamentos() {
//     const res = await fetch("/api/medicamentos");
//     if (!res.ok) throw new Error("Falha ao carregar medicamentos");
//     return res.json();
//   }
// ---------------------------------------------------------------------------

import {
  medicamentosIniciais,
  thresholdConfigInicial,
  usuarioAtual,
  logAuditoriaInicial,
  movimentacoesIniciais,
} from "../data/mockData";
import { calcularStatus, diasParaVencer, STATUS } from "../utils/validade";

const STORAGE_KEY = "farmaviva_mock_db_v1";
const LATENCY_MS = 260;

function seedDb() {
  return {
    medicamentos: structuredClone(medicamentosIniciais),
    thresholds: structuredClone(thresholdConfigInicial),
    logAuditoria: structuredClone(logAuditoriaInicial),
    movimentacoes: structuredClone(movimentacoesIniciais),
  };
}

function loadDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedDb();
    const parsed = JSON.parse(raw);
    if (!parsed.medicamentos || !parsed.thresholds) return seedDb();
    return parsed;
  } catch {
    return seedDb();
  }
}

function saveDb(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

let db = loadDb();

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
}

function uid(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function registrarLog(acao, usuario = usuarioAtual.nome) {
  db.logAuditoria.unshift({
    id: uid("log_"),
    dataHora: new Date().toISOString(),
    usuario,
    acao,
  });
}

// ----------------------------- Autenticação --------------------------------

export async function autenticar(email, senha) {
  // Protótipo navegável: qualquer combinação preenchida autentica (RF10 exigirá validação real).
  if (!email || !senha) {
    return delay({ ok: false, message: "Informe e-mail e senha." });
  }
  return delay({ ok: true, usuario: usuarioAtual });
}

export function getUsuarioAtual() {
  return usuarioAtual;
}

// ----------------------------- Medicamentos ---------------------------------

export async function getMedicamentos() {
  return delay(structuredClone(db.medicamentos));
}

export async function getMedicamentoById(id) {
  const med = db.medicamentos.find((m) => m.id === id);
  return delay(med ? structuredClone(med) : null);
}

export async function criarMedicamento(payload) {
  const novo = {
    id: uid("m"),
    nome: payload.nome,
    principioAtivo: payload.principioAtivo,
    descricao: payload.descricao || "",
    dataCadastro: new Date().toISOString().slice(0, 10),
    lotes: [
      {
        id: uid("l"),
        numeroLote: payload.numeroLote,
        dataFabricacao: payload.dataFabricacao,
        dataValidade: payload.dataValidade,
        quantidade: Number(payload.quantidade) || 0,
      },
    ],
  };
  db.medicamentos.unshift(novo);
  registrarLog(`Cadastrou o medicamento "${novo.nome}" (lote ${novo.lotes[0].numeroLote}).`);
  saveDb(db);
  return delay(structuredClone(novo));
}

export async function atualizarMedicamento(id, payload) {
  const med = db.medicamentos.find((m) => m.id === id);
  if (!med) return delay({ ok: false });
  Object.assign(med, payload);
  registrarLog(`Atualizou o cadastro do medicamento "${med.nome}".`);
  saveDb(db);
  return delay({ ok: true, medicamento: structuredClone(med) });
}

export async function excluirMedicamento(id) {
  const med = db.medicamentos.find((m) => m.id === id);
  db.medicamentos = db.medicamentos.filter((m) => m.id !== id);
  if (med) registrarLog(`Excluiu o medicamento "${med.nome}".`);
  saveDb(db);
  return delay({ ok: true });
}

// -------------------------------- Estoque -----------------------------------

/** Lista achatada de lotes com status calculado — usada no Estoque e no Dashboard. */
export async function getLotesComStatus({ busca = "", statusFiltro = null } = {}) {
  const thresholds = db.thresholds;
  let linhas = db.medicamentos.flatMap((med) =>
    med.lotes.map((lote) => ({
      medicamentoId: med.id,
      medicamentoNome: med.nome,
      principioAtivo: med.principioAtivo,
      ...lote,
      status: calcularStatus(lote.dataValidade, thresholds),
      diasRestantes: diasParaVencer(lote.dataValidade),
    }))
  );

  if (busca.trim()) {
    const termo = busca.trim().toLowerCase();
    linhas = linhas.filter(
      (l) => l.medicamentoNome.toLowerCase().includes(termo) || l.principioAtivo.toLowerCase().includes(termo)
    );
  }
  if (statusFiltro) {
    linhas = linhas.filter((l) => l.status === statusFiltro);
  }

  linhas.sort((a, b) => a.diasRestantes - b.diasRestantes);
  return delay(linhas);
}

/** Lotes de um medicamento específico, já ordenados por FEFO (validade crescente). */
export async function getLotesPorMedicamentoFEFO(medicamentoId) {
  const med = db.medicamentos.find((m) => m.id === medicamentoId);
  if (!med) return delay([]);
  const thresholds = db.thresholds;
  const lotes = [...med.lotes]
    .sort((a, b) => new Date(a.dataValidade) - new Date(b.dataValidade))
    .map((lote) => ({
      ...lote,
      status: calcularStatus(lote.dataValidade, thresholds),
      diasRestantes: diasParaVencer(lote.dataValidade),
    }));
  return delay(lotes);
}

// ------------------------------ Thresholds ----------------------------------

export async function getThresholds() {
  return delay(structuredClone(db.thresholds));
}

export async function atualizarThresholds(payload) {
  db.thresholds = {
    diasAlertaAmarelo: Number(payload.diasAlertaAmarelo),
    diasAlertaVermelho: Number(payload.diasAlertaVermelho),
  };
  registrarLog(
    `Ajustou os thresholds de alerta (amarelo: ${db.thresholds.diasAlertaAmarelo}d, vermelho: ${db.thresholds.diasAlertaVermelho}d).`
  );
  saveDb(db);
  return delay(structuredClone(db.thresholds));
}

// -------------------------------- Dashboard ---------------------------------

export async function getDashboardAlertas() {
  const thresholds = db.thresholds;
  const lotes = db.medicamentos.flatMap((med) =>
    med.lotes.map((lote) => ({
      medicamentoId: med.id,
      medicamentoNome: med.nome,
      ...lote,
      status: calcularStatus(lote.dataValidade, thresholds),
      diasRestantes: diasParaVencer(lote.dataValidade),
    }))
  );

  const totalUnidades = lotes.reduce((acc, l) => acc + l.quantidade, 0);
  const porStatus = { VERDE: 0, AMARELO: 0, VERMELHO: 0, EXPIRADO: 0 };
  lotes.forEach((l) => {
    porStatus[l.status] += l.quantidade;
  });

  const criticos = porStatus.VERMELHO + porStatus.EXPIRADO;
  const pct = (n) => (totalUnidades === 0 ? 0 : Math.round((n / totalUnidades) * 100));

  const itensAtencao = lotes
    .filter((l) => l.status === STATUS.VERMELHO || l.status === STATUS.AMARELO || l.status === STATUS.EXPIRADO)
    .sort((a, b) => a.diasRestantes - b.diasRestantes)
    .slice(0, 8);

  return delay({
    totalItens: totalUnidades,
    totalMedicamentos: db.medicamentos.length,
    pctVerde: pct(porStatus.VERDE),
    pctAmarelo: pct(porStatus.AMARELO),
    pctCritico: pct(criticos),
    unidadesVerde: porStatus.VERDE,
    unidadesAmarelo: porStatus.AMARELO,
    unidadesCritico: criticos,
    itensAtencao,
    linhaTempo: [...lotes].sort((a, b) => a.diasRestantes - b.diasRestantes).slice(0, 7),
    thresholds,
  });
}

// ------------------------------ Dispensação ---------------------------------

export async function registrarDispensacao({ medicamentoId, loteId, quantidade }) {
  const med = db.medicamentos.find((m) => m.id === medicamentoId);
  if (!med) return delay({ ok: false, erro: "Medicamento não encontrado." });

  const lote = med.lotes.find((l) => l.id === loteId);
  if (!lote) return delay({ ok: false, erro: "Lote inválido ou inexistente." });

  const status = calcularStatus(lote.dataValidade, db.thresholds);
  if (status === STATUS.EXPIRADO) {
    registrarLog(`Tentativa bloqueada: dispensação do lote vencido ${lote.numeroLote} (${med.nome}).`);
    saveDb(db);
    return delay({ ok: false, erro: "Este lote está vencido. A dispensação foi bloqueada." });
  }

  const qtd = Number(quantidade);
  if (!qtd || qtd <= 0) {
    return delay({ ok: false, erro: "Informe uma quantidade válida." });
  }
  if (qtd > lote.quantidade) {
    registrarLog(`Tentativa bloqueada: saída maior que o disponível no lote ${lote.numeroLote}.`);
    saveDb(db);
    return delay({ ok: false, erro: `Quantidade indisponível. Restam apenas ${lote.quantidade} unidades no lote.` });
  }

  lote.quantidade -= qtd;
  db.movimentacoes.unshift({
    id: uid("mov_"),
    tipo: "SAIDA",
    quantidade: qtd,
    dataHora: new Date().toISOString(),
    usuarioResponsavel: usuarioAtual.nome,
    medicamentoNome: med.nome,
    numeroLote: lote.numeroLote,
  });
  registrarLog(`Registrou saída de ${qtd} unidade(s) de ${med.nome} (lote ${lote.numeroLote}).`);
  saveDb(db);

  return delay({ ok: true, quantidadeRestante: lote.quantidade });
}

// ------------------------------ Relatórios / Log -----------------------------

export async function getRelatorioProximosVencimento() {
  const linhas = await getLotesComStatus();
  return delay({
    geradoEm: new Date().toISOString(),
    itens: linhas.filter((l) => l.status !== STATUS.VERDE),
  });
}

export async function getLogAuditoria() {
  return delay(structuredClone(db.logAuditoria));
}

export async function resetarDadosMock() {
  db = seedDb();
  saveDb(db);
  return delay({ ok: true });
}
