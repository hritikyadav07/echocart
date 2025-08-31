import React from "react";

export default function MicAccessBanner({ visible, onEnable, onDismiss }) {
  if (!visible) return null;
  return (
    <div className="mx-auto max-w-3xl px-4">
      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 p-3 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-100">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm">
            Enable microphone to use voice commands. Tap "Allow" when asked.
          </p>
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={onEnable}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Enable mic
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-md border border-amber-300 bg-white px-2 py-1 text-sm text-amber-900 hover:bg-amber-100 dark:bg-transparent dark:text-amber-100 dark:border-amber-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
