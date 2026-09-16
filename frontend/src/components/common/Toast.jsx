import React from "react";

export default function Toast({ toasts, onClose }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        const tipoClasse =
          toast.tipo === "sucesso"
            ? "success"
            : toast.tipo === "erro"
            ? "error"
            : "info";

        const icon =
          toast.tipo === "sucesso"
            ? "✅"
            : toast.tipo === "erro"
            ? "⚠️"
            : "ℹ️";

        return (
          <div key={toast.id} className={`toast-msg ${tipoClasse}`}>
            <span className="text-base">{icon}</span>
            <div className="flex-1">
              {toast.titulo && <strong className="block text-xs uppercase tracking-wide">{toast.titulo}</strong>}
              <span className="text-xs text-slate-600">{toast.mensagem}</span>
            </div>
            <button
              onClick={() => onClose(toast.id)}
              className="text-slate-400 hover:text-slate-700 ml-2 font-bold cursor-pointer"
              title="Fechar"
            >
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );
}
