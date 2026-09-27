// =========================================================================
// PINBOARD — Firebase Configuration Proxy Module
// Re-exports from single centralized firebase/config.js and firebase/auth.js
// =========================================================================

import {
  app,
  auth,
  googleProvider,
  firebaseConfig
} from "../firebase/config.js";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence
} from "../firebase/auth.js";

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
  setPersistence,
  browserLocalPersistence,
  firebaseConfig
};
