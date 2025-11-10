import mongoose from 'mongoose';

const designSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomType: String,                  // e.g. "Bedroom"
  items: [
    {
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
      position: { x: Number, y: Number, z: Number },
      rotation: { x: Number, y: Number, z: Number }
    }
  ],
  screenshotUrl: String,             // optional preview image
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Design', designSchema);

