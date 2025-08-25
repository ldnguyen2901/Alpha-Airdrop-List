// Firebase initialization and Firestore helpers
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
const auth = getAuth(app);

export async function ensureAnonymousLogin() {
  const current = auth.currentUser;
  if (current) return current;
  const cred = await signInAnonymously(auth);
  return cred.user;
}

function workspaceDocRef(workspaceId) {
  return doc(db, 'workspaces', workspaceId);
}

export async function saveWorkspaceData(workspaceId, rows) {
  if (!workspaceId) throw new Error('workspaceId is required');
  await setDoc(
    workspaceDocRef(workspaceId),
    {
      rows,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function loadWorkspaceDataOnce(workspaceId) {
  if (!workspaceId) throw new Error('workspaceId is required');
  const snap = await getDoc(workspaceDocRef(workspaceId));
  return snap.exists() ? snap.data().rows || [] : [];
}

export function subscribeWorkspace(workspaceId, callback) {
  if (!workspaceId) return () => {};
  return onSnapshot(workspaceDocRef(workspaceId), (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      callback(Array.isArray(data.rows) ? data.rows : []);
    }
  });
}

// Save token logo to database
export async function saveTokenLogoToDatabase(tokenId, tokenInfo) {
  if (!tokenId || !tokenInfo) return;
  
  try {
    const tokenDocRef = doc(db, 'tokenLogos', tokenId);
    await setDoc(tokenDocRef, {
      logo: tokenInfo.logo || '',
      symbol: tokenInfo.symbol || '',
      name: tokenInfo.name || '',
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving token logo to database:', error);
  }
}
