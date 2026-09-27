// =========================================================================
// PINBOARD — Firebase Reviews Service Module
// Product-isolated reviews (products/{productId}/reviews/{reviewId}),
// summary rating calculation on product, and duplicate prevention.
// =========================================================================
import { db } from "./config.js";
import {
  collection,
  doc,
  getDocs,
  runTransaction,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/**
 * Fetch reviews for a specific product from database with REST API fallback
 */
export async function getReviewsForProduct(productId, limitCount = 50) {
  const strPid = String(productId);
  let reviews = [];

  if (db) {
    try {
      const reviewsRef = collection(db, "products", strPid, "reviews");
      const q = query(reviewsRef, orderBy("createdAt", "desc"), limit(limitCount));
      const snap = await getDocs(q);
      reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn("[firebase/reviews] getReviewsForProduct Firestore warning:", err);
    }
  }

  // If Firestore didn't return reviews or is unavailable, check REST API endpoint fallback
  if (reviews.length === 0 && typeof fetch === 'function') {
    try {
      const resp = await fetch(`/api/products/${strPid}/reviews`);
      if (resp.ok) {
        const json = await resp.json();
        if (json && json.success && Array.isArray(json.reviews)) {
          reviews = json.reviews;
        }
      }
    } catch (e) {}
  }

  return reviews;
}

/**
 * Submit or update a product review with strict duplicate prevention and atomic summary update
 */
export async function submitReview({ productId, userId, userName, userEmail, rating, text }) {
  if (!productId || !userId) {
    throw new Error("productId and userId are required to submit a review.");
  }

  const numericRating = Number(rating);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    throw new Error("Rating must be a number between 1 and 5.");
  }

  const cleanText = (text || "").trim();
  if (!cleanText) {
    throw new Error("Review text cannot be empty.");
  }
  if (cleanText.length > 1000) {
    throw new Error("Review text must not exceed 1000 characters.");
  }

  const strPid = String(productId);
  const reviewId = `rev_${userId}_${strPid}`;

  // Try Firestore transaction if db is ready
  if (db) {
    try {
      const reviewRef = doc(db, "products", strPid, "reviews", reviewId);
      const productRef = doc(db, "products", strPid);

      const result = await runTransaction(db, async (transaction) => {
        const reviewSnap = await transaction.get(reviewRef);
        const isUpdate = reviewSnap.exists();
        const oldData = isUpdate ? reviewSnap.data() : null;
        const oldRating = isUpdate && oldData ? Number(oldData.rating || 0) : 0;

        const productSnap = await transaction.get(productRef);
        let ratingSum = 0;
        let reviewCount = 0;

        if (productSnap.exists()) {
          const pData = productSnap.data();
          ratingSum = Number(pData.ratingSum || 0);
          reviewCount = Number(pData.reviewCount || 0);
        }

        let newCount = reviewCount;
        let newSum = ratingSum;

        if (isUpdate) {
          newSum = Math.max(0, ratingSum - oldRating + numericRating);
        } else {
          newCount = reviewCount + 1;
          newSum = ratingSum + numericRating;
        }

        const newRatingAverage = newCount > 0 ? Number((newSum / newCount).toFixed(1)) : 0.0;

        transaction.set(reviewRef, {
          id: reviewId,
          reviewId: reviewId,
          productId: strPid,
          userId: userId,
          userName: userName || "Verified Buyer",
          userEmail: userEmail || "",
          rating: numericRating,
          text: cleanText,
          createdAt: isUpdate && oldData && oldData.createdAt ? oldData.createdAt : serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });

        if (productSnap.exists()) {
          transaction.update(productRef, {
            ratingAverage: newRatingAverage,
            rating: newRatingAverage,
            ratingSum: newSum,
            reviewCount: newCount,
            updatedAt: serverTimestamp()
          });
        } else {
          transaction.set(productRef, {
            id: strPid,
            ratingAverage: newRatingAverage,
            rating: newRatingAverage,
            ratingSum: newSum,
            reviewCount: newCount,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        }

        return {
          success: true,
          reviewId,
          newRatingAverage,
          newCount,
          isUpdate
        };
      });

      // Synchronize with API endpoint if accessible
      if (typeof fetch === 'function') {
        fetch(`/api/products/${strPid}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, userName, userEmail, rating: numericRating, text: cleanText })
        }).catch(() => {});
      }

      return result;
    } catch (err) {
      console.warn("[firebase/reviews] Firestore transaction error, using REST API fallback:", err);
    }
  }

  // REST API Fallback
  if (typeof fetch === 'function') {
    const res = await fetch(`/api/products/${strPid}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userName, userEmail, rating: numericRating, text: cleanText })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to submit review to database.");
    }
    const apiResult = await res.json();
    return {
      success: true,
      reviewId,
      newRatingAverage: apiResult.ratingAverage || numericRating,
      newCount: apiResult.reviewCount || 1,
      isUpdate: Boolean(apiResult.isUpdate)
    };
  }

  throw new Error("Database service is currently unreachable.");
}

// Expose globally on window for non-module script compatibility
if (typeof window !== "undefined") {
  window.PinboardReviews = window.PinboardReviews || {};
  window.PinboardReviews.getReviewsForProduct = getReviewsForProduct;
  window.PinboardReviews.submitReview = submitReview;
}
