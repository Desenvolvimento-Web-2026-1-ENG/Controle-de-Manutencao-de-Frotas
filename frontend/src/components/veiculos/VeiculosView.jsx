import React, { useState, useEffect } from "react";
import { api } from "../../services/api";

export default function VeiculosView({ onShowToast, abrirNovoInicial = false, filtroAlertasInicial = false }) {
  const [veiculos, setVeiculos] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [apenasAlertas, setApenasAlertas] = useState(filtroAlertasInicial);

  // Modais
  const [modalVeiculoAberto, setModalVeiculoAberto] = useState(abrirNovoInicial);
  const [veiculoEditando, setVeiculoEditando] = useState(null);
  const [modalKmAberto, setModalKmAberto] = useState(false);
  const [veiculoKm, setVeiculoKm] = useState(null);
  const [novoKmValor, setNovoKmValor] = useState("");

  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
  const [veiculoHist, setVeiculoHist] = useState(null);
  const [historicoOS, setHistoricoOS] = useState([]);

  // Form de Veículo
  const [formVeiculo, setFormVeiculo] = useState({
    placa: "",
    marca: "",
    modelo: "",
    ano: 2023,
    categoria: "Pesado",
    kmAtual: "",
    motoristaResponsavel: "",
    planoManutencaoId: "",
  });

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [resVeiculos, resPlanos] = await Promise.all([
        api.getVeiculos({
          status: filtroStatus || undefined,
          categoria: filtroCategoria || undefined,
          apenasAlertas: apenasAlertas ? "true" : undefined,
        }),
        api.getPlanosManutencao(),
      ]);

      if (resVeiculos.success) setVeiculos(resVeiculos.data);
      if (resPlanos.success) {
        setPlanos(resPlanos.data);
        if (resPlanos.data.length > 0 && !formVeiculo.planoManutencaoId) {
          setFormVeiculo((prev) => ({ ...prev, planoManutencaoId: resPlanos.data[0].id }));
        }
      }
    } catch (err) {
      if (onShowToast) onShowToast("erro", "Erro", err.message || "Erro ao listar veículos.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [filtroStatus, filtroCategoria, apenasAlertas]);

  // Abertura Modal Veículo (Novo ou Edição)
  const abrirModalNovo = () => {
    setVeiculoEditando(null);
    setFormVeiculo({
      placa: "",
      marca: "",
      modelo: "",
      ano: 2023,
      categoria: "Pesado",
      kmAtual: "",
      motoristaResponsavel: "",
      planoManutencaoId: planos[0]?.id || "",
    });
    setModalVeiculoAberto(true);
  };

  const abrirModalEditar = (veiculo) => {
    setVeiculoEditando(veiculo);
    setFormVeiculo({
      placa: veiculo.placa,
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      ano: veiculo.ano,
      categoria: veiculo.categoria || "Pesado",
      kmAtual: veiculo.kmAtual,
      motoristaResponsavel: veiculo.motoristaResponsavel || "",
      planoManutencaoId: veiculo.planoManutencaoId || planos[0]?.id || "",
    });
    setModalVeiculoAberto(true);
  };

  const salvarVeiculo = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formVeiculo,
        ano: Number(formVeiculo.ano),
        kmAtual: Number(formVeiculo.kmAtual),
      };

      if (veiculoEditando) {
        await api.atualizarVeiculo(veiculoEditando.id, payload);
        if (onShowToast) onShowToast("sucesso", "Veículo Atualizado", `Veículo ${payload.placa} atualizado com sucesso!`);
      } else {
        await api.criarVeiculo(payload);
        if (onShowToast) onShowToast("sucesso", "Veículo Cadastrado", `Veículo ${payload.placa} cadastrado com sucesso!`);
      }

      setModalVeiculoAberto(false);
      carregarDados();
    } catch (err) {
      if (onShowToast) onShowToast("erro", "Erro ao salvar", err.message);
    }
  };

  const excluirVeiculo = async (id, placa) => {
    if (!window.confirm(`Tem certeza que deseja excluir o veículo ${placa}?`)) return;
    try {
      await api.deletarVeiculo(id);
      if (onShowToast) onShowToast("sucesso", "Veículo Removido", `Veículo ${placa} excluído.`);
      carregarDados();
    } catch (err) {
      if (onShowToast) onShowToast("erro", "Erro ao excluir", err.message);
    }
  };

  // Modal Atualizar KM
  const abrirModalKm = (v) => {
    setVeiculoKm(v);
    setNovoKmValor(v.kmAtual);
    setModalKmAberto(true);
  };

  const salvarNovoKm = async (e) => {
    e.preventDefault();
    if (!veiculoKm) return;
    try {
      await api.atualizarKmVeiculo(veiculoKm.id, Number(novoKmValor));
      if (onShowToast) onShowToast("sucesso", "Quilometragem Atualizada", `KM do veículo ${veiculoKm.placa} atualizado para ${novoKmValor} KM.`);
      setModalKmAberto(false);
      carregarDados();
    } catch (err) {
      if (onShowToast) onShowToast("erro", "Erro ao atualizar KM", err.message);
    }
  };

  // Modal Histórico
  const abrirHistorico = async (v) => {
    setVeiculoHist(v);
    setModalHistoricoAberto(true);
    try {
      const res = await api.getOrdensServico({ veiculoId: v.id });
      if (res.success) setHistoricoOS(res.data);
    } catch (err) {
      setHistoricoOS([]);
      if (onShowToast) onShowToast("erro", "Erro", "Não foi possível carregar o histórico de O.S.");
    }
  };

  // Filtro no client para busca por texto
  const veiculosFiltrados = veiculos.filter((v) => {
    const termo = busca.toLowerCase();
    return (
      (v.placa || "").toLowerCase().includes(termo) ||
      (v.modelo || "").toLowerCase().includes(termo) ||
      (v.marca || "").toLowerCase().includes(termo) ||
      (v.motoristaResponsavel || "").toLowerCase().includes(termo)
    );
  });

  // Projeção estimada para o form
  const planoSelecionado = planos.find((p) => p.id === formVeiculo.planoManutencaoId);
  const projKm = formVeiculo.kmAtual && planoSelecionado
    ? Number(formVeiculo.kmAtual) + Number(planoSelecionado.intervaloKm)
    : null;

  return (
    <section id="section-veiculos" className="app-view active">
      <div className="view-header">
        <div>
          <h2 className="view-title">Frota de Veículos</h2>
          <p className="view-desc">Gestão completa, atualização de quilometragem e status de revisão.</p>
        </div>
        <button className="btn btn-primary" onClick={abrirModalNovo}>
          + Cadastrar Novo Veículo
        </button>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="search-box-wrapper">
            <span className="search-icon-inside">🔍</span>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="input-search"
              placeholder="Buscar por placa, modelo, marca ou motorista..."
            />
          </div>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="select-filter"
          >
            <option value="">Status: Todos</option>
            <option value="EM_OPERACAO">Em Operação</option>
            <option value="EM_MANUTENCAO">Em Manutenção</option>
            <option value="ALERTA_REVISAO">Alerta Revisão</option>
          </select>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="select-filter"
          >
            <option value="">Categoria: Todas</option>
            <option value="Pesado">Pesado (Caminhões)</option>
            <option value="Médio">Médio (Urbanos 3/4)</option>
            <option value="Leve">Leve (Vans/Furgões)</option>
          </select>

          <button
            className={`btn btn-sm ${apenasAlertas ? "btn-danger" : "btn-secondary"}`}
            onClick={() => setApenasAlertas(!apenasAlertas)}
          >
            ⚠️ Apenas Alertas
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Modelo / Marca</th>
                <th>KM Atual</th>
                <th>Próxima Revisão</th>
                <th>Status Operacional</th>
                <th>Status Revisão</th>
                <th>Plano Vinculado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan="8" className="text-center py-6 text-slate-400">
                    Carregando veículos da frota...
                  </td>
                </tr>
              ) : veiculosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-6 text-slate-400">
                    Nenhum veículo encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                veiculosFiltrados.map((v) => (
                  <tr key={v.id}>
                    <td className="font-bold text-slate-900">{v.placa}</td>
                    <td>
                      <div className="font-semibold">{v.modelo}</div>
                      <div className="text-xs text-slate-500">{v.marca} ({v.ano})</div>
                    </td>
                    <td className="font-mono font-bold">
                      {Number(v.kmAtual).toLocaleString("pt-BR")} KM
                    </td>
                    <td className="font-mono text-slate-600">
                      {v.kmProximaRevisao ? `${Number(v.kmProximaRevisao).toLocaleString("pt-BR")} KM` : "-"}
                    </td>
                    <td>
                      {v.status === "EM_OPERACAO" && (
                        <span className="status-pill pill-ok">Operação</span>
                      )}
                      {v.status === "EM_MANUTENCAO" && (
                        <span className="status-pill pill-andamento">Manutenção</span>
                      )}
                      {v.status === "ALERTA_REVISAO" && (
                        <span className="status-pill pill-atrasado">Alerta</span>
                      )}
                    </td>
                    <td>
                      {v.alertaRevisao?.nivelAlerta === "CRITICO" && (
                        <span className="status-pill pill-atrasado">Atrasado</span>
                      )}
                      {v.alertaRevisao?.nivelAlerta === "ATENCAO" && (
                        <span className="status-pill pill-embreve">Em Breve</span>
                      )}
                      {(v.alertaRevisao?.nivelAlerta === "NORMAL" || !v.alertaRevisao?.necessitaAtencao) && (
                        <span className="status-pill pill-ok">OK</span>
                      )}
                    </td>
                    <td className="text-slate-600 text-xs">
                      {v.planoManutencao?.nome || "Plano Padrão"}
                    </td>
                    <td>
                      <div className="action-links">
                        <button
                          className="action-btn-link text-blue-700"
                          onClick={() => abrirModalKm(v)}
                          title="Atualizar Quilometragem"
                        >
                          ⚡ KM
                        </button>
                        <button
                          className="action-btn-link text-slate-600"
                          onClick={() => abrirHistorico(v)}
                          title="Ver Ficha e Histórico"
                        >
                          📜 Ficha
                        </button>
                        <button
                          className="action-btn-link text-slate-600"
                          onClick={() => abrirModalEditar(v)}
                          title="Editar Cadastro"
                        >
                          ✏️
                        </button>
                        <button
                          className="action-btn-link action-btn-danger"
                          onClick={() => excluirVeiculo(v.id, v.placa)}
                          title="Excluir Veículo"
                        >
                          🗑️
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

      {/* ==================== MODAL: CADASTRO / EDIÇÃO DE VEÍCULO ==================== */}
      <div className={`modal-overlay ${modalVeiculoAberto ? "active" : ""}`} role="dialog" aria-modal="true">
        <div className="modal-card">
          <div className="modal-header">
            <h3 className="modal-title">
              {veiculoEditando ? "Editar Veículo" : "Cadastrar Novo Veículo"}
            </h3>
            <button className="modal-close" onClick={() => setModalVeiculoAberto(false)}>&times;</button>
          </div>
          <form onSubmit={salvarVeiculo}>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="veiculo-placa">Placa do Veículo *</label>
                  <input
                    type="text"
                    id="veiculo-placa"
                    className="form-input uppercase font-bold"
                    placeholder="ABC-1234"
                    maxLength={8}
                    required
                    value={formVeiculo.placa}
                    onChange={(e) => setFormVeiculo({ ...formVeiculo, placa: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="veiculo-marca">Marca *</label>
                  <input
                    type="text"
                    id="veiculo-marca"
                    className="form-input"
                    placeholder="Volvo, Scania, Mercedes..."
                    required
                    value={formVeiculo.marca}
                    onChange={(e) => setFormVeiculo({ ...formVeiculo, marca: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="veiculo-modelo">Modelo *</label>
                  <input
                    type="text"
                    id="veiculo-modelo"
                    className="form-input"
                    placeholder="FH 540 6x4, Delivery..."
                    required
                    value={formVeiculo.modelo}
                    onChange={(e) => setFormVeiculo({ ...formVeiculo, modelo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="veiculo-ano">Ano de Fabricação *</label>
                  <input
                    type="number"
                    id="veiculo-ano"
                    className="form-input"
                    min="1980"
                    max="2030"
                    required
                    value={formVeiculo.ano}
                    onChange={(e) => setFormVeiculo({ ...formVeiculo, ano: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="veiculo-km">KM Atual Registrado *</label>
                  <input
                    type="number"
                    id="veiculo-km"
                    className="form-input font-bold"
                    min="0"
                    placeholder="50000"
                    required
                    value={formVeiculo.kmAtual}
                    onChange={(e) => setFormVeiculo({ ...formVeiculo, kmAtual: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="veiculo-categoria">Categoria</label>
                  <select
                    id="veiculo-categoria"
                    className="form-select"
                    value={formVeiculo.categoria}
                    onChange={(e) => setFormVeiculo({ ...formVeiculo, categoria: e.target.value })}
                  >
                    <option value="Pesado">Pesado (Caminhão / Cavalo Mecânico)</option>
                    <option value="Médio">Médio (Urbano 3/4)</option>
                    <option value="Leve">Leve (Van / Furgão)</option>
                  </select>
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="form-label" htmlFor="veiculo-motorista">Motorista Responsável</label>
                <input
                  type="text"
                  id="veiculo-motorista"
                  className="form-input"
                  placeholder="Nome do motorista"
                  value={formVeiculo.motoristaResponsavel}
                  onChange={(e) => setFormVeiculo({ ...formVeiculo, motoristaResponsavel: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="veiculo-plano-select">Plano de Manutenção Preventiva *</label>
                <select
                  id="veiculo-plano-select"
                  className="form-select"
                  required
                  value={formVeiculo.planoManutencaoId}
                  onChange={(e) => setFormVeiculo({ ...formVeiculo, planoManutencaoId: e.target.value })}
                >
                  {planos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} — a cada {Number(p.intervaloKm).toLocaleString("pt-BR")} KM ou {p.intervaloMeses} meses
                    </option>
                  ))}
                </select>
              </div>

              {/* Auto-calc projection banner */}
              {projKm && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3 text-xs text-blue-900">
                  <div className="font-bold mb-1">⚡ Projeção Automática do Próximo Ciclo:</div>
                  <div>
                    KM da Revisão: <strong>{projKm.toLocaleString("pt-BR")} KM</strong> | Intervalo: <strong>+{Number(planoSelecionado.intervaloKm).toLocaleString("pt-BR")} KM</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModalVeiculoAberto(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Salvar Veículo
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ==================== MODAL: ATUALIZAR KM ==================== */}
      <div className={`modal-overlay ${modalKmAberto ? "active" : ""}`} role="dialog" aria-modal="true">
        <div className="modal-card" style={{ maxWidth: "420px" }}>
          <div className="modal-header">
            <h3 className="modal-title">⚡ Atualizar KM do Veículo</h3>
            <button className="modal-close" onClick={() => setModalKmAberto(false)}>&times;</button>
          </div>
          <form onSubmit={salvarNovoKm}>
            <div className="modal-body">
              <p className="text-sm text-slate-600 mb-3">
                Informe o novo valor do odômetro para o veículo <strong>{veiculoKm?.placa}</strong>. O sistema recalculará os alertas automaticamente.
              </p>
              <div className="text-sm mb-3">
                KM Atual no Sistema: <strong className="text-blue-700">{Number(veiculoKm?.kmAtual || 0).toLocaleString("pt-BR")} KM</strong>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="novo-km-input">Novo KM *</label>
                <input
                  type="number"
                  id="novo-km-input"
                  className="form-input font-bold text-lg"
                  required
                  value={novoKmValor}
                  onChange={(e) => setNovoKmValor(e.target.value)}
                  min={veiculoKm?.kmAtual || 0}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModalKmAberto(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Atualizar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ==================== MODAL: HISTÓRICO & FICHA DO VEÍCULO ==================== */}
      <div className={`modal-overlay ${modalHistoricoAberto ? "active" : ""}`} role="dialog" aria-modal="true">
        <div className="modal-card" style={{ maxWidth: "680px" }}>
          <div className="modal-header">
            <h3 className="modal-title">Ficha e Histórico de Manutenções</h3>
            <button className="modal-close" onClick={() => setModalHistoricoAberto(false)}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xl font-black text-blue-700">{veiculoHist?.placa}</span>
                <span className="text-sm font-semibold text-slate-800">
                  {veiculoHist?.marca} {veiculoHist?.modelo} ({veiculoHist?.ano})
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>KM Atual: <strong className="text-slate-900">{Number(veiculoHist?.kmAtual || 0).toLocaleString("pt-BR")} KM</strong></span>
                <span>Plano: <strong className="text-blue-700">{veiculoHist?.planoManutencao?.nome || "Padrão"}</strong></span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold text-sm text-slate-800">Linha do Tempo de Manutenções</h4>
              <span className="text-xs text-slate-500">
                Total Registros: <strong className="text-slate-900">{historicoOS.length}</strong>
              </span>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {historicoOS.length === 0 ? (
                <p className="text-center py-6 text-slate-400 text-sm">
                  Nenhuma ordem de serviço registrada para este veículo.
                </p>
              ) : (
                historicoOS.map((os) => (
                  <div key={os.id} className="p-3 rounded-lg border border-slate-200 bg-white shadow-xs">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-bold text-blue-700">{os.codigoOS || `O.S. #${os.id}`}</span>
                      <span className="text-slate-500">{new Date(os.createdAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <div className="text-sm font-medium text-slate-800 mb-1">{os.descricao}</div>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>Mecânico: {os.mecanico?.nome || "-"}</span>
                      <span className="font-bold text-emerald-700">
                        R$ {Number(os.custoTotal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModalHistoricoAberto(false)}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
