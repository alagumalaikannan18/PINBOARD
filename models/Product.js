const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    subtitle: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    collectionName: {
      type: String,
      index: true
    },
    artist: {
      type: String,
      default: 'Studio Pinboard'
    },
    subject: {
      type: String
    },
    tags: {
      type: [String],
      default: [],
      index: true
    },
    keywords: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: 'A3'
    },
    badge: {
      type: String,
      default: null
    },
    images: {
      type: [String],
      default: ['New Project 22 [FA6B4A7].png']
    },
    regularPrice: {
      type: Number,
      required: true
    },
    salePrice: {
      type: Number,
      default: null
    },
    rating: {
      type: Number,
      default: 4.8
    },
    reviewCount: {
      type: Number,
      default: 500
    },
    pieces: {
      type: Number,
      default: 1
    },
    material: {
      type: String,
      default: '300 GSM Premium Matte Sheet'
    },
    finish: {
      type: String,
      default: 'Smooth Matte Finish'
    },
    frameIncluded: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      default: ''
    },
    features: {
      type: [String],
      default: []
    },
    specifications: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    perfectFor: {
      type: [String],
      default: []
    },
    relatedIds: {
      type: [Number],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound text index for powerful search
productSchema.index({
  title: 'text',
  subtitle: 'text',
  category: 'text',
  collectionName: 'text',
  tags: 'text',
  keywords: 'text',
  artist: 'text',
  subject: 'text',
  description: 'text'
});

module.exports = mongoose.model('Product', productSchema);
