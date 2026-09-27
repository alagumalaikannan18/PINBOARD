// =========================================================================
// PINBOARD — Firebase Orders Service Module
// Strictly isolated orders (orders/{orderId}), preserving purchase time prices.
// =========================================================================
import { db } from "./config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

export async function getUserOrders(userId) {
  if (!userId) return [];
  if (db) {
    try {
      const q = query(
        collection(db, "orders"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn("[firebase/orders] getUserOrders notice:", err);
    }
  }

  // API Fallback
  try {
    const res = await fetch("/api/orders");
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) return json.data;
    }
  } catch (e) {
    console.warn("[firebase/orders] API getUserOrders notice:", e);
  }

  return [];
}

export async function createOrder(orderPayload) {
  const { userId, items, totalAmount, customerEmail, customerName } = orderPayload;

  if (!items || !items.length) {
    throw new Error("Order items must not be empty.");
  }

  const orderId = orderPayload.orderId || `PB-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  // Immutable historical purchase record
  const record = {
    orderId,
    userId: userId || "guest",
    items: items.map(item => ({
      productId: item.productId || item.id,
      title: item.title,
      subtitle: item.subtitle || "Premium Poster",
      quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
      price: Number(item.price), // Preserves price at purchase time
      size: item.size || "A4",
      image: item.image || "poster/opt/1551192.webp"
    })),
    totalAmount: Number(totalAmount),
    paymentStatus: orderPayload.paymentStatus || "Pending",
    orderStatus: orderPayload.orderStatus || "Pending Confirmation",
    customerEmail: customerEmail || "",
    customerName: customerName || "Valued Customer",
    createdAt: serverTimestamp()
  };

  if (db) {
    try {
      await setDoc(doc(db, "orders", orderId), record);
    } catch (e) {
      console.warn("[firebase/orders] Firestore createOrder notice:", e);
    }
  }

  // Also submit to backend API for email triggers & MongoDB sync
  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record)
    });
    if (res.ok) {
      const json = await res.json();
      return json.data || record;
    }
  } catch (err) {
    console.warn("[firebase/orders] API createOrder notice:", err);
  }

  return record;
}
