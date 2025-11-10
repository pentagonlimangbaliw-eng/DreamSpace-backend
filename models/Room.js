import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: String,            // e.g. "Modern Kitchen"
  type: String,            // e.g. "Kitchen", "Bedroom"
  assets: [String],        // file paths or image URLs
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Room', roomSchema);
