/**
 * GABRIEL FROTAS — Frontend Controller (SPA)
 * Padrão Sóbrio Corporativo & Integração Direta com API REST
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
  },
  filtroDashStatus: ""
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
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          API Online (v${data.versao})
        </span>
      `;
    }
  } catch (err) {
    const statusElem = document.getElementById("api-status-container");
    if (statusElem) {
      statusElem.innerHTML = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          <span class="w-2 h-2 rounded-full bg-rose-400"></span>
          Offline
        </span>
      `;
    }
  }
}

// 2. Navegação entre Abas / Telas
function inicializarNavegacao() {
  const navBtns = document.querySelectorAll(".nav-link[data-tab]");
  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.getAttribute("data-tab");
      trocarAba(tabName);
    });
  });
}

function trocarAba(tabName) {
  state.activeTab = tabName;

  document.querySelectorAll(".nav-link[data-tab]").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-tab") === tabName);
  });

  document.querySelectorAll(".app-view").forEach((sec) => {
    sec.classList.toggle("active", sec.id === `section-${tabName}`);
  });

  const titles = {
    dashboard: "Dashboard de Manutenção",
    veiculos: "Gestão da Frota de Veículos",
    os: "Ordens de Serviço (O.S.)",
    planos: "Planos de Manutenção Preventiva"
  };
  const topTitle = document.getElementById("top-bar-title");
  if (topTitle && titles[tabName]) {
    topTitle.textContent = titles[tabName];
  }

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

// --- DASHBOARD & ALERTAS (Layout do Modelo Visual) ---
async function carregarDashboard() {
  try {
    const [resResumo, resAlertas, resVeiculos, resOS] = await Promise.all([
      fetch(`${API_BASE}/dashboard/resumo`),
      fetch(`${API_BASE}/dashboard/alertas`),
      fetch(`${API_BASE}/veiculos`),
      fetch(`${API_BASE}/ordens-servico`)
    ]);

    const dataResumo = await resResumo.json();
    const dataAlertas = await resAlertas.json();
    const dataVeiculos = await resVeiculos.json();
    const dataOS = await resOS.json();

    if (dataResumo.success) {
      state.resumo = dataResumo.data;
      renderizarKPIs(dataResumo.data);
      renderizarGraficoFrota(dataResumo.data);
    }

    if (dataVeiculos.success) {
      state.veiculos = dataVeiculos.data;
      renderizarTabelaAlertasDashboard(dataVeiculos.data);
    }

    if (dataOS.success) {
      state.ordensServico = dataOS.data;
      renderizarTabelaOSRecentesDashboard(dataOS.data);
    }
  } catch (err) {
    mostrarToast("Erro ao carregar dados do Dashboard", "error");
  }
}

function renderizarKPIs(resumo) {
  const { frota, financeiro } = resumo;

  document.getElementById("kpi-total-veiculos").textContent = frota.totalVeiculos;
  document.getElementById("kpi-veiculos-operacao").textContent = `${frota.emOperacao} em operação normal`;

  document.getElementById("kpi-veiculos-manutencao").textContent = frota.emManutencao;
  document.getElementById("kpi-os-ativas").textContent = `${resumo.ordensServico.emAndamento} O.S. em andamento`;

  document.getElementById("kpi-alertas-criticos").textContent = frota.revisaoCritica;
  document.getElementById("kpi-alertas-atencao").textContent = `${frota.revisaoAtencao} em atenção preventiva`;

  // Próxima Revisão Crítica
  const veiculosCriticos = (state.veiculos || []).filter((v) => v.alertaRevisao && v.alertaRevisao.nivelAlerta === "CRITICO");
  if (veiculosCriticos.length > 0) {
    const vc = veiculosCriticos[0];
    document.getElementById("kpi-critico-placa").textContent = vc.placa;
    document.getElementById("kpi-critico-desc").textContent = `${vc.kmAtual.toLocaleString()} KM - Atrasado`;
  } else {
    document.getElementById("kpi-critico-placa").textContent = "Nenhum";
    document.getElementById("kpi-critico-desc").textContent = "Frota 100% em dia";
    document.getElementById("kpi-critico-desc").className = "text-xs font-semibold text-emerald-600 mt-1";
  }
}

function renderizarTabelaAlertasDashboard(veiculos) {
  const tbody = document.getElementById("dash-alerts-tbody");
  if (!tbody) return;

  const termo = (document.getElementById("dash-search-input")?.value || "").toLowerCase();
  const filtroStatus = document.getElementById("dash-status-select")?.value || "";

  let lista = veiculos.filter((v) => {
    const bateTexto = v.placa.toLowerCase().includes(termo) || v.modelo.toLowerCase().includes(termo) || v.marca.toLowerCase().includes(termo);
    const bateStatus = !filtroStatus || v.alertaRevisao.nivelAlerta === filtroStatus;
    return bateTexto && bateStatus;
  });

  if (lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted)">
          Nenhum veículo encontrado com os filtros selecionados.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = lista.map((v) => {
    let statusPill = `<span class="status-pill pill-ok">OK</span>`;
    if (v.alertaRevisao.nivelAlerta === "CRITICO") {
      statusPill = `<span class="status-pill pill-atrasado">ATRASADO</span>`;
    } else if (v.alertaRevisao.nivelAlerta === "ATENCAO") {
      statusPill = `<span class="status-pill pill-embreve">EM BREVE</span>`;
    }

    const planoNome = v.planoManutencao ? v.planoManutencao.nome.replace(/\(.*?\)/g, "").trim() : "Troca de Óleo / Geral";

    return `
      <tr>
        <td style="font-weight: 700; color: #0f172a">${v.placa}</td>
        <td>${v.marca} ${v.modelo}</td>
        <td style="font-weight: 600">${v.kmAtual.toLocaleString()}</td>
        <td>${planoNome}</td>
        <td>${statusPill}</td>
        <td>
          <div class="action-links">
            <button class="action-btn-link" title="Criar Ordem de Serviço" onclick="abrirModalNovaOS(${v.id})">
              ✏️ Criar O.S.
            </button>
            <button class="action-btn-link" title="Ver Detalhes e Histórico" onclick="abrirHistoricoVeiculo(${v.id})">
              👁️ Ver Detalhes
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function renderizarTabelaOSRecentesDashboard(ordens) {
  const tbody = document.getElementById("dash-os-tbody");
  if (!tbody) return;

  const recentes = ordens.slice(0, 4);

  if (recentes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1rem">Nenhuma O.S. registrada</td></tr>`;
    return;
  }

  tbody.innerHTML = recentes.map((os) => {
    let pillClass = "pill-andamento";
    let pillText = "Em Andamento";
    if (os.status === "CONCLUIDA") {
      pillClass = "pill-concluida";
      pillText = "Concluída";
    } else if (os.status === "ABERTA") {
      pillClass = "pill-aberta";
      pillText = "Aberta";
    }

    const custoFormatado = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(os.valorTotalGeral || 0);
    const veiculoPlaca = os.veiculo ? os.veiculo.placa : `ID ${os.veiculoId}`;
    const servicoCurto = os.tipo === "PREVENTIVA" ? "Revisão Geral" : (os.descricao ? os.descricao.substring(0, 15) : "Serviço");
    const mecanicoCurto = os.mecanicoResponsavel ? os.mecanicoResponsavel.split(" ")[0] : "Carlos";

    return `
      <tr>
        <td style="font-weight: 700; color: #1d4ed8">${os.codigoOS}</td>
        <td style="font-weight: 600">${veiculoPlaca}</td>
        <td>${servicoCurto}</td>
        <td>${mecanicoCurto}</td>
        <td style="font-weight: 700; color: #0f172a">${custoFormatado}</td>
        <td><span class="status-pill ${pillClass}">${pillText}</span></td>
      </tr>
    `;
  }).join("");
}

function renderizarGraficoFrota(resumo) {
  const { frota, financeiro } = resumo;
  const total = frota.totalVeiculos || 5;

  const hOperacao = Math.max(20, (frota.emOperacao / total) * 120);
  const hCritico = Math.max(15, (frota.revisaoCritica / total) * 120);
  const hAtencao = Math.max(15, (frota.revisaoAtencao / total) * 120);
  const hManutencao = Math.max(15, (frota.emManutencao / total) * 120);

  const container = document.querySelector(".fleet-chart-container");
  if (container) {
    container.innerHTML = `
      <div class="chart-bar-group">
        <div class="chart-bar chart-bar-1" style="height: ${hOperacao}px;" title="Em Operação: ${frota.emOperacao}"></div>
        <span class="chart-label">Operação (${frota.emOperacao})</span>
      </div>

      <div class="chart-bar-group">
        <div class="chart-bar chart-bar-3" style="height: ${hCritico}px;" title="Crítico: ${frota.revisaoCritica}"></div>
        <span class="chart-label">Crítico (${frota.revisaoCritica})</span>
      </div>

      <div class="chart-bar-group">
        <div class="chart-bar chart-bar-2" style="height: ${hAtencao}px;" title="Atenção: ${frota.revisaoAtencao}"></div>
        <span class="chart-label">Atenção (${frota.revisaoAtencao})</span>
      </div>

      <div class="chart-bar-group">
        <div class="chart-bar chart-bar-4" style="height: ${hManutencao}px;" title="Oficina: ${frota.emManutencao}"></div>
        <span class="chart-label">Oficina (${frota.emManutencao})</span>
      </div>
    `;
  }

  const chartTotalText = document.getElementById("chart-total-text");
  if (chartTotalText) chartTotalText.textContent = `${total} veículos`;

  const chartCustoText = document.getElementById("chart-custo-text");
  if (chartCustoText) chartCustoText.textContent = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(financeiro.totalGastoGeral);
}

// --- ABA 2: VEÍCULOS ---
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
    mostrarToast("Erro ao carregar lista de veículos", "error");
  }
}

function renderizarTabelaVeiculos(veiculos) {
  const tbody = document.getElementById("veiculos-table-body");
  if (!tbody) return;

  if (veiculos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted)">
          Nenhum veículo encontrado com os filtros informados.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = veiculos.map((v) => {
    let statusPill = `<span class="status-pill pill-ok">OK</span>`;
    if (v.alertaRevisao.nivelAlerta === "CRITICO") {
      statusPill = `<span class="status-pill pill-atrasado">ATRASADO</span>`;
    } else if (v.alertaRevisao.nivelAlerta === "ATENCAO") {
      statusPill = `<span class="status-pill pill-embreve">EM BREVE</span>`;
    }

    let statusOpPill = `<span class="status-pill pill-concluida">EM OPERAÇÃO</span>`;
    if (v.status === "EM_MANUTENCAO") statusOpPill = `<span class="status-pill pill-andamento">EM MANUTENÇÃO</span>`;
    if (v.status === "ALERTA_REVISAO") statusOpPill = `<span class="status-pill pill-atrasado">ALERTA REVISÃO</span>`;

    return `
      <tr>
        <td style="font-weight: 800; color: #0f172a">${v.placa}</td>
        <td>
          <div style="font-weight: 600">${v.marca} ${v.modelo}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted)">Ano ${v.ano} • ${v.categoria || 'Geral'}</div>
        </td>
        <td style="font-weight: 700">${v.kmAtual.toLocaleString()} km</td>
        <td>
          <div style="font-weight: 700; color: ${v.alertaRevisao.kmVencido ? 'var(--color-danger)' : '#0f172a'}">
            ${v.kmProximaRevisao ? v.kmProximaRevisao.toLocaleString() + ' km' : 'N/A'}
          </div>
          <div style="font-size: 0.75rem; color: ${v.alertaRevisao.dataVencida ? 'var(--color-danger)' : 'var(--text-muted)'}">
            ${v.dataProximaRevisao ? formatarData(v.dataProximaRevisao) : ''}
          </div>
        </td>
        <td>${statusOpPill}</td>
        <td>${statusPill}</td>
        <td style="color: var(--color-primary); font-weight: 600">
          ${v.planoManutencao ? v.planoManutencao.nome : 'Sem plano'}
        </td>
        <td>
          <div class="action-links">
            <button class="action-btn-link" title="Histórico" onclick="abrirHistoricoVeiculo(${v.id})">👁️ Ficha</button>
            <button class="action-btn-link" title="Atualizar KM" onclick="abrirModalAtualizarKm(${v.id}, ${v.kmAtual})">⚡ KM</button>
            <button class="action-btn-link" title="Editar" onclick="abrirModalEditarVeiculo(${v.id})">✏️</button>
            <button class="action-btn-link action-btn-danger" title="Excluir" onclick="deletarVeiculo(${v.id})">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// --- ABA 3: ORDENS DE SERVIÇO ---
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
        <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted)">
          Nenhuma Ordem de Serviço encontrada.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = ordens.map((os) => {
    let pillClass = "pill-andamento";
    if (os.status === "CONCLUIDA") pillClass = "pill-concluida";
    if (os.status === "ABERTA") pillClass = "pill-aberta";

    const totalFormatado = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(os.valorTotalGeral || 0);
    const totalPecas = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(os.valorTotalPecas || 0);

    return `
      <tr>
        <td>
          <div style="font-weight: 800; color: var(--color-primary)">${os.codigoOS}</div>
          <div style="font-weight: 600; color: #0f172a">
            ${os.veiculo ? `${os.veiculo.placa} (${os.veiculo.marca} ${os.veiculo.modelo})` : `Veículo #${os.veiculoId}`}
          </div>
        </td>
        <td><span class="status-pill pill-aberta">${os.tipo}</span></td>
        <td>
          <div style="font-weight: 600">${os.descricao}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted)">KM: ${os.kmNoMomento ? os.kmNoMomento.toLocaleString() : 'N/A'}</div>
        </td>
        <td>${os.mecanicoResponsavel}</td>
        <td>${totalPecas}</td>
        <td style="font-weight: 800; color: #16a34a">${totalFormatado}</td>
        <td><span class="status-pill ${pillClass}">${os.status}</span></td>
        <td>
          <div class="flex gap-1.5">
            ${os.status === 'ABERTA' ? `
              <button class="btn btn-sm btn-secondary" onclick="alterarStatusOS(${os.id}, 'EM_ANDAMENTO')">Iniciar</button>
            ` : ''}
            ${os.status === 'EM_ANDAMENTO' || os.status === 'ABERTA' ? `
              <button class="btn btn-sm btn-success" onclick="alterarStatusOS(${os.id}, 'CONCLUIDA')">✓ Concluir</button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// --- ABA 4: PLANOS ---
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
      <div class="flex justify-between items-center mb-2">
        <h4 class="font-bold text-base text-blue-700">${p.nome}</h4>
        <span class="status-pill pill-aberta">ID #${p.id}</span>
      </div>
      <p class="text-xs text-slate-600 mb-3">${p.descricao || "Sem descrição"}</p>
      
      <div class="bg-slate-50 border border-slate-200 rounded p-2.5 mb-3 text-xs flex justify-between">
        <span>Intervalo KM: <strong>${p.intervaloKm.toLocaleString()} km</strong></span>
        <span>Intervalo Tempo: <strong>${p.intervaloMeses} meses</strong></span>
      </div>

      <h5 class="text-xs font-bold text-slate-700 uppercase mb-1.5">Itens de Inspeção:</h5>
      <ul class="list-disc list-inside text-xs text-slate-600 space-y-1">
        ${(p.itensChecagem || []).map((i) => `<li>${i}</li>`).join("")}
      </ul>
    </div>
  `).join("");
}

function popularSelectPlanos(planos) {
  const select = document.getElementById("veiculo-plano-select");
  if (!select) return;

  select.innerHTML = `
    <option value="">Selecione o plano preventivo...</option>
    ${planos.map((p) => `
      <option value="${p.id}" data-km="${p.intervaloKm}" data-meses="${p.intervaloMeses}">
        ${p.nome} (a cada ${p.intervaloKm.toLocaleString()} km ou ${p.intervaloMeses} meses)
      </option>
    `).join("")}
  `;
}

// --- MODAIS E OPERAÇÕES CRUD ---

// Modal Veículo
function abrirModalNovoVeiculo() {
  document.getElementById("modal-veiculo-title").textContent = "Cadastrar Novo Veículo";
  document.getElementById("form-veiculo").reset();
  document.getElementById("veiculo-id-hidden").value = "";
  document.getElementById("veiculo-auto-calc-banner").classList.add("hidden");
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
    mostrarToast(err.message || "Erro ao carregar dados do veículo", "error");
  }
}

function atualizarCalculoRevisaoVeiculo() {
  const kmAtual = Number(document.getElementById("veiculo-km").value) || 0;
  const planoSelect = document.getElementById("veiculo-plano-select");
  const selectedOption = planoSelect.options[planoSelect.selectedIndex];
  const banner = document.getElementById("veiculo-auto-calc-banner");

  if (!selectedOption || !selectedOption.value) {
    banner.classList.add("hidden");
    return;
  }

  const intervaloKm = Number(selectedOption.getAttribute("data-km")) || 0;
  const intervaloMeses = Number(selectedOption.getAttribute("data-meses")) || 0;

  const proxKm = kmAtual + intervaloKm;
  const dataHoje = new Date();
  dataHoje.setMonth(dataHoje.getMonth() + intervaloMeses);
  const dataFormatada = dataHoje.toLocaleDateString("pt-BR");

  banner.classList.remove("hidden");
  document.getElementById("calc-prox-km").textContent = `${proxKm.toLocaleString()} km`;
  document.getElementById("calc-prox-data").textContent = dataFormatada;
}

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
    if (!data.success) throw new Error(data.error || (data.detalhes ? data.detalhes.join(", ") : "Erro ao salvar"));

    fecharModal("modal-veiculo");
    mostrarToast(isEdicao ? "Veículo atualizado com sucesso!" : "Veículo cadastrado com sucesso!", "success");
    await carregarVeiculos();
    await carregarDashboard();
  } catch (err) {
    mostrarToast(err.message, "error");
  }
}

// Modal Atualizar KM
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
    mostrarToast("KM atualizado e alertas recalculados!", "success");
    await carregarVeiculos();
    await carregarDashboard();
  } catch (err) {
    mostrarToast(err.message, "error");
  }
}

// Deletar Veículo
async function deletarVeiculo(id) {
  if (!confirm(`Deseja realmente remover o veículo #${id}?`)) return;

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

// Modal Abertura de OS
function abrirModalNovaOS(veiculoIdPreSelecionado = null) {
  document.getElementById("form-os").reset();
  
  const selectVeiculo = document.getElementById("os-veiculo-select");
  selectVeiculo.innerHTML = `
    <option value="">Selecione o veículo...</option>
    ${state.veiculos.map((v) => `
      <option value="${v.id}" data-km="${v.kmAtual}" ${veiculoIdPreSelecionado === v.id ? 'selected' : ''}>
        ${v.placa} - ${v.marca} ${v.modelo} (KM: ${v.kmAtual.toLocaleString()})
      </option>
    `).join("")}
  `;

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
    <input type="text" class="form-input part-item text-xs" placeholder="Item / Peça" value="${item}" required>
    <input type="number" class="form-input part-qtd text-xs text-center" placeholder="Qtd" min="1" value="${qtd}" oninput="calcularTotaisOS()" required>
    <input type="number" class="form-input part-unit text-xs" placeholder="R$ Unit" step="0.01" min="0" value="${unitario}" oninput="calcularTotaisOS()" required>
    <div class="part-subtotal font-bold text-emerald-700 text-xs text-right">R$ 0,00</div>
    <button type="button" class="btn-del-part text-xs" onclick="removerLinhaPeca(this)">✕</button>
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
    }
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
    mostrarToast(`Ordem de Serviço ${data.data.codigoOS} criada com sucesso!`, "success");
    await carregarOrdensServico();
    await carregarVeiculos();
    await carregarDashboard();
  } catch (err) {
    mostrarToast(err.message, "error");
  }
}

// Alterar Status da OS (Regra Central)
async function alterarStatusOS(id, novoStatus) {
  const mensagem = novoStatus === "CONCLUIDA"
    ? "Concluir esta Ordem de Serviço? Se for preventiva, o próximo ciclo de revisão do veículo será recalculado automaticamente."
    : `Alterar status para ${novoStatus}?`;

  if (!confirm(mensagem)) return;

  try {
    const res = await fetch(`${API_BASE}/ordens-servico/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus })
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    mostrarToast(`O.S. ${novoStatus}! Recálculo preventivo executado.`, "success");
    await carregarOrdensServico();
    await carregarVeiculos();
    await carregarDashboard();
  } catch (err) {
    mostrarToast(err.message, "error");
  }
}

// Histórico do Veículo
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
      container.innerHTML = `<div class="text-center text-slate-500 py-4 text-xs">Nenhuma manutenção realizada até o momento.</div>`;
    } else {
      let totalGasto = 0;
      container.innerHTML = historico.map((os) => {
        totalGasto += (os.valorTotalGeral || 0);
        const custo = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(os.valorTotalGeral || 0);

        return `
          <div class="bg-white border border-slate-200 rounded p-2.5 text-xs shadow-sm">
            <div class="flex justify-between font-bold mb-1">
              <span class="text-blue-700">${os.codigoOS} (${os.tipo})</span>
              <span class="text-emerald-700">${custo}</span>
            </div>
            <div class="text-slate-800 font-semibold mb-1">${os.descricao}</div>
            <div class="text-slate-500 text-[11px]">
              Mecânico: ${os.mecanicoResponsavel} | KM no serviço: ${os.kmNoMomento ? os.kmNoMomento.toLocaleString() + ' km' : 'N/A'}
            </div>
          </div>
        `;
      }).join("");

      document.getElementById("hist-total-gasto").textContent = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalGasto);
    }

    abrirModal("modal-historico");
  } catch (err) {
    mostrarToast(err.message || "Erro ao carregar histórico", "error");
  }
}

// Configuração de Eventos de Busca e Filtro
function configurarEventos() {
  const dashSearch = document.getElementById("dash-search-input");
  const dashStatus = document.getElementById("dash-status-select");
  if (dashSearch) dashSearch.addEventListener("input", () => renderizarTabelaAlertasDashboard(state.veiculos));
  if (dashStatus) dashStatus.addEventListener("change", () => renderizarTabelaAlertasDashboard(state.veiculos));

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

  const kmInput = document.getElementById("veiculo-km");
  const planoSelect = document.getElementById("veiculo-plano-select");
  if (kmInput) kmInput.addEventListener("input", atualizarCalculoRevisaoVeiculo);
  if (planoSelect) planoSelect.addEventListener("change", atualizarCalculoRevisaoVeiculo);

  const moHoras = document.getElementById("os-mo-horas");
  const moValorHora = document.getElementById("os-mo-valor-hora");
  if (moHoras) moHoras.addEventListener("input", calcularTotaisOS);
  if (moValorHora) moValorHora.addEventListener("input", calcularTotaisOS);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay.active").forEach((m) => m.classList.remove("active"));
    }
  });
}

function abrirModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("active");
}

function fecharModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}

function formatarData(dataStr) {
  if (!dataStr) return "";
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
  toast.className = `toast-msg ${tipo}`;
  let icone = "ℹ️";
  if (tipo === "success") icone = "✅";
  if (tipo === "error") icone = "❌";

  toast.innerHTML = `<span>${icone}</span> <div class="font-medium">${mensagem}</div>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
