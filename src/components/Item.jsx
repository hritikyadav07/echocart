function Item({ item, onInc, onDec, onDelete, onToggleBought }) {
  const disableDec = item.qty <= 1;
  const isBought = Boolean(item.bought);
  return (
    <li
      className={`group flex items-center justify-between rounded-xl border border-emerald-100 bg-white px-2.5 py-2.5 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800 ${
        isBought ? "opacity-70" : ""
      }`}
    >
      {/* Left: checkbox + name */}
      <label className="flex min-w-0 items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          aria-label={`Mark ${item.name} as bought`}
          checked={isBought}
          onChange={() => onToggleBought?.(item.id)}
          className="h-5 w-5 accent-emerald-600 rounded border border-emerald-300 dark:border-slate-600"
        />
        <span
          className={`truncate font-medium ${
            isBought
              ? "text-gray-500 line-through dark:text-slate-400"
              : "text-emerald-900 dark:text-slate-100"
          }`}
        >
          {item.name}
        </span>
      </label>

      {/* Right: quantity stepper + delete */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          aria-label={`Decrease ${item.name}`}
          onClick={() => onDec?.(item.id)}
          disabled={disableDec}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 text-emerald-700 hover:bg-emerald-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-600 dark:text-emerald-300 dark:hover:bg-slate-700"
          title="Decrease"
        >
          −
        </button>
        <span className="mx-1 w-8 text-center font-semibold tabular-nums text-emerald-900 dark:text-slate-100">
          {item.qty}
        </span>
        <button
          type="button"
          aria-label={`Increase ${item.name}`}
          onClick={() => onInc?.(item.id)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 text-emerald-700 hover:bg-emerald-50 active:scale-95 dark:border-slate-600 dark:text-emerald-300 dark:hover:bg-slate-700"
          title="Increase"
        >
          +
        </button>
        <button
          type="button"
          aria-label={`Remove ${item.name}`}
          onClick={() => onDelete?.(item.id)}
          className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-red-600 hover:bg-red-50 active:scale-95 dark:hover:bg-slate-700"
          title="Delete item"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M9 3a1 1 0 0 0-1 1v1H5.5a.75.75 0 0 0 0 1.5h13a.75.75 0 0 0 0-1.5H16V4a1 1 0 0 0-1-1H9Zm1 2V4h4v1H10Z" />
            <path d="M6.5 8.25a.75.75 0 0 1 .75-.75h9.5a.75.75 0 0 1 .75.75v10a2.75 2.75 0 0 1-2.75 2.75h-5.5A2.75 2.75 0 0 1 6.5 18.25v-10ZM10 10a.75.75 0 0 0-1.5 0v8a.75.75 0 0 0 1.5 0v-8Zm2.75 0a.75.75 0 0 1 1.5 0v8a.75.75 0 0 1-1.5 0v-8Z" />
          </svg>
        </button>
      </div>
    </li>
  );
}

export default Item;
