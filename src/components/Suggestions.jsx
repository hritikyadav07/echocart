// A lightweight suggestion list; can be wired to voice or search later
function Suggestions({ suggestions = [], onPick }) {
  if (!suggestions.length) return null;
  return (
    <div className="rounded-xl border border-emerald-100 bg-white p-4 dark:bg-slate-800 dark:border-slate-700">
      <h3 className="mb-2 text-md font-medium text-emerald-800 dark:text-emerald-300">
        Suggestions
      </h3>
      <ul className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => onPick?.(s)}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-800 hover:bg-emerald-100 dark:border-slate-700 dark:bg-slate-700/50 dark:text-slate-100"
            >
              {s}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Suggestions;
