/**
 * Frontend SPA Controller - Controle de Manutenção de Frotas
 * Comunicação direta e reativa com a API RESTful em Node.js
 */

const API_BASE = "/api";

// Estado global da aplicação cliente
const state = {
  activeTab: "dashboard",
  veiculos: [],
  planos: [],
  ordensServico: [],
  alertas: [],
  resumo: null,
  filtrosVeiculos: {
    busca: "",
    status: "",
    categoria: "",
    apenasAlertas: false
  },
  filtrosOS: {
    status: "",
    tipo: ""
  }
};

// Inicialização ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
  verificarStatusAPI();
  inicializarNavegacao();
  carregarDadosIniciais();
  configurarEventos();
});

// 1. Verificação de Integridade da API
async function verificarStatusAPI() {
  try {
    const res = await fetch(`${API_BASE}/status`);
    const data = await res.json();
    const statusElem = document.getElementById("api-status-container");
    if (statusElem && data.success) {
      statusElem.innerHTML = `
        <span class="api-status-badge">
          <span class="status-dot"></span>
          API Online (v${data.versao})
        </span>
      `;
    }
  } catch (err) {
    const statusElem = document.getElementById("api-status-container");
    if (statusElem) {
      statusElem.innerHTML = `
        <span class="api-status-badge" style="background: rgba(239,68,68,0.15); color: #f87171; border-color: rgba(239,68,68,0.3)">
          <span class="status-dot" style="background: #ef4444; box-shadow: 0 0 8px #ef4444"></span>
          API Desconectada
        </span>
      `;
    }
  }
}

// 2. Navegação entre Abas / Telas
function inicializarNavegacao() {
  const navBtns = document.querySelectorAll(".nav-item[data-tab]");
  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.getAttribute("data-tab");
      trocarAba(tabName);
    });
  });
}

function trocarAba(tabName) {
  state.activeTab = tabName;

  document.querySelectorAll(".nav-item[data-tab]").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-tab") === tabName);
  });

  document.querySelectorAll(".app-section").forEach((sec) => {
    sec.classList.toggle("active", sec.id === `section-${tabName}`);
  });

  // Atualizar dados da aba
  if (tabName === "dashboard") carregarDashboard();
  if (tabName === "veiculos") carregarVeiculos();
  if (tabName === "os") carregarOrdensServico();
  if (tabName === "planos") carregarPlanos();
}

// 3. Carga de Dados
async function carregarDadosIniciais() {
  await Promise.all([
    carregarPlanos(),
    carregarDashboard(),
    carregarVeiculos(),
    carregarOrdensServico()
  ]);
}

// --- DASHBOARD & ALERTAS ---
async function carregarDashboard() {
  try {
    const [resResumo, resAlertas] = await Promise.all([
      fetch(`${API_BASE}/dashboard/resumo`),
      fetch(`${API_BASE}/dashboard/alertas`)
    ]);

    const dataResumo = await resResumo.json();
    const dataAlertas = await resAlertas.json();

    if (dataResumo.success) {
      state.resumo = dataResumo.data;
      renderizarKPIs(dataResumo.data);
    }

    if (dataAlertas.success) {
      state.alertas = dataAlertas.data;
      renderizarAlertas(dataAlertas.data);
    }
  } catch (err) {
    mostrarToast("Erro ao carregar métricas do dashboard", "error");
  }
}

function renderizarKPIs(resumo) {
  const { frota, financeiro } = resumo;

  document.getElementById("kpi-total-veiculos").textContent = frota.totalVeiculos;
  document.getElementById("kpi-veiculos-operacao").textContent = `${frota.emOperacao} em operação normal`;

  document.getElementById("kpi-alertas-criticos").textContent = frota.revisaoCritica;
  document.getElementById("kpi-alertas-atencao").textContent = `${frota.revisaoAtencao} veículos em atenção`;

  document.getElementById("kpi-veiculos-manutencao").textContent = frota.emManutencao;
  document.getElementById("kpi-os-ativas").textContent = `${resumo.ordensServico.emAndamento} O.S. em andamento`;

  const totalFormatado = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(financeiro.totalGastoGeral);
  document.getElementById("kpi-total-investido").textContent = totalFormatado;
  document.getElementById("kpi-os-concluidas").textContent = `${resumo.ordensServico.concluidas} manutenções concluídas`;
}

