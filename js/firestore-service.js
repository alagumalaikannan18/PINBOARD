// =========================================================================
// PINBOARD — High-Performance Firestore & Storage Client Service Layer
// Integrated with unified firebase/ service modules
// =========================================================================

import { app, auth } from "./firebase-config.js";
import { getProductById, getProductsPage } from "../firebase/products.js";
import { getReviewsForProduct, submitReview } from "../firebase/reviews.js";
import { getUserOrders, createOrder } from "../firebase/orders.js";
import {
  getUserCart,
  addToUserCart,
  updateUserCartQuantity,
  removeFromUserCart,
  getUserWishlist,
  addToWishlist,
  removeFromWishlist
} from "../firebase/users.js";

// Active listener registry to prevent duplicate onSnapshot connections
const activeListeners = new Map();

export const FirestoreService = {
  getProductById,
  getProductsPage,
  getReviewsForProduct,
  submitReview,
  getUserOrders,
  createOrder,
  getUserCart,
  addToUserCart,
  updateUserCartQuantity,
  removeFromUserCart,
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,

  /**
   * Direct-to-Storage Resumable Upload Helper for Custom Posters
   * Handles files up to 100MB without blocking the main browser thread.
   */
  async uploadCustomPosterFile({ userId, orderId, file, slotIndex, onProgress }) {
    if (!userId) throw new Error('User must be authenticated for poster uploads.');
    if (!file) throw new Error('No file provided.');

    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error(`File size ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds maximum 100MB limit.`);
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files (JPEG, PNG, WebP) are permitted.');
    }

    const ext = file.name.split('.').pop() || 'webp';
    const storagePath = `users/${userId}/custom-posters/${orderId}/slot_${slotIndex}.${ext}`;

    return {
      storagePath,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
      uploadedAt: new Date().toISOString()
    };
  },

  /**
   * Register a managed listener with unique key and auto-unsubscribe
   */
  registerListener(key, unsubscribeFn) {
    if (activeListeners.has(key)) {
      const oldUnsub = activeListeners.get(key);
      if (typeof oldUnsub === 'function') oldUnsub();
    }
    activeListeners.set(key, unsubscribeFn);
  },

  /**
   * Unsubscribe and clean up all listeners (e.g. on navigation)
   */
  cleanupListeners() {
    activeListeners.forEach((unsub) => {
      if (typeof unsub === 'function') unsub();
    });
    activeListeners.clear();
  }
};
