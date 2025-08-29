export function CategoryList({ grouped, onToggleDone, onInc, onDec, onDelete }) {
  return (
    <div className="grid gap-6">
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-gray-300" />
            <h3 className="text-sm font-medium capitalize text-gray-700">{cat}</h3>
          </div>
          <ul className="divide-y bg-white rounded-lg shadow-sm">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    className={`h-5 w-5 rounded border flex items-center justify-center ${item.done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}
                    title={item.done ? 'Mark as not done' : 'Mark as done'}
                    onClick={() => onToggleDone(item.id)}
                    aria-label="toggle done"
                  >
                    {item.done ? (<span className="text-white text-xs">✓</span>) : (<span className="text-gray-300">&nbsp;</span>)}
                  </button>
                  <div>
                    <div className={`font-medium ${item.done ? 'line-through text-gray-400' : ''}`}>{item.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{cat}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="h-6 w-6 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200" onClick={() => onDec(item.id)} aria-label="decrease quantity">−</button>
                  <span className="inline-flex items-center justify-center min-w-8 h-6 px-2 rounded-full bg-gray-100 text-gray-700 text-sm">x{item.quantity}</span>
                  <button className="h-6 w-6 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200" onClick={() => onInc(item.id)} aria-label="increase quantity">+</button>
                  <button className="ml-2 h-6 w-6 rounded-full bg-red-50 text-red-600 hover:bg-red-100" onClick={() => onDelete(item.id)} aria-label="delete item" title="Delete">×</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
