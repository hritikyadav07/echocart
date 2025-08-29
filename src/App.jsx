import { useEffect, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { db, auth } from "./utils/firebaseConfig.js";
import Navbar from "./components/Navbar.jsx";
import ShoppingList from "./components/ShoppingList.jsx";
import Suggestions from "./components/Suggestions.jsx";

function App() {
  // UI state only (no voice logic yet)
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("");
  const [items, setItems] = useState(() => [
    { id: "sample-milk", name: "Milk", qty: 1 },
  ]); // {id, name, qty}
  const [lang, setLang] = useState("en-US");
  const [fbOk, setFbOk] = useState(null); // null=unknown, true/false
  const [showFbPanel, setShowFbPanel] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const suggestions = ["Milk", "Eggs", "Bread"];

  const languages = [
    { code: "en-US", label: "English" },
    { code: "hi-IN", label: "Hindi" },
    { code: "es-ES", label: "Spanish" },
  ];

  const handleMicClick = () => {
    // Demo: toggle "Listening…" status for a moment
    if (!isListening) {
      setIsListening(true);
      setStatus("Listening…");
      setTimeout(() => {
        setIsListening(false);
        setStatus("");
      }, 2000);
    } else {
      setIsListening(false);
      setStatus("");
    }
  };

  // Try to ensure we are authenticated (anon) before Firestore check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          await signInAnonymously(auth);
        }
        const q = query(collection(db, "healthcheck"), limit(1));
        await getDocs(q);
        setFbOk(true);
      } catch (e) {
        console.error("Firestore check failed", e);
        setFbOk(false);
      }
    });
    return () => unsub();
  }, []);

  // Theme init from localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored ? stored === "dark" : prefersDark;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  // List handlers
  const incQty = (id) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, qty: it.qty + 1 } : it))
    );
  };
  const decQty = (id) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, qty: Math.max(1, it.qty - 1) } : it
      )
    );
  };
  const deleteItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };
  const addItem = (name) => {
    setItems((prev) => {
      const existing = prev.find(
        (it) => it.name.toLowerCase() === name.toLowerCase()
      );
      if (existing) {
        return prev.map((it) =>
          it.id === existing.id ? { ...it, qty: it.qty + 1 } : it
        );
      }
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      return [...prev, { id, name, qty: 1 }];
    });
  };

  const runFirestoreCheck = async () => {
    setStatus("Checking Firestore…");
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      const q = query(collection(db, "healthcheck"), limit(1));
      await getDocs(q);
      setStatus("Firestore connected ");
      setFbOk(true);
    } catch (e) {
      console.error(e);
      setStatus("Firestore not reachable ");
      setFbOk(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white text-gray-900 dark:from-slate-900 dark:to-slate-950 dark:text-slate-100">
      <Navbar
        lang={lang}
        onLangChange={setLang}
        languages={languages}
        fbOk={fbOk}
        showFbPanel={showFbPanel}
        setShowFbPanel={setShowFbPanel}
        onRunFirestoreCheck={runFirestoreCheck}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* Main */}
      <main className="mx-auto max-w-3xl px-4 py-8 pb-28">
        <div className="flex flex-col items-center gap-6">
          {/* Status box */}
          <div className="w-full">
            <div
              className={`rounded-xl p-4 border ${
                isListening
                  ? "border-emerald-300 bg-emerald-50 dark:border-emerald-600/70 dark:bg-emerald-900/20"
                  : "border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800"
              }`}
            >
              <p
                className={`text-sm ${
                  isListening
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-gray-700 dark:text-slate-300"
                }`}
              >
                {status ? status : "Status: Idle"}
              </p>
            </div>
          </div>

          {/* Suggestions */}
          <div className="w-full">
            <Suggestions
              suggestions={suggestions}
              onPick={(s) => {
                addItem(s);
                setStatus(`Added: ${s}`);
              }}
            />
          </div>

          {/* Shopping list area */}
          <div className="w-full">
            <ShoppingList
              items={items}
              onInc={incQty}
              onDec={decQty}
              onDelete={deleteItem}
            />
          </div>
        </div>
      </main>

      {/* Floating Mic Button at bottom center */}
      <button
        type="button"
        onClick={handleMicClick}
        aria-pressed={isListening}
        aria-label="Start voice input"
        className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-50 inline-flex h-16 w-16 items-center justify-center rounded-full border bg-gradient-to-br from-emerald-50 to-white shadow-lg transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:from-slate-800 dark:to-slate-900 dark:border-slate-600 ${
          isListening
            ? "border-emerald-600 text-emerald-700 dark:text-emerald-300 animate-pulse"
            : "border-emerald-200 text-emerald-800 hover:shadow-emerald-200 hover:shadow-xl dark:text-slate-100"
        }`}
        title="Start voice input"
      >
        <span className="text-2xl" role="img" aria-hidden="true">
          🎤
        </span>
      </button>
    </div>
  );
}

export default App;
