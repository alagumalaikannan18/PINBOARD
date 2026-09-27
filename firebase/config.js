// =========================================================================
// PINBOARD — Centralized Single Firebase App & Services Initialization
// =========================================================================
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDHLC8Pe7GxZRzRTZNwurp-4RmFgTTC3TA",
  authDomain: "pinboard-91f4f.firebaseapp.com",
  projectId: "pinboard-91f4f",
  storageBucket: "pinboard-91f4f.firebasestorage.app",
  messagingSenderId: "725291797208",
  appId: "1:725291797208:web:05a2f8204778272cdae5ad",
  measurementId: "G-ZB7WK1V5H4"
};

// Guarantee Single Firebase App Initialization Across All Pages & Modules
let app;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (err) {
    console.warn("[PINBOARD Firebase] App initialization warning:", err);
    app = getApps()[0];
  }
} else {
  app = getApp();
}

let auth = null;
let db = null;
let storage = null;
let googleProvider = null;

try {
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: "select_account" });
} catch (e) {
  console.warn("[PINBOARD Firebase] Auth init warning:", e);
}

try {
  db = getFirestore(app);
} catch (e) {
  console.warn("[PINBOARD Firebase] Firestore init warning:", e);
}

try {
  storage = getStorage(app);
} catch (e) {
  console.warn("[PINBOARD Firebase] Storage init warning:", e);
}

export {
  app,
  auth,
  db,
  storage,
  googleProvider,
  setPersistence,
  browserLocalPersistence,
  firebaseConfig
};
