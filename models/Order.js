const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    subtitle: {
      type: String
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    price: {
      type: Number,
      required: true
    },
    image: {
      type: String,
      default: 'New Project 22 [FA6B4A7].png'
    }
  },
  {
    _id: false
  }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    items: {
      type: [orderItemSchema],
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed'],
      default: 'Paid'
    },
    orderStatus: {
      type: String,
      enum: ['Pending', 'Confirmed ⚡', 'In Transit ✈️', 'Delivered 📦', 'Cancelled'],
      default: 'Confirmed ⚡'
    },
    deliveryEstimate: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Order', orderSchema);
