import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Wrench,
  CheckCircle2,
  Clock,
  UserCheck,
} from "lucide-react";
import { api } from "../../services/api";
import Modal from "../common/Modal";

export default function MecanicosView({ onShowToast }) {
  const [mecanicos, setMecanicos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [mecanicoEditando, setMecanicoEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    cargo: "Mecânico Especialista",
    especialidade: "Motores a Diesel",
    telefone: "",
    status: "DISPONIVEL",
  });

  useEffect(() => {
    carregarMecanicos();
  }, []);

  const carregarMecanicos = async () => {
    try {
      setCarregando(true);
      const res = await api.getMecanicos();
      if (res.success) setMecanicos(res.data);
    } catch (err) {
      onShowToast("erro", "Erro ao carregar mecânicos", err.message);
    } finally {
      setCarregando(false);
    }
  };

  const abrirCriacao = () => {
    setMecanicoEditando(null);
    setFormData({
      nome: "",
      cargo: "Mecânico Especialista",
      especialidade: "Sistemas Pneumáticos & Freios",
      telefone: "(21) 98888-0000",
      status: "DISPONIVEL",
    });
    setModalAberto(true);
  };

  const abrirEdicao = (mecanico) => {
    setMecanicoEditando(mecanico);
    setFormData({
      nome: mecanico.nome,
      cargo: mecanico.cargo || "Mecânico",
      especialidade: mecanico.especialidade || "Geral",
      telefone: mecanico.telefone || "",
      status: mecanico.status || "DISPONIVEL",
    });
    setModalAberto(true);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    try {
      setSalvando(true);
      if (mecanicoEditando) {
        await api.atualizarMecanico(mecanicoEditando.id, formData);
        onShowToast("sucesso", "Mecânico atualizado", `${formData.nome} atualizado com sucesso.`);
      } else {
        await api.criarMecanico(formData);
        onShowToast("sucesso", "Mecânico cadastrado", `${formData.nome} integrado à equipe.`);
      }
      setModalAberto(false);
      carregarMecanicos();
    } catch (err) {
      onShowToast("erro", "Erro ao salvar mecânico", err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (mecanico) => {
    if (!window.confirm(`Tem certeza que deseja remover ${mecanico.nome} da equipe?`)) return;
    try {
      await api.deletarMecanico(mecanico.id);
      onShowToast("sucesso", "Mecânico removido", `${mecanico.nome} excluído com sucesso.`);
      carregarMecanicos();
    } catch (err) {
      onShowToast("erro", "Erro ao excluir", err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Ação */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white">Quadro Técnico & Especialistas</h3>
          <p className="text-xs text-slate-400">
            Mecânicos da oficina habilitados para atendimento e ordens de serviço
          </p>
        </div>
        <button
          onClick={abrirCriacao}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Mecânico</span>
        </button>
      </div>

      {/* Grid de Mecânicos */}
      {carregando ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Carregando equipe técnica...
        </div>
      ) : mecanicos.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
          <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-medium text-slate-300">Nenhum mecânico cadastrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {mecanicos.map((m) => {
            const isDisponivel = m.status === "DISPONIVEL";
            const isServico = m.status === "EM_SERVICO";

            return (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 font-bold">
                      {m.nome
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => abrirEdicao(m)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleExcluir(m)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {m.nome}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{m.cargo}</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 text-xs">
                    <div className="text-slate-400 flex items-center gap-1.5">
                      <Wrench className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span className="truncate">{m.especialidade}</span>
                    </div>
                    {m.telefone && (
                      <div className="text-slate-400 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{m.telefone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5 ${
                      isDisponivel
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : isServico
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isDisponivel ? "bg-emerald-400" : isServico ? "bg-amber-400" : "bg-slate-400"
                      }`}
                    ></span>
                    {m.status.replace("_", " ")}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">ID #{m.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={mecanicoEditando ? `Editar Mecânico — ${mecanicoEditando.nome}` : "Cadastrar Novo Mecânico"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Completo *</label>
            <input
              type="text"
              required
              minLength={2}
              placeholder="Ex: Carlos Silva"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Cargo / Função *</label>
            <input
              type="text"
              required
              placeholder="Ex: Mecânico Chefe, Eletricista"
              value={formData.cargo}
              onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Especialidade Técnica *</label>
            <input
              type="text"
              required
              placeholder="Ex: Motores a Diesel & Transmissão Pesada"
              value={formData.especialidade}
              onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Telefone / Ramal</label>
            <input
              type="text"
              placeholder="Ex: (21) 98765-4321"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Status Operacional *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="DISPONIVEL">Disponível na Oficina</option>
              <option value="EM_SERVICO">Em Serviço (Atendendo O.S.)</option>
              <option value="AFASTADO">Afastado / Licença</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
            >
              {salvando ? "Salvando..." : mecanicoEditando ? "Salvar Alterações" : "Cadastrar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
