export function StatusBar({ listening, transcript }) {
  return (
    <div role="status" aria-live="polite" className="border-t bg-white/70">
      <div className="max-w-4xl mx-auto px-4 py-4 text-sm text-gray-700 flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            listening ? "bg-emerald-500 animate-pulse" : "bg-gray-300"
          }`}
        />
        <span className="truncate">
          {listening ? transcript || "Listening…" : "Idle"}
        </span>
      </div>
    </div>
  );
}
