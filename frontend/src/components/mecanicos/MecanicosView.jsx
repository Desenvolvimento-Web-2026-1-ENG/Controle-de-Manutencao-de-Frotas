import React, { useState, useEffect } from "react";
import { api } from "../../services/api";

export default function MecanicosView({ onShowToast }) {
  const [mecanicos, setMecanicos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [modalAberto, setModalAberto] = useState(false);
  const [mecanicoEditando, setMecanicoEditando] = useState(null);
  const [formMecanico, setFormMecanico] = useState({
    nome: "",
    cargo: "Mecânico",
    especialidade: "",
    telefone: "",
    status: "DISPONIVEL",
  });

  const carregarMecanicos = async () => {
    try {
      setCarregando(true);
      const res = await api.getMecanicos();
      if (res.success) setMecanicos(res.data);
    } catch (err) {
      if (onShowToast) onShowToast("erro", "Erro", err.message || "Erro ao carregar mecânicos.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarMecanicos();
  }, []);

  const abrirNovo = () => {
    setMecanicoEditando(null);
    setFormMecanico({
      nome: "",
      cargo: "Mecânico",
      especialidade: "",
      telefone: "",
      status: "DISPONIVEL",
    });
    setModalAberto(true);
  };

  const abrirEditar = (m) => {
    setMecanicoEditando(m);
    setFormMecanico({
      nome: m.nome,
      cargo: m.cargo || "Mecânico",
      especialidade: m.especialidade || "",
      telefone: m.telefone || "",
      status: m.status || "DISPONIVEL",
    });
    setModalAberto(true);
  };

  const salvarMecanico = async (e) => {
    e.preventDefault();
    try {
      if (mecanicoEditando) {
        await api.atualizarMecanico(mecanicoEditando.id, formMecanico);
        if (onShowToast) onShowToast("sucesso", "Mecânico Atualizado", `Dados de ${formMecanico.nome} atualizados.`);
      } else {
        await api.criarMecanico(formMecanico);
        if (onShowToast) onShowToast("sucesso", "Mecânico Cadastrado", `${formMecanico.nome} adicionado à equipe.`);
      }

      setModalAberto(false);
      carregarMecanicos();
    } catch (err) {
      if (onShowToast) onShowToast("erro", "Erro ao salvar", err.message);
    }
  };

  const excluirMecanico = async (id, nome) => {
    if (!window.confirm(`Deseja remover o mecânico "${nome}" do cadastro?`)) return;
    try {
      await api.deletarMecanico(id);
      if (onShowToast) onShowToast("sucesso", "Mecânico Removido", `${nome} foi excluído.`);
      carregarMecanicos();
    } catch (err) {
      if (onShowToast) onShowToast("erro", "Erro ao excluir", err.message);
    }
  };

  return (
    <section id="section-mecanicos" className="app-view active">
      <div className="view-header">
        <div>
          <h2 className="view-title">👥 Quadro de Mecânicos &amp; Especialistas</h2>
          <p className="view-desc">Profissionais capacitados para execução e supervisão das manutenções preventivas e corretivas.</p>
        </div>
        <button className="btn btn-primary" onClick={abrirNovo}>
          + Cadastrar Mecânico
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nome do Mecânico</th>
                <th>Cargo / Nível</th>
                <th>Especialidade Principal</th>
                <th>Contato / Telefone</th>
                <th>Status na Oficina</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="mecanicos-table-body">
              {carregando ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-slate-400">
                    Carregando equipe técnica...
                  </td>
                </tr>
              ) : mecanicos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-slate-400">
                    Nenhum mecânico cadastrado no momento.
                  </td>
                </tr>
              ) : (
                mecanicos.map((m) => (
                  <tr key={m.id}>
                    <td className="font-bold text-slate-900">{m.nome}</td>
                    <td className="text-slate-600">{m.cargo}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold">
                        {m.especialidade}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-slate-600">
                      {m.telefone || "Não informado"}
                    </td>
                    <td>
                      {m.status === "DISPONIVEL" && (
                        <span className="status-pill pill-ok">Disponível</span>
                      )}
                      {m.status === "EM_SERVICO" && (
                        <span className="status-pill pill-andamento">Em Serviço</span>
                      )}
                    </td>
                    <td>
                      <div className="action-links">
                        <button
                          className="action-btn-link text-slate-600"
                          onClick={() => abrirEditar(m)}
                          title="Editar Cadastro"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          className="action-btn-link action-btn-danger"
                          onClick={() => excluirMecanico(m.id, m.nome)}
                          title="Excluir Mecânico"
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

      {/* ==================== MODAL: CADASTRO / EDIÇÃO DE MECÂNICO ==================== */}
      <div className={`modal-overlay ${modalAberto ? "active" : ""}`} role="dialog" aria-modal="true">
        <div className="modal-card" style={{ maxWidth: "500px" }}>
          <div className="modal-header">
            <h3 className="modal-title">
              {mecanicoEditando ? "Editar Mecânico" : "👥 Cadastrar Novo Mecânico"}
            </h3>
            <button className="modal-close" onClick={() => setModalAberto(false)}>&times;</button>
          </div>
          <form onSubmit={salvarMecanico}>
            <div className="modal-body">
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="mecanico-nome">Nome Completo *</label>
                <input
                  type="text"
                  id="mecanico-nome"
                  className="form-input"
                  placeholder="Ex: Roberto Nascimento"
                  required
                  value={formMecanico.nome}
                  onChange={(e) => setFormMecanico({ ...formMecanico, nome: e.target.value })}
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label" htmlFor="mecanico-cargo">Cargo / Função *</label>
                <input
                  type="text"
                  id="mecanico-cargo"
                  className="form-input"
                  placeholder="Ex: Mecânico Especialista"
                  required
                  value={formMecanico.cargo}
                  onChange={(e) => setFormMecanico({ ...formMecanico, cargo: e.target.value })}
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label" htmlFor="mecanico-esp">Especialidade Principal *</label>
                <input
                  type="text"
                  id="mecanico-esp"
                  className="form-input"
                  placeholder="Ex: Suspensão, Motores, Injeção..."
                  required
                  value={formMecanico.especialidade}
                  onChange={(e) => setFormMecanico({ ...formMecanico, especialidade: e.target.value })}
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label" htmlFor="mecanico-tel">Telefone / Ramal</label>
                <input
                  type="text"
                  id="mecanico-tel"
                  className="form-input"
                  placeholder="(11) 98888-7777"
                  value={formMecanico.telefone}
                  onChange={(e) => setFormMecanico({ ...formMecanico, telefone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="mecanico-status-select">Status na Oficina</label>
                <select
                  id="mecanico-status-select"
                  className="form-select"
                  value={formMecanico.status}
                  onChange={(e) => setFormMecanico({ ...formMecanico, status: e.target.value })}
                >
                  <option value="DISPONIVEL">Disponível</option>
                  <option value="EM_SERVICO">Em Serviço</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModalAberto(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Salvar Mecânico
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
