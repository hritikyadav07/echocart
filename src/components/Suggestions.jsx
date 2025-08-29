export function Suggestions({ items, onAdd }) {
  if (!items?.length) return null;
  return (
    <div className="space-y-2">
      <div className="mb-1 flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
        <h3 className="text-sm font-medium text-gray-700">Suggestions</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((s) => (
          <button
            key={s}
            className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm hover:bg-emerald-100"
            onClick={() => onAdd(s)}
          >
            + {s}
          </button>
        ))}
      </div>
    </div>
  );
}
