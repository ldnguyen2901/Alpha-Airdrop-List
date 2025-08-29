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

// Check if Firebase config is properly set
const checkFirebaseConfig = () => {
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN', 
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('Missing Firebase environment variables:', missingVars);
    return false;
  }
  
  return true;
};

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

// Single workspace ID for all users
export const SHARED_WORKSPACE_ID = 'shared-workspace';

export async function ensureAnonymousLogin() {
  try {
    // Check if Firebase config is properly set
    if (!checkFirebaseConfig()) {
      throw new Error('Firebase configuration is incomplete');
    }
    
    const current = auth.currentUser;
    if (current) return current;
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (error) {
    console.error('Firebase authentication failed:', error);
    throw error;
  }
}

function workspaceDocRef(workspaceId) {
  return doc(db, 'workspaces', workspaceId);
}

// Helper function to remove undefined values from objects
const removeUndefinedValues = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedValues(item));
  }
  if (obj && typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedValues(value);
      } else {
        // Log undefined values for debugging
        console.warn(`Found undefined value for field: ${key}`, obj);
      }
    }
    return cleaned;
  }
  return obj;
};

export async function saveWorkspaceData(workspaceId, rows) {
  try {
    // Always use shared workspace ID
    const targetWorkspaceId = SHARED_WORKSPACE_ID;
    
    // Clean rows data by removing undefined values
    const cleanedRows = removeUndefinedValues(rows);
    
    const docData = {
      rows: cleanedRows,
      updatedAt: serverTimestamp(),
      lastUpdatedBy: workspaceId || 'anonymous', // Track who made the last update
    };
    
    await setDoc(
      workspaceDocRef(targetWorkspaceId),
      docData,
      { merge: true },
    );
  } catch (error) {
    console.error('Error saving workspace data:', error);
    throw error;
  }
}

export async function loadWorkspaceDataOnce(workspaceId) {
  // Always load from shared workspace
  const targetWorkspaceId = SHARED_WORKSPACE_ID;
  const snap = await getDoc(workspaceDocRef(targetWorkspaceId));
  return snap.exists() ? snap.data().rows || [] : [];
}

export function subscribeWorkspace(workspaceId, callback) {
  // Always subscribe to shared workspace
  const targetWorkspaceId = SHARED_WORKSPACE_ID;
  return onSnapshot(workspaceDocRef(targetWorkspaceId), (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      callback(Array.isArray(data.rows) ? data.rows : []);
    } else {
      // If shared workspace doesn't exist, return empty array
      callback([]);
    }
  });
}

// Save token logo to database
export async function saveTokenLogoToDatabase(tokenId, tokenInfo) {
  if (!tokenId || !tokenInfo) return;
  
  try {
    // Clean tokenInfo data by removing undefined values
    const cleanedTokenInfo = removeUndefinedValues(tokenInfo);
    
    const tokenDocRef = doc(db, 'tokenLogos', tokenId);
    await setDoc(tokenDocRef, {
      logo: cleanedTokenInfo.logo || '',
      symbol: cleanedTokenInfo.symbol || '',
      name: cleanedTokenInfo.name || '',
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving token logo to database:', error);
  }
}