function renderizarAlertas(alertasData) {
  const container = document.getElementById("dashboard-alerts-list");
  if (!container) return;

  const todosAlertas = [
    ...(alertasData.alertasCriticos || []).map((a) => ({ ...a, tipoAlerta: "CRITICO" })),
    ...(alertasData.alertasAtencao || []).map((a) => ({ ...a, tipoAlerta: "ATENCAO" }))
  ];

  if (todosAlertas.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color)">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem">🎉</div>
        <h4 style="font-size: 1.1rem; color: var(--accent-green)">Nenhum Alerta Pendente!</h4>
        <p style="color: var(--text-secondary); font-size: 0.9rem">Todos os veículos da frota estão com seus planos preventivos rigorosamente em dia.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = todosAlertas.map((alerta) => {
    const isCritico = alerta.tipoAlerta === "CRITICO";
    const badgeClass = isCritico ? "badge-critical" : "badge-warning";
    const badgeText = isCritico ? "🚨 REVISÃO IMEDIATA (CRÍTICO)" : "⚠️ REVISÃO PRÓXIMA (ATENÇÃO)";
    const cardClass = isCritico ? "critical" : "warning";

    return `
      <div class="alert-card ${cardClass}">
        <div>
          <div class="alert-info-title">
            <span class="badge ${badgeClass}">${badgeText}</span>
            <span>${alerta.modelo} (${alerta.placa})</span>
          </div>
          <div class="alert-reasons">
            ${alerta.motivos.map((m) => `<div class="alert-reason-item">• ${m}</div>`).join("")}
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem">
              Plano: ${alerta.plano} | Motorista: ${alerta.motorista || "Não atribuído"} | KM Atual: <strong>${alerta.kmAtual.toLocaleString()} km</strong>
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap">
          <button class="btn btn-sm btn-secondary" onclick="abrirModalAtualizarKm(${alerta.veiculoId}, ${alerta.kmAtual})">
            ⚡ Atualizar KM
          </button>
          <button class="btn btn-sm btn-primary" onclick="abrirModalNovaOS(${alerta.veiculoId})">
            + Abrir O.S. Preventiva
          </button>
        </div>
      </div>
    `;
  }).join("");
}

// --- VEÍCULOS ---
async function carregarVeiculos() {
  try {
    const queryParams = new URLSearchParams();
    if (state.filtrosVeiculos.busca) queryParams.append("busca", state.filtrosVeiculos.busca);
    if (state.filtrosVeiculos.status) queryParams.append("status", state.filtrosVeiculos.status);
    if (state.filtrosVeiculos.categoria) queryParams.append("categoria", state.filtrosVeiculos.categoria);
    if (state.filtrosVeiculos.apenasAlertas) queryParams.append("apenasAlertas", "true");

    const res = await fetch(`${API_BASE}/veiculos?${queryParams.toString()}`);
    const data = await res.json();

    if (data.success) {
      state.veiculos = data.data;
      renderizarTabelaVeiculos(data.data);
    }
  } catch (err) {
    mostrarToast("Erro ao carregar listagem de veículos", "error");
  }
}

