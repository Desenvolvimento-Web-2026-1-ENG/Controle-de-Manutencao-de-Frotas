/**
 * Serviço de Integração com a API RESTful (Fetch API)
 * Centraliza as requisições HTTP para o back-end Node.js / Express
 */

const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data.error || data.message || `Erro ${response.status}: Falha na requisição`;
      const error = new Error(message);
      error.status = response.status;
      error.detalhes = data.detalhes || null;
      throw error;
    }

    return data;
  } catch (err) {
    console.error(`[API Error] ${options.method || "GET"} ${url}:`, err);
    throw err;
  }
}

export const api = {
  // Status da Aplicação
  getStatus: () => request("/status"),

  // Dashboard & Alertas
  getDashboardResumo: () => request("/dashboard/resumo"),
  getDashboardAlertas: () => request("/dashboard/alertas"),

  // Veículos
  getVeiculos: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "" && val !== "TODOS") {
        query.append(key, val);
      }
    });
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request(`/veiculos${qs}`);
  },
  getVeiculoPorId: (id) => request(`/veiculos/${id}`),
  getVeiculoHistorico: (id) => request(`/veiculos/${id}/historico`),
  getVeiculosRevisaoImediata: () => request("/veiculos/revisao-imediata"),
  criarVeiculo: (dados) => request("/veiculos", { method: "POST", body: JSON.stringify(dados) }),
  atualizarVeiculo: (id, dados) => request(`/veiculos/${id}`, { method: "PUT", body: JSON.stringify(dados) }),
  atualizarKmVeiculo: (id, kmAtual) => request(`/veiculos/${id}/km`, { method: "PATCH", body: JSON.stringify({ kmAtual }) }),
  deletarVeiculo: (id) => request(`/veiculos/${id}`, { method: "DELETE" }),

  // Ordens de Serviço (O.S.)
  getOrdensServico: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "" && val !== "TODOS") {
        query.append(key, val);
      }
    });
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request(`/ordens-servico${qs}`);
  },
  getOrdemServicoPorId: (id) => request(`/ordens-servico/${id}`),
  criarOrdemServico: (dados) => request("/ordens-servico", { method: "POST", body: JSON.stringify(dados) }),
  atualizarOrdemServico: (id, dados) => request(`/ordens-servico/${id}`, { method: "PUT", body: JSON.stringify(dados) }),
  alterarStatusOS: (id, status, observacoes = "") =>
    request(`/ordens-servico/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, observacoes }),
    }),
  deletarOrdemServico: (id) => request(`/ordens-servico/${id}`, { method: "DELETE" }),

  // Planos de Manutenção
  getPlanosManutencao: () => request("/planos-manutencao"),
  getPlanoPorId: (id) => request(`/planos-manutencao/${id}`),
  criarPlano: (dados) => request("/planos-manutencao", { method: "POST", body: JSON.stringify(dados) }),
  atualizarPlano: (id, dados) => request(`/planos-manutencao/${id}`, { method: "PUT", body: JSON.stringify(dados) }),
  deletarPlano: (id) => request(`/planos-manutencao/${id}`, { method: "DELETE" }),

  // Mecânicos
  getMecanicos: () => request("/mecanicos"),
  getMecanicoPorId: (id) => request(`/mecanicos/${id}`),
  criarMecanico: (dados) => request("/mecanicos", { method: "POST", body: JSON.stringify(dados) }),
  atualizarMecanico: (id, dados) => request(`/mecanicos/${id}`, { method: "PUT", body: JSON.stringify(dados) }),
  deletarMecanico: (id) => request(`/mecanicos/${id}`, { method: "DELETE" }),
};
