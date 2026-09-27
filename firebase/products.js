// =========================================================================
// PINBOARD — Firebase Products Service Module
// Optimized for zero-scan queries, canonical product model & low reads
// =========================================================================
import { db } from "./config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// In-Memory Client TTL Cache (5 min) to prevent repeated reads for product catalog
const productCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCached(key) {
  const item = productCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    productCache.delete(key);
    return null;
  }
  return item.value;
}

function setCached(key, value) {
  productCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function getProductById(productId) {
  const cacheKey = `product_${productId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // 1. Attempt Firestore direct document lookup if db available
  if (db) {
    try {
      const docRef = doc(db, "products", String(productId));
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setCached(cacheKey, data);
        return data;
      }
    } catch (e) {
      console.warn("[firebase/products] Firestore lookup notice:", e);
    }
  }

  // 2. Fallback to API endpoint
  try {
    const res = await fetch(`/api/products/${productId}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        setCached(cacheKey, json.data);
        return json.data;
      }
    }
  } catch (err) {
    console.warn("[firebase/products] API fallback notice:", err);
  }

  return null;
}

export async function getProductsPage({ category = null, collectionName = null, page = 1, pageSize = 20 } = {}) {
  const cacheKey = `products_cat_${category}_col_${collectionName}_p_${page}_sz_${pageSize}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (db) {
    try {
      const constraints = [where("isActive", "==", true)];
      if (category) constraints.push(where("category", "==", category));
      if (collectionName) constraints.push(where("collectionName", "==", collectionName));
      constraints.push(limit(pageSize));

      const q = query(collection(db, "products"), ...constraints);
      const snap = await getDocs(q);
      if (!snap.empty) {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const result = { data: items, count: items.length };
        setCached(cacheKey, result);
        return result;
      }
    } catch (e) {
      console.warn("[firebase/products] Firestore page query notice:", e);
    }
  }

  // API Fallback
  try {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (collectionName) params.append("collection", collectionName);
    params.append("page", page);
    params.append("limit", pageSize);

    const res = await fetch(`/api/products?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        setCached(cacheKey, json);
        return json;
      }
    }
  } catch (err) {
    console.warn("[firebase/products] API page fallback notice:", err);
  }

  return { data: [], count: 0 };
}

// Debounce helper for client search
export function createDebouncedSearch(searchFn, delayMs = 250) {
  let timeoutId = null;
  return function (...args) {
    return new Promise((resolve, reject) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          const res = await searchFn(...args);
          resolve(res);
        } catch (e) {
          reject(e);
        }
      }, delayMs);
    });
  };
}
