// Dados simulados (mock) — Sprint 1.
// Estrutura alinhada ao Diagrama de Classes do Projeto Integrador II (Medicamento, Lote, ThresholdConfig).
// Quando o back-end (US10 · RF10) estiver disponível, troque a implementação em `src/services/api.js`
// por chamadas reais à API — as páginas não precisam mudar, pois só conhecem `services/api.js`.

export const usuarioAtual = {
  id: "u1",
  nome: "Ana Costa",
  email: "ana.farmaceutica@farmaviva.com.br",
  perfilAcesso: "FARMACEUTICO", // GESTOR | FARMACEUTICO | AUXILIAR
};

// ThresholdConfig — limiares globais dos alertas (RF12 / US12)
export const thresholdConfigInicial = {
  diasAlertaAmarelo: 60,
  diasAlertaVermelho: 15,
};

// Medicamento + Lote (aninhados aqui para simplificar o mock; no back-end seriam tabelas relacionadas)
export const medicamentosIniciais = [
  {
    id: "m1",
    nome: "Dipirona Sódica 500mg",
    principioAtivo: "Dipirona monoidratada",
    descricao: "Comprimido revestido, caixa com 20 unidades.",
    dataCadastro: "2026-02-10",
    lotes: [
      { id: "l1", numeroLote: "L-2281", dataFabricacao: "2025-02-05", dataValidade: "2026-08-07", quantidade: 36 },
      { id: "l2", numeroLote: "L-2299", dataFabricacao: "2025-09-01", dataValidade: "2027-03-01", quantidade: 140 },
    ],
  },
  {
    id: "m2",
    nome: "Amoxicilina 500mg",
    principioAtivo: "Amoxicilina tri-hidratada",
    descricao: "Cápsula, caixa com 21 unidades.",
    dataCadastro: "2026-01-22",
    lotes: [
      { id: "l3", numeroLote: "L-2198", dataFabricacao: "2025-01-10", dataValidade: "2026-08-12", quantidade: 18 },
      { id: "l4", numeroLote: "L-2190", dataFabricacao: "2024-06-01", dataValidade: "2025-07-23", quantidade: 4 },
    ],
  },
  {
    id: "m3",
    nome: "Ibuprofeno 400mg",
    principioAtivo: "Ibuprofeno",
    descricao: "Comprimido revestido, caixa com 20 unidades.",
    dataCadastro: "2026-03-02",
    lotes: [
      { id: "l5", numeroLote: "L-2233", dataFabricacao: "2025-03-01", dataValidade: "2026-08-31", quantidade: 64 },
    ],
  },
  {
    id: "m4",
    nome: "Losartana Potássica 50mg",
    principioAtivo: "Losartana potássica",
    descricao: "Comprimido, caixa com 30 unidades.",
    dataCadastro: "2026-01-15",
    lotes: [
      { id: "l6", numeroLote: "L-2240", dataFabricacao: "2025-04-10", dataValidade: "2026-09-17", quantidade: 112 },
    ],
  },
  {
    id: "m5",
    nome: "Paracetamol 750mg",
    principioAtivo: "Paracetamol",
    descricao: "Comprimido, caixa com 20 unidades.",
    dataCadastro: "2026-02-27",
    lotes: [
      { id: "l7", numeroLote: "L-2255", dataFabricacao: "2025-06-01", dataValidade: "2026-11-08", quantidade: 210 },
    ],
  },
  {
    id: "m6",
    nome: "Omeprazol 20mg",
    principioAtivo: "Omeprazol",
    descricao: "Cápsula, caixa com 28 unidades.",
    dataCadastro: "2026-03-11",
    lotes: [
      { id: "l8", numeroLote: "L-2260", dataFabricacao: "2025-07-01", dataValidade: "2026-12-20", quantidade: 150 },
    ],
  },
  {
    id: "m7",
    nome: "Metformina 850mg",
    principioAtivo: "Cloridrato de metformina",
    descricao: "Comprimido, caixa com 30 unidades.",
    dataCadastro: "2026-03-18",
    lotes: [
      { id: "l9", numeroLote: "L-2270", dataFabricacao: "2025-08-05", dataValidade: "2027-02-28", quantidade: 96 },
    ],
  },
];

export const logAuditoriaInicial = [];
export const movimentacoesIniciais = [];
