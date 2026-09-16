import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Gauge,
  ListChecks,
} from "lucide-react";
import { api } from "../../services/api";
import Modal from "../common/Modal";

export default function PlanosView({ onShowToast }) {
  const [planos, setPlanos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [planoEditando, setPlanoEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    intervaloKm: 10000,
    intervaloMeses: 6,
    itensChecagem: "",
  });

  useEffect(() => {
    carregarPlanos();
  }, []);

  const carregarPlanos = async () => {
    try {
      setCarregando(true);
      const res = await api.getPlanosManutencao();
      if (res.success) setPlanos(res.data);
    } catch (err) {
      onShowToast("erro", "Erro ao carregar planos", err.message);
    } finally {
      setCarregando(false);
    }
  };

  const abrirCriacao = () => {
    setPlanoEditando(null);
    setFormData({
      nome: "",
      descricao: "",
      intervaloKm: 15000,
      intervaloMeses: 6,
      itensChecagem: "Troca de óleo do motor\nSubstituição de filtros\nInspeção do sistema de freios\nAlinhamento e balanceamento",
    });
    setModalAberto(true);
  };

  const abrirEdicao = (plano) => {
    setPlanoEditando(plano);
    setFormData({
      nome: plano.nome,
      descricao: plano.descricao || "",
      intervaloKm: plano.intervaloKm,
      intervaloMeses: plano.intervaloMeses,
      itensChecagem: Array.isArray(plano.itensChecagem)
        ? plano.itensChecagem.join("\n")
        : plano.itensChecagem || "",
    });
    setModalAberto(true);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    try {
      setSalvando(true);
      const payload = {
        nome: formData.nome,
        descricao: formData.descricao,
        intervaloKm: Number(formData.intervaloKm),
        intervaloMeses: Number(formData.intervaloMeses),
        itensChecagem: formData.itensChecagem
          .split("\n")
          .map((i) => i.trim())
          .filter(Boolean),
      };

      if (planoEditando) {
        await api.atualizarPlano(planoEditando.id, payload);
        onShowToast("sucesso", "Plano atualizado", `Plano ${formData.nome} salvo com sucesso.`);
      } else {
        await api.criarPlano(payload);
        onShowToast("sucesso", "Plano criado", `Novo plano ${formData.nome} cadastrado.`);
      }
      setModalAberto(false);
      carregarPlanos();
    } catch (err) {
      onShowToast("erro", "Erro ao salvar plano", err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (plano) => {
    if (!window.confirm(`Deseja remover o plano "${plano.nome}"?`)) return;
    try {
      await api.deletarPlano(plano.id);
      onShowToast("sucesso", "Plano removido", `Plano ${plano.nome} excluído com sucesso.`);
      carregarPlanos();
    } catch (err) {
      onShowToast("erro", "Impedimento de exclusão", err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Ação */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white">Planos de Manutenção Periódica</h3>
          <p className="text-xs text-slate-400">
            Regras de intervalos por quilometragem e tempo para cálculo de alertas
          </p>
        </div>
        <button
          onClick={abrirCriacao}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Plano</span>
        </button>
      </div>

      {/* Grid de Cards de Planos */}
      {carregando ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Carregando planos preventivos...
        </div>
      ) : planos.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
          <ClipboardList className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-medium text-slate-300">Nenhum plano cadastrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {planos.map((plano) => (
            <div
              key={plano.id}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {plano.nome}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500">ID #{plano.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => abrirEdicao(plano)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                      title="Editar plano"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleExcluir(plano)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Excluir plano"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                  {plano.descricao || "Sem descrição cadastrada."}
                </p>

                {/* Badges de Intervalo */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 block uppercase">Intervalo KM</span>
                    <strong className="font-mono text-xs text-indigo-400">
                      {plano.intervaloKm.toLocaleString()} km
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 block uppercase">Intervalo Meses</span>
                    <strong className="font-mono text-xs text-emerald-400">
                      {plano.intervaloMeses} meses
                    </strong>
                  </div>
                </div>

                {/* Checklist de Itens */}
                {plano.itensChecagem && plano.itensChecagem.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] font-semibold text-slate-300 block mb-2 flex items-center gap-1.5">
                      <ListChecks className="w-3.5 h-3.5 text-indigo-400" />
                      Checklist ({plano.itensChecagem.length} itens)
                    </span>
                    <ul className="space-y-1 max-h-32 overflow-y-auto pr-1">
                      {plano.itensChecagem.map((item, i) => (
                        <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500/80 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={planoEditando ? `Editar Plano — ${planoEditando.nome}` : "Cadastrar Novo Plano Preventivo"}
      >
        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Plano *</label>
            <input
              type="text"
              required
              placeholder="Ex: Plano Frota Pesada (Caminhões Trucados)"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição</label>
            <input
              type="text"
              placeholder="Ex: Revisão periódica de eixos, freios e motor para viagens longas"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Intervalo em KM *</label>
              <input
                type="number"
                required
                min={1000}
                step={500}
                placeholder="Ex: 15000"
                value={formData.intervaloKm}
                onChange={(e) => setFormData({ ...formData, intervaloKm: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Intervalo em Meses *</label>
              <input
                type="number"
                required
                min={1}
                max={24}
                placeholder="Ex: 6"
                value={formData.intervaloMeses}
                onChange={(e) => setFormData({ ...formData, intervaloMeses: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Checklist de Itens (um por linha)
            </label>
            <textarea
              rows={4}
              placeholder="Troca de óleo&#10;Substituição de filtros&#10;Regulagem de freios"
              value={formData.itensChecagem}
              onChange={(e) => setFormData({ ...formData, itensChecagem: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
            />
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
              {salvando ? "Salvando..." : planoEditando ? "Salvar Alterações" : "Criar Plano"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
