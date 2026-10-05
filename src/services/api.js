const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const TOKEN_KEY = "farmaviva_access_token_v1";
const USER_KEY = "farmaviva_user_v1";

export class ApiError extends Error {
  constructor(message, statusCode = 0) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

export function getAccessToken() {
  return typeof window === "undefined" ? null : window.sessionStorage.getItem(TOKEN_KEY);
}

function setSession(token, user) {
  window.sessionStorage.setItem(TOKEN_KEY, token);
  window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function encerrarSessao() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(USER_KEY);
}

export function getUsuarioAtual() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = auth ? getAccessToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError("Não foi possível conectar à API. Verifique se o serviço está em execução e tente novamente.");
  }
  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = { detail: text }; }
  }
  if (!response.ok) {
    if (response.status === 401 && auth) encerrarSessao();
    const detail = data?.detail;
    const message = Array.isArray(detail) ? detail.map((item) => item.msg).join("; ") : detail;
    throw new ApiError(message || "Ocorreu um erro ao comunicar com a API.", response.status);
  }
  return data;
}

export async function autenticar(email, senha) {
  try {
    const result = await request("/auth/login", { method: "POST", body: { email, senha }, auth: false });
    setSession(result.access_token, result.usuario);
    return { ok: true, usuario: result.usuario };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

export async function validarSessao() {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const user = await request("/auth/me");
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch {
    encerrarSessao();
    return null;
  }
}

export async function getMedicamentos() {
  return request("/medicamentos");
}

export async function getMedicamentoById(id) {
  return request(`/medicamentos/${encodeURIComponent(id)}`);
}

export async function criarMedicamento(payload) {
  return request("/medicamentos", { method: "POST", body: payload });
}

export async function atualizarMedicamento(id, payload) {
  return request(`/medicamentos/${encodeURIComponent(id)}`, { method: "PATCH", body: payload });
}

export async function excluirMedicamento(id) {
  return request(`/medicamentos/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function getLotesComStatus({ busca = "", statusFiltro = null } = {}) {
  const params = new URLSearchParams();
  if (busca.trim()) params.set("busca", busca.trim());
  if (statusFiltro) params.set("status", statusFiltro);
  const suffix = params.size ? `?${params.toString()}` : "";
  return request(`/lotes${suffix}`);
}

export async function getLotesPorMedicamentoFEFO(medicamentoId) {
  return request(`/medicamentos/${encodeURIComponent(medicamentoId)}/lotes`);
}

export async function getThresholds() {
  return request("/config/thresholds");
}

export async function atualizarThresholds(payload) {
  return request("/config/thresholds", { method: "PUT", body: payload });
}

export async function getDashboardAlertas() {
  return request("/dashboard/alertas");
}

export async function registrarDispensacao({ medicamentoId, loteId, quantidade, confirmacaoRisco = false }) {
  return request("/dispensacoes", {
    method: "POST",
    body: { medicamentoId, loteId, quantidade, confirmacaoRisco },
  });
}

export async function getRelatorioProximosVencimento() {
  return request("/relatorios/proximos-vencimento");
}

export async function getLogAuditoria() {
  return request("/auditoria");
}
