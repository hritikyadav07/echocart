// Storage utilities: localStorage + Firestore sync for shopping list
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, auth } from "./firebaseConfig.js";

const LS_KEY = "echocart:list";
const COLLECTION = "shoppingHistory"; // exact name as requested

// LocalStorage helpers
export function loadListFromLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

export function saveListToLocal(items) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items || []));
  } catch {
    // ignore quota errors
  }
}

// Firestore helpers
// Contract: writes a snapshot document of the current list. Each write creates a new history entry.
// Document shape: { uid, items: [{id,name,qty}], createdAt }
export async function saveListToFirestore(items, meta = {}) {
  if (!db) return;
  // Ensure user
  const user = auth.currentUser;
  const uid = user?.uid || "anon";
  const payload = {
    uid,
    items: (items || []).map((it) => ({
      id: it.id,
      name: it.name,
      qty: it.qty,
      bought: Boolean(it.bought) || false,
    })),
    createdAt: serverTimestamp(),
    ...meta,
  };
  try {
    const ref = await addDoc(collection(db, COLLECTION), payload);
    // Optional trace
    console.log("[Firestore] Wrote snapshot", {
      id: ref.id,
      uid,
      count: payload.items.length,
    });
  } catch (e) {
    console.error("[Firestore] write failed", e);
    throw e;
  }
}

// Load most-recent list snapshot for the current user from history
export async function loadLatestListFromFirestore() {
  if (!db) return null;
  const user = auth.currentUser;
  const uid = user?.uid || "anon";

  const q = query(
    collection(db, COLLECTION),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const doc0 = snap.docs[0].data();
  return Array.isArray(doc0.items) ? doc0.items : null;
}

// Optional: allow upserting a stable doc per user for "current" list if needed later
export async function saveCurrentListDoc(items) {
  if (!db) return;
  const uid = auth.currentUser?.uid || "anon";
  const ref = doc(collection(db, `${COLLECTION} current`), uid);
  await setDoc(
    ref,
    {
      uid,
      items: (items || []).map((it) => ({
        id: it.id,
        name: it.name,
        qty: it.qty,
        bought: Boolean(it.bought) || false,
      })),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export default {
  loadListFromLocal,
  saveListToLocal,
  saveListToFirestore,
  loadLatestListFromFirestore,
  saveCurrentListDoc,
};
