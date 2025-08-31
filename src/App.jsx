import { useEffect, useRef, useState } from "react";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { db, auth } from "./utils/firebaseConfig.js";
import {
  loadListFromLocal,
  saveListToLocal,
  saveListToFirestore,
  loadLatestListFromFirestore,
  saveCurrentListDoc,
  addArchiveToLocal,
} from "./utils/storage.js";
import Navbar from "./components/Navbar.jsx";
import ShoppingList from "./components/ShoppingList.jsx";
import Suggestions from "./components/Suggestions.jsx";
import VoiceHud from "./components/VoiceHud.jsx";
import ToastStack from "./components/Toast.jsx";
import {
  generateSuggestions,
  suggestSubstitutesFor,
  acceptSuggestion,
  rejectSuggestion,
} from "./utils/suggestionEngine.js";
import { recordEvent } from "./utils/history.js";
import useSpeechRecognition from "./hooks/useSpeechRecognition";
import useSpeechSynthesis from "./hooks/useSpeechSynthesis";
import { isPlausibleItemName, toTitleCase as tc } from "./utils/validation.js";
// Lazy-load parser (and firebase/ai) only when needed to keep initial bundle small
import { parseFallback } from "./utils/fallbackParser.js";
// search is now encapsulated in SearchPane
import {
  addItem as addItemToList,
  incrementItemQuantity,
  decrementItemQuantity,
  deleteItemById,
  toggleItemBought,
} from "./utils/itemUtils.js";
import SearchPane from "./components/SearchPane.jsx";
import MicAccessBanner from "./components/MicAccessBanner.jsx";
import { checkMicPermission, requestMicAccess } from "./utils/permissions.js";
import { aiSuggest } from "./utils/aiSuggestions.js";

