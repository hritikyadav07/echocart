import React from "react";

export function ToastStack({ toasts = [], onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-sm space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`flex items-start gap-2 rounded-lg border px-3 py-2 shadow-md transition-all ${
            t.type === "error"
              ? "border-red-200 bg-red-50 text-red-800 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-300"
              : t.type === "info"
              ? "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800/40 dark:bg-sky-900/20 dark:text-sky-300"
              : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-300"
          }`}
        >
          <span aria-hidden className="mt-0.5">
            {t.type === "error" ? "⚠️" : t.type === "info" ? "ℹ️" : "✅"}
          </span>
          <div className="min-w-0 flex-1 text-sm">
            {t.message}
          </div>
          <button
            onClick={() => onDismiss?.(t.id)}
            className="ml-1 text-xs opacity-70 hover:opacity-100"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastStack;
