import React, { useState, useEffect } from "react";
import { api } from "../../services/api";

export default function DashboardView({ onNavegar, onAbrirOSComVeiculo }) {
  const [resumo, setResumo] = useState(null);
  const [alertas, setAlertas] = useState(null);
  const [ordensRecentes, setOrdensRecentes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  const carregarDados = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const [resumoRes, alertasRes, osRes] = await Promise.all([
        api.getDashboardResumo(),
        api.getDashboardAlertas(),
        api.getOrdensServico(),
      ]);

      if (resumoRes.success) setResumo(resumoRes.data);
      if (alertasRes.success) setAlertas(alertasRes.data);
      if (osRes.success) {
        setOrdensRecentes((osRes.data || []).slice(0, 5));
      }
    } catch (err) {
      setErro(err.message || "Erro ao conectar à API.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const frota = resumo?.frota || { total: 0, emOperacao: 0, emManutencao: 0 };
  const ordensInfo = resumo?.ordensServico || { abertas: 0, emAndamento: 0, concluidas: 0 };
  const financeiro = resumo?.financeiro || { totalGeral: 0 };

  const criticos = alertas?.alertasCriticos || [];
  const atencao = alertas?.alertasAtencao || [];
  const normais = alertas?.normais || [];

  // Combina todos os alertas para a tabela com filtros
  const todosAlertas = [
    ...criticos.map((a) => ({ ...a, statusAlerta: "CRITICO" })),
    ...atencao.map((a) => ({ ...a, statusAlerta: "ATENCAO" })),
    ...normais.map((a) => ({ ...a, statusAlerta: "NORMAL" })),
  ];

  const alertasFiltrados = todosAlertas.filter((item) => {
    const matchBusca =
      (item.placa || "").toLowerCase().includes(busca.toLowerCase()) ||
      (item.modelo || "").toLowerCase().includes(busca.toLowerCase());
    const matchStatus = !filtroStatus || item.statusAlerta === filtroStatus;
    return matchBusca && matchStatus;
  });

  // Próxima revisão crítica
  const proxCritico = criticos[0] || null;

  // Alturas dinâmicas para o gráfico de barras
  const totalFrota = frota.total || 1;
  const hOperacao = Math.max(16, Math.min(110, Math.round((frota.emOperacao / totalFrota) * 110)));
  const hCritico = Math.max(16, Math.min(110, Math.round((criticos.length / totalFrota) * 110)));
  const hAtencao = Math.max(16, Math.min(110, Math.round((atencao.length / totalFrota) * 110)));
  const hOficina = Math.max(16, Math.min(110, Math.round((frota.emManutencao / totalFrota) * 110)));

  return (
    <section id="section-dashboard" className="app-view active">
      {/* 1. Header da Tela */}
      <div className="view-header">
        <div>
          <h2 className="view-title">Dashboard de Manutenção</h2>
          <p className="view-desc">Monitoramento proativo da frota e controle de intervenções preventivas.</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-primary shadow-sm"
            onClick={() => onNavegar("veiculos", { abrirNovo: true })}
          >
            + Novo Veículo
          </button>
          <button
            className="btn btn-secondary shadow-sm"
            onClick={() => onNavegar("ordens", { abrirNovo: true })}
          >
            + Criar O.S.
          </button>
        </div>
      </div>

      {erro && (
        <div className="p-4 mb-4 rounded-lg bg-red-100 border border-red-300 text-red-800 text-sm flex justify-between items-center">
          <span>⚠️ {erro}</span>
          <button className="btn btn-secondary btn-sm" onClick={carregarDados}>Tentar novamente</button>
        </div>
      )}

      {/* 2. 4 KPI CARDS */}
      <div className="kpi-row">
        {/* Card 1: Total de Veículos */}
        <div className="kpi-box">
          <div className="kpi-content">
            <span className="kpi-label">Total de Veículos</span>
            <span className="kpi-number" id="kpi-total-veiculos">{frota.total}</span>
            <span className="kpi-subdetail" id="kpi-veiculos-operacao">{frota.emOperacao} em operação normal</span>
          </div>
          <div className="kpi-icon-badge kpi-icon-blue">
            🚗
          </div>
        </div>

        {/* Card 2: Em Manutenção */}
        <div className="kpi-box">
          <div className="kpi-content">
            <span className="kpi-label">Em Manutenção</span>
            <span className="kpi-number" id="kpi-veiculos-manutencao">{frota.emManutencao}</span>
            <span className="kpi-subdetail" id="kpi-os-ativas">{ordensInfo.emAndamento} O.S. em andamento</span>
          </div>
          <div className="kpi-icon-badge kpi-icon-green">
            🔧
          </div>
        </div>

        {/* Card 3: Revisões Pendentes */}
        <div className="kpi-box">
          <div className="kpi-content">
            <span className="kpi-label">Revisões Pendentes</span>
            <span className="kpi-number" id="kpi-alertas-criticos" style={{ color: "var(--color-danger)" }}>
              {criticos.length}
            </span>
            <span className="kpi-subdetail" id="kpi-alertas-atencao">{atencao.length} em atenção</span>
          </div>
          <div className="kpi-icon-badge kpi-icon-orange">
            📋
          </div>
        </div>

        {/* Card 4: Próxima Revisão Crítica */}
        <div className="kpi-box">
          <div className="kpi-content">
            <span className="kpi-label">Próxima Revisão Crítica</span>
            <span className="text-base font-bold text-slate-900" id="kpi-critico-placa">
              {proxCritico ? proxCritico.placa : "Nenhum Alerta"}
            </span>
            <span className="text-xs font-semibold text-rose-600 mt-1" id="kpi-critico-desc">
              {proxCritico
                ? `${Number(proxCritico.kmAtual).toLocaleString("pt-BR")} KM - Atrasado`
                : "Frota 100% em dia"}
            </span>
          </div>
          <div className="kpi-icon-badge kpi-icon-red">
            ⚠️
          </div>
        </div>
      </div>

      {/* 3. DASHBOARD 2-COLUMN GRID */}
      <div className="dashboard-main-grid">
        {/* LEFT COLUMN: Alertas de Revisão Imediata */}
        <div className="card">
          <h3 className="card-title">Alertas de Revisão Imediata</h3>

          {/* Toolbar */}
          <div className="table-toolbar">
            <div className="search-box-wrapper">
              <span className="search-icon-inside">🔍</span>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="input-search"
                placeholder="Buscar por placa, modelo..."
              />
            </div>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="select-filter"
            >
              <option value="">Todos os Status</option>
              <option value="CRITICO">Atrasado</option>
              <option value="ATENCAO">Em Breve</option>
              <option value="NORMAL">OK</option>
            </select>

            <button className="btn btn-secondary btn-sm" onClick={carregarDados} title="Atualizar dados">
              🔄 Atualizar
            </button>
          </div>

          {/* Tabela de Alertas */}
          <div className="overflow-x-auto">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Modelo</th>
                  <th>KM Atual</th>
                  <th>Plano de Manutenção</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody id="dash-alerts-tbody">
                {carregando ? (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-slate-400">
                      Carregando alertas de revisão...
                    </td>
                  </tr>
                ) : alertasFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-slate-400">
                      Nenhum alerta localizado para os filtros informados.
                    </td>
                  </tr>
                ) : (
                  alertasFiltrados.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="font-bold text-slate-900">{item.placa}</td>
                      <td>{item.modelo}</td>
                      <td className="font-mono">{Number(item.kmAtual).toLocaleString("pt-BR")} KM</td>
                      <td className="text-slate-600">{item.plano?.nome || "Plano Padrão"}</td>
                      <td>
                        {item.statusAlerta === "CRITICO" && (
                          <span className="status-pill pill-atrasado">Atrasado</span>
                        )}
                        {item.statusAlerta === "ATENCAO" && (
                          <span className="status-pill pill-embreve">Em Breve</span>
                        )}
                        {item.statusAlerta === "NORMAL" && (
                          <span className="status-pill pill-ok">OK</span>
                        )}
                      </td>
                      <td>
                        <div className="action-links">
                          <button
                            className="action-btn-link text-blue-700"
                            onClick={() => onAbrirOSComVeiculo(item.id)}
                            title="Abrir Ordem de Serviço"
                          >
                            + Criar O.S.
                          </button>
                          <button
                            className="action-btn-link text-slate-600"
                            onClick={() => onNavegar("veiculos")}
                            title="Gerenciar Veículo"
                          >
                            ⚡ KM
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: Ordens Recentes + Gráfico da Frota */}
        <div className="dashboard-side-column">
          {/* Widget 1: Ordens de Serviço Recentes */}
          <div className="card">
            <div className="flex justify-between items-center mb-3">
              <h3 className="card-title mb-0">Ordens de Serviço Recentes</h3>
              <button
                className="text-xs text-blue-600 font-semibold hover:underline"
                onClick={() => onNavegar("ordens")}
              >
                Ver todas &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="custom-table" style={{ fontSize: "0.8rem" }}>
                <thead>
                  <tr>
                    <th>O.S. #</th>
                    <th>Veículo</th>
                    <th>Serviço</th>
                    <th>Custo</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody id="dash-os-tbody">
                  {carregando ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-slate-400">
                        Carregando ordens de serviço...
                      </td>
                    </tr>
                  ) : ordensRecentes.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-slate-400">
                        Nenhuma ordem de serviço recente.
                      </td>
                    </tr>
                  ) : (
                    ordensRecentes.map((os) => (
                      <tr key={os.id}>
                        <td className="font-mono font-bold text-blue-700">{os.codigoOS || `#${os.id}`}</td>
                        <td>{os.veiculo?.placa || "-"}</td>
                        <td className="truncate max-w-[120px]" title={os.descricao}>
                          {os.descricao}
                        </td>
                        <td className="font-semibold text-slate-800">
                          R$ {Number(os.valorTotalGeral || os.custoTotal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          {os.status === "CONCLUIDA" && (
                            <span className="status-pill pill-concluida">Concluída</span>
                          )}
                          {os.status === "EM_ANDAMENTO" && (
                            <span className="status-pill pill-andamento">Andamento</span>
                          )}
                          {os.status === "ABERTA" && (
                            <span className="status-pill pill-aberta">Aberta</span>
                          )}
                          {os.status === "CANCELADA" && (
                            <span className="status-pill pill-cancelada">Cancelada</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Widget 2: Visão Geral da Frota (Gráfico de Barras) */}
          <div className="card">
            <h3 className="card-title">Visão Geral da Frota</h3>

            <div className="fleet-chart-container">
              <div className="chart-bar-group">
                <div
                  className="chart-bar chart-bar-1"
                  style={{ height: `${hOperacao}px` }}
                  title={`Em Operação: ${frota.emOperacao}`}
                ></div>
                <span className="chart-label">Operação</span>
              </div>

              <div className="chart-bar-group">
                <div
                  className="chart-bar chart-bar-3"
                  style={{ height: `${hCritico}px` }}
                  title={`Crítico: ${criticos.length}`}
                ></div>
                <span className="chart-label">Crítico</span>
              </div>

              <div className="chart-bar-group">
                <div
                  className="chart-bar chart-bar-2"
                  style={{ height: `${hAtencao}px` }}
                  title={`Atenção: ${atencao.length}`}
                ></div>
                <span className="chart-label">Atenção</span>
              </div>

              <div className="chart-bar-group">
                <div
                  className="chart-bar chart-bar-4"
                  style={{ height: `${hOficina}px` }}
                  title={`Oficina: ${frota.emManutencao}`}
                ></div>
                <span className="chart-label">Oficina</span>
              </div>
            </div>

            <div className="flex justify-between text-xs text-slate-500 mt-3 px-2">
              <span>
                Total Frota:{" "}
                <strong id="chart-total-text" className="text-slate-800">
                  {frota.total} veículos
                </strong>
              </span>
              <span>
                Custo Total:{" "}
                <strong id="chart-custo-text" className="text-emerald-700">
                  R$ {Number(financeiro.totalGeral || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
