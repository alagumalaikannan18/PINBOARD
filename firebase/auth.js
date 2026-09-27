// =========================================================================
// PINBOARD — Firebase Authentication Service Module
// =========================================================================
import {
  auth,
  googleProvider
} from "./config.js";

import {
  onAuthStateChanged as fbOnAuthStateChanged,
  signInWithEmailAndPassword as fbSignInWithEmail,
  createUserWithEmailAndPassword as fbCreateUserWithEmail,
  signInWithPopup as fbSignInWithPopup,
  signOut as fbSignOut,
  updateProfile as fbUpdateProfile,
  sendPasswordResetEmail as fbSendPasswordResetEmail,
  setPersistence as fbSetPersistence,
  browserLocalPersistence as fbBrowserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

export async function ensureAuthPersistence() {
  if (auth && typeof fbSetPersistence === 'function' && fbBrowserLocalPersistence) {
    try {
      await fbSetPersistence(auth, fbBrowserLocalPersistence);
    } catch (e) {
      console.warn("[PINBOARD Firebase] setPersistence warning:", e);
    }
  }
}

export function getCurrentUser() {
  return auth ? auth.currentUser : null;
}

export function onAuthStateChanged(arg1, arg2) {
  var targetAuth = (arg1 && typeof arg1 === 'object' && arg1.app) ? arg1 : auth;
  var callback = typeof arg1 === 'function' ? arg1 : arg2;
  if (!targetAuth || typeof callback !== 'function') return () => {};
  return fbOnAuthStateChanged(targetAuth, callback);
}

export async function signInWithEmailAndPassword(arg1, arg2, arg3) {
  var targetAuth = (arg1 && typeof arg1 === 'object' && arg1.app) ? arg1 : auth;
  var email = typeof arg1 === 'string' ? arg1 : arg2;
  var password = typeof arg2 === 'string' && typeof arg1 !== 'string' ? arg2 : arg3;
  if (!targetAuth) throw new Error("Firebase Auth not initialized.");
  await ensureAuthPersistence();
  return fbSignInWithEmail(targetAuth, email, password);
}

export async function createUserWithEmailAndPassword(arg1, arg2, arg3) {
  var targetAuth = (arg1 && typeof arg1 === 'object' && arg1.app) ? arg1 : auth;
  var email = typeof arg1 === 'string' ? arg1 : arg2;
  var password = typeof arg2 === 'string' && typeof arg1 !== 'string' ? arg2 : arg3;
  if (!targetAuth) throw new Error("Firebase Auth not initialized.");
  await ensureAuthPersistence();
  return fbCreateUserWithEmail(targetAuth, email, password);
}

export async function signInWithGoogle(arg1) {
  var targetAuth = (arg1 && typeof arg1 === 'object' && arg1.app) ? arg1 : auth;
  if (!targetAuth || !googleProvider) throw new Error("Firebase Auth not initialized.");
  await ensureAuthPersistence();
  return fbSignInWithPopup(targetAuth, googleProvider);
}

export async function signOutUser(arg1) {
  var targetAuth = (arg1 && typeof arg1 === 'object' && arg1.app) ? arg1 : auth;
  if (!targetAuth) return;
  return fbSignOut(targetAuth);
}

export async function updateUserProfile(arg1, arg2) {
  var targetUser = (arg1 && arg1.uid) ? arg1 : (auth ? auth.currentUser : null);
  var profileData = (arg1 && arg1.uid) ? arg2 : arg1;
  if (!targetUser) throw new Error("No authenticated user.");
  return fbUpdateProfile(targetUser, profileData);
}

export async function sendPasswordReset(arg1, arg2) {
  var targetAuth = (arg1 && typeof arg1 === 'object' && arg1.app) ? arg1 : auth;
  var email = typeof arg1 === 'string' ? arg1 : arg2;
  if (!targetAuth) throw new Error("Firebase Auth not initialized.");
  return fbSendPasswordResetEmail(targetAuth, email);
}

export {
  auth,
  googleProvider,
  fbSignInWithPopup as signInWithPopup,
  fbSignOut as signOut,
  fbUpdateProfile as updateProfile,
  fbSendPasswordResetEmail as sendPasswordResetEmail,
  fbSetPersistence as setPersistence,
  fbBrowserLocalPersistence as browserLocalPersistence
};
