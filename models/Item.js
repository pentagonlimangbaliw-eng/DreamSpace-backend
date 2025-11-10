// models/Item.js
import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    desc: { type: String }, // ✅ match Android's Product.desc
    price: { type: Number, default: 0 },
    previewImage: String,       // optional
    assetBundleUrl: String,     // optional
    category: String,
    liked: { type: Boolean, default: false } // ✅ added
  },
  { timestamps: true }
);

// Explicitly use "products" collection
export default mongoose.model('Item', itemSchema, 'products');
