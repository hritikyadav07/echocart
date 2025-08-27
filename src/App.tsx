import { useMemo, useState } from "react";

type Item = {
  id: string;
  name: string;
  quantity: number;
  category: string;
  done?: boolean;
};

const initialItems: Item[] = [
  { id: "1", name: "Milk", quantity: 1, category: "dairy" },
  { id: "2", name: "Apples", quantity: 4, category: "produce" },
  { id: "3", name: "Chips", quantity: 2, category: "snacks" },
];

export default function App() {
  const [list] = useState<Item[]>(initialItems);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState<string>("");

  const grouped = useMemo(() => {
    return list.reduce<Record<string, Item[]>>((acc, it) => {
      acc[it.category] ||= [];
      acc[it.category].push(it);
      return acc;
    }, {});
  }, [list]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b ">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-emerald-500" aria-hidden />
            <h1 className="text-3xl sm:text-xl font-semibold my-5">EchoCart</h1>
          </div>
          {/* Desktop mic button (hidden, using bottom-center FAB instead) */}
          <button
            aria-pressed={listening}
            aria-label={listening ? "Stop listening" : "Start listening"}
            className={`hidden items-center gap-2 rounded-full px-4 py-4 text-white transition-colors ${
              listening ? "bg-emerald-600" : "bg-gray-900 hover:bg-gray-800"
            }`}
            onClick={() => {
              setListening((v) => !v);
              setTranscript((v) => (v ? v : ""));
            }}
          >
            <MicIcon pulsing={listening} />
            <span>{listening ? "Listening..." : "Mic"}</span>
          </button>
        </div>
        {/* Status / transcript bar */}
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
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <section className="space-y-6">
          <h2 className="text-base font-semibold text-gray-800">Your List</h2>
          {Object.keys(grouped).length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-6">
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat} className="">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-gray-300" />
                    <h3 className="text-sm font-medium capitalize text-gray-700">
                      {cat}
                    </h3>
                  </div>
                  <ul className="divide-y bg-white rounded-lg shadow-sm">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-gray-500 capitalize">
                            added just now
                          </div>
                        </div>
                        <span className="inline-flex items-center justify-center min-w-8 h-6 px-2 rounded-full bg-gray-100 text-gray-700 text-sm">
                          x{item.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Floating mic button (bottom-center on all screens) */}
      <button
        aria-pressed={listening}
        aria-label={listening ? "Stop listening" : "Start listening"}
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 transform z-50 shadow-lg rounded-full p-5 text-white ${
          listening ? "bg-emerald-600" : "bg-gray-900 hover:bg-gray-800"
        }`}
        onClick={() => {
          setListening((v) => !v);
          setTranscript((v) => (v ? v : ""));
        }}
      >
        <MicIcon pulsing={listening} />
      </button>
    </div>
  );
}

function MicIcon({ pulsing }: { pulsing?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`h-5 w-5 ${pulsing ? "animate-pulse" : ""}`}
      aria-hidden
    >
      <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2Zm-5 7a7.001 7.001 0 0 1-6.32-4H5.06a9 9 0 0 0 17.88 0h-.62A7.001 7.001 0 0 1 12 18Z" />
    </svg>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed bg-white p-8 text-center text-gray-600">
      <p className="mb-2 font-medium">Your list is empty</p>
      <p className="text-sm">Use the mic to add items, e.g., “add milk”.</p>
    </div>
  );
}
