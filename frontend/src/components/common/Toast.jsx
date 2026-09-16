import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

export default function Toast({ toasts, onClose }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.tipo === "sucesso";
        const isError = toast.tipo === "erro";
        const isWarning = toast.tipo === "aviso";

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
              isSuccess
                ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-100"
                : isError
                ? "bg-rose-950/90 border-rose-500/30 text-rose-100"
                : isWarning
                ? "bg-amber-950/90 border-amber-500/30 text-amber-100"
                : "bg-slate-900/90 border-slate-700 text-slate-100"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isError && <XCircle className="w-5 h-5 text-rose-400" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-indigo-400" />}
            </div>
            <div className="flex-1 text-sm">
              {toast.titulo && <h4 className="font-semibold mb-0.5">{toast.titulo}</h4>}
              <p className="text-xs opacity-90 leading-relaxed">{toast.mensagem}</p>
            </div>
            <button
              onClick={() => onClose(toast.id)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
