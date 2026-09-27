// =========================================================================
// PINBOARD — Real Product Reviews Service Layer
// Bridges Firebase Firestore + Backend API for product reviews & ratings
// =========================================================================
import { db } from "./firebase-config.js";
import { getReviewsForProduct, submitReview } from "../firebase/reviews.js";

// Ensure window.PinboardReviews is attached globally for PDP scripts
if (typeof window !== "undefined") {
  window.PinboardReviews = window.PinboardReviews || {};
  window.PinboardReviews.getReviewsForProduct = getReviewsForProduct;
  window.PinboardReviews.submitReview = submitReview;
}

export { getReviewsForProduct, submitReview };
