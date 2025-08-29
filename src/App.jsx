import { useEffect, useMemo, useRef, useState } from "react";
import { isSpeechSupported } from "./lib/speech.js";
import { parseCommand } from "./lib/parser.js";
import { guessCategory, capitalize } from "./lib/utils.js";
import { LanguageSelect } from "./components/LanguageSelect.jsx";
import { StatusBar } from "./components/StatusBar.jsx";
import { CategoryList } from "./components/CategoryList.jsx";
import { EmptyState } from "./components/EmptyState.jsx";
import { MicButton } from "./components/MicButton.jsx";
import { MicIcon } from "./components/MicIcon.jsx";
import { SpeechWire } from "./components/SpeechWire.jsx";
import { UnsupportedBanner } from "./components/UnsupportedBanner.jsx";
import { Suggestions } from "./components/Suggestions.jsx";
import { buildSuggestions } from "./lib/suggestions.js";
// Removed default Vite CSS that was centering the whole app and adding extra padding
// import "./App.css";
import {
  initFirebase,
  ensureAnonAuth,
  subscribeItems,
  pushItem,
  removeItem as fbRemoveItem,
  loadHistory as fbLoadHistory,
  pushHistory as fbPushHistory,
} from "./lib/firebase.js";

const initialItems = [
  { id: "1", name: "Milk", quantity: 1, category: "dairy" },
  { id: "2", name: "Apple", quantity: 4, category: "produce" },
  { id: "3", name: "Chips", quantity: 2, category: "snacks" },
];

