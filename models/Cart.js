const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1
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

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    items: {
      type: [cartItemSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Method to add item with strict duplicate prevention
cartSchema.methods.addItem = function (item) {
  const pid = parseInt(item.productId, 10);
  const existing = this.items.find(i => i.productId === pid);
  if (existing) {
    return { added: false, alreadyInCart: true, cart: this };
  }
  this.items.push({
    productId: pid,
    title: item.title,
    quantity: parseInt(item.quantity, 10) || 1,
    price: Number(item.price),
    image: item.image || 'New Project 22 [FA6B4A7].png'
  });
  return { added: true, alreadyInCart: false, cart: this };
};

// Method to remove item
cartSchema.methods.removeItem = function (productId) {
  const pid = parseInt(productId, 10);
  this.items = this.items.filter(i => i.productId !== pid);
  return this;
};

// Method to update quantity
cartSchema.methods.updateItemQuantity = function (productId, quantity) {
  const pid = parseInt(productId, 10);
  const qty = parseInt(quantity, 10);
  const item = this.items.find(i => i.productId === pid);
  if (item) {
    if (qty <= 0) {
      this.items = this.items.filter(i => i.productId !== pid);
    } else {
      item.quantity = qty;
    }
  }
  return this;
};

module.exports = mongoose.model('Cart', cartSchema);
