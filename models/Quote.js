import mongoose from 'mongoose';

const QuoteItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  name: String,
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true },
});

const QuoteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomType: String,
  items: [QuoteItemSchema],
  subtotal: Number,
  discount: Number,
  grandTotal: Number,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  screenshotUrl: String,
  notes: String,
}, { timestamps: true });

export default mongoose.model('Quote', QuoteSchema);
