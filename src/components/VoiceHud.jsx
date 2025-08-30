import React from "react";

function Chip({ label, value, color = "emerald" }) {
  if (!value) return null;
  const colorMap = {
    emerald:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
    sky: "bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300",
    amber:
      "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
    gray: "bg-gray-100 text-gray-700 dark:bg-slate-700/40 dark:text-slate-200",
  };
  const colorCls = colorMap[color] || colorMap.gray;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${colorCls}`}
    >
      <span className="opacity-80">{label}:</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

// Live voice heads-up display with transcription and intent highlights
// Props:
// - listening: bool
// - interim: string (live)
// - finalText: string (last final)
// - intent: { action, item, quantity }
// - lang: string
export default function VoiceHud({
  listening,
  interim,
  finalText,
  intent,
  lang,
}) {
  const text = listening ? interim || finalText : finalText;
  const show = Boolean(
    listening || text || (intent && (intent.action || intent.item))
  );
  if (!show) return null;

  return (
    <section
      className={`w-full rounded-xl border ${
        listening
          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-600/70 dark:bg-emerald-900/20"
          : "border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800"
      } p-3`}
    >
      {/* Transcription */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-sm break-words ${
              listening
                ? "text-emerald-800 dark:text-emerald-200"
                : "text-gray-800 dark:text-slate-200"
            }`}
            aria-live={listening ? "assertive" : "polite"}
            aria-atomic="true"
          >
            {listening && (
              <span className="inline-flex items-center gap-1 mr-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"
                  aria-hidden="true"
                />
                <span className="sr-only">Listening</span>
              </span>
            )}
            {text ? text : listening ? "Listening…" : ""}
          </p>
        </div>
        <span
          className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5"
          aria-label="language"
        >
          {lang}
        </span>
      </div>

      {/* Intent chips */}
      {intent && (intent.action || intent.item || intent.quantity) && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Chip label="Action" value={intent.action} color="emerald" />
          <Chip label="Item" value={intent.item} color="sky" />
          <Chip label="Qty" value={intent.quantity} color="amber" />
        </div>
      )}
    </section>
  );
}
