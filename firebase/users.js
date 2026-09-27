// =========================================================================
// PINBOARD — Firebase Users, Cart & Wishlist Service Module
// User isolation: users/{uid}, users/{uid}/cart/{productId}, users/{uid}/wishlist/{productId}
// =========================================================================
import { db } from "./config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// --- Profile Operations ---
export async function getUserProfile(userId) {
  if (!userId || !db) return null;
  try {
    const snap = await getDoc(doc(db, "users", userId));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn("[firebase/users] getUserProfile error:", e);
    return null;
  }
}

export async function updateUserProfileData(userId, profileData) {
  if (!userId || !db) return;
  const userRef = doc(db, "users", userId);
  const safeData = { ...profileData, updatedAt: serverTimestamp() };
  delete safeData.role;
  delete safeData.admin;
  delete safeData.isAdmin;
  await setDoc(userRef, safeData, { merge: true });
}

// --- Cart Operations (users/{userId}/cart/{productId}) ---
export async function getUserCart(userId) {
  if (!userId || !db) return [];
  try {
    const cartRef = collection(db, "users", userId, "cart");
    const snap = await getDocs(cartRef);
    return snap.docs.map(d => ({ productId: d.id, ...d.data() }));
  } catch (e) {
    console.warn("[firebase/users] getUserCart error:", e);
    return [];
  }
}

export async function addToUserCart(userId, productId, itemData) {
  if (!userId || !productId || !db) return;
  const pidStr = String(productId);
  const itemRef = doc(db, "users", userId, "cart", pidStr);
  const snap = await getDoc(itemRef);

  if (snap.exists()) {
    // Return flag if item is already in cart
    return { added: false, alreadyInCart: true };
  }

  await setDoc(itemRef, {
    productId: pidStr,
    title: itemData.title || `Poster #${pidStr}`,
    quantity: Math.max(1, parseInt(itemData.quantity, 10) || 1),
    price: Number(itemData.price) || 60,
    image: itemData.image || "poster/opt/1551192.webp",
    addedAt: serverTimestamp()
  });

  return { added: true, alreadyInCart: false };
}

export async function updateUserCartQuantity(userId, productId, quantity) {
  if (!userId || !productId || !db) return;
  const pidStr = String(productId);
  const itemRef = doc(db, "users", userId, "cart", pidStr);
  const qty = parseInt(quantity, 10);

  if (qty <= 0) {
    await deleteDoc(itemRef);
  } else {
    await updateDoc(itemRef, { quantity: qty, updatedAt: serverTimestamp() });
  }
}

export async function removeFromUserCart(userId, productId) {
  if (!userId || !productId || !db) return;
  await deleteDoc(doc(db, "users", userId, "cart", String(productId)));
}

// --- Wishlist Operations (users/{userId}/wishlist/{productId}) ---
export async function getUserWishlist(userId) {
  if (!userId || !db) return [];
  try {
    const wishRef = collection(db, "users", userId, "wishlist");
    const snap = await getDocs(wishRef);
    return snap.docs.map(d => d.id); // Returns array of product IDs
  } catch (e) {
    console.warn("[firebase/users] getUserWishlist error:", e);
    return [];
  }
}

export async function addToWishlist(userId, productId) {
  if (!userId || !productId || !db) return;
  const pidStr = String(productId);
  await setDoc(doc(db, "users", userId, "wishlist", pidStr), {
    productId: pidStr,
    addedAt: serverTimestamp()
  });
}

export async function removeFromWishlist(userId, productId) {
  if (!userId || !productId || !db) return;
  await deleteDoc(doc(db, "users", userId, "wishlist", String(productId)));
}
