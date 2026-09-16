import React from "react";
import {
  LayoutDashboard,
  Truck,
  Wrench,
  ClipboardList,
  Users,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

export default function Sidebar({ telaAtiva, setTelaAtiva, isOpen, setIsOpen }) {
  const menuItens = [
    { id: "dashboard", label: "Dashboard & Alertas", icon: LayoutDashboard },
    { id: "veiculos", label: "Gestão da Frota", icon: Truck },
    { id: "ordens", label: "Ordens de Serviço", icon: Wrench },
    { id: "planos", label: "Planos Preventivos", icon: ClipboardList },
    { id: "mecanicos", label: "Equipe Técnica", icon: Users },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-none">
              WEBDEV FROTAS
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-1">
              Controle de Manutenção
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Navegação Principal
          </div>

          {menuItens.map((item) => {
            const Icon = item.icon;
            const ativo = telaAtiva === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setTelaAtiva(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  ativo
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      ativo ? "text-white" : "text-slate-400 group-hover:text-indigo-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {ativo && <ChevronRight className="w-4 h-4 text-white/80" />}
              </button>
            );
          })}
        </div>

        {/* Footer info box */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">Gabriel Nunes</p>
              <p className="text-[10px] text-slate-400 truncate">Engenharia Web (P2)</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between px-1 text-[11px] text-slate-400">
            <a
              href="/api-docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-indigo-400 transition-colors"
            >
              Swagger API <ExternalLink className="w-3 h-3" />
            </a>
            <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
              v2.0.0
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