export default function App() {
  const [list, setList] = useState(() => {
    try {
      const raw = localStorage.getItem("echocart.items");
      if (raw) return JSON.parse(raw);
    } catch {}
    return initialItems;
  });
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState(() => {
    try {
      const raw = localStorage.getItem("echocart.lang");
      if (raw) return raw;
    } catch {}
    return "en-US";
  });
  const speechRef = useRef(null);
  const [history, setHistory] = useState(() => {
    try {
      const raw = localStorage.getItem("echocart.history");
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  });
  const [cloudEnabled, setCloudEnabled] = useState(() => {
    try {
      return localStorage.getItem("echocart.cloud") === "1";
    } catch {
      return false;
    }
  });
  const cloudRef = useRef(null);
  const [cloudError, setCloudError] = useState(null);

  const grouped = useMemo(() => {
    return list.reduce((acc, it) => {
      acc[it.category] ||= [];
      acc[it.category].push(it);
      return acc;
    }, {});
  }, [list]);

  useEffect(() => {
    try {
      localStorage.setItem("echocart.items", JSON.stringify(list));
    } catch {}
  }, [list]);
  useEffect(() => {
    try {
      localStorage.setItem("echocart.lang", language);
    } catch {}
  }, [language]);
  useEffect(() => {
    try {
      localStorage.setItem("echocart.history", JSON.stringify(history));
    } catch {}
  }, [history]);
  useEffect(() => {
    try {
      localStorage.setItem("echocart.cloud", cloudEnabled ? "1" : "0");
    } catch {}
  }, [cloudEnabled]);

  useEffect(() => {
    if (!cloudEnabled) return;
    const { auth, db } = initFirebase();
    let unsub;
    ensureAnonAuth(auth).then(async (user) => {
      cloudRef.current = { uid: user.uid, db };
      try {
        const remoteHistory = await fbLoadHistory(db, user.uid);
        if (Object.keys(remoteHistory).length)
          setHistory((h) => ({ ...remoteHistory, ...h }));
        setCloudError(null);
      } catch (e) {
        setCloudError(e?.message || "Cloud history load failed");
      }
      unsub = subscribeItems(
        db,
        user.uid,
        (items) => {
          setList((prev) => {
            const byId = new Map(prev.map((i) => [i.id, i]));
            for (const it of items) byId.set(it.id, it);
            return Array.from(byId.values());
          });
        },
        (err) => setCloudError(err?.message || "Cloud subscribe failed")
      );
    });
    return () => {
      if (unsub) unsub();
    };
  }, [cloudEnabled]);

  function handleFinal(text) {
    const parsed = parseCommand(text);
    if (parsed.intent === "add" && parsed.item) {
      const itemName = parsed.item;
      setList((prev) => {
        const idx = prev.findIndex(
          (i) => i.name.toLowerCase() === itemName.toLowerCase()
        );
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            quantity: Math.max(1, updated[idx].quantity + parsed.quantity),
          };
          if (cloudRef.current) {
            const { db, uid } = cloudRef.current;
            pushItem(db, uid, updated[idx])
              .then(() => setCloudError(null))
              .catch((e) => setCloudError(e?.message || "Cloud write failed"));
          }
          return updated;
        }
        const id = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
        const updated = [
          ...prev,
          {
            id,
            name: capitalize(itemName),
            quantity: parsed.quantity,
            category: guessCategory(itemName),
          },
        ];
        if (cloudRef.current) {
          const { db, uid } = cloudRef.current;
          pushItem(db, uid, updated[updated.length - 1])
            .then(() => setCloudError(null))
            .catch((e) => setCloudError(e?.message || "Cloud write failed"));
        }
        return updated;
      });
      setHistory((h) => {
        const key = itemName.toLowerCase();
        const cur = h[key];
        const now = Date.now();
        const next = {
          ...h,
          [key]: { count: (cur?.count ?? 0) + 1, lastAddedAt: now },
        };
        if (cloudRef.current) {
          const { db, uid } = cloudRef.current;
          fbPushHistory(db, uid, key, next[key])
            .then(() => setCloudError(null))
            .catch((e) => setCloudError(e?.message || "Cloud write failed"));
        }
        return next;
      });
    } else if (parsed.intent === "remove" && parsed.item) {
      const itemName = parsed.item;
      setList((prev) => {
        const updated = prev.filter(
          (i) => i.name.toLowerCase() !== itemName.toLowerCase()
        );
        if (cloudRef.current) {
          const { db, uid } = cloudRef.current;
          const found = prev.find(
            (i) => i.name.toLowerCase() === itemName.toLowerCase()
          );
          if (found)
            fbRemoveItem(db, uid, found.id)
              .then(() => setCloudError(null))
              .catch((e) => setCloudError(e?.message || "Cloud delete failed"));
        }
        return updated;
      });
    }
  }

  function toggleDone(id) {
    setList((prev) => {
      const updated = prev.map((i) =>
        i.id === id ? { ...i, done: !i.done } : i
      );
      if (cloudRef.current) {
        const { db, uid } = cloudRef.current;
        const item = updated.find((i) => i.id === id);
        if (item)
          pushItem(db, uid, item)
            .then(() => setCloudError(null))
            .catch((e) => setCloudError(e?.message || "Cloud write failed"));
      }
      return updated;
    });
  }
  function incQty(id) {
    setList((prev) => {
      const updated = prev.map((i) =>
        i.id === id ? { ...i, quantity: i.quantity + 1 } : i
      );
      if (cloudRef.current) {
        const { db, uid } = cloudRef.current;
        const item = updated.find((i) => i.id === id);
        if (item)
          pushItem(db, uid, item)
            .then(() => setCloudError(null))
            .catch((e) => setCloudError(e?.message || "Cloud write failed"));
      }
      return updated;
    });
  }
  function decQty(id) {
    setList((prev) => {
      const updated = prev.map((i) =>
        i.id === id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i
      );
      if (cloudRef.current) {
        const { db, uid } = cloudRef.current;
        const item = updated.find((i) => i.id === id);
        if (item)
          pushItem(db, uid, item)
            .then(() => setCloudError(null))
            .catch((e) => setCloudError(e?.message || "Cloud write failed"));
      }
      return updated;
    });
  }
  function deleteItem(id) {
    setList((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      if (cloudRef.current) {
        const { db, uid } = cloudRef.current;
        fbRemoveItem(db, uid, id)
          .then(() => setCloudError(null))
          .catch((e) => setCloudError(e?.message || "Cloud delete failed"));
      }
      return updated;
    });
  }

  const suggestionNames = useMemo(() => {
    const names = list.map((i) => i.name);
    return buildSuggestions(names, history, new Date(), 6);
  }, [list, history]);
  function addByName(name) {
    const itemName = name;
    setList((prev) => {
      const idx = prev.findIndex(
        (i) => i.name.toLowerCase() === itemName.toLowerCase()
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      const id = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
      return [
        ...prev,
        {
          id,
          name: capitalize(itemName),
          quantity: 1,
          category: guessCategory(itemName),
        },
      ];
    });
    setHistory((h) => {
      const key = itemName.toLowerCase();
      const cur = h[key];
      const now = Date.now();
      return {
        ...h,
        [key]: { count: (cur?.count ?? 0) + 1, lastAddedAt: now },
      };
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {!isSpeechSupported() && <UnsupportedBanner />}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b ">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-emerald-500" aria-hidden />
            <h1 className="text-xl sm:text-3xl font-semibold my-0">EchoCart</h1>
          </div>
          <LanguageSelect value={language} onChange={(v) => setLanguage(v)} />
          <button
            className={`ml-3 text-xs rounded-full px-3 py-2 border ${
              cloudEnabled
                ? "border-emerald-500 text-emerald-700"
                : "border-gray-300 text-gray-600"
            }`}
            onClick={() => setCloudEnabled((v) => !v)}
            title="Toggle cloud sync"
          >
            {cloudEnabled ? "Cloud: On" : "Cloud: Off"}
          </button>
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
        <StatusBar listening={listening} transcript={transcript} />
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <section className="space-y-6">
          <h2 className="text-base font-semibold text-gray-800">Your List</h2>
          {cloudEnabled && cloudError && (
            <div className="text-sm rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2">
              Cloud error: {cloudError}
            </div>
          )}
          <Suggestions items={suggestionNames} onAdd={addByName} />
          {Object.keys(grouped).length === 0 ? (
            <EmptyState />
          ) : (
            <CategoryList
              grouped={grouped}
              onToggleDone={toggleDone}
              onInc={incQty}
              onDec={decQty}
              onDelete={deleteItem}
            />
          )}
        </section>
      </main>

      <MicButton
        listening={listening}
        onToggle={() => {
          if (!speechRef.current || !speechRef.current.isSupported) return;
          if (listening) {
            const t = transcript.trim();
            if (t) handleFinal(t);
            speechRef.current.stop();
            setListening(false);
          } else {
            setTranscript("");
            speechRef.current.start();
            setListening(true);
          }
        }}
      />

      <SpeechWire
        language={language}
        onTranscript={setTranscript}
        onFinal={(text) => handleFinal(text)}
        onController={(c) => {
          speechRef.current = c;
        }}
      />
    </div>
  );
}
