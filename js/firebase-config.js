// =========================================================================
// PINBOARD — Firebase Configuration & Initialization
// =========================================================================
// INSTRUCTIONS FOR SETUP:
// 1. Go to Firebase Console: https://console.firebase.google.com/
// 2. Select or create your project: "PINBOARD"
// 3. Under Project Settings -> General -> Your apps -> Web app (</>)
// 4. Copy your Firebase SDK configuration object and replace the placeholder
//    values below in 'firebaseConfig'.
// 5. In Firebase Console -> Authentication -> Sign-in method:
//    - Enable "Email/Password"
//    - Enable "Google"
// 6. In Authentication -> Settings -> Authorized domains:
//    - Ensure "localhost" is listed (and your custom domain if deployed).
// =========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// =========================================================================
// REPLACE WITH YOUR FIREBASE PROJECT CONFIGURATION
// =========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyDHLC8Pe7GxZRzRTZNwurp-4RmFgTTC3TA",
  authDomain: "pinboard-91f4f.firebaseapp.com",
  projectId: "pinboard-91f4f",
  storageBucket: "pinboard-91f4f.firebasestorage.app",
  messagingSenderId: "725291797208",
  appId: "1:725291797208:web:05a2f8204778272cdae5ad",
  measurementId: "G-ZB7WK1V5H4"
};

// Initialize Firebase App & Authentication Services
let app = null;
let auth = null;
let googleProvider = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  // Force account chooser prompt
  googleProvider.setCustomParameters({ prompt: "select_account" });
} catch (error) {
  console.warn("PINBOARD Firebase initialization:", error.message || error);
}

export {
  app,
  auth,
  googleProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  firebaseConfig
};