function renderizarTabelaVeiculos(veiculos) {
  const tbody = document.getElementById("veiculos-table-body");
  if (!tbody) return;

  if (veiculos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted)">
          Nenhum veículo encontrado com os filtros selecionados.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = veiculos.map((v) => {
    // Badge de status operacional
    let badgeStatusOp = "badge-success";
    let textoStatusOp = "Em Operação";
    if (v.status === "EM_MANUTENCAO") {
      badgeStatusOp = "badge-info";
      textoStatusOp = "Em Manutenção";
    } else if (v.status === "ALERTA_REVISAO") {
      badgeStatusOp = "badge-critical";
      textoStatusOp = "Alerta Revisão";
    }

    // Badge de revisão
    let badgeRevisao = "badge-success";
    let textoRevisao = "Em Dia";
    if (v.alertaRevisao.nivelAlerta === "CRITICO") {
      badgeRevisao = "badge-critical";
      textoRevisao = "Crítico";
    } else if (v.alertaRevisao.nivelAlerta === "ATENCAO") {
      badgeRevisao = "badge-warning";
      textoRevisao = "Atenção";
    }

    return `
      <tr>
        <td data-label="Placa / Modelo">
          <div style="font-weight: 800; color: var(--text-primary); font-size: 1rem">${v.placa}</div>
          <div style="color: var(--text-secondary); font-size: 0.8rem">${v.marca} ${v.modelo} (${v.ano})</div>
        </td>
        <td data-label="KM Atual">
          <div style="font-weight: 700; color: var(--text-primary)">${v.kmAtual.toLocaleString()} km</div>
          <div style="color: var(--text-muted); font-size: 0.75rem">${v.categoria || "Geral"}</div>
        </td>
        <td data-label="Próxima Revisão">
          <div style="font-weight: 700; color: ${v.alertaRevisao.kmVencido ? 'var(--accent-red)' : 'var(--text-primary)'}">
            ${v.kmProximaRevisao ? v.kmProximaRevisao.toLocaleString() + ' km' : 'N/A'}
          </div>
          <div style="color: ${v.alertaRevisao.dataVencida ? 'var(--accent-red)' : 'var(--text-muted)'}; font-size: 0.75rem">
            Data: ${v.dataProximaRevisao ? formatarData(v.dataProximaRevisao) : 'N/A'}
          </div>
        </td>
        <td data-label="Status Operacional">
          <span class="badge ${badgeStatusOp}">${textoStatusOp}</span>
        </td>
        <td data-label="Status Revisão">
          <span class="badge ${badgeRevisao}">${textoRevisao}</span>
        </td>
        <td data-label="Plano Vinculado">
          <div style="font-size: 0.85rem; color: var(--accent-blue)">
            ${v.planoManutencao ? v.planoManutencao.nome : '<span style="color: var(--text-muted)">Sem plano</span>'}
          </div>
        </td>
        <td data-label="Ações">
          <div style="display: flex; gap: 0.35rem">
            <button class="btn btn-sm btn-secondary" title="Ver Histórico Completo" onclick="abrirHistoricoVeiculo(${v.id})">
              👁️
            </button>
            <button class="btn btn-sm btn-secondary" title="Atualizar Quilometragem" onclick="abrirModalAtualizarKm(${v.id}, ${v.kmAtual})">
              ⚡
            </button>
            <button class="btn btn-sm btn-secondary" title="Editar Veículo" onclick="abrirModalEditarVeiculo(${v.id})">
              ✏️
            </button>
            <button class="btn btn-sm btn-secondary" style="color: var(--accent-red)" title="Excluir Veículo" onclick="deletarVeiculo(${v.id})">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// --- ORDENS DE SERVIÇO ---
async function carregarOrdensServico() {
  try {
    const queryParams = new URLSearchParams();
    if (state.filtrosOS.status) queryParams.append("status", state.filtrosOS.status);
    if (state.filtrosOS.tipo) queryParams.append("tipo", state.filtrosOS.tipo);

    const res = await fetch(`${API_BASE}/ordens-servico?${queryParams.toString()}`);
    const data = await res.json();

    if (data.success) {
      state.ordensServico = data.data;
      renderizarTabelaOS(data.data);
    }
  } catch (err) {
    mostrarToast("Erro ao carregar Ordens de Serviço", "error");
  }
}

function renderizarTabelaOS(ordens) {
  const tbody = document.getElementById("os-table-body");
  if (!tbody) return;

  if (ordens.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted)">
          Nenhuma Ordem de Serviço encontrada com os filtros atuais.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = ordens.map((os) => {
    let badgeStatus = "badge-warning";
    if (os.status === "EM_ANDAMENTO") badgeStatus = "badge-info";
    if (os.status === "CONCLUIDA") badgeStatus = "badge-success";
    if (os.status === "CANCELADA") badgeStatus = "badge-secondary";

    const totalFormatado = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(os.valorTotalGeral || 0);

    return `
      <tr>
        <td data-label="Código / Veículo">
          <div style="font-weight: 800; color: var(--accent-blue)">${os.codigoOS}</div>
          <div style="font-weight: 600; color: var(--text-primary)">
            ${os.veiculo ? `${os.veiculo.placa} (${os.veiculo.marca} ${os.veiculo.modelo})` : `Veículo ID ${os.veiculoId}`}
          </div>
        </td>
        <td data-label="Tipo">
          <span class="badge ${os.tipo === 'PREVENTIVA' ? 'badge-info' : 'badge-warning'}">${os.tipo}</span>
        </td>
        <td data-label="Descrição">
          <div style="font-size: 0.9rem; color: var(--text-primary)">${os.descricao}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted)">Mecânico: ${os.mecanicoResponsavel}</div>
        </td>
        <td data-label="Total Peças">
          <div style="color: var(--text-secondary)">
            ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(os.valorTotalPecas || 0)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted)">${os.pecas ? os.pecas.length : 0} item(ns)</div>
        </td>
        <td data-label="Valor Total">
          <div style="font-weight: 800; color: var(--accent-green); font-size: 1rem">${totalFormatado}</div>
        </td>
        <td data-label="Status">
          <span class="badge ${badgeStatus}">${os.status}</span>
        </td>
        <td data-label="Ações">
          <div style="display: flex; gap: 0.35rem; flex-wrap: wrap">
            ${os.status === 'ABERTA' ? `
              <button class="btn btn-sm btn-info" onclick="alterarStatusOS(${os.id}, 'EM_ANDAMENTO')">
                Iniciar
              </button>
            ` : ''}
            ${os.status === 'EM_ANDAMENTO' || os.status === 'ABERTA' ? `
              <button class="btn btn-sm btn-success" onclick="alterarStatusOS(${os.id}, 'CONCLUIDA')">
                ✓ Concluir
              </button>
            ` : ''}
            <button class="btn btn-sm btn-secondary" onclick="verDetalhesOS(${os.id})">
              Ver
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// --- PLANOS DE MANUTENÇÃO ---
async function carregarPlanos() {
  try {
    const res = await fetch(`${API_BASE}/planos-manutencao`);
    const data = await res.json();
    if (data.success) {
      state.planos = data.data;
      renderizarCardsPlanos(data.data);
      popularSelectPlanos(data.data);
    }
  } catch (err) {
    mostrarToast("Erro ao carregar planos de manutenção", "error");
  }
}

function renderizarCardsPlanos(planos) {
  const container = document.getElementById("planos-cards-container");
  if (!container) return;

  container.innerHTML = planos.map((p) => `
    <div class="card">
      <div class="kpi-header">
        <h3 class="card-title" style="color: var(--accent-blue); font-size: 1.15rem">${p.nome}</h3>
        <span class="badge badge-info">ID #${p.id}</span>
      </div>
      <p class="card-desc">${p.descricao || "Sem descrição informada"}</p>
      
      <div style="background: var(--bg-input); padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid var(--border-color)">
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem">
          <span style="color: var(--text-secondary)">Intervalo por KM:</span>
          <strong style="color: var(--text-primary)">${p.intervaloKm.toLocaleString()} km</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem">
          <span style="color: var(--text-secondary)">Intervalo por Tempo:</span>
          <strong style="color: var(--text-primary)">${p.intervaloMeses} meses</strong>
        </div>
      </div>

      <h5 style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.5rem; text-transform: uppercase">
        Itens Inspecionados / Substituídos:
      </h5>
      <ul style="padding-left: 1.25rem; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.25rem">
        ${(p.itensChecagem || []).map((item) => `<li>${item}</li>`).join("")}
      </ul>
    </div>
  `).join("");
}

function popularSelectPlanos(planos) {
  const select = document.getElementById("veiculo-plano-select");
  if (!select) return;

  select.innerHTML = `
    <option value="">Selecione um plano preventivo...</option>
    ${planos.map((p) => `
      <option value="${p.id}" data-km="${p.intervaloKm}" data-meses="${p.intervaloMeses}">
        ${p.nome} (a cada ${p.intervaloKm.toLocaleString()} km ou ${p.intervaloMeses} meses)
      </option>
    `).join("")}
  `;
}

// --- MODAIS E OPERAÇÕES CRUD ---

// 1. Modal Cadastro / Edição de Veículo
function abrirModalNovoVeiculo() {
  document.getElementById("modal-veiculo-title").textContent = "Cadastrar Novo Veículo";
  document.getElementById("form-veiculo").reset();
  document.getElementById("veiculo-id-hidden").value = "";
  document.getElementById("veiculo-auto-calc-banner").style.display = "none";
  abrirModal("modal-veiculo");
}

async function abrirModalEditarVeiculo(id) {
  try {
    const res = await fetch(`${API_BASE}/veiculos/${id}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    const v = data.data;
    document.getElementById("modal-veiculo-title").textContent = `Editar Veículo (${v.placa})`;
    document.getElementById("veiculo-id-hidden").value = v.id;
    document.getElementById("veiculo-placa").value = v.placa;
    document.getElementById("veiculo-marca").value = v.marca;
    document.getElementById("veiculo-modelo").value = v.modelo;
    document.getElementById("veiculo-ano").value = v.ano;
    document.getElementById("veiculo-km").value = v.kmAtual;
    document.getElementById("veiculo-categoria").value = v.categoria || "Pesado";
    document.getElementById("veiculo-motorista").value = v.motoristaResponsavel || "";
    document.getElementById("veiculo-plano-select").value = v.planoManutencaoId || "";

    atualizarCalculoRevisaoVeiculo();
    abrirModal("modal-veiculo");
  } catch (err) {
    mostrarToast(err.message || "Erro ao buscar veículo", "error");
  }
}

function atualizarCalculoRevisaoVeiculo() {
  const kmAtual = Number(document.getElementById("veiculo-km").value) || 0;
  const planoSelect = document.getElementById("veiculo-plano-select");
  const selectedOption = planoSelect.options[planoSelect.selectedIndex];
  const banner = document.getElementById("veiculo-auto-calc-banner");

  if (!selectedOption || !selectedOption.value) {
    banner.style.display = "none";
    return;
  }

  const intervaloKm = Number(selectedOption.getAttribute("data-km")) || 0;
  const intervaloMeses = Number(selectedOption.getAttribute("data-meses")) || 0;

  const proxKm = kmAtual + intervaloKm;
  const dataHoje = new Date();
  dataHoje.setMonth(dataHoje.getMonth() + intervaloMeses);
  const dataFormatada = dataHoje.toLocaleDateString("pt-BR");

  banner.style.display = "block";
  document.getElementById("calc-prox-km").textContent = `${proxKm.toLocaleString()} km`;
  document.getElementById("calc-prox-data").textContent = dataFormatada;
}

// 2. Salvar Veículo (POST / PUT)
async function salvarVeiculo(event) {
  event.preventDefault();
  const id = document.getElementById("veiculo-id-hidden").value;
  const isEdicao = Boolean(id);

  const payload = {
    placa: document.getElementById("veiculo-placa").value.trim().toUpperCase(),
    marca: document.getElementById("veiculo-marca").value.trim(),
    modelo: document.getElementById("veiculo-modelo").value.trim(),
    ano: Number(document.getElementById("veiculo-ano").value),
    kmAtual: Number(document.getElementById("veiculo-km").value),
    categoria: document.getElementById("veiculo-categoria").value,
    motoristaResponsavel: document.getElementById("veiculo-motorista").value.trim(),
    planoManutencaoId: document.getElementById("veiculo-plano-select").value ? Number(document.getElementById("veiculo-plano-select").value) : null
  };

  try {
    const url = isEdicao ? `${API_BASE}/veiculos/${id}` : `${API_BASE}/veiculos`;
    const method = isEdicao ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || (data.detalhes ? data.detalhes.join(", ") : "Erro ao salvar veículo"));
    }

    fecharModal("modal-veiculo");
    mostrarToast(isEdicao ? "Veículo atualizado com sucesso!" : "Veículo cadastrado com sucesso!", "success");
    await carregarVeiculos();
    await carregarDashboard();
  } catch (err) {
    mostrarToast(err.message, "error");
  }
}

// 3. Atualizar KM Rápido (PATCH)
function abrirModalAtualizarKm(veiculoId, kmAtual) {
  document.getElementById("km-veiculo-id-hidden").value = veiculoId;
  document.getElementById("km-atual-display").textContent = `${kmAtual.toLocaleString()} km`;
  document.getElementById("novo-km-input").value = kmAtual;
  document.getElementById("novo-km-input").min = kmAtual;
  abrirModal("modal-atualizar-km");
}

async function salvarNovoKm(event) {
  event.preventDefault();
  const id = document.getElementById("km-veiculo-id-hidden").value;
  const novoKm = Number(document.getElementById("novo-km-input").value);

  try {
    const res = await fetch(`${API_BASE}/veiculos/${id}/km`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kmAtual: novoKm })
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    fecharModal("modal-atualizar-km");
    mostrarToast("Quilometragem atualizada com sucesso!", "success");
    await carregarVeiculos();
    await carregarDashboard();
  } catch (err) {
    mostrarToast(err.message, "error");
  }
}

// 4. Deletar Veículo (DELETE)
async function deletarVeiculo(id) {
  if (!confirm(`Deseja realmente remover o veículo #${id}? Esta ação não pode ser desfeita.`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/veiculos/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    mostrarToast("Veículo removido com sucesso!", "success");
    await carregarVeiculos();
    await carregarDashboard();
  } catch (err) {
    mostrarToast(err.message, "error");
  }
}

// 5. Modal e Abertura de Nova Ordem de Serviço (POST)
function abrirModalNovaOS(veiculoIdPreSelecionado = null) {
  document.getElementById("form-os").reset();
  
  // Popular select de veículos
  const selectVeiculo = document.getElementById("os-veiculo-select");
  selectVeiculo.innerHTML = `
    <option value="">Selecione o veículo...</option>
    ${state.veiculos.map((v) => `
      <option value="${v.id}" data-km="${v.kmAtual}" ${veiculoIdPreSelecionado === v.id ? 'selected' : ''}>
        ${v.placa} - ${v.marca} ${v.modelo} (KM: ${v.kmAtual.toLocaleString()})
      </option>
    `).join("")}
  `;

  // Limpar lista de peças e adicionar uma linha inicial
  document.getElementById("os-parts-container").innerHTML = "";
  adicionarLinhaPeca();

  if (veiculoIdPreSelecionado) {
    const v = state.veiculos.find((x) => x.id === veiculoIdPreSelecionado);
    if (v) document.getElementById("os-km").value = v.kmAtual;
  }

  calcularTotaisOS();
  abrirModal("modal-os");
}

function aoTrocarVeiculoOS() {
  const select = document.getElementById("os-veiculo-select");
  const selectedOption = select.options[select.selectedIndex];
  if (selectedOption && selectedOption.value) {
    document.getElementById("os-km").value = selectedOption.getAttribute("data-km");
  }
}

function adicionarLinhaPeca(item = "", qtd = 1, unitario = 0) {
  const container = document.getElementById("os-parts-container");
  const div = document.createElement("div");
  div.className = "parts-row";
  div.innerHTML = `
    <input type="text" class="form-control part-item" placeholder="Nome da peça / material" value="${item}" required>
    <input type="number" class="form-control part-qtd" placeholder="Qtd" min="1" value="${qtd}" oninput="calcularTotaisOS()" required>
    <input type="number" class="form-control part-unit" placeholder="R$ Unit." step="0.01" min="0" value="${unitario}" oninput="calcularTotaisOS()" required>
    <div class="part-subtotal" style="font-weight: 700; color: var(--accent-green); font-size: 0.9rem; text-align: right">
      R$ 0,00
    </div>
    <button type="button" class="btn-remove-part" onclick="removerLinhaPeca(this)" title="Remover Peça">✕</button>
  `;
  container.appendChild(div);
  calcularTotaisOS();
}

function removerLinhaPeca(btn) {
  const row = btn.closest(".parts-row");
  const container = document.getElementById("os-parts-container");
  if (container.children.length > 1) {
    row.remove();
    calcularTotaisOS();
  } else {
    mostrarToast("A O.S. deve conter pelo menos uma linha de item.", "info");
  }
}

function calcularTotaisOS() {
  let totalPecas = 0;
  const rows = document.querySelectorAll("#os-parts-container .parts-row");

  rows.forEach((row) => {
    const qtd = Number(row.querySelector(".part-qtd").value) || 0;
    const unit = Number(row.querySelector(".part-unit").value) || 0;
    const subtotal = qtd * unit;
    row.querySelector(".part-subtotal").textContent = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(subtotal);
    totalPecas += subtotal;
  });

  const horas = Number(document.getElementById("os-mo-horas").value) || 0;
  const valorHora = Number(document.getElementById("os-mo-valor-hora").value) || 0;
  const totalMO = horas * valorHora;
  const totalGeral = totalPecas + totalMO;

  document.getElementById("os-total-pecas-display").textContent = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPecas);
  document.getElementById("os-total-mo-display").textContent = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalMO);
  document.getElementById("os-total-geral-display").textContent = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalGeral);
}