function App() {
  const searchPaneRef = useRef(null);
  // UI state + voice hook
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("");
  const [toasts, setToasts] = useState([]);
  const [lastIntent, setLastIntent] = useState({});
  const pushToast = (message, type = "success", ttl = 2500) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((cur) => [...cur, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((cur) => cur.filter((t) => t.id !== id));
    }, ttl);
  };
  const [items, setItems] = useState(() => {
    // Init from localStorage first
    const local = loadListFromLocal();
    return local && local.length
      ? local
      : [{ id: "sample-milk", name: "Milk", qty: 1 }];
  }); // {id, name, qty}
  const [lang, setLang] = useState("en-US");
  const [fbOk, setFbOk] = useState(null); // null=unknown, true/false
  const [showFbPanel, setShowFbPanel] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [micPermission, setMicPermission] = useState("unknown"); // 'granted' | 'denied' | 'prompt' | 'unknown' | 'unavailable'
  const [showMicBanner, setShowMicBanner] = useState(false);
  // Search state moved to SearchPane component
  // Keep latest items in a ref to avoid useEffect dependency loops
  const itemsRef = useRef([]);
  const lastTranscriptRef = useRef("");
  const { transcript, interim, listening, startListening, supported } =
    useSpeechRecognition(lang);
  const { speak: speakOut } = useSpeechSynthesis();

  const languages = [
    { code: "en-US", label: "English" },
    { code: "hi-IN", label: "Hindi" },
    { code: "es-ES", label: "Spanish" },
    { code: "ja-JP", label: "Japanese" },
  ];

  const handleMicClick = () => {
    console.log("mic clicked");
    if (!supported) {
      setStatus("Speech not supported in this browser");
      pushToast("Speech not supported in this browser", "error");
      return;
    }
    // First ensure mic permission via getUserMedia (required on many mobiles)
    const askAndStart = async () => {
      try {
        if (micPermission !== "granted") {
          await requestMicAccess();
          setMicPermission("granted");
        }
      } catch (e) {
        const msg = e?.message || "Microphone permission denied";
        setStatus(msg);
        pushToast(msg, "error");
        setMicPermission("denied");
        setShowMicBanner(true);
        return;
      }
      const started = startListening();
      if (started) {
        setIsListening(true);
        setStatus("Listening…");
      }
    };
    askAndStart();
  };

  // After mic stops (listening false), process the last transcript once
  useEffect(() => {
    if (listening) return; // wait until mic stops
    if (!transcript) return;
    if (transcript === lastTranscriptRef.current) return; // avoid reprocessing
    lastTranscriptRef.current = transcript;
    const cleaned = transcript.trim();
    if (!cleaned) return;

    let cancelled = false;
    const run = async () => {
      try {
        setStatus("Parsing…");
        // Dynamic import so firebase/ai is code-split
        const { parseWithGemini } = await import("./utils/parseWithGemini.js");
        const parsed = await parseWithGemini(cleaned, lang);
        if (cancelled) return;

        // If parseWithGemini for some reason returned null action or empty item,
        // let the shared fallback parser handle it instead.
        const { action, item, quantity, normalized_item } =
          parsed && parsed.item ? parsed : parseFallback(cleaned, lang);

        // If a search-like phrase was misclassified as 'add', coerce to 'search'.
        const lowerClean = cleaned.toLowerCase();
        const looksLikeSearch =
          /(find|search|show|look for|under|below|less than|between|brand|size|ml|\bl\b|\bg\b|\bkg\b|organic|recommend|suggest|alternative|instead of)/i.test(
            lowerClean
          ) || /(खोजो|खोजें)/.test(lowerClean);
        let act = action;
        if (act === "add" && looksLikeSearch) act = "search";

        const canonical = (normalized_item || "").trim().toLowerCase();
        const display = tc(canonical);
        const qty = Math.max(1, Number(quantity || 1));

        setLastIntent({ action: act, item: display, quantity: qty });

        // Soft validation to prevent random phrases being added
        if (!canonical || !act || !isPlausibleItemName(canonical)) {
          setStatus(`Heard: ${cleaned}`);
          return;
        }

        if (act === "remove") {
          // Clear search UI if we were showing any previous search
          searchPaneRef.current?.clear?.();
          setItems((prev) => {
            const idx = prev.findIndex(
              (it) => it.name.toLowerCase() === canonical
            );
            if (idx >= 0) {
              const existing = prev[idx];
              const removeQty = Math.max(1, Math.min(qty, existing.qty || 1));
              // If removing less than current qty, just decrement
              if ((existing.qty || 1) > removeQty) {
                const next = [...prev];
                next[idx] = {
                  ...existing,
                  qty: (existing.qty || 1) - removeQty,
                };
                setStatus(
                  `Removed: ${removeQty > 1 ? removeQty + " × " : ""}${display}`
                );
                pushToast(`Removed ${removeQty} ${display}`, "success");
                recordEvent("remove", display, removeQty);
                return next;
              }

              // Otherwise remove the item entirely
              setStatus(`Removed: ${display}`);
              pushToast(`Removed ${existing.name} from your list`, "success");
              recordEvent("remove", existing.name, existing.qty || 1);
              // Suggest substitutes when an item is completely removed
              const subs = suggestSubstitutesFor(existing.name, prev);
              if (subs.length) {
                setSmartSuggestions((cur) => mergeSuggestions(cur, subs));
              }
              return prev.filter((it) => it.id !== existing.id);
            }
            setStatus(`Not found: ${display}`);
            pushToast(`${display} is not in your list`, "info");
            return prev;
          });
        } else if (act === "add") {
          // Clear search UI when switching context to list modification
          searchPaneRef.current?.clear?.();
          setItems((prev) => {
            const idx = prev.findIndex(
              (it) => it.name.toLowerCase() === canonical
            );
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = { ...next[idx], qty: next[idx].qty + qty };
              setStatus(`Added: ${qty > 1 ? qty + " × " : ""}${display}`);
              pushToast(`Added ${qty} ${display} to your list`, "success");
              recordEvent("add", display, qty);
              return next;
            }
            const id = `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 8)}`;
            setStatus(`Added: ${qty > 1 ? qty + " × " : ""}${display}`);
            pushToast(`Added ${qty} ${display} to your list`, "success");
            recordEvent("add", display, qty);
            return [...prev, { id, name: display, qty }];
          });
        } else if (act === "search") {
          // voice query intents for suggestions
          const lower = (item || "").toLowerCase();
          if (/what do you suggest|suggest.*today|recommend/.test(lower)) {
            let s = [];
            try {
              s = await aiSuggest({ currentItems: itemsRef.current });
            } catch (e) {
              console.warn("AI suggestions failed in voice flow", e?.message);
            }
            if (!s || !s.length) {
              s = generateSuggestions({ currentItems: itemsRef.current });
            }
            setSmartSuggestions((s || []).slice(0, 4));
            setStatus("Here are some suggestions for today.");
            pushToast("Suggestions updated", "info");
            // Clear search UI when moving to suggestions view
            searchPaneRef.current?.clear?.();
          } else if (/alternative|substitute|instead of/.test(lower)) {
            const targetRaw =
              extractTargetFromQuery(cleaned) ||
              canonical ||
              itemsRef.current[0]?.name ||
              "";
            const target = tc(String(targetRaw).toLowerCase());
            const s = target
              ? suggestSubstitutesFor(target, itemsRef.current)
              : [];
            setSmartSuggestions(s);
            setStatus("Here are some alternatives.");
            pushToast(`Alternatives for ${target}`, "info");
            // Clear search UI when showing alternatives
            searchPaneRef.current?.clear?.();
          } else {
            // Route search into the SearchPane so results appear in the same area
            searchPaneRef.current?.runSearch?.(cleaned);
            setStatus(`Search: ${display}`);
          }
        } else {
          setStatus(`Heard: ${cleaned}`);
          // For unrelated commands, clear any lingering search state
          searchPaneRef.current?.clear?.();
        }
      } finally {
        if (!cancelled) setIsListening(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [transcript, lang, listening]);

  // Ensure we are authenticated (anon), check Firestore, and try to hydrate from latest cloud snapshot
  useEffect(() => {
    if (!db) {
      setFbOk(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          await signInAnonymously(auth);
        }
        if (db) {
          const { collection, getDocs, limit, query } = await import(
            "firebase/firestore"
          );
          const q = query(collection(db, "healthcheck"), limit(1));
          await getDocs(q);
        }
        setFbOk(true);
        // Optionally hydrate from Firestore if local is empty or very small
        try {
          const local = loadListFromLocal();
          if (!local || local.length <= 1) {
            const latest = await loadLatestListFromFirestore();
            if (Array.isArray(latest) && latest.length) {
              setItems(latest);
              saveListToLocal(latest);
            }
          }
        } catch (e) {
          console.warn("Could not load latest list from Firestore", e);
        }
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

  // Check mic permission on mount to show proactive banner on mobile
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const state = await checkMicPermission();
      if (cancelled) return;
      setMicPermission(state);
      // Show banner if we are likely to prompt or have been denied
      setShowMicBanner(
        state === "prompt" || state === "denied" || state === "unknown"
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  // New List: archive current and clear
  const startNewList = async () => {
    try {
      // archive locally
      const archived = addArchiveToLocal({
        items,
        meta: { reason: "archive" },
      });
      // archive in Firestore as a snapshot with reason
      try {
        await saveListToFirestore(items, {
          reason: "archive",
          archivedId: archived.id,
        });
      } catch (e) {
        console.warn("Cloud archive failed", e?.message);
      }
      // clear UI list
      setItems([]);
      saveListToLocal([]);
      await saveCurrentListDoc([]);
      setStatus("Started a new list.");
      pushToast("New list created", "info");
    } catch {
      pushToast("Could not start a new list", "error");
    }
  };

  // List handlers
  const addItem = (name) => {
    setItems((prev) => addItemToList(prev, name, 1));
    pushToast(`Added ${name}`, "success");
  };
  const toggleBought = (id) => {
    setItems((prev) => {
      const next = toggleItemBought(prev, id);
      // find which item changed to bought
      const before = prev.find((i) => i.id === id);
      const after = next.find((i) => i.id === id);
      if (before && after && !before.bought && after.bought) {
        // mark as bought event
        recordEvent("bought", after.name, after.qty || 1);
      }
      return next;
    });
  };
  const incQty = (id) => {
    setItems((prev) => incrementItemQuantity(prev, id));
  };
  const decQty = (id) => {
    setItems((prev) => decrementItemQuantity(prev, id));
  };

  // Persist items to localStorage always, and to Firestore throttled per change burst
  useEffect(() => {
    saveListToLocal(items);
    itemsRef.current = items; // keep latest snapshot for voice logic
    // update suggestions: try AI first, then heuristic fallback
    (async () => {
      try {
        const ai = await aiSuggest({ currentItems: items });
        if (Array.isArray(ai) && ai.length) {
          setSmartSuggestions(ai.slice(0, 4));
          return;
        }
      } catch (e) {
        console.warn("AI suggestions failed, using local engine", e?.message);
      }
      setSmartSuggestions(
        generateSuggestions({ currentItems: items }).slice(0, 4)
      );
    })();
    // Firestore: write a history snapshot and also maintain a current doc (best-effort)
    const doCloud = async () => {
      try {
        if (!auth.currentUser) await signInAnonymously(auth);
        // lightweight safety: skip writing only the initial sample item
        const nonSample = items.filter(
          (i) => !String(i.id).startsWith("sample-")
        );
        await Promise.all([
          saveListToFirestore(nonSample.length ? nonSample : items, {
            reason: "autosave",
          }),
          saveCurrentListDoc(items),
        ]);
      } catch (e) {
        // non-fatal
        console.warn("Cloud save failed", e);
      }
    };

    // debounce cloud writes to avoid flooding
    const t = setTimeout(doCloud, 800);
    return () => clearTimeout(t);
  }, [items]);

  const runFirestoreCheck = async () => {
    setStatus("Checking Firestore…");
    try {
      if (!db) throw new Error("Firestore disabled");
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      const { collection, getDocs, limit, query } = await import(
        "firebase/firestore"
      );
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
    <div
      className="min-h-screen bg-gradient-to-b from-emerald-50 to-white text-gray-900 dark:from-slate-900 dark:to-slate-950 dark:text-slate-100"
      style={{ width: "100%" }}
    >
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
      <main className="mx-auto max-w-6xl px-4 py-8 pb-28">
        <MicAccessBanner
          visible={showMicBanner}
          onEnable={async () => {
            try {
              await requestMicAccess();
              setMicPermission("granted");
              setShowMicBanner(false);
              pushToast("Microphone enabled", "success");
            } catch (e) {
              const msg = e?.message || "Microphone permission denied";
              setMicPermission("denied");
              pushToast(msg, "error");
            }
          }}
          onDismiss={() => setShowMicBanner(false)}
        />
        {/* beginner: unnecessary wrapper */}
        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
          id="main-grid"
        >
          {/* Left: Search + Voice + (Mobile List first) + Suggestions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product search */}
            <SearchPane
              ref={searchPaneRef}
              onAddToList={(prod) => {
                const pretty = `${prod.brand} ${prod.name} ${prod.size}`.trim();
                setItems((prev) => addItemToList(prev, pretty, 1));
                setStatus(`Added: ${pretty}`);
                pushToast(`Added ${pretty}`, "success");
                speakOut(`Added ${prod.name}`);
              }}
              speakOut={speakOut}
              onStatus={(msg) => setStatus(msg)}
            />

            {/* Voice HUD + status */}
            <div className="space-y-2">
              <VoiceHud
                listening={listening || isListening}
                interim={interim}
                finalText={transcript}
                intent={lastIntent}
                lang={lang}
              />
              <div className="rounded-xl p-3 border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                <p className="text-sm text-gray-800 dark:text-slate-200">
                  {status ? status : "Status: Idle"}
                </p>
              </div>
            </div>

            {/* Mobile: Shopping list appears here (before suggestions) */}
            <div className="lg:hidden">
              <ShoppingList
                items={items}
                onInc={incQty}
                onDec={decQty}
                onDelete={(id) => {
                  const victim = items.find((i) => i.id === id);
                  setItems((prev) => deleteItemById(prev, id));
                  if (victim) {
                    recordEvent("remove", victim.name, victim.qty || 1);
                    const subs = suggestSubstitutesFor(victim.name, items);
                    if (subs.length) {
                      setSmartSuggestions((cur) => mergeSuggestions(cur, subs));
                    }
                  }
                }}
                onToggleBought={toggleBought}
              />
            </div>

            {/* Suggestions */}
            <Suggestions
              suggestions={smartSuggestions.slice(0, 4)}
              onAdd={(name) => {
                addItem(name);
                acceptSuggestion(name);
                setStatus(`Added: ${name}`);
                pushToast(`Added ${name}`, "success");
              }}
              onDismiss={(name) => {
                rejectSuggestion(name);
                setSmartSuggestions((cur) =>
                  cur.filter((s) => (s.item || s) !== name)
                );
              }}
            />
          </div>

          {/* Right: Shopping list (desktop only) */}
          <div className="lg:col-span-1 hidden lg:block">
            <ShoppingList
              items={items}
              onInc={incQty}
              onDec={decQty}
              onDelete={(id) => {
                // capture name for substitute suggestions
                const victim = items.find((i) => i.id === id);
                setItems((prev) => deleteItemById(prev, id));
                if (victim) {
                  recordEvent("remove", victim.name, victim.qty || 1);
                  const subs = suggestSubstitutesFor(victim.name, items);
                  if (subs.length) {
                    setSmartSuggestions((cur) => mergeSuggestions(cur, subs));
                  }
                }
              }}
              onToggleBought={toggleBought}
            />
          </div>
        </div>
      </main>

      {/* Floating Mic Button (bottom-right) */}
      {/* Floating New List Button (bottom-left) */}
      <button
        type="button"
        onClick={startNewList}
        aria-label="Start a new list"
        className="fixed bottom-6 left-6 z-50 inline-flex items-center justify-center rounded-full border bg-gradient-to-br from-emerald-50 to-white shadow-lg transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:from-slate-800 dark:to-slate-900 dark:border-slate-600 border-emerald-200 text-emerald-800 hover:shadow-emerald-200 hover:shadow-xl dark:text-slate-100 px-4 py-2 text-sm sm:text-base"
        title="Start a new list"
      >
        New List
      </button>

      {/* Floating Mic Button (bottom-right) */}
      <button
        type="button"
        onClick={handleMicClick}
        aria-pressed={listening || isListening}
        aria-label="Start voice input"
        className={`fixed bottom-6 right-6 z-50 inline-flex h-16 w-16 items-center justify-center rounded-full border bg-gradient-to-br from-emerald-50 to-white shadow-lg transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:from-slate-800 dark:to-slate-900 dark:border-slate-600 ${
          listening || isListening
            ? "border-emerald-600 text-emerald-700 dark:text-emerald-300 animate-pulse"
            : "border-emerald-200 text-emerald-800 hover:shadow-emerald-200 hover:shadow-xl dark:text-slate-100"
        }`}
        title="Start voice input"
      >
        <span className="text-2xl" role="img" aria-hidden="true">
          🎤
        </span>
      </button>

      {/* Toasts */}
      <ToastStack
        toasts={toasts}
        onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))}
      />
    </div>
  );
}

export default App;

// Helpers

function mergeSuggestions(current, extra) {
  const map = new Map();
  for (const s of current || []) map.set((s.item || s).toLowerCase(), s);
  for (const s of extra || []) {
    const key = (s.item || s).toLowerCase();
    const prev = map.get(key);
    if (!prev || (s.score || 0) > (prev.score || 0)) map.set(key, s);
  }
  return Array.from(map.values()).slice(0, 10);
}

function extractTargetFromQuery(q) {
  if (!q) return "";
  const lower = q.toLowerCase();
  let m = lower.match(/instead of\s+([\p{L}\s-]+)$/u);
  if (m && m[1]) return m[1].trim();
  m = lower.match(/for\s+([\p{L}\s-]+)$/u); // e.g., alternatives for eggs
  if (m && m[1]) return m[1].trim();
  // remove common leading terms like 'any', 'some'
  return lower.replace(/^(any|some)\s+/u, "").trim();
}
