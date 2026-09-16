import React, { useState, useEffect } from "react";
import { api } from "../../services/api";

export default function PlanosView({ onShowToast }) {
  const [planos, setPlanos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [modalAberto, setModalAberto] = useState(false);
  const [planoEditando, setPlanoEditando] = useState(null);
  const [formPlano, setFormPlano] = useState({
    nome: "",
    descricao: "",
    intervaloKm: 15000,
    intervaloMeses: 6,
    toleranciaKm: 1000,
    itensChecagem: "Troca de óleo do motor\nSubstituição de filtros\nInspeção do sistema de freios\nAlinhamento e suspensão",
  });

  const carregarPlanos = async () => {
    try {
      setCarregando(true);
      const res = await api.getPlanosManutencao();
      if (res.success) setPlanos(res.data);
    } catch (err) {
      if (onShowToast) onShowToast("erro", "Erro", err.message || "Erro ao listar planos.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarPlanos();
  }, []);

  const abrirNovo = () => {
    setPlanoEditando(null);
    setFormPlano({
      nome: "",
      descricao: "",
      intervaloKm: 15000,
      intervaloMeses: 6,
      toleranciaKm: 1000,
      itensChecagem: "Troca de óleo do motor\nSubstituição de filtros\nInspeção de freios e suspensão",
    });
    setModalAberto(true);
  };

  const abrirEditar = (plano) => {
    setPlanoEditando(plano);
    setFormPlano({
      nome: plano.nome,
      descricao: plano.descricao || "",
      intervaloKm: plano.intervaloKm,
      intervaloMeses: plano.intervaloMeses,
      toleranciaKm: plano.toleranciaKm || 1000,
      itensChecagem: Array.isArray(plano.itensChecagem)
        ? plano.itensChecagem.join("\n")
        : plano.itensChecagem || "",
    });
    setModalAberto(true);
  };

  const salvarPlano = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formPlano,
        intervaloKm: Number(formPlano.intervaloKm),
        intervaloMeses: Number(formPlano.intervaloMeses),
        toleranciaKm: Number(formPlano.toleranciaKm),
        itensChecagem: formPlano.itensChecagem
          .split("\n")
          .map((i) => i.trim())
          .filter(Boolean),
      };

      if (planoEditando) {
        await api.atualizarPlanoManutencao(planoEditando.id, payload);
        if (onShowToast) onShowToast("sucesso", "Plano Atualizado", `Plano ${payload.nome} atualizado com sucesso!`);
      } else {
        await api.criarPlanoManutencao(payload);
        if (onShowToast) onShowToast("sucesso", "Plano Criado", `Plano ${payload.nome} cadastrado com sucesso!`);
      }

      setModalAberto(false);
      carregarPlanos();
    } catch (err) {
      if (onShowToast) onShowToast("erro", "Falha ao salvar", err.message);
    }
  };

  const excluirPlano = async (id, nome) => {
    if (!window.confirm(`Deseja excluir o plano "${nome}"?`)) return;
    try {
      await api.deletarPlanoManutencao(id);
      if (onShowToast) onShowToast("sucesso", "Plano Excluído", `Plano ${nome} removido.`);
      carregarPlanos();
    } catch (err) {
      if (onShowToast) onShowToast("erro", "Erro ao excluir", err.message);
    }
  };

  return (
    <section id="section-planos" className="app-view active">
      <div className="view-header">
        <div>
          <h2 className="view-title">Planos de Manutenção Preventiva</h2>
          <p className="view-desc">Configuração de periodicidade por quilometragem e intervalo de meses para cada categoria.</p>
        </div>
        <button className="btn btn-primary" onClick={abNovo => abrirNovo()}>
          + Novo Plano Preventivo
        </button>
      </div>

      {carregando ? (
        <div className="text-center py-12 text-slate-400">
          Carregando planos de manutenção...
        </div>
      ) : (
        <div id="planos-cards-container" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {planos.map((plano) => {
            const itens = Array.isArray(plano.itensChecagem)
              ? plano.itensChecagem
              : (plano.itensChecagem || "").split("\n").filter(Boolean);

            return (
              <div key={plano.id} className="card flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="card-title text-blue-700 font-extrabold">{plano.nome}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">
                      ± {Number(plano.toleranciaKm || 1000).toLocaleString("pt-BR")} KM
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mb-4 min-h-[36px]">
                    {plano.descricao || "Diretriz preventiva de fábrica para a frota."}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <div className="text-[11px] text-slate-500 font-semibold uppercase">Periodicidade KM</div>
                      <div className="text-sm font-bold text-slate-900">
                        A cada {Number(plano.intervaloKm).toLocaleString("pt-BR")} KM
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 font-semibold uppercase">Periodicidade Meses</div>
                      <div className="text-sm font-bold text-slate-900">
                        A cada {plano.intervaloMeses} meses
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider mb-2">
                      📋 Itens Inclusos no Ciclo:
                    </h4>
                    <ul className="text-xs text-slate-600 space-y-1.5 pl-4 list-disc">
                      {itens.length === 0 ? (
                        <li className="text-slate-400 italic">Inspeção geral recomendada</li>
                      ) : (
                        itens.map((item, idx) => <li key={idx}>{item}</li>)
                      )}
                    </ul>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-6 flex justify-end gap-2">
                  <button
                    className="action-btn-link text-slate-600"
                    onClick={() => abrirEditar(plano)}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className="action-btn-link action-btn-danger"
                    onClick={() => excluirPlano(plano.id, plano.nome)}
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== MODAL: CADASTRO / EDIÇÃO DE PLANO ==================== */}
      <div className={`modal-overlay ${modalAberto ? "active" : ""}`} role="dialog" aria-modal="true">
        <div className="modal-card" style={{ maxWidth: "560px" }}>
          <div className="modal-header">
            <h3 className="modal-title">
              {planoEditando ? "Editar Plano Preventivo" : "Cadastrar Novo Plano Preventivo"}
            </h3>
            <button className="modal-close" onClick={() => setModalAberto(false)}>&times;</button>
          </div>
          <form onSubmit={salvarPlano}>
            <div className="modal-body">
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="plano-nome">Nome do Plano *</label>
                <input
                  type="text"
                  id="plano-nome"
                  className="form-input"
                  placeholder="Ex: Plano Pesado - Rodoviário"
                  required
                  value={formPlano.nome}
                  onChange={(e) => setFormPlano({ ...formPlano, nome: e.target.value })}
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label" htmlFor="plano-desc">Descrição</label>
                <input
                  type="text"
                  id="plano-desc"
                  className="form-input"
                  placeholder="Descrição da aplicação deste plano"
                  value={formPlano.descricao}
                  onChange={(e) => setFormPlano({ ...formPlano, descricao: e.target.value })}
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="plano-km">Intervalo em KM *</label>
                  <input
                    type="number"
                    id="plano-km"
                    className="form-input font-bold"
                    min="1000"
                    step="500"
                    required
                    value={formPlano.intervaloKm}
                    onChange={(e) => setFormPlano({ ...formPlano, intervaloKm: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="plano-meses">Intervalo em Meses *</label>
                  <input
                    type="number"
                    id="plano-meses"
                    className="form-input font-bold"
                    min="1"
                    max="60"
                    required
                    value={formPlano.intervaloMeses}
                    onChange={(e) => setFormPlano({ ...formPlano, intervaloMeses: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="plano-tol">Tolerância (KM)</label>
                  <input
                    type="number"
                    id="plano-tol"
                    className="form-input"
                    min="0"
                    step="100"
                    value={formPlano.toleranciaKm}
                    onChange={(e) => setFormPlano({ ...formPlano, toleranciaKm: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="plano-itens">Itens de Checagem (um por linha)</label>
                <textarea
                  id="plano-itens"
                  rows={4}
                  className="form-textarea text-xs font-mono"
                  value={formPlano.itensChecagem}
                  onChange={(e) => setFormPlano({ ...formPlano, itensChecagem: e.target.value })}
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModalAberto(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Salvar Plano
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