async function salvarOS(event) {
  event.preventDefault();

  const pecas = [];
  document.querySelectorAll("#os-parts-container .parts-row").forEach((row) => {
    const item = row.querySelector(".part-item").value.trim();
    const qtd = Number(row.querySelector(".part-qtd").value) || 1;
    const unit = Number(row.querySelector(".part-unit").value) || 0;
    if (item) {
      pecas.push({ item, quantidade: qtd, valorUnitario: unit });
    }
  });

  const payload = {
    veiculoId: Number(document.getElementById("os-veiculo-select").value),
    tipo: document.getElementById("os-tipo").value,
    mecanicoResponsavel: document.getElementById("os-mecanico").value.trim(),
    kmNoMomento: Number(document.getElementById("os-km").value),
    descricao: document.getElementById("os-descricao").value.trim(),
    pecas: pecas,
    maoDeObra: {
      descricao: document.getElementById("os-mo-desc").value.trim() || "Serviço mecânico",
      horas: Number(document.getElementById("os-mo-horas").value) || 0,
      valorHora: Number(document.getElementById("os-mo-valor-hora").value) || 0
    },
    observacoes: document.getElementById("os-obs").value.trim()
  };

  try {
    const res = await fetch(`${API_BASE}/ordens-servico`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    fecharModal("modal-os");
    mostrarToast(`Ordem de Serviço ${data.data.codigoOS} aberta com sucesso!`, "success");
    await carregarOrdensServico();
    await carregarVeiculos();
    await carregarDashboard();
  } catch (err) {
    mostrarToast(err.message, "error");
  }
}

// 6. Alteração de Status da OS (PATCH) - Regra Central de Recálculo Preventivo
async function alterarStatusOS(id, novoStatus) {
  const mensagemConfirm = novoStatus === "CONCLUIDA"
    ? "Deseja concluir esta Ordem de Serviço? Se for preventiva, o próximo ciclo de revisão do veículo será recalculado automaticamente."
    : `Deseja alterar o status da O.S. para '${novoStatus}'?`;

  if (!confirm(mensagemConfirm)) return;

  try {
    const res = await fetch(`${API_BASE}/ordens-servico/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus })
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    mostrarToast(`O.S. atualizada para ${novoStatus}!`, "success");
    await carregarOrdensServico();
    await carregarVeiculos();
    await carregarDashboard();
  } catch (err) {
    mostrarToast(err.message, "error");
  }
}

// 7. Visualização de Histórico Completo do Veículo
async function abrirHistoricoVeiculo(veiculoId) {
  try {
    const [resVeiculo, resHistorico] = await Promise.all([
      fetch(`${API_BASE}/veiculos/${veiculoId}`),
      fetch(`${API_BASE}/veiculos/${veiculoId}/historico`)
    ]);

    const dataVeiculo = await resVeiculo.json();
    const dataHistorico = await resHistorico.json();

    if (!dataVeiculo.success) throw new Error(dataVeiculo.error);

    const v = dataVeiculo.data;
    const historico = dataHistorico.data || [];

    document.getElementById("hist-veiculo-placa").textContent = v.placa;
    document.getElementById("hist-veiculo-info").textContent = `${v.marca} ${v.modelo} (${v.ano}) — ${v.categoria || "Frota"}`;
    document.getElementById("hist-veiculo-km").textContent = `${v.kmAtual.toLocaleString()} km`;
    document.getElementById("hist-veiculo-plano").textContent = v.planoManutencao ? v.planoManutencao.nome : "Sem plano";

    const container = document.getElementById("hist-timeline-container");
    if (historico.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted)">
          Nenhuma manutenção registrada para este veículo até o momento.
        </div>
      `;
    } else {
      let totalGastoVeiculo = 0;
      container.innerHTML = `
        <div class="timeline">
          ${historico.map((os) => {
            totalGastoVeiculo += (os.valorTotalGeral || 0);
            const totalFormatado = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(os.valorTotalGeral || 0);

            return `
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap">
                    <span style="font-weight: 800; color: var(--accent-blue)">${os.codigoOS} (${os.tipo})</span>
                    <strong style="color: var(--accent-green); font-size: 1rem">${totalFormatado}</strong>
                  </div>
                  <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem">${os.descricao}</div>
                  <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.5rem">
                    Data Conclusão: ${os.dataConclusao ? formatarData(os.dataConclusao) : 'Em andamento'} | Mecânico: ${os.mecanicoResponsavel} | KM no serviço: ${os.kmNoMomento ? os.kmNoMomento.toLocaleString() + ' km' : 'N/A'}
                  </div>
                  <div style="font-size: 0.8rem; color: var(--text-muted); background: var(--bg-input); padding: 0.5rem; border-radius: 6px">
                    Peças: ${(os.pecas || []).map((p) => `${p.quantidade}x ${p.item}`).join(", ") || "Nenhuma peça informada"}
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `;

      document.getElementById("hist-total-gasto").textContent = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalGastoVeiculo);
    }

    abrirModal("modal-historico");
  } catch (err) {
    mostrarToast(err.message || "Erro ao buscar histórico", "error");
  }
}

// 8. Visualização Rápida de Detalhes da OS
async function verDetalhesOS(id) {
  try {
    const res = await fetch(`${API_BASE}/ordens-servico/${id}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    const os = data.data;
    alert(`
Detalhes da Ordem de Serviço:
Código: ${os.codigoOS}
Veículo: ${os.veiculo ? `${os.veiculo.placa} (${os.veiculo.marca} ${os.veiculo.modelo})` : os.veiculoId}
Tipo: ${os.tipo} | Status: ${os.status}
Mecânico: ${os.mecanicoResponsavel}
Descrição: ${os.descricao}
Total Peças: R$ ${(os.valorTotalPecas || 0).toFixed(2)}
Total Mão de Obra: R$ ${(os.valorTotalMaoDeObra || 0).toFixed(2)}
Total Geral: R$ ${(os.valorTotalGeral || 0).toFixed(2)}
    `.trim());
  } catch (err) {
    mostrarToast(err.message, "error");
  }
}

// --- CONFIGURAÇÃO DE EVENTOS DE BUSCA E FORMULÁRIOS ---
function configurarEventos() {
  // Filtros de Veículos
  const searchVeiculos = document.getElementById("search-veiculos");
  if (searchVeiculos) {
    searchVeiculos.addEventListener("input", (e) => {
      state.filtrosVeiculos.busca = e.target.value;
      carregarVeiculos();
    });
  }

  const selectStatusVeiculo = document.getElementById("filter-status-veiculo");
  if (selectStatusVeiculo) {
    selectStatusVeiculo.addEventListener("change", (e) => {
      state.filtrosVeiculos.status = e.target.value;
      carregarVeiculos();
    });
  }

  const selectCatVeiculo = document.getElementById("filter-cat-veiculo");
  if (selectCatVeiculo) {
    selectCatVeiculo.addEventListener("change", (e) => {
      state.filtrosVeiculos.categoria = e.target.value;
      carregarVeiculos();
    });
  }

  const btnToggleAlertas = document.getElementById("btn-toggle-apenas-alertas");
  if (btnToggleAlertas) {
    btnToggleAlertas.addEventListener("click", () => {
      state.filtrosVeiculos.apenasAlertas = !state.filtrosVeiculos.apenasAlertas;
      btnToggleAlertas.classList.toggle("btn-danger", state.filtrosVeiculos.apenasAlertas);
      btnToggleAlertas.classList.toggle("btn-secondary", !state.filtrosVeiculos.apenasAlertas);
      carregarVeiculos();
    });
  }

  // Filtros de OS
  const selectStatusOS = document.getElementById("filter-status-os");
  if (selectStatusOS) {
    selectStatusOS.addEventListener("change", (e) => {
      state.filtrosOS.status = e.target.value;
      carregarOrdensServico();
    });
  }

  const selectTipoOS = document.getElementById("filter-tipo-os");
  if (selectTipoOS) {
    selectTipoOS.addEventListener("change", (e) => {
      state.filtrosOS.tipo = e.target.value;
      carregarOrdensServico();
    });
  }

  // Cálculo ao vivo no cadastro de veículo
  const kmInput = document.getElementById("veiculo-km");
  const planoSelect = document.getElementById("veiculo-plano-select");
  if (kmInput) kmInput.addEventListener("input", atualizarCalculoRevisaoVeiculo);
  if (planoSelect) planoSelect.addEventListener("change", atualizarCalculoRevisaoVeiculo);

  // Mão de obra ao vivo na OS
  const moHoras = document.getElementById("os-mo-horas");
  const moValorHora = document.getElementById("os-mo-valor-hora");
  if (moHoras) moHoras.addEventListener("input", calcularTotaisOS);
  if (moValorHora) moValorHora.addEventListener("input", calcularTotaisOS);

  // Fechar modais ao teclar ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay.active").forEach((m) => m.classList.remove("active"));
    }
  });
}

// --- UTILITÁRIOS ---
function abrirModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("active");
}

function fecharModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}

function formatarData(dataStr) {
  if (!dataStr) return "N/A";
  const d = new Date(dataStr);
  return isNaN(d.getTime()) ? dataStr : d.toLocaleDateString("pt-BR");
}

function mostrarToast(mensagem, tipo = "info") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;
  let icone = "ℹ️";
  if (tipo === "success") icone = "✅";
  if (tipo === "error") icone = "❌";

  toast.innerHTML = `<span>${icone}</span> <div>${mensagem}</div>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
