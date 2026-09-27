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
 * Helper to safely handle fetch responses, ensuring JSON content and preventing 'Unexpected end of JSON input'
 */
async function safeFetchJson(resp) {
  if (!resp) {
    throw new Error("No response received from server.");
  }
  const contentType = resp.headers.get("content-type") || "";
  const text = await resp.text().catch(() => "");

  if (!text || !text.trim()) {
    if (!resp.ok) {
      throw new Error(`Server returned HTTP ${resp.status} with empty response.`);
    }
    return {};
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    if (!resp.ok) {
      throw new Error(`Server error HTTP ${resp.status}: ${text.substring(0, 100)}`);
    }
    throw new Error(`Invalid JSON response from server (HTTP ${resp.status})`);
  }

  if (!resp.ok) {
    const errorMsg = json.message || json.error || `Request failed with status ${resp.status}`;
    throw new Error(errorMsg);
  }

  return json;
}

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
      const json = await safeFetchJson(resp);
      if (json && json.success && Array.isArray(json.reviews)) {
        reviews = json.reviews;
      }
    } catch (e) {
      console.warn("[firebase/reviews] getReviewsForProduct REST API warning:", e.message);
    }
  }

  // Sort newest first (createdAt DESC)
  reviews.sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
  return reviews;
}

/**
 * Submit or update a product review with strict duplicate prevention and atomic summary update
 */
export async function submitReview({ productId, userId, userName, userEmail, rating, text, reviewText }) {
  if (!productId) {
    throw new Error("productId is required to submit a review.");
  }
  if (!userId || !String(userId).trim()) {
    throw new Error("Please log in to write a review.");
  }

  const numericRating = Number(rating);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5 || !Number.isInteger(numericRating)) {
    throw new Error("Rating must be an integer between 1 and 5.");
  }

  const cleanText = (text || reviewText || "").trim();
  if (!cleanText) {
    throw new Error("Review text cannot be empty.");
  }
  if (cleanText.length > 1000) {
    throw new Error("Review text must not exceed 1000 characters.");
  }

  const strPid = String(productId);
  const cleanUserId = String(userId).trim();
  const reviewId = `rev_${cleanUserId}_${strPid}`;

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
        const nowIso = new Date().toISOString();

        const reviewPayload = {
          id: reviewId,
          reviewId: reviewId,
          productId: strPid,
          userId: cleanUserId,
          userName: userName || "Verified Buyer",
          userEmail: userEmail || "",
          rating: numericRating,
          text: cleanText,
          reviewText: cleanText,
          createdAt: isUpdate && oldData && oldData.createdAt ? oldData.createdAt : nowIso,
          updatedAt: nowIso
        };

        transaction.set(reviewRef, reviewPayload, { merge: true });

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
          message: isUpdate ? "Review updated successfully" : "Review submitted successfully",
          review: reviewPayload,
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
          body: JSON.stringify({ userId: cleanUserId, userName, userEmail, rating: numericRating, text: cleanText, reviewText: cleanText })
        }).catch(() => {});
      }

      return result;
    } catch (err) {
      console.warn("[firebase/reviews] Firestore transaction error, using REST API fallback:", err.message);
    }
  }

  // REST API Fallback
  if (typeof fetch === 'function') {
    const res = await fetch(`/api/products/${strPid}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: cleanUserId, userName, userEmail, rating: numericRating, text: cleanText, reviewText: cleanText })
    });
    const apiResult = await safeFetchJson(res);
    return {
      success: true,
      message: apiResult.message || "Review submitted successfully",
      review: apiResult.review,
      reviewId: (apiResult.review && apiResult.review.reviewId) ? apiResult.review.reviewId : reviewId,
      newRatingAverage: apiResult.ratingAverage !== undefined ? apiResult.ratingAverage : numericRating,
      newCount: apiResult.reviewCount !== undefined ? apiResult.reviewCount : 1,
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

