import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { getFirestore, collection, doc, getDocs, onSnapshot, query, setDoc, deleteDoc } from 'firebase/firestore'

const firebaseConfig = {
  
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export function initFirebase() {
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = getFirestore(app)
  return { app, auth, db }
}

export async function ensureAnonAuth(auth) {
  const existing = auth.currentUser
  if (existing) return existing
  await signInAnonymously(auth)
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (u) => { if (u) { unsub(); resolve(u) } })
  })
}

export function userItemsRef(db, uid) { return collection(db, 'users', uid, 'items') }
export function userHistoryRef(db, uid) { return collection(db, 'users', uid, 'history') }

export function subscribeItems(db, uid, onChange, onError) {
  const q = query(userItemsRef(db, uid))
  return onSnapshot(q, (snap) => {
    const list = []
    snap.forEach((d) => list.push(d.data()))
    onChange(list)
  }, (err) => onError?.(err))
}

export async function pushItem(db, uid, item) {
  const ref = doc(userItemsRef(db, uid), item.id)
  await setDoc(ref, item, { merge: true })
}
export async function removeItem(db, uid, id) {
  const ref = doc(userItemsRef(db, uid), id)
  await deleteDoc(ref)
}

export async function loadHistory(db, uid) {
  const snap = await getDocs(userHistoryRef(db, uid))
  const map = {}
  snap.forEach((d) => { map[d.id] = d.data() })
  return map
}
export async function pushHistory(db, uid, key, value) {
  const ref = doc(userHistoryRef(db, uid), key)
  await setDoc(ref, value, { merge: true })
}
