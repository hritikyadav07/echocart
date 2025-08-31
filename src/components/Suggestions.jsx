import React, { useEffect, useState } from "react";

// Suggestions section — shows cards with reason and quick actions
function Suggestions({
  suggestions = [],
  onAdd,
  onDismiss,
  maxMobile = 3,
  maxDesktop = 4,
}) {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)"); // tailwind lg breakpoint
    const set = () => setIsDesktop(mql.matches);
    set();
    mql.addEventListener
      ? mql.addEventListener("change", set)
      : mql.addListener(set);
    return () => {
      mql.removeEventListener
        ? mql.removeEventListener("change", set)
        : mql.removeListener(set);
    };
  }, []);
  const cap = isDesktop ? maxDesktop : maxMobile;
  const list = (Array.isArray(suggestions) ? suggestions : []).slice(0, cap);
  if (!list.length) return null;
  console.log("suggestions count:", list.length);
  return (
    <div className="rounded-xl border border-emerald-100 bg-white p-4 dark:bg-slate-800 dark:border-slate-700">
      <h3 className="mb-3 text-lg font-medium text-emerald-800 dark:text-emerald-300">
        💡 Suggested for You
      </h3>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {list.map((s, i) => (
          <li
            key={`${s.item || s}-${i}`}
            className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3 dark:border-slate-700 dark:bg-slate-700/30"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-emerald-900 dark:text-slate-100">
                  {typeof s === "string" ? s : s.item}
                </div>
                <p className="mt-0.5 text-xs text-emerald-700 dark:text-slate-300">
                  {typeof s === "string" ? "Quick add" : s.reason}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onAdd?.(typeof s === "string" ? s : s.item)}
                  className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onDismiss?.(typeof s === "string" ? s : s.item)
                  }
                  className="rounded-full px-2 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:text-slate-300 dark:hover:bg-slate-600"
                  title="Dismiss suggestion"
                >
                  Hide
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Suggestions;
