function Item({ item, onInc, onDec, onDelete }) {
  const disableDec = item.qty <= 1;
  return (
    <li className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-slate-700 dark:bg-slate-700/50 dark:text-slate-100">
      <span className="font-medium truncate px-2">{item.name}</span>
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center ">
          <button
            type="button"
            aria-label={`Decrease ${item.name}`}
            onClick={() => onDec?.(item.id)}
            disabled={disableDec}
            className="px-2 py-1 text-emerald-700 font-bold leading-none disabled:opacity-40 disabled:cursor-not-allowed dark:text-emerald-300"
          >
            −
          </button>
          <span className="min-w-8 text-center px-1 text-gray-800 dark:text-slate-100">
            {item.qty}
          </span>
          <button
            type="button"
            aria-label={`Increase ${item.name}`}
            onClick={() => onInc?.(item.id)}
            className="px-1 py-1 text-emerald-700 font-bold leading-none dark:text-emerald-300"
          >
            +
          </button>
        </div>
        <button
          type="button"
          aria-label={`Remove ${item.name}`}
          onClick={() => onDelete?.(item.id)}
          className="inline-flex items-center rounded-md px-1 text-red-600 hover:bg-red-100 "
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
