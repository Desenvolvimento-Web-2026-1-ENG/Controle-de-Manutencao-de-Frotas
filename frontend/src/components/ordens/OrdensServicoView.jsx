import React, { useState, useEffect } from "react";
import { api } from "../../services/api";

export default function OrdensServicoView({ onShowToast, abrirNovoInicial = false, veiculoPreSelecionadoId = null }) {
  const [ordens, setOrdens] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  // Modal O.S.
  const [modalOSAberto, setModalOSAberto] = useState(abrirNovoInicial);
  const [formOS, setFormOS] = useState({
    veiculoId: veiculoPreSelecionadoId || "",
    tipo: "PREVENTIVA",
    kmMomento: "",
    mecanicoId: "",
    descricao: "",
    itensPeca: [],
    maoDeObraDescricao: "Mão de obra especializada",
    maoDeObraHoras: 4,
    maoDeObraValorHora: 90,
  });

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [resOS, resV, resM] = await Promise.all([
        api.getOrdensServico({
          status: filtroStatus || undefined,
          tipo: filtroTipo || undefined,
        }),
        api.getVeiculos(),
        api.getMecanicos(),
      ]);

      if (resOS.success) setOrdens(resOS.data);
      if (resV.success) setVeiculos(resV.data);
      if (resM.success) {
        setMecanicos(resM.data);
        if (resM.data.length > 0 && !formOS.mecanicoId) {
          setFormOS((prev) => ({ ...prev, mecanicoId: resM.data[0].id }));
        }
      }

      // Preenche KM inicial se houver veículo selecionado
      if (veiculoPreSelecionadoId && resV.data) {
        const v = resV.data.find((item) => item.id === veiculoPreSelecionadoId);
        if (v) {
          setFormOS((prev) => ({
            ...prev,
            veiculoId: v.id,
            kmMomento: v.kmAtual,
          }));
        }
      }
    } catch (err) {
      if (onShowToast) onShowToast("erro", "Erro", err.message || "Erro ao listar Ordens de Serviço.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [filtroStatus, filtroTipo]);

  // Ao trocar o veículo no form da O.S., preenche o KM atual do odômetro
  const aoTrocarVeiculo = (vId) => {
    const v = veiculos.find((item) => item.id === vId);
    setFormOS((prev) => ({
      ...prev,
      veiculoId: vId,
      kmMomento: v ? v.kmAtual : "",
    }));
  };

  // Funções do Peças Builder
  const adicionarPeca = () => {
    setFormOS((prev) => ({
      ...prev,
      itensPeca: [
        ...prev.itensPeca,
        { id: Date.now(), descricao: "", quantidade: 1, valorUnitario: 0 },
      ],
    }));
  };

  const removerPeca = (id) => {
    setFormOS((prev) => ({
      ...prev,
      itensPeca: prev.itensPeca.filter((p) => p.id !== id),
    }));
  };

  const atualizarPeca = (id, campo, valor) => {
    setFormOS((prev) => ({
      ...prev,
      itensPeca: prev.itensPeca.map((p) =>
        p.id === id ? { ...p, [campo]: valor } : p
      ),
    }));
  };

  // Cálculos dinâmicos de custos
  const totalPecas = formOS.itensPeca.reduce(
    (acc, p) => acc + (Number(p.quantidade) || 0) * (Number(p.valorUnitario) || 0),
    0
  );
  const totalMaoDeObra = (Number(formOS.maoDeObraHoras) || 0) * (Number(formOS.maoDeObraValorHora) || 0);
  const totalGeral = totalPecas + totalMaoDeObra;

  const abrirModalNovaOS = () => {
    const vIdPadrao = veiculoPreSelecionadoId || veiculos[0]?.id || "";
    const vPadrao = veiculos.find((v) => v.id === vIdPadrao);

    setFormOS({
      veiculoId: vIdPadrao,
      tipo: "PREVENTIVA",
      kmMomento: vPadrao ? vPadrao.kmAtual : "",
      mecanicoId: mecanicos[0]?.id || "",
      descricao: "",
      itensPeca: [],
      maoDeObraDescricao: "Mão de obra especializada",
      maoDeObraHoras: 4,
      maoDeObraValorHora: 90,
    });
    setModalOSAberto(true);
  };

  const salvarNovaOS = async (e) => {
    e.preventDefault();
    if (!formOS.veiculoId) {
      if (onShowToast) onShowToast("erro", "Atenção", "Selecione um veículo.");
      return;
    }

    try {
      const payload = {
        veiculoId: formOS.veiculoId,
        tipo: formOS.tipo,
        kmMomento: Number(formOS.kmMomento),
        mecanicoId: formOS.mecanicoId,
        descricao: formOS.descricao,
        itensPeca: formOS.itensPeca.map((p) => ({
          descricao: p.descricao,
          quantidade: Number(p.quantidade),
          valorUnitario: Number(p.valorUnitario),
        })),
        maoDeObra: {
          descricao: formOS.maoDeObraDescricao,
          horasTrabalhadas: Number(formOS.maoDeObraHoras),
          valorHora: Number(formOS.maoDeObraValorHora),
        },
      };

      await api.criarOrdemServico(payload);
      if (onShowToast) onShowToast("sucesso", "O.S. Aberta", "Ordem de serviço registrada com sucesso!");
      setModalOSAberto(false);
      carregarDados();
    } catch (err) {
      if (onShowToast) onShowToast("erro", "Falha ao abrir O.S.", err.message);
    }
  };

  // Ações de Mudança de Status
  const alterarStatusOS = async (osId, novoStatus) => {
    try {
      await api.alterarStatusOS(osId, novoStatus);
      if (onShowToast) {
        if (novoStatus === "CONCLUIDA") {
          onShowToast("sucesso", "O.S. Concluída", "Ordem concluída e ciclo de manutenção recalculado!");
        } else if (novoStatus === "CANCELADA") {
          onShowToast("info", "O.S. Cancelada", "Ordem de serviço cancelada.");
        } else {
          onShowToast("sucesso", "Status Atualizado", `Status alterado para ${novoStatus}.`);
        }
      }
      carregarDados();
    } catch (err) {
      if (onShowToast) onShowToast("erro", "Erro ao alterar status", err.message);
    }
  };

  const excluirOS = async (id) => {
    if (!window.confirm("Deseja realmente excluir esta Ordem de Serviço?")) return;
    try {
      await api.deletarOrdemServico(id);
      if (onShowToast) onShowToast("sucesso", "O.S. Excluída", "Registro de manutenção removido.");
      carregarDados();
    } catch (err) {
      if (onShowToast) onShowToast("erro", "Erro ao excluir", err.message);
    }
  };

  return (
    <section id="section-os" className="app-view active">
      <div className="view-header">
        <div>
          <h2 className="view-title">Ordens de Serviço (O.S.)</h2>
          <p className="view-desc">Abertura, acompanhamento de peças aplicadas e conclusão com recálculo preventivo.</p>
        </div>
        <button className="btn btn-primary" onClick={abrirModalNovaOS}>
          + Abrir Nova O.S.
        </button>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="select-filter"
          >
            <option value="">Status: Todos</option>
            <option value="ABERTA">Aberta</option>
            <option value="EM_ANDAMENTO">Em Andamento</option>
            <option value="CONCLUIDA">Concluída</option>
            <option value="CANCELADA">Cancelada</option>
          </select>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="select-filter"
          >
            <option value="">Tipo: Todos</option>
            <option value="PREVENTIVA">Preventiva</option>
            <option value="CORRETIVA">Corretiva</option>
            <option value="EMERGENCIAL">Emergencial</option>
          </select>

          <button className="btn btn-secondary btn-sm" onClick={carregarDados} title="Atualizar dados">
            🔄 Atualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Código / Veículo</th>
                <th>Tipo</th>
                <th>Descrição do Serviço</th>
                <th>Mecânico</th>
                <th>Total Peças</th>
                <th>Total Geral</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan="8" className="text-center py-6 text-slate-400">
                    Carregando Ordens de Serviço...
                  </td>
                </tr>
              ) : ordens.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-6 text-slate-400">
                    Nenhuma ordem de serviço localizada.
                  </td>
                </tr>
              ) : (
                ordens.map((os) => {
                  return (
                    <tr key={os.id}>
                      <td>
                        <div className="font-mono font-bold text-blue-700">{os.codigoOS || `#${os.id}`}</div>
                        <div className="font-bold text-slate-900">{os.veiculo?.placa || "-"}</div>
                        <div className="text-xs text-slate-500">{os.veiculo?.modelo}</div>
                      </td>
                      <td>
                        <span className="font-semibold text-xs text-slate-700">{os.tipo}</span>
                      </td>
                      <td>
                        <div className="text-sm font-medium text-slate-800">{os.descricao}</div>
                        <div className="text-xs text-slate-500">KM: {Number(os.kmNoMomento || os.kmMomento || 0).toLocaleString("pt-BR")}</div>
                      </td>
                      <td className="text-slate-700 text-sm">
                        {os.mecanicoResponsavel || os.mecanico?.nome || "-"}
                      </td>
                      <td className="font-mono text-xs text-slate-600">
                        R$ {Number(os.valorTotalPecas || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="font-mono font-bold text-emerald-700">
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
                      <td>
                        <div className="action-links">
                          {os.status === "ABERTA" && (
                            <button
                              className="action-btn-link text-amber-700"
                              onClick={() => alterarStatusOS(os.id, "EM_ANDAMENTO")}
                              title="Iniciar O.S."
                            >
                              ▶️ Iniciar
                            </button>
                          )}
                          {(os.status === "ABERTA" || os.status === "EM_ANDAMENTO") && (
                            <button
                              className="action-btn-link text-emerald-700"
                              onClick={() => alterarStatusOS(os.id, "CONCLUIDA")}
                              title="Concluir O.S. e Recalcular Ciclo"
                            >
                              ✅ Concluir
                            </button>
                          )}
                          {os.status !== "CONCLUIDA" && os.status !== "CANCELADA" && (
                            <button
                              className="action-btn-link text-rose-700"
                              onClick={() => alterarStatusOS(os.id, "CANCELADA")}
                              title="Cancelar O.S."
                            >
                              ❌ Cancelar
                            </button>
                          )}
                          <button
                            className="action-btn-link action-btn-danger"
                            onClick={() => excluirOS(os.id)}
                            title="Excluir Registro"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== MODAL: ABERTURA DE O.S. ==================== */}
      <div className={`modal-overlay ${modalOSAberto ? "active" : ""}`} role="dialog" aria-modal="true">
        <div className="modal-card" style={{ maxWidth: "720px" }}>
          <div className="modal-header">
            <h3 className="modal-title">📋 Abertura de Ordem de Serviço (O.S.)</h3>
            <button className="modal-close" onClick={() => setModalOSAberto(false)}>&times;</button>
          </div>
          <form onSubmit={salvarNovaOS}>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="os-veiculo-select">Veículo *</label>
                  <select
                    id="os-veiculo-select"
                    className="form-select"
                    required
                    value={formOS.veiculoId}
                    onChange={(e) => aoTrocarVeiculo(e.target.value)}
                  >
                    <option value="">Selecione o veículo</option>
                    {veiculos.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.placa} — {v.modelo} ({Number(v.kmAtual).toLocaleString("pt-BR")} KM)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="os-tipo">Tipo de Manutenção *</label>
                  <select
                    id="os-tipo"
                    className="form-select"
                    required
                    value={formOS.tipo}
                    onChange={(e) => setFormOS({ ...formOS, tipo: e.target.value })}
                  >
                    <option value="PREVENTIVA">PREVENTIVA (Recalcula ciclo ao concluir)</option>
                    <option value="CORRETIVA">CORRETIVA (Reparo)</option>
                    <option value="EMERGENCIAL">EMERGENCIAL (Socorro em rota)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="os-km">KM no Momento *</label>
                  <input
                    type="number"
                    id="os-km"
                    className="form-input font-bold"
                    required
                    value={formOS.kmMomento}
                    onChange={(e) => setFormOS({ ...formOS, kmMomento: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="os-mecanico-select">Mecânico Responsável *</label>
                  <select
                    id="os-mecanico-select"
                    className="form-select"
                    required
                    value={formOS.mecanicoId}
                    onChange={(e) => setFormOS({ ...formOS, mecanicoId: e.target.value })}
                  >
                    {mecanicos.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome} ({m.especialidade})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="form-label" htmlFor="os-descricao">Descrição dos Serviços *</label>
                <input
                  type="text"
                  id="os-descricao"
                  className="form-input"
                  placeholder="Ex: Revisão periódica de freios e troca de filtros"
                  required
                  value={formOS.descricao}
                  onChange={(e) => setFormOS({ ...formOS, descricao: e.target.value })}
                />
              </div>

              {/* Peças Builder */}
              <div className="form-group">
                <div className="flex justify-between items-center mb-1">
                  <label className="form-label font-bold text-slate-800">📦 Peças e Materiais Utilizados</label>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm text-xs"
                    onClick={adicionarPeca}
                  >
                    + Adicionar Peça
                  </button>
                </div>
                <div className="parts-builder-container">
                  {formOS.itensPeca.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2 text-center">
                      Nenhuma peça adicionada ainda. Clique em "+ Adicionar Peça" para incluir filtros, óleos ou pastilhas.
                    </p>
                  ) : (
                    formOS.itensPeca.map((peca) => (
                      <div key={peca.id} className="parts-row">
                        <input
                          type="text"
                          placeholder="Descrição da peça / óleo"
                          className="form-input"
                          value={peca.descricao}
                          onChange={(e) => atualizarPeca(peca.id, "descricao", e.target.value)}
                          required
                        />
                        <input
                          type="number"
                          placeholder="Qtd"
                          className="form-input"
                          min="1"
                          value={peca.quantidade}
                          onChange={(e) => atualizarPeca(peca.id, "quantidade", e.target.value)}
                          required
                        />
                        <input
                          type="number"
                          placeholder="Unit (R$)"
                          className="form-input"
                          min="0"
                          step="0.01"
                          value={peca.valorUnitario}
                          onChange={(e) => atualizarPeca(peca.id, "valorUnitario", e.target.value)}
                          required
                        />
                        <div className="text-xs font-mono font-bold text-slate-700 px-1">
                          R$ {((Number(peca.quantidade) || 0) * (Number(peca.valorUnitario) || 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                        <button
                          type="button"
                          className="btn-del-part text-xs"
                          onClick={() => removerPeca(peca.id)}
                          title="Remover peça"
                        >
                          &times;
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Mão de Obra */}
              <div className="form-grid mt-3">
                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label className="form-label" htmlFor="os-mo-desc">Descrição Mão de Obra</label>
                  <input
                    type="text"
                    id="os-mo-desc"
                    className="form-input"
                    value={formOS.maoDeObraDescricao}
                    onChange={(e) => setFormOS({ ...formOS, maoDeObraDescricao: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="os-mo-horas">Horas Trabalhadas</label>
                  <input
                    type="number"
                    id="os-mo-horas"
                    className="form-input"
                    min="0"
                    step="0.5"
                    value={formOS.maoDeObraHoras}
                    onChange={(e) => setFormOS({ ...formOS, maoDeObraHoras: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="os-mo-valor-hora">Valor Hora (R$)</label>
                  <input
                    type="number"
                    id="os-mo-valor-hora"
                    className="form-input"
                    min="0"
                    step="5"
                    value={formOS.maoDeObraValorHora}
                    onChange={(e) => setFormOS({ ...formOS, maoDeObraValorHora: e.target.value })}
                  />
                </div>
              </div>

              {/* Resumo de Custos */}
              <div className="bg-slate-100 border border-slate-300 rounded-lg p-3 mt-3 flex justify-between items-center text-sm">
                <div>
                  <div className="text-slate-600">
                    Peças: <strong className="text-slate-900">R$ {totalPecas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div className="text-slate-600">
                    Mão de Obra: <strong className="text-slate-900">R$ {totalMaoDeObra.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-semibold uppercase">Total da O.S.:</span>
                  <div className="text-lg font-black text-emerald-700">
                    R$ {totalGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModalOSAberto(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Abrir Ordem de Serviço
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
